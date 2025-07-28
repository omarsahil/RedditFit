import React from "react";
import { logger } from "./monitoring";

interface ErrorEvent {
  id: string;
  timestamp: Date;
  error: Error;
  context: {
    userId?: string;
    requestId?: string;
    url?: string;
    method?: string;
    userAgent?: string;
    ip?: string;
    stack?: string;
    metadata?: Record<string, any>;
  };
  severity: "low" | "medium" | "high" | "critical";
  tags: string[];
  resolved: boolean;
  resolvedAt?: Date;
  resolvedBy?: string;
  notes?: string;
}

interface ErrorAlert {
  id: string;
  errorEventId: string;
  type: "email" | "slack" | "webhook" | "sms";
  sent: boolean;
  sentAt?: Date;
  recipient: string;
  message: string;
}

interface ErrorStats {
  totalErrors: number;
  errorsBySeverity: Record<string, number>;
  errorsByType: Record<string, number>;
  errorsByHour: Record<string, number>;
  averageResolutionTime: number;
  topErrorPatterns: Array<{ pattern: string; count: number }>;
}

class ErrorMonitor {
  private errors: Map<string, ErrorEvent> = new Map();
  private alerts: Map<string, ErrorAlert> = new Map();
  private errorPatterns: Map<string, number> = new Map();
  private alertThresholds = {
    critical: 1, // Alert immediately
    high: 3, // Alert after 3 errors
    medium: 10, // Alert after 10 errors
    low: 50, // Alert after 50 errors
  };
  private alertCooldown = 5 * 60 * 1000; // 5 minutes
  private lastAlertTime: Map<string, number> = new Map();

  // Capture and process error
  captureError(
    error: Error,
    context: {
      userId?: string;
      requestId?: string;
      url?: string;
      method?: string;
      userAgent?: string;
      ip?: string;
      metadata?: Record<string, any>;
    } = {},
    severity: "low" | "medium" | "high" | "critical" = "medium"
  ): string {
    const errorId = `error_${Date.now()}_${Math.random()
      .toString(36)
      .substr(2, 9)}`;
    const timestamp = new Date();

    // Extract error pattern for grouping
    const errorPattern = this.extractErrorPattern(error);
    this.errorPatterns.set(
      errorPattern,
      (this.errorPatterns.get(errorPattern) || 0) + 1
    );

    const errorEvent: ErrorEvent = {
      id: errorId,
      timestamp,
      error,
      context: {
        ...context,
        stack: error.stack,
      },
      severity,
      tags: this.generateTags(error, context),
      resolved: false,
    };

    this.errors.set(errorId, errorEvent);

    // Log the error
    logger.error("Error captured", {
      errorId,
      message: error.message,
      severity,
      pattern: errorPattern,
      context,
    });

    // Check if we should send an alert
    this.checkAndSendAlert(errorPattern, severity);

    return errorId;
  }

  // Extract error pattern for grouping similar errors
  private extractErrorPattern(error: Error): string {
    const message = error.message.toLowerCase();
    const stack = error.stack || "";

    // Common patterns
    if (message.includes("database") || message.includes("connection")) {
      return "database_error";
    }
    if (message.includes("authentication") || message.includes("auth")) {
      return "authentication_error";
    }
    if (message.includes("validation") || message.includes("invalid")) {
      return "validation_error";
    }
    if (
      message.includes("rate limit") ||
      message.includes("too many requests")
    ) {
      return "rate_limit_error";
    }
    if (message.includes("not found") || message.includes("404")) {
      return "not_found_error";
    }
    if (message.includes("permission") || message.includes("forbidden")) {
      return "permission_error";
    }
    if (message.includes("timeout") || message.includes("timed out")) {
      return "timeout_error";
    }

    // Extract class name from stack trace
    const stackLines = stack.split("\n");
    const firstLine = stackLines.find(
      (line) => line.includes("at ") && !line.includes("node_modules")
    );
    if (firstLine) {
      const match = firstLine.match(/at\s+(\w+)/);
      if (match) {
        return `${match[1].toLowerCase()}_error`;
      }
    }

    return "unknown_error";
  }

  // Generate tags for error categorization
  private generateTags(error: Error, context: any): string[] {
    const tags: string[] = [];

    // Add error type tags
    if (error.name) tags.push(`error_type:${error.name}`);

    // Add context tags
    if (context.userId) tags.push(`user:${context.userId}`);
    if (context.url) tags.push(`endpoint:${context.url}`);
    if (context.method) tags.push(`method:${context.method}`);

    // Add severity tag
    tags.push(`severity:${error.name || "unknown"}`);

    return tags;
  }

  // Check if we should send an alert
  private checkAndSendAlert(
    errorPattern: string,
    severity: "low" | "medium" | "high" | "critical"
  ) {
    const patternCount = this.errorPatterns.get(errorPattern) || 0;
    const threshold = this.alertThresholds[severity];
    const alertKey = `${errorPattern}_${severity}`;
    const lastAlert = this.lastAlertTime.get(alertKey) || 0;

    // Check if we should alert based on threshold and cooldown
    if (
      patternCount >= threshold &&
      Date.now() - lastAlert > this.alertCooldown
    ) {
      this.sendAlert(errorPattern, severity, patternCount);
      this.lastAlertTime.set(alertKey, Date.now());
    }
  }

