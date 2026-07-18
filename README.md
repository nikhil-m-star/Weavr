# Weavr — Talent Matching Platform

Weavr is a minimalist talent matching platform built with Next.js 16, Prisma 7, Neon PostgreSQL, and Clerk authentication.

## Local Setup (Under 5 Minutes)

### 1. Prerequisites & Environment Variables
Ensure you have Node.js installed. Create or configure your `.env.local` file in the root directory. You must include the following keys:

```bash
# Clerk Keys (provided during clerk init)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...

# Neon PostgreSQL Database Connection URL
DATABASE_URL="postgresql://neondb_owner:npg_hTgV3vPy2dNW@ep-polished-smoke-azg6kai7-pooler.c-3.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require"
```

### 2. Install Dependencies
Run the following command to install all packages:
```bash
npm install
```

### 3. Generate Prisma Client & Run Migrations
Initialize and sync the Neon database tables:
```bash
npx prisma migrate dev --name init
npx prisma generate
```

### 4. Seed the Database
Populate initial skills (React, TypeScript, Docker, etc.) and a demo approved company:
```bash
npx tsx prisma/seed.ts
```

### 5. Start Development Server
Start the local server:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to test the application!

## Testing Concurrency
To run the automated concurrency race condition test script:
```bash
npx tsx scripts/test-concurrency.ts
```

This verifies the safety of application submissions under high concurrent load using PostgreSQL row locking (`FOR UPDATE`).
