import { ValidationError } from "../../../../packages/error-handler";
import prisma from "../../../../packages/libs/primsa";
import { uploadFile, deleteFile } from "../../../../packages/libs/imagekit";
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

export const uploadProductImage = async(
    req:Request,
    res:Response,
    next:NextFunction
)=>{
    try {
        // `fileName` carries the base64-encoded image sent from the client.
        const {fileName} = req.body;

        if(!fileName){
            return next(
                new ValidationError("Invalid request data", {
                    fileName: "Image data is required"
                })
            )
        }

        const uploaded = await uploadFile({
            file: fileName,
            fileName: `product-${Date.now()}.jpg`,
            folder: "/products",
        });

        return res.status(201).json({
            success: true,
            fileId: uploaded.fileId,
            file_url: uploaded.url,
        });
    } catch (error) {
        next(error)
    }
}

//Delete a product image (ImageKit)
export const deleteProductImage = async(
    req:Request,
    res:Response,
    next:NextFunction
)=>{
    try {
        const {fileId} = req.body;

        if(!fileId){
            return next(
                new ValidationError("Invalid request data", {
                    fileId: "fileId is required"
                })
            )
        }

        await deleteFile(fileId);

        return res.status(200).json({
            success: true,
            message: "Image deleted successfully",
        });
    } catch (error) {
        next(error)
    }
}


//create product
export const createProduct = async(
    req:Request,
    res:Response,
    next:NextFunction
) =>{
    try {
        const {
            title,
            description,
            detailed_description,
            warranty,
            custom_specification,
            slug,
            tags,
            cash_on_delivery,
            brand,
            video_url,
            category,
            colors = [],
            sizes = [],
            discountCodes,
            stock,
            sale_price,
            regular_price,
            subCategory,
            customProperties = {},
            images=[],
        } = req.body;

        if(!title || !slug || !category || !sale_price || !regular_price || !images || !tags || !stock || !subCategory || !description){
            return new ValidationError("Invalid request data",{
                title:"Title is required",
                slug:"Slug is required",
                category:"Category is required",
                sale_price:"Sale price is required",
                regular_price:"Regular price is required",
                images:"Images are required",
                tags:"Tags are required",
                stock:"Stock is required",
                subCategory:"Sub category is required",
                description:"Description is required"
            })

        if(!req.seller.id){
            return next(
                new ValidationError("Invalid request data", {
                    sellerId: "Seller id is required"
                })
            )
        }
        } 
        
    } catch (error) {
        
    }
}


