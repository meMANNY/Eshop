import prisma from "../../../../packages/libs/primsa";
import { ValidateRegistrationData, checkOtpRestrictions, trackOtpRequest, sendOtp, verifyOtp, handleForgotPassword, verifyForgotPasswordOtp } from "../utils/auth.helper";
import { Request, NextFunction, Response } from "express";
import { AuthError, ValidationError } from "../../../../packages/error-handler";
import bcrypt from "bcryptjs";
import jwt, { JsonWebTokenError } from "jsonwebtoken";
import { setCookie } from "../utils/cookies/setCookie";
import Stripe from 'stripe'

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
        const refreshToken =
            req.cookies["refreshToken"] ||
            req.cookies["seller-refresh-token"];

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

        if (decoded.role === "seller") {
            setCookie(res, "seller-access-token", newAccessToken, {
                httpOnly: true,
                secure: true,
                sameSite: "none",
                maxAge: 15 * 60 * 1000,
            }); // 15 minutes
        } else {
            setCookie(res, "accessToken", newAccessToken, {
                httpOnly: true,
                secure: true,
                sameSite: "none",
                maxAge: 15 * 60 * 1000,
            }); // 15 minutes
        }

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
        const accountLink = await stripe.accountLinks.create({
            account: account.id,
            refresh_url: 'http://localhost:3000/settings/payments?refresh=true',
            return_url: 'http://localhost:3000/settings/payments',
            type: 'account_onboarding',
        });

        res.status(201).json({
            url: accountLink.url,
            success: true
        })
    }
    catch (error) {
        next(error);
    }
}

