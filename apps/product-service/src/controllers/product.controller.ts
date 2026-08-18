import { ValidationError } from "../../../../packages/error-handler";
import prisma from "../../../../packages/libs/primsa";
import { uploadFile, deleteFile } from "../../../../packages/libs/imagekit";
import { Request, Response, NextFunction } from "express";
import { Prisma } from "@prisma/client";
import { logAsync } from "../../../../packages/utils/logs/send-logs";

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

        logAsync({ type: "success", message: `Product created: "${newProduct.title}" (${newProduct.id}) in shop ${newProduct.shopId}` });

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

        logAsync({ type: "warning", message: `Product ${deletedProduct.id} marked for deletion (purges ${deletedProduct.deletedAt?.toISOString()})` });

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

        logAsync({ type: "success", message: `Product ${restoredProduct.id} restored` });

        return res.status(200).json({
            success: true,
            message: "Product restored successfully",
            restoredProduct
        })
    } catch (error) {
        // This handler answers directly instead of calling next(error), so it
        // never reaches errorMiddleware and would otherwise log nothing.
        logAsync({ type: "error", message: `Product restore failed: ${(error as Error)?.message}` });
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


        const baseFilter: Prisma.productsWhereInput = {
            isDeleted: { not: true },
            NOT: {
                AND: [
                    { starting_date: { not: undefined } },
                    { ending_date: { not: undefined } },
                ],
            },
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
                    totalSales: "desc" as Prisma.SortOrder
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

export const getProductDetails = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const product = await prisma.products.findUnique({
      where: { slug: req.params?.slug },
      include: {
        images: true,
        Shop: true,
      },
    });

    res.status(201).json({
      success: true,
      product,
    });
  } catch (err) {
    return next(err);
  }
};

export const getFilteredProducts = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
    try{
        const {
            priceRange = [0, 10000],
            categories = [],
            colors = [],
            sizes = [],
            page = 1,
            limit = 12,
            } = req.query;

            const parsedPriceRange =
            typeof priceRange === "string"
                ? priceRange.split(",").map(Number)
                : [0, 10000];

            const parsedPage = Number(page);
            const parsedLimit = Number(limit);

            const skip = (parsedPage - 1) * parsedLimit;

            const filters: Record<string, any> = {
            sale_price: {
                gte: parsedPriceRange[0],
                lte: parsedPriceRange[1],
            },
            starting_date: { equals: undefined },
            };

            if (categories && (categories as string[]).length > 0)
            filters.category = {
                in: Array.isArray(categories)
                ? categories
                : String(categories).split(","),
            };

            if (colors && (colors as string[]).length > 0)
            filters.colors = {
                hasSome: Array.isArray(colors) ? colors : [colors],
            };

            if (sizes && (sizes as string[]).length > 0)
            filters.sizes = {
                hasSome: Array.isArray(sizes) ? sizes : [sizes],
            };

            const [products, total] = await Promise.all([
            prisma.products.findMany({
                where: filters,
                skip,
                take: parsedLimit,
                include: {
                images: true,
                Shop: true,
                },
            }),
            prisma.products.count({ where: filters }),
            ]);

            const totalPages = Math.ceil(total / parsedLimit);

            return res.status(201).json({
            products,
            pagination: {
                total,
                page: parsedPage,
                totalPages,
            },
            });

    }
    catch(err){
        return next(err);
    }
};

export const getFilteredEvents = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const {
      priceRange = [0, 10000],
      categories = [],
      colors = [],
      sizes = [],
      page = 1,
      limit = 12,
    } = req.query;

    const parsedPriceRange =
      typeof priceRange === "string"
        ? priceRange.split(",").map(Number)
        : [0, 10000];

    const parsedPage = Number(page);
    const parsedLimit = Number(limit);

    const skip = (parsedPage - 1) * parsedLimit;

    const filters: Record<string, any> = {
      sale_price: {
        gte: parsedPriceRange[0],
        lte: parsedPriceRange[1],
      },
      NOT: { starting_date: null },
    };

    if (categories && (categories as string[]).length > 0)
      filters.category = {
        in: Array.isArray(categories)
          ? categories
          : String(categories).split(","),
      };

    if (colors && (colors as string[]).length > 0)
      filters.colors = {
        hasSome: Array.isArray(colors) ? colors : [colors],
      };

    if (sizes && (sizes as string[]).length > 0)
      filters.sizes = {
        hasSome: Array.isArray(sizes) ? sizes : [sizes],
      };

    const [products, total] = await Promise.all([
      prisma.products.findMany({
        where: filters,
        skip,
        take: parsedLimit,
        include: {
          images: true,
          Shop: true,
        },
      }),
      prisma.products.count({ where: filters }),
    ]);

    const totalPages = Math.ceil(total / parsedLimit);

    return res.status(201).json({
      products,
      pagination: {
        total,
        page: parsedPage,
        totalPages,
      },
    });
  } catch (err) {
    return next(err);
  }
};

export const getFilteredShops = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { categories = [], countries = [], page = 1, limit = 12 } = req.query;

    const parsedPage = Number(page);
    const parsedLimit = Number(limit);

    const skip = (parsedPage - 1) * parsedLimit;

    const filters: Record<string, any> = {};

    if (countries && String(countries).length > 0)
      filters.country = {
        in: Array.isArray(countries) ? countries : String(countries).split(","),
      };

    if (categories && (categories as string[]).length > 0)
      filters.category = {
        in: Array.isArray(categories)
          ? categories
          : String(categories).split(","),
      };

    const [shops, total] = await Promise.all([
      prisma.shops.findMany({
        where: filters,
        skip,
        take: parsedLimit,
        include: {
          sellers: true,
          //followers: true,
          products: true,
        },
      }),
      prisma.shops.count({ where: filters }),
    ]);

    const totalPages = Math.ceil(total / parsedLimit);

    return res.status(201).json({
      shops,
      pagination: {
        total,
        page: parsedPage,
        totalPages,
      },
    });
  } catch (err) {
    return next(err);
  }
};

export const searchProducts = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const query = req.query.q as string;

    if (!query || query.trim().length < 2)
      return res.status(400).json({
        message:
          "Search query is required. Please provide at least 2 characters for search.",
      });

    const normalizedQuery = query.toLowerCase();

    const products = await prisma.products.findMany({
      where: {
        OR: [
          {
            title: { contains: normalizedQuery, mode: "insensitive" },
          },
          {
            short_description: {
              contains: normalizedQuery,
              mode: "insensitive",
            },
          },
          {
            detailed_description: {
              contains: normalizedQuery,
              mode: "insensitive",
            },
          },
          {
            tags: {
              hasSome: normalizedQuery.split(" ").map((t) => t.toLowerCase()),
            },
          },
          {
            category: { contains: normalizedQuery, mode: "insensitive" },
          },
          {
            subCategory: { contains: normalizedQuery, mode: "insensitive" },
          },
          {
            brand: { contains: normalizedQuery, mode: "insensitive" },
          },
        ],
      },
      select: {
        id: true,
        title: true,
        slug: false,
      },
      take: 10,
      orderBy: {
        createdAt: "desc",
      },
    });

    let finalResults = products;
    if (finalResults.length === 0 && normalizedQuery.length > 3) {
      finalResults = await prisma.products.findMany({
        where: {
          title: {
            startsWith: normalizedQuery.slice(0, 3),
            mode: "insensitive",
          },
        },
        take: 10,
      });
    }

    return res.status(200).json({
      success: true,
      count: finalResults.length,
      query,
      products: finalResults,
    });
  } catch (err) {
    return next(err);
  }
};

export const getTopShops = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const topShopsData = await prisma.orders.groupBy({
      by: ["shopId"],
      _sum: {
        total: true,
      },
      orderBy: {
        _sum: {
          total: "desc",
        },
      },
      take: 10,
    });

    const shopIds = topShopsData.map((item) => item?.shopId);
    const shops = await prisma.shops.findMany({
      where: {
        id: {
          in: shopIds,
        },
      },
      select: {
        id: true,
        name: true,
        avatar: true,
        coverBanner: true,
        address: true,
        ratings: true,
        //followers: true,
        category: true,
      },
    });

    const encrichedShops = shops.map((shop) => {
      const salesData = topShopsData.find((ss) => ss.shopId === shop.id);
      return {
        ...shop,
        totalSales: salesData?._sum.total ?? 0,
      };
    });

    const top10Shops = encrichedShops
      .sort((a, b) => b.totalSales - a.totalSales)
      .slice(0, 10);

    return res.status(200).json({ shops: top10Shops });
  } catch (err) {
    return next(err);
  }
};

export const getAllEvents = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const skip = (page - 1) * limit;

    const baseFilter: Prisma.productsWhereInput = {
      isDeleted: { not: true },
      NOT: { starting_date: null },
    };
    const [events, total, top10BySales] = await Promise.all([
      prisma.products.findMany({
        skip,
        take: limit,
        include: {
          images: true,
          Shop: true,
        },
        where: baseFilter,
        orderBy: {
          totalSales: "desc",
        },
      }),
      prisma.products.count({ where: baseFilter }),
      prisma.products.findMany({
        where: baseFilter,
        take: 10,
        orderBy: {
          totalSales: "desc",
        },
      }),
    ]);

    res.status(200).json({
      events,
      top10BySales,
      total,
      currentPage: page,
      totalPages: Math.ceil(total / limit),
    });
  } catch (err) {
    next(err);
  }
};


