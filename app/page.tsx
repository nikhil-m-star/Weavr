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
      <div className="flex flex-1 items-center justify-center bg-black min-h-screen">
        <div className="flex flex-col items-center space-y-4">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-white border-t-transparent"></div>
          <span className="text-[10px] font-bold uppercase tracking-[0.25em] text-white">Loading Weavr</span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-black text-white min-h-screen flex flex-col font-sans overflow-x-hidden selection:bg-white selection:text-black">
      {/* Navigation Header */}
      <header className="fixed top-0 left-0 right-0 py-6 px-8 flex items-center justify-between z-50 bg-black/80 backdrop-blur-md">
        <div className="flex items-center space-x-2.5">
          <span className="text-lg font-black uppercase tracking-[0.2em] cursor-pointer" onClick={() => router.push("/")}>
            Weavr
          </span>
        </div>
        <nav className="hidden md:flex items-center space-x-8 text-[9px] font-bold uppercase tracking-[0.25em] text-card-foreground">
          <a href="#features" className="hover:text-white transition-colors">Features</a>
          <a href="#pricing" className="hover:text-white transition-colors">Pricing</a>
        </nav>
        <div className="flex items-center space-x-4">
          {isSignedIn ? (
            <button
              onClick={() => router.push(dashboardUrl)}
              disabled={loadingRole}
              className="solid-btn rounded-full px-6 py-2.5 text-[9px] font-black uppercase tracking-[0.2em] shadow-lg cursor-pointer disabled:opacity-50"
            >
              {loadingRole ? "Loading" : "Dashboard"}
            </button>
          ) : (
            <>
              <SignInButton mode="modal">
                <button className="text-[9px] font-black uppercase tracking-[0.2em] text-card-foreground hover:text-white transition-colors cursor-pointer mr-2">
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

      {/* Hero Section */}
      <section className="min-h-screen flex flex-col items-center justify-center px-6 relative">
        <div className="text-center max-w-5xl z-10 space-y-6 select-none">
          <h1 className="text-[14vw] md:text-[10vw] font-black tracking-tighter uppercase leading-none text-white select-none">
            WEAVR
          </h1>
          <p className="text-[10px] sm:text-xs uppercase tracking-[0.3em] text-card-foreground font-medium max-w-2xl mx-auto">
            Real-Time AI Talent Matching Engine.
          </p>
          <div className="pt-8 flex flex-col sm:flex-row justify-center items-center gap-4">
            {isSignedIn ? (
              <button
                onClick={() => router.push(dashboardUrl)}
                className="solid-btn rounded-full px-8 py-3.5 text-[10px] font-bold uppercase tracking-[0.2em] shadow-2xl transition duration-300 cursor-pointer"
              >
                Go to Dashboard
              </button>
            ) : (
              <>
                <SignUpButton mode="modal">
                  <button className="solid-btn rounded-full px-8 py-3.5 text-[10px] font-bold uppercase tracking-[0.2em] shadow-2xl transition duration-300 cursor-pointer">
                    Get Started
                  </button>
                </SignUpButton>
                <SignInButton mode="modal">
                  <button className="hover:bg-white/10 bg-white/5 rounded-full px-8 py-3.5 text-[10px] font-bold uppercase tracking-[0.2em] text-white transition duration-300 cursor-pointer">
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
          <h2 className="text-[5vw] font-black uppercase tracking-tighter leading-none">
            Bento Engine
          </h2>
          <p className="text-[9px] uppercase tracking-[0.25em] text-white font-bold mt-2">
            Structured matching system.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Featured Bento Card (Spans 2 cols) */}
          <div className="md:col-span-2 glass-card rounded-xl p-8 flex flex-col justify-between aspect-video relative group overflow-hidden">
            <div className="space-y-4">
              <span className="text-[8px] font-bold text-white uppercase tracking-widest px-2.5 py-0.5 rounded bg-white/5 w-fit block">
                Algorithm
              </span>
              <h3 className="text-xl font-bold uppercase tracking-wider text-white">Dynamic Match Score</h3>
              <p className="text-xs font-light text-card-foreground leading-relaxed max-w-lg">
                Candidates are sorted by weights: required skills (40%), preferred skills (20%), target branch (15%), completeness (15%), and recency decay (10%).
              </p>
            </div>
            {/* Visual grayscale graphic mock */}
            <div className="mt-6 rounded bg-black/40 p-4 flex justify-between items-center group-hover:bg-white/5 transition-all duration-300">
              <div className="space-y-1">
                <div className="text-[10px] font-bold uppercase text-white">Full Stack React Engineer</div>
                <div className="text-[9px] text-card-foreground uppercase">Tech Corp • Remote</div>
              </div>
              <div className="text-white text-xs font-bold px-3 py-1 rounded bg-white/10">
                96% Match
              </div>
            </div>
          </div>

          {/* Bento Card 2 */}
          <div className="glass-card rounded-xl p-8 flex flex-col justify-between">
            <span className="text-[8px] font-bold text-white uppercase tracking-widest px-2.5 py-0.5 rounded bg-white/5 w-fit">
              Concurrency
            </span>
            <div className="space-y-3 mt-8">
              <h3 className="text-lg font-bold uppercase tracking-wider text-white">Application Caps</h3>
              <p className="text-xs font-light text-card-foreground leading-relaxed">
                Strict database row locking inside a transaction enforces application capacity. Auto-reopens on student withdrawal.
              </p>
            </div>
          </div>

          {/* Bento Card 3 */}
          <div className="glass-card rounded-xl p-8 flex flex-col justify-between">
            <span className="text-[8px] font-bold text-white uppercase tracking-widest px-2.5 py-0.5 rounded bg-white/5 w-fit">
              Evaluation
            </span>
            <div className="space-y-3 mt-8">
              <h3 className="text-lg font-bold uppercase tracking-wider text-white">NVIDIA NIM Analysis</h3>
              <p className="text-xs font-light text-card-foreground leading-relaxed">
                Recruiters can trigger automated LLM evaluations using NVIDIA NIM, returning structured suitability analysis.
              </p>
            </div>
          </div>

          {/* Bento Card 4 (Spans 2 cols) */}
          <div className="md:col-span-2 glass-card rounded-xl p-8 flex flex-col justify-between aspect-video md:aspect-auto">
            <span className="text-[8px] font-bold text-white uppercase tracking-widest px-2.5 py-0.5 rounded bg-white/5 w-fit">
              Optimization
            </span>
            <div className="space-y-4 mt-8">
              <h3 className="text-xl font-bold uppercase tracking-wider text-white">Completeness Metric</h3>
              <p className="text-xs font-light text-card-foreground leading-relaxed max-w-md">
                Profiles calculate optimization benchmarks, providing feedback steps to maximize indices matches.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-32 bg-[#050505] relative overflow-hidden px-6">
        <div className="max-w-7xl mx-auto w-full space-y-24 z-10 relative">
          <div className="text-center">
            <h2 className="text-[5vw] font-black uppercase tracking-tighter leading-none">Subscription</h2>
            <p className="text-[9px] uppercase tracking-[0.25em] text-card-foreground font-bold mt-2">Plans for recruiting teams.</p>
          </div>

          {/* Three Tier Subscription Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-center max-w-5xl mx-auto">
            {/* Free Card */}
            <div className="glass-card rounded-xl p-8 space-y-6">
              <div className="text-[10px] font-bold uppercase tracking-widest text-card-foreground">Tier 01</div>
              <h3 className="text-lg font-bold uppercase tracking-wider text-white">Starter</h3>
              <div className="text-2xl font-black uppercase tracking-wide text-white">$0</div>
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
            <div className="bg-white text-black rounded-xl p-8 space-y-6 shadow-2xl transform md:scale-105 relative z-20">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-black text-white text-[8px] font-black uppercase tracking-widest px-3 py-1 rounded-full">
                Popular
              </div>
              <div className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Tier 02</div>
              <h3 className="text-lg font-bold uppercase tracking-wider text-black">Growth</h3>
              <div className="text-2xl font-black uppercase tracking-wide text-black">$149/mo</div>
              <p className="text-[11px] font-light text-gray-600 leading-relaxed">
                Unlimited active listings, priority candidate matching feeds, and automated notification triggers.
              </p>
              {isSignedIn ? (
                <button
                  onClick={() => router.push(dashboardUrl)}
                  className="w-full bg-black text-white hover:bg-black/90 text-[10px] font-bold uppercase tracking-widest py-3 rounded-lg transition cursor-pointer"
                >
                  Go to Dashboard
                </button>
              ) : (
                <SignUpButton mode="modal">
                  <button className="w-full bg-black text-white hover:bg-black/90 text-[10px] font-bold uppercase tracking-widest py-3 rounded-lg transition cursor-pointer">
                    Acquire Growth
                  </button>
                </SignUpButton>
              )}
            </div>

            {/* Enterprise Card */}
            <div className="glass-card rounded-xl p-8 space-y-6">
              <div className="text-[10px] font-bold uppercase tracking-widest text-card-foreground">Tier 03</div>
              <h3 className="text-lg font-bold uppercase tracking-wider text-white">Enterprise</h3>
              <div className="text-2xl font-black uppercase tracking-wide text-white">$499/mo</div>
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
          <div className="max-w-xl mx-auto bg-[#0c0c0c] rounded-2xl p-8 shadow-2xl space-y-6">
            <h4 className="text-xs font-bold uppercase tracking-widest text-white text-center">
              Cost Estimator
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
                className="w-full h-1.5 bg-gray-800 rounded-lg appearance-none cursor-pointer accent-white"
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
                  <span className="text-xl font-black text-white">${sliderValue * 125}/mo</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-black py-24 px-6 lg:px-8 mt-auto">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-12">
          <div className="md:col-span-2 space-y-4">
            <span className="text-2xl font-black uppercase tracking-[0.2em] text-white">WEAVR</span>
            <p className="text-[9px] font-light text-card-foreground uppercase tracking-widest max-w-xs leading-relaxed">
              Weaving student potential into corporate success.
            </p>
          </div>
          <div>
            <h5 className="text-[10px] font-bold uppercase tracking-widest text-white mb-4">Platform</h5>
            <ul className="space-y-2 text-[9px] uppercase tracking-wider font-light text-card-foreground">
              <li><a href="#features" className="hover:text-white transition-colors">Features</a></li>
              <li><a href="#pricing" className="hover:text-white transition-colors">Pricing</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Terms of Use</a></li>
            </ul>
          </div>
          <div>
            <h5 className="text-[10px] font-bold uppercase tracking-widest text-white mb-4">Connect</h5>
            <ul className="space-y-2 text-[9px] uppercase tracking-wider font-light text-card-foreground">
              <li><a href="https://github.com/nikhil-m-star/Weavr" target="_blank" rel="noreferrer" className="hover:text-white transition-colors">GitHub</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Support</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Status</a></li>
            </ul>
          </div>
        </div>
        <div className="max-w-7xl mx-auto mt-16 pt-8 flex flex-col md:flex-row justify-between items-center text-[9px] uppercase tracking-wider text-card-foreground font-light">
          <span>© 2026 Weavr Technologies Inc.</span>
          <span className="mt-2 md:mt-0">Minimalist Black & White Edition</span>
        </div>
      </footer>
    </div>
  );
}
