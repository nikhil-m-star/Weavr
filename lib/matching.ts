import { Student, Listing } from "../prisma/generated-client/client";

export function calculateCompleteness(student: any): number {
  // completeness = filled fields / total fields * 100
  // fields: name, email, college, branch, gradYear, cgpa, githubUrl, linkedinUrl, bio, resumeUrl, skills (at least one)
  const fields = [
    student.name,
    student.email,
    student.college,
    student.branch,
    student.gradYear,
    student.cgpa,
    student.githubUrl,
    student.linkedinUrl,
    student.bio,
    student.resumeUrl,
  ];

  let filledCount = fields.filter((f) => f !== null && f !== undefined && String(f).trim() !== "").length;
  
  // check if student has at least one skill
  if (student.skills && student.skills.length > 0) {
    filledCount += 1;
  }

  const totalFields = 11;
  return Math.round((filledCount / totalFields) * 100);
}

export function calculateMatchScore(student: any, listing: any): number {
  // Weights:
  // - Required skill overlap: 40%
  // - Preferred skill overlap: 20%
  // - Branch/gradYear alignment: 15% (soft penalty curve)
  // - Profile completeness: 15%
  // - Recency decay: 10%

  const studentSkillIds = new Set((student.skills || []).map((s: any) => s.skillId));

  // 1. Required skill overlap (40%)
  let requiredScore = 40;
  if (listing.requiredSkills && listing.requiredSkills.length > 0) {
    const requiredSkillIds = listing.requiredSkills.map((rs: any) => rs.skillId);
    const matchedRequired = requiredSkillIds.filter((id: string) => studentSkillIds.has(id)).length;
    requiredScore = (matchedRequired / requiredSkillIds.length) * 40;
  }

  // 2. Preferred skill overlap (20%)
  let preferredScore = 20;
  if (listing.preferredSkills && listing.preferredSkills.length > 0) {
    const preferredSkillIds = listing.preferredSkills.map((ps: any) => ps.skillId);
    const matchedPreferred = preferredSkillIds.filter((id: string) => studentSkillIds.has(id)).length;
    preferredScore = (matchedPreferred / preferredSkillIds.length) * 20;
  }

  // 3. Branch/gradYear alignment (15%)
  // Soft penalty curve:
  // Branch alignment: 7.5%
  // GradYear alignment: 7.5%
  let branchScore = 7.5;
  if (listing.targetBranch && student.branch) {
    if (student.branch.toLowerCase().trim() !== listing.targetBranch.toLowerCase().trim()) {
      branchScore = 2.5; // soft penalty
    }
  }

  let gradYearScore = 7.5;
  if (listing.targetGradYear && student.gradYear) {
    const diff = Math.abs(student.gradYear - listing.targetGradYear);
    if (diff === 0) {
      gradYearScore = 7.5;
    } else if (diff === 1) {
      gradYearScore = 5.0; // small penalty
    } else if (diff === 2) {
      gradYearScore = 2.5; // moderate penalty
    } else {
      gradYearScore = 0; // high penalty
    }
  }

  const alignmentScore = branchScore + gradYearScore;

  // 4. Profile completeness (15%)
  const completeness = calculateCompleteness(student);
  const completenessScore = (completeness / 100) * 15;

  // 5. Recency decay (10%)
  // Exponential decay over 30 days: score = 10 * exp(-days / 30)
  const now = new Date();
  const createdDate = new Date(listing.createdAt || now);
  const diffTime = Math.abs(now.getTime() - createdDate.getTime());
  const diffDays = diffTime / (1000 * 60 * 60 * 24);
  const recencyScore = 10 * Math.exp(-diffDays / 30);

  const totalScore = requiredScore + preferredScore + alignmentScore + completenessScore + recencyScore;
  return Math.min(100, Math.max(0, Math.round(totalScore)));
}
