# AI Usage Log

This project was built in collaboration with a pair programming assistant. 

### What was AI-Generated:
1. **Core Scaffolding:** Used `clerk init` CLI utility to initialize the Next.js App Router and set up the initial `@clerk/nextjs` middleware and provider layout structure.
2. **Database Layer:** Designed the Prisma schema models (Student, Company, Skill, Listing, Application, Notification) and generated the migrations and seed data script.
3. **Core Logic:** Coded the matching algorithm (calculating O(n) scores dynamically in-memory) and structured the notifications triggers.
4. **Backend API Handlers:** Structured all REST route handlers, implementing Postgres `FOR UPDATE` row-locking transactions for applications capacity enforcement.
5. **Frontend Views:** Created the unified profile builder with a live completeness score ring, the student feed, and the company applicant management boards.

### What was Modified/Guided:
- Customized database setup for Prisma v7 (requiring `prisma.config.ts` and `@prisma/adapter-pg` driver adapter setup).
- Tweaked Clerk redirects to route users dynamically to respective dashboards based on role profiles.
