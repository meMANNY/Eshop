import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import prisma from "../../../../packages/libs/primsa";

/*
  Same cookie and secret as `isAuthenticated`, but a missing or bad token is not
  an error here — it just means we do not know who this is.

  The storefront home page is public and calls the recommendations endpoint on
  load. Behind `isAuthenticated` that call 401s for a signed-out visitor, and
  user-ui's axios interceptor turns a 401 into a token refresh and then a
  redirect to /login — so an anonymous shopper would be bounced off the home page
  by a shelf of suggestions. Anonymous callers get the popular fallback instead.
*/
export const optionalAuth = async (
  req: Request,
  _res: Response,
  next: NextFunction
) => {
  try {
    const token =
      req.cookies?.accessToken || req.headers.authorization?.split(" ")[1];
    if (!token) return next();

    const decoded = jwt.verify(
      token,
      process.env.ACCESS_TOKEN_SECRET as string
    ) as { id: string; role: "user" | "seller" };

    if (!decoded?.id) return next();

    const account = await prisma.users.findUnique({ where: { id: decoded.id } });
    if (account) {
      // Assigned through a cast rather than the ambient `Express.Request`
      // augmentation, which is declared over in `isAuthenticated` — this file
      // should not need that module compiled alongside it to typecheck.
      (req as any).user = account;
      (req as any).role = decoded.role;
    }
  } catch {
    // An expired or malformed token is an anonymous visitor, not a failure.
  }
  return next();
};
