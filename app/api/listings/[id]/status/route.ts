import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { successResponse, errorResponse } from "@/lib/api-response";

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

    if (status !== "ACTIVE" && status !== "CLOSED") {
      return errorResponse("INVALID_STATUS", "Status must be ACTIVE or CLOSED", 400);
    }

    const listing = await prisma.listing.findUnique({
      where: { id },
    });

    if (!listing) {
      return errorResponse("NOT_FOUND", "Listing not found", 404);
    }

    if (listing.companyId !== userId) {
      return errorResponse("FORBIDDEN", "Only the listing owner can update its status", 403);
    }

    const currentStatus = listing.status;

    // Enforce transition rules: DRAFT -> ACTIVE, ACTIVE -> CLOSED (or DRAFT -> CLOSED)
    if (status === "ACTIVE" && currentStatus !== "DRAFT") {
      return errorResponse(
        "INVALID_TRANSITION",
        `Cannot transition to ACTIVE from current status: ${currentStatus}`,
        400
      );
    }

    if (status === "CLOSED" && currentStatus === "CLOSED") {
      return errorResponse("INVALID_TRANSITION", "Listing is already CLOSED", 400);
    }

    const updatedListing = await prisma.listing.update({
      where: { id },
      data: {
        status,
        closedReason: status === "CLOSED" ? "MANUAL" : null,
      },
    });

    return successResponse(updatedListing);
  } catch (error: any) {
    console.error("Update listing status error:", error);
    return errorResponse("SERVER_ERROR", error.message || "Failed to update listing status", 500);
  }
}
