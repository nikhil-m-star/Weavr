

export function calculateCompleteness(student: any): number {
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
  if (student.skills && student.skills.length > 0) {
    filledCount += 1;
  }

  const totalFields = 11;
  return Math.round((filledCount / totalFields) * 100);
}

export function calculateMatchScore(student: any, listing: any): number {
  // Simple local semantic match score (approximating AI evaluation instantly)
  const studentSkills = (student.skills || []).map((s: any) => s.skill?.name || s.skillId || "");
  const requiredSkills = (listing.requiredSkills || []).map((rs: any) => rs.skill?.name || rs.skillId || "");
  const preferredSkills = (listing.preferredSkills || []).map((ps: any) => ps.skill?.name || ps.skillId || "");

  const studentSet = new Set(studentSkills.map((s: string) => s.toLowerCase().trim()));
  
  let matchCount = 0;
  let totalMatchable = 0;

  if (requiredSkills.length > 0) {
    totalMatchable += requiredSkills.length * 2;
    requiredSkills.forEach((s: string) => {
      if (studentSet.has(s.toLowerCase().trim())) {
        matchCount += 2;
      }
    });
  }

  if (preferredSkills.length > 0) {
    totalMatchable += preferredSkills.length;
    preferredSkills.forEach((s: string) => {
      if (studentSet.has(s.toLowerCase().trim())) {
        matchCount += 1;
      }
    });
  }

  const jobText = (listing.title + " " + listing.description + " " + (listing.targetBranch || "")).toLowerCase();
  const studentText = (student.branch + " " + student.bio).toLowerCase();
  
  const keywords = ["react", "node", "typescript", "python", "postgres", "next.js", "go", "rust", "docker", "machine learning", "ai"];
  keywords.forEach(kw => {
    if (jobText.includes(kw) && studentText.includes(kw)) {
      matchCount += 0.5;
      totalMatchable += 0.5;
    }
  });

  const baseScore = totalMatchable > 0 ? (matchCount / totalMatchable) * 100 : 70;
  return Math.min(100, Math.max(0, Math.round(baseScore)));
}

export async function evaluateApplicationWithNIM(applicationId: string) {
  const { prisma } = await import("./prisma");
  const apiKey = process.env.NVIDIA_API_KEY;
  if (!apiKey) {
    console.error("NVIDIA NIM API Key not configured.");
    return;
  }

  try {
    const application = await prisma.application.findUnique({
      where: { id: applicationId },
      include: {
        listing: {
          include: {
            requiredSkills: { include: { skill: true } },
            preferredSkills: { include: { skill: true } },
          },
        },
        student: {
          include: {
            skills: { include: { skill: true } },
          },
        },
      },
    });

    if (!application) return;

    const { listing, student } = application;

    const prompt = `
You are a professional HR technical recruiter. Evaluate the following student candidate's fit for the job listing.
Compare their skills, educational background, and alignment.

JOB OPPORTUNITY:
Title: ${listing.title}
Description: ${listing.description}
Required Skills: ${listing.requiredSkills.map((rs: any) => rs.skill.name).join(", ") || "None"}
Preferred Skills: ${listing.preferredSkills.map((ps: any) => ps.skill.name).join(", ") || "None"}
Target Branch: ${listing.targetBranch || "Any"}
Target Graduation Year: ${listing.targetGradYear || "Any"}

CANDIDATE PROFILE:
Name: ${student.name}
College: ${student.college || "N/A"}
Branch: ${student.branch || "N/A"}
Graduation Year: ${student.gradYear || "N/A"}
CGPA: ${student.cgpa || "N/A"}
Bio: ${student.bio || "N/A"}
Skills: ${student.skills.map((ss: any) => ss.skill.name).join(", ") || "None"}

You must provide a professional, strict evaluation.
Respond ONLY with a valid JSON object in this exact schema, without any markdown formatting or prefix wrappers:
{
  "score": <integer score from 0 to 100 representing suitability fit>,
  "feedback": "<Consolidated qualitative evaluation: bulleted Pros, Cons, and overall recommendation>"
}
`;

    const response = await fetch("https://integrate.api.nvidia.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "meta/llama-3.1-8b-instruct",
        messages: [
          {
            role: "system",
            content: "You are a professional HR assistant that outputs structured evaluation data in JSON format.",
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        temperature: 0.2,
        max_tokens: 1024,
      }),
    });

    if (!response.ok) {
      console.error("NIM evaluation response not ok:", response.statusText);
      return;
    }

    const responseData = await response.json();
    const content = responseData.choices?.[0]?.message?.content?.trim() || "";
    const cleanedContent = content.replace(/^```json\s*/i, "").replace(/```$/, "").trim();
    const parsedResult = JSON.parse(cleanedContent);
    const { score, feedback } = parsedResult;

    if (score !== undefined && feedback) {
      await prisma.application.update({
        where: { id: applicationId },
        data: {
          nimScore: parseFloat(score),
          nimFeedback: feedback,
          nimEvaluatedAt: new Date(),
        },
      });
      console.log(`Successfully auto-evaluated application ${applicationId} with NIM AI score ${score}%`);
    }
  } catch (error) {
    console.error("Auto evaluation with NIM failed:", error);
  }
}
