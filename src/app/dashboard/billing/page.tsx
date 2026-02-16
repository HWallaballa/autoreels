"use client";

import { useEffect, useState } from "react";
import { CreditCard, RefreshCw, Check } from "lucide-react";
import { createBrowserSupabaseClient } from "@/lib/supabase";
import { PLANS, type PlanKey } from "@/lib/stripe";

interface Profile {
  plan: string;
  videos_used_this_month: number;
  stripe_customer_id: string | null;
  subscription_id: string | null;
  billing_cycle_start: string | null;
}

export default function BillingPage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [checkoutLoading, setCheckoutLoading] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      const supabase = createBrowserSupabaseClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      setProfile(data);
      setLoading(false);
    }
    load();
  }, []);

  async function handleCheckout(planKey: string) {
    setCheckoutLoading(planKey);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan: planKey }),
      });
      const { url } = await res.json();
      if (url) window.location.href = url;
    } catch {
      setCheckoutLoading(null);
    }
  }

  async function handleManageBilling() {
    const res = await fetch("/api/portal", { method: "POST" });
    const { url } = await res.json();
    if (url) window.location.href = url;
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <RefreshCw className="h-5 w-5 animate-spin text-gray-500" />
      </div>
    );
  }

  const currentPlan = profile?.plan || "free";
  const limits: Record<string, number> = {
    free: 0,
    starter: 30,
    pro: 100,
    agency: 500,
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold">Billing</h1>
        <p className="text-gray-400 text-sm mt-1">
          Manage your subscription and billing.
        </p>
      </div>

      {/* Current Plan */}
      <div className="rounded-xl border border-white/10 bg-white/5 p-6 mb-8">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-400">Current Plan</p>
            <p className="text-xl font-bold mt-1">
              {currentPlan.charAt(0).toUpperCase() + currentPlan.slice(1)}
            </p>
            {currentPlan !== "free" && (
              <p className="text-sm text-gray-500 mt-1">
                {profile?.videos_used_this_month || 0}/{limits[currentPlan]}{" "}
                videos used this month
              </p>
            )}
          </div>
          {profile?.subscription_id && (
            <button
              onClick={handleManageBilling}
              className="flex items-center gap-2 rounded-lg border border-white/10 px-4 py-2 text-sm hover:bg-white/5 transition"
            >
              <CreditCard className="h-4 w-4" />
              Manage Billing
            </button>
          )}
        </div>

        {currentPlan !== "free" && (
          <div className="mt-4">
            <div className="h-2 rounded-full bg-white/10 overflow-hidden">
              <div
                className="h-full bg-violet-600 rounded-full transition-all"
                style={{
                  width: `${Math.min(
                    ((profile?.videos_used_this_month || 0) /
                      limits[currentPlan]) *
                      100,
                    100
                  )}%`,
                }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Plans */}
      <h2 className="text-lg font-semibold mb-4">
        {currentPlan === "free" ? "Choose a Plan" : "Change Plan"}
      </h2>
      <div className="grid md:grid-cols-3 gap-4">
        {(Object.entries(PLANS) as [PlanKey, (typeof PLANS)[PlanKey]][]).map(
          ([key, plan]) => {
            const isCurrent = key === currentPlan;
            return (
              <div
                key={key}
                className={`rounded-xl border p-6 ${
                  key === "pro"
                    ? "border-violet-500 bg-violet-500/5"
                    : "border-white/10 bg-white/5"
                } ${isCurrent ? "ring-2 ring-violet-500" : ""}`}
              >
                {key === "pro" && (
                  <span className="text-xs font-bold text-violet-400 mb-2 block">
                    MOST POPULAR
                  </span>
                )}
                <h3 className="text-lg font-bold">{plan.name}</h3>
                <div className="mt-2 mb-4">
                  <span className="text-3xl font-bold">${plan.price}</span>
                  <span className="text-gray-400">/mo</span>
                </div>
                <ul className="space-y-2 mb-6">
                  {plan.features.map((f) => (
                    <li
                      key={f}
                      className="flex items-center gap-2 text-sm text-gray-300"
                    >
                      <Check className="h-4 w-4 text-violet-500 flex-shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>
                {isCurrent ? (
                  <div className="text-center py-2 text-sm text-violet-400 font-semibold">
                    Current Plan
                  </div>
                ) : (
                  <button
                    onClick={() => handleCheckout(key)}
                    disabled={checkoutLoading === key}
                    className={`w-full rounded-lg py-2.5 text-sm font-semibold transition disabled:opacity-50 ${
                      key === "pro"
                        ? "bg-violet-600 hover:bg-violet-700"
                        : "bg-white/10 hover:bg-white/20"
                    }`}
                  >
                    {checkoutLoading === key
                      ? "Loading..."
                      : isCurrent
                      ? "Current Plan"
                      : "Subscribe"}
                  </button>
                )}
              </div>
            );
          }
        )}
      </div>
    </div>
  );
}
