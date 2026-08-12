import { Response, Request, NextFunction } from "express";
import prisma from "../libs/primsa";
import jwt from "jsonwebtoken";

// Extend Express Request interface to include the user property
declare global {
    namespace Express {
        interface Request {
            user?: any;
            role?: "user" | "seller" | "admin";
        }
    }
}

export const isAuthenticated = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const token = req.cookies?.accessToken || req.headers.authorization?.split(" ")[1];

        if (!token) {
            return res.status(401).json({ message: "Unauthorized! No token found" });
        }

        const decoded = jwt.verify(
            token,
            process.env.ACCESS_TOKEN_SECRET as string
        ) as { id: string; role: "user" | "seller" };

        if (!decoded) {
            return res.status(401).json({ message: "Unauthorized! Invalid token" });
        }

        const account = await prisma.users.findUnique({
            where: {
                id: decoded.id
            }
        });

        if (!account) {
            return res.status(401).json({ message: "User not found!" });
        }

        req.user = account;
        req.role = decoded.role;
        next();
    }
    catch (error) {
        return next(error);
    }
};



