import React from "react";
import { BookOpen, MapPin, Mail, Phone, ExternalLink } from "lucide-react";
import toast from "react-hot-toast";
import { dbSubscribeNewsletter } from "../lib/db";
import type { View } from "../lib/types";

interface FooterProps {
  onNavigate: (view: View) => void;
}

export default function Footer({ onNavigate }: FooterProps) {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-gradient-to-b from-slate-900 to-lani-navy text-slate-300">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
        <div className="grid gap-12 lg:grid-cols-4 md:grid-cols-2">
          {/* Brand & Mission */}
          <div className="space-y-6">
            <div className="flex items-center gap-2.5">
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
            </div>
            <p className="text-sm leading-6 text-slate-400">
              Transforming capabilities and driving organizational excellence through our hybrid
              capacity building engine. Leading in open programmes, bespoke training, and digital
              LMS deployment.
            </p>
            <div className="flex items-center gap-2.5 text-xs text-lani-gold">
              <span className="flex h-2.5 w-2.5 items-center justify-center rounded-full bg-lani-emerald/20">
                <span className="h-1.5 w-1.5 rounded-full bg-lani-emerald animate-pulse" />
              </span>
              <span>Nigeria · Ghana · Kenya · Uganda</span>
            </div>
          </div>

          {/* Core Portals */}
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-white">Programs & Portals</h3>
            <ul className="mt-6 space-y-4">
              {([
                { label: "Course Marketplace", view: "courses" },
                { label: "Learning Pathways", view: "pathways" },
                { label: "Certification", view: "certification" },
                { label: "Corporate Training B2B", view: "corporate" },
                { label: "Corporate Portal Login", view: "organization" },
                { label: "Scholarship Applications", view: "applications" },
                { label: "Certificate Verification", view: "verify" },
              ] as { label: string; view: View }[]).map((l) => (
                <li key={l.view}>
                  <button
                    onClick={() => onNavigate(l.view)}
                    className="footer-link text-slate-400 hover:text-white text-sm"
                  >
                    {l.label}
                  </button>
                </li>
              ))}
            </ul>
            <h3 className="mt-8 text-sm font-bold uppercase tracking-wider text-white">Company</h3>
            <ul className="mt-6 space-y-4">
              {([
                { label: "About LANI Academy", view: "about" },
                { label: "Resources", view: "resources" },
                { label: "Contact", view: "contact" },
              ] as { label: string; view: View }[]).map((l) => (
                <li key={l.view}>
                  <button
                    onClick={() => onNavigate(l.view)}
                    className="footer-link text-slate-400 hover:text-white text-sm"
                  >
                    {l.label}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact Details */}
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-white">Contact & Support</h3>
            <ul className="mt-6 space-y-4 text-sm leading-6 text-slate-400">
              <li className="flex gap-3">
                <MapPin size={18} className="text-lani-gold shrink-0 mt-1" />
                <span>
                  4, Olumuyiwa Street,
                  <br />
                  Off Babington Ashaye Crescent,
                  <br />
                  Omole Phase 1, Ikeja, Lagos, Nigeria.
                </span>
              </li>
              <li className="flex gap-3 items-center">
                <Mail size={16} className="text-lani-gold shrink-0" />
                <a href="mailto:info@lani.ng" className="hover:text-white transition-colors">
                  info@lani.ng
                </a>
              </li>
              <li className="flex gap-3 items-center">
                <Phone size={16} className="text-lani-gold shrink-0" />
                <a href="tel:+2348000000000" className="hover:text-white transition-colors">
                  +234 (0) 800-LANI-ACADEMY
                </a>
              </li>
            </ul>
          </div>

          {/* Newsletter / Action */}
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-white">
              Stay Informed
            </h3>
            <p className="mt-6 text-sm leading-6 text-slate-400">
              Subscribe to our weekly capacity briefings for exclusive executive learning insights and schedule releases.
            </p>
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                const form = e.currentTarget;
                const email = (new FormData(form).get("email") as string) || "";
                const ok = await dbSubscribeNewsletter(email);
                if (ok) { toast.success("Thank you for subscribing to our briefings!"); form.reset(); }
                else toast.error("Could not subscribe right now. Please try again.");
              }}
              className="mt-6 flex flex-col gap-2 sm:flex-row"
            >
              <input
                type="email"
                name="email"
                placeholder="Work email address"
                required
                className="h-10 w-full rounded-lg bg-white/10 px-4 text-sm text-white placeholder:text-slate-500 outline-none ring-1 ring-white/10 focus:ring-lani-green"
              />
              <button
                type="submit"
                className="h-10 rounded-lg bg-lani-green hover:bg-lani-emerald text-white px-4 text-xs font-bold transition-all shadow-sm"
              >
                Join
              </button>
            </form>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-16 border-t border-white/10 pt-8 flex flex-col justify-between gap-4 md:flex-row text-xs text-slate-500 font-medium">
          <p>© {currentYear} LANI Group. All rights reserved. LANI Academy and its logo are trademarks of LANI Group.</p>
          <div className="flex gap-4">
            <a href="#" className="hover:text-white transition-colors">
              Privacy Policy
            </a>
            <a href="#" className="hover:text-white transition-colors">
              Terms of Service
            </a>
            <a href="#" className="hover:text-white transition-colors flex items-center gap-1">
              LANI Group Main
              <ExternalLink size={10} />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
