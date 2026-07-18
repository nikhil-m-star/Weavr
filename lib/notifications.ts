import { prisma } from "./prisma";

export async function createNotification(
  recipientType: "STUDENT" | "COMPANY",
  recipientId: string,
  message: string
) {
  try {
    return await prisma.notification.create({
      data: {
        recipientType,
        recipientId,
        message,
        read: false,
      },
    });
  } catch (error) {
    console.error("Failed to create notification:", error);
  }
}
