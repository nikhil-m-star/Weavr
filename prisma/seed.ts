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
  console.log("Seeding database with matching mock data...");

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

  // 1. Seed Skills
  const skillsList = [
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
    "c++",
    "java",
    "kubernetes",
    "aws",
    "graphql",
    "git",
    "pytorch",
    "tensorflow",
  ];

  console.log("Creating core skills...");
  const skillMap: Record<string, any> = {};
  for (const name of skillsList) {
    const s = await prisma.skill.create({
      data: { name },
    });
    skillMap[name] = s;
  }

  // 2. Seed Demo Company
  console.log("Creating demo company...");
  const company = await prisma.company.create({
    data: {
      id: "company_demo_clerk_id",
      name: "Acme Corp",
      email: "recruiting@acme.edu",
    },
  });

  // 3. Seed Job Listings
  console.log("Creating job listings...");
  
  // Listing 1: Frontend Intern
  const frontendJob = await prisma.listing.create({
    data: {
      id: "job_frontend_intern",
      companyId: company.id,
      title: "Frontend Engineer Intern",
      description: "Join the Acme frontend product engineering team. You will craft responsive glassmorphic student dashboards and implement high-performance React application engines.",
      stipend: 2000,
      location: "REMOTE",
      deadline: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000), // 15 days from now
      maxApplicants: 5,
      targetBranch: "Computer Science",
      targetGradYear: 2026,
      status: "ACTIVE",
    },
  });
  
  await prisma.listingRequiredSkill.createMany({
    data: [
      { listingId: frontendJob.id, skillId: skillMap["react"].id },
      { listingId: frontendJob.id, skillId: skillMap["typescript"].id },
    ],
  });
  await prisma.listingPreferredSkill.createMany({
    data: [
      { listingId: frontendJob.id, skillId: skillMap["next.js"].id },
      { listingId: frontendJob.id, skillId: skillMap["tailwind css"].id },
    ],
  });

  // Listing 2: Backend Developer
  const backendJob = await prisma.listing.create({
    data: {
      id: "job_backend_dev",
      companyId: company.id,
      title: "Backend Systems Developer",
      description: "Scale core systems, integrate connection-pool database management, and coordinate transaction safety rules on our backend pipelines.",
      stipend: 2500,
      location: "HYBRID",
      deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
      maxApplicants: 3,
      targetBranch: "Computer Science",
      targetGradYear: 2026,
      status: "ACTIVE",
    },
  });

  await prisma.listingRequiredSkill.createMany({
    data: [
      { listingId: backendJob.id, skillId: skillMap["node.js"].id },
      { listingId: backendJob.id, skillId: skillMap["postgresql"].id },
    ],
  });
  await prisma.listingPreferredSkill.createMany({
    data: [
      { listingId: backendJob.id, skillId: skillMap["go"].id },
      { listingId: backendJob.id, skillId: skillMap["docker"].id },
    ],
  });

  // Listing 3: AI/ML Developer
  const aiJob = await prisma.listing.create({
    data: {
      id: "job_ai_ml",
      companyId: company.id,
      title: "Machine Learning Researcher",
      description: "Leverage state of the art LLM fine-tuning mechanisms, integrate NVIDIA NIM microservices, and optimize prompt models.",
      stipend: 3200,
      location: "ONSITE",
      deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
      maxApplicants: 2,
      targetBranch: "Mathematics & Computing",
      targetGradYear: 2025,
      status: "ACTIVE",
    },
  });

  await prisma.listingRequiredSkill.createMany({
    data: [
      { listingId: aiJob.id, skillId: skillMap["python"].id },
    ],
  });
  await prisma.listingPreferredSkill.createMany({
    data: [
      { listingId: aiJob.id, skillId: skillMap["pytorch"].id },
      { listingId: aiJob.id, skillId: skillMap["tensorflow"].id },
    ],
  });

  // 4. Seed Mock Students
  console.log("Creating candidate profiles...");
  
  // Student 1: Alice (Frontend Expert)
  const studentAlice = await prisma.student.create({
    data: {
      id: "student_alice_clerk_id",
      name: "Alice Smith",
      email: "alice.smith@college.edu",
      college: "Global Tech Institute",
      branch: "Computer Science",
      gradYear: 2026,
      cgpa: 9.3,
      githubUrl: "https://github.com",
      linkedinUrl: "https://linkedin.com",
      resumeUrl: "https://resume.com/alice",
      bio: "Aspiring frontend developer passionate about building high-fidelity visual web applications, layout animations, and dark-mode glassmorphism panels.",
    },
  });
  await prisma.studentSkill.createMany({
    data: [
      { studentId: studentAlice.id, skillId: skillMap["react"].id },
      { studentId: studentAlice.id, skillId: skillMap["typescript"].id },
      { studentId: studentAlice.id, skillId: skillMap["next.js"].id },
      { studentId: studentAlice.id, skillId: skillMap["tailwind css"].id },
      { studentId: studentAlice.id, skillId: skillMap["git"].id },
    ],
  });

  // Student 2: Bob (Backend Expert)
  const studentBob = await prisma.student.create({
    data: {
      id: "student_bob_clerk_id",
      name: "Bob Jones",
      email: "bob.jones@college.edu",
      college: "State Engineering College",
      branch: "Computer Science",
      gradYear: 2026,
      cgpa: 8.7,
      githubUrl: "https://github.com",
      linkedinUrl: "https://linkedin.com",
      resumeUrl: "https://resume.com/bob",
      bio: "Backend developer focused on relational schema design, transactional SQL operations, API reliability, and Dockerized microservice layers.",
    },
  });
  await prisma.studentSkill.createMany({
    data: [
      { studentId: studentBob.id, skillId: skillMap["node.js"].id },
      { studentId: studentBob.id, skillId: skillMap["postgresql"].id },
      { studentId: studentBob.id, skillId: skillMap["go"].id },
      { studentId: studentBob.id, skillId: skillMap["docker"].id },
    ],
  });

  // Student 3: Charlie (ML Scholar)
  const studentCharlie = await prisma.student.create({
    data: {
      id: "student_charlie_clerk_id",
      name: "Charlie Green",
      email: "charlie.green@college.edu",
      college: "Academy of Mathematics",
      branch: "Mathematics & Computing",
      gradYear: 2025,
      cgpa: 9.6,
      githubUrl: "https://github.com",
      linkedinUrl: "https://linkedin.com",
      resumeUrl: "https://resume.com/charlie",
      bio: "Research scholar centered around machine learning architectures, statistical model fitting, and deep learning pipelines.",
    },
  });
  await prisma.studentSkill.createMany({
    data: [
      { studentId: studentCharlie.id, skillId: skillMap["python"].id },
      { studentId: studentCharlie.id, skillId: skillMap["pytorch"].id },
      { studentId: studentCharlie.id, skillId: skillMap["git"].id },
    ],
  });

  // 5. Seed Pre-submitted Applications
  console.log("Submitting candidate applications...");
  
  // Alice applies to Frontend Intern
  await prisma.application.create({
    data: {
      studentId: studentAlice.id,
      listingId: frontendJob.id,
      status: "SUBMITTED",
    },
  });

  // Bob applies to Backend Dev
  await prisma.application.create({
    data: {
      studentId: studentBob.id,
      listingId: backendJob.id,
      status: "UNDER_REVIEW",
    },
  });

  // Charlie applies to AI/ML Job
  await prisma.application.create({
    data: {
      studentId: studentCharlie.id,
      listingId: aiJob.id,
      status: "SUBMITTED",
    },
  });

  console.log("Database seeded successfully with lists, profiles, and applications!");
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
