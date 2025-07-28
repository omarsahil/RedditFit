import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { errorMonitor } from "../../../lib/error-monitoring";
import { logger } from "../../../lib/monitoring";
import { createErrorResponse } from "../../../lib/error-handler";

export async function GET(request: NextRequest) {
  try {
    const { userId } = auth();
    if (!userId) {
      return NextResponse.json(createErrorResponse("Unauthorized"), { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const errorId = searchParams.get("errorId");
    const severity = searchParams.get("severity") as
      | "low"
      | "medium"
      | "high"
      | "critical";
    const resolved = searchParams.get("resolved") === "true";
    const limit = parseInt(searchParams.get("limit") || "50");

    if (errorId) {
      // Get specific error
      const error = errorMonitor.getError(errorId);
      if (!error) {
        return NextResponse.json(createErrorResponse("Error not found"), { status: 404 });
      }
      return NextResponse.json(error);
    }

    // Get errors with filters
    const filters: any = { limit };
    if (severity) filters.severity = severity;
    if (resolved !== undefined) filters.resolved = resolved;

    const errors = errorMonitor.getErrors(filters);
    const stats = errorMonitor.getErrorStats();
    const alerts = errorMonitor.getAlerts();

    return NextResponse.json({
      errors,
      stats,
      alerts: alerts.slice(0, 10), // Limit alerts to 10 most recent
    });
  } catch (error) {
    logger.error("Failed to get errors", { error });
    return NextResponse.json(createErrorResponse("Failed to get errors"), { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { userId } = auth();
    if (!userId) {
      return NextResponse.json(createErrorResponse("Unauthorized"), { status: 401 });
    }

    const body = await request.json();
    const { errorId, resolvedBy, notes } = body;

    if (!errorId || !resolvedBy) {
      return NextResponse.json(
        createErrorResponse("Missing required fields: errorId, resolvedBy"),
        { status: 400 }
      );
    }

    // Resolve error
    const success = errorMonitor.resolveError(errorId, resolvedBy, notes);

    if (!success) {
      return NextResponse.json(createErrorResponse("Error not found"), { status: 404 });
    }

    logger.info("Error resolved", { errorId, resolvedBy, userId });

    return NextResponse.json({
      message: "Error resolved successfully",
      errorId,
    });
  } catch (error) {
    logger.error("Failed to resolve error", { error });
    return NextResponse.json(createErrorResponse("Failed to resolve error"), { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { userId } = auth();
    if (!userId) {
      return NextResponse.json(createErrorResponse("Unauthorized"), { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const action = searchParams.get("action");
    const olderThan = searchParams.get("olderThan");

    if (action === "clear-old" && olderThan) {
      // Clear old errors
      const cutoffDate = new Date(olderThan);
      const clearedCount = errorMonitor.clearOldErrors(cutoffDate);

      logger.info("Old errors cleared", { clearedCount, cutoffDate, userId });

      return NextResponse.json({
        message: "Old errors cleared successfully",
        clearedCount,
        cutoffDate,
      });
    }

    return NextResponse.json(
      createErrorResponse("Invalid action or missing olderThan parameter"),
      { status: 400 }
    );
  } catch (error) {
    logger.error("Failed to clear old errors", { error });
    return NextResponse.json(createErrorResponse("Failed to clear old errors"), { status: 500 });
  }
}
