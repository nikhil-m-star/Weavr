"use client";

import { useUser, UserButton } from "@clerk/nextjs";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function StudentListings() {
  const { isLoaded, isSignedIn } = useUser();
  const router = useRouter();

  const [listings, setListings] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [applyingId, setApplyingId] = useState<string | null>(null);
  const [withdrawingId, setWithdrawingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showNotifications, setShowNotifications] = useState(false);
  const [sortBy, setSortBy] = useState<"match" | "normal">("match");

  const fetchData = async () => {
    try {
      const [listingsRes, profileRes, notifRes] = await Promise.all([
        fetch("/api/listings"),
        fetch("/api/profile"),
        fetch("/api/notifications?read=false"),
      ]);

      const listingsData = await listingsRes.json();
      const profileData = await profileRes.json();
      const notifData = await notifRes.json();

      if (profileData.success && profileData.data.role !== "student") {
        router.push(profileData.data.role === "company" ? "/company" : "/profile");
        return;
      }

      if (listingsData.success) {
        setListings(listingsData.data);
      }
      if (notifData.success) {
        setNotifications(notifData.data.notifications || []);
      }
    } catch (err) {
      console.error("Failed to load feed data:", err);
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

  const handleApply = async (listingId: string) => {
    setApplyingId(listingId);
    setError(null);

    try {
      const res = await fetch("/api/applications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ listingId }),
      });

      const data = await res.json();
      if (data.success) {
        await fetchData();
      } else {
        setError(data.error.message || "Failed to submit application");
      }
    } catch (err) {
      setError("An unexpected error occurred.");
    } finally {
      setApplyingId(null);
    }
  };

  const handleWithdraw = async (applicationId: string) => {
    setWithdrawingId(applicationId);
    setError(null);

    try {
      const res = await fetch(`/api/applications/${applicationId}/withdraw`, {
        method: "POST",
      });

      const data = await res.json();
      if (data.success) {
        await fetchData();
      } else {
        setError(data.error.message || "Failed to withdraw application");
      }
    } catch (err) {
      setError("An unexpected error occurred.");
    } finally {
      setWithdrawingId(null);
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
      <div className="flex flex-1 items-center justify-center bg-black min-h-screen">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-white border-t-transparent"></div>
      </div>
    );
  }

  const sortedListings = [...listings].sort((a, b) => {
    if (sortBy === "match") {
      return b.matchScore - a.matchScore;
    } else {
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    }
  });

  return (
    <div className="flex flex-col flex-1 bg-black min-h-screen relative overflow-hidden font-sans">
      {/* Navigation Header */}
      <nav className="glass-panel py-4 px-6 lg:px-8 sticky top-0 z-50 backdrop-blur-md">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-6">
            <span
              className="text-lg font-black text-white tracking-[0.2em] uppercase cursor-pointer select-none"
              onClick={() => router.push("/")}
            >
              Weavr
            </span>
            <span className="text-[9px] font-bold text-card-foreground uppercase tracking-widest px-2 py-0.5 rounded bg-white/5">
              Opportunities Feed
            </span>
          </div>
          <div className="flex items-center space-x-6">
            <button
              onClick={() => router.push("/profile")}
              className="text-[9px] font-bold uppercase tracking-widest text-card-foreground hover:text-white transition-colors"
            >
              My Profile
            </button>
            <div className="relative">
              <button
                onClick={() => {
                  setShowNotifications(!showNotifications);
                  if (!showNotifications && notifications.length > 0) {
                    handleMarkNotificationsRead();
                  }
                }}
                className="relative text-[9px] font-bold uppercase tracking-widest text-card-foreground hover:text-white transition-colors flex items-center"
              >
                Inbox
                {notifications.length > 0 && (
                  <span className="ml-1.5 h-1.5 w-1.5 rounded-full bg-white"></span>
                )}
              </button>
              {showNotifications && (
                <div className="absolute right-0 mt-3 w-80 rounded bg-[#0c0c0c] shadow-2xl py-2 z-50 animate-fade-in">
                  <div className="px-4 py-2 font-bold text-[9px] uppercase tracking-wider text-white bg-white/5">
                    Unread Notifications
                  </div>
                  {notifications.length === 0 ? (
                    <div className="px-4 py-3 text-[9px] uppercase tracking-wider text-card-foreground">No updates</div>
                  ) : (
                    <div className="max-h-60 overflow-y-auto">
                      {notifications.map((n) => (
                        <div key={n.id} className="px-4 py-3 text-[9px] text-card-foreground leading-relaxed font-light bg-black/20">
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
      <main className="max-w-7xl mx-auto w-full px-6 lg:px-8 py-12 flex-1 z-10">
        {error && (
          <div className="mb-8 bg-white/10 text-white p-4 rounded text-xs uppercase tracking-wider font-semibold">
            {error}
          </div>
        )}

        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center pb-4 mb-10 select-none gap-4">
          <h2 className="text-2xl font-black text-white uppercase tracking-[0.2em]">
            {sortBy === "match" ? "Match Feed" : "Opportunities"}
          </h2>
          <div className="flex rounded bg-[#0c0c0c] p-1">
            <button
              onClick={() => setSortBy("match")}
              className={`px-4 py-1.5 text-[9px] font-bold uppercase tracking-wider rounded transition-colors cursor-pointer ${
                sortBy === "match" ? "bg-white text-black" : "text-card-foreground hover:text-white"
              }`}
            >
              Best Match
            </button>
            <button
              onClick={() => setSortBy("normal")}
              className={`px-4 py-1.5 text-[9px] font-bold uppercase tracking-wider rounded transition-colors cursor-pointer ${
                sortBy === "normal" ? "bg-white text-black" : "text-card-foreground hover:text-white"
              }`}
            >
              All Listings
            </button>
          </div>
        </div>

        {sortedListings.length === 0 ? (
          <div className="text-center py-16 rounded bg-[#0c0c0c]/50">
            <p className="text-[10px] uppercase tracking-wider text-card-foreground font-light">No matching active positions found.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
            {sortedListings.map((l) => {
              const isApplied = l.hasApplied;
              const appStatus = l.applicationStatus;

              return (
                <div
                  key={l.id}
                  className="glass-card rounded-lg p-6 flex flex-col justify-between transition-all duration-200"
                >
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-[9px] font-bold text-card-foreground uppercase tracking-widest">
                        {l.company?.name || "Acme Corp"}
                      </span>
                      <span className="text-[9px] font-bold px-2 py-0.5 rounded text-white bg-white/10 uppercase tracking-wider">
                        {l.matchScore}% Match
                      </span>
                    </div>

                    <div>
                      <h3 className="text-base font-bold text-white uppercase tracking-wide line-clamp-1">{l.title}</h3>
                      <p className="text-[10px] font-light text-card-foreground leading-relaxed mt-2 line-clamp-3">
                        {l.description}
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-4 py-3.5 my-2 bg-white/[0.03] rounded px-4">
                      <div>
                        <span className="block text-[8px] font-semibold text-card-foreground uppercase tracking-widest">
                          Stipend
                        </span>
                        <span className="text-xs font-bold text-white tracking-wider">
                          ${l.stipend.toLocaleString()}/mo
                        </span>
                      </div>
                      <div>
                        <span className="block text-[8px] font-semibold text-card-foreground uppercase tracking-widest">
                          Location
                        </span>
                        <span className="text-[9px] font-bold text-white tracking-wider uppercase">
                          {l.location}
                        </span>
                      </div>
                    </div>

                    <div>
                      <span className="block text-[8px] font-semibold text-card-foreground uppercase tracking-widest mb-2">
                        Required Core
                      </span>
                      <div className="flex flex-wrap gap-1">
                        {l.requiredSkills.map((rs: any) => (
                          <span
                            key={rs.skill.id}
                            className="bg-white/5 text-[8px] px-2 py-0.5 rounded-full uppercase tracking-wider text-white font-light"
                          >
                            {rs.skill.name}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="mt-8">
                    {isApplied ? (
                      <div className="flex flex-col space-y-2">
                        <div className="flex items-center justify-between rounded p-2 text-xs bg-white/5">
                          <span className="text-[8px] font-bold uppercase tracking-wider text-card-foreground">Application:</span>
                          <span className="text-[9px] font-bold text-white uppercase tracking-widest">
                            {appStatus}
                          </span>
                        </div>
                        {appStatus === "SUBMITTED" && (
                          <button
                            onClick={() => handleWithdraw(l.applicationId)}
                            disabled={withdrawingId === l.applicationId}
                            className="w-full bg-[#0c0c0c] hover:bg-white/10 text-white text-[9px] font-bold uppercase tracking-widest py-2 rounded transition cursor-pointer disabled:opacity-50"
                          >
                            {withdrawingId === l.applicationId ? "Withdrawing" : "Withdraw Apply"}
                          </button>
                        )}
                      </div>
                    ) : l.currentApplicants >= l.maxApplicants ? (
                      <button
                        disabled
                        className="w-full bg-white/5 text-card-foreground text-[9px] font-bold uppercase tracking-widest py-3 rounded cursor-not-allowed opacity-40"
                      >
                        Cap Overload
                      </button>
                    ) : (
                      <button
                        onClick={() => handleApply(l.id)}
                        disabled={applyingId === l.id}
                        className="w-full bg-white text-black hover:bg-[#dddddd] text-[9px] font-bold uppercase tracking-widest py-3 rounded transition cursor-pointer shadow-md"
                      >
                        {applyingId === l.id ? "Submitting" : "Apply Position"}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
