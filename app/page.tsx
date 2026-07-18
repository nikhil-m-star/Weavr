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
      <div className="flex flex-1 items-center justify-center bg-white min-h-screen">
        <div className="flex flex-col items-center space-y-4">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
          <span className="text-sm font-medium text-black">Loading Weavr...</span>
        </div>
      </div>
    );
  }

  if (!isSignedIn) {
    return (
      <div className="flex flex-col flex-1 items-center justify-center bg-white px-6 py-24 sm:py-32 lg:px-8 min-h-screen">
        <div className="text-center max-w-md">
          <h1 className="text-6xl font-black tracking-tight text-black sm:text-7xl">
            Weavr
          </h1>
          <p className="mt-6 text-base leading-7 text-black font-light">
            Talent Matching Platform.
          </p>
          <div className="mt-10 flex items-center justify-center gap-x-6">
            <SignInButton mode="modal">
              <button className="rounded bg-black px-6 py-3 text-sm font-semibold text-white shadow-sm hover:bg-blue-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black transition-colors duration-200">
                Sign In
              </button>
            </SignInButton>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
