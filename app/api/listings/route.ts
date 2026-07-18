import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { successResponse, errorResponse } from "@/lib/api-response";
import { calculateMatchScore } from "@/lib/matching";
import { createNotification } from "@/lib/notifications";

export async function GET(req: Request) {
  const { userId } = await auth();
  if (!userId) {
    return errorResponse("UNAUTHORIZED", "Not authenticated", 401);
  }

  try {
    // Determine if the user is a student or company
    const student = await prisma.student.findUnique({
      where: { id: userId },
      include: {
        skills: true,
      },
    });

    if (student) {
      // User is a student - Fetch all ACTIVE listings and calculate match scores
      const listings = await prisma.listing.findMany({
        where: {
          status: "ACTIVE",
          deadline: {
            gt: new Date(),
          },
        },
        include: {
          company: {
            select: {
              name: true,
            },
          },
          requiredSkills: {
            include: {
              skill: true,
            },
          },
          preferredSkills: {
            include: {
              skill: true,
            },
          },
          applications: {
            where: {
              studentId: userId,
            },
            select: {
              id: true,
              status: true,
              nimScore: true,
            },
          },
        },
      });

      // Calculate match score in-memory
      const scoredListings = listings.map((listing) => {
        const hasApplied = listing.applications.length > 0;
        const score = hasApplied
          ? (listing.applications[0]?.nimScore ?? calculateMatchScore(student, listing))
          : calculateMatchScore(student, listing);
        return {
          ...listing,
          matchScore: score,
          hasApplied,
          applicationStatus: listing.applications[0]?.status || null,
          applicationId: listing.applications[0]?.id || null,
        };
      });

      // Sort by match score descending
      scoredListings.sort((a, b) => b.matchScore - a.matchScore);

      // Lazy matching notifications for scores >= 70
      try {
        const existingNotifications = await prisma.notification.findMany({
          where: { recipientId: userId },
          select: { message: true },
        });

        for (const l of scoredListings) {
          if (l.matchScore >= 70 && !l.hasApplied) {
            const hasBeenNotified = existingNotifications.some((n) =>
              n.message.includes(`"${l.title}"`)
            );
            if (!hasBeenNotified) {
              await createNotification(
                "STUDENT",
                userId,
                `New matching position: "${l.title}" aligns with your profile (AI Fit: ${l.matchScore}%).`
              );
            }
          }
        }
      } catch (notifErr) {
        console.error("Failed to generate lazy notifications:", notifErr);
      }

      return successResponse(scoredListings);
    }

    const company = await prisma.company.findUnique({
      where: { id: userId },
    });

    if (company) {
      // User is a company - Fetch company's own listings
      const listings = await prisma.listing.findMany({
        where: {
          companyId: userId,
        },
        include: {
          requiredSkills: {
            include: {
              skill: true,
            },
          },
          preferredSkills: {
            include: {
              skill: true,
            },
          },
          applications: {
            include: {
              student: {
                include: {
                  skills: {
                    include: {
                      skill: true,
                    },
                  },
                },
              },
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
      });

      // Include match scores for each application to this listing
      const listingsWithScoredApplicants = listings.map((listing) => {
        const applications = listing.applications.map((app) => {
          const score = calculateMatchScore(app.student, listing);
          return {
            ...app,
            matchScore: score,
          };
        });

        // Sort applicants by match score descending
        applications.sort((a, b) => b.matchScore - a.matchScore);

        return {
          ...listing,
          applications,
        };
      });

      return successResponse(listingsWithScoredApplicants);
    }

    return errorResponse("PROFILE_NOT_FOUND", "Please complete your profile configuration.", 400);
  } catch (error: any) {
    console.error("Fetch listings error:", error);
    return errorResponse("SERVER_ERROR", error.message || "Failed to fetch listings", 500);
  }
}

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) {
    return errorResponse("UNAUTHORIZED", "Not authenticated", 401);
  }

  // Validate that the user is an approved company
  const company = await prisma.company.findUnique({
    where: { id: userId },
  });

  if (!company) {
    return errorResponse("FORBIDDEN", "Only companies can create job listings.", 403);
  }

  if (!company.approved) {
    return errorResponse("FORBIDDEN", "Your company account is pending administrator approval.", 403);
  }

  try {
    const body = await req.json();
    const {
      title,
      description,
      stipend,
      location,
      deadline,
      maxApplicants,
      targetBranch,
      targetGradYear,
      requiredSkills = [],
      preferredSkills = [],
    } = body;

    if (!title || !description || !stipend || !location || !deadline || !maxApplicants) {
      return errorResponse("MISSING_FIELDS", "Required fields are missing.", 400);
    }

    // Resolve skill IDs for required and preferred skills
    const getSkillIds = async (names: string[]): Promise<string[]> => {
      const ids: string[] = [];
      for (const name of names) {
        const trimmed = name.toLowerCase().trim();
        if (trimmed) {
          const dbSkill = await prisma.skill.upsert({
            where: { name: trimmed },
            update: {},
            create: { name: trimmed },
          });
          ids.push(dbSkill.id);
        }
      }
      return ids;
    };

    const reqSkillIds = await getSkillIds(requiredSkills);
    const prefSkillIds = await getSkillIds(preferredSkills);

    // Create listing
    const listing = await prisma.listing.create({
      data: {
        companyId: userId,
        title,
        description,
        stipend: parseFloat(stipend),
        location,
        deadline: new Date(deadline),
        maxApplicants: parseInt(maxApplicants),
        targetBranch,
        targetGradYear: targetGradYear ? parseInt(targetGradYear) : null,
        status: "DRAFT", // Start as DRAFT
        requiredSkills: {
          create: reqSkillIds.map((skillId) => ({ skillId })),
        },
        preferredSkills: {
          create: prefSkillIds.map((skillId) => ({ skillId })),
        },
      },
      include: {
        requiredSkills: {
          include: { skill: true },
        },
        preferredSkills: {
          include: { skill: true },
        },
      },
    });

    return successResponse(listing, 21);
  } catch (error: any) {
    console.error("Create listing error:", error);
    return errorResponse("SERVER_ERROR", error.message || "Failed to create listing", 500);
  }
}
