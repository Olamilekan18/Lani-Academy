import React, { useState, useEffect } from "react";
import { ShieldCheck, BadgeCheck, FileText, Award, Search } from "lucide-react";
import type { Certificate } from "../lib/types";
import { formatDate } from "../lib/utils";

interface VerifyProps {
  certificates: Certificate[];
  initialQuery?: string;
  onOpenCertificate: (certificate: Certificate) => void;
}

export default function Verify({ certificates, initialQuery = "", onOpenCertificate }: VerifyProps) {
  const [query, setQuery] = useState(initialQuery);
  const [match, setMatch] = useState<Certificate | null>(null);

  useEffect(() => {
    if (initialQuery) {
      setQuery(initialQuery);
      const m = certificates.find(
        (cert) => cert.id.toLowerCase() === initialQuery.trim().toLowerCase()
      );
      setMatch(m || null);
    }
  }, [initialQuery, certificates]);

  const handleSearch = (val: string) => {
    setQuery(val);
    const m = certificates.find(
      (cert) => cert.id.toLowerCase() === val.trim().toLowerCase()
    );
    setMatch(m || null);
  };

  return (
    <div className="section bg-white text-left min-h-[50rem]">
      {/* Page Header */}
      <div className="mb-10 max-w-3xl">
        <span className="eyebrow">Credential Audit</span>
        <h1 className="mt-3 text-3xl font-extrabold text-lani-navy tracking-tight sm:text-4xl">
          Verify LANI Certificates
        </h1>
        <p className="mt-2 text-slate-500 text-sm leading-6">
          Every official graduation award carries a unique cryptographic ID. Validate it here to confirm qualifications, course completion hours, and active statuses.
        </p>
      </div>

      <div className="grid gap-8 lg:grid-cols-[0.85fr_1.15fr]">
        
        {/* Left Search panel */}
        <div className="form-panel border border-slate-200">
          <label className="form-field">
            Certificate ID / Verification Code
            <div className="relative mt-1">
              <Search className="absolute left-3 top-3.5 h-4 w-4 text-slate-400" />
              <input
                type="text"
                value={query}
                onChange={(e) => handleSearch(e.target.value)}
                placeholder="e.g. LANI-CERT-2026-001"
                className="pl-10 min-h-11 w-full rounded-lg border border-slate-200"
              />
            </div>
          </label>

          <div className="rounded-xl bg-slate-50 border border-slate-100 p-5 text-xs leading-6 text-slate-500 grid gap-2">
            <h3 className="font-bold text-lani-navy uppercase">Verification Audit Guidelines</h3>
            <p>1. Ensure characters are entered exactly as displayed on the footer of the physical award.</p>
            <p>2. Accompanying transcripts or certificates are cryptographically locked to the email address of record.</p>
            <p>3. Statuses include: <strong>Issued</strong> or <strong>Revoked</strong>.</p>
          </div>
        </div>

        {/* Right Details Panel */}
        <div className="certificate-card border border-slate-200 shadow-md flex flex-col justify-between">
          {match ? (
            <div className="space-y-6">
              <div className="flex items-start justify-between gap-4 border-b border-slate-100 pb-4">
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-lani-gold">
                    Verified qualifications record
                  </span>
                  <h2 className="mt-2 text-2xl font-extrabold text-lani-navy">{match.learnerName}</h2>
                </div>
                <BadgeCheck size={38} className="text-lani-green shrink-0" />
              </div>

              <div className="text-sm leading-6 text-slate-600">
                This confirms that the learner named above successfully completed the capacity building syllabus in:
                <strong className="block text-base text-lani-navy font-bold mt-1.5">{match.courseTitle}</strong>
              </div>

              <div className="grid gap-4 sm:grid-cols-2 rounded-xl bg-slate-50 border border-slate-100 p-5 text-xs text-slate-600 font-semibold">
                <div>
                  <span className="text-[10px] text-slate-400 block uppercase">Certificate ID</span>
                  <span className="text-lani-navy font-mono">{match.id}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block uppercase">Issue Date</span>
                  <span className="text-lani-navy">{formatDate(match.issueDate)}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block uppercase">Record Status</span>
                  <span className="text-lani-green">Valid / {match.status}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block uppercase">Accredited Engine</span>
                  <span className="text-lani-navy">LANI Academy</span>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex justify-end">
                <button
                  onClick={() => onOpenCertificate(match)}
                  className="btn-primary min-h-10 text-xs px-5 flex items-center gap-2"
                >
                  <Award size={15} />
                  View Printable Diploma
                </button>
              </div>
            </div>
          ) : (
            <div className="grid min-h-80 place-items-center text-center">
              <div>
                <Award className="mx-auto text-slate-300" size={54} />
                <h2 className="mt-4 text-xl font-bold text-lani-navy">No verified records</h2>
                <p className="mt-1.5 text-xs text-slate-500 max-w-xs mx-auto leading-5">
                  Enter a verification ID (such as `LANI-CERT-2026-001`) in the search field to retrieve cryptographic credentials.
                </p>
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
