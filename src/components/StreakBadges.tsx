import React from "react";
import { Flame, Zap, Award, Crown, Lock, Check } from "lucide-react";

// Login-streak milestone badges. Driven by the learner's current consecutive
// active-day streak (tracked server-side in LearnerDashboard). A badge unlocks
// once the streak reaches its threshold.
export interface StreakBadgesProps {
  streak: number;
  /** Compact single-line layout (e.g. for narrow sidebars). Defaults to a card. */
  variant?: "card" | "inline";
  className?: string;
}

interface Tier {
  days: number;
  name: string;
  tagline: string;
  Icon: typeof Flame;
  gradient: string; // CSS gradient for the earned medallion
  ring: string; // ring/glow colour when earned
}

// Ordered ascending. Colours use the lani palette (see tailwind.config.ts).
export const STREAK_TIERS: Tier[] = [
  {
    days: 3,
    name: "Spark",
    tagline: "3-day streak",
    Icon: Flame,
    gradient: "linear-gradient(135deg, #10a768 0%, #087443 100%)",
    ring: "#10a768",
  },
  {
    days: 10,
    name: "Trailblazer",
    tagline: "10-day streak",
    Icon: Zap,
    gradient: "linear-gradient(135deg, #3b8fe0 0%, #0b66c3 100%)",
    ring: "#0b66c3",
  },
  {
    days: 50,
    name: "Firebrand",
    tagline: "50-day streak",
    Icon: Award,
    gradient: "linear-gradient(135deg, #e6b84d 0%, #c9972b 100%)",
    ring: "#c9972b",
  },
  {
    days: 100,
    name: "Centurion",
    tagline: "100-day streak",
    Icon: Crown,
    gradient: "linear-gradient(135deg, #d95845 0%, #c9972b 100%)",
    ring: "#d95845",
  },
];

function Medallion({ tier, streak }: { tier: Tier; streak: number }) {
  const earned = streak >= tier.days;
  const remaining = Math.max(0, tier.days - streak);
  const { Icon } = tier;

  return (
    <div
      className="flex flex-col items-center text-center gap-1.5 group"
      title={
        earned
          ? `${tier.name} — ${tier.tagline} unlocked`
          : `${tier.name} — ${remaining} more day${remaining === 1 ? "" : "s"} to unlock`
      }
    >
      <div className="relative">
        <div
          className={`relative h-14 w-14 rounded-full flex items-center justify-center transition-all duration-300 ${
            earned ? "shadow-md group-hover:scale-105" : "bg-slate-100 border border-dashed border-slate-300"
          }`}
          style={
            earned
              ? { background: tier.gradient, boxShadow: `0 6px 16px ${tier.ring}40` }
              : undefined
          }
        >
          <Icon
            size={22}
            className={earned ? "text-white" : "text-slate-300"}
            strokeWidth={2.2}
          />
          {/* Locked overlay */}
          {!earned && (
            <span className="absolute -bottom-1 -right-1 h-5 w-5 rounded-full bg-white border border-slate-200 flex items-center justify-center">
              <Lock size={10} className="text-slate-400" />
            </span>
          )}
          {/* Earned check */}
          {earned && (
            <span
              className="absolute -bottom-1 -right-1 h-5 w-5 rounded-full bg-white flex items-center justify-center shadow-sm"
              style={{ color: tier.ring }}
            >
              <Check size={12} strokeWidth={3} />
            </span>
          )}
        </div>
      </div>
      <div className="leading-tight">
        <span
          className={`block text-[11px] font-extrabold ${earned ? "text-lani-navy" : "text-slate-400"}`}
        >
          {tier.name}
        </span>
        <span className="block text-[9px] font-bold uppercase tracking-wide text-slate-400">
          {earned ? tier.tagline : `${remaining} to go`}
        </span>
      </div>
    </div>
  );
}

export default function StreakBadges({ streak, variant = "card", className = "" }: StreakBadgesProps) {
  const earnedCount = STREAK_TIERS.filter((t) => streak >= t.days).length;
  const next = STREAK_TIERS.find((t) => streak < t.days);
  const prevThreshold = next ? [0, ...STREAK_TIERS.map((t) => t.days)][STREAK_TIERS.indexOf(next)] : STREAK_TIERS[STREAK_TIERS.length - 1].days;
  const nextProgress = next
    ? Math.min(100, Math.round(((streak - prevThreshold) / (next.days - prevThreshold)) * 100))
    : 100;

  const grid = (
    <div className="grid grid-cols-4 gap-2">
      {STREAK_TIERS.map((tier) => (
        <Medallion key={tier.days} tier={tier} streak={streak} />
      ))}
    </div>
  );

  if (variant === "inline") {
    return <div className={className}>{grid}</div>;
  }

  return (
    <div className={`rounded-xl border border-slate-200 p-5 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-bold text-lani-navy flex items-center gap-2">
          <Flame size={15} className="text-lani-coral" />
          Streak Badges
        </h3>
        <span className="text-[10px] font-bold text-slate-400">
          {earnedCount}/{STREAK_TIERS.length} earned
        </span>
      </div>

      {grid}

      {/* Progress toward the next milestone */}
      <div className="mt-4">
        {next ? (
          <>
            <div className="flex items-center justify-between text-[10px] font-bold mb-1.5">
              <span className="text-slate-500">
                {streak}-day streak · next: <span className="text-lani-navy">{next.name}</span>
              </span>
              <span className="text-slate-400">{next.days - streak} day{next.days - streak === 1 ? "" : "s"} left</span>
            </div>
            <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-lani-coral to-lani-gold transition-all duration-500"
                style={{ width: `${nextProgress}%` }}
              />
            </div>
          </>
        ) : (
          <p className="text-[11px] font-bold text-lani-green text-center">
            🎉 All streak badges unlocked — you're a Centurion!
          </p>
        )}
      </div>
    </div>
  );
}
