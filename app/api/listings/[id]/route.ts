import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { successResponse, errorResponse } from "@/lib/api-response";

export async function GET(
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
      include: {
        company: {
          select: {
            name: true,
            email: true,
          },
        },
        requiredSkills: {
          include: { skill: true },
        },
        preferredSkills: {
          include: { skill: true },
        },
      },
    });

    if (!listing) {
      return errorResponse("NOT_FOUND", "Listing not found", 404);
    }

    return successResponse(listing);
  } catch (error: any) {
    console.error("Fetch listing error:", error);
    return errorResponse("SERVER_ERROR", error.message || "Failed to fetch listing", 500);
  }
}

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
      return errorResponse("FORBIDDEN", "Only the listing owner can edit it", 403);
    }

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
      requiredSkills,
      preferredSkills,
    } = body;

    const data: any = {};
    if (title !== undefined) data.title = title;
    if (description !== undefined) data.description = description;
    if (stipend !== undefined) data.stipend = parseFloat(stipend);
    if (location !== undefined) data.location = location;
    if (deadline !== undefined) data.deadline = new Date(deadline);
    if (maxApplicants !== undefined) data.maxApplicants = parseInt(maxApplicants);
    if (targetBranch !== undefined) data.targetBranch = targetBranch;
    if (targetGradYear !== undefined) data.targetGradYear = targetGradYear ? parseInt(targetGradYear) : null;

    // We do NOT need to retroactively rescore since scores are computed at read-time!
    // But we need to sync skills if they are provided
    if (requiredSkills !== undefined) {
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
      await prisma.listingRequiredSkill.deleteMany({
        where: { listingId: id },
      });
      data.requiredSkills = {
        create: reqSkillIds.map((skillId) => ({ skillId })),
      };
    }

    if (preferredSkills !== undefined) {
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

      const prefSkillIds = await getSkillIds(preferredSkills);
      await prisma.listingPreferredSkill.deleteMany({
        where: { listingId: id },
      });
      data.preferredSkills = {
        create: prefSkillIds.map((skillId) => ({ skillId })),
      };
    }

    const updated = await prisma.listing.update({
      where: { id },
      data,
      include: {
        requiredSkills: { include: { skill: true } },
        preferredSkills: { include: { skill: true } },
      },
    });

    return successResponse(updated);
  } catch (error: any) {
    console.error("Edit listing error:", error);
    return errorResponse("SERVER_ERROR", error.message || "Failed to edit listing", 500);
  }
}
