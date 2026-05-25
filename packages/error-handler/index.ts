export class AppError extends Error {

    public readonly statusCode: number;
    public readonly isOperational: boolean;
    public readonly details?: any;

    constructor(
        message: string,
        statusCode: number,
        isOperational = true,
        details?: any) {

        super(message);
        this.statusCode = statusCode;
        this.isOperational = isOperational;
        this.details = details;

        if ("captureStackTrace" in Error) {
            (Error as any).captureStackTrace(this, this.constructor);
        }
    }
}


//When an error is not found in our database for any req

export class NotFoundError extends AppError {

    constructor(message = "Resource not found") {
        super(message, 404);
    }
}


// Validation Error(for Zod, react hook form error)

export class ValidationError extends AppError {
    constructor(message: "Invalid request data", details?: any) {
        super(message, 400, true, details);
    }
}

// Authentication Error

export class AuthError extends AppError {

    constructor(message = "Unauthorized access") {
        super(message, 401);
    }
}

//Forbidden Error

export class ForbiddenError extends AppError {

    constructor(message = "Forbidden access") {
        super(message, 403);
    }
}

// Database Error

export class DatabaseError extends AppError {

    constructor(message = "Internal server error", details?: any) {
        super(message, 500, true, details);
    }
}

// Rate Limit Error

export class RateLimitError extends AppError {

    constructor(message = "Too many requests") {
        super(message, 429);
    }
}



