import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { backupManager } from "@/lib/backup";
import { createErrorResponse } from "@/lib/error-handler";

export async function GET(request: NextRequest) {
  try {
    const { userId } = auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const backupInfo = await backupManager.getBackupInfo(userId);
    return NextResponse.json(backupInfo);
  } catch (error) {
    const errorResponse = createErrorResponse(error);
    return NextResponse.json(errorResponse, { status: 500 });
  }
}
