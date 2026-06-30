import prisma from "../../../../packages/libs/primsa";
import { ValidateRegistrationData, checkOtpRestrictions } from "../utils/auth.helper";
import { Request,NextFunction,Response } from "express";
import { ValidationError } from "../../../../packages/error-handler";




//Register a new user
export const userRegistration = async(req: Request, res: Response, next: NextFunction) =>{

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
    
    
}