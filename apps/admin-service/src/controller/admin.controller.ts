import { NextFunction, Request, Response } from "express";
//import { AuthError, ValidationError } from "../../../../packages/error-handler";
import imagekit from "../../../../packages/libs/imagekit";
import prisma from "../../../../packages/libs/primsa";
import { ValidationError } from "../../../../packages/error-handler";

export const getAllProducts = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const skip = (page - 1) * limit;

    // Two MongoDB/Prisma traps here, both of which returned zero rows:
    //  1. Prisma drops conditions whose value is `undefined`, so the previous
    //     `NOT: { AND: [{ starting_date: { not: undefined } }, ...] }` collapsed
    //     to `NOT: {}` and matched nothing.
    //  2. Products created without a promo window have no `starting_date` key at
    //     all, and Prisma's `field: null` does not match an absent field on
    //     Mongo — that needs `isSet: false`. Both cases mean "not an event".
    const where = {
      isDeleted: { not: true },
      OR: [{ starting_date: null }, { starting_date: { isSet: false } }],
    };

    const [products, totalProducts] = await Promise.all([
      prisma.products.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          title: true,
          slug: true,
          sale_price: true,
          stock: true,
          createdAt: true,
          ratings: true,
          category: true,
          images: {
            select: { url: true },
            take: 1,
          },
          Shop: {
            select: { name: true },
          },
        },
      }),
      prisma.products.count({ where }),
    ]);
    const totalPages = Math.ceil(totalProducts / limit);
    res.status(200).json({
      success: true,
      data: products,
      meta: {
        totalProducts,
        currentPage: page,
        totalPages,
      },
    });
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

    // `NOT: { starting_date: null }` matched nothing: a product with no promo
    // window has no `starting_date` key at all, and on Mongo that is "unset"
    // rather than null, so neither the null test nor its negation hit. An event
    // is a product whose promo window is actually present.
    // Kept as one object so the page query and the count can't drift apart.
    const where = {
      isDeleted: { not: true },
      starting_date: { isSet: true, not: null },
    };

    const [products, totalProducts] = await Promise.all([
      prisma.products.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          title: true,
          slug: true,
          sale_price: true,
          stock: true,
          createdAt: true,
          ratings: true,
          category: true,
          starting_date: true,
          ending_date: true,
          images: {
            select: { url: true },
            take: 1,
          },
          Shop: {
            select: { name: true },
          },
        },
      }),
      prisma.products.count({ where }),
    ]);
    const totalPages = Math.ceil(totalProducts / limit);
    res.status(200).json({
      success: true,
      data: products,
      meta: {
        totalProducts,
        currentPage: page,
        totalPages,
      },
    });
  } catch (err) {
    return next(err);
  }
};

export const getAllAdmins = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const admins = await prisma.users.findMany({
      where: { role: "admin" },
    });

    return res.status(200).json({
      success: true,
      admins,
    });
  } catch (err) {
    return next(err);
  }
};

export const addNewAdmin = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { email } = req.body;

    if (!email) {
      return next(new ValidationError("Invalid request data","Email is required!"));
    }

    const user = await prisma.users.findUnique({ where: { email } });

    if (!user) {
      return next(new ValidationError("Invalid request data", "User not found!"));
    }

    if (user.role === "admin") {
      return next(new ValidationError("Invalid request data", "User is already an admin!"));
    }

    const updatedUser = await prisma.users.update({
      where: { email },
      data: { role: "admin" },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
      },
    });

    return res.status(200).json({
      success: true,
      message: `${user.name} has been promoted to admin successfully.`,
      data: updatedUser,
    });
  } catch (err) {
    return next(err);
  }
};

export const getAllCustomizations = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const config = await prisma.site_config.findFirst();

    return res.status(200).json({
      categories: config?.categories || [],
      subCategories: config?.subCategories || {},
      logo: config?.logo || null,
      banner: config?.banner || null,
    });
  } catch (err) {
    return next(err);
  }
};

export const getAllUsers = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const skip = (page - 1) * limit;

    const [users, totalUsers] = await Promise.all([
      prisma.users.findMany({
        skip,
        take: limit,
        orderBy: {
          createdAt: "desc",
        },
        select: {
          id: true,
          name: true,
          email: true,
          createdAt: true,
          role: true,
          //isBanned: true,
        },
      }),
      prisma.users.count(),
    ]);

    const totalPages = Math.ceil(totalUsers / limit);

    return res.status(200).json({
      success: true,
      data: users,
      meta: {
        totalUsers,
        currentPage: page,
        totalPages,
      },
    });
  } catch (err) {
    return next(err);
  }
};

export const getAllSellers = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const skip = (page - 1) * limit;

    const [sellers, totalSellers] = await Promise.all([
      prisma.sellers.findMany({
        skip,
        take: limit,
        orderBy: {
          createdAt: "desc",
        },
        select: {
          id: true,
          name: true,
          email: true,
          createdAt: true,
          shop: {
            select: { id: true, name: true, avatar: true, address: true },
          },
        },
      }),
      prisma.sellers.count(),
    ]);

    const totalPages = Math.ceil(totalSellers / limit);

    return res.status(200).json({
      success: true,
      data: sellers,
      meta: {
        totalSellers,
        currentPage: page,
        totalPages,
      },
    });
  } catch (err) {
    return next(err);
  }
};

export const getSiteConfig = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const config = await prisma.site_config.findFirst();
    return res.status(200).json({ success: true, data: config });
  } catch (err) {
    return next(err);
  }
};

export const updateCategories = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { categories, subCategories } = req.body;
    const config = await prisma.site_config.findFirst();
    if (!config) return next(new ValidationError("Invalid request data","Site config not found!"));

    const updated = await prisma.site_config.update({
      where: { id: config.id },
      data: { categories, subCategories },
    });

    return res.status(200).json({
      success: true,
      message: "Categories updated successfully!",
      data: updated,
    });
  } catch (err) {
    return next(err);
  }
};

export const uploadLogo = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { fileName } = req.body;
    if (!fileName) return next(new ValidationError("Invalid request data","No file provided!"));

    const uploadResponse = await imagekit.files.upload({
      file: fileName,
      fileName: `logo-${Date.now()}.jpg`,
      folder: "/site-config/logo",
    });

    const config = await prisma.site_config.findFirst();
    const updated = await prisma.site_config.update({
      where: { id: config!.id },
      data: { logo: uploadResponse.url },
    });

    res.status(201).json({
      success: true,
      message: "Logo uploaded successfully!",
      file_url: uploadResponse.url,
      fileId: uploadResponse.fileId,
      data: { logo: updated.logo },
    });
  } catch (err) {
    return next(err);
  }
};

export const uploadBanner = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { fileName } = req.body;
    if (!fileName) return next(new ValidationError("Invalid request data","No file provided!"));

    const uploadResponse = await imagekit.files.upload({
      file: fileName,
      fileName: `banner-${Date.now()}.jpg`,
      folder: "/site-config/banner",
    });

    const config = await prisma.site_config.findFirst();
    const updated = await prisma.site_config.update({
      where: { id: config!.id },
      data: { banner: uploadResponse.url },
    });

    res.status(201).json({
      success: true,
      message: "Banner uploaded successfully!",
      file_url: uploadResponse.url,
      fileId: uploadResponse.fileId,
      data: { banner: updated.banner },
    });
  } catch (err) {
    return next(err);
  }
};


