import crypto from 'crypto';
import { ValidationError } from '../../../../packages/error-handler';
import { NextFunction } from 'express';
import redis from '../../../../packages/libs/redis';
import { sendEmail } from './sendMail';
import { Request, Response } from 'express';
import prisma from '../../../../packages/libs/primsa';


const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const ValidateRegistrationData = (
    data: any, 
    userType: "user" | "seller"
) => {

    const {name, email, password, phone_number,country} = data;

    if( !name || 
        !email ||
        !emailRegex.test(email) ||
        !password || 
        (userType === "seller" && (!phone_number || !country)))
        {
            throw new ValidationError("Invalid request data", {
                name: !name ? "Name is required" : undefined,
                email: !email ? "Email is required" : undefined,
                password: !password ? "Password is required" : undefined,
                phone_number: userType === "seller" && !phone_number ? "Phone number is required for sellers" : undefined,
                country: userType === "seller" && !country ? "Country is required for sellers" : undefined
            });
        }
        
    
    if(!emailRegex.test(email)){
        throw new ValidationError("Invalid request data", {
            email: "Invalid email format"
        });
    }


}

export const checkOtpRestrictions = async (
    email: string, 
    next: NextFunction
) =>{

    if(await redis.get(`otp_lock:${email}`)) {

        return next(
            new ValidationError("Invalid request data", {
            email: "Account locked due to multiple failed attempts. Please try again later."
        }));
    }

    if(await redis.get(`otp_spam_lock:${email}`)) {
        return next(
            new ValidationError("Invalid request data", {
            email: "Too many OTP requests. Please try again after 1 hour."
        }));
    }

    if(await redis.get(`otp_cooldown:${email}`)) {
        return next(
            new ValidationError("Invalid request data", {
            email: "Please wait for 1 minute before requesting a new OTP."
        }));
    }



};

export const sendOtp = async (
    name: string,
    email: string,
    template: string
) => {

    const otp = crypto.randomInt(1000, 9999).toString();
    await sendEmail(email, "Verify your email", template, {name, otp});
    await redis.set(`otp:${email}`, otp, 'EX', 300); // Set OTP with 5 minutes expiration
    await redis.set(`otp_cooldown:${email}`, 'true', 'EX', 60); // Set cooldown with 1 minute expiration


};

export const trackOtpRequest = async (
    email: string, 
    next: NextFunction
) => {

    const otpRequestKey = `otp_request_count:${email}`;
    let otpRequests = parseInt(await redis.get(otpRequestKey) || '0');

    if(otpRequests >= 4) {
        await redis.set(`otp_spam_lock:${email}`, 'locked', 'EX', 3600); // Lock
        return next(
            new ValidationError("Invalid request data", {
            email: "Too many OTP requests. Please try again after 1 hour."
        }));
    }

    await redis.set(otpRequestKey, otpRequests + 1, 'EX', 3600); // Increment count with 1 hour expiration
    
};

export const verifyOtp = async (
    email: string,
    otp: string,
    next: NextFunction
) => {

    const storedOtp = await redis.get(`otp:${email}`);

    if(!storedOtp){
        throw new ValidationError("Invalid request data", {
            otp: "Invalid OTP"
        });
    }

    const failedAttemptsKey = `otp_failed_attempts:${email}`;
    const failedAttempts = parseInt(await redis.get(failedAttemptsKey) || '0');

    if(storedOtp !== otp) {
        if(failedAttempts >= 4) {
                await redis.set(`otp_lock:${email}`, 'locked', 'EX', 3600); // Lock account for 1 hour
                await redis.del(`otp:${email}`,failedAttemptsKey); // Delete the OTP and failed attempts after locking the account
                throw new ValidationError("Invalid request data", {
                    otp: "Account locked due to multiple failed attempts. Please try again later."
                });
        }

                await redis.set(failedAttemptsKey, failedAttempts + 1, 'EX', 3600); // Increment failed attempts with 1 hour expiration
                throw new ValidationError("Invalid request data", {
                    otp: "Invalid OTP"
                });
    }

    await redis.del(`otp:${email}`,failedAttemptsKey); // Delete the OTP and failed attempts after successful verification

};

export const handleForgotPassword = async (
    req: Request,
    res: Response,
    next: NextFunction,
    userType: "user" | "seller"
) => {

    try {
        const {email} = req.body;
        if(!email){
            return next(new ValidationError("Invalid request data",{
                email: "Email is required"
            }));
        }

        //Find user/seller in DB

        const user = userType === "user" &&  await prisma.users.findUnique({where: {email}})

        if(!user){
            throw new ValidationError("Invalid request data",{
                email: "No user found with this email"
            });
        }

        //check otp restrictions

        await checkOtpRestrictions(email,next);
        await trackOtpRequest(email,next);
        await sendOtp(user.name,email,"forgot-password-mail");
        return res.status(200).json({message: "OTP sent successfully"});

    } catch (error) {
        return next(error);
    }

};

//writing it here so that it can used for user and seller both

export const verifyForgotPasswordOtp = async (
    req: Request,
    res: Response,
    next: NextFunction,
) => {

    try{
        const {email, otp} = req.body;
        if(!email || !otp){
            throw new ValidationError("Invalid request data",{
                email: !email ? "Email is required" : undefined,
                otp: !otp ? "OTP is required" : undefined
            });
        }

        await verifyOtp(email, otp, next);
        res
            .status(200)
            .json({message: "OTP verified successfully"});

    }
    catch( error){
        return next(error);
    }

};


    

