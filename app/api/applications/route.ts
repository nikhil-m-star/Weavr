import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { successResponse, errorResponse } from "@/lib/api-response";
import { createNotification } from "@/lib/notifications";
import { calculateMatchScore, evaluateApplicationWithNIM } from "@/lib/matching";

export async function GET() {
  const { userId } = await auth();
  if (!userId) {
    return errorResponse("UNAUTHORIZED", "Not authenticated", 401);
  }

  try {
    const student = await prisma.student.findUnique({
      where: { id: userId },
    });

    if (!student) {
      return errorResponse("FORBIDDEN", "Only students can view their applications", 403);
    }

    const applications = await prisma.application.findMany({
      where: { studentId: userId },
      include: {
        listing: {
          include: {
            company: {
              select: { name: true },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return successResponse(applications);
  } catch (error: any) {
    console.error("Fetch applications error:", error);
    return errorResponse("SERVER_ERROR", error.message || "Failed to fetch applications", 500);
  }
}

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) {
    return errorResponse("UNAUTHORIZED", "Not authenticated", 401);
  }

  // Check if student exists and is verified
  const student = await prisma.student.findUnique({
    where: { id: userId },
    include: {
      skills: {
        include: { skill: true },
      },
    },
  });

  if (!student) {
    return errorResponse("FORBIDDEN", "Only students can apply to listings.", 403);
  }

  if (!student.verified) {
    return errorResponse("UNVERIFIED", "Please verify your email profile before applying to new listings.", 400);
  }

  try {
    const body = await req.json();
    const { listingId } = body;

    if (!listingId) {
      return errorResponse("MISSING_LISTING_ID", "listingId is required", 400);
    }

    // Run application logic inside a Prisma transaction with row locking
    const result = await prisma.$transaction(async (tx) => {
      // Fetch listing with row lock using raw SQL
      const listings = await tx.$queryRaw<any[]>`
        SELECT * FROM "Listing"
        WHERE "id" = ${listingId}
        FOR UPDATE
      `;

      const listing = listings[0];
      if (!listing) {
        throw new Error("LISTING_NOT_FOUND");
      }

      if (listing.status !== "ACTIVE") {
        throw new Error("LISTING_NOT_ACTIVE");
      }

      if (new Date(listing.deadline) < new Date()) {
        throw new Error("LISTING_DEADLINE_PASSED");
      }

      if (listing.currentApplicants >= listing.maxApplicants) {
        throw new Error("LISTING_CAP_REACHED");
      }

      // Check if student already applied to this listing
      const existing = await tx.application.findUnique({
        where: {
          studentId_listingId: {
            studentId: userId,
            listingId,
          },
        },
      });

      if (existing) {
        throw new Error("DUPLICATE_APPLICATION");
      }

      // Fetch full listing with relations for initial local match scoring
      const fullListing = await tx.listing.findUnique({
        where: { id: listingId },
        include: {
          requiredSkills: { include: { skill: true } },
          preferredSkills: { include: { skill: true } },
        },
      });

      // Create the application
      const application = await tx.application.create({
        data: {
          studentId: userId,
          listingId,
          status: "SUBMITTED",
        },
      });

      // Increment denormalized applicants count
      const updatedApplicants = listing.currentApplicants + 1;
      const shouldClose = updatedApplicants >= listing.maxApplicants;

      await tx.listing.update({
        where: { id: listingId },
        data: {
          currentApplicants: updatedApplicants,
          status: shouldClose ? "CLOSED" : "ACTIVE",
          autoClosedAt: shouldClose ? new Date() : null,
          closedReason: shouldClose ? "AUTO_CAP" : null,
        },
      });

      return { application, listing, shouldClose };
    });

    // Trigger auto AI evaluation in the background asynchronously (no blocking)
    evaluateApplicationWithNIM(result.application.id).catch((err) => {
      console.error("Background NIM AI evaluation failed to trigger:", err);
    });

    // Trigger Notification to Company: New applicant
    await createNotification(
      "COMPANY",
      result.listing.companyId,
      `New applicant: ${student.name} applied to your listing "${result.listing.title}".`
    );

    // Trigger Notification to Student if listing was auto-closed
    if (result.shouldClose) {
      await createNotification(
        "COMPANY",
        result.listing.companyId,
        `Listing "${result.listing.title}" has been automatically closed because it reached the maximum cap of ${result.listing.maxApplicants} applicants.`
      );
    }

    return successResponse(result.application);
  } catch (error: any) {
    console.error("Create application error:", error);

    // Map transactional errors to clean API responses
    if (error.message === "LISTING_NOT_FOUND") {
      return errorResponse("NOT_FOUND", "Listing not found", 404);
    }
    if (error.message === "LISTING_NOT_ACTIVE") {
      return errorResponse("LISTING_NOT_ACTIVE", "This listing is not active and cannot receive applications.", 400);
    }
    if (error.message === "LISTING_DEADLINE_PASSED") {
      return errorResponse("DEADLINE_PASSED", "The application deadline for this listing has passed.", 400);
    }
    if (error.message === "LISTING_CAP_REACHED") {
      return errorResponse("CAP_REACHED", "This listing has reached its maximum applicant capacity.", 400);
    }
    if (error.message === "DUPLICATE_APPLICATION" || error.code === "P2002") {
      return errorResponse("DUPLICATE_APPLICATION", "You have already applied to this listing.", 400);
    }

    return errorResponse("SERVER_ERROR", error.message || "Failed to submit application", 500);
  }
}
