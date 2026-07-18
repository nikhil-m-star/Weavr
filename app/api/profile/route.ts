import { auth, currentUser } from "@clerk/nextjs/server";
import { prisma } from "../../../lib/prisma";
import { successResponse, errorResponse } from "../../../lib/api-response";

export async function GET() {
  const { userId } = await auth();
  if (!userId) {
    return errorResponse("UNAUTHORIZED", "Not authenticated", 401);
  }

  // Check if student exists
  const student = await prisma.student.findUnique({
    where: { id: userId },
    include: {
      skills: {
        include: {
          skill: true,
        },
      },
    },
  });

  if (student) {
    return successResponse({ role: "student", profile: student });
  }

  // Check if company exists
  const company = await prisma.company.findUnique({
    where: { id: userId },
  });

  if (company) {
    return successResponse({ role: "company", profile: company });
  }

  return successResponse({ role: null, profile: null });
}

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) {
    return errorResponse("UNAUTHORIZED", "Not authenticated", 401);
  }

  const user = await currentUser();
  if (!user) {
    return errorResponse("USER_NOT_FOUND", "Clerk user profile not found", 404);
  }

  const email = user.emailAddresses[0]?.emailAddress;
  if (!email) {
    return errorResponse("MISSING_EMAIL", "User has no email address configured", 400);
  }

  try {
    const body = await req.json();
    const { role } = body;

    if (role !== "student" && role !== "company") {
      return errorResponse("INVALID_ROLE", "Role must be 'student' or 'company'", 400);
    }

    const domain = email.split("@")[1]?.toLowerCase() || "";
    const isPublicDomain = ["gmail.com", "yahoo.com", "outlook.com", "hotmail.com", "icloud.com", "aol.com"].includes(domain);

    if (role === "student") {
      // Validate student email domain (.edu, .ac.in, or custom)
      const isValidStudentDomain = domain.endsWith(".edu") || domain.endsWith(".ac.in");
      if (isPublicDomain || !isValidStudentDomain) {
        return errorResponse(
          "INVALID_DOMAIN",
          "Students must register with a valid college email domain (.edu or .ac.in)."
        );
      }

      const {
        name,
        college,
        branch,
        gradYear,
        cgpa,
        githubUrl,
        linkedinUrl,
        bio,
        resumeUrl,
        skills = [],
      } = body;

      // Upsert student profile
      const student = await prisma.student.upsert({
        where: { id: userId },
        update: {
          name: name || user.firstName || "Student",
          email,
          college,
          branch,
          gradYear: gradYear ? parseInt(gradYear) : null,
          cgpa: cgpa ? parseFloat(cgpa) : null,
          githubUrl,
          linkedinUrl,
          bio,
          resumeUrl,
        },
        create: {
          id: userId,
          name: name || user.firstName || "Student",
          email,
          college,
          branch,
          gradYear: gradYear ? parseInt(gradYear) : null,
          cgpa: cgpa ? parseFloat(cgpa) : null,
          githubUrl,
          linkedinUrl,
          bio,
          resumeUrl,
        },
      });

      // Synchronize skills
      if (skills && Array.isArray(skills)) {
        // Normalize skills to lowercase and trim
        const normalizedSkillNames = skills.map((s: string) => s.toLowerCase().trim()).filter(Boolean);

        // Find or create skills
        const skillIds: string[] = [];
        for (const name of normalizedSkillNames) {
          const dbSkill = await prisma.skill.upsert({
            where: { name },
            update: {},
            create: { name },
          });
          skillIds.push(dbSkill.id);
        }

        // Delete existing student skills
        await prisma.studentSkill.deleteMany({
          where: { studentId: userId },
        });

        // Add new student skills
        if (skillIds.length > 0) {
          await prisma.studentSkill.createMany({
            data: skillIds.map((skillId) => ({
              studentId: userId,
              skillId,
            })),
          });
        }
      }

      const updatedStudent = await prisma.student.findUnique({
        where: { id: userId },
        include: {
          skills: {
            include: {
              skill: true,
            },
          },
        },
      });

      return successResponse({ role: "student", profile: updatedStudent });
    } else {
      // Company domain validation (non-public domain)
      if (isPublicDomain) {
        return errorResponse(
          "INVALID_DOMAIN",
          "Companies must register with a corporate email domain (not gmail/yahoo/outlook)."
        );
      }

      const { name } = body;

      // Upsert company profile (defaults to approved = false)
      const company = await prisma.company.upsert({
        where: { id: userId },
        update: {
          name: name || "Company Name",
          email,
        },
        create: {
          id: userId,
          name: name || "Company Name",
          email,
          approved: false, // Must be approved by admin (or seeded true)
        },
      });

      return successResponse({ role: "company", profile: company });
    }
  } catch (error: any) {
    console.error("Profile update error:", error);
    return errorResponse("SERVER_ERROR", error.message || "Failed to update profile", 500);
  }
}
