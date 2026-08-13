import React, { useState, useEffect, useRef } from "react";
import { useAuth } from "../contexts/AuthContext";
import {
  BookOpen,
  Shield,
  LogOut,
  ChevronDown,
  Menu,
  X,
  BadgeCheck,
  GraduationCap,
  Building2,
  User as UserIcon,
} from "lucide-react";
import type { View } from "../lib/types";

interface NavbarProps {
  currentView: View;
  onNavigate: (view: View) => void;
}

export default function Navbar({ currentView, onNavigate }: NavbarProps) {
  const { user, profile, signOut } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);

  // Close the profile menu when clicking anywhere outside it, or on Escape.
  useEffect(() => {
    if (!profileOpen) return;
    const onDocClick = (e: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) setProfileOpen(false);
    };
    const onEsc = (e: KeyboardEvent) => { if (e.key === "Escape") setProfileOpen(false); };
    document.addEventListener("mousedown", onDocClick);
    document.addEventListener("keydown", onEsc);
    return () => {
      document.removeEventListener("mousedown", onDocClick);
      document.removeEventListener("keydown", onEsc);
    };
  }, [profileOpen]);

  const userRole = user ? profile?.role ?? "learner" : "visitor";
  const displayName = user ? profile?.full_name || profile?.email || "User" : "Guest";

  // The navbar adapts to who's signed in. Each role's own dashboard is the
  // first item so there's always a clear way back to it.
  type NavItem = { label: string; view: View };
  const publicNav: NavItem[] = [
    { label: "Courses", view: "courses" },
    { label: "Certification", view: "certification" },
    { label: "Calendar", view: "calendar" },
    { label: "B2B Training", view: "corporate" },
    { label: "Scholarships", view: "applications" },
    { label: "Resources", view: "resources" },
    { label: "About", view: "about" },
  ];

  const roleNav: Record<string, NavItem[]> = {
    admin: [
      { label: "Dashboard", view: "admin" },
      { label: "Courses", view: "courses" },
      { label: "Verify", view: "verify" },
      { label: "Resources", view: "resources" },
    ],
    super_admin: [
      { label: "Dashboard", view: "admin" },
      { label: "Courses", view: "courses" },
      { label: "Verify", view: "verify" },
      { label: "Resources", view: "resources" },
    ],
    facilitator: [
      { label: "Dashboard", view: "facilitator" },
      { label: "Courses", view: "courses" },
      { label: "Calendar", view: "calendar" },
      { label: "Resources", view: "resources" },
    ],
    organization: [
      { label: "Corporate Dashboard", view: "organization" },
      { label: "Courses", view: "courses" },
      { label: "B2B Training", view: "corporate" },
      { label: "Calendar", view: "calendar" },
    ],
    learner: [
      { label: "My Learning", view: "learner" },
      { label: "Courses", view: "courses" },
      { label: "Calendar", view: "calendar" },
      { label: "Certification", view: "certification" },
      { label: "Resources", view: "resources" },
    ],
  };

  const navItems: NavItem[] = roleNav[userRole] ?? publicNav;

  const mobileExtra: NavItem[] = ([
    { label: "Verify Certificate", view: "verify" },
    { label: "Contact", view: "contact" },
    // Only surface the Corporate portal login to signed-out visitors
    ...(!userRole ? [{ label: "Corporate Portal Login", view: "organization" as View }] : []),
  ] as NavItem[]).filter((m) => !navItems.some((n) => n.view === m.view));

  const dashboardView: View | null =
    userRole === "admin" ? "admin" : userRole === "facilitator" ? "facilitator" : userRole === "organization" ? "organization" : userRole === "learner" ? "learner" : null;

  const dashboardLabel =
    userRole === "admin" ? "Admin Portal" : userRole === "facilitator" ? "Facilitator Portal" : userRole === "organization" ? "Corporate Portal" : "Dashboard";

  const DashIcon = userRole === "admin" ? Shield : userRole === "facilitator" ? GraduationCap : userRole === "organization" ? Building2 : BadgeCheck;

  const dashColor =
    userRole === "admin"
      ? "ring-lani-blue/20 bg-lani-blue/5 text-lani-blue hover:bg-lani-blue/10"
      : userRole === "facilitator" || userRole === "organization"
      ? "ring-lani-gold/20 bg-lani-gold/5 text-lani-gold hover:bg-lani-gold/10"
      : "ring-lani-green/20 bg-lani-green/5 text-lani-green hover:bg-lani-green/10";

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200/70 bg-white/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Brand */}
        <button onClick={() => onNavigate("home")} className="flex items-center gap-2.5 focus:outline-none">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-lani-green to-lani-emerald text-white shadow-sm">
            <BookOpen size={20} />
          </div>
          <div className="text-left">
            <span className="block text-lg font-black leading-none tracking-tight text-lani-navy">LANI</span>
            <span className="mt-0.5 block text-[10px] font-bold uppercase leading-none tracking-[0.2em] text-lani-gold">Academy</span>
          </div>
        </button>

        {/* Desktop nav */}
        <nav className="hidden h-16 items-center gap-x-0.5 md:flex lg:gap-x-1">
          {navItems.map((item) => {
            const active = currentView === item.view;
            return (
              <button
                key={item.view}
                onClick={() => onNavigate(item.view)}
                className={`relative flex h-16 items-center px-2.5 text-[13px] font-semibold transition-colors lg:px-3 ${
                  active ? "text-lani-green" : "text-slate-600 hover:text-lani-navy"
                }`}
              >
                {item.label}
                {active && <span className="absolute inset-x-2.5 bottom-0 h-0.5 rounded-full bg-lani-green lg:inset-x-3" />}
              </button>
            );
          })}
        </nav>

        {/* Right actions */}
        <div className="hidden items-center gap-2.5 md:flex">
          {user ? (
            <div className="relative" ref={profileRef}>
              <button
                type="button"
                onClick={() => setProfileOpen(!profileOpen)}
                className="flex items-center gap-2 rounded-full border border-slate-200 bg-white py-1 pl-1 pr-2.5 text-left text-sm font-semibold text-lani-navy transition-all hover:bg-slate-50"
              >
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-lani-green to-lani-emerald text-xs font-bold text-white">
                  {displayName.charAt(0).toUpperCase()}
                </span>
                <span className="max-w-28 truncate text-[13px]">{displayName}</span>
                <ChevronDown size={14} className="text-slate-400" />
              </button>

              {profileOpen && (
                <div className="absolute right-0 z-50 mt-2 w-60 origin-top-right rounded-2xl border border-slate-100 bg-white p-2 shadow-soft">
                  <div className="border-b border-slate-100 px-3 py-2">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Signed in as</p>
                    <p className="truncate text-sm font-bold text-lani-navy">{profile?.email || user.email}</p>
                  </div>
                  <div className="mt-1 grid gap-0.5">
                    {dashboardView && (
                      <button
                        onClick={() => { setProfileOpen(false); onNavigate(dashboardView); }}
                        className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-xs font-semibold text-slate-600 hover:bg-slate-50 hover:text-lani-navy"
                      >
                        <DashIcon size={14} /> {dashboardLabel}
                      </button>
                    )}
                    {userRole === "learner" && (
                      <button
                        onClick={() => { setProfileOpen(false); onNavigate("profile"); }}
                        className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-xs font-semibold text-slate-600 hover:bg-slate-50 hover:text-lani-navy"
                      >
                        <UserIcon size={14} /> My profile
                      </button>
                    )}
                    <button
                      onClick={async () => { setProfileOpen(false); await signOut(); onNavigate("home"); }}
                      className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-xs font-semibold text-red-500 hover:bg-red-50"
                    >
                      <LogOut size={14} /> Sign out
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => onNavigate("learner")}
                className="rounded-full px-3.5 py-2 text-sm font-bold text-slate-600 transition-colors hover:text-lani-navy"
              >
                Sign in
              </button>
              <button onClick={() => onNavigate("signup")} className="btn-primary min-h-9 px-4 py-2 text-xs">
                Get started
              </button>
            </div>
          )}
        </div>

        {/* Mobile menu button */}
        <div className="flex items-center gap-2 md:hidden">
          {user && dashboardView && (
            <button
              onClick={() => onNavigate(dashboardView)}
              className={`rounded-full px-3 py-1.5 text-xs font-bold ring-1 ${dashColor}`}
            >
              {dashboardLabel}
            </button>
          )}
          <button
            type="button"
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-lani-navy transition-all hover:bg-slate-50"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Toggle menu"
          >
            {menuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="space-y-4 border-t border-slate-100 bg-white px-4 py-4 md:hidden">
          <nav className="flex flex-col">
            {[
              { label: "Home", view: "home" as View },
              ...navItems,
              ...mobileExtra,
              ...(userRole === "learner" ? [{ label: "My Profile", view: "profile" as View }] : []),
            ].map((item) => (
              <button
                key={item.view}
                onClick={() => { setMenuOpen(false); onNavigate(item.view); }}
                className={`border-b border-slate-50 py-2.5 text-left text-sm font-bold ${
                  currentView === item.view ? "text-lani-green" : "text-slate-600"
                }`}
              >
                {item.label}
              </button>
            ))}
          </nav>
          <div className="flex flex-col gap-2 pt-1">
            {user ? (
              <button
                onClick={async () => { setMenuOpen(false); await signOut(); onNavigate("home"); }}
                className="w-full rounded-lg bg-red-50 py-2.5 text-center text-sm font-bold text-red-500 hover:bg-red-100"
              >
                Sign out
              </button>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => { setMenuOpen(false); onNavigate("learner"); }}
                  className="btn-secondary min-h-10 justify-center text-center"
                >
                  Sign in
                </button>
                <button
                  type="button"
                  onClick={() => { setMenuOpen(false); onNavigate("signup"); }}
                  className="btn-primary min-h-10 justify-center text-center"
                >
                  Get started
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
