import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { jobProcessor, scheduledJobs } from "../../../lib/background-jobs";
import { logger } from "../../../lib/monitoring";
import { createErrorResponse } from "../../../lib/error-handler";

export async function GET(request: NextRequest) {
  try {
    const { userId } = auth();
    if (!userId) {
      return NextResponse.json(createErrorResponse("Unauthorized"), { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const jobId = searchParams.get("jobId");
    const type = searchParams.get("type");

    if (jobId) {
      // Get specific job status
      const job = jobProcessor.getJobStatus(jobId);
      if (!job) {
        return NextResponse.json(createErrorResponse("Job not found"), { status: 404 });
      }
      return NextResponse.json(job);
    }

    if (type) {
      // Get jobs by type
      const queueStatus = jobProcessor.getQueueStatus();
      const typeJobs = queueStatus.queueStatus[type] || null;
      return NextResponse.json({ type, jobs: typeJobs });
    }

    // Get all job status
    const queueStatus = jobProcessor.getQueueStatus();
    const scheduledJobsStatus = scheduledJobs.getScheduledJobsStatus();

    return NextResponse.json({
      queue: queueStatus,
      scheduled: scheduledJobsStatus,
    });
  } catch (error) {
    logger.error("Failed to get job status", { error });
    return NextResponse.json(createErrorResponse("Failed to get job status"), { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { userId } = auth();
    if (!userId) {
      return NextResponse.json(createErrorResponse("Unauthorized"), { status: 401 });
    }

    const body = await request.json();
    const { type, data } = body;

    if (!type || !data) {
      return NextResponse.json(createErrorResponse("Missing required fields: type, data"), { status: 400 });
    }

    // Add job to queue
    const jobId = await jobProcessor.addJob(type, data);

    logger.info("Job added to queue", { jobId, type, userId });

    return NextResponse.json({
      jobId,
      status: "pending",
      message: "Job added to queue successfully",
    });
  } catch (error) {
    logger.error("Failed to add job to queue", { error });
    return NextResponse.json(createErrorResponse("Failed to add job to queue"), { status: 500 });
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

    if (action === "clear-completed") {
      // Clear completed jobs
      jobProcessor.clearCompletedJobs();
      logger.info("Completed jobs cleared", { userId });

      return NextResponse.json({
        message: "Completed jobs cleared successfully",
      });
    }

    return NextResponse.json(createErrorResponse("Invalid action"), { status: 400 });
  } catch (error) {
    logger.error("Failed to clear completed jobs", { error });
    return NextResponse.json(createErrorResponse("Failed to clear completed jobs"), { status: 500 });
  }
}
