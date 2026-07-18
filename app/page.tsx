"use client";

import { useUser, SignInButton, SignUpButton } from "@clerk/nextjs";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
  const { isSignedIn, isLoaded } = useUser();
  const router = useRouter();
  const [dashboardUrl, setDashboardUrl] = useState<string>("/profile");
  const [loadingRole, setLoadingRole] = useState(false);

  useEffect(() => {
    if (isLoaded && isSignedIn) {
      setLoadingRole(true);
      fetch("/api/profile")
        .then((res) => res.json())
        .then((res) => {
          if (res.success) {
            if (res.data.role === "student") {
              setDashboardUrl("/listings");
            } else if (res.data.role === "company") {
              setDashboardUrl("/company");
            } else {
              setDashboardUrl("/profile");
            }
          } else {
            setDashboardUrl("/profile");
          }
        })
        .catch(() => {
          setDashboardUrl("/profile");
        })
        .finally(() => {
          setLoadingRole(false);
        });
    }
  }, [isLoaded, isSignedIn]);

  if (!isLoaded) {
    return (
      <div className="flex flex-1 items-center justify-center bg-black min-h-screen">
        <div className="flex flex-col items-center space-y-4">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-black text-white min-h-screen flex flex-col justify-between font-sans selection:bg-white selection:text-black">
      {/* Header */}
      <header className="py-8 px-8 flex items-center justify-between">
        <span className="text-sm font-black uppercase tracking-[0.25em] cursor-pointer" onClick={() => router.push("/")}>
          Weavr
        </span>
        <div>
          {isSignedIn ? (
            <button
              onClick={() => router.push(dashboardUrl)}
              disabled={loadingRole}
              className="solid-btn rounded px-5 py-2 text-[9px] font-black uppercase tracking-[0.2em] shadow cursor-pointer disabled:opacity-50"
            >
              {loadingRole ? "Loading" : "Dashboard"}
            </button>
          ) : (
            <SignInButton mode="modal">
              <button className="text-[9px] font-black uppercase tracking-[0.2em] hover:text-[#aaaaaa] transition-colors cursor-pointer">
                Log In
              </button>
            </SignInButton>
          )}
        </div>
      </header>

      {/* Main Hero */}
      <main className="flex flex-col items-center justify-center px-6 text-center space-y-6 flex-1 py-12">
        <img src="/logo.png" alt="Weavr Logo" className="w-20 h-20 mb-2 animate-fade-in" />
        <div className="space-y-3">
          <h1 className="text-3xl md:text-4xl font-black tracking-[0.2em] uppercase text-white">
            WEAVR
          </h1>
          <p className="text-[9px] uppercase tracking-[0.25em] text-card-foreground font-light max-w-md mx-auto">
            Real-Time AI Talent Matching Engine
          </p>
        </div>
        <div className="pt-6">
          {isSignedIn ? (
            <button
              onClick={() => router.push(dashboardUrl)}
              className="solid-btn rounded px-8 py-3 text-[10px] font-bold uppercase tracking-[0.2em] transition duration-200 cursor-pointer"
            >
              Go to Dashboard
            </button>
          ) : (
            <div className="flex gap-4">
              <SignUpButton mode="modal">
                <button className="solid-btn rounded px-8 py-3 text-[10px] font-bold uppercase tracking-[0.2em] transition duration-200 cursor-pointer">
                  Get Started
                </button>
              </SignUpButton>
              <SignInButton mode="modal">
                <button className="bg-white/5 hover:bg-white/10 rounded px-8 py-3 text-[10px] font-bold uppercase tracking-[0.2em] transition duration-200 cursor-pointer">
                  Log In
                </button>
              </SignInButton>
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="py-8 px-8 flex justify-between items-center text-[9px] uppercase tracking-wider text-card-foreground font-light">
        <span>© 2026 Weavr</span>
        <a href="https://github.com/nikhil-m-star/Weavr" target="_blank" rel="noreferrer" className="hover:text-white transition-colors">
          GitHub
        </a>
      </footer>
    </div>
  );
}
