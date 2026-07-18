"use client";

import { useUser, UserButton } from "@clerk/nextjs";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function CompanyDashboard() {
  const { isLoaded, isSignedIn } = useUser();
  const router = useRouter();

  const [listings, setListings] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [allSkills, setAllSkills] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showNotifications, setShowNotifications] = useState(false);
  const [evaluatingId, setEvaluatingId] = useState<string | null>(null);
  const [selectedFeedback, setSelectedFeedback] = useState<string | null>(null);
  const [sortByNIM, setSortByNIM] = useState<boolean>(false);

  // Listing creation form state
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [stipend, setStipend] = useState("");
  const [location, setLocation] = useState("REMOTE");
  const [deadline, setDeadline] = useState("");
  const [maxApplicants, setMaxApplicants] = useState("");
  const [targetBranch, setTargetBranch] = useState("");
  const [targetGradYear, setTargetGradYear] = useState("");
  const [reqSkills, setReqSkills] = useState<string[]>([]);
  const [prefSkills, setPrefSkills] = useState<string[]>([]);
  const [reqSkillInput, setReqSkillInput] = useState("");
  const [prefSkillInput, setPrefSkillInput] = useState("");

  const fetchData = async () => {
    try {
      const [listingsRes, profileRes, notifRes, skillsRes] = await Promise.all([
        fetch("/api/listings"),
        fetch("/api/profile"),
        fetch("/api/notifications?read=false"),
        fetch("/api/skills"),
      ]);

      const listingsData = await listingsRes.json();
      const profileData = await profileRes.json();
      const notifData = await notifRes.json();
      const skillsData = await skillsRes.json();

      if (profileData.success && profileData.data.role !== "company") {
        router.push(profileData.data.role === "student" ? "/listings" : "/profile");
        return;
      }

      if (profileData.success && !profileData.data.profile.approved) {
        router.push("/profile");
        return;
      }

      if (listingsData.success) {
        setListings(listingsData.data);
      }
      if (notifData.success) {
        setNotifications(notifData.data.notifications || []);
      }
      if (skillsData.success) {
        setAllSkills(skillsData.data);
      }
    } catch (err) {
      console.error("Failed to load dashboard data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      router.push("/");
      return;
    }
    if (isLoaded && isSignedIn) {
      fetchData();
    }
  }, [isLoaded, isSignedIn, router]);

  const handleCreateListing = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    const payload = {
      title,
      description,
      stipend: parseFloat(stipend),
      location,
      deadline: new Date(deadline),
      maxApplicants: parseInt(maxApplicants),
      targetBranch: targetBranch || undefined,
      targetGradYear: targetGradYear ? parseInt(targetGradYear) : undefined,
      requiredSkills: reqSkills,
      preferredSkills: prefSkills,
    };

    try {
      const res = await fetch("/api/listings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (data.success) {
        setSuccess("Job listing published successfully!");
        setShowCreateForm(false);
        // Clear form
        setTitle("");
        setDescription("");
        setStipend("");
        setLocation("REMOTE");
        setDeadline("");
        setMaxApplicants("");
        setTargetBranch("");
        setTargetGradYear("");
        setReqSkills([]);
        setPrefSkills([]);
        await fetchData();
      } else {
        setError(data.error.message || "Failed to create job listing");
      }
    } catch (err) {
      setError("An unexpected error occurred.");
    }
  };

  const handleCloseListing = async (listingId: string) => {
    setError(null);
    setSuccess(null);

    try {
      const res = await fetch(`/api/listings/${listingId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "CLOSED" }),
      });

      const data = await res.json();
      if (data.success) {
        setSuccess("Job listing closed successfully");
        await fetchData();
      } else {
        setError(data.error.message || "Failed to close listing");
      }
    } catch (err) {
      setError("An unexpected error occurred.");
    }
  };

  const handleUpdateApplicantStatus = async (listingId: string, applicationId: string, status: string) => {
    setError(null);
    setSuccess(null);

    try {
      const res = await fetch(`/api/applications/${applicationId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });

      const data = await res.json();
      if (data.success) {
        setSuccess(`Applicant status updated to ${status}`);
        await fetchData();
      } else {
        setError(data.error.message || "Failed to update applicant status");
      }
    } catch (err) {
      setError("An unexpected error occurred.");
    }
  };

  const handleBulkUpdateApplicants = async (listingId: string, targetStatus: string, filterStatus: string) => {
    setError(null);
    setSuccess(null);

    try {
      const res = await fetch(`/api/listings/${listingId}/applications/bulk`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetStatus, filterStatus }),
      });

      const data = await res.json();
      if (data.success) {
        setSuccess(data.data.message);
        await fetchData();
      } else {
        setError(data.error.message || "Failed to bulk update applications");
      }
    } catch (err) {
      setError("An unexpected error occurred.");
    }
  };

  const handleNIMEvaluate = async (applicationId: string) => {
    setEvaluatingId(applicationId);
    setError(null);
    setSuccess(null);

    try {
      const res = await fetch(`/api/applications/${applicationId}/evaluate`, {
        method: "POST",
      });

      const data = await res.json();
      if (data.success) {
        setSuccess("NVIDIA NIM AI evaluation complete!");
        await fetchData();
      } else {
        setError(data.error.message || "NIM evaluation failed");
      }
    } catch (err) {
      setError("An unexpected error occurred during AI evaluation.");
    } finally {
      setEvaluatingId(null);
    }
  };

  const handleMarkNotificationsRead = async () => {
    try {
      const res = await fetch("/api/notifications/read", { method: "POST" });
      const data = await res.json();
      if (data.success) {
        setNotifications([]);
      }
    } catch (err) {
      console.error("Failed to mark notifications read:", err);
    }
  };

  if (!isLoaded || loading) {
    return (
      <div className="flex flex-1 items-center justify-center bg-[#050505] min-h-screen">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-accent-cyan border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="flex flex-col flex-1 bg-[#050505] min-h-screen relative overflow-hidden">
      {/* Background glow ambient */}
      <div className="absolute top-0 right-1/4 w-[500px] h-[500px] bg-accent-pink/5 rounded-full blur-[120px] pointer-events-none"></div>

      {/* Navigation Header */}
      <nav className="glass-panel py-4 px-6 lg:px-8 sticky top-0 z-50 backdrop-blur-md">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-8">
            <span
              className="text-2xl font-black text-white tracking-[0.15em] uppercase cursor-pointer select-none"
              onClick={() => router.push("/")}
            >
              Weavr
            </span>
            <span className="text-[10px] font-bold text-accent-pink uppercase tracking-widest px-2.5 py-0.5 rounded bg-accent-pink/5">
              Recruiter Board
            </span>
          </div>
          <div className="flex items-center space-x-6">
            <button
              onClick={() => router.push("/profile")}
              className="text-xs font-bold uppercase tracking-widest text-white hover:text-accent-pink transition-colors"
            >
              Company Parameters
            </button>
            <div className="relative">
              <button
                onClick={() => {
                  setShowNotifications(!showNotifications);
                  if (!showNotifications && notifications.length > 0) {
                    handleMarkNotificationsRead();
                  }
                }}
                className="relative text-xs font-bold uppercase tracking-widest text-white hover:text-accent-pink transition-colors flex items-center"
              >
                Inbox
                {notifications.length > 0 && (
                  <span className="ml-1.5 h-2 w-2 rounded-full bg-accent-pink shadow-[0_0_10px_#EC4899]"></span>
                )}
              </button>
              {showNotifications && (
                <div className="absolute right-0 mt-3 w-80 rounded bg-[#111111] shadow-2xl py-2 z-50 animate-fade-in">
                  <div className="px-4 py-2 font-bold text-[10px] uppercase tracking-wider text-white bg-white/5">
                    Recruiter Updates
                  </div>
                  {notifications.length === 0 ? (
                    <div className="px-4 py-3 text-[10px] uppercase tracking-wider text-card-foreground">No updates</div>
                  ) : (
                    <div className="divide-y divide-white/5 max-h-60 overflow-y-auto">
                      {notifications.map((n) => (
                        <div key={n.id} className="px-4 py-3 text-[10px] text-card-foreground leading-relaxed font-light">
                          {n.message}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
            <UserButton />
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto w-full px-6 lg:px-8 py-12 flex-1 z-10 space-y-10">
        {error && (
          <div className="bg-accent-pink/5 text-accent-pink p-4 rounded text-xs uppercase tracking-wider font-semibold">
            {error}
          </div>
        )}

        {success && (
          <div className="bg-accent-cyan/5 text-accent-cyan p-4 rounded text-xs uppercase tracking-wider font-semibold">
            {success}
          </div>
        )}

        <div className="flex items-center justify-between pb-4">
          <h2 className="text-3xl font-black text-white uppercase tracking-[0.2em] select-none">
            Dashboard
          </h2>
          <button
            onClick={() => setShowCreateForm(!showCreateForm)}
            className="solid-btn rounded-full px-6 py-2.5 text-xs font-bold uppercase tracking-wider shadow-lg cursor-pointer"
          >
            {showCreateForm ? "Cancel Posting" : "Create Opportunity"}
          </button>
        </div>

        {/* Create Listing Form */}
        {showCreateForm && (
          <div className="glass-panel rounded-xl p-8 space-y-6 animate-fade-in">
            <h3 className="text-sm font-bold uppercase tracking-widest text-white pb-2 bg-white/5 px-4 py-2 rounded-t-lg">
              Opportunity Parameters
            </h3>
            <form onSubmit={handleCreateListing} className="space-y-6">
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <div>
                  <label className="block text-[9px] font-semibold uppercase tracking-widest text-card-foreground">
                    Job Title
                  </label>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="mt-1.5 block w-full rounded bg-[#0c0c0c] px-3.5 py-2.5 text-white focus:outline-none focus:ring-1 focus:ring-accent-pink text-xs font-light tracking-wide transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-[9px] font-semibold uppercase tracking-widest text-card-foreground">
                    Stipend (USD / Month)
                  </label>
                  <input
                    type="number"
                    required
                    value={stipend}
                    onChange={(e) => setStipend(e.target.value)}
                    className="mt-1.5 block w-full rounded bg-[#0c0c0c] px-3.5 py-2.5 text-white focus:outline-none focus:ring-1 focus:ring-accent-pink text-xs font-light tracking-wide transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[9px] font-semibold uppercase tracking-widest text-card-foreground">
                  Job Description
                </label>
                <textarea
                  rows={3}
                  required
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="mt-1.5 block w-full rounded bg-[#0c0c0c] px-3.5 py-2.5 text-white focus:outline-none focus:ring-1 focus:ring-accent-pink text-xs font-light tracking-wide transition-colors resize-none"
                />
              </div>

              <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
                <div>
                  <label className="block text-[9px] font-semibold uppercase tracking-widest text-card-foreground">
                    Location Type
                  </label>
                  <select
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="mt-1.5 block w-full rounded bg-[#0c0c0c] px-3.5 py-2.5 text-white focus:outline-none focus:ring-1 focus:ring-accent-pink text-xs font-light tracking-wide transition-colors uppercase"
                  >
                    <option value="REMOTE">Remote</option>
                    <option value="HYBRID">Hybrid</option>
                    <option value="ONSITE">Onsite</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[9px] font-semibold uppercase tracking-widest text-card-foreground">
                    Application Deadline
                  </label>
                  <input
                    type="date"
                    required
                    value={deadline}
                    onChange={(e) => setDeadline(e.target.value)}
                    className="mt-1.5 block w-full rounded bg-[#0c0c0c] px-3.5 py-2.5 text-white focus:outline-none focus:ring-1 focus:ring-accent-pink text-xs font-light tracking-wide transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-[9px] font-semibold uppercase tracking-widest text-card-foreground">
                    Max Applicant Capacity
                  </label>
                  <input
                    type="number"
                    required
                    value={maxApplicants}
                    onChange={(e) => setMaxApplicants(e.target.value)}
                    className="mt-1.5 block w-full rounded bg-[#0c0c0c] px-3.5 py-2.5 text-white focus:outline-none focus:ring-1 focus:ring-accent-pink text-xs font-light tracking-wide transition-colors"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <div>
                  <label className="block text-[9px] font-semibold uppercase tracking-widest text-card-foreground">
                    Target Branch Filter (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Computer Science"
                    value={targetBranch}
                    onChange={(e) => setTargetBranch(e.target.value)}
                    className="mt-1.5 block w-full rounded bg-[#0c0c0c] px-3.5 py-2.5 text-white focus:outline-none focus:ring-1 focus:ring-accent-pink text-xs font-light tracking-wide transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-[9px] font-semibold uppercase tracking-widest text-card-foreground">
                    Target Graduation Year (Optional)
                  </label>
                  <input
                    type="number"
                    placeholder="e.g. 2026"
                    value={targetGradYear}
                    onChange={(e) => setTargetGradYear(e.target.value)}
                    className="mt-1.5 block w-full rounded bg-[#0c0c0c] px-3.5 py-2.5 text-white focus:outline-none focus:ring-1 focus:ring-accent-pink text-xs font-light tracking-wide transition-colors"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                {/* Required Skills */}
                <div>
                  <label className="block text-[9px] font-semibold uppercase tracking-widest text-card-foreground">
                    Required Core Skills
                  </label>
                  <div className="flex mt-1.5 space-x-2">
                    <input
                      type="text"
                      placeholder="Type skill name..."
                      value={reqSkillInput}
                      onChange={(e) => setReqSkillInput(e.target.value)}
                      className="block w-full rounded bg-[#0c0c0c] px-3.5 py-2.5 text-white focus:outline-none focus:ring-1 focus:ring-accent-pink text-xs font-light tracking-wide transition-colors"
                    />
                  </div>
                  {reqSkillInput && (
                    <div className="mt-1.5 rounded bg-[#0c0c0c] max-h-32 overflow-y-auto z-25 relative shadow-xl">
                      {allSkills
                        .filter((s) => s.name.toLowerCase().includes(reqSkillInput.toLowerCase()))
                        .map((s) => (
                          <div
                            key={s.id}
                            onClick={() => {
                              if (!reqSkills.includes(s.name)) {
                                setReqSkills([...reqSkills, s.name]);
                              }
                              setReqSkillInput("");
                            }}
                            className="px-3.5 py-2 text-xs text-white hover:bg-accent-pink hover:text-white cursor-pointer font-light transition-colors"
                          >
                            {s.name}
                          </div>
                        ))}
                    </div>
                  )}
                  <div className="mt-2.5 flex flex-wrap gap-1.5">
                    {reqSkills.map((sk) => (
                      <span key={sk} className="inline-flex items-center rounded-full bg-white/5 px-2.5 py-0.5 text-[9px] uppercase tracking-wider text-white">
                        {sk}
                        <button type="button" onClick={() => setReqSkills(reqSkills.filter((s) => s !== sk))} className="ml-1.5 text-card-foreground hover:text-accent-pink font-bold">×</button>
                      </span>
                    ))}
                  </div>
                </div>

                {/* Preferred Skills */}
                <div>
                  <label className="block text-[9px] font-semibold uppercase tracking-widest text-card-foreground">
                    Preferred Secondary Skills
                  </label>
                  <div className="flex mt-1.5 space-x-2">
                    <input
                      type="text"
                      placeholder="Type skill name..."
                      value={prefSkillInput}
                      onChange={(e) => setPrefSkillInput(e.target.value)}
                      className="block w-full rounded bg-[#0c0c0c] px-3.5 py-2.5 text-white focus:outline-none focus:ring-1 focus:ring-accent-pink text-xs font-light tracking-wide transition-colors"
                    />
                  </div>
                  {prefSkillInput && (
                    <div className="mt-1.5 rounded bg-[#0c0c0c] max-h-32 overflow-y-auto z-25 relative shadow-xl">
                      {allSkills
                        .filter((s) => s.name.toLowerCase().includes(prefSkillInput.toLowerCase()))
                        .map((s) => (
                          <div
                            key={s.id}
                            onClick={() => {
                              if (!prefSkills.includes(s.name)) {
                                setPrefSkills([...prefSkills, s.name]);
                              }
                              setPrefSkillInput("");
                            }}
                            className="px-3.5 py-2 text-xs text-white hover:bg-accent-pink hover:text-white cursor-pointer font-light transition-colors"
                          >
                            {s.name}
                          </div>
                        ))}
                    </div>
                  )}
                  <div className="mt-2.5 flex flex-wrap gap-1.5">
                    {prefSkills.map((sk) => (
                      <span key={sk} className="inline-flex items-center rounded-full bg-white/5 px-2.5 py-0.5 text-[9px] uppercase tracking-wider text-white">
                        {sk}
                        <button type="button" onClick={() => setPrefSkills(prefSkills.filter((s) => s !== sk))} className="ml-1.5 text-card-foreground hover:text-accent-pink font-bold">×</button>
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-4">
                <button
                  type="submit"
                  className="solid-btn rounded-full px-8 py-3 text-xs font-bold uppercase tracking-wider shadow-lg cursor-pointer"
                >
                  Publish Listing
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Listings Display */}
        {listings.length === 0 ? (
          <div className="text-center py-16 rounded-xl bg-[#111111]/30">
            <p className="text-xs uppercase tracking-wider text-card-foreground font-light">No jobs published yet.</p>
          </div>
        ) : (
          <div className="space-y-12">
            {listings.map((l) => {
              // Dynamically sort applications based on selected sorting mode
              const sortedApps = [...l.applications].sort((a, b) => {
                if (sortByNIM) {
                  const scoreA = a.nimScore !== null && a.nimScore !== undefined ? a.nimScore : -1;
                  const scoreB = b.nimScore !== null && b.nimScore !== undefined ? b.nimScore : -1;
                  return scoreB - scoreA;
                } else {
                  return b.matchScore - a.matchScore;
                }
              });

              return (
                <div key={l.id} className="glass-panel rounded-xl p-8 space-y-6">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-4 bg-white/[0.01] px-6 py-4 rounded-lg">
                    <div>
                      <h3 className="text-lg font-bold text-white uppercase tracking-wide">{l.title}</h3>
                      <div className="mt-1 text-[10px] text-card-foreground uppercase tracking-wider font-light flex flex-wrap gap-x-4">
                        <span>Stipend: ${l.stipend.toLocaleString()}/mo</span>
                        <span>Type: {l.location}</span>
                        <span>Cap: {l.currentApplicants}/{l.maxApplicants} applied</span>
                      </div>
                    </div>
                    <div className="mt-4 sm:mt-0 flex items-center space-x-3">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider ${
                        l.status === "ACTIVE" ? "text-accent-cyan bg-accent-cyan/5" : "text-accent-pink bg-accent-pink/5"
                      }`}>
                        {l.status}
                      </span>
                      {l.status === "ACTIVE" && (
                        <button
                          onClick={() => handleCloseListing(l.id)}
                          className="bg-[#111111] hover:bg-accent-pink/15 hover:text-accent-pink text-[10px] font-bold uppercase tracking-widest px-3 py-1.5 rounded-lg transition"
                        >
                          Manual CLOSE
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Applications section */}
                  <div>
                    <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center mb-4 space-y-2 lg:space-y-0 bg-[#0c0c0c] px-4 py-3 rounded-lg">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-white">
                        Applicants ({l.applications.length})
                      </h4>
                      {l.applications.length > 0 && (
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-[10px] font-light text-card-foreground uppercase tracking-wider">Sort Candidates:</span>
                          <button
                            onClick={() => setSortByNIM(false)}
                            className={`px-3 py-1 text-[9px] font-bold uppercase tracking-wider rounded transition cursor-pointer ${
                              !sortByNIM ? "bg-white text-black" : "bg-[#111111] text-white hover:bg-white/5"
                            }`}
                          >
                            Match Score
                          </button>
                          <button
                            onClick={() => setSortByNIM(true)}
                            className={`px-3 py-1 text-[9px] font-bold uppercase tracking-wider rounded transition cursor-pointer ${
                              sortByNIM ? "bg-white text-black" : "bg-[#111111] text-white hover:bg-white/5"
                            }`}
                          >
                            AI Score
                          </button>
                          <span className="text-[10px] text-card-foreground mx-1">|</span>
                          <span className="text-[10px] font-light text-card-foreground uppercase tracking-wider">Bulk:</span>
                          <button
                            onClick={() => handleBulkUpdateApplicants(l.id, "UNDER_REVIEW", "SUBMITTED")}
                            className="bg-[#111111] hover:bg-accent-cyan hover:text-white text-[9px] font-bold uppercase tracking-wider px-2 py-1 rounded transition cursor-pointer"
                          >
                            All SUBMITTED → UNDER REVIEW
                          </button>
                        </div>
                      )}
                    </div>

                    {l.applications.length === 0 ? (
                      <p className="text-[10px] uppercase tracking-wider text-card-foreground py-4 font-light">No applicants received yet.</p>
                    ) : (
                      <div className="overflow-x-auto rounded-lg bg-[#090909]">
                        <table className="w-full text-left text-xs divide-y divide-white/5">
                          <thead>
                            <tr className="font-bold text-white uppercase tracking-wider bg-white/5">
                              <th className="py-3.5 px-4 text-[9px]">Candidate</th>
                              <th className="py-3.5 px-4 text-[9px]">College / Major</th>
                              <th className="py-3.5 px-4 text-[9px]">Match Scores</th>
                              <th className="py-3.5 px-4 text-[9px]">Pipeline State</th>
                              <th className="py-3.5 px-4 text-[9px] text-right">Actions</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-white/5 font-light">
                            {sortedApps.map((app: any) => (
                              <tr key={app.id} className="hover:bg-white/[0.02] transition-colors">
                                <td className="py-4 px-4">
                                  <div className="font-bold text-white">{app.student.name}</div>
                                  <div className="text-[10px] text-card-foreground">{app.student.email}</div>
                                  <div className="mt-1 flex space-x-2">
                                    {app.student.githubUrl && (
                                      <a href={app.student.githubUrl} target="_blank" rel="noreferrer" className="text-[9px] text-accent-cyan hover:underline uppercase tracking-wider">GitHub</a>
                                    )}
                                    {app.student.resumeUrl && (
                                      <a href={app.student.resumeUrl} target="_blank" rel="noreferrer" className="text-[9px] text-accent-cyan hover:underline uppercase tracking-wider font-semibold">Resume</a>
                                    )}
                                  </div>
                                </td>
                                <td className="py-4 px-4">
                                  <div className="text-white">{app.student.college}</div>
                                  <div className="text-[10px] text-card-foreground">{app.student.branch} (Class of {app.student.gradYear})</div>
                                  <div className="font-semibold text-[9px] text-white">CGPA: {app.student.cgpa}</div>
                                </td>
                                <td className="py-4 px-4">
                                  <div className="font-bold text-accent-purple">{app.matchScore}% Match</div>
                                  {app.nimScore !== null && app.nimScore !== undefined ? (
                                    <div className="mt-1.5 text-[9px] font-bold text-white flex flex-col space-y-0.5">
                                      <span>AI Score: {app.nimScore}%</span>
                                      <button
                                        type="button"
                                        onClick={() => setSelectedFeedback(app.nimFeedback)}
                                        className="text-accent-cyan hover:underline text-[9px] text-left uppercase tracking-wider font-semibold"
                                      >
                                        View AI Review
                                      </button>
                                    </div>
                                  ) : (
                                    <button
                                      type="button"
                                      onClick={() => handleNIMEvaluate(app.id)}
                                      disabled={evaluatingId === app.id}
                                      className="mt-1.5 block rounded bg-white/5 px-2.5 py-1 text-[9px] font-bold text-white hover:text-accent-cyan hover:bg-white/10 transition disabled:opacity-50 uppercase cursor-pointer"
                                    >
                                      {evaluatingId === app.id ? "Analyzing..." : "NIM AI Match"}
                                    </button>
                                  )}
                                </td>
                                <td className="py-4 px-4 text-[10px] font-bold uppercase tracking-widest text-white">
                                  {app.status}
                                </td>
                                <td className="py-4 px-4 text-right space-y-1 sm:space-y-0 sm:space-x-1">
                                  <button
                                    onClick={() => handleUpdateApplicantStatus(l.id, app.id, "UNDER_REVIEW")}
                                    className="bg-[#111111] text-[9px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-lg hover:text-accent-cyan hover:bg-white/5 transition cursor-pointer"
                                  >
                                    Review
                                  </button>
                                  <button
                                    onClick={() => handleUpdateApplicantStatus(l.id, app.id, "SHORTLISTED")}
                                    className="bg-[#111111] text-[9px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-lg hover:text-accent-cyan hover:bg-white/5 transition cursor-pointer"
                                  >
                                    Shortlist
                                  </button>
                                  <button
                                    onClick={() => handleUpdateApplicantStatus(l.id, app.id, "OFFER_EXTENDED")}
                                    className="bg-[#111111] text-[9px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-lg hover:text-accent-cyan hover:bg-white/5 transition cursor-pointer"
                                  >
                                    Offer
                                  </button>
                                  <button
                                    onClick={() => handleUpdateApplicantStatus(l.id, app.id, "REJECTED")}
                                    className="bg-[#111111] text-[9px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-lg hover:text-accent-pink hover:bg-white/5 transition cursor-pointer"
                                  >
                                    Reject
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {selectedFeedback && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50 animate-fade-in backdrop-blur-sm">
          <div className="bg-[#111111] max-w-lg w-full rounded-xl p-6 shadow-2xl flex flex-col space-y-4 glow-purple">
            <div className="flex justify-between items-center pb-3">
              <h3 className="text-xs font-bold uppercase tracking-[0.15em] text-white">NVIDIA NIM AI Review</h3>
              <button
                onClick={() => setSelectedFeedback(null)}
                className="text-card-foreground hover:text-white font-bold text-lg focus:outline-none"
              >
                ×
              </button>
            </div>
            <div className="text-xs font-light text-card-foreground leading-relaxed whitespace-pre-line max-h-96 overflow-y-auto pr-2">
              {selectedFeedback}
            </div>
            <div className="flex justify-end pt-3">
              <button
                onClick={() => setSelectedFeedback(null)}
                className="bg-white text-black hover:bg-accent-cyan hover:text-white px-4 py-2 text-xs font-bold uppercase tracking-wider rounded-lg transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
