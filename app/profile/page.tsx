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
      <div className="flex flex-1 items-center justify-center bg-[#050505] min-h-screen">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-accent-cyan border-t-transparent"></div>
      </div>
    );
  }

  if (!role) {
    return (
      <div className="flex flex-col flex-1 items-center justify-center bg-[#050505] px-6 py-24 min-h-screen relative overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[350px] h-[350px] bg-accent-cyan/5 rounded-full blur-[90px] pointer-events-none"></div>
        <div className="max-w-md w-full text-center z-10 space-y-6">
          <h2 className="text-3xl font-black uppercase tracking-[0.2em] text-white">Select Your Role</h2>
          <p className="text-xs uppercase tracking-[0.15em] text-card-foreground font-light">Choose how you want to connect.</p>
          <div className="mt-8 grid grid-cols-2 gap-6 pt-4">
            <button
              onClick={() => handleRoleSelect("student")}
              className="glass-card rounded-lg p-8 hover:border-accent-cyan flex flex-col items-center justify-center space-y-3 cursor-pointer group"
            >
              <span className="text-lg font-bold uppercase tracking-wider text-white group-hover:text-accent-cyan transition-colors">Student</span>
              <span className="text-[10px] uppercase tracking-wider text-card-foreground">Find Matches</span>
            </button>
            <button
              onClick={() => handleRoleSelect("company")}
              className="glass-card rounded-lg p-8 hover:border-accent-pink flex flex-col items-center justify-center space-y-3 cursor-pointer group"
            >
              <span className="text-lg font-bold uppercase tracking-wider text-white group-hover:text-accent-pink transition-colors">Company</span>
              <span className="text-[10px] uppercase tracking-wider text-card-foreground">Post Jobs</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col flex-1 bg-[#050505] min-h-screen py-12 px-6 lg:px-8 relative overflow-hidden">
      <div className="absolute top-0 right-1/4 w-[300px] h-[300px] bg-accent-purple/5 rounded-full blur-[80px] pointer-events-none"></div>

      <div className="max-w-2xl mx-auto w-full z-10">
        <div className="flex items-center justify-between border-b pb-6 border-white/10">
          <div>
            <h2 className="text-2xl font-black uppercase tracking-[0.15em] text-white">
              {role === "student" ? "Configure Student" : "Configure Company"}
            </h2>
            <p className="mt-1 text-xs uppercase tracking-wider text-card-foreground font-light">
              Weavr Matching Parameters
            </p>
          </div>
          {role === "student" && (
            <div className="flex items-center space-x-3">
              <div className="relative flex items-center justify-center">
                <svg className="w-12 h-12 transform -rotate-90">
                  <circle cx="24" cy="24" r="20" stroke="rgba(255,255,255,0.05)" strokeWidth="3" fill="transparent" />
                  <circle
                    cx="24"
                    cy="24"
                    r="20"
                    stroke="#06B6D4"
                    strokeWidth="3"
                    fill="transparent"
                    strokeDasharray={2 * Math.PI * 20}
                    strokeDashoffset={2 * Math.PI * 20 * (1 - completenessScore / 100)}
                    className="transition-all duration-300"
                  />
                </svg>
                <span className="absolute text-[10px] font-bold text-white">
                  {completenessScore}%
                </span>
              </div>
              <span className="text-[10px] uppercase tracking-wider text-card-foreground">Completeness</span>
            </div>
          )}
        </div>

        {error && (
          <div className="mt-6 border border-accent-pink/30 bg-accent-pink/5 text-accent-pink p-4 rounded text-xs uppercase tracking-wider font-semibold">
            {error}
          </div>
        )}

        {role === "company" && !companyApproved && companyName && (
          <div className="mt-6 border border-white/10 bg-card p-4 rounded text-xs uppercase tracking-wider text-card-foreground font-light">
            Your company account is pending administrator approval.
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-8 space-y-6">
          <div className="glass-panel rounded-xl p-8 space-y-6">
            {role === "student" ? (
              <div className="space-y-5">
                <div>
                  <label className="block text-[10px] font-semibold uppercase tracking-widest text-card-foreground">
                    Full Name
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="mt-1.5 block w-full rounded border border-white/10 bg-[#0c0c0c] px-3.5 py-2.5 text-white focus:outline-none focus:border-accent-cyan focus:ring-1 focus:ring-accent-cyan text-xs font-light tracking-wide transition-colors"
                  />
                </div>

                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                  <div>
                    <label className="block text-[10px] font-semibold uppercase tracking-widest text-card-foreground">
                      College / University
                    </label>
                    <input
                      type="text"
                      required
                      value={college}
                      onChange={(e) => setCollege(e.target.value)}
                      className="mt-1.5 block w-full rounded border border-white/10 bg-[#0c0c0c] px-3.5 py-2.5 text-white focus:outline-none focus:border-accent-cyan focus:ring-1 focus:ring-accent-cyan text-xs font-light tracking-wide transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-semibold uppercase tracking-widest text-card-foreground">
                      Branch / Major
                    </label>
                    <input
                      type="text"
                      required
                      value={branch}
                      onChange={(e) => setBranch(e.target.value)}
                      className="mt-1.5 block w-full rounded border border-white/10 bg-[#0c0c0c] px-3.5 py-2.5 text-white focus:outline-none focus:border-accent-cyan focus:ring-1 focus:ring-accent-cyan text-xs font-light tracking-wide transition-colors"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                  <div>
                    <label className="block text-[10px] font-semibold uppercase tracking-widest text-card-foreground">
                      Graduation Year
                    </label>
                    <input
                      type="number"
                      required
                      value={gradYear}
                      onChange={(e) => setGradYear(e.target.value)}
                      className="mt-1.5 block w-full rounded border border-white/10 bg-[#0c0c0c] px-3.5 py-2.5 text-white focus:outline-none focus:border-accent-cyan focus:ring-1 focus:ring-accent-cyan text-xs font-light tracking-wide transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-semibold uppercase tracking-widest text-card-foreground">
                      Cumulative GPA (CGPA)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      value={cgpa}
                      onChange={(e) => setCgpa(e.target.value)}
                      className="mt-1.5 block w-full rounded border border-white/10 bg-[#0c0c0c] px-3.5 py-2.5 text-white focus:outline-none focus:border-accent-cyan focus:ring-1 focus:ring-accent-cyan text-xs font-light tracking-wide transition-colors"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                  <div>
                    <label className="block text-[10px] font-semibold uppercase tracking-widest text-card-foreground">
                      GitHub Profile URL
                    </label>
                    <input
                      type="url"
                      value={githubUrl}
                      onChange={(e) => setGithubUrl(e.target.value)}
                      className="mt-1.5 block w-full rounded border border-white/10 bg-[#0c0c0c] px-3.5 py-2.5 text-white focus:outline-none focus:border-accent-cyan focus:ring-1 focus:ring-accent-cyan text-xs font-light tracking-wide transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-semibold uppercase tracking-widest text-card-foreground">
                      LinkedIn Profile URL
                    </label>
                    <input
                      type="url"
                      value={linkedinUrl}
                      onChange={(e) => setLinkedinUrl(e.target.value)}
                      className="mt-1.5 block w-full rounded border border-white/10 bg-[#0c0c0c] px-3.5 py-2.5 text-white focus:outline-none focus:border-accent-cyan focus:ring-1 focus:ring-accent-cyan text-xs font-light tracking-wide transition-colors"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-semibold uppercase tracking-widest text-card-foreground">
                    Resume Link (PDF URL)
                  </label>
                  <input
                    type="url"
                    value={resumeUrl}
                    onChange={(e) => setResumeUrl(e.target.value)}
                    className="mt-1.5 block w-full rounded border border-white/10 bg-[#0c0c0c] px-3.5 py-2.5 text-white focus:outline-none focus:border-accent-cyan focus:ring-1 focus:ring-accent-cyan text-xs font-light tracking-wide transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-semibold uppercase tracking-widest text-card-foreground">
                    Candidate Biography
                  </label>
                  <textarea
                    rows={3}
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    className="mt-1.5 block w-full rounded border border-white/10 bg-[#0c0c0c] px-3.5 py-2.5 text-white focus:outline-none focus:border-accent-cyan focus:ring-1 focus:ring-accent-cyan text-xs font-light tracking-wide transition-colors resize-none"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-semibold uppercase tracking-widest text-card-foreground">
                    Core Skillsets
                  </label>
                  <div className="flex mt-1.5 space-x-2">
                    <input
                      type="text"
                      placeholder="Type skill name..."
                      value={skillInput}
                      onChange={(e) => setSkillInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          handleAddSkill();
                        }
                      }}
                      className="block w-full rounded border border-white/10 bg-[#0c0c0c] px-3.5 py-2.5 text-white focus:outline-none focus:border-accent-cyan focus:ring-1 focus:ring-accent-cyan text-xs font-light tracking-wide transition-colors"
                    />
                    <button
                      type="button"
                      onClick={handleAddSkill}
                      className="bg-white text-black hover:bg-accent-cyan hover:text-white px-4 rounded text-xs font-semibold uppercase tracking-wider transition duration-200 cursor-pointer"
                    >
                      Add
                    </button>
                  </div>
                  {skillInput && (
                    <div className="mt-1.5 border border-white/10 rounded divide-y divide-white/5 bg-[#0c0c0c] max-h-32 overflow-y-auto z-20 relative">
                      {allSkills
                        .filter((s) => s.name.toLowerCase().includes(skillInput.toLowerCase()))
                        .map((s) => (
                          <div
                            key={s.id}
                            onClick={() => {
                              if (!skills.includes(s.name)) {
                                setSkills([...skills, s.name]);
                              }
                              setSkillInput("");
                            }}
                            className="px-3.5 py-2 text-xs text-white hover:bg-accent-cyan hover:text-white cursor-pointer font-light transition-colors"
                          >
                            {s.name}
                          </div>
                        ))}
                    </div>
                  )}
                  <div className="mt-3 flex flex-wrap gap-2">
                    {skills.map((skill) => (
                      <span
                        key={skill}
                        className="inline-flex items-center rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[10px] font-light uppercase tracking-wider text-white"
                      >
                        {skill}
                        <button
                          type="button"
                          onClick={() => handleRemoveSkill(skill)}
                          className="ml-1.5 inline-flex h-3 w-3 items-center justify-center text-card-foreground hover:text-accent-pink text-xs focus:outline-none"
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
                  <label className="block text-[10px] font-semibold uppercase tracking-widest text-card-foreground">
                    Registered Company Name
                  </label>
                  <input
                    type="text"
                    required
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    className="mt-1.5 block w-full rounded border border-white/10 bg-[#0c0c0c] px-3.5 py-2.5 text-white focus:outline-none focus:border-accent-pink focus:ring-1 focus:ring-accent-pink text-xs font-light tracking-wide transition-colors"
                  />
                </div>
              </div>
            )}
          </div>

          <div className="flex justify-between items-center pt-4 border-t border-white/10">
            <button
              type="button"
              onClick={() => setRole(null)}
              className="text-[10px] font-bold uppercase tracking-widest text-card-foreground hover:text-accent-cyan transition-colors"
            >
              ← Change Role
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="solid-btn rounded-full px-6 py-3 text-xs font-bold uppercase tracking-[0.15em] shadow-lg disabled:opacity-50 cursor-pointer"
            >
              {submitting ? "Saving Parameters..." : "Save Configuration"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
