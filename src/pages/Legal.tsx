import React from "react";
import { ShieldCheck, FileText, CalendarDays, ChevronRight } from "lucide-react";
import type { View } from "../lib/types";

interface LegalProps {
  type: "privacy" | "terms";
  onNavigate: (view: View) => void;
}

export default function Legal({ type, onNavigate }: LegalProps) {
  const isPrivacy = type === "privacy";
  const lastUpdated = "27 August 2026";

  const sections = isPrivacy
    ? [
      {
        title: "1. Information We Collect",
        body:
          "We collect information you provide directly, such as your name, email address, phone number, organisation, and payment details when you create an account, enrol in a course, or contact us. We also collect information automatically, including device, browser, and usage data when you interact with LANI Academy.",
      },
      {
        title: "2. How We Use Your Information",
        body:
          "We use your information to provide and improve our learning programmes, process enrolments and payments, issue certificates, communicate with you about courses and updates, and comply with legal obligations. We may use aggregated, de-identified data for analytics and reporting.",
      },
      {
        title: "3. Sharing of Information",
        body:
          "We do not sell your personal information. We may share information with trusted service providers who help us operate the platform (such as payment processors and hosting providers), with your consent, or where required by law. Facilitators and administrators may access learner progress data solely to deliver and evaluate programmes.",
      },
      {
        title: "4. Data Security",
        body:
          "We implement appropriate technical and organisational measures to protect your information against unauthorised access, alteration, disclosure, or destruction. However, no method of transmission or storage is completely secure, and we cannot guarantee absolute security.",
      },
      {
        title: "5. Your Rights",
        body:
          "Subject to applicable law, you may have the right to access, correct, update, or delete your personal information, and to object to or restrict certain processing. To exercise these rights, please contact us at the details provided below.",
      },
      {
        title: "6. Data Retention",
        body:
          "We retain your personal information for as long as necessary to fulfil the purposes described in this policy, comply with legal obligations, and resolve disputes. Course completion and certificate records may be retained to support verification requests.",
      },
      {
        title: "7. Cookies",
        body:
          "We use cookies and similar technologies to maintain your session, remember your preferences, and understand how you use the platform. You can control cookies through your browser settings.",
      },
      {
        title: "8. Changes to This Policy",
        body:
          "We may update this Privacy Policy from time to time. We will notify you of material changes by posting the updated policy on this page, and the effective date will be updated accordingly.",
      },
      {
        title: "9. Contact Us",
        body:
          "If you have any questions or concerns about this Privacy Policy or your personal data, please contact us at info@lani.ng or by writing to LANI Academy, 53B Adekunle Fajuyi Way, Ikeja GRA, Lagos, Nigeria.",
      },
    ]
    : [
      {
        title: "1. Acceptance of Terms",
        body:
          "By accessing or using LANI Academy, you agree to be bound by these Terms of Service and our Privacy Policy. If you do not agree to these terms, please do not use the platform.",
      },
      {
        title: "2. Accounts and Eligibility",
        body:
          "You must be at least 18 years old, or have the consent of a parent or guardian, to create an account. You are responsible for maintaining the confidentiality of your account credentials and for all activity that occurs under your account.",
      },
      {
        title: "3. Enrolment and Payment",
        body:
          "Course fees are as displayed at the time of enrolment. Payment must be completed before access is granted, unless another arrangement has been agreed. Fees are non-refundable except where required by law or as stated in our refund policy.",
      },
      {
        title: "4. Acceptable Use",
        body:
          "You agree not to misuse the platform, including attempting to gain unauthorised access, disrupting services, infringing intellectual property, sharing your account, or using the platform for any unlawful purpose.",
      },
      {
        title: "5. Intellectual Property",
        body:
          "All course content, materials, trademarks, and software on LANI Academy are the property of LANI Group and its licensors. You may not reproduce, distribute, or create derivative works without our prior written consent.",
      },
      {
        title: "6. Certificates",
        body:
          "Certificates are issued upon successful completion of a course's requirements. Certificates are provided for your personal and professional use and may not be used in a manner that misrepresents their origin or the credential awarded.",
      },
      {
        title: "7. Limitation of Liability",
        body:
          "To the maximum extent permitted by law, LANI Academy and LANI Group shall not be liable for any indirect, incidental, special, or consequential damages arising out of or in connection with your use of the platform or participation in any programme.",
      },
      {
        title: "8. Termination",
        body:
          "We may suspend or terminate your access to the platform if you breach these Terms or engage in conduct that harms the platform, our learners, or our reputation.",
      },
      {
        title: "9. Governing Law",
        body:
          "These Terms are governed by the laws of the Federal Republic of Nigeria. Any disputes arising under these Terms shall be subject to the exclusive jurisdiction of the courts of Nigeria.",
      },
      {
        title: "10. Contact Us",
        body:
          "If you have any questions about these Terms of Service, please contact us at info@lani.ng or by writing to LANI Academy, 53B Adekunle Fajuyi Way, Ikeja GRA, Lagos, Nigeria.",
      },
    ];

  return (
    <div className="flex flex-col">
      {/* Hero */}
      <section className="hero-band">
        <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
          <span className="pill bg-white/10 text-lani-gold ring-1 ring-white/10">
            {isPrivacy ? <ShieldCheck size={14} /> : <FileText size={14} />} {isPrivacy ? "Privacy Policy" : "Terms of Service"}
          </span>
          <h1 className="mt-5 text-4xl font-extrabold leading-tight tracking-tight sm:text-5xl">
            {isPrivacy ? "Privacy Policy" : "Terms of Service"}
          </h1>
          <p className="mt-4 flex items-center gap-2 text-sm font-semibold text-slate-300">
            <CalendarDays size={14} className="text-lani-gold" /> Last updated: {lastUpdated}
          </p>
        </div>
      </section>

      {/* Breadcrumb */}
      <nav className="border-b border-slate-100 bg-white">
        <div className="mx-auto max-w-4xl px-4 py-3 sm:px-6 lg:px-8 flex items-center gap-1.5 text-xs font-semibold text-slate-400">
          <button onClick={() => onNavigate("home")} className="hover:text-lani-green transition-colors">Home</button>
          <ChevronRight size={12} />
          <span className="text-lani-navy">{isPrivacy ? "Privacy Policy" : "Terms of Service"}</span>
        </div>
      </nav>

      {/* Content */}
      <section className="section">
        <div className="mx-auto max-w-4xl">
          <div className="prose-sm space-y-8">
            <p className="text-sm leading-7 text-slate-600">
              {isPrivacy
                ? "This Privacy Policy describes how LANI Academy collects, uses, and protects your personal information when you use our platform."
                : "These Terms of Service govern your use of the LANI Academy platform, including all courses, materials, and services offered through it."}
            </p>
            {sections.map((s) => (
              <div key={s.title}>
                <h2 className="text-lg font-bold text-lani-navy">{s.title}</h2>
                <p className="mt-2 text-sm leading-7 text-slate-600">{s.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
