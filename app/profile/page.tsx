"use client";

import { useUser } from "@clerk/nextjs";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function Profile() {
  const { isLoaded, isSignedIn, user } = useUser();
  const router = useRouter();

  const [role, setRole] = useState<"student" | "company" | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [allSkills, setAllSkills] = useState<{ id: string; name: string }[]>([]);

  // Student Fields
  const [name, setName] = useState("");
  const [college, setCollege] = useState("");
  const [branch, setBranch] = useState("");
  const [gradYear, setGradYear] = useState("");
  const [cgpa, setCgpa] = useState("");
  const [githubUrl, setGithubUrl] = useState("");
  const [linkedinUrl, setLinkedinUrl] = useState("");
  const [bio, setBio] = useState("");
  const [resumeUrl, setResumeUrl] = useState("");
  const [skills, setSkills] = useState<string[]>([]);
  const [skillInput, setSkillInput] = useState("");

  // Company Fields
  const [companyName, setCompanyName] = useState("");
  const [companyApproved, setCompanyApproved] = useState(false);

  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      router.push("/");
      return;
    }

    if (isLoaded && isSignedIn) {
      // Fetch skills list
      fetch("/api/skills")
        .then((res) => res.json())
        .then((res) => {
          if (res.success) {
            setAllSkills(res.data);
          }
        });

      // Fetch current profile if any
      fetch("/api/profile")
        .then((res) => res.json())
        .then((res) => {
          if (res.success && res.data.role) {
            setRole(res.data.role);
            if (res.data.role === "student") {
              const p = res.data.profile;
              setName(p.name || "");
              setCollege(p.college || "");
              setBranch(p.branch || "");
              setGradYear(p.gradYear ? String(p.gradYear) : "");
              setCgpa(p.cgpa ? String(p.cgpa) : "");
              setGithubUrl(p.githubUrl || "");
              setLinkedinUrl(p.linkedinUrl || "");
              setBio(p.bio || "");
              setResumeUrl(p.resumeUrl || "");
              setSkills((p.skills || []).map((s: any) => s.skill.name));
            } else if (res.data.role === "company") {
              const p = res.data.profile;
              setCompanyName(p.name || "");
              setCompanyApproved(p.approved);
            }
          } else {
            setName(user?.firstName || "");
          }
          setLoading(false);
        })
        .catch(() => {
          setLoading(false);
        });
    }
  }, [isLoaded, isSignedIn, user, router]);

  // Calculate live completeness score for Student
  const completenessScore = (() => {
    if (role !== "student") return 0;
    const fields = [name, college, branch, gradYear, cgpa, githubUrl, linkedinUrl, bio, resumeUrl];
    let filledCount = fields.filter((f) => f && f.trim() !== "").length;
    if (skills.length > 0) filledCount += 1;
    return Math.round((filledCount / 11) * 100);
  })();

  const handleRoleSelect = (selectedRole: "student" | "company") => {
    setRole(selectedRole);
  };

  const handleAddSkill = () => {
    const trimmed = skillInput.trim().toLowerCase();
    if (trimmed && !skills.includes(trimmed)) {
      setSkills([...skills, trimmed]);
      setSkillInput("");
    }
  };

  const handleRemoveSkill = (skill: string) => {
    setSkills(skills.filter((s) => s !== skill));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    const payload =
      role === "student"
        ? {
            role,
            name,
            college,
            branch,
            gradYear,
            cgpa,
            githubUrl,
            linkedinUrl,
            bio,
            resumeUrl,
            skills,
          }
        : {
            role,
            name: companyName,
          };

    try {
      const res = await fetch("/api/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (data.success) {
        if (role === "student") {
          router.push("/listings");
        } else {
          if (data.data.profile.approved) {
            router.push("/company");
          } else {
            setCompanyApproved(false);
          }
        }
      } else {
        setError(data.error.message || "Failed to update profile");
      }
    } catch (err) {
      setError("An unexpected error occurred.");
    } finally {
      setSubmitting(false);
    }
  };

  if (!isLoaded || loading) {
    return (
      <div className="flex flex-1 items-center justify-center bg-white min-h-screen">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
      </div>
    );
  }

  if (!role) {
    return (
      <div className="flex flex-col flex-1 items-center justify-center bg-white px-6 py-24 min-h-screen">
        <div className="max-w-md w-full text-center">
          <h2 className="text-3xl font-black text-black">Select Your Role</h2>
          <p className="mt-2 text-sm text-black font-light">Choose how you want to use Weavr.</p>
          <div className="mt-8 grid grid-cols-2 gap-4">
            <button
              onClick={() => handleRoleSelect("student")}
              className="border-2 border-black rounded p-6 hover:border-blue-600 hover:text-blue-600 transition duration-200 flex flex-col items-center justify-center space-y-2 font-semibold text-black"
            >
              <span className="text-lg">Student</span>
              <span className="text-xs font-light text-black">Find talent matches</span>
            </button>
            <button
              onClick={() => handleRoleSelect("company")}
              className="border-2 border-black rounded p-6 hover:border-blue-600 hover:text-blue-600 transition duration-200 flex flex-col items-center justify-center space-y-2 font-semibold text-black"
            >
              <span className="text-lg">Company</span>
              <span className="text-xs font-light text-black">Post opportunities</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col flex-1 bg-white min-h-screen py-12 px-6 lg:px-8">
      <div className="max-w-2xl mx-auto w-full">
        <div className="flex items-center justify-between border-b pb-6 border-black">
          <div>
            <h2 className="text-3xl font-black text-black">
              {role === "student" ? "Student Profile" : "Company Profile"}
            </h2>
            <p className="mt-1 text-sm font-light text-black">
              Update your matching parameters.
            </p>
          </div>
          {role === "student" && (
            <div className="flex items-center space-x-3">
              <div className="relative flex items-center justify-center">
                <svg className="w-12 h-12 transform -rotate-90">
                  <circle
                    cx="24"
                    cy="24"
                    r="20"
                    stroke="#eaeaea"
                    strokeWidth="4"
                    fill="transparent"
                  />
                  <circle
                    cx="24"
                    cy="24"
                    r="20"
                    stroke="#2563eb"
                    strokeWidth="4"
                    fill="transparent"
                    strokeDasharray={2 * Math.PI * 20}
                    strokeDashoffset={
                      2 * Math.PI * 20 * (1 - completenessScore / 100)
                    }
                    className="transition-all duration-300"
                  />
                </svg>
                <span className="absolute text-xs font-bold text-black">
                  {completenessScore}%
                </span>
              </div>
              <span className="text-xs font-light text-black">Completeness</span>
            </div>
          )}
        </div>

        {error && (
          <div className="mt-6 border border-black bg-white text-blue-600 p-4 rounded text-sm font-semibold">
            {error}
          </div>
        )}

        {role === "company" && !companyApproved && companyName && (
          <div className="mt-6 border border-black bg-white text-black p-4 rounded text-sm font-light">
            Your company account is pending administrator approval. You will be able to access the dashboard once approved.
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-8 space-y-6">
          {role === "student" ? (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-black">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="mt-1 block w-full rounded border border-black px-3 py-2 text-black focus:outline-none focus:border-blue-600 sm:text-sm font-light"
                />
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-black">
                    College
                  </label>
                  <input
                    type="text"
                    required
                    value={college}
                    onChange={(e) => setCollege(e.target.value)}
                    className="mt-1 block w-full rounded border border-black px-3 py-2 text-black focus:outline-none focus:border-blue-600 sm:text-sm font-light"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-black">
                    Branch / Major
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Computer Science"
                    value={branch}
                    onChange={(e) => setBranch(e.target.value)}
                    className="mt-1 block w-full rounded border border-black px-3 py-2 text-black focus:outline-none focus:border-blue-600 sm:text-sm font-light"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-black">
                    Graduation Year
                  </label>
                  <input
                    type="number"
                    required
                    placeholder="e.g. 2026"
                    value={gradYear}
                    onChange={(e) => setGradYear(e.target.value)}
                    className="mt-1 block w-full rounded border border-black px-3 py-2 text-black focus:outline-none focus:border-blue-600 sm:text-sm font-light"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-black">
                    CGPA
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    placeholder="e.g. 9.15"
                    value={cgpa}
                    onChange={(e) => setCgpa(e.target.value)}
                    className="mt-1 block w-full rounded border border-black px-3 py-2 text-black focus:outline-none focus:border-blue-600 sm:text-sm font-light"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-black">
                    GitHub Profile URL
                  </label>
                  <input
                    type="url"
                    value={githubUrl}
                    onChange={(e) => setGithubUrl(e.target.value)}
                    className="mt-1 block w-full rounded border border-black px-3 py-2 text-black focus:outline-none focus:border-blue-600 sm:text-sm font-light"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-black">
                    LinkedIn Profile URL
                  </label>
                  <input
                    type="url"
                    value={linkedinUrl}
                    onChange={(e) => setLinkedinUrl(e.target.value)}
                    className="mt-1 block w-full rounded border border-black px-3 py-2 text-black focus:outline-none focus:border-blue-600 sm:text-sm font-light"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-black">
                  Resume URL (PDF Link)
                </label>
                <input
                  type="url"
                  placeholder="https://example.com/my-resume.pdf"
                  value={resumeUrl}
                  onChange={(e) => setResumeUrl(e.target.value)}
                  className="mt-1 block w-full rounded border border-black px-3 py-2 text-black focus:outline-none focus:border-blue-600 sm:text-sm font-light"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-black">
                  Bio / Short Pitch
                </label>
                <textarea
                  rows={3}
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  className="mt-1 block w-full rounded border border-black px-3 py-2 text-black focus:outline-none focus:border-blue-600 sm:text-sm font-light"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-black">
                  Skills
                </label>
                <div className="flex mt-1 space-x-2">
                  <input
                    type="text"
                    placeholder="Add a skill (e.g. react, docker)"
                    value={skillInput}
                    onChange={(e) => setSkillInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleAddSkill();
                      }
                    }}
                    className="block w-full rounded border border-black px-3 py-2 text-black focus:outline-none focus:border-blue-600 sm:text-sm font-light"
                  />
                  <button
                    type="button"
                    onClick={handleAddSkill}
                    className="bg-black text-white px-4 py-2 rounded hover:bg-blue-600 text-sm font-semibold transition"
                  >
                    Add
                  </button>
                </div>
                {/* Seed autocomplete suggestions */}
                {skillInput && (
                  <div className="mt-1 border border-black rounded divide-y max-h-32 overflow-y-auto">
                    {allSkills
                      .filter((s) =>
                        s.name.toLowerCase().includes(skillInput.toLowerCase())
                      )
                      .map((s) => (
                        <div
                          key={s.id}
                          onClick={() => {
                            if (!skills.includes(s.name)) {
                              setSkills([...skills, s.name]);
                            }
                            setSkillInput("");
                          }}
                          className="px-3 py-2 text-sm text-black hover:bg-blue-50 cursor-pointer font-light"
                        >
                          {s.name}
                        </div>
                      ))}
                  </div>
                )}
                {/* Skill badges */}
                <div className="mt-3 flex flex-wrap gap-2">
                  {skills.map((skill) => (
                    <span
                      key={skill}
                      className="inline-flex items-center rounded-full border border-black bg-white px-3 py-0.5 text-xs font-light text-black"
                    >
                      {skill}
                      <button
                        type="button"
                        onClick={() => handleRemoveSkill(skill)}
                        className="ml-1.5 inline-flex h-3.5 w-3.5 flex-shrink-0 items-center justify-center rounded-full text-black hover:text-blue-600 focus:outline-none"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-black">
                  Company Name
                </label>
                <input
                  type="text"
                  required
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  className="mt-1 block w-full rounded border border-black px-3 py-2 text-black focus:outline-none focus:border-blue-600 sm:text-sm font-light"
                />
              </div>
            </div>
          )}

          <div className="flex justify-between items-center pt-4 border-t border-black">
            <button
              type="button"
              onClick={() => setRole(null)}
              className="text-xs font-semibold text-black hover:text-blue-600 transition"
            >
              ← Go Back
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="bg-black text-white px-6 py-3 rounded text-sm font-semibold hover:bg-blue-600 disabled:opacity-50 transition"
            >
              {submitting ? "Saving..." : "Save Profile"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
