# Weavr — AI Talent Matching Engine

Weavr is an immersive, high-contrast, dark-mode talent matching platform designed for students and recruiters. Built on Next.js 16 (App Router), Prisma 7, Neon PostgreSQL, Clerk Authentication, and powered by NVIDIA NIM AI evaluations.

---

## 🎬 Cinematic Style Design Specification
Weavr implements a premium **Cinematic Dark Mode** style:
- **Base Canvas**: Solid black `#050505` with translucent `#111111` card surfaces (`glass-card`).
- **Typography**: Editorial, high-contrast uppercase labels, and wide letter spacing (`tracking-[0.2em]`).
- **Accent Flows**: Interactive linear gradients from Cyan (`#06B6D4`) to Pink (`#EC4899`) for primary actions, and deep Violet glows (`#7C3AED`) for match ratings.
- **Glassmorphism**: Glass-like panels using `backdrop-filter: blur(8px)` and high-contrast boundaries (`border-white/10`).

---

## ⚡ Key Features

### 1. Unified Student & Recruiter Flows
- **Authentication**: Handled via secure, zero-layout Clerk modules.
- **Student Profile Builder**: Input college parameters, branching, GPA, external portfolio links, and skills (complete with autocomplete tags and a live progress score ring).
- **Matching Feed**: Automatic, read-time matching algorithms sorting internships for students.
- **Recruiter Dashboard**: Post opportunities, manage status pipelines (Draft, Active, Closed), review applicants, or execute bulk updates.

### 2. $O(n)$ Dynamic Matching Score
Opportunity matching is computed in-memory in a single pass to ensure high performance. The formula aggregates five weighted components:
- **Required Core Skills (40%)**: Overlap between student skills and mandatory job requirements.
- **Preferred Skills (20%)**: Extra points for matches with listed preferred skillsets.
- **Academic Alignment (15%)**: Evaluates major branch match and graduation year proximity using a soft decay penalty.
- **Profile Completeness (15%)**: Incentivizes candidates to input complete bios, GPAs, and links.
- **Recency Boost (10%)**: Time-decay scoring prioritising recently posted opportunities.

### 3. NVIDIA NIM AI Recruiter evaluations
- Integrated with NVIDIA's hosted inference microservice running `meta/llama-3.1-70b-instruct`.
- Evaluates individual candidate profiles against job descriptions.
- Returns a structured AI fit score (0-100) and qualitative pros/cons reviewer summaries, saved directly in PostgreSQL.

### 4. Transaction-Safe Concurrency Caps
- Enforces strict capacity limits on active job postings.
- Applies PostgreSQL transactional row-locking (`SELECT ... FOR UPDATE`) in `app/api/applications/route.ts` to queue submissions, eliminating race condition cap overflows.
- Automatically reopens listings if a student withdraws an application.

---

## 🛠️ Local Setup (Under 5 Minutes)

### 1. Prerequisites & Environment Variables
Ensure you have Node.js (v18+) installed. Create a `.env.local` file in your root folder:
```bash
# Clerk Keys (provided during clerk init)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...

# Clerk redirect routes
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL=/
NEXT_PUBLIC_CLERK_SIGN_UP_FALLBACK_REDIRECT_URL=/

# Neon PostgreSQL Database Connection URL
DATABASE_URL="postgresql://neondb_owner:<YOUR_PASSWORD>@<YOUR_NEON_HOST>/neondb?sslmode=require&channel_binding=require"

# NVIDIA NIM API Key (needed for AI applicant evaluations)
NVIDIA_API_KEY=nvapi-...
```

### 2. Install Project Dependencies
```bash
npm install
```

### 3. Generate Database Client & Schema
Sync Neon tables using Prisma migration workflows:
```bash
npx prisma migrate dev --name init
npx prisma generate
```

### 4. Seed Autocomplete Skillsets
Populate basic technical skills and a default approved company:
```bash
npx tsx prisma/seed.ts
```

### 5. Launch Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) to view the live platform!

---

## 🔬 Testing Pipelines

### 1. Concurrency Race Condition Test
Run the concurrent application submissions script:
```bash
npx tsx scripts/test-concurrency.ts
```
*Vindicates transaction locking safety by attempting 4 simultaneous student applications on a listing capped at 2, verifying exactly 2 succeed and 2 are safely rejected.*

### 2. Verify Compilation
Verify TypeScript and Next.js static asset compilations locally:
```bash
npm run build
```
