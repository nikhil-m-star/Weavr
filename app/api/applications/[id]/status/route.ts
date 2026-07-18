import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { successResponse, errorResponse } from "@/lib/api-response";
import { createNotification } from "@/lib/notifications";
import { ApplicationStatus } from "@/prisma/generated-client/client";

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
    const body = await req.json();
    const { status } = body;

    if (!status) {
      return errorResponse("MISSING_STATUS", "status is required", 400);
    }

    // Fetch the application including the listing to check permissions
    const application = await prisma.application.findUnique({
      where: { id },
      include: {
        listing: true,
      },
    });

    if (!application) {
      return errorResponse("NOT_FOUND", "Application not found", 404);
    }

    // Verify company owns the listing
    if (application.listing.companyId !== userId) {
      return errorResponse("FORBIDDEN", "Only the listing owner can update application status", 403);
    }

    // Update the application status
    const updatedApplication = await prisma.application.update({
      where: { id },
      data: {
        status: status as ApplicationStatus,
      },
    });

    // Notify the student
    await createNotification(
      "STUDENT",
      application.studentId,
      `Your application status for "${application.listing.title}" has been updated to "${status}".`
    );

    return successResponse(updatedApplication);
  } catch (error: any) {
    console.error("Update application status error:", error);
    return errorResponse("SERVER_ERROR", error.message || "Failed to update application status", 500);
  }
}
