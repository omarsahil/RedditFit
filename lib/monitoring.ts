interface LogLevel {
  ERROR: "error";
  WARN: "warn";
  INFO: "info";
  DEBUG: "debug";
}

interface LogEntry {
  timestamp: string;
  level: string;
  message: string;
  context?: any;
  userId?: string;
  requestId?: string;
  duration?: number;
}

interface Metrics {
  requests: {
    total: number;
    byEndpoint: { [key: string]: number };
    byStatus: { [key: string]: number };
  };
  errors: {
    total: number;
    byType: { [key: string]: number };
  };
  performance: {
    averageResponseTime: number;
    slowestEndpoints: Array<{ endpoint: string; avgTime: number }>;
  };
  users: {
    active: number;
    total: number;
  };
}

class Logger {
  private logs: LogEntry[] = [];
  private maxLogs: number = 1000;

  log(level: string, message: string, context?: any) {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      context,
    };

    this.logs.push(entry);

    // Keep only the last maxLogs entries
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(-this.maxLogs);
    }

    // Also log to console in development
    if (process.env.NODE_ENV === "development") {
      if (level === "error") console.error(message, context);
      else if (level === "warn") console.warn(message, context);
      else if (level === "info") console.info(message, context);
      else if (level === "debug") console.debug(message, context);
    }
  }

  error(message: string, context?: any) {
    this.log("error", message, context);
  }

  warn(message: string, context?: any) {
    this.log("warn", message, context);
  }

  info(message: string, context?: any) {
    this.log("info", message, context);
  }

  debug(message: string, context?: any) {
    this.log("debug", message, context);
  }

  getLogs(level?: string, limit?: number): LogEntry[] {
    let filtered = this.logs;

    if (level) {
      filtered = filtered.filter((log) => log.level === level);
    }

    if (limit) {
      filtered = filtered.slice(-limit);
    }

    return filtered;
  }

  clear() {
    this.logs = [];
  }
}

class MetricsCollector {
  private metrics: Metrics = {
    requests: {
      total: 0,
      byEndpoint: {},
      byStatus: {},
    },
    errors: {
      total: 0,
      byType: {},
    },
    performance: {
      averageResponseTime: 0,
      slowestEndpoints: [],
    },
    users: {
      active: 0,
      total: 0,
    },
  };

  private responseTimes: { [endpoint: string]: number[] } = {};

  recordRequest(endpoint: string, status: number, duration: number) {
    this.metrics.requests.total++;

    // Record by endpoint
    this.metrics.requests.byEndpoint[endpoint] =
      (this.metrics.requests.byEndpoint[endpoint] || 0) + 1;

    // Record by status
    const statusKey = status.toString();
    this.metrics.requests.byStatus[statusKey] =
      (this.metrics.requests.byStatus[statusKey] || 0) + 1;

    // Record response time
    if (!this.responseTimes[endpoint]) {
      this.responseTimes[endpoint] = [];
    }
    this.responseTimes[endpoint].push(duration);

    // Keep only last 100 response times per endpoint
    if (this.responseTimes[endpoint].length > 100) {
      this.responseTimes[endpoint] = this.responseTimes[endpoint].slice(-100);
    }

    this.updatePerformanceMetrics();
  }

  recordError(errorType: string) {
    this.metrics.errors.total++;
    this.metrics.errors.byType[errorType] =
      (this.metrics.errors.byType[errorType] || 0) + 1;
  }

  private updatePerformanceMetrics() {
    // Calculate average response time across all endpoints
    const allTimes = Object.values(this.responseTimes).flat();
    this.metrics.performance.averageResponseTime =
      allTimes.length > 0
        ? allTimes.reduce((a, b) => a + b, 0) / allTimes.length
        : 0;

    // Calculate slowest endpoints
    this.metrics.performance.slowestEndpoints = Object.entries(
      this.responseTimes
    )
      .map(([endpoint, times]) => ({
        endpoint,
        avgTime: times.reduce((a, b) => a + b, 0) / times.length,
      }))
      .sort((a, b) => b.avgTime - a.avgTime)
      .slice(0, 10);
  }

  getMetrics(): Metrics {
    return { ...this.metrics };
  }

  reset() {
    this.metrics = {
      requests: { total: 0, byEndpoint: {}, byStatus: {} },
      errors: { total: 0, byType: {} },
      performance: { averageResponseTime: 0, slowestEndpoints: [] },
      users: { active: 0, total: 0 },
    };
    this.responseTimes = {};
  }
}

class PerformanceMonitor {
  private startTimes: Map<string, number> = new Map();

  startTimer(requestId: string) {
    this.startTimes.set(requestId, Date.now());
  }

  endTimer(requestId: string): number {
    const startTime = this.startTimes.get(requestId);
    if (!startTime) return 0;

    const duration = Date.now() - startTime;
    this.startTimes.delete(requestId);
    return duration;
  }

  measureAsync<T>(fn: () => Promise<T>): Promise<T> {
    const startTime = Date.now();
    return fn().finally(() => {
      const duration = Date.now() - startTime;
      // You could log this duration or add it to metrics
    });
  }
}

// Create global instances
export const logger = new Logger();
export const metrics = new MetricsCollector();
export const performanceMonitor = new PerformanceMonitor();

// Middleware for request monitoring
export function withMonitoring(handler: Function) {
  return async (req: any, ...args: any[]) => {
    const requestId = Math.random().toString(36).substring(7);
    const startTime = Date.now();

    performanceMonitor.startTimer(requestId);

    try {
      const result = await handler(req, ...args);

      const duration = performanceMonitor.endTimer(requestId);
      const endpoint = req.url || "unknown";
      const status = 200; // You'd get this from the response

      metrics.recordRequest(endpoint, status, duration);

      logger.info("Request completed", {
        requestId,
        endpoint,
        duration,
        status,
      });

      return result;
    } catch (error) {
      const duration = performanceMonitor.endTimer(requestId);
      const endpoint = req.url || "unknown";

      metrics.recordRequest(endpoint, 500, duration);
      metrics.recordError(
        error instanceof Error ? error.constructor.name : "UnknownError"
      );

      logger.error("Request failed", {
        requestId,
        endpoint,
        duration,
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      });

      throw error;
    }
  };
}

// Health check function
export function getHealthStatus() {
  const logs = logger.getLogs("error", 10);
  const recentErrors = logs.length;

  return {
    status: recentErrors < 5 ? "healthy" : "degraded",
    timestamp: new Date().toISOString(),
    metrics: metrics.getMetrics(),
    recentErrors,
    uptime: process.uptime(),
  };
}

// Export monitoring utilities
export const monitoring = {
  logger,
  metrics,
  performanceMonitor,
  withMonitoring,
  getHealthStatus,
};
