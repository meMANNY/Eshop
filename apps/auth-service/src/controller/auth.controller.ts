import prisma from "../../../../packages/libs/primsa";
import { ValidateRegistrationData, checkOtpRestrictions, trackOtpRequest, sendOtp, verifyOtp, handleForgotPassword, verifyForgotPasswordOtp } from "../utils/auth.helper";
import { Request, NextFunction, Response } from "express";
import { AuthError, NotFoundError, ValidationError } from "../../../../packages/error-handler";
import bcrypt from "bcryptjs";
import jwt, { JsonWebTokenError } from "jsonwebtoken";
import { setCookie } from "../utils/cookies/setCookie";
import { clearCookie } from "../utils/cookies/clearCookie";
import Stripe from 'stripe'
import { logAsync } from "../../../../packages/utils/logs/send-logs";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: "2026-06-24.dahlia"
});





//Register a new user
export const userRegistration = async (
    req: Request,
    res: Response,
    next: NextFunction) => {

    try {

        ValidateRegistrationData(req.body, "user");

        const { name, email } = req.body;
        const existingUser = await prisma.users.findUnique(
            {
                where: {
                    email
                }
            }
        )

        if (existingUser) {
            return next(new ValidationError("Invalid request data",
                {
                    email: "Email already exists"
                }
            ));
        }

        await checkOtpRestrictions(email);
        await trackOtpRequest(email);
        await sendOtp(name, email, "user-activation-mail");

        res.status(200).json({
            message: "OTP sent to your email. Please check your inbox."
        });
    }

    catch (error) {
        return next(error);
    }
};

//verify user with otp

export const verifyUser = async (
    req: Request,
    res: Response,
    next: NextFunction) => {

    try {
        const { email, otp, password, name } = req.body;
        if (!email || !otp || !password || !name) {
            return next(new ValidationError("Invalid request data", {
                email: !email ? "Email is required" : undefined,
                otp: !otp ? "OTP is required" : undefined,
                password: !password ? "Password is required" : undefined,
                name: !name ? "Name is required" : undefined
            }));
        }

        const existingUser = await prisma.users.findUnique(
            {
                where: {
                    email
                }
            }
        )
        if (existingUser) {
            return next(new ValidationError("Invalid request data",
                {
                    email: "Email already exists"
                }
            ));
        }

        await verifyOtp(email, otp, next);
        const hashedPassword = await bcrypt.hash(password, 10);
        await prisma.users.create({
            data: {
                name,
                email,
                password: hashedPassword
            }
        });

        logAsync({ type: "success", message: `New user account created: ${email}` });

        res.status(201).json({
            success: true,
            message: "User registered successfully",
        });

    }
    catch (error) {
        return next(error);
    }
};

//login user

export const loginUser = async (
    req: Request,
    res: Response,
    next: NextFunction) => {

    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return next(new ValidationError("Invalid request data", {
                email: !email ? "Email is required" : undefined,
                password: !password ? "Password is required" : undefined
            }));
        }

        const user = await prisma.users.findUnique({
            where: {
                email
            }
        });

        if (!user) {
            return next(new AuthError("Invalid email or password"));
        }

        //verify password

        const isMatch = await bcrypt.compare(password, user.password!);

        if (!isMatch) {
            // Logged separately from the "no such user" branch above: a burst of
            // these against one existing account is a password-guessing attempt,
            // which the generic response deliberately hides from the client.
            logAsync({ type: "warning", message: `Failed login (bad password) for user ${email}` });
            return next(new AuthError("Invalid email or password"));
        }

        //Generate JWT token

        const accessToken = jwt.sign({ id: user.id, role: "user" },
            process.env.ACCESS_TOKEN_SECRET as string, { expiresIn: '15m' }); // Replace with actual JWT generation logic

        const refreshToken = jwt.sign({ id: user.id, role: "user" },
            process.env.REFRESH_TOKEN_SECRET as string, { expiresIn: '7d' }); // Replace with actual JWT generation logic

        //store the refresh token and access token in an httpOnly cookie

        setCookie(res, "accessToken", accessToken, { httpOnly: true, secure: true, sameSite: 'none', maxAge: 15 * 60 * 1000 }); // 15 minutes
        setCookie(res, "refreshToken", refreshToken, { httpOnly: true, secure: true, sameSite: 'none', maxAge: 7 * 24 * 60 * 60 * 1000 }); // 7 days


        logAsync({ type: "success", message: `User logged in: ${user.email}` });

        res.status(200).json({
            message: "User logged in successfully",
            user: {
                id: user.id,
                name: user.name,
                email: user.email
            }
        });

    } catch (error) {
        return next(error);
    }

};

