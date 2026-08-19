import { Response, Request, NextFunction } from "express";
import prisma from "../libs/primsa";
import jwt from "jsonwebtoken";

declare global {
    namespace Express {
        interface Request {
            // Whichever of user / seller / admin made the request. Handlers that
            // serve all three read this instead of picking one of `req.user`,
            // `req.seller`, `req.admin` and getting undefined for the other two.
            account?: any;
            // Redeclared (identically) because this file is compiled into services
            // that import only some of the role-specific middlewares, and an
            // augmentation only applies where its file is part of the program.
            user?: any;
            seller?: any;
            admin?: any;
            role?: "user" | "seller" | "admin";
        }
    }
}

/*
  The three logins deliberately use three cookie namespaces so a user, seller,
  and admin session can coexist in one browser:

    user   accessToken          / refreshToken
    seller seller-access-token  / seller-refresh-token
    admin  access_token         / refresh_token

  A route shared by all three roles therefore cannot use `isAuthenticated`,
  which only ever reads `accessToken` — mounting it on a shared route 401s
  every seller and admin request despite a perfectly valid session.

  Nor can it simply try each cookie in turn. Only `loginAdmin` clears another
  role's cookies, so one browser routinely holds both a user and a seller
  session, and a fixed precedence would resolve requests from one app against
  the other app's account. The caller states which session it is acting as and
  we validate that one; this is not a trust decision, because the declared role
  still has to produce a valid token in its own cookie.
*/
const ACCESS_COOKIE = {
    user: "accessToken",
    seller: "seller-access-token",
    admin: "access_token",
} as const;

type SessionRole = keyof typeof ACCESS_COOKIE;

const isSessionRole = (value: unknown): value is SessionRole =>
    typeof value === "string" && value in ACCESS_COOKIE;

export const isAnyAuthenticated = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const declared = (req.body?.role ?? req.query?.role) as unknown;

        // Without a declared role, fall back to whichever cookie is present.
        // Ambiguous by nature, so the specific names go first: an unqualified
        // `accessToken` is the only one a plain user session can produce.
        const candidates: SessionRole[] = isSessionRole(declared)
            ? [declared]
            : ["seller", "admin", "user"];

        const role = candidates.find((r) => req.cookies?.[ACCESS_COOKIE[r]]);
        const token = role
            ? req.cookies[ACCESS_COOKIE[role]]
            : req.headers.authorization?.split(" ")[1];

        if (!token) {
            return res.status(401).json({ message: "Unauthorized! No token found" });
        }

        const decoded = jwt.verify(
            token,
            process.env.ACCESS_TOKEN_SECRET as string
        ) as { id: string; role: SessionRole };

        if (!decoded?.id || !decoded?.role) {
            return res.status(401).json({ message: "Unauthorized! Invalid token" });
        }

        // The cookie a token arrived in has to agree with the role inside it,
        // so a stale token left in the wrong jar cannot stand in for a session.
        if (role && decoded.role !== role) {
            return res.status(401).json({ message: "Unauthorized! Invalid token" });
        }

        // Admins are rows in `users`; only sellers live in their own table.
        const account =
            decoded.role === "seller"
                ? await prisma.sellers.findUnique({ where: { id: decoded.id } })
                : await prisma.users.findUnique({ where: { id: decoded.id } });

        if (!account) {
            return res.status(401).json({ message: "Account not found!" });
        }

        // The token claims a role; the stored row decides. Re-checking here means
        // revoking someone's admin rights takes effect on their next request
        // rather than whenever their token happens to expire.
        if (decoded.role === "admin" && (account as any).role !== "admin") {
            return res.status(403).json({ message: "Forbidden! Admin access required" });
        }

        req.account = account;
        req.role = decoded.role;

        // Populated as well so handlers that read the role-specific property
        // keep working when this middleware replaces theirs.
        if (decoded.role === "seller") req.seller = account;
        else if (decoded.role === "admin") req.admin = account;
        else req.user = account;

        next();
    }
    catch (error) {
        return next(error);
    }
};
