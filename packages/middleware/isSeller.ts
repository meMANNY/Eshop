import { Response, Request, NextFunction } from "express";
import prisma from "../libs/primsa";
import jwt from "jsonwebtoken";

// Extend Express Request interface to include the seller property
declare global {
    namespace Express {
        interface Request {
            seller?: any;
        }
    }
}

export const isSeller = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const token = req.cookies?.["seller-access-token"] || req.headers.authorization?.split(" ")[1];

        if (!token) {
            return res.status(401).json({ message: "Unauthorized! No token found" });
        }

        const decoded = jwt.verify(
            token,
            process.env.ACCESS_TOKEN_SECRET as string
        ) as { id: string; role: "user" | "seller" };

        if (!decoded || decoded.role !== "seller") {
            return res.status(401).json({ message: "Unauthorized! Invalid token" });
        }

        const seller = await prisma.sellers.findUnique({
            where: {
                id: decoded.id
            },
            include: {
                shop: true
            }
        });

        if (!seller) {
            return res.status(401).json({ message: "Seller not found!" });
        }

        req.seller = seller;
        req.role = decoded.role;
        next();
    }
    catch (error) {
        return next(error);
    }
};
