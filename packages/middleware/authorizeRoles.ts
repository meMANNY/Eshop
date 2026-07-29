import { Request, Response, NextFunction } from "express";
import { AuthError } from "../error-handler";

// Restrict a route to the given roles. Must run after an auth middleware
// (isAuthenticated / isSeller) that sets req.role.
export const authorizeRoles = (...allowedRoles: string[]) => {
    return (req: Request, res: Response, next: NextFunction) => {
        const role = req.role;

        if (!role || !allowedRoles.includes(role)) {
            return next(new AuthError(`Access denied: ${role ?? "unknown"} is not allowed`));
        }

        next();
    };
};
