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
  GraduationCap,
  Building2
} from "lucide-react";
import type { View } from "../lib/types";

interface NavbarProps {
  currentView: View;
  onNavigate: (view: View) => void;
}

export default function Navbar({
  currentView,
  onNavigate,
}: NavbarProps) {
  const { user, profile, signOut } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  const userRole = user ? profile?.role ?? "learner" : "visitor";
  const effectiveRole = user ? profile?.full_name || profile?.email || "User" : "Guest";

  const navItems = [
    { label: "Courses", view: "courses" as View },
    { label: "Certification", view: "certification" as View },
    { label: "B2B Training", view: "corporate" as View },
    { label: "Scholarships", view: "applications" as View },
    { label: "Resources", view: "resources" as View },
    { label: "About", view: "about" as View },
    { label: "Verify", view: "verify" as View },
  ];

  const mobileExtra = [{ label: "Contact", view: "contact" as View }];

  const dashboardView: View | null =
    userRole === "admin" ? "admin" : userRole === "facilitator" ? "facilitator" : userRole === "organization" ? "organization" : userRole === "learner" ? "learner" : null;

  const dashboardLabel =
    userRole === "admin" ? "Admin Portal" : userRole === "facilitator" ? "Facilitator Portal" : userRole === "organization" ? "Corporate Portal" : "Learner Dashboard";

  const DashIcon = userRole === "admin" ? Shield : userRole === "facilitator" ? GraduationCap : userRole === "organization" ? Building2 : BadgeCheck;

  const dashColor =
    userRole === "admin"
      ? "ring-lani-blue/20 bg-lani-blue/5 text-lani-blue hover:bg-lani-blue/10"
      : userRole === "facilitator"
      ? "ring-lani-gold/20 bg-lani-gold/5 text-lani-gold hover:bg-lani-gold/10"
      : userRole === "organization"
      ? "ring-lani-gold/20 bg-lani-gold/5 text-lani-gold hover:bg-lani-gold/10"
      : "ring-lani-green/20 bg-lani-green/5 text-lani-green hover:bg-lani-green/10";

  return (
    <header className="sticky top-0 z-40 w-full border-b border-white/10 bg-lani-navy/95 backdrop-blur-md text-white">

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
        <nav className="hidden md:flex items-center gap-x-4 lg:gap-x-6 text-[13px]">
          {navItems.map((item) => (
            <button
              key={item.view}
              onClick={() => onNavigate(item.view)}
              className={`font-bold transition-colors ${
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

          {user ? (
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
                      {profile?.email || user.email}
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
                      onClick={async () => {
                        setProfileOpen(false);
                        await signOut();
                        onNavigate("home");
                      }}
                      className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-xs font-semibold text-red-400 hover:bg-red-950/20"
                    >
                      <LogOut size={14} />
                      Sign Out
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
                onClick={() => onNavigate("signup")}
                className="btn-primary min-h-9 px-4 py-2 text-xs"
              >
                Sign Up
              </button>
            </div>
          )}
        </div>

        {/* Mobile menu button */}
        <div className="flex md:hidden items-center gap-2">
          {user && dashboardView && (
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
            {[{ label: "Home", view: "home" as View }, ...navItems, ...mobileExtra].map((item) => (
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
            {user ? (
              <button
                onClick={async () => {
                  setMenuOpen(false);
                  await signOut();
                  onNavigate("home");
                }}
                className="w-full rounded-lg bg-red-950/40 text-red-400 hover:bg-red-950/60 py-2.5 text-sm font-bold text-center"
              >
                Sign Out
              </button>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setMenuOpen(false);
                    onNavigate("learner");
                  }}
                  className="btn-secondary border-lani-green text-lani-green hover:bg-lani-green/10 min-h-10 text-center"
                >
                  Sign In
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMenuOpen(false);
                    onNavigate("signup");
                  }}
                  className="btn-primary min-h-10 text-center"
                >
                  Sign Up
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
