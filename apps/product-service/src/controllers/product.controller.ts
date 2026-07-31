import { ValidationError } from "../../../../packages/error-handler";
import prisma from "../../../../packages/libs/primsa";
import { Request, Response, NextFunction } from "express";

export const getCategories = async(
    req: Request,
    res: Response,
    next: NextFunction
) =>{
    try {
        const config = await prisma.site_config.findFirst();
        if(!config){
            return res.status(404).json({
                success:false,
                message: "Site config not found"
            })
        }
        return res.status(200).json({
            success:true,
            categories: config.categories,
            subCategories: config.subCategories,
            
        })

    } catch (error) {
        return next(error)
    }
}

//Create discount codes

export const createDiscountCodes = async(
    req: Request,
    res: Response,
    next: NextFunction
) =>{
    try {
        const {public_name,discountType,discountValue,discountCode} = req.body;
        const isDiscountCodeExists = await prisma.discount_codes.findFirst({
            where:{
                discountCode
            }
        })
        if(isDiscountCodeExists){
            return next(
                new ValidationError("Invalid request data",
                    {
                    discountCode: "Discount code already available"
                    }
                    
                )
            )
        }
        const discount_code = await prisma.discount_codes.create({
            data:{
                public_name,
                discountType,
                discountValue,
                discountCode,
                sellerId: req.seller.id
            }
        })
        return res.status(201).json({
            success:true,
            discount_code
        })
    } catch (error) {
        next(error)
    }
}

//Get Discount Codes
export const getDiscountCodes = async(
    req: Request,
    res: Response,
    next: NextFunction
) =>{
    try {
        const discount_codes = await prisma.discount_codes.findMany({
            where:{
                sellerId: req.seller.id
            }
        })
        return res.status(201).json({
            success:true,
            discount_codes
        })
    } catch (error) {
        return next(error)
    }
}

//Delete Discount Codes

export const deleteDiscountCode = async(
    req: Request,
    res: Response,
    next: NextFunction
) =>{
    try {
        const {id} = req.params;
        const sellerId =  req.seller?.id;
        const discount_code = await prisma.discount_codes.findUnique({
            where:{
                id
            },
            select: {id: true, sellerId: true}
        })

        if(!discount_code ){
            return next(
                new ValidationError("Invalid request data",
                    {
                    id: "Discount code not found"
                    }
                    
                )
            )
        }
        if(discount_code.sellerId !== sellerId){
            return next(
                new ValidationError("Invalid request data",
                    {
                    id: "You cannot delete this discount code. Unauthorized Access"
                    }
                    
                )
            )
        }
        await prisma.discount_codes.delete({
            where:{
                id
            }
        })
        return res.status(200).json({
            success:true,
            message: "Discount code deleted successfully"
        })
    } catch (error) {
        next(error)
    }
}