export const refreshToken = async (

    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        // `refresh_token` is the admin session. Leaving it out meant every admin
        // 401 fell through to "Refresh token is required", and the UI's response
        // interceptor treats a failed refresh as a logout — so a single 401 on any
        // admin page bounced the admin back to the login screen.
        const refreshToken =
            req.cookies["refreshToken"] ||
            req.cookies["seller-refresh-token"] ||
            req.cookies["refresh_token"];

        if (!refreshToken) {
            return next(new ValidationError("Invalid request data", {
                refreshToken: "Refresh token is required"
            }));
        }

        const decoded = jwt.verify(
            refreshToken,
            process.env.REFRESH_TOKEN_SECRET as string
        ) as { id: string; role: string };

        if (!decoded || !decoded.id || !decoded.role) {
            return next(new JsonWebTokenError("Forbidden! Invalid refresh token"));
        }

        const account =
            decoded.role === "seller"
                ? await prisma.sellers.findUnique({ where: { id: decoded.id } })
                : await prisma.users.findUnique({ where: { id: decoded.id } });

        if (!account) {
            return next(new AuthError("Forbidden! User/Seller not found"));
        }

        const newAccessToken = jwt.sign(
            { id: decoded.id, role: decoded.role },
            process.env.ACCESS_TOKEN_SECRET as string,
            { expiresIn: "15m" }
        );

        // The refreshed token has to go back into the same cookie namespace the
        // session came from, or the next request looks unauthenticated again.
        const accessCookieName =
            decoded.role === "seller"
                ? "seller-access-token"
                : decoded.role === "admin"
                    ? "access_token"
                    : "accessToken";

        setCookie(res, accessCookieName, newAccessToken, {
            httpOnly: true,
            secure: true,
            sameSite: "none",
            maxAge: 15 * 60 * 1000,
        }); // 15 minutes

        return res.status(200).json({ success: true });
    }
    catch (error) {
        return next(error);
    }
}

export const getUser = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {

    try {
        const user = req.user;
        logAsync({
            type: "success",
            message: `User ${user?.email} fetched successfully`,
        });
        res.status(201).json({
            success: true,
            user,
        });
    } catch (error) {
        next(error);
    }



};

//user forgot password

export const userForgotPassword = async (
    req: Request,
    res: Response,
    next: NextFunction) => {

    await handleForgotPassword(req, res, next, "user");
};
//verify the forgot password otp 

export const verifyUserForgotPassword = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {

    await verifyForgotPasswordOtp(req, res, next);

};

//reset the password
export const resetUserPassword = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {

    try {
        const { email, newPassword } = req.body;

        if (!email || !newPassword)
            return next(new ValidationError("Invalid request data",
                {
                    email: !email ? "Email is required" : undefined,
                    newPassword: !newPassword ? "Password is required" : undefined
                }));

        const user = await prisma.users.findUnique({
            where: { email }
        });

        if (!user) {
            return next(new ValidationError("Invalid request data", {
                email: "No user found with this email"
            }));
        }

        //compare new password with old password

        const isSamePassword = await bcrypt.compare(newPassword, user.password!);

        if (isSamePassword) {
            return next(new ValidationError("Invalid request data", {
                newPassword: "New password cannot be same as old password"
            }));
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);

        await prisma.users.update({
            where: { email },
            data: { password: hashedPassword }
        });

        logAsync({ type: "warning", message: `Password reset completed for ${email}` });

        res.status(200).json({
            message: "Password reset successfully"
        });
    } catch (error) {
        next(error);
    }
}

