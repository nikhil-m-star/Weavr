"use client";

import { SignedIn, SignedOut, SignInButton, SignOutButton, SignUpButton } from "@clerk/nextjs";
import { usePathname } from "next/navigation";

export default function SiteAuthBar() {
  const pathname = usePathname();

  if (pathname.startsWith("/sign-in") || pathname.startsWith("/sign-up")) {
    return null;
  }

  return (
    <div className="fixed top-4 right-4 z-[60]">
      <div className="flex items-center gap-2 rounded-full bg-white/5 px-3 py-2 backdrop-blur-md border border-white/10 shadow-2xl">
        <SignedOut>
          <SignInButton mode="modal">
            <button className="rounded-full px-4 py-1.5 text-[9px] font-black uppercase tracking-[0.2em] text-white hover:bg-white/10 transition-colors cursor-pointer">
              Log In
            </button>
          </SignInButton>
          <SignUpButton mode="modal">
            <button className="solid-btn rounded-full px-4 py-1.5 text-[9px] font-black uppercase tracking-[0.2em] cursor-pointer">
              Sign Up
            </button>
          </SignUpButton>
        </SignedOut>
        <SignedIn>
          <SignOutButton>
            <button className="solid-btn rounded-full px-4 py-1.5 text-[9px] font-black uppercase tracking-[0.2em] cursor-pointer">
              Sign Out
            </button>
          </SignOutButton>
        </SignedIn>
      </div>
    </div>
  );
}