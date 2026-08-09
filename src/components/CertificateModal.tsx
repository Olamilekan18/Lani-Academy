import React, { useRef, useState } from "react";
import { X, Download, Loader2, ShieldAlert, Award } from "lucide-react";
import type { Certificate } from "../lib/types";
import { formatDate } from "../lib/utils";

interface CertificateModalProps {
  certificate: Certificate;
  onClose: () => void;
  onVerifyLink: (certId: string) => void;
}

export default function CertificateModal({
  certificate,
  onClose,
  onVerifyLink,
}: CertificateModalProps) {
  const certRef = useRef<HTMLDivElement>(null);
  const [downloading, setDownloading] = useState(false);

  // Generate a real, downloadable PDF from the certificate artwork. Libraries
  // are loaded on demand from a CDN so they don't bloat the main bundle. Falls
  // back to the browser print dialog if generation fails.
  const handleDownload = async () => {
    if (!certRef.current || downloading) return;
    setDownloading(true);
    try {
      const [{ default: html2canvas }, jsPdfModule] = await Promise.all([
        import(/* @vite-ignore */ "https://esm.sh/html2canvas@1.4.1"),
        import(/* @vite-ignore */ "https://esm.sh/jspdf@2.5.2"),
      ]);
      const jsPDF = (jsPdfModule as { jsPDF: new (opts: object) => any }).jsPDF;

      const canvas = await html2canvas(certRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: "#ffffff",
      });

      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF({
        orientation: canvas.width >= canvas.height ? "landscape" : "portrait",
        unit: "px",
        format: [canvas.width, canvas.height],
      });
      pdf.addImage(imgData, "PNG", 0, 0, canvas.width, canvas.height);
      pdf.save(`LANI-Certificate-${certificate.id}.pdf`);
    } catch (e) {
      console.error("PDF generation failed, falling back to print:", e);
      window.print();
    } finally {
      setDownloading(false);
    }
  };

  const verifyUrl = `${window.location.origin}/verify?id=${encodeURIComponent(certificate.id)}`;
  const qrSrc = `https://api.qrserver.com/v1/create-qr-code/?size=120x120&margin=0&data=${encodeURIComponent(verifyUrl)}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm print:p-0 print:bg-white">
      <div className="relative w-full max-w-4xl overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl animate-in fade-in zoom-in-95 duration-200 print:shadow-none print:border-0 print:rounded-none">
        
        {/* Controls - Hidden during printing */}
        <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50 px-6 py-3 print:hidden">
          <div className="flex items-center gap-2 text-sm font-semibold text-lani-navy">
            <Award size={18} className="text-lani-gold" />
            <span>Official Certification File</span>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleDownload}
              disabled={downloading}
              className="inline-flex items-center gap-2 rounded-lg bg-lani-green px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-lani-emerald disabled:opacity-60"
            >
              {downloading ? <Loader2 size={13} className="animate-spin" /> : <Download size={13} />}
              {downloading ? "Preparing…" : "Download PDF"}
            </button>
            <button
              onClick={onClose}
              className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-lani-navy"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Certificate Display Area */}
        <div className="p-8 md:p-12 print:p-0">
          <div ref={certRef} className="relative overflow-hidden rounded-xl border-[6px] border-double border-lani-gold bg-amber-50/20 p-8 text-center md:p-16 shadow-inner">
            
            {/* Watermark Logo Background */}
            <div className="absolute inset-0 -z-10 opacity-5 flex items-center justify-center pointer-events-none">
              <Award size={400} className="text-lani-navy" />
            </div>

            {/* Corner Ornamental Accents */}
            <div className="absolute top-4 left-4 h-8 w-8 border-t-2 border-l-2 border-lani-gold" />
            <div className="absolute top-4 right-4 h-8 w-8 border-t-2 border-r-2 border-lani-gold" />
            <div className="absolute bottom-4 left-4 h-8 w-8 border-b-2 border-l-2 border-lani-gold" />
            <div className="absolute bottom-4 right-4 h-8 w-8 border-b-2 border-r-2 border-lani-gold" />

            {/* Content */}
            <div className="max-w-2xl mx-auto space-y-6 md:space-y-8">
              <div>
                <span className="font-serif text-sm tracking-widest text-lani-gold uppercase block font-semibold">
                  LANI Academy Certification
                </span>
                <h2 className="font-serif mt-3 text-3xl font-bold tracking-tight text-lani-navy md:text-4xl">
                  Certificate of {certificate.type || "Completion"}
                </h2>
                <div className="mt-2 h-0.5 w-24 bg-gradient-to-r from-transparent via-lani-gold to-transparent mx-auto" />
                <p className="mt-3 text-xs font-bold uppercase tracking-[0.2em] text-slate-500">
                  Certificate No.&nbsp;<span className="font-mono tracking-normal text-lani-navy select-all">{certificate.id}</span>
                </p>
              </div>

              <p className="font-serif text-sm italic text-slate-500">
                This is proudly presented to
              </p>

              <div>
                <h3 className="font-serif text-3xl font-extrabold text-lani-navy md:text-4xl">
                  {certificate.learnerName}
                </h3>
                <div className="mx-auto mt-3 h-px w-64 max-w-full bg-lani-gold/60" />
                <p className="mt-4 text-xs font-semibold uppercase tracking-wider text-lani-blue">
                  Learner Code: {certificate.learnerEmail}
                </p>
              </div>

              <p className="text-sm leading-6 text-slate-700 max-w-lg mx-auto font-serif">
                for having successfully fulfilled all assessment criteria and completed the advanced
                instructional hours for the professional training course in
                <strong className="block mt-2 text-base text-lani-navy font-sans font-bold">
                  {certificate.courseTitle}
                </strong>
              </p>

              {/* Certificate Footer */}
              <div className="mt-12 pt-8 border-t border-slate-200/60 grid gap-8 sm:grid-cols-3 items-end">
                {/* Director Signature */}
                <div className="text-center">
                  <div className="h-10 font-serif text-lg italic text-lani-navy flex items-center justify-center">
                    Olaniyi Omole
                  </div>
                  <div className="h-px bg-slate-300 w-32 mx-auto" />
                  <span className="text-[10px] uppercase font-bold text-slate-400 mt-1 block">
                    Deputy Consulting Lead
                  </span>
                </div>

                {/* Seal */}
                <div className="flex justify-center">
                  <div className="relative flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-lani-gold to-amber-600 shadow-md ring-4 ring-white">
                    <Award size={36} className="text-white" />
                    <div className="absolute inset-1 rounded-full border border-dashed border-white/40" />
                  </div>
                </div>

                {/* Verification QR + ID */}
                <div className="text-center space-y-2">
                  <img
                    src={qrSrc}
                    alt="Scan to verify certificate"
                    className="mx-auto h-20 w-20 rounded bg-white p-1 ring-1 ring-slate-200"
                  />
                  <button
                    onClick={() => {
                      onVerifyLink(certificate.id);
                      onClose();
                    }}
                    className="inline-flex items-center justify-center leading-none rounded bg-lani-navy hover:bg-lani-green text-white text-[10px] font-bold px-3 py-2 shadow-sm transition-all print:hidden"
                  >
                    Verify Online
                  </button>
                  <div className="text-[10px] text-slate-400 font-medium">
                    Scan to verify · ID: <strong className="text-lani-navy select-all">{certificate.id}</strong>
                    <br />
                    Date: {formatDate(certificate.issueDate)}
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
}
