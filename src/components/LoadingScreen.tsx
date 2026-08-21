import React from "react";
import LogoIcon from "./LogoIcon";

interface LoadingScreenProps {
  message?: string;
}

/**
 * Full-screen branded boot splash shown while the session and
 * initial data are loading. Rendered as a fixed overlay so it
 * covers the entire viewport (navbar/footer included).
 */
export default function LoadingScreen({
  message = "Preparing your learning workspace…",
}: LoadingScreenProps) {
  return (
    <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center overflow-hidden bg-lani-navy text-white">
      <style>{`
        @keyframes laniSlide { 0% { transform: translateX(-120%); } 100% { transform: translateX(320%); } }
        @keyframes laniFloat { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-6px); } }
      `}</style>

      {/* Ambient brand glows + grid, matching the hero band */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-24 -top-24 h-96 w-96 rounded-full bg-lani-green/20 blur-[110px]" />
        <div className="absolute -right-24 bottom-0 h-96 w-96 rounded-full bg-lani-blue/20 blur-[110px]" />
      </div>
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:32px_32px]" />

      <div className="relative z-10 flex flex-col items-center">
        {/* Logo mark with a pulsing halo */}
        <div className="relative" style={{ animation: "laniFloat 3s ease-in-out infinite" }}>
          <span className="absolute -inset-3 rounded-full border border-lani-blue/30 animate-ping" />
          <div className="flex h-16 w-16 items-center justify-center">
            <LogoIcon className="h-full w-full text-lani-blue drop-shadow-[0_0_15px_rgba(11,102,195,0.6)]" />
          </div>
        </div>

        {/* Wordmark */}
        <div className="mt-6 text-center">
          <span className="block text-2xl font-black leading-none tracking-tight">LANI</span>
          <span className="mt-1 block text-[11px] font-bold uppercase tracking-[0.35em] text-lani-blue">
            ACADEMY
          </span>
        </div>

        {/* Indeterminate progress bar */}
        <div className="mt-8 h-1 w-52 overflow-hidden rounded-full bg-white/10">
          <div
            className="h-full w-1/3 rounded-full bg-gradient-to-r from-lani-emerald to-lani-blue"
            style={{ animation: "laniSlide 1.2s ease-in-out infinite" }}
          />
        </div>

        <p className="mt-5 text-xs font-semibold text-slate-400">{message}</p>
      </div>

      <div className="absolute bottom-8 text-[10px] font-medium tracking-wider text-slate-500">
        Nigeria · Ghana · Kenya · Uganda
      </div>
    </div>
  );
}
