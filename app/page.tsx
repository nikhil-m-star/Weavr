"use client";

import { useUser, SignInButton, SignUpButton } from "@clerk/nextjs";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
  const { isSignedIn, isLoaded } = useUser();
  const router = useRouter();
  const [sliderValue, setSliderValue] = useState(4); // default candidates matching slider
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
      <div className="flex flex-1 items-center justify-center bg-[#050505] min-h-screen">
        <div className="flex flex-col items-center space-y-4">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-accent-cyan border-t-transparent"></div>
          <span className="text-[10px] font-semibold uppercase tracking-[0.25em] text-white">Loading Weavr</span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#050505] text-white min-h-screen flex flex-col font-sans overflow-x-hidden selection:bg-accent-cyan selection:text-black">
      {/* Ambient background glows */}
      <div className="absolute top-24 left-1/4 w-[600px] h-[600px] bg-accent-purple/5 rounded-full blur-[130px] pointer-events-none"></div>
      <div className="absolute top-[120vh] right-1/4 w-[500px] h-[500px] bg-accent-cyan/5 rounded-full blur-[120px] pointer-events-none"></div>

      {/* Sticky Header with mix-blend-difference */}
      <header className="fixed top-0 left-0 right-0 py-6 px-8 flex items-center justify-between z-50 mix-blend-difference">
        <div className="flex items-center space-x-2.5">
          <span className="text-xl font-black uppercase tracking-[0.2em] cursor-pointer" onClick={() => router.push("/")}>Weavr</span>
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
          </span>
        </div>
        <nav className="hidden md:flex items-center space-x-8 text-[10px] font-bold uppercase tracking-[0.2em]">
          <a href="#features" className="hover:text-accent-cyan transition-colors">Features</a>
          <a href="#matches" className="hover:text-accent-cyan transition-colors">Matches</a>
          <a href="#pricing" className="hover:text-accent-cyan transition-colors">Pricing</a>
        </nav>
        <div className="flex items-center space-x-4">
          {isSignedIn ? (
            <button
              onClick={() => router.push(dashboardUrl)}
              disabled={loadingRole}
              className="solid-btn rounded-full px-6 py-2.5 text-[9px] font-black uppercase tracking-[0.2em] shadow-lg cursor-pointer disabled:opacity-50"
            >
              {loadingRole ? "Loading..." : "Go to Dashboard"}
            </button>
          ) : (
            <>
              <SignInButton mode="modal">
                <button className="text-[10px] font-black uppercase tracking-[0.2em] text-white hover:text-accent-cyan transition-colors cursor-pointer mr-2">
                  Log In
                </button>
              </SignInButton>
              <SignUpButton mode="modal">
                <button className="solid-btn rounded-full px-6 py-2.5 text-[9px] font-black uppercase tracking-[0.2em] shadow-lg cursor-pointer">
                  Sign Up
                </button>
              </SignUpButton>
            </>
          )}
        </div>
      </header>

      {/* 3D Immersive Hero Section */}
      <section className="min-h-screen flex flex-col items-center justify-center px-6 relative">
        <div className="text-center max-w-5xl z-10 space-y-8 select-none">
          <h1 className="text-[12vw] font-black tracking-tighter uppercase leading-none text-white select-none">
            WEAVR
          </h1>
          <p className="text-xs sm:text-sm uppercase tracking-[0.35em] text-card-foreground font-light max-w-2xl mx-auto">
            Immersive Real-Time AI Talent Matching Engine.
          </p>
          <div className="pt-8 flex flex-col sm:flex-row justify-center items-center gap-4">
            {isSignedIn ? (
              <button
                onClick={() => router.push(dashboardUrl)}
                className="solid-btn rounded-full px-8 py-3.5 text-xs font-bold uppercase tracking-[0.2em] shadow-2xl transition duration-300 cursor-pointer"
              >
                Go to Dashboard
              </button>
            ) : (
              <>
                <SignUpButton mode="modal">
                  <button className="solid-btn rounded-full px-8 py-3.5 text-xs font-bold uppercase tracking-[0.2em] shadow-2xl transition duration-300 cursor-pointer">
                    Get Started
                  </button>
                </SignUpButton>
                <SignInButton mode="modal">
                  <button className="hover:text-accent-cyan hover:bg-white/10 bg-white/5 rounded-full px-8 py-3.5 text-xs font-bold uppercase tracking-[0.2em] text-white transition duration-300 cursor-pointer">
                    Log In
                  </button>
                </SignInButton>
              </>
            )}
          </div>
        </div>
      </section>

      {/* Case Studies Bento Grid */}
      <section id="features" className="py-32 px-6 lg:px-8 max-w-7xl mx-auto w-full">
        <div className="mb-16">
          <h2 className="text-[6vw] font-black uppercase tracking-tighter leading-none">
            BENTO ENGINE
          </h2>
          <p className="text-[10px] uppercase tracking-[0.25em] text-accent-cyan font-bold mt-2">
            Modular matching infrastructure.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Featured Bento Card (Spans 2 cols) */}
          <div className="md:col-span-2 glass-card rounded-xl p-8 flex flex-col justify-between aspect-video relative group overflow-hidden">
            {/* macOS controls */}
            <div className="flex space-x-1.5 absolute top-4 left-6">
              <span className="w-2.5 h-2.5 rounded-full bg-[#FF5F56]"></span>
              <span className="w-2.5 h-2.5 rounded-full bg-[#FFBD2E]"></span>
              <span className="w-2.5 h-2.5 rounded-full bg-[#27C93F]"></span>
            </div>
            <div className="mt-8 space-y-4">
              <span className="text-[9px] font-bold text-accent-cyan uppercase tracking-widest px-2.5 py-0.5 rounded bg-accent-cyan/5 w-fit block">
                Interactive Logic
              </span>
              <h3 className="text-2xl font-bold uppercase tracking-wider text-white">Dynamic Match Score</h3>
              <p className="text-xs font-light text-card-foreground leading-relaxed max-w-lg">
                Every opportunity is evaluated in real-time using weights: required skills (40%), preferred skills (20%), target branch (15%), completeness (15%), and recency decay (10%).
              </p>
            </div>
            {/* Visual grayscale graphic mock */}
            <div className="mt-6 rounded bg-[#090909] p-4 flex justify-between items-center grayscale group-hover:grayscale-0 transition-all duration-300">
              <div className="space-y-1">
                <div className="text-[10px] font-bold uppercase text-white">Full Stack React Engineer</div>
                <div className="text-[9px] text-card-foreground uppercase">Tech Corp • Remote</div>
              </div>
              <div className="text-accent-purple text-xs font-black px-3 py-1 rounded bg-accent-purple/5 shadow-[0_0_10px_rgba(124,58,237,0.2)]">
                96% Match
              </div>
            </div>
          </div>

          {/* Bento Card 2 */}
          <div className="glass-card rounded-xl p-8 flex flex-col justify-between">
            <span className="text-[9px] font-bold text-accent-pink uppercase tracking-widest px-2.5 py-0.5 rounded bg-accent-pink/5 w-fit">
              Race Safety
            </span>
            <div className="space-y-3 mt-8">
              <h3 className="text-lg font-bold uppercase tracking-wider text-white">Concurrency Caps</h3>
              <p className="text-xs font-light text-card-foreground leading-relaxed">
                Strictly queued application capacity caps utilizing row locking. Automatically closes at max limit, and auto-reopens upon student withdrawal.
              </p>
            </div>
          </div>

          {/* Bento Card 3 */}
          <div className="glass-card rounded-xl p-8 flex flex-col justify-between">
            <span className="text-[9px] font-bold text-accent-purple uppercase tracking-widest px-2.5 py-0.5 rounded bg-accent-purple/5 w-fit">
              Recruiter Intelligence
            </span>
            <div className="space-y-3 mt-8">
              <h3 className="text-lg font-bold uppercase tracking-wider text-white">NVIDIA NIM Analysis</h3>
              <p className="text-xs font-light text-card-foreground leading-relaxed">
                Companies can trigger automated LLM evaluations using NVIDIA NIM, returning structured pros, cons, and qualitative recruiter suitability scores.
              </p>
            </div>
          </div>

          {/* Bento Card 4 (Spans 2 cols) */}
          <div className="md:col-span-2 glass-card rounded-xl p-8 flex flex-col justify-between aspect-video md:aspect-auto">
            <span className="text-[9px] font-bold text-white uppercase tracking-widest px-2.5 py-0.5 rounded bg-white/5 w-fit">
              Completeness Engine
            </span>
            <div className="space-y-4 mt-8">
              <h3 className="text-xl font-bold uppercase tracking-wider text-white">Interactive Progress Rings</h3>
              <p className="text-xs font-light text-card-foreground leading-relaxed max-w-md">
                Profiles are calculated on-the-fly, generating visual progress widgets to guide candidate optimization, yielding higher match scores in the index.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section with Glow and Range Calculator */}
      <section id="pricing" className="py-32 bg-[#0B0216] relative overflow-hidden px-6">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-[#7C3AED]/10 rounded-full blur-[100px] pointer-events-none"></div>

        <div className="max-w-7xl mx-auto w-full space-y-24 z-10 relative">
          <div className="text-center">
            <h2 className="text-[6vw] font-black uppercase tracking-tighter leading-none">PRICING TIERS</h2>
            <p className="text-[10px] uppercase tracking-[0.25em] text-accent-purple font-bold mt-2">Flexible plans for companies and recruiters.</p>
          </div>

          {/* Three Tier Subscription Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-center max-w-5xl mx-auto">
            {/* Free Card */}
            <div className="glass-card rounded-xl p-8 space-y-6">
              <div className="text-[10px] font-bold uppercase tracking-widest text-card-foreground">Tier 01</div>
              <h3 className="text-xl font-bold uppercase tracking-wider text-white">Starter</h3>
              <div className="text-3xl font-black uppercase tracking-wide text-white">$0</div>
              <p className="text-[11px] font-light text-card-foreground leading-relaxed">
                Basic matching, up to 2 active listings, and standard rule-based alignment scoring.
              </p>
              {isSignedIn ? (
                <button
                  onClick={() => router.push(dashboardUrl)}
                  className="w-full bg-white/5 text-[10px] font-bold uppercase tracking-widest py-2.5 rounded-lg hover:bg-white hover:text-black transition cursor-pointer"
                >
                  Go to Dashboard
                </button>
              ) : (
                <SignInButton mode="modal">
                  <button className="w-full bg-white/5 text-[10px] font-bold uppercase tracking-widest py-2.5 rounded-lg hover:bg-white hover:text-black transition cursor-pointer">
                    Join Free
                  </button>
                </SignInButton>
              )}
            </div>

            {/* Growth Card (Scaled with white background) */}
            <div className="bg-white text-[#111111] rounded-xl p-8 space-y-6 shadow-2xl transform md:scale-105 relative z-20">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-accent-purple text-white text-[8px] font-black uppercase tracking-widest px-3 py-1 rounded-full">
                Popular
              </div>
              <div className="text-[10px] font-bold uppercase tracking-widest text-[#666666]">Tier 02</div>
              <h3 className="text-xl font-bold uppercase tracking-wider text-[#111111]">Growth</h3>
              <div className="text-3xl font-black uppercase tracking-wide text-[#111111]">$149/mo</div>
              <p className="text-[11px] font-light text-[#555555] leading-relaxed">
                Unlimited active listings, priority candidate matching feeds, and automated notification triggers.
              </p>
              {isSignedIn ? (
                <button
                  onClick={() => router.push(dashboardUrl)}
                  className="w-full bg-[#111111] text-white hover:bg-accent-purple text-[10px] font-bold uppercase tracking-widest py-3 rounded-lg transition cursor-pointer"
                >
                  Go to Dashboard
                </button>
              ) : (
                <SignUpButton mode="modal">
                  <button className="w-full bg-[#111111] text-white hover:bg-accent-purple text-[10px] font-bold uppercase tracking-widest py-3 rounded-lg transition cursor-pointer">
                    Acquire Growth
                  </button>
                </SignUpButton>
              )}
            </div>

            {/* Enterprise Card */}
            <div className="glass-card rounded-xl p-8 space-y-6">
              <div className="text-[10px] font-bold uppercase tracking-widest text-card-foreground">Tier 03</div>
              <h3 className="text-xl font-bold uppercase tracking-wider text-white">Enterprise</h3>
              <div className="text-3xl font-black uppercase tracking-wide text-white">$499/mo</div>
              <p className="text-[11px] font-light text-card-foreground leading-relaxed">
                Includes full NVIDIA NIM AI custom models evaluation, dedicated matching pipelines, and API integrations.
              </p>
              {isSignedIn ? (
                <button
                  onClick={() => router.push(dashboardUrl)}
                  className="w-full bg-white/5 text-[10px] font-bold uppercase tracking-widest py-2.5 rounded-lg hover:bg-white hover:text-black transition cursor-pointer"
                >
                  Go to Dashboard
                </button>
              ) : (
                <SignInButton mode="modal">
                  <button className="w-full bg-white/5 text-[10px] font-bold uppercase tracking-widest py-2.5 rounded-lg hover:bg-white hover:text-black transition cursor-pointer">
                    Contact Sales
                  </button>
                </SignInButton>
              )}
            </div>
          </div>

          {/* Custom Interactive Calculator */}
          <div className="max-w-xl mx-auto bg-[#1A0B2E] rounded-2xl p-8 shadow-2xl space-y-6">
            <h4 className="text-xs font-bold uppercase tracking-widest text-white text-center">
              Interactive Cost Estimator
            </h4>
            <div className="space-y-4">
              <div className="flex justify-between text-[10px] uppercase tracking-wider text-card-foreground">
                <span>Target Opportunities</span>
                <span className="font-bold text-white">{sliderValue} Listings</span>
              </div>
              <input
                type="range"
                min="1"
                max="10"
                value={sliderValue}
                onChange={(e) => setSliderValue(parseInt(e.target.value))}
                className="w-full h-2 bg-gray-800 rounded-lg appearance-none cursor-pointer accent-accent-purple"
              />
              <div className="grid grid-cols-2 gap-4 pt-4">
                <div className="text-center">
                  <span className="block text-[8px] font-semibold uppercase tracking-widest text-card-foreground">
                    Monthly Matches
                  </span>
                  <span className="text-xl font-black text-white">{sliderValue * 50}+</span>
                </div>
                <div className="text-center">
                  <span className="block text-[8px] font-semibold uppercase tracking-widest text-card-foreground">
                    Estimated Cost
                  </span>
                  <span className="text-xl font-black text-accent-cyan">${sliderValue * 125}/mo</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Massive Scale Editorial Footer */}
      <footer className="bg-[#050505] py-24 px-6 lg:px-8 mt-auto">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-12">
          <div className="md:col-span-2 space-y-4">
            <span className="text-3xl font-black uppercase tracking-[0.2em] text-white">WEAVR</span>
            <p className="text-[10px] font-light text-card-foreground uppercase tracking-widest max-w-xs leading-relaxed">
              Weaving student potential into corporate success using dynamic matching parameters.
            </p>
          </div>
          <div>
            <h5 className="text-[10px] font-bold uppercase tracking-widest text-white mb-4">Platform</h5>
            <ul className="space-y-2 text-[10px] uppercase tracking-wider font-light text-card-foreground">
              <li><a href="#features" className="hover:text-white transition-colors">Features</a></li>
              <li><a href="#pricing" className="hover:text-white transition-colors">Pricing</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Terms of Use</a></li>
            </ul>
          </div>
          <div>
            <h5 className="text-[10px] font-bold uppercase tracking-widest text-white mb-4">Connect</h5>
            <ul className="space-y-2 text-[10px] uppercase tracking-wider font-light text-card-foreground">
              <li><a href="https://github.com/nikhil-m-star/Weavr" target="_blank" rel="noreferrer" className="hover:text-white transition-colors">GitHub Repo</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Support Center</a></li>
              <li><a href="#" className="hover:text-white transition-colors">AI System Status</a></li>
            </ul>
          </div>
        </div>
        <div className="max-w-7xl mx-auto mt-16 pt-8 flex flex-col md:flex-row justify-between items-center text-[9px] uppercase tracking-wider text-card-foreground font-light">
          <span>© 2026 Weavr Technologies Inc.</span>
          <span className="mt-2 md:mt-0">Design style: Cinematic Dark Mode</span>
        </div>
      </footer>
    </div>
  );
}
