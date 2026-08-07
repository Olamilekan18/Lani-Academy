import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { BookOpen, Shield, Sparkles, User, ChevronRight, ChevronDown, Building2 } from "lucide-react";

export default function SignUp() {
  const navigate = useNavigate();
  const [adminExpanded, setAdminExpanded] = useState(false);

  return (
    <div className="section min-h-[45rem] flex items-center justify-center bg-slate-50">
      <div className="w-full max-w-md bg-white border border-slate-200 shadow-xl rounded-2xl p-8 text-left">
        <div className="text-center mb-8 space-y-2">
          <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-lani-blue to-blue-600 text-white shadow">
            <User size={22} />
          </div>
          <h2 className="text-xl font-bold text-lani-navy tracking-tight mt-3">
            Join LANI Academy
          </h2>
          <p className="text-xs text-slate-500">
            Select how you would like to register for the platform.
          </p>
        </div>

        <div className="space-y-4">
          {/* Learner Option */}
          <button
            onClick={() => navigate("/learn?mode=signup")}
            className="w-full flex items-center justify-between p-4 rounded-xl border border-slate-200 bg-white hover:border-lani-green hover:shadow-md transition-all group"
          >
            <div className="flex items-center gap-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-lani-green/10 text-lani-green group-hover:bg-lani-green group-hover:text-white transition-colors">
                <BookOpen size={20} />
              </div>
              <div className="text-left">
                <h3 className="text-sm font-bold text-lani-navy">Sign up as Learner</h3>
                <p className="text-[11px] text-slate-500">Access your digital learning workspace</p>
              </div>
            </div>
            <ChevronRight size={16} className="text-slate-300 group-hover:text-lani-green" />
          </button>

          {/* Admin Option */}
          <div className="rounded-xl border border-slate-200 bg-white overflow-hidden transition-all">
            <button
              onClick={() => setAdminExpanded(!adminExpanded)}
              className="w-full flex items-center justify-between p-4 hover:bg-slate-50 transition-colors group"
            >
              <div className="flex items-center gap-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-lani-blue/10 text-lani-blue group-hover:bg-lani-blue group-hover:text-white transition-colors">
                  <Shield size={20} />
                </div>
                <div className="text-left">
                  <h3 className="text-sm font-bold text-lani-navy">Sign up as Administrator</h3>
                  <p className="text-[11px] text-slate-500">For platform staff and facilitators</p>
                </div>
              </div>
              {adminExpanded ? (
                <ChevronDown size={16} className="text-slate-400" />
              ) : (
                <ChevronRight size={16} className="text-slate-300" />
              )}
            </button>

            {adminExpanded && (
              <div className="p-4 pt-0 bg-slate-50 border-t border-slate-100 flex flex-col gap-2">
                <button
                  onClick={() => navigate("/facilitator?mode=signup")}
                  className="w-full flex items-center justify-between p-3 rounded-lg border border-transparent hover:border-lani-gold/30 hover:bg-white transition-all group mt-2"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded bg-lani-gold/10 text-lani-gold">
                      <Sparkles size={16} />
                    </div>
                    <div className="text-left">
                      <h4 className="text-xs font-bold text-slate-700">Facilitator</h4>
                      <p className="text-[10px] text-slate-500">Manage course assignments</p>
                    </div>
                  </div>
                  <ChevronRight size={14} className="text-slate-300 group-hover:text-lani-gold" />
                </button>

                <button
                  onClick={() => navigate("/admin?mode=signup")}
                  className="w-full flex items-center justify-between p-3 rounded-lg border border-transparent hover:border-lani-blue/30 hover:bg-white transition-all group"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded bg-lani-blue/10 text-lani-blue">
                      <Shield size={16} />
                    </div>
                    <div className="text-left">
                      <h4 className="text-xs font-bold text-slate-700">System Admin</h4>
                      <p className="text-[10px] text-slate-500">Manage CRM and catalogue</p>
                    </div>
                  </div>
                  <ChevronRight size={14} className="text-slate-300 group-hover:text-lani-blue" />
                </button>
              </div>
            )}
          </div>

          {/* Organization Option */}
          <button
            onClick={() => navigate("/organization?mode=signup")}
            className="w-full flex items-center justify-between p-4 rounded-xl border border-slate-200 bg-white hover:border-lani-green hover:shadow-md transition-all group"
          >
            <div className="flex items-center gap-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-lani-gold/10 text-lani-gold group-hover:bg-lani-gold group-hover:text-white transition-colors">
                <Building2 size={20} />
              </div>
              <div className="text-left">
                <h3 className="text-sm font-bold text-lani-navy">Sign up as Organization</h3>
                <p className="text-[11px] text-slate-500">Sponsor and track learners from your company</p>
              </div>
            </div>
            <ChevronRight size={16} className="text-slate-300 group-hover:text-lani-gold" />
          </button>
        </div>

        <div className="mt-8 text-center border-t border-slate-100 pt-6">
          <p className="text-xs text-slate-500">
            Already have an account?{" "}
            <button onClick={() => navigate("/learn")} className="font-bold text-lani-blue hover:underline">
              Sign In
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
