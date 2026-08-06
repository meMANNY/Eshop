import { ValidationError } from "../../../../packages/error-handler";
import prisma from "../../../../packages/libs/primsa";
import { uploadFile, deleteFile } from "../../../../packages/libs/imagekit";
import { Request, Response, NextFunction } from "express";
import { Prisma } from "@prisma/client";

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
            short_description,
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

        if(!title || !slug || !category || !sale_price || !regular_price || !images || !tags || !stock || !subCategory || !short_description){
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
                short_description:"Short description is required"
            })
        }

        if(!req.seller.id){
            return next(
                new ValidationError("Invalid request data", {
                    sellerId: "Seller id is required"
                })
            )
        }

        const slugChecking = await prisma.products.findUnique({
            where:{
                slug
            }
        });
        if(slugChecking){
            return next(
                new ValidationError("Invalid request data", {
                    slug: "Slug already exists"
                })
            )
        }

        const newProduct = await prisma.products.create({
            data:{
                title,
                short_description,
                detailed_description,
                warranty,
                cashOnDelivery: cash_on_delivery,
                slug,
                shopId: req.seller?.shop?.id,
                tags: Array.isArray(tags) ? tags : tags.split(","),
                brand,
                video_url,
                category,
                subCategory,
                colors: colors || [],
                discount_codes: discountCodes.map((codeId: string)=>codeId),
                sizes: sizes || [],
                stock: parseInt(stock),
                sale_price: parseFloat(sale_price),
                regular_price: parseFloat(regular_price),
                custom_properties: customProperties || {},
                custom_specification: custom_specification || {},
                images: {
                    create: images
                        .filter((img: any) => img && img.fileId)
                        .map((img: any) => ({ file_id: img.fileId, url: img.file_url })),
                }
            },
            include: {images: true}
        });

        return res.status(201).json({
            success: true,
            message: "Product created successfully",
            newProduct
        })

    } catch (error) {
        next(error)
    }
}

export const getShopProducts = async (
    req:Request,
    res:Response,
    next:NextFunction
) => {
    try {
        const products = await prisma.products.findMany({
            where:{
                shopId: req?.seller?.shop?.id,

            },
            include:{
                images: true
            }
        });
        res.status(201).json({
            success: true,
            products
        })
    } catch (error) {
        next(error)
    }
}

export const deleteProduct = async(
    req:Request,
    res:Response,
    next:NextFunction
)=>{
    try {
        const {productId} = req.params;
        const shopId = req?.seller?.shop?.id;

        const product = await prisma.products.findUnique({
            where:{
                id:productId,
            },
            select:{id: true,shopId:true,isDeleted:true}
        });

        if(!product){
            return next(
                new ValidationError("Invalid request data", {
                    productId: "Product not found"
                })
            )
        }

        if(product.shopId !== shopId){
            return next(new ValidationError("Invalid request data", {
                shopId: "You are not authorized to delete this product"
            }))
        }

        if(product.isDeleted){
            return next(new ValidationError("Invalid request data", {
                isDeleted: "Product is already deleted"
            }))
        }

        const deletedProduct = await prisma.products.update({
            where:{
                id:productId,
                
            },
            data:{
                isDeleted:true,
                deletedAt: new Date(Date.now()+ 24*60*60*1000)
            }
        })

        return res.status(200).json({
            success: true,
            message: "Product deleted successfully",
            deletedAt: deletedProduct.deletedAt
        })
    } catch (error) {
        next(error)
    }
}

export const restoreProduct = async(
    req:Request,
    res:Response,
    next:NextFunction
) =>{
    try {
        const {productId} = req.params;
        const shopId = req?.seller?.shop?.id;

        const product = await prisma.products.findUnique({
            where:{
                id:productId,
            },
            select:{id: true,shopId:true,isDeleted:true}
        });

        if(!product){
            return next(
                new ValidationError("Invalid request data", {
                    productId: "Product not found"
                })
            )
        }

        if(product.shopId !== shopId){
            return next(new ValidationError("Invalid request data", {
                shopId: "You are not authorized to restore this product"
            }))
        }

        if(!product.isDeleted){
            return res.status(400)
            .json({
                success:false,
                message:"Product is not deleted"
            })
        }

        const restoredProduct = await prisma.products.update({
            where:{
                id:productId,
                
            },
            data:{
                isDeleted:false,
                deletedAt: null
            }
        })

        return res.status(200).json({
            success: true,
            message: "Product restored successfully",
            restoredProduct
        })
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Internal server error",
            error: error
        })
    }
}

//get all products

export const getAllProducts = async(
    req:Request,
    res:Response,
    next:NextFunction
) =>{
    try {
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 20;
        const skip = (page - 1) * limit;
        const type = req.query.type;


        const baseFilter = {
            OR:[
                {
                    starting_date: null,
                },
                {
                    ending_date: null,
                }
            ]

        };

        const orderBy: Prisma.productsOrderByWithRelationInput = type === "latest" ? {createdAt: "desc" as Prisma.SortOrder} : {totalSales: "desc" as Prisma.SortOrder};

        const [products,total,top10Products] = await Promise.all([
            prisma.products.findMany({
                skip,
                take: limit,
                include:{
                    images: true,
                    Shop: true,
                },
                where: baseFilter,
                orderBy:{
                    totalSales: "desc"
                },
            }),
            prisma.products.count({where: baseFilter}),
            prisma.products.findMany({
                take:10,
                where: baseFilter,
                orderBy,
                
            })
        ]);

        res.status(200).json({
            success: true,
            products,
            top10By: type === "latest" ? "latest": "topSales",
            top10Products,
            total,
            currentPage: page,
            totalPages: Math.ceil(total / limit),
            
        });

    }
    catch (error) {
        next(error)
    }
}