//register a new seller
export const registerSeller = async (

    req: Request,
    res: Response,
    next: NextFunction
) => {

    try {
        ValidateRegistrationData(req.body, "seller")
        const { name, email } = req.body;
        const existingSeller = await prisma.sellers.findUnique({
            where: { email }
        });
        if (existingSeller) {
            return next(new ValidationError("Invalid request data", {
                email: "Email already exists"
            }));
        }

        await checkOtpRestrictions(email)
        await trackOtpRequest(email)
        await sendOtp(name, email, "seller-activation")

        res.status(200).json({
            message: "OTP sent successfully to mail. Please verify your account"
        });

    } catch (error) {
        next(error)
    }



}

//verify seller with otp
export const verifySeller = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const { email, otp, password, name, phone_number, country } = req.body;
        if (!email || !otp || !password || !name || !phone_number || !country)
            return next(new ValidationError("Invalid request data", {
                email: !email ? "Email is required" : undefined,
                otp: !otp ? "OTP is required" : undefined,
                password: !password ? "Password is required" : undefined,
                name: !name ? "Name is required" : undefined,
                phone_number: !phone_number ? "Phone number is required" : undefined,
                country: !country ? "Country is required" : undefined
            }));

        const existingSeller = await prisma.sellers.findUnique({
            where: { email }
        });
        if (existingSeller) {
            return next(new ValidationError("Invalid request data", {
                email: "Seller already exists"
            }));
        }
        await verifyOtp(email, otp, next);
        const hashedPassword = await bcrypt.hash(password, 10);
        const seller = await prisma.sellers.create({
            data: {
                email,
                phone_number,
                country,
                password: hashedPassword,
                name
            },
        });


        logAsync({ type: "success", message: `New seller account created: ${email}` });

        res.status(200).json({
            seller,
            message: "Seller registered successfully"
        });
    }
    catch (error) {
        next(error);
    }
}

//login seller
export const loginSeller = async (
    req: Request,
    res: Response,
    next: NextFunction) => {

    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return next(new ValidationError("Invalid request data", {
                email: !email ? "Email is required" : undefined,
                password: !password ? "Password is required" : undefined
            }));
        }

        const seller = await prisma.sellers.findUnique({
            where: {
                email
            }
        });

        if (!seller) {
            return next(new ValidationError("Invalid request data", {
                email: "Invalid email or password"
            }));
        }

        //verify password

        const isMatch = await bcrypt.compare(password, seller.password!);

        if (!isMatch) {
            logAsync({ type: "warning", message: `Failed login (bad password) for seller ${email}` });
            return next(new ValidationError("Invalid request data", {
                email: "Invalid email or password"
            }));
        }

        //Generate JWT token

        const accessToken = jwt.sign({ id: seller.id, role: "seller" },
            process.env.ACCESS_TOKEN_SECRET as string, { expiresIn: '15m' });

        const refreshToken = jwt.sign({ id: seller.id, role: "seller" },
            process.env.REFRESH_TOKEN_SECRET as string, { expiresIn: '7d' });

        //store the refresh token and access token in an httpOnly cookie

        setCookie(res, "seller-access-token", accessToken, { httpOnly: true, secure: true, sameSite: 'none', maxAge: 15 * 60 * 1000 }); // 15 minutes
        setCookie(res, "seller-refresh-token", refreshToken, { httpOnly: true, secure: true, sameSite: 'none', maxAge: 7 * 24 * 60 * 60 * 1000 }); // 7 days


        logAsync({ type: "success", message: `Seller logged in: ${seller.email}` });

        res.status(200).json({
            message: "Seller logged in successfully",
            seller: {
                id: seller.id,
                name: seller.name,
                email: seller.email
            }
        });

    } catch (error) {
        return next(error);
    }

};

//get logged in seller
export const getSeller = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {

    try {
        const seller = req.seller;
        res.status(201).json({
            success: true,
            seller,
        });
    } catch (error) {
        next(error);
    }



};

