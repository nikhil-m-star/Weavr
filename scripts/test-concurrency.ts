import { config } from "dotenv";
config({ path: ".env.local" });
import { PrismaClient } from "../prisma/generated-client/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL is not defined in the environment");
}

const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function runTest() {
  console.log("=== STARTING CONCURRENCY RACE CONDITION TEST ===");

  // 1. Setup Test Data
  const companyId = "test_company_concurrency";
  const listingId = "test_listing_concurrency";
  const studentIds = [
    "test_student_1",
    "test_student_2",
    "test_student_3",
    "test_student_4",
  ];

  // Clean up any stale test data
  await prisma.application.deleteMany({
    where: { listingId },
  });
  await prisma.listingRequiredSkill.deleteMany({
    where: { listingId },
  });
  await prisma.listingPreferredSkill.deleteMany({
    where: { listingId },
  });
  await prisma.listing.deleteMany({
    where: { id: listingId },
  });
  await prisma.company.deleteMany({
    where: { id: companyId },
  });
  await prisma.studentSkill.deleteMany({
    where: { studentId: { in: studentIds } },
  });
  await prisma.student.deleteMany({
    where: { id: { in: studentIds } },
  });

  // Create Company
  await prisma.company.create({
    data: {
      id: companyId,
      name: "Concurrency Test Corp",
      email: "concurrency@test.corp",
      approved: true,
    },
  });

  // Create Listing with capacity = 2
  const maxApplicants = 2;
  await prisma.listing.create({
    data: {
      id: listingId,
      companyId,
      title: "Concurrent Target Role",
      description: "Testing race conditions under high concurrent applications load",
      stipend: 5000,
      location: "REMOTE",
      deadline: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7), // 7 days from now
      maxApplicants,
      currentApplicants: 0,
      status: "ACTIVE",
    },
  });

  // Create Students
  for (let i = 0; i < studentIds.length; i++) {
    await prisma.student.create({
      data: {
        id: studentIds[i],
        name: `Concurrent Student ${i + 1}`,
        email: `student${i + 1}@college.edu`,
        college: "Tech College",
        branch: "CS",
        gradYear: 2026,
        cgpa: 9.0,
        verified: true,
      },
    });
  }

  console.log("Test database state prepared.");
  console.log(`Listing ID: ${listingId} | Max Applicants Cap: ${maxApplicants}`);
  console.log(`Attempting concurrent applications by ${studentIds.length} students...`);

  // 2. Define applying transaction (simulating app/api/applications/route.ts)
  const applyTx = async (studentId: string) => {
    return await prisma.$transaction(async (tx) => {
      // Row lock the listing using FOR UPDATE
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

      if (listing.currentApplicants >= listing.maxApplicants) {
        throw new Error("LISTING_CAP_REACHED");
      }

      // Create application
      const application = await tx.application.create({
        data: {
          studentId,
          listingId,
          status: "SUBMITTED",
        },
      });

      // Increment denormalized count
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

      return application;
    });
  };

  // 3. Fire all applications concurrently
  const promises = studentIds.map((sid) => applyTx(sid));
  const results = await Promise.allSettled(promises);

  // 4. Evaluate results
  let successCount = 0;
  let failureCount = 0;
  const failureReasons: string[] = [];

  results.forEach((res, index) => {
    if (res.status === "fulfilled") {
      successCount++;
      console.log(`✓ Student ${index + 1} application SUCCEEDED`);
    } else {
      failureCount++;
      failureReasons.push(res.reason.message);
      console.log(`✗ Student ${index + 1} application REJECTED: ${res.reason.message}`);
    }
  });

  // Verify DB state
  const finalListing = await prisma.listing.findUnique({
    where: { id: listingId },
  });

  const finalApplications = await prisma.application.findMany({
    where: { listingId },
  });

  console.log("\n=== TEST RESULTS ===");
  console.log(`Succeeded: ${successCount} (Expected: ${maxApplicants})`);
  console.log(`Rejected: ${failureCount} (Expected: ${studentIds.length - maxApplicants})`);
  console.log(`Listing Current Applicants Count in DB: ${finalListing?.currentApplicants} (Expected: ${maxApplicants})`);
  console.log(`Listing Status in DB: ${finalListing?.status} (Expected: CLOSED)`);
  console.log(`Listing Closed Reason in DB: ${finalListing?.closedReason} (Expected: AUTO_CAP)`);
  console.log(`Total Applications Created in DB: ${finalApplications.length} (Expected: ${maxApplicants})`);

  // Assertions
  const ok =
    successCount === maxApplicants &&
    failureCount === (studentIds.length - maxApplicants) &&
    finalListing?.currentApplicants === maxApplicants &&
    finalListing?.status === "CLOSED" &&
    finalListing?.closedReason === "AUTO_CAP" &&
    finalApplications.length === maxApplicants;

  if (ok) {
    console.log("\n★★★ CONCURRENCY TEST PASSED! No race conditions, cap strictly respected! ★★★");
  } else {
    console.error("\n☆☆☆ CONCURRENCY TEST FAILED! Race conditions allowed double-accepts. ☆☆☆");
    process.exit(1);
  }

  // 5. Clean up
  await prisma.application.deleteMany({
    where: { listingId },
  });
  await prisma.listing.deleteMany({
    where: { id: listingId },
  });
  await prisma.company.deleteMany({
    where: { id: companyId },
  });
  await prisma.student.deleteMany({
    where: { id: { in: studentIds } },
  });
}

runTest()
  .catch((e) => {
    console.error("Test execution failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
