import React from "react";
import { Navigate, useNavigate } from "react-router-dom";
import {
  BookOpen,
  Sparkles,
  Building2,
  Shield,
  CheckCircle2,
  ArrowLeft,
} from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import Login from "./Login";

type PortalRole = "learner" | "facilitator" | "admin" | "organization";

interface RoleMeta {
  label: string;
  title: string;
  tagline: string;
  benefits: string[];
  icon: React.ReactNode;
  /** Tailwind gradient classes for the hero panel. */
  gradient: string;
  /** Whether the role can self-register. */
  selfServe: boolean;
}

const ROLE_META: Record<PortalRole, RoleMeta> = {
  learner: {
    label: "Learner",
    title: "Start learning with LANI Academy",
    tagline:
      "Create your learner account to access curated courses, earn verifiable certificates, and track your growth.",
    benefits: [
      "Access curated, expert-led courses",
      "Earn verifiable digital certificates",
      "Track your progress and pathways",
      "Join a community of learners",
    ],
    icon: <BookOpen size={22} />,
    gradient: "from-lani-green to-lani-emerald",
    selfServe: true,
  },
  facilitator: {
    label: "Facilitator",
    title: "Facilitate courses on LANI Academy",
    tagline:
      "Set up your facilitator account to manage assignments, grade submissions, and guide learners to success.",
    benefits: [
      "Manage your course assignments",
      "Grade submissions and quizzes",
      "Track learner progress in real time",
      "Post announcements and schedule sessions",
    ],
    icon: <Sparkles size={22} />,
    gradient: "from-lani-gold to-yellow-600",
    selfServe: true,
  },
  organization: {
    label: "Organization",
    title: "Upskill your team with LANI Academy",
    tagline:
      "Register your organization to sponsor learners, manage seats, and track your team's development.",
    benefits: [
      "Sponsor and enrol your team",
      "Manage seats and bulk enrolments",
      "Track employee progress",
      "Consolidated reporting and insights",
    ],
    icon: <Building2 size={22} />,
    gradient: "from-lani-blue to-blue-700",
    selfServe: true,
  },
  admin: {
    label: "Administrator",
    title: "LANI Academy Admin Console",
    tagline:
      "Administrator accounts are provisioned by a LANI super admin. Sign in below or contact your administrator for access.",
    benefits: [
      "Manage the course catalogue",
      "Oversee CRM, leads, and applications",
      "Monitor platform-wide metrics",
      "Provision facilitator and staff access",
    ],
    icon: <Shield size={22} />,
    gradient: "from-lani-navy to-lani-blue",
    selfServe: false,
  },
};

const roleHome = (role?: string): string => {
  if (role === "admin" || role === "super_admin") return "/admin";
  if (role === "facilitator") return "/facilitator";
  if (role === "organization") return "/organization";
  return "/learn";
};

interface SignUpRoleProps {
  role: PortalRole;
}

export default function SignUpRole({ role }: SignUpRoleProps) {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const meta = ROLE_META[role];

  // Already signed in → send them straight to their own dashboard.
  if (user && profile) {
    return <Navigate to={roleHome(profile.role)} replace />;
  }

  return (
    <div className="section min-h-[45rem] bg-slate-50 py-12">
      <div className="mx-auto w-full max-w-5xl">
        <button
          onClick={() => navigate("/signup")}
          className="mb-6 inline-flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-lani-green transition-colors"
        >
          <ArrowLeft size={14} />
          All sign-up options
        </button>

        <div className="grid gap-8 lg:grid-cols-2 lg:items-stretch">
          {/* Landing / hero panel */}
          <div
            className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${meta.gradient} p-8 text-white shadow-soft flex flex-col`}
          >
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/15 backdrop-blur">
                {meta.icon}
              </div>
              <span className="text-[11px] font-bold uppercase tracking-widest text-white/80">
                {meta.label} sign-up
              </span>
            </div>

            <h1 className="mt-8 text-2xl font-extrabold leading-tight tracking-tight sm:text-3xl">
              {meta.title}
            </h1>
            <p className="mt-3 max-w-sm text-sm leading-relaxed text-white/85">
              {meta.tagline}
            </p>

            <ul className="mt-8 space-y-3">
              {meta.benefits.map((b) => (
                <li key={b} className="flex items-start gap-3 text-sm text-white/90">
                  <CheckCircle2 size={18} className="mt-0.5 shrink-0 text-white/80" />
                  <span>{b}</span>
                </li>
              ))}
            </ul>

            <div className="mt-auto pt-10">
              <p className="text-xs text-white/70">
                Already have an account?{" "}
                <button
                  onClick={() => navigate(roleHome(role))}
                  className="font-bold text-white underline underline-offset-2 hover:text-white/90"
                >
                  Sign in
                </button>
              </p>
            </div>
          </div>

          {/* Signup form */}
          <div className="flex items-center justify-center">
            <Login
              portalRole={role}
              forceSignup={meta.selfServe}
              embedded
              onNavigate={(view: any) => {
                if (typeof view === "string") navigate(`/${view}`);
              }}
              onSuccess={() => navigate(roleHome(role))}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