export const createShop = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const { name, bio, address, opening_hours, website, category, sellerId } = req.body;
        if (!name || !bio || !address || !opening_hours || !website || !category || !sellerId)
            return next(new ValidationError("Invalid request data", {
                name: !name ? "Name is required" : undefined,
                bio: !bio ? "Bio is required" : undefined,
                address: !address ? "Address is required" : undefined,
                opening_hours: !opening_hours ? "Opening hours is required" : undefined,
                website: !website ? "Website is required" : undefined,
                category: !category ? "Category is required" : undefined,
                sellerId: !sellerId ? "Seller ID is required" : undefined
            }));

        const seller = await prisma.sellers.findUnique({
            where: { id: sellerId }
        });

        if (!seller)
            return next(new ValidationError("Invalid request data", {
                sellerId: "Seller not found"
            }));

        const shopData: any = {
            name,
            bio,
            address,
            opening_hours,
            website,
            category,
            sellerId,
            country: seller.country
        }

        if (website && website.trim() !== "") {
            shopData.website = website;
        }

        const shop = await prisma.shops.create({
            data: shopData
        })

        logAsync({ type: "success", message: `Shop created: "${shop.name}" for seller ${seller.email}` });

        res.status(201).json({
            shop,
            success: true
        })

    }
    catch (error) {
        next(error);
    }
}

//create stripe connect account link

export const createStripeAccountLink = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const { sellerId } = req.body;
        if (!sellerId)
            return next(new ValidationError("Invalid request data", {
                sellerId: "Seller ID is required"
            }));

        const seller = await prisma.sellers.findUnique({
            where: { id: sellerId }
        });

        if (!seller)
            return next(new ValidationError("Invalid request data", {
                sellerId: "Seller not found"
            }));


        const account = await stripe.accounts.create({
            type: 'express',
            email: seller.email,
            country: "GB",
            capabilities: {
                card_payments: { requested: true },
                transfers: { requested: true },
            },
            metadata: {
                sellerId: sellerId
            }
        });
        await prisma.sellers.update({
            where: { id: sellerId },
            data: {
                stripeId: account.id
            }
        })
        /*
          Stripe sends the seller back here once onboarding finishes, so these
          have to be real, reachable URLs in production. They were hardcoded to
          `http://localhost:3000/settings/payments`, which was wrong three ways:
          the host is not reachable from a deployed Stripe, port 3000 is user-ui
          when this is a seller flow, and `/settings/payments` is not a route in
          any of the three apps. Every returning seller got a 404.

          The Stripe panel lives on the seller-ui settings page, under its
          "Withdraw" tab. That tab is client-side state rather than a route, so
          this lands on the page itself.
        */
        const sellerUiUrl = process.env.SELLER_UI_URL || 'http://localhost:3001';
        const accountLink = await stripe.accountLinks.create({
            account: account.id,
            refresh_url: `${sellerUiUrl}/dashboard/settings?refresh=true`,
            return_url: `${sellerUiUrl}/dashboard/settings`,
            type: 'account_onboarding',
        });

        logAsync({ type: "success", message: `Stripe Connect account ${account.id} created for seller ${seller.email}` });

        res.status(201).json({
            url: accountLink.url,
            success: true
        })
    }
    catch (error) {
        next(error);
    }
}

export const addUserAddress = async (
  req: any,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user?.id;
    const { label, name, street, city, zip, country, isDefault } = req.body;
    if (!label || !name || !street || !city || !zip || !country)
      return next(new ValidationError("Invalid request data", {
        label: !label ? "Label is required" : undefined,
        name: !name ? "Name is required" : undefined,
        street: !street ? "Street is required" : undefined,
        city: !city ? "City is required" : undefined,
        zip: !zip ? "ZIP code is required" : undefined,
        country: !country ? "Country is required" : undefined,
      }));

    if (isDefault)
      await prisma.address.updateMany({
        where: {
          userId,
          isDefault: true,
        },
        data: {
          isDefault: false,
        },
      });

    const newAddress = await prisma.address.create({
      data: {
        userId,
        label,
        name,
        street,
        city,
        zip,
        country,
        isDefault,
      },
    });

    res.status(201).json({
      success: true,
      address: newAddress,
    });
  } catch (err) {
    return next(err);
  }
};

export const deleteUserAddress = async (
  req: any,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user?.id;
    const { addressId } = req.params;

    if (!addressId) return next(new ValidationError("Invalid request data", {
      addressId: "Address ID is required",
    }));

    const existingAddress = await prisma.address.findFirst({
      where: {
        id: addressId,
        userId,
      },
    });

    if (!existingAddress)
      return next(new NotFoundError("Address not found or unauthorized!"));

    await prisma.address.delete({
      where: {
        id: addressId,
      },
    });

    res.status(200).json({
      success: true,
      message: "Address deleted successfully",
    });
  } catch (err) {
    next(err);
  }
};

