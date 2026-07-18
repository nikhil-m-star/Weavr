"use client";

import { useUser, SignInButton } from "@clerk/nextjs";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
  const { isSignedIn, isLoaded } = useUser();
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isLoaded && isSignedIn) {
      setLoading(true);
      fetch("/api/profile")
        .then((res) => res.json())
        .then((res) => {
          if (res.success) {
            if (res.data.role === "student") {
              router.push("/listings");
            } else if (res.data.role === "company") {
              router.push("/company");
            } else {
              router.push("/profile");
            }
          } else {
            router.push("/profile");
          }
        })
        .catch(() => {
          router.push("/profile");
        });
    }
  }, [isLoaded, isSignedIn, router]);

  if (!isLoaded || loading) {
    return (
      <div className="flex flex-1 items-center justify-center bg-[#050505] min-h-screen">
        <div className="flex flex-col items-center space-y-4">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-accent-cyan border-t-transparent"></div>
          <span className="text-[10px] font-semibold uppercase tracking-[0.25em] text-white">Loading Weavr</span>
        </div>
      </div>
    );
  }

  if (!isSignedIn) {
    return (
      <div className="flex flex-col flex-1 items-center justify-center bg-[#050505] px-6 py-24 min-h-screen relative overflow-hidden">
        {/* Ambient background glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-accent-purple/10 rounded-full blur-[100px] pointer-events-none"></div>

        <div className="text-center max-w-xl z-10 space-y-8">
          <h1 className="text-7xl sm:text-9xl font-black tracking-[0.25em] text-white uppercase select-none">
            Weavr
          </h1>
          <p className="text-[10px] sm:text-xs uppercase tracking-[0.3em] text-card-foreground font-light">
            AI-Powered Talent Matching Platform
          </p>
          <div className="pt-6">
            <SignInButton mode="modal">
              <button className="gradient-btn rounded-full px-8 py-3.5 text-xs font-bold uppercase tracking-[0.2em] text-white shadow-lg cursor-pointer">
                Enter Platform
              </button>
            </SignInButton>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
