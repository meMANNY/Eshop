import { Response, Request, NextFunction } from "express";
import prisma from "../libs/primsa";
import jwt from "jsonwebtoken";
import { toAuthError } from "./jwt-error";

// Extend Express Request interface to include the admin property
declare global {
    namespace Express {
        interface Request {
            admin?: any;
        }
    }
}

export const isAdmin = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        // `loginAdmin` sets the admin session under its own cookie names
        // (`access_token` / `refresh_token`), so an admin session survives
        // alongside a user or seller session in the same browser.
        const token = req.cookies?.["access_token"] || req.headers.authorization?.split(" ")[1];

        if (!token) {
            return res.status(401).json({ message: "Unauthorized! No token found" });
        }

        const decoded = jwt.verify(
            token,
            process.env.ACCESS_TOKEN_SECRET as string
        ) as { id: string; role: "user" | "seller" | "admin" };

        if (!decoded || decoded.role !== "admin") {
            return res.status(401).json({ message: "Unauthorized! Invalid token" });
        }

        // Admins are rows in `users`, not a separate table.
        const account = await prisma.users.findUnique({
            where: {
                id: decoded.id
            },
            // Attached to req.admin in full, so the hash must not come with it.
            omit: { password: true },
            include: {
                avatar: true
            }
        });

        if (!account) {
            return res.status(401).json({ message: "Admin not found!" });
        }

        // The token says "admin", but the stored role is what actually decides:
        // re-checking here means revoking someone's admin rights takes effect on
        // their next request instead of whenever their token happens to expire.
        if (account.role !== "admin") {
            return res.status(403).json({ message: "Forbidden! Admin access required" });
        }

        req.admin = account;
        req.role = decoded.role;
        next();
    }
    catch (error) {
        return next(toAuthError(error));
    }
};