export const getUserAddresses = async (
  req: any,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user?.id;
    const addresses = await prisma.address.findMany({
      where: { userId },
      orderBy: {
        createdAt: "desc",
      },
    });

    res.status(200).json({
      success: true,
      addresses,
    });
  } catch (err) {
    return next(err);
  }
};


// The seller homepage lets a seller edit both their own contact details and
// their shop's public profile from one form, so this writes to both tables in a
// single transaction and returns the reshaped seller the page already renders.
export const updateSellerProfile = async (
  req: any,
  res: Response,
  next: NextFunction
) => {
  try {
    const sellerId = req.seller?.id;
    const shopId = req.seller?.shop?.id;

    if (!sellerId) {
      return next(new AuthError("Unauthorized! No seller in token context"));
    }

    const { seller = {}, shop = {} } = req.body ?? {};

    if (typeof seller.name === "string" && !seller.name.trim()) {
      return next(
        new ValidationError("Invalid request data", { name: "Name is required" })
      );
    }

    if (typeof shop.name === "string" && !shop.name.trim()) {
      return next(
        new ValidationError("Invalid request data", {
          shopName: "Shop name is required",
        })
      );
    }

    // Whitelisting the writable columns keeps a client from setting `stripeId`,
    // `ratings`, or any other field it has no business touching.
    const sellerData = pick(seller, [
      "name",
      "phone_number",
      "country",
      "address",
    ]);

    const shopData = pick(shop, [
      "name",
      "bio",
      "category",
      "address",
      "opening_hours",
      "closing_hours",
      "website",
      "phone_number",
      "coverBanner",
    ]);

    await prisma.$transaction(async (tx) => {
      if (Object.keys(sellerData).length > 0) {
        await tx.sellers.update({ where: { id: sellerId }, data: sellerData });
      }
      if (shopId && Object.keys(shopData).length > 0) {
        await tx.shops.update({ where: { id: shopId }, data: shopData });
      }
    });

    const updated = await prisma.sellers.findUnique({
      where: { id: sellerId },
      include: { shop: { include: { avatar: true } } },
    });

    return res.status(200).json({ success: true, seller: updated });
  } catch (err) {
    return next(err);
  }
};

function pick(source: Record<string, any>, keys: string[]) {
  const out: Record<string, any> = {};
  for (const key of keys) {
    // `undefined` means "not sent"; an empty string is a deliberate clear.
    if (source?.[key] !== undefined) out[key] = source[key];
  }
  return out;
}

// Reviews belong to the shop, so a seller may only read their own.
export const getShopReviews = async (
  req: any,
  res: Response,
  next: NextFunction
) => {
  try {
    const shopId = req.seller?.shop?.id;

    if (!shopId) {
      return res
        .status(200)
        .json({ success: true, reviews: [], ratings: 0, totalRating: 0 });
    }

    const [reviews, shop] = await Promise.all([
      prisma.shopReviews.findMany({
        where: { shopId },
        include: {
          user: { select: { id: true, name: true, avatar: true } },
        },
        orderBy: { createdAt: "desc" },
      }),
      prisma.shops.findUnique({
        where: { id: shopId },
        select: { ratings: true, totalRating: true },
      }),
    ]);

    return res.status(200).json({
      success: true,
      reviews,
      ratings: shop?.ratings ?? 0,
      totalRating: shop?.totalRating ?? 0,
    });
  } catch (err) {
    return next(err);
  }
};

export const updateUserPassword = async (
  req: any,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = (req as any)?.user?.id;
    const { currentPassword, newPassword, confirmPassword } = req.body;
    if (!currentPassword || !newPassword || !confirmPassword)
      return next(new ValidationError("Invalid request data","All fields are required!"));

    if (newPassword !== confirmPassword)
      return next(new ValidationError("Invalid request data","New passwords don't match!"));

    if (currentPassword === newPassword)
      return next(
        new ValidationError(
          "Invalid request data",
          "New passwords cannot be the same as the current password!"
        )
      );

    const user = await prisma.users.findUnique({
      where: { id: userId },
    });

    if (!user || !user.password)
      return next(new AuthError("User not found or password not set!"));

    const isPasswordCorrect = await bcrypt.compare(
      currentPassword,
      user.password
    );

    if (!isPasswordCorrect)
      return next(new AuthError("Current password is incorrect!"));

    const hashedPassword = await bcrypt.hash(newPassword, 12);
    await prisma.users.update({
      where: { id: userId },
      data: { password: hashedPassword },
    });

    logAsync({ type: "warning", message: `Password changed for user ${user.email}` });

    res.status(200).json({
      message: "password updated successfully!",
    });
  } catch (err) {
    return next(err);
  }
};

