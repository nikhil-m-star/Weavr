import { prisma } from "@/lib/prisma";
import { successResponse, errorResponse } from "@/lib/api-response";

export async function GET() {
  try {
    const skills = await prisma.skill.findMany({
      orderBy: { name: "asc" },
    });
    return successResponse(skills);
  } catch (error: any) {
    console.error("Fetch skills error:", error);
    return errorResponse("SERVER_ERROR", error.message || "Failed to fetch skills", 500);
  }
}
