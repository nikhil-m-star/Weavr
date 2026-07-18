import { config } from "dotenv";
config({ path: ".env.local" });
import { PrismaClient } from "./generated-client/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL is not defined in the environment");
}

const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("Seeding database...");

  // Clean up existing data (in reverse dependency order)
  await prisma.notification.deleteMany();
  await prisma.application.deleteMany();
  await prisma.listingRequiredSkill.deleteMany();
  await prisma.listingPreferredSkill.deleteMany();
  await prisma.listing.deleteMany();
  await prisma.studentSkill.deleteMany();
  await prisma.student.deleteMany();
  await prisma.company.deleteMany();
  await prisma.skill.deleteMany();

  // Seed default skills
  const skillsToSeed = [
    "react",
    "typescript",
    "next.js",
    "postgresql",
    "node.js",
    "python",
    "docker",
    "tailwind css",
    "prisma",
    "go",
    "rust",
  ];

  console.log("Seeding skills...");
  for (const name of skillsToSeed) {
    await prisma.skill.upsert({
      where: { name },
      update: {},
      create: { name },
    });
  }

  // Seed one approved demo company
  // In a real Clerk app, the company ID would be their Clerk user ID (e.g. user_...).
  // We'll create a demo company with a mock ID for dev testing.
  console.log("Seeding demo company...");
  await prisma.company.create({
    data: {
      id: "company_demo_clerk_id",
      name: "Acme Corp",
      email: "recruiting@acme.edu",
      approved: true,
    },
  });

  console.log("Database seeded successfully!");
}

main()
  .catch((e) => {
    console.error("Error seeding database:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
