import crypto from 'crypto';
import { ValidationError } from '../../../../packages/error-handler';
import { NextFunction } from 'express';
import redis from '../../../../packages/libs/redis';
import { sendEmail } from './sendMail';

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


}

export const sendOtp = async (
    name: string,
    email: string,
    template: string
) => {

    const otp = crypto.randomInt(1000, 9999).toString();
    await sendEmail(email, "Verify your email", template, {name, otp});
    await redis.set(`otp:${email}`, otp, 'EX', 300); // Set OTP with 5 minutes expiration
    await redis.set(`otp_cooldown:${email}`, 'true', 'EX', 60); // Set cooldown with 1 minute expiration


}