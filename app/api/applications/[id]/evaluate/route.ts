import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { successResponse, errorResponse } from "@/lib/api-response";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { userId } = await auth();

  if (!userId) {
    return errorResponse("UNAUTHORIZED", "Not authenticated", 401);
  }

  const apiKey = process.env.NVIDIA_API_KEY;
  if (!apiKey) {
    return errorResponse(
      "NVIDIA_API_KEY_MISSING",
      "NVIDIA NIM API Key is not configured on the server. Please add NVIDIA_API_KEY to your environment.",
      500
    );
  }

  try {
    // 1. Fetch application details, listing details, and student profile
    const application = await prisma.application.findUnique({
      where: { id },
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

    if (!application) {
      return errorResponse("NOT_FOUND", "Application not found", 404);
    }

    // Verify company permission
    if (application.listing.companyId !== userId) {
      return errorResponse("FORBIDDEN", "Only the listing owner can run evaluations", 403);
    }

    const { listing, student } = application;

    // 2. Prepare the prompt for LLM evaluation
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

    // 3. Make the API request to NVIDIA NIM
    const response = await fetch("https://integrate.api.nvidia.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "meta/llama-3.1-70b-instruct",
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
      const errText = await response.text();
      console.error("NVIDIA NIM API Error:", errText);
      return errorResponse("NIM_API_ERROR", `NVIDIA NIM responded with error: ${response.status}`, 502);
    }

    const responseData = await response.json();
    const content = responseData.choices?.[0]?.message?.content?.trim() || "";

    // 4. Parse the LLM JSON response
    let parsedResult;
    try {
      // Clean up LLM response just in case it wraps it in ```json ... ```
      const cleanedContent = content.replace(/^```json\s*/i, "").replace(/```$/, "").trim();
      parsedResult = JSON.parse(cleanedContent);
    } catch (parseError) {
      console.error("Failed to parse NIM JSON response:", content);
      return errorResponse("NIM_RESPONSE_PARSE_FAILED", "Failed to parse evaluation response as JSON.", 502);
    }

    const { score, feedback } = parsedResult;

    if (score === undefined || !feedback) {
      return errorResponse("INVALID_NIM_OUTPUT", "NIM output did not contain score or feedback fields.", 502);
    }

    // 5. Save the evaluation to the database
    const updatedApplication = await prisma.application.update({
      where: { id },
      data: {
        nimScore: parseFloat(score),
        nimFeedback: feedback,
        nimEvaluatedAt: new Date(),
      },
    });

    return successResponse(updatedApplication);
  } catch (error: any) {
    console.error("NIM evaluation error:", error);
    return errorResponse("SERVER_ERROR", error.message || "Failed to execute NIM evaluation", 500);
  }
}
