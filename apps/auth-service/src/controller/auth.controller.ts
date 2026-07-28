import prisma from "../../../../packages/libs/primsa";
import { ValidateRegistrationData, checkOtpRestrictions, trackOtpRequest, sendOtp, verifyOtp, handleForgotPassword, verifyForgotPasswordOtp } from "../utils/auth.helper";
import { Request, NextFunction, Response } from "express";
import { AuthError, ValidationError } from "../../../../packages/error-handler";
import bcrypt from "bcryptjs";
import jwt, { JsonWebTokenError } from "jsonwebtoken";
import { setCookie } from "../utils/cookies/setCookie";




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
        const refreshToken = req.cookies.refresh_token;
        if (!refreshToken) {
            throw new ValidationError("Invalid request data")
        }

        const decoded = jwt.verify(
            refreshToken,
            process.env.REFRESH_TOKEN_SECRET as string
        ) as { id: string; role: string };

        if (!decoded || !decoded.id || !decoded.role) {
            return new JsonWebTokenError("Forbidden! Invalid token")
        }
        const user = await prisma.users.findUnique({
            where: {
                id: decoded.id
            }
        });

        if (!user) {
            return new AuthError("Forbidden! No User found")
        }

        const newAccessToken = jwt.sign(
            { id: decoded.id, role: decoded.role },
            process.env.ACCESS_TOKEN_SECRET as string,
            { expiresIn: "15m" }
        );

        setCookie(res, "accessToken", newAccessToken, {

        })
        return res.status(200).json({ success: true })


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
