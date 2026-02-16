import Link from "next/link";
import { Zap, Video, Clock, Users, BarChart3, Sparkles } from "lucide-react";
import { PLANS } from "@/lib/stripe";

export default function HomePage() {
  return (
    <div className="min-h-screen">
      {/* Navbar */}
      <nav className="border-b border-white/10 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Zap className="h-6 w-6 text-violet-500" />
            <span className="text-xl font-bold">AutoReels.ai</span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="#pricing" className="text-sm text-gray-400 hover:text-white">
              Pricing
            </Link>
            <Link
              href="/auth/login"
              className="text-sm text-gray-400 hover:text-white"
            >
              Log In
            </Link>
            <Link
              href="/auth/signup"
              className="rounded-lg bg-violet-600 px-4 py-2 text-sm font-semibold hover:bg-violet-700 transition"
            >
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="px-6 py-24 text-center">
        <div className="max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 rounded-full border border-violet-500/30 bg-violet-500/10 px-4 py-1.5 text-sm text-violet-400 mb-8">
            <Sparkles className="h-4 w-4" />
            AI-Powered Video Generation
          </div>
          <h1 className="text-5xl sm:text-7xl font-bold tracking-tight mb-6">
            Create & Post
            <br />
            <span className="bg-gradient-to-r from-violet-500 to-pink-500 bg-clip-text text-transparent">
              TikTok Videos
            </span>
            <br />
            on Autopilot
          </h1>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto mb-10">
            Generate stunning short-form videos with AI, schedule posts across
            multiple TikTok accounts, and grow your audience — all from one
            dashboard.
          </p>
          <div className="flex items-center justify-center gap-4">
            <Link
              href="/auth/signup"
              className="rounded-lg bg-violet-600 px-8 py-3 text-lg font-semibold hover:bg-violet-700 transition"
            >
              Start Free Trial
            </Link>
            <Link
              href="#features"
              className="rounded-lg border border-white/20 px-8 py-3 text-lg font-semibold hover:bg-white/5 transition"
            >
              See How It Works
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="px-6 py-24 border-t border-white/5">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-16">
            Everything You Need to Dominate TikTok
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: Video,
                title: "AI Video Generation",
                desc: "Generate professional short-form videos from text prompts or templates. No editing skills required.",
              },
              {
                icon: Clock,
                title: "Smart Scheduling",
                desc: "Schedule posts across multiple accounts. Our AI picks the best times for maximum engagement.",
              },
              {
                icon: Users,
                title: "Multi-Account Management",
                desc: "Connect and manage multiple TikTok accounts from a single dashboard. Perfect for agencies.",
              },
              {
                icon: Sparkles,
                title: "AI Voiceover",
                desc: "Add professional AI-generated voiceovers to your videos. Multiple voices and languages.",
              },
              {
                icon: BarChart3,
                title: "Analytics Dashboard",
                desc: "Track performance across all accounts. See what content works and optimize your strategy.",
              },
              {
                icon: Zap,
                title: "One-Click Posting",
                desc: "Generate a video and post it to TikTok with a single click. It's that simple.",
              },
            ].map((feature) => (
              <div
                key={feature.title}
                className="rounded-xl border border-white/10 bg-white/5 p-6"
              >
                <feature.icon className="h-8 w-8 text-violet-500 mb-4" />
                <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                <p className="text-sm text-gray-400">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="px-6 py-24 border-t border-white/5">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-4">
            Simple, Transparent Pricing
          </h2>
          <p className="text-gray-400 text-center mb-16 max-w-xl mx-auto">
            Start with a free trial. Upgrade when you&apos;re ready to scale.
          </p>
          <div className="grid md:grid-cols-3 gap-8">
            {(Object.entries(PLANS) as [string, (typeof PLANS)[keyof typeof PLANS]][]).map(
              ([key, plan]) => (
                <div
                  key={key}
                  className={`rounded-xl border p-8 ${
                    key === "pro"
                      ? "border-violet-500 bg-violet-500/5"
                      : "border-white/10 bg-white/5"
                  } relative`}
                >
                  {key === "pro" && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-violet-600 px-3 py-1 text-xs font-bold">
                      MOST POPULAR
                    </div>
                  )}
                  <h3 className="text-xl font-bold mb-2">{plan.name}</h3>
                  <div className="mb-6">
                    <span className="text-4xl font-bold">${plan.price}</span>
                    <span className="text-gray-400">/mo</span>
                  </div>
                  <Link
                    href="/auth/signup"
                    className={`block w-full text-center rounded-lg py-3 font-semibold transition mb-6 ${
                      key === "pro"
                        ? "bg-violet-600 hover:bg-violet-700"
                        : "bg-white/10 hover:bg-white/20"
                    }`}
                  >
                    Get Started
                  </Link>
                  <ul className="space-y-3">
                    {plan.features.map((feature) => (
                      <li
                        key={feature}
                        className="flex items-center gap-2 text-sm text-gray-300"
                      >
                        <svg
                          className="h-4 w-4 text-violet-500 flex-shrink-0"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth={2}
                        >
                          <path d="M5 13l4 4L19 7" />
                        </svg>
                        {feature}
                      </li>
                    ))}
                  </ul>
                </div>
              )
            )}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/5 px-6 py-12">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-violet-500" />
            <span className="font-semibold">AutoReels.ai</span>
          </div>
          <p className="text-sm text-gray-500">
            A Pinehaven Ventures product
          </p>
        </div>
      </footer>
    </div>
  );
}
