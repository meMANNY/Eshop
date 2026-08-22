import jwt from "jsonwebtoken";
import { AuthError } from "../error-handler";

/*
  `jwt.verify` throws `TokenExpiredError` and `JsonWebTokenError`, and neither is
  an `AppError` — so a bare `next(error)` landed in errorMiddleware's unhandled
  branch and every expired session came back as a 500.

  That mattered more than a wrong status code: the axios interceptors in all
  three UIs only start the refresh flow on a 401, so a 500 skipped it entirely.
  Access tokens live 15 minutes, which meant any user who idled past that got
  500s on every request until they signed in again by hand. It stayed invisible
  in development because sessions rarely idle that long between reloads.

  `TokenExpiredError` extends `JsonWebTokenError`, so it has to be tested first.
*/
export const toAuthError = (error: unknown): unknown => {
  if (error instanceof jwt.TokenExpiredError)
    return new AuthError("Access token expired");

  if (error instanceof jwt.JsonWebTokenError)
    return new AuthError("Invalid access token");

  return error;
};
