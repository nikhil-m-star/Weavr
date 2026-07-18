type SkillRef = {
  skill?: { name: string };
  skillId?: string;
};

export type MatchStudent = {
  name?: string | null;
  college?: string | null;
  branch?: string | null;
  gradYear?: number | null;
  cgpa?: number | null;
  githubUrl?: string | null;
  linkedinUrl?: string | null;
  resumeUrl?: string | null;
  skills?: SkillRef[];
};

export type MatchListing = {
  createdAt: Date | string;
  targetBranch?: string | null;
  targetGradYear?: number | null;
  requiredSkills?: SkillRef[];
  preferredSkills?: SkillRef[];
};

function isFilled(value: unknown): boolean {
  return value !== null && value !== undefined && String(value).trim() !== "";
}

function extractSkillNames(items: SkillRef[] | undefined): string[] {
  return (items ?? [])
    .map((item) => (item.skill?.name ?? item.skillId ?? "").toLowerCase().trim())
    .filter(Boolean);
}

function skillMatchScore(studentSkills: Set<string>, listingSkills: string[]): number {
  if (listingSkills.length === 0) {
    return 100;
  }

  const matchCount = listingSkills.filter((skill) => studentSkills.has(skill)).length;
  return (matchCount / listingSkills.length) * 100;
}

function computeAlignmentScore(student: MatchStudent, listing: MatchListing): number {
  const branchScore =
    !listing.targetBranch || !isFilled(listing.targetBranch)
      ? 100
      : isFilled(student.branch) &&
          student.branch!.toLowerCase().trim() === listing.targetBranch.toLowerCase().trim()
        ? 100
        : 60;

  let yearScore: number;
  if (!listing.targetGradYear) {
    yearScore = 100;
  } else if (student.gradYear == null) {
    yearScore = 60;
  } else {
    yearScore = Math.max(0, 100 - Math.abs(student.gradYear - listing.targetGradYear) * 20);
  }

  return (branchScore + yearScore) / 2;
}

function computeCompletenessScore(student: MatchStudent): number {
  const filledFields = [
    isFilled(student.name),
    isFilled(student.college),
    isFilled(student.branch),
    student.gradYear != null,
    student.cgpa != null,
    (student.skills?.length ?? 0) >= 1,
    isFilled(student.githubUrl) || isFilled(student.linkedinUrl),
    isFilled(student.resumeUrl),
  ].filter(Boolean).length;

  return (filledFields / 8) * 100;
}

function computeRecencyScore(listing: MatchListing, referenceDate: Date): number {
  const createdAt = new Date(listing.createdAt);
  const daysOld = Math.max(0, (referenceDate.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24));
  return 100 * Math.exp(-daysOld / 30);
}

export function computeMatchScore(
  student: MatchStudent,
  listing: MatchListing,
  referenceDate: Date = new Date()
): number {
  const studentSkills = new Set(extractSkillNames(student.skills));
  const requiredSkills = extractSkillNames(listing.requiredSkills);
  const preferredSkills = extractSkillNames(listing.preferredSkills);

  const requiredSkillMatch = skillMatchScore(studentSkills, requiredSkills);
  const preferredSkillMatch = skillMatchScore(studentSkills, preferredSkills);
  const alignmentScore = computeAlignmentScore(student, listing);
  const completenessScore = computeCompletenessScore(student);
  const recencyScore = computeRecencyScore(listing, referenceDate);

  const score =
    0.4 * requiredSkillMatch +
    0.2 * preferredSkillMatch +
    0.15 * alignmentScore +
    0.15 * completenessScore +
    0.1 * recencyScore;

  return Math.round(Math.min(100, Math.max(0, score)));
}
