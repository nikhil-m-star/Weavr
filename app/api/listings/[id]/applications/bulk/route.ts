import { auth } from "@clerk/nextjs/server";
import { prisma } from "../../../../lib/prisma";
import { successResponse, errorResponse } from "../../../../lib/api-response";
import { createNotification } from "../../../../lib/notifications";
import { ApplicationStatus } from "../../../../prisma/generated-client/client";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { userId } = await auth();

  if (!userId) {
    return errorResponse("UNAUTHORIZED", "Not authenticated", 401);
  }

  try {
    const listing = await prisma.listing.findUnique({
      where: { id },
    });

    if (!listing) {
      return errorResponse("NOT_FOUND", "Listing not found", 404);
    }

    if (listing.companyId !== userId) {
      return errorResponse("FORBIDDEN", "Only the listing owner can update applicant statuses", 403);
    }

    const body = await req.json();
    const { targetStatus, filterStatus } = body;

    if (!targetStatus) {
      return errorResponse("MISSING_TARGET_STATUS", "targetStatus is required", 400);
    }

    // Fetch the list of applications to update first, so we know who to notify
    const appsToUpdate = await prisma.application.findMany({
      where: {
        listingId: id,
        status: filterStatus ? (filterStatus as ApplicationStatus) : undefined,
      },
      select: {
        id: true,
        studentId: true,
      },
    });

    if (appsToUpdate.length === 0) {
      return successResponse({ updatedCount: 0, message: "No applications matched the filter criteria" });
    }

    // Execute bulk update in one query
    const updateResult = await prisma.application.updateMany({
      where: {
        id: {
          in: appsToUpdate.map((app) => app.id),
        },
      },
      data: {
        status: targetStatus as ApplicationStatus,
      },
    });

    // Notify each student about the status change
    for (const app of appsToUpdate) {
      await createNotification(
        "STUDENT",
        app.studentId,
        `Your application status for "${listing.title}" has been updated to "${targetStatus}".`
      );
    }

    return successResponse({
      updatedCount: updateResult.count,
      message: `Successfully updated ${updateResult.count} applications to ${targetStatus}`,
    });
  } catch (error: any) {
    console.error("Bulk update applications error:", error);
    return errorResponse("SERVER_ERROR", error.message || "Failed to bulk update applications", 500);
  }
}
