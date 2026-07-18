import { auth } from "@clerk/nextjs/server";
import { prisma } from "../../../../../lib/prisma";
import { successResponse, errorResponse } from "../../../../../lib/api-response";
import { createNotification } from "../../../../../lib/notifications";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { userId } = await auth();

  if (!userId) {
    return errorResponse("UNAUTHORIZED", "Not authenticated", 401);
  }

  try {
    const result = await prisma.$transaction(async (tx) => {
      // 1. Fetch application
      const application = await tx.application.findUnique({
        where: { id },
      });

      if (!application) {
        throw new Error("APPLICATION_NOT_FOUND");
      }

      if (application.studentId !== userId) {
        throw new Error("FORBIDDEN");
      }

      if (application.status !== "SUBMITTED") {
        throw new Error("INVALID_STATUS");
      }

      // 2. Lock the listing
      const listings = await tx.$queryRaw<any[]>`
        SELECT * FROM "Listing"
        WHERE "id" = ${application.listingId}
        FOR UPDATE
      `;
      const listing = listings[0];
      if (!listing) {
        throw new Error("LISTING_NOT_FOUND");
      }

      // 3. Delete the application
      await tx.application.delete({
        where: { id },
      });

      // 4. Decrement count
      const updatedApplicants = Math.max(0, listing.currentApplicants - 1);
      
      // Determine if we should reopen the listing
      // Reopen if it was CLOSED due to AUTO_CAP and now has space
      const shouldReopen = 
        listing.status === "CLOSED" && 
        listing.closedReason === "AUTO_CAP" && 
        updatedApplicants < listing.maxApplicants;

      const updatedListing = await tx.listing.update({
        where: { id: listing.id },
        data: {
          currentApplicants: updatedApplicants,
          status: shouldReopen ? "ACTIVE" : listing.status,
          closedReason: shouldReopen ? null : listing.closedReason,
          autoClosedAt: shouldReopen ? null : listing.autoClosedAt,
        },
      });

      return { application, listing: updatedListing, shouldReopen };
    });

    // Notify company
    await createNotification(
      "COMPANY",
      result.listing.companyId,
      `An applicant withdrew their application for "${result.listing.title}". Active applicant count is now ${result.listing.currentApplicants}/${result.listing.maxApplicants}.`
    );

    if (result.shouldReopen) {
      await createNotification(
        "COMPANY",
        result.listing.companyId,
        `Listing "${result.listing.title}" has been automatically reopened to ACTIVE because an applicant withdrew and it is now below the capacity limit.`
      );
    }

    return successResponse({ message: "Application successfully withdrawn" });
  } catch (error: any) {
    console.error("Withdraw application error:", error);

    if (error.message === "APPLICATION_NOT_FOUND") {
      return errorResponse("NOT_FOUND", "Application not found", 404);
    }
    if (error.message === "FORBIDDEN") {
      return errorResponse("FORBIDDEN", "You do not have permission to withdraw this application", 403);
    }
    if (error.message === "INVALID_STATUS") {
      return errorResponse(
        "INVALID_STATUS",
        "Applications can only be withdrawn while their status is 'SUBMITTED'",
        400
      );
    }
    if (error.message === "LISTING_NOT_FOUND") {
      return errorResponse("NOT_FOUND", "Associated listing not found", 404);
    }

    return errorResponse("SERVER_ERROR", error.message || "Failed to withdraw application", 500);
  }
}
