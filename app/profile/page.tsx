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
      <div className="flex flex-1 items-center justify-center bg-black min-h-screen">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-white border-t-transparent"></div>
      </div>
    );
  }

  if (!role) {
    return (
      <div className="flex flex-col flex-1 items-center justify-center bg-black px-6 py-24 min-h-screen relative overflow-hidden font-sans">
        <div className="max-w-md w-full text-center z-10 space-y-6">
          <h2 className="text-2xl font-black uppercase tracking-[0.2em] text-white">Select Your Role</h2>
          <p className="text-[10px] uppercase tracking-[0.15em] text-card-foreground font-light">Choose how you want to connect.</p>
          <div className="mt-8 grid grid-cols-2 gap-6 pt-4">
            <button
              onClick={() => handleRoleSelect("student")}
              className="glass-card rounded p-8 flex flex-col items-center justify-center space-y-3 cursor-pointer group"
            >
              <span className="text-base font-bold uppercase tracking-wider text-white transition-colors">Student</span>
              <span className="text-[9px] uppercase tracking-wider text-card-foreground">Find Matches</span>
            </button>
            <button
              onClick={() => handleRoleSelect("company")}
              className="glass-card rounded p-8 flex flex-col items-center justify-center space-y-3 cursor-pointer group"
            >
              <span className="text-base font-bold uppercase tracking-wider text-white transition-colors">Company</span>
              <span className="text-[9px] uppercase tracking-wider text-card-foreground">Post Jobs</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col flex-1 bg-black min-h-screen py-12 px-6 lg:px-8 relative overflow-hidden font-sans">
      <div className="max-w-2xl mx-auto w-full z-10">
        <div className="flex items-center justify-between pb-6 bg-white/[0.02] px-6 py-4 rounded">
          <div>
            <h2 className="text-lg font-black uppercase tracking-[0.15em] text-white">
              {role === "student" ? "Configure Student" : "Configure Company"}
            </h2>
            <p className="mt-0.5 text-[9px] uppercase tracking-wider text-card-foreground font-light">
              Weavr Matching Parameters
            </p>
          </div>
          {role === "student" && (
            <div className="flex items-center space-x-2 bg-white/10 px-3 py-1.5 rounded">
              <span className="text-[10px] font-bold text-white tracking-wide">
                {completenessScore}% Complete
              </span>
            </div>
          )}
        </div>

        {error && (
          <div className="mt-6 bg-white/10 text-white p-4 rounded text-xs uppercase tracking-wider font-semibold">
            {error}
          </div>
        )}

        {role === "company" && !companyApproved && companyName && (
          <div className="mt-6 bg-card p-4 rounded text-xs uppercase tracking-wider text-card-foreground font-light">
            Your company account is pending administrator approval.
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-8 space-y-6">
          <div className="glass-panel rounded p-8 space-y-6 bg-[#0c0c0c]">
            {role === "student" ? (
              <div className="space-y-5">
                <div>
                  <label className="block text-[9px] font-semibold uppercase tracking-widest text-card-foreground">
                    Full Name
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="mt-1.5 block w-full rounded bg-black px-3.5 py-2.5 text-white focus:outline-none focus:ring-1 focus:ring-white text-xs font-light tracking-wide transition-colors"
                  />
                </div>

                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                  <div>
                    <label className="block text-[9px] font-semibold uppercase tracking-widest text-card-foreground">
                      College / University
                    </label>
                    <input
                      type="text"
                      required
                      value={college}
                      onChange={(e) => setCollege(e.target.value)}
                      className="mt-1.5 block w-full rounded bg-black px-3.5 py-2.5 text-white focus:outline-none focus:ring-1 focus:ring-white text-xs font-light tracking-wide transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-[9px] font-semibold uppercase tracking-widest text-card-foreground">
                      Branch / Major
                    </label>
                    <input
                      type="text"
                      required
                      value={branch}
                      onChange={(e) => setBranch(e.target.value)}
                      className="mt-1.5 block w-full rounded bg-black px-3.5 py-2.5 text-white focus:outline-none focus:ring-1 focus:ring-white text-xs font-light tracking-wide transition-colors"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                  <div>
                    <label className="block text-[9px] font-semibold uppercase tracking-widest text-card-foreground">
                      Graduation Year
                    </label>
                    <input
                      type="number"
                      required
                      value={gradYear}
                      onChange={(e) => setGradYear(e.target.value)}
                      className="mt-1.5 block w-full rounded bg-black px-3.5 py-2.5 text-white focus:outline-none focus:ring-1 focus:ring-white text-xs font-light tracking-wide transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-[9px] font-semibold uppercase tracking-widest text-card-foreground">
                      Cumulative GPA (CGPA)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      value={cgpa}
                      onChange={(e) => setCgpa(e.target.value)}
                      className="mt-1.5 block w-full rounded bg-black px-3.5 py-2.5 text-white focus:outline-none focus:ring-1 focus:ring-white text-xs font-light tracking-wide transition-colors"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                  <div>
                    <label className="block text-[9px] font-semibold uppercase tracking-widest text-card-foreground">
                      GitHub Profile URL
                    </label>
                    <input
                      type="url"
                      value={githubUrl}
                      onChange={(e) => setGithubUrl(e.target.value)}
                      className="mt-1.5 block w-full rounded bg-black px-3.5 py-2.5 text-white focus:outline-none focus:ring-1 focus:ring-white text-xs font-light tracking-wide transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-[9px] font-semibold uppercase tracking-widest text-card-foreground">
                      LinkedIn Profile URL
                    </label>
                    <input
                      type="url"
                      value={linkedinUrl}
                      onChange={(e) => setLinkedinUrl(e.target.value)}
                      className="mt-1.5 block w-full rounded bg-black px-3.5 py-2.5 text-white focus:outline-none focus:ring-1 focus:ring-white text-xs font-light tracking-wide transition-colors"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[9px] font-semibold uppercase tracking-widest text-card-foreground">
                    Resume Link (PDF URL)
                  </label>
                  <input
                    type="url"
                    value={resumeUrl}
                    onChange={(e) => setResumeUrl(e.target.value)}
                    className="mt-1.5 block w-full rounded bg-black px-3.5 py-2.5 text-white focus:outline-none focus:ring-1 focus:ring-white text-xs font-light tracking-wide transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-[9px] font-semibold uppercase tracking-widest text-card-foreground">
                    Biography
                  </label>
                  <textarea
                    rows={3}
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    className="mt-1.5 block w-full rounded bg-black px-3.5 py-2.5 text-white focus:outline-none focus:ring-1 focus:ring-white text-xs font-light tracking-wide transition-colors resize-none"
                  />
                </div>

                <div>
                  <label className="block text-[9px] font-semibold uppercase tracking-widest text-card-foreground">
                    Skills
                  </label>
                  <div className="flex mt-1.5 space-x-2">
                    <input
                      type="text"
                      placeholder="Type skill..."
                      value={skillInput}
                      onChange={(e) => setSkillInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          handleAddSkill();
                        }
                      }}
                      className="block w-full rounded bg-black px-3.5 py-2.5 text-white focus:outline-none focus:ring-1 focus:ring-white text-xs font-light tracking-wide transition-colors"
                    />
                    <button
                      type="button"
                      onClick={handleAddSkill}
                      className="bg-white text-black hover:bg-[#dddddd] px-4 rounded text-xs font-semibold uppercase tracking-wider transition duration-200 cursor-pointer"
                    >
                      Add
                    </button>
                  </div>
                  {skillInput && (
                    <div className="mt-1.5 rounded bg-black max-h-32 overflow-y-auto z-20 relative shadow-xl">
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
                            className="px-3.5 py-2 text-xs text-white hover:bg-white hover:text-black cursor-pointer font-light transition-colors"
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
                        className="inline-flex items-center rounded bg-white/5 px-3 py-1 text-[9px] font-light uppercase tracking-wider text-white"
                      >
                        {skill}
                        <button
                          type="button"
                          onClick={() => handleRemoveSkill(skill)}
                          className="ml-1.5 inline-flex h-3 w-3 items-center justify-center text-card-foreground hover:text-white text-xs focus:outline-none font-bold"
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
                  <label className="block text-[9px] font-semibold uppercase tracking-widest text-card-foreground">
                    Registered Company Name
                  </label>
                  <input
                    type="text"
                    required
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    className="mt-1.5 block w-full rounded bg-black px-3.5 py-2.5 text-white focus:outline-none focus:ring-1 focus:ring-white text-xs font-light tracking-wide transition-colors"
                  />
                </div>
              </div>
            )}
          </div>

          <div className="flex justify-between items-center pt-4">
            <button
              type="button"
              onClick={() => setRole(null)}
              className="text-[9px] font-bold uppercase tracking-widest text-card-foreground hover:text-white transition-colors"
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
