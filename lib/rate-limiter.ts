interface RateLimitConfig {
  windowMs: number; // Time window in milliseconds
  maxRequests: number; // Maximum requests per window
  keyGenerator?: (identifier: string) => string;
}

interface RateLimitStore {
  [key: string]: {
    count: number;
    resetTime: number;
  };
}

class RateLimiter {
  private store: RateLimitStore = {};
  private config: RateLimitConfig;

  constructor(config: RateLimitConfig) {
    this.config = config;
    this.cleanup();
  }

  private cleanup() {
    const now = Date.now();
    Object.keys(this.store).forEach((key) => {
      if (this.store[key].resetTime < now) {
        delete this.store[key];
      }
    });
  }

  private getKey(identifier: string): string {
    return this.config.keyGenerator
      ? this.config.keyGenerator(identifier)
      : `rate_limit:${identifier}`;
  }

  isAllowed(identifier: string): {
    allowed: boolean;
    remaining: number;
    resetTime: number;
  } {
    this.cleanup();

    const key = this.getKey(identifier);
    const now = Date.now();

    if (!this.store[key] || this.store[key].resetTime < now) {
      // Reset or create new entry
      this.store[key] = {
        count: 1,
        resetTime: now + this.config.windowMs,
      };
      return {
        allowed: true,
        remaining: this.config.maxRequests - 1,
        resetTime: this.store[key].resetTime,
      };
    }

    if (this.store[key].count >= this.config.maxRequests) {
      return {
        allowed: false,
        remaining: 0,
        resetTime: this.store[key].resetTime,
      };
    }

    this.store[key].count++;
    return {
      allowed: true,
      remaining: this.config.maxRequests - this.store[key].count,
      resetTime: this.store[key].resetTime,
    };
  }

  reset(identifier: string): void {
    const key = this.getKey(identifier);
    delete this.store[key];
  }
}

// Create rate limiters for different endpoints
export const rateLimiters = {
  // General API rate limiting
  api: new RateLimiter({
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 100,
  }),

  // Rewrite endpoint (more restrictive)
  rewrite: new RateLimiter({
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 10,
  }),

  // Authentication endpoints
  auth: new RateLimiter({
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 5,
  }),

  // Free user rate limiting
  freeUser: new RateLimiter({
    windowMs: 24 * 60 * 60 * 1000, // 24 hours
    maxRequests: 1,
  }),
};

export function createRateLimitMiddleware(limiter: RateLimiter) {
  return (identifier: string) => {
    const result = limiter.isAllowed(identifier);

    if (!result.allowed) {
      const error = new Error("Rate limit exceeded");
      (error as any).statusCode = 429;
      (error as any).code = "RATE_LIMIT_EXCEEDED";
      (error as any).resetTime = result.resetTime;
      throw error;
    }

    return result;
  };
}

// Helper function to get rate limit headers
export function getRateLimitHeaders(result: {
  remaining: number;
  resetTime: number;
}) {
  return {
    "X-RateLimit-Remaining": result.remaining.toString(),
    "X-RateLimit-Reset": new Date(result.resetTime).toISOString(),
    "X-RateLimit-Limit": "10", // This would be configurable
  };
}
