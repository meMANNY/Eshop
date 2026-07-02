import prisma from "../../../../packages/libs/primsa";
import { ValidateRegistrationData, checkOtpRestrictions, trackOtpRequest,sendOtp, verifyOtp} from "../utils/auth.helper";
import { Request,NextFunction,Response } from "express";
import { ValidationError } from "../../../../packages/error-handler";
import bcrypt from "bcryptjs";





//Register a new user
export const userRegistration = async(req: Request, res: Response, next: NextFunction) =>{

    try{

        ValidateRegistrationData(req.body, "user");

        const {name,email} = req.body;
        const existingUser = await prisma.users.findUnique(
            {
                where: {
                    email
                }
            }
        )

        if(existingUser){
            return next(new ValidationError("Invalid request data",
                {
                    email: "Email already exists"
                }
            ));
        }

        await checkOtpRestrictions(email,next);
        await trackOtpRequest(email,next);
        await sendOtp(name,email,"user-activation-mail");

        res.status(200).json({
            message: "OTP sent to your email. Please check your inbox."
        });
    }
    
    catch (error) {
        return next(error);
    }
};

//verify user with otp

export const verifyUser = async(req: Request, res: Response, next: NextFunction) =>{

    try{
        const {email, otp,password,name} = req.body;
        if(!email || !otp || !password || !name){
            return next(new ValidationError("Invalid request data",{
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
        if(existingUser){
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

