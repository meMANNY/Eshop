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