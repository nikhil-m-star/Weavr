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
        // Refresh feed
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
        // Refresh feed
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
      <div className="flex flex-1 items-center justify-center bg-white min-h-screen">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="flex flex-col flex-1 bg-white min-h-screen">
      {/* Navigation Header */}
      <nav className="border-b border-black py-4 px-6 lg:px-8 bg-white sticky top-0 z-50">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-8">
            <span className="text-2xl font-black text-black tracking-tight cursor-pointer" onClick={() => router.push("/")}>
              Weavr
            </span>
            <span className="text-xs font-semibold text-blue-600 uppercase tracking-widest px-2 py-1 border border-blue-600 rounded">
              Student Feed
            </span>
          </div>
          <div className="flex items-center space-x-6">
            <button
              onClick={() => router.push("/profile")}
              className="text-sm font-semibold text-black hover:text-blue-600 transition"
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

      {/* Main Content */}
      <main className="max-w-7xl mx-auto w-full px-6 lg:px-8 py-12 flex-1">
        {error && (
          <div className="mb-8 border border-black bg-white text-blue-600 p-4 rounded text-sm font-semibold">
            {error}
          </div>
        )}

        <h2 className="text-3xl font-black text-black border-b border-black pb-4 mb-8">
          Available Listings
        </h2>

        {listings.length === 0 ? (
          <div className="text-center py-12 border border-dashed border-black rounded">
            <p className="text-black font-light">No matching active listings found.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
            {listings.map((l) => {
              // Find the application for this listing
              const isApplied = l.hasApplied;
              const appStatus = l.applicationStatus;
              
              // Define match score color
              const isHighMatch = l.matchScore >= 70;

              return (
                <div
                  key={l.id}
                  className="border border-black rounded p-6 flex flex-col justify-between hover:shadow-md transition-shadow duration-200"
                >
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-xs font-semibold text-black uppercase tracking-wider">
                        {l.company?.name || "Acme Corp"}
                      </span>
                      <span
                        className={`text-xs font-bold px-2 py-1 rounded border ${
                          isHighMatch ? "border-blue-600 text-blue-600 bg-white" : "border-black text-black bg-white"
                        }`}
                      >
                        {l.matchScore}% Match
                      </span>
                    </div>

                    <h3 className="text-xl font-bold text-black mb-2">{l.title}</h3>
                    <p className="text-xs font-light text-black mb-4 line-clamp-3">
                      {l.description}
                    </p>

                    <div className="grid grid-cols-2 gap-4 mb-4 border-t border-b border-black py-3 my-4">
                      <div>
                        <span className="block text-[10px] font-semibold text-black uppercase tracking-wider">
                          Stipend
                        </span>
                        <span className="text-sm font-bold text-black">
                          ${l.stipend}/mo
                        </span>
                      </div>
                      <div>
                        <span className="block text-[10px] font-semibold text-black uppercase tracking-wider">
                          Location
                        </span>
                        <span className="text-xs font-light text-black">
                          {l.location}
                        </span>
                      </div>
                    </div>

                    <div className="mb-6">
                      <span className="block text-[10px] font-semibold text-black uppercase tracking-wider mb-2">
                        Required Skills
                      </span>
                      <div className="flex flex-wrap gap-1">
                        {l.requiredSkills.map((rs: any) => (
                          <span
                            key={rs.skill.id}
                            className="bg-black text-white text-[10px] px-2 py-0.5 rounded font-light"
                          >
                            {rs.skill.name}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="mt-6">
                    {isApplied ? (
                      <div className="flex flex-col space-y-2">
                        <div className="flex items-center justify-between border border-black rounded p-2 text-xs">
                          <span className="font-semibold text-black">Status:</span>
                          <span className="font-bold text-blue-600 uppercase tracking-wider">
                            {appStatus}
                          </span>
                        </div>
                        {appStatus === "SUBMITTED" && (
                          <button
                            onClick={() => handleWithdraw(l.applicationId)}
                            disabled={withdrawingId === l.applicationId}
                            className="w-full border border-black hover:border-blue-600 hover:text-blue-600 text-xs font-semibold py-2 rounded transition disabled:opacity-50"
                          >
                            {withdrawingId === l.applicationId ? "Withdrawing..." : "Withdraw Application"}
                          </button>
                        )}
                      </div>
                    ) : l.currentApplicants >= l.maxApplicants ? (
                      <button
                        disabled
                        className="w-full bg-white border border-black text-black text-xs font-semibold py-3 rounded opacity-50 cursor-not-allowed"
                      >
                        Cap Reached
                      </button>
                    ) : (
                      <button
                        onClick={() => handleApply(l.id)}
                        disabled={applyingId === l.id}
                        className="w-full bg-black hover:bg-blue-600 text-white text-xs font-semibold py-3 rounded transition"
                      >
                        {applyingId === l.id ? "Applying..." : "Apply Now"}
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
