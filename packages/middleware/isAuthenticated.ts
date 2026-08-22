import { Response, Request, NextFunction } from "express";
import prisma from "../libs/primsa";
import jwt from "jsonwebtoken";
import { toAuthError } from "./jwt-error";

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

        // The whole row gets attached to req.user, so any handler doing
        // `res.json(req.user)` would ship the bcrypt hash. `omit` drops it while
        // leaving every other field intact, so nothing downstream changes.
        const account = await prisma.users.findUnique({
            where: {
                id: decoded.id
            },
            omit: { password: true }
        });

        if (!account) {
            return res.status(401).json({ message: "User not found!" });
        }

        req.user = account;
        req.role = decoded.role;
        next();
    }
    catch (error) {
        return next(toAuthError(error));
    }
};



