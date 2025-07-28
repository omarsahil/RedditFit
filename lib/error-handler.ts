export interface AppError extends Error {
  statusCode?: number;
  code?: string;
  isOperational?: boolean;
}

export class CustomError extends Error implements AppError {
  public statusCode: number;
  public code: string;
  public isOperational: boolean;

  constructor(
    message: string,
    statusCode: number = 500,
    code: string = "INTERNAL_ERROR"
  ) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

export class ValidationError extends CustomError {
  constructor(message: string) {
    super(message, 400, "VALIDATION_ERROR");
  }
}

export class AuthenticationError extends CustomError {
  constructor(message: string = "Authentication required") {
    super(message, 401, "AUTHENTICATION_ERROR");
  }
}

export class AuthorizationError extends CustomError {
  constructor(message: string = "Insufficient permissions") {
    super(message, 403, "AUTHORIZATION_ERROR");
  }
}

export class NotFoundError extends CustomError {
  constructor(message: string = "Resource not found") {
    super(message, 404, "NOT_FOUND");
  }
}

export class RateLimitError extends CustomError {
  constructor(message: string = "Rate limit exceeded") {
    super(message, 429, "RATE_LIMIT_EXCEEDED");
  }
}

export function handleError(error: any): {
  message: string;
  statusCode: number;
  code: string;
} {
  console.error("Error occurred:", error);

  // If it's already a custom error, return it
  if (error instanceof CustomError) {
    return {
      message: error.message,
      statusCode: error.statusCode,
      code: error.code,
    };
  }

  // Handle database errors
  if (error.code === "23505") {
    // Unique constraint violation
    return {
      message: "Resource already exists",
      statusCode: 409,
      code: "DUPLICATE_RESOURCE",
    };
  }

  if (error.code === "23503") {
    // Foreign key violation
    return {
      message: "Referenced resource does not exist",
      statusCode: 400,
      code: "INVALID_REFERENCE",
    };
  }

  // Handle network errors
  if (error.code === "ENOTFOUND" || error.code === "ECONNREFUSED") {
    return {
      message: "Service temporarily unavailable",
      statusCode: 503,
      code: "SERVICE_UNAVAILABLE",
    };
  }

  // Handle API errors
  if (error.status) {
    return {
      message: error.message || "External service error",
      statusCode: error.status,
      code: "EXTERNAL_API_ERROR",
    };
  }

  // Default error
  return {
    message:
      process.env.NODE_ENV === "production"
        ? "An unexpected error occurred"
        : error.message || "Internal server error",
    statusCode: 500,
    code: "INTERNAL_ERROR",
  };
}

export function createErrorResponse(error: any, status?: number) {
  const { message, statusCode, code } = handleError(error);

  return {
    error: message,
    code,
    ...(process.env.NODE_ENV === "development" && { stack: error.stack }),
  };
}
