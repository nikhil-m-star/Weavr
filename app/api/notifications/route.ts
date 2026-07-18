import { auth } from "@clerk/nextjs/server";
import { prisma } from "../../../lib/prisma";
import { successResponse, errorResponse } from "../../../lib/api-response";

export async function GET(req: Request) {
  const { userId } = await auth();
  if (!userId) {
    return errorResponse("UNAUTHORIZED", "Not authenticated", 401);
  }

  const { searchParams } = new URL(req.url);
  const readParam = searchParams.get("read");
  const pageParam = searchParams.get("page") || "1";
  const limitParam = searchParams.get("limit") || "10";

  try {
    const page = Math.max(1, parseInt(pageParam));
    const limit = Math.max(1, parseInt(limitParam));
    const skip = (page - 1) * limit;

    const where: any = {
      recipientId: userId,
    };

    if (readParam !== null) {
      where.read = readParam === "true";
    }

    const [notifications, total] = await Promise.all([
      prisma.notification.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.notification.count({ where }),
    ]);

    return successResponse({
      notifications,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error: any) {
    console.error("Fetch notifications error:", error);
    return errorResponse("SERVER_ERROR", error.message || "Failed to fetch notifications", 500);
  }
}
