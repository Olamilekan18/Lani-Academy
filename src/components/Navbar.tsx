import React, { useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import {
  BookOpen,
  User as UserIcon,
  Shield,
  LogOut,
  ChevronDown,
  Menu,
  X,
  RefreshCw,
  BadgeCheck,
  GraduationCap
} from "lucide-react";
import type { View } from "../lib/types";

type DemoRole = "visitor" | "learner" | "facilitator" | "admin";

interface NavbarProps {
  currentView: View;
  onNavigate: (view: View) => void;
  demoRole: DemoRole;
  onDemoRoleChange: (role: DemoRole) => void;
}

export default function Navbar({
  currentView,
  onNavigate,
  demoRole,
  onDemoRoleChange,
}: NavbarProps) {
  const { user, profile, signOut } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  const effectiveRole =
    demoRole === "admin"
      ? "Admin (Demo)"
      : demoRole === "facilitator"
      ? "Facilitator (Demo)"
      : demoRole === "learner"
      ? "Learner (Demo)"
      : user
      ? profile?.role ?? "Learner"
      : "Guest";

  const navItems = [
    { label: "Home", view: "home" as View },
    { label: "Courses", view: "courses" as View },
    { label: "B2B Training", view: "corporate" as View },
    { label: "Scholarships", view: "applications" as View },
    { label: "Verify Certificate", view: "verify" as View },
  ];

  const roleButtons: { key: DemoRole; label: string }[] = [
    { key: "visitor", label: "Visitor" },
    { key: "learner", label: "Learner" },
    { key: "facilitator", label: "Facilitator" },
    { key: "admin", label: "Admin" },
  ];

  const dashboardView: View | null =
    demoRole === "admin" ? "admin" : demoRole === "facilitator" ? "facilitator" : demoRole === "learner" ? "learner" : null;

  const dashboardLabel =
    demoRole === "admin" ? "Admin Portal" : demoRole === "facilitator" ? "Facilitator Portal" : "Learner Dashboard";

  const DashIcon = demoRole === "admin" ? Shield : demoRole === "facilitator" ? GraduationCap : BadgeCheck;

  const dashColor =
    demoRole === "admin"
      ? "ring-lani-blue/20 bg-lani-blue/5 text-lani-blue hover:bg-lani-blue/10"
      : demoRole === "facilitator"
      ? "ring-lani-gold/20 bg-lani-gold/5 text-lani-gold hover:bg-lani-gold/10"
      : "ring-lani-green/20 bg-lani-green/5 text-lani-green hover:bg-lani-green/10";

  return (
    <header className="sticky top-0 z-40 w-full border-b border-white/10 bg-lani-navy/95 backdrop-blur-md text-white">
      {/* Top Banner Demo Switcher */}
      <div className="bg-slate-950 px-4 py-1.5 text-center text-xs text-white border-b border-white/5">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-2">
          <span className="flex items-center gap-1 font-medium text-slate-350">
            <span className="h-2 w-2 rounded-full bg-lani-emerald animate-pulse" />
            Connected to Supabase
          </span>
          <div className="flex items-center gap-2">
            <span className="font-semibold text-lani-gold flex items-center gap-1">
              <RefreshCw size={11} className="animate-spin-slow" />
              Demo Switcher:
            </span>
            <div className="inline-flex rounded-full bg-white/10 p-0.5 ring-1 ring-white/10">
              {roleButtons.map((rb) => (
                <button
                  key={rb.key}
                  type="button"
                  onClick={() => onDemoRoleChange(rb.key)}
                  className={`rounded-full px-2 py-0.5 text-[10px] font-bold transition-all ${
                    demoRole === rb.key
                      ? "bg-lani-gold text-lani-navy"
                      : "text-slate-300 hover:text-white"
                  }`}
                >
                  {rb.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto flex max-w-7xl h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Brand Logo */}
        <button
          onClick={() => onNavigate("home")}
          className="flex items-center gap-2.5 text-left focus:outline-none"
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-lani-green to-lani-emerald text-white shadow">
            <BookOpen size={20} />
          </div>
          <div>
            <span className="block text-lg font-black tracking-tight text-white leading-none">
              LANI
            </span>
            <span className="text-[10px] font-bold tracking-widest text-lani-gold uppercase leading-none block mt-0.5">
              Academy
            </span>
          </div>
        </button>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-6">
          {navItems.map((item) => (
            <button
              key={item.view}
              onClick={() => onNavigate(item.view)}
              className={`text-sm font-bold transition-colors ${
                currentView === item.view
                  ? "text-lani-gold"
                  : "text-slate-300 hover:text-white"
              }`}
            >
              {item.label}
            </button>
          ))}
        </nav>

        {/* User / Dashboard Action Area */}
        <div className="hidden md:flex items-center gap-4">
          {dashboardView && (
            <button
              onClick={() => onNavigate(dashboardView)}
              className={`inline-flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-xs font-bold ring-1 transition-all ${dashColor} ${
                currentView === dashboardView ? "opacity-100" : ""
              }`}
            >
              <DashIcon size={14} />
              {dashboardLabel}
            </button>
          )}

          {demoRole !== "visitor" ? (
            <div className="relative">
              <button
                type="button"
                onClick={() => setProfileOpen(!profileOpen)}
                className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-left text-sm font-semibold text-white transition-all hover:bg-white/10"
              >
                <div className="h-6 w-6 rounded-full bg-lani-green flex items-center justify-center text-white text-[10px]">
                  {effectiveRole.charAt(0)}
                </div>
                <span className="max-w-32 truncate">{effectiveRole}</span>
                <ChevronDown size={14} className="text-slate-350" />
              </button>

              {profileOpen && (
                <div className="absolute right-0 mt-2 w-56 origin-top-right rounded-xl border border-slate-700 bg-lani-navy p-2 shadow-lg ring-1 ring-white/10 focus:outline-none z-50">
                  <div className="px-3 py-2 border-b border-white/5">
                    <p className="text-xs font-semibold text-slate-400 uppercase">Signed in as</p>
                    <p className="text-sm font-bold text-white truncate">
                      {demoRole === "admin"
                        ? "admin@lani.academy"
                        : demoRole === "facilitator"
                        ? "facilitator@lani.academy"
                        : "learner@lani.academy"}
                    </p>
                  </div>
                  <div className="mt-1 grid gap-0.5">
                    {dashboardView && (
                      <button
                        onClick={() => {
                          setProfileOpen(false);
                          onNavigate(dashboardView);
                        }}
                        className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-xs font-semibold text-slate-200 hover:bg-white/5 hover:text-white"
                      >
                        <DashIcon size={14} />
                        {dashboardLabel}
                      </button>
                    )}
                    <button
                      onClick={() => {
                        setProfileOpen(false);
                        onDemoRoleChange("visitor");
                        signOut();
                        onNavigate("home");
                      }}
                      className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-xs font-semibold text-red-400 hover:bg-red-950/20"
                    >
                      <LogOut size={14} />
                      Sign Out (Demo)
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => onNavigate("learner")}
                className="text-sm font-bold text-slate-350 hover:text-white"
              >
                Sign In
              </button>
              <button
                onClick={() => onNavigate("courses")}
                className="btn-primary min-h-9 px-4 py-2 text-xs"
              >
                Enrol Now
              </button>
            </div>
          )}
        </div>

        {/* Mobile menu button */}
        <div className="flex md:hidden items-center gap-2">
          {demoRole !== "visitor" && dashboardView && (
            <button
              onClick={() => onNavigate(dashboardView)}
              className="text-xs font-bold rounded-lg border border-white/10 px-2.5 py-1.5 text-white"
            >
              Dashboard
            </button>
          )}
          <button
            type="button"
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-white transition-all hover:bg-white/10"
            onClick={() => setMenuOpen(!menuOpen)}
          >
            {menuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {menuOpen && (
        <div className="md:hidden border-t border-white/10 bg-slate-900 px-4 py-4 space-y-4 text-white">
          <nav className="flex flex-col gap-3">
            {navItems.map((item) => (
              <button
                key={item.view}
                onClick={() => {
                  setMenuOpen(false);
                  onNavigate(item.view);
                }}
                className={`text-left text-sm font-bold py-1.5 border-b border-white/5 ${
                  currentView === item.view ? "text-lani-gold" : "text-slate-300"
                }`}
              >
                {item.label}
              </button>
            ))}
          </nav>
          <div className="pt-2 border-t border-white/10 flex flex-col gap-2">
            {dashboardView && (
              <button
                onClick={() => {
                  setMenuOpen(false);
                  onNavigate(dashboardView);
                }}
                className="btn-ghost min-h-10 justify-start text-white hover:bg-white/5"
              >
                <DashIcon size={16} />
                {dashboardLabel}
              </button>
            )}
            {demoRole !== "visitor" ? (
              <button
                onClick={() => {
                  setMenuOpen(false);
                  onDemoRoleChange("visitor");
                  signOut();
                  onNavigate("home");
                }}
                className="w-full rounded-lg bg-red-950/40 text-red-400 hover:bg-red-950/60 py-2.5 text-sm font-bold text-center"
              >
                Sign Out (Demo)
              </button>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setMenuOpen(false);
                    onNavigate("learner");
                  }}
                  className="btn-secondary border-white/20 text-white hover:bg-white/10 min-h-10 text-center"
                >
                  Sign In
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMenuOpen(false);
                    onNavigate("courses");
                  }}
                  className="btn-primary min-h-10 text-center"
                >
                  Enrol
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
