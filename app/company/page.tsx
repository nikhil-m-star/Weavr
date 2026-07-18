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
      console.error("Failed to load company data:", err);
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
      stipend,
      location,
      deadline,
      maxApplicants,
      targetBranch: targetBranch || null,
      targetGradYear: targetGradYear || null,
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
        setSuccess("Listing successfully created in DRAFT state!");
        setShowCreateForm(false);
        // Clear form
        setTitle("");
        setDescription("");
        setStipend("");
        setDeadline("");
        setMaxApplicants("");
        setTargetBranch("");
        setTargetGradYear("");
        setReqSkills([]);
        setPrefSkills([]);
        await fetchData();
      } else {
        setError(data.error.message || "Failed to create listing");
      }
    } catch (err) {
      setError("An unexpected error occurred.");
    }
  };

  const handleUpdateStatus = async (listingId: string, status: "ACTIVE" | "CLOSED") => {
    setError(null);
    setSuccess(null);

    try {
      const res = await fetch(`/api/listings/${listingId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });

      const data = await res.json();
      if (data.success) {
        setSuccess(`Listing status updated to ${status}`);
        await fetchData();
      } else {
        setError(data.error.message || "Failed to update listing status");
      }
    } catch (err) {
      setError("An unexpected error occurred.");
    }
  };

  const handleUpdateApplicantStatus = async (listingId: string, applicationId: string, status: string) => {
    setError(null);
    setSuccess(null);

    try {
      // In this system, we can update individual status by modifying the application.
      // We can use a bulk endpoint or build a separate PUT/PATCH application status endpoint,
      // or we can use the bulk update endpoint for a single ID by filtering.
      // Let's create an endpoint `PATCH /api/applications/[id]/status` to make it clean!
      // Wait, is there a simpler way? Yes, we can build a quick route at `/api/applications/[id]/status`.
      // Let's implement it in a moment. Let's call it here:
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
      <div className="flex flex-1 items-center justify-center bg-white min-h-screen">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="flex flex-col flex-1 bg-white min-h-screen">
      {/* Header */}
      <nav className="border-b border-black py-4 px-6 lg:px-8 bg-white sticky top-0 z-50">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-8">
            <span className="text-2xl font-black text-black tracking-tight cursor-pointer" onClick={() => router.push("/")}>
              Weavr
            </span>
            <span className="text-xs font-semibold text-black uppercase tracking-widest px-2 py-1 border border-black rounded">
              Company Dashboard
            </span>
          </div>
          <div className="flex items-center space-x-6">
            <button
              onClick={() => router.push("/profile")}
              className="text-sm font-semibold text-black hover:text-blue-600 transition"
            >
              Company Profile
            </button>
            <div className="relative">
              <button
                onClick={() => {
                  setShowNotifications(!showNotifications);
                  if (!showNotifications && notifications.length > 0) {
                    handleMarkNotificationsRead();
                  }
                }}
                className="relative text-sm font-semibold text-black hover:text-blue-600 transition flex items-center"
              >
                Notifications
                {notifications.length > 0 && (
                  <span className="absolute -top-1.5 -right-2 h-2 w-2 rounded-full bg-blue-600"></span>
                )}
              </button>
              {showNotifications && (
                <div className="absolute right-0 mt-3 w-80 rounded border border-black bg-white shadow-lg py-2 z-50">
                  <div className="px-4 py-2 border-b border-black font-semibold text-xs uppercase tracking-wider text-black">
                    Unread Notifications
                  </div>
                  {notifications.length === 0 ? (
                    <div className="px-4 py-3 text-xs font-light text-black">No unread notifications</div>
                  ) : (
                    <div className="divide-y divide-gray-100 max-h-60 overflow-y-auto">
                      {notifications.map((n) => (
                        <div key={n.id} className="px-4 py-3 text-xs text-black font-light">
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

      {/* Main content */}
      <main className="max-w-7xl mx-auto w-full px-6 lg:px-8 py-12 flex-1">
        {error && (
          <div className="mb-8 border border-black bg-white text-blue-600 p-4 rounded text-sm font-semibold">
            {error}
          </div>
        )}
        {success && (
          <div className="mb-8 border border-black bg-white text-black p-4 rounded text-sm font-semibold">
            {success}
          </div>
        )}

        <div className="flex justify-between items-center mb-8 border-b border-black pb-4">
          <h2 className="text-3xl font-black text-black">Job Postings</h2>
          <button
            onClick={() => setShowCreateForm(!showCreateForm)}
            className="bg-black text-white px-4 py-2 rounded text-sm font-semibold hover:bg-blue-600 transition"
          >
            {showCreateForm ? "Cancel" : "Create Listing"}
          </button>
        </div>

        {/* Listing creation form */}
        {showCreateForm && (
          <form onSubmit={handleCreateListing} className="mb-12 border border-black rounded p-8 space-y-6 max-w-3xl">
            <h3 className="text-lg font-bold text-black border-b border-black pb-2 mb-4">
              New Listing Parameters
            </h3>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-black">
                  Job Title
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Backend Software Engineer"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="mt-1 block w-full rounded border border-black px-3 py-2 text-black focus:outline-none focus:border-blue-600 sm:text-sm font-light"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-black">
                  Stipend (per month in USD)
                </label>
                <input
                  type="number"
                  required
                  placeholder="e.g. 3000"
                  value={stipend}
                  onChange={(e) => setStipend(e.target.value)}
                  className="mt-1 block w-full rounded border border-black px-3 py-2 text-black focus:outline-none focus:border-blue-600 sm:text-sm font-light"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-black">
                Description
              </label>
              <textarea
                rows={3}
                required
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="mt-1 block w-full rounded border border-black px-3 py-2 text-black focus:outline-none focus:border-blue-600 sm:text-sm font-light"
              />
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-black">
                  Location Type
                </label>
                <select
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="mt-1 block w-full rounded border border-black px-3 py-2 text-black focus:outline-none focus:border-blue-600 sm:text-sm font-light"
                >
                  <option value="REMOTE">Remote</option>
                  <option value="HYBRID">Hybrid</option>
                  <option value="ONSITE">Onsite</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-black">
                  Deadline
                </label>
                <input
                  type="date"
                  required
                  value={deadline}
                  onChange={(e) => setDeadline(e.target.value)}
                  className="mt-1 block w-full rounded border border-black px-3 py-2 text-black focus:outline-none focus:border-blue-600 sm:text-sm font-light"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-black">
                  Max Applicants Cap
                </label>
                <input
                  type="number"
                  required
                  placeholder="e.g. 50"
                  value={maxApplicants}
                  onChange={(e) => setMaxApplicants(e.target.value)}
                  className="mt-1 block w-full rounded border border-black px-3 py-2 text-black focus:outline-none focus:border-blue-600 sm:text-sm font-light"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-black">
                  Target Branch Filter (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Computer Science"
                  value={targetBranch}
                  onChange={(e) => setTargetBranch(e.target.value)}
                  className="mt-1 block w-full rounded border border-black px-3 py-2 text-black focus:outline-none focus:border-blue-600 sm:text-sm font-light"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-black">
                  Target Grad Year Filter (Optional)
                </label>
                <input
                  type="number"
                  placeholder="e.g. 2026"
                  value={targetGradYear}
                  onChange={(e) => setTargetGradYear(e.target.value)}
                  className="mt-1 block w-full rounded border border-black px-3 py-2 text-black focus:outline-none focus:border-blue-600 sm:text-sm font-light"
                />
              </div>
            </div>

            {/* Skills Inputs */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-black">
                  Required Skills
                </label>
                <div className="flex mt-1 space-x-2">
                  <input
                    type="text"
                    placeholder="Add required skill"
                    value={reqSkillInput}
                    onChange={(e) => setReqSkillInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        const trimmed = reqSkillInput.trim().toLowerCase();
                        if (trimmed && !reqSkills.includes(trimmed)) {
                          setReqSkills([...reqSkills, trimmed]);
                          setReqSkillInput("");
                        }
                      }
                    }}
                    className="block w-full rounded border border-black px-3 py-2 text-black focus:outline-none focus:border-blue-600 sm:text-sm font-light"
                  />
                </div>
                <div className="mt-2 flex flex-wrap gap-1">
                  {reqSkills.map((s) => (
                    <span key={s} className="bg-black text-white text-[10px] px-2 py-0.5 rounded flex items-center">
                      {s}
                      <button type="button" onClick={() => setReqSkills(reqSkills.filter((x) => x !== s))} className="ml-1 text-xs">×</button>
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-black">
                  Preferred Skills
                </label>
                <div className="flex mt-1 space-x-2">
                  <input
                    type="text"
                    placeholder="Add preferred skill"
                    value={prefSkillInput}
                    onChange={(e) => setPrefSkillInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        const trimmed = prefSkillInput.trim().toLowerCase();
                        if (trimmed && !prefSkills.includes(trimmed)) {
                          setPrefSkills([...prefSkills, trimmed]);
                          setPrefSkillInput("");
                        }
                      }
                    }}
                    className="block w-full rounded border border-black px-3 py-2 text-black focus:outline-none focus:border-blue-600 sm:text-sm font-light"
                  />
                </div>
                <div className="mt-2 flex flex-wrap gap-1">
                  {prefSkills.map((s) => (
                    <span key={s} className="border border-black bg-white text-black text-[10px] px-2 py-0.5 rounded flex items-center">
                      {s}
                      <button type="button" onClick={() => setPrefSkills(prefSkills.filter((x) => x !== s))} className="ml-1 text-xs">×</button>
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <button
              type="submit"
              className="w-full bg-black text-white font-semibold py-3 rounded text-sm hover:bg-blue-600 transition"
            >
              Post Opportunity (DRAFT)
            </button>
          </form>
        )}

        {listings.length === 0 ? (
          <div className="text-center py-12 border border-dashed border-black rounded">
            <p className="text-black font-light">No listings created yet. Click "Create Listing" above to get started.</p>
          </div>
        ) : (
          <div className="space-y-12">
            {listings.map((l) => (
              <div key={l.id} className="border border-black rounded p-8">
                <div className="flex items-center justify-between border-b border-black pb-4 mb-6">
                  <div>
                    <h3 className="text-2xl font-bold text-black">{l.title}</h3>
                    <div className="mt-2 flex flex-wrap gap-2 text-xs font-light text-black">
                      <span>{l.location}</span>
                      <span>•</span>
                      <span>${l.stipend}/mo</span>
                      <span>•</span>
                      <span>Cap: {l.currentApplicants}/{l.maxApplicants} applicants</span>
                    </div>
                  </div>

                  <div className="flex flex-col items-end space-y-2">
                    <div className="flex items-center space-x-2">
                      <span className="text-xs font-semibold text-black uppercase">Status:</span>
                      <span className="text-xs font-bold text-blue-600 uppercase border border-blue-600 px-2 py-0.5 rounded">
                        {l.status}
                      </span>
                    </div>
                    <div className="flex space-x-2">
                      {l.status === "DRAFT" && (
                        <button
                          onClick={() => handleUpdateStatus(l.id, "ACTIVE")}
                          className="bg-black hover:bg-blue-600 text-white text-xs font-semibold px-3 py-1.5 rounded transition"
                        >
                          Publish ACTIVE
                        </button>
                      )}
                      {l.status === "ACTIVE" && (
                        <button
                          onClick={() => handleUpdateStatus(l.id, "CLOSED")}
                          className="bg-white border border-black hover:border-blue-600 hover:text-blue-600 text-black text-xs font-semibold px-3 py-1.5 rounded transition"
                        >
                          Manual CLOSE
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Applications section */}
                <div>
                  <div className="flex justify-between items-center mb-4">
                    <h4 className="text-sm font-semibold uppercase tracking-wider text-black">
                      Applicants ({l.applications.length})
                    </h4>
                    {l.applications.length > 0 && (
                      <div className="flex items-center space-x-2">
                        <span className="text-xs font-light text-black">Bulk Status Update:</span>
                        <button
                          onClick={() => handleBulkUpdateApplicants(l.id, "UNDER_REVIEW", "SUBMITTED")}
                          className="border border-black text-xs font-semibold px-2 py-1 hover:border-blue-600 hover:text-blue-600 transition"
                        >
                          All SUBMITTED → UNDER REVIEW
                        </button>
                      </div>
                    )}
                  </div>

                  {l.applications.length === 0 ? (
                    <p className="text-xs font-light text-black py-4">No applications received yet.</p>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs divide-y divide-black">
                        <thead>
                          <tr className="font-semibold text-black uppercase tracking-wider bg-gray-55">
                            <th className="py-3 px-4">Applicant</th>
                            <th className="py-3 px-4">Branch & GPA</th>
                            <th className="py-3 px-4">Match Score</th>
                            <th className="py-3 px-4">Current Status</th>
                            <th className="py-3 px-4 text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 font-light">
                          {l.applications.map((app: any) => (
                            <tr key={app.id} className="hover:bg-gray-50">
                              <td className="py-4 px-4">
                                <div className="font-bold text-black">{app.student.name}</div>
                                <div className="text-[10px] text-black">{app.student.email}</div>
                                {app.student.githubUrl && (
                                  <a href={app.student.githubUrl} target="_blank" rel="noreferrer" className="text-[10px] text-blue-600 hover:underline mr-2">GitHub</a>
                                )}
                                {app.student.resumeUrl && (
                                  <a href={app.student.resumeUrl} target="_blank" rel="noreferrer" className="text-[10px] text-blue-600 hover:underline">Resume</a>
                                )}
                              </td>
                              <td className="py-4 px-4">
                                <div>{app.student.college}</div>
                                <div>{app.student.branch} (Class of {app.student.gradYear})</div>
                                <div className="font-semibold text-[10px]">CGPA: {app.student.cgpa}</div>
                              </td>
                              <td className="py-4 px-4 font-bold text-blue-600">
                                {app.matchScore}%
                              </td>
                              <td className="py-4 px-4 font-semibold uppercase tracking-wider text-black">
                                {app.status}
                              </td>
                              <td className="py-4 px-4 text-right space-y-1 sm:space-y-0 sm:space-x-1">
                                <button
                                  onClick={() => handleUpdateApplicantStatus(l.id, app.id, "UNDER_REVIEW")}
                                  className="border border-black text-[10px] font-semibold px-2 py-1 rounded hover:border-blue-600 hover:text-blue-600 transition"
                                >
                                  Review
                                </button>
                                <button
                                  onClick={() => handleUpdateApplicantStatus(l.id, app.id, "SHORTLISTED")}
                                  className="border border-black text-[10px] font-semibold px-2 py-1 rounded hover:border-blue-600 hover:text-blue-600 transition"
                                >
                                  Shortlist
                                </button>
                                <button
                                  onClick={() => handleUpdateApplicantStatus(l.id, app.id, "OFFER_EXTENDED")}
                                  className="border border-black text-[10px] font-semibold px-2 py-1 rounded hover:border-blue-600 hover:text-blue-600 transition"
                                >
                                  Offer
                                </button>
                                <button
                                  onClick={() => handleUpdateApplicantStatus(l.id, app.id, "REJECTED")}
                                  className="border border-black text-[10px] font-semibold px-2 py-1 rounded hover:border-blue-600 hover:text-blue-600 transition"
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
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
