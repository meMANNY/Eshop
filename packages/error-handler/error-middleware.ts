import { AppError } from "./index";
import { NextFunction, Request, Response } from "express";
import { logAsync } from "../utils/logs/send-logs";

/*
  Every service mounts this, so it is the one place that sees all failures.
  Logging here means a new route gets error reporting for free instead of
  depending on whoever wrote it remembering to add a call.

  Only the method, path, and message are sent. Request bodies carry passwords,
  OTPs, and Stripe identifiers, and these logs are broadcast over an
  unauthenticated WebSocket to any connected dashboard.
*/
export const errorMiddleware = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (err instanceof AppError) {
    console.log(`Error ${req.method} ${req.url} - ${err.message}`);

    /*
      Expected errors are warnings, not errors: a rejected login or a malformed
      id is the API behaving correctly. Logging them at "error" would bury the
      unhandled 500s below that actually need attention.
    */
    logAsync({
      type: "warning",
      message: `${err.statusCode} ${req.method} ${req.url} - ${err.message}`,
    });

    return res.status(err.statusCode).json({
      status: "error",
      message: err.message,
      ...(err.details && { details: err.details }),
    });
  }

  console.log("Unhandled Error:", err);

  logAsync({
    type: "error",
    message: `500 ${req.method} ${req.url} - ${err?.message ?? "Unknown error"}`,
  });

  return res.status(500).json({
    status: "error",
    message: "Internal server error",
  });
};