  // Send alert
  private async sendAlert(
    errorPattern: string,
    severity: "low" | "medium" | "high" | "critical",
    count: number
  ) {
    const alertId = `alert_${Date.now()}_${Math.random()
      .toString(36)
      .substr(2, 9)}`;

    const alert: ErrorAlert = {
      id: alertId,
      errorEventId: "", // Would be set to the latest error ID
      type: "email", // Default to email
      sent: false,
      recipient: process.env.ERROR_ALERT_EMAIL || "admin@reddit.com",
      message: `Error Alert: ${errorPattern} has occurred ${count} times with ${severity} severity`,
    };

    this.alerts.set(alertId, alert);

    try {
      // Send the alert (implementation depends on your alerting system)
      await this.sendEmailAlert(alert);

      alert.sent = true;
      alert.sentAt = new Date();

      logger.info("Error alert sent", {
        alertId,
        errorPattern,
        severity,
        count,
        recipient: alert.recipient,
      });
    } catch (error) {
      logger.error("Failed to send error alert", {
        alertId,
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }

  // Send email alert (simplified implementation)
  private async sendEmailAlert(alert: ErrorAlert): Promise<void> {
    // This would integrate with your email service (SendGrid, AWS SES, etc.)
    console.log(`Sending email alert to ${alert.recipient}: ${alert.message}`);

    // Simulate email sending
    await new Promise((resolve) => setTimeout(resolve, 100));
  }

  // Mark error as resolved
  resolveError(errorId: string, resolvedBy: string, notes?: string): boolean {
    const error = this.errors.get(errorId);
    if (!error) return false;

    error.resolved = true;
    error.resolvedAt = new Date();
    error.resolvedBy = resolvedBy;
    error.notes = notes;

    logger.info("Error resolved", {
      errorId,
      resolvedBy,
      notes,
      resolutionTime: error.resolvedAt.getTime() - error.timestamp.getTime(),
    });

    return true;
  }

  // Get error by ID
  getError(errorId: string): ErrorEvent | null {
    return this.errors.get(errorId) || null;
  }

  // Get errors with filters
  getErrors(
    filters: {
      severity?: "low" | "medium" | "high" | "critical";
      resolved?: boolean;
      userId?: string;
      startDate?: Date;
      endDate?: Date;
      limit?: number;
    } = {}
  ): ErrorEvent[] {
    let errors = Array.from(this.errors.values());

    if (filters.severity) {
      errors = errors.filter((e) => e.severity === filters.severity);
    }
    if (filters.resolved !== undefined) {
      errors = errors.filter((e) => e.resolved === filters.resolved);
    }
    if (filters.userId) {
      errors = errors.filter((e) => e.context.userId === filters.userId);
    }
    if (filters.startDate) {
      errors = errors.filter((e) => e.timestamp >= filters.startDate!);
    }
    if (filters.endDate) {
      errors = errors.filter((e) => e.timestamp <= filters.endDate!);
    }

    // Sort by timestamp (newest first)
    errors.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

    if (filters.limit) {
      errors = errors.slice(0, filters.limit);
    }

    return errors;
  }

  // Get error statistics
  getErrorStats(): ErrorStats {
    const errors = Array.from(this.errors.values());
    const now = new Date();
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    // Filter to last 24 hours for hourly stats
    const recentErrors = errors.filter((e) => e.timestamp >= oneDayAgo);

    // Errors by severity
    const errorsBySeverity: Record<string, number> = {};
    errors.forEach((e) => {
      errorsBySeverity[e.severity] = (errorsBySeverity[e.severity] || 0) + 1;
    });

    // Errors by type (pattern)
    const errorsByType: Record<string, number> = {};
    this.errorPatterns.forEach((count, pattern) => {
      errorsByType[pattern] = count;
    });

    // Errors by hour (last 24 hours)
    const errorsByHour: Record<string, number> = {};
    recentErrors.forEach((e) => {
      const hour = e.timestamp.toISOString().substring(0, 13) + ":00:00Z";
      errorsByHour[hour] = (errorsByHour[hour] || 0) + 1;
    });

    // Average resolution time
    const resolvedErrors = errors.filter((e) => e.resolved && e.resolvedAt);
    const averageResolutionTime =
      resolvedErrors.length > 0
        ? resolvedErrors.reduce(
            (sum, e) => sum + (e.resolvedAt!.getTime() - e.timestamp.getTime()),
            0
          ) / resolvedErrors.length
        : 0;

    // Top error patterns
    const topErrorPatterns = Array.from(this.errorPatterns.entries())
      .map(([pattern, count]) => ({ pattern, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    return {
      totalErrors: errors.length,
      errorsBySeverity,
      errorsByType,
      errorsByHour,
      averageResolutionTime,
      topErrorPatterns,
    };
  }

  // Get alerts
  getAlerts(
    filters: {
      sent?: boolean;
      type?: "email" | "slack" | "webhook" | "sms";
      startDate?: Date;
      endDate?: Date;
    } = {}
  ): ErrorAlert[] {
    let alerts = Array.from(this.alerts.values());

    if (filters.sent !== undefined) {
      alerts = alerts.filter((a) => a.sent === filters.sent);
    }
    if (filters.type) {
      alerts = alerts.filter((a) => a.type === filters.type);
    }
    if (filters.startDate) {
      alerts = alerts.filter((a) => a.sentAt && a.sentAt >= filters.startDate!);
    }
    if (filters.endDate) {
      alerts = alerts.filter((a) => a.sentAt && a.sentAt <= filters.endDate!);
    }

    return alerts.sort(
      (a, b) => (b.sentAt?.getTime() || 0) - (a.sentAt?.getTime() || 0)
    );
  }

  // Clear old errors (cleanup)
  clearOldErrors(olderThan: Date): number {
    let clearedCount = 0;

    for (const [id, error] of Array.from(this.errors.entries())) {
      if (error.timestamp < olderThan) {
        this.errors.delete(id);
        clearedCount++;
      }
    }

    logger.info("Cleared old errors", { clearedCount, olderThan });
    return clearedCount;
  }

  // Update alert thresholds
  updateAlertThresholds(
    thresholds: Partial<typeof this.alertThresholds>
  ): void {
    this.alertThresholds = { ...this.alertThresholds, ...thresholds };
    logger.info("Updated alert thresholds", {
      thresholds: this.alertThresholds,
    });
  }

  // Get monitoring status
  getStatus() {
    const stats = this.getErrorStats();
    const recentErrors = this.getErrors({
      startDate: new Date(Date.now() - 60 * 60 * 1000), // Last hour
    });

    return {
      status:
        recentErrors.length > 10
          ? "critical"
          : recentErrors.length > 5
          ? "warning"
          : "healthy",
      totalErrors: stats.totalErrors,
      recentErrors: recentErrors.length,
      alerts: this.alerts.size,
      patterns: this.errorPatterns.size,
    };
  }
}

export const errorMonitor = new ErrorMonitor();

// Error boundary for React components
export function withErrorBoundary<T extends React.ComponentType<any>>(
  Component: T,
  fallback?: React.ComponentType<{ error?: Error }>
): T {
  const WrappedComponent = (props: any) => {
    try {
      return React.createElement(Component, props);
    } catch (error) {
      const errorObj =
        error instanceof Error ? error : new Error(String(error));
      errorMonitor.captureError(
        errorObj,
        {
          url: typeof window !== "undefined" ? window.location.href : undefined,
          userAgent:
            typeof navigator !== "undefined" ? navigator.userAgent : undefined,
          metadata: { component: Component.name, props },
        },
        "high"
      );

      if (fallback) {
        return React.createElement(fallback, { error: errorObj });
      }

      return React.createElement(
        "div",
        { className: "p-4 bg-red-50 border border-red-200 rounded-lg" },
        React.createElement(
          "h3",
          { className: "text-red-800 font-medium" },
          "Something went wrong"
        ),
        React.createElement(
          "p",
          { className: "text-red-600 text-sm mt-1" },
          "We've been notified and are working to fix this issue."
        )
      );
    }
  };

  return WrappedComponent as T;
}

// Global error handler for unhandled errors
export function setupGlobalErrorHandling() {
  if (typeof window !== "undefined") {
    // Handle unhandled promise rejections
    window.addEventListener("unhandledrejection", (event) => {
      const error = new Error(
        event.reason?.message || "Unhandled promise rejection"
      );
      errorMonitor.captureError(
        error,
        {
          url: window.location.href,
          userAgent: navigator.userAgent,
          metadata: { type: "unhandledrejection", reason: event.reason },
        },
        "high"
      );
    });

    // Handle uncaught errors
    window.addEventListener("error", (event) => {
      const error = new Error(event.message || "Uncaught error");
      errorMonitor.captureError(
        error,
        {
          url: window.location.href,
          userAgent: navigator.userAgent,
          metadata: {
            type: "uncaught",
            filename: event.filename,
            lineno: event.lineno,
            colno: event.colno,
          },
        },
        "high"
      );
    });
  }

  // Handle Node.js uncaught exceptions
  if (typeof process !== "undefined") {
    process.on("uncaughtException", (error) => {
      errorMonitor.captureError(
        error,
        {
          metadata: { type: "uncaughtException" },
        },
        "critical"
      );
    });

    process.on("unhandledRejection", (reason) => {
      const error =
        reason instanceof Error ? reason : new Error(String(reason));
      errorMonitor.captureError(
        error,
        {
          metadata: { type: "unhandledRejection", reason },
        },
        "critical"
      );
    });
  }

  logger.info("Global error handling setup complete");
}
