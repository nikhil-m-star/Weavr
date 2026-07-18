import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { successResponse, errorResponse } from "@/lib/api-response";

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) {
    return errorResponse("UNAUTHORIZED", "Not authenticated", 401);
  }

  try {
    const body = await req.json().catch(() => ({}));
    const { ids } = body;

    const where: any = {
      recipientId: userId,
    };

    if (ids && Array.isArray(ids)) {
      where.id = { in: ids };
    }

    const result = await prisma.notification.updateMany({
      where,
      data: {
        read: true,
      },
    });

    return successResponse({
      updatedCount: result.count,
      message: `Successfully marked ${result.count} notifications as read`,
    });
  } catch (error: any) {
    console.error("Mark notifications read error:", error);
    return errorResponse("SERVER_ERROR", error.message || "Failed to mark notifications read", 500);
  }
}