export const loginAdmin = async (
  req: any,
  res: Response,
  next: NextFunction
) => {
  try {
    const { email, password } = req.body;

    if (!email || !password)
      return next(new ValidationError("Invalid request data", "Email and Password are required!"));

    const user = await prisma.users.findUnique({
      where: { email },
    });

    if (!user) {
      logAsync({ type: "warning", message: `Failed admin login (no such account): ${email}` });
      return next(new AuthError("User doesn't exist!"));
    }

    // if (user.isBanned) {
    //   return res.status(403).json({
    //     message: "Your account has been banned!",
    //     bannedAt: user.bannedAt,
    //     reason: user.banReason,
    //   });
    // }
    const isMatch = await bcrypt.compare(password, user.password!);
    if (!isMatch) {
      logAsync({ type: "error", message: `Failed admin login (bad password): ${email}` });
      return next(new AuthError("Invalid email or password"));
    }

    //const isAdmin = user.role === "admin";
    // if (!isAdmin) {
    //   sendLog({
    //     type: "error",
    //     message: `Admin login failed for ${email} - not an admin`,
    //     source: "auth-service",
    //   });
    //   return next(new AuthError("Invalid Access!"));
    // }

    logAsync({ type: "success", message: `Admin login successful for: ${email}` });

    res.clearCookie("seller-access-token");
    res.clearCookie("seller-refresh-token");

    const accessToken = jwt.sign(
      { id: user.id, role: "admin" },
      process.env.ACCESS_TOKEN_SECRET as string,
      {
        expiresIn: "15m",
      }
    );
    const refreshToken = jwt.sign(
      { id: user.id, role: "admin" },
      process.env.REFRESH_TOKEN_SECRET as string,
      {
        expiresIn: "7d",
      }
    );

    setCookie(res, "refresh_token", refreshToken);
    setCookie(res, "access_token", accessToken);

    res.status(200).json({
      message: "Login Successful!",
      user: { id: user.id, email: user.email, name: user.name },
    });
  } catch (err) {
    return next(err);
  }
};

export const getAdmin = async (req: any, res: Response, next: NextFunction) => {
  try {
    const admin = req.admin;

    logAsync({ type: "info", message: `Admin data retrieved: ${admin?.email}` });

    res.status(201).json({
      success: true,
      admin,
    });
  } catch (err) {
    return next(err);
  }
};

/*
  Ends a session. Session tokens live in httpOnly cookies, so the browser cannot
  clear them itself — a client-side "logout" that just drops cached state leaves
  the access cookie valid for 15 minutes and the refresh cookie for 7 days, and
  reopening the site signs you straight back in.

  Deliberately unauthenticated: an expired or malformed token is exactly when
  someone needs to log out, and requiring a valid session to end a session would
  strand them.
*/
const SESSION_COOKIES = {
  user: ["accessToken", "refreshToken"],
  seller: ["seller-access-token", "seller-refresh-token"],
  admin: ["access_token", "refresh_token"],
} as const;

export const logoutAccount = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const role = (req.body?.role ?? "user") as keyof typeof SESSION_COOKIES;

    const names = SESSION_COOKIES[role];
    if (!names)
      return next(
        new ValidationError("Invalid request data", "Unknown account role")
      );

    /*
      Only this role's pair. On localhost every app shares one cookie jar because
      cookies ignore the port, so clearing all three would sign you out of the
      seller dashboard because you logged out of the storefront.
    */
    for (const name of names) clearCookie(res, name);

    logAsync({ type: "info", message: `Logged out (${role})` });

    return res.status(200).json({ success: true });
  } catch (err) {
    return next(err);
  }
};
