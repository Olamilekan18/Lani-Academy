import React, { useState, useEffect } from "react";
import {
  ArrowRight,
  Sparkles,
  BookOpen,
  Users,
  Compass,
  Zap,
  CheckCircle,
  HelpCircle,
  MessageSquare,
  TrendingUp,
  FileText
} from "lucide-react";
import type { Course, ThematicArea } from "../lib/types";
import { formatMoney } from "../lib/utils";

interface HomeProps {
  courses: Course[];
  thematicAreas: ThematicArea[];
  onNavigate: (view: any) => void;
  onOpenCourse: (course: Course) => void;
  onAddLead: (leadData: any) => Promise<void>;
}

export default function Home({
  courses,
  thematicAreas,
  onNavigate,
  onOpenCourse,
  onAddLead,
}: HomeProps) {
  const [activeFaq, setActiveFaq] = useState<number | null>(null);
  const [activeTestimonial, setActiveTestimonial] = useState(0);
  const [leadSubmitted, setLeadSubmitted] = useState(false);
  const [submittingLead, setSubmittingLead] = useState(false);

  // Timed carousel interval for testimonials
  useEffect(() => {
    const timer = setInterval(() => {
      setActiveTestimonial((prev) => (prev + 1) % 3); // 3 testimonials total
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  const featuredCourses = courses.filter((c) => c.featured).slice(0, 3);

  const testimonials = [
    {
      quote: "LANI Academy completely transformed our tax compliance team. The in-plant hybrid model allowed our staff to study at their own pace while participating in rigorous physical weekend case studies.",
      author: "Hauwa Ibrahim",
      title: "VP of HR, Northern Assurance Corp",
      initials: "HI"
    },
    {
      quote: "The digital transformation program was exceptional. Our product managers learned practical agile methodologies and successfully launched our fintech portal ahead of schedule.",
      author: "Segun Ademola",
      title: "Chief Product Officer, Apex Bank Plc",
      initials: "SA"
    },
    {
      quote: "We chose LANI Academy for ESG consulting and staff training. Their capacity building lifecycle is highly rigorous, moving from assessment to measurable performance tracking.",
      author: "Dr. Elizabeth Cole",
      title: "Sustainability Director, Frontier Minerals",
      initials: "EC"
    }
  ];

  const faqs = [
    {
      question: "What is the LANI Hybrid Capacity Engine?",
      answer: "It is our proprietary training framework that combines structured online modules (Self-paced/Virtual LMS) with high-intensity, practical physical workshop labs (In-plant/Physical) to ensure knowledge is applied, verified, and certified."
    },
    {
      question: "Are these programs officially accredited?",
      answer: "Yes, LANI Academy programs are developed in partnership with leading global professional bodies. Every certificate carries a unique cryptographic ID verifiable in real-time through our database verification engine."
    },
    {
      question: "Can we request a custom training agenda for our organization?",
      answer: "Absolutely. Through our B2B Portal, we offer bespoke custom curricula ('In-plant models') tailored to your corporate context, delivered at your facility or virtually, with assessments aligned to your internal KPIs."
    },
    {
      question: "Is there scholarship or corporate sponsorship support available?",
      answer: "Yes. Through our Sponsored Bootcamps and Thematic Scholarships, we partner with international donors and corporate CSR arms to provide fully-funded training slots. Review criteria on the Scholarships page."
    }
  ];

  const handleLeadSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmittingLead(true);
    const formData = new FormData(e.currentTarget);
    const leadData = {
      organisation: formData.get("organisation") as string,
      sector: formData.get("sector") as string,
      contactName: formData.get("contactName") as string,
      email: formData.get("email") as string,
      phone: formData.get("phone") as string,
      thematicArea: formData.get("thematicArea") as string,
      participants: parseInt(formData.get("participants") as string) || 0,
      deliveryMode: formData.get("deliveryMode") as string,
      preferredDate: formData.get("preferredDate") as string,
      need: formData.get("need") as string,
      stage: "New",
      createdAt: new Date().toISOString().split("T")[0],
    };

    try {
      await onAddLead(leadData);
      setLeadSubmitted(true);
      e.currentTarget.reset();
    } catch (err) {
      console.error(err);
    } finally {
      setSubmittingLead(false);
    }
  };

  return (
    <div className="flex flex-col">
      {/* 1. HERO SECTION */}
      <section className="relative overflow-hidden bg-lani-navy text-white lg:min-h-[calc(100vh-4rem)] lg:flex lg:items-center">
        {/* Subtle grid background */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:32px_32px]" />
        
        {/* Large Gradient Blobs */}
        <div className="absolute -left-20 -top-20 h-96 w-96 rounded-full bg-lani-green/20 blur-[100px] pointer-events-none" />
        <div className="absolute -right-20 bottom-0 h-96 w-96 rounded-full bg-lani-blue/20 blur-[100px] pointer-events-none" />

        <div className="mx-auto max-w-7xl w-full px-4 py-20 sm:px-6 lg:grid lg:grid-cols-[1.1fr_0.9fr] lg:gap-12 lg:px-8 lg:py-28 items-center relative z-10">
          
          {/* Copy Writing */}
          <div className="space-y-8 text-left">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-lani-gold backdrop-blur-md">
              <Sparkles size={12} className="animate-pulse text-lani-gold" />
              Hybrid Capacity Engine
            </span>
            <h1 className="text-4xl font-extrabold leading-tight tracking-tight sm:text-5xl lg:text-6xl text-white">
              Build Future-Ready <br />
              <span className="text-lani-emerald">
                Capabilities
              </span> with LANI
            </h1>
            <p className="max-w-2xl text-base leading-8 text-slate-300 sm:text-lg">
              Empowering over 50,000+ professionals and leading enterprises with high-impact open programmes, customized B2B corporate training, and advanced digital LMS infrastructures.
            </p>
            <div className="flex flex-wrap gap-4">
              <button
                onClick={() => onNavigate("courses")}
                className="btn-primary min-h-12 px-6 bg-gradient-to-r from-lani-emerald to-lani-green hover:shadow-lg hover:shadow-lani-emerald/20 transition-all font-extrabold text-sm"
              >
                Explore Courses
                <ArrowRight size={16} />
              </button>
              <a
                href="#b2b-diagnostic"
                className="btn-secondary bg-white/10 border-white/20 text-white hover:bg-white/20 min-h-12 px-6 text-sm font-bold"
              >
                Request Consultation
              </a>
            </div>
          </div>

          {/* Floating Glassmorphic Stats Dashboard */}
          <div className="mt-12 lg:mt-0 relative">
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-tr from-lani-green/30 to-lani-blue/30 blur-2xl opacity-60 pointer-events-none" />
            
            <div className="relative rounded-2xl border border-white/10 bg-white/5 p-8 shadow-2xl backdrop-blur-md space-y-6">
              <div className="flex items-center justify-between border-b border-white/10 pb-4">
                <h3 className="font-bold text-white tracking-tight text-sm">LANI Live Ecosystem</h3>
                <span className="flex h-2.5 w-2.5 items-center justify-center rounded-full bg-lani-emerald/20">
                  <span className="h-1.5 w-1.5 rounded-full bg-lani-emerald animate-pulse" />
                </span>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-xl bg-white/5 border border-white/5 p-4">
                  <span className="text-[10px] uppercase font-bold text-slate-400">Total Trained</span>
                  <strong className="block text-2xl font-extrabold text-white mt-1">50,000+</strong>
                  <p className="text-[10px] text-lani-emerald mt-1 flex items-center gap-1 font-bold">
                    <TrendingUp size={10} /> +12% this quarter
                  </p>
                </div>
                <div className="rounded-xl bg-white/5 border border-white/5 p-4">
                  <span className="text-[10px] uppercase font-bold text-slate-400">Accredited Courses</span>
                  <strong className="block text-2xl font-extrabold text-white mt-1">45+</strong>
                  <p className="text-[10px] text-slate-400 mt-1">Across 8 disciplines</p>
                </div>
                <div className="rounded-xl bg-white/5 border border-white/5 p-4">
                  <span className="text-[10px] uppercase font-bold text-slate-400">Delivery Modes</span>
                  <strong className="block text-2xl font-extrabold text-white mt-1">Hybrid</strong>
                  <p className="text-[10px] text-slate-400 mt-1">In-plant, Online, physical</p>
                </div>
                <div className="rounded-xl bg-white/5 border border-white/5 p-4">
                  <span className="text-[10px] uppercase font-bold text-slate-400">Verify Speed</span>
                  <strong className="block text-2xl font-extrabold text-white mt-1">Instant</strong>
                  <p className="text-[10px] text-lani-gold mt-1 font-bold">Cryptographic QR verification</p>
                </div>
              </div>

              <div className="rounded-xl bg-gradient-to-r from-lani-green/20 to-lani-blue/20 p-4 border border-white/5 flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-white">Need custom team training?</h4>
                  <p className="text-[10px] text-slate-300 mt-0.5">Diagnose and align skills.</p>
                </div>
                <a href="#b2b-diagnostic" className="rounded-lg bg-white px-3 py-1.5 text-[10px] font-bold text-lani-navy hover:bg-slate-100 transition-all">
                  Request proposal
                </a>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* 2. PARTNERS STRIP */}
      <section className="bg-slate-50 border-y border-slate-200 py-10">
        <div className="mx-auto max-w-7xl px-4 text-center sm:px-6 lg:px-8">
          <p className="text-xs font-bold uppercase tracking-widest text-slate-400">
            Trusted by Leaders at Top-Tier Organizations
          </p>
          <div className="mt-8 grid grid-cols-2 gap-8 md:grid-cols-6 items-center opacity-65">
            <span className="text-md font-black tracking-tight text-slate-500 hover:text-slate-800 transition-colors">Northern Assurance</span>
            <span className="text-md font-black tracking-tight text-slate-500 hover:text-slate-800 transition-colors">Frontier Minerals</span>
            <span className="text-md font-black tracking-tight text-slate-500 hover:text-slate-800 transition-colors">Apex Bank Plc</span>
            <span className="text-md font-black tracking-tight text-slate-500 hover:text-slate-800 transition-colors">Vanguard Energy</span>
            <span className="text-md font-black tracking-tight text-slate-500 hover:text-slate-800 transition-colors">Omole Estates Co</span>
            <span className="text-md font-black tracking-tight text-slate-500 hover:text-slate-800 transition-colors">Kwara Dev Alliance</span>
          </div>
        </div>
      </section>

      {/* 3. FEATURED COURSES SECTION */}
      <section className="section bg-white">
        <div className="mb-12 flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <div className="text-left">
            <span className="eyebrow">Featured Learning</span>
            <h2 className="mt-3 text-3xl font-bold leading-tight text-lani-navy tracking-tight sm:text-4xl">
              High-Impact Open Programmes
            </h2>
            <p className="mt-2 text-slate-500 text-sm">
              Acquire verified competencies ready for career advancement.
            </p>
          </div>
          <button
            onClick={() => onNavigate("courses")}
            className="btn-ghost shrink-0 border border-slate-200/80 shadow-sm text-xs px-4 py-2 self-start md:self-auto"
          >
            View All Courses
            <ArrowRight size={14} />
          </button>
        </div>

        <div className="course-grid">
          {featuredCourses.map((course) => {
            const seatsLeft = Math.max(0, course.seats - course.enrolled);
            return (
              <article key={course.id} className="course-card">
                <div className="relative h-48 overflow-hidden bg-slate-100">
                  <img src={course.image} alt={course.title} className="h-full w-full object-cover" />
                  <span className="absolute left-3 top-3 rounded bg-white/95 px-2.5 py-1 text-[10px] font-bold text-lani-navy shadow uppercase">
                    {course.status}
                  </span>
                </div>
                <div className="flex flex-1 flex-col p-6 text-left">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-lani-blue">
                    {course.code}
                  </span>
                  <h3 className="mt-2.5 text-lg font-bold text-lani-navy leading-snug hover:text-lani-green transition-colors cursor-pointer" onClick={() => onOpenCourse(course)}>
                    {course.title}
                  </h3>
                  <p className="mt-2 flex-1 text-xs leading-6 text-slate-500">
                    {course.shortDescription}
                  </p>
                  <div className="mt-4 border-t border-slate-100 pt-4 flex items-center justify-between text-xs text-slate-600">
                    <div>
                      <strong className="block text-base text-lani-navy font-extrabold">
                        {formatMoney(course.price)}
                      </strong>
                      <span className="text-[10px] text-slate-400">
                        {course.seats ? `${seatsLeft} seats left` : "Quote Required"}
                      </span>
                    </div>
                    <button
                      onClick={() => onOpenCourse(course)}
                      className="btn-primary min-h-9 px-4 py-2 text-xs"
                    >
                      View Details
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      {/* 4. THEMATIC CAPACITY AREAS */}
      <section className="section bg-slate-50 border-t border-slate-150 rounded-2xl">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <span className="eyebrow">Comprehensive Coverage</span>
          <h2 className="mt-3 text-3xl font-bold text-lani-navy tracking-tight sm:text-4xl">
            8 Thematic Capacity Disciplines
          </h2>
          <p className="mt-2 text-slate-500 text-sm leading-6">
            Aligned with regulatory frameworks, financial guidelines, and commercial sector demands.
          </p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {thematicAreas.map((area) => (
            <div
              key={area.id}
              className="theme-card text-left glow-box border border-slate-200"
            >
              <div className="h-10 w-10 rounded-lg bg-lani-green/5 border border-lani-green/10 flex items-center justify-center text-lani-green">
                <Compass size={20} />
              </div>
              <h3 className="mt-4 text-base font-bold text-lani-navy">{area.name}</h3>
              <p className="mt-2 text-xs leading-5 text-slate-500 min-h-[4.5rem]">
                {area.summary}
              </p>
              <div className="mt-4 border-t border-slate-100 pt-3 text-[10px] font-bold text-slate-400">
                AUDIENCE: <span className="text-lani-blue">{area.audience}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 5. CAPACITY BUILDING LIFECYCLE (consultative stepper) */}
      <section className="section bg-white text-center">
        <div className="max-w-2xl mx-auto mb-16">
          <span className="eyebrow">LANI Process</span>
          <h2 className="mt-3 text-3xl font-bold text-lani-navy tracking-tight sm:text-4xl">
            B2B Capacity Building Lifecycle
          </h2>
          <p className="mt-2 text-slate-500 text-sm leading-6">
            Our systematic approach ensures corporate interventions translate directly into staff capability.
          </p>
        </div>

        {/* Stepper Nodes */}
        <div className="relative mt-12 grid gap-8 md:grid-cols-5 md:gap-4">
          {/* Connector Line (Desktop) */}
          <div className="absolute top-10 left-[10%] right-[10%] hidden h-0.5 border-t-2 border-dashed border-slate-200 md:block -z-10" />

          {[
            { step: "01", label: "Diagnose", desc: "Formulate baseline capabilities via skills gap diagnostic audits." },
            { step: "02", label: "Design", desc: "Craft custom curricula addressing client-specific standard procedures." },
            { step: "03", label: "Develop", desc: "Build multimedia learning assets and physical laboratory schedules." },
            { step: "04", label: "Deploy", desc: "Execute training via digital LMS streams and facilitated workshops." },
            { step: "05", label: "Document", desc: "Publish feedback analyses, verification credentials, and ROI audits." }
          ].map((item, idx) => (
            <div key={item.label} className="group relative flex flex-col items-center text-center p-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-lani-navy to-slate-800 text-white font-bold ring-4 ring-white shadow transition-all duration-300 group-hover:from-lani-green group-hover:to-lani-emerald">
                {item.step}
              </div>
              <h3 className="mt-4 text-base font-bold text-lani-navy">{item.label}</h3>
              <p className="mt-2 text-xs leading-5 text-slate-500 max-w-[14rem]">
                {item.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* 6. TESTIMONIALS (Timed Carousel) */}
      <section className="section bg-slate-50 border-t border-slate-200 rounded-2xl text-center max-w-5xl mx-auto my-12 p-10">
        <div className="max-w-3xl mx-auto flex flex-col justify-between text-center space-y-6">
          <div>
            <span className="eyebrow">Client Feedback</span>
            <h2 className="mt-3 text-3xl font-bold text-lani-navy tracking-tight">
              What Organizations Say About Us
            </h2>
            <p className="mt-2 text-sm text-slate-500">
              Read impact summaries from our HR enterprise clients.
            </p>

            <div className="mt-8 rounded-xl bg-white border border-slate-200 p-8 shadow-sm min-h-60 relative flex flex-col justify-between transition-all duration-500 transform hover:scale-[1.01]">
              <MessageSquare size={28} className="text-lani-gold opacity-30 absolute top-4 right-4" />
              <p className="text-sm italic text-slate-700 leading-7 font-medium">
                "{testimonials[activeTestimonial].quote}"
              </p>
              <div className="mt-8 flex items-center justify-center gap-3.5 border-t border-slate-100 pt-4">
                <div className="h-10 w-10 rounded-full bg-lani-green text-white font-bold flex items-center justify-center text-xs">
                  {testimonials[activeTestimonial].initials}
                </div>
                <div className="text-left">
                  <h4 className="text-xs font-bold text-lani-navy">
                    {testimonials[activeTestimonial].author}
                  </h4>
                  <p className="text-[10px] text-slate-400 font-semibold mt-0.5">
                    {testimonials[activeTestimonial].title}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Testimonial Select Dots */}
          <div className="flex justify-center gap-2">
            {testimonials.map((_, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setActiveTestimonial(idx)}
                className={`h-2.5 rounded-full transition-all ${
                  activeTestimonial === idx ? "w-6 bg-lani-green" : "w-2.5 bg-slate-300"
                }`}
                aria-label={`Show testimonial ${idx + 1}`}
              />
            ))}
          </div>
        </div>
      </section>

      {/* 7. B2B CONSULTATION DIAGNOSTIC CRM CAPTURE */}
      <section id="b2b-diagnostic" className="section bg-white text-left">
        <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr] items-center">
          
          <div className="space-y-6">
            <span className="eyebrow">Enterprise Form</span>
            <h2 className="text-3xl font-bold text-lani-navy tracking-tight sm:text-4xl">
              Request B2B Training Consultation
            </h2>
            <p className="text-sm leading-7 text-slate-500">
              Submit your training specifications. Our consulting office will formulate a custom capability proposal matching your organizational needs.
            </p>
            <div className="space-y-4 text-xs font-semibold text-slate-600">
              <div className="flex items-center gap-2">
                <CheckCircle size={16} className="text-lani-green" />
                <span>Audited within 48 business hours</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle size={16} className="text-lani-green" />
                <span>Custom curriculum aligned to internal audit standards</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle size={16} className="text-lani-green" />
                <span>Seamless integration with our enterprise digital LMS portal</span>
              </div>
            </div>
          </div>

          {/* Form */}
          <div className="form-panel shadow-lg border border-slate-200">
            {leadSubmitted ? (
              <div className="py-12 text-center space-y-4">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-lani-green/10 text-lani-green">
                  <CheckCircle size={28} />
                </div>
                <h3 className="text-lg font-bold text-lani-navy">Proposal Request Logged</h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto leading-6">
                  Thank you. Your consultation requirements have been saved to the database. An academic coordinator will reach out shortly.
                </p>
                <button
                  type="button"
                  onClick={() => setLeadSubmitted(false)}
                  className="btn-secondary text-xs px-4"
                >
                  Submit Another Request
                </button>
              </div>
            ) : (
              <form onSubmit={handleLeadSubmit} className="grid gap-4 sm:grid-cols-2">
                <label className="form-field">
                  Organisation Name
                  <input name="organisation" required placeholder="e.g. Northern Assurance" />
                </label>
                <label className="form-field">
                  Sector / Industry
                  <select name="sector">
                    <option>Financial Services</option>
                    <option>Energy & Minerals</option>
                    <option>Public Administration</option>
                    <option>Agriculture & Biotech</option>
                    <option>Technology & Products</option>
                    <option>Other Services</option>
                  </select>
                </label>
                <label className="form-field">
                  Contact Person Name
                  <input name="contactName" required placeholder="e.g. Hauwa Ibrahim" />
                </label>
                <label className="form-field">
                  Corporate Email
                  <input name="email" type="email" required placeholder="e.g. h.ibrahim@company.com" />
                </label>
                <label className="form-field">
                  Phone Number
                  <input name="phone" placeholder="+234..." />
                </label>
                <label className="form-field">
                  Thematic Focus
                  <select name="thematicArea">
                    {thematicAreas.map((area) => (
                      <option key={area.id} value={area.name}>
                        {area.name}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="form-field">
                  Approx. Participants
                  <input name="participants" type="number" defaultValue={20} required />
                </label>
                <label className="form-field">
                  Preferred Delivery
                  <select name="deliveryMode">
                    <option value="Hybrid">Hybrid (Classroom + LMS)</option>
                    <option value="In-plant">In-plant (Physical)</option>
                    <option value="Virtual">Virtual Interactive</option>
                    <option value="Self-paced">Self-paced Digital</option>
                  </select>
                </label>
                <label className="form-field sm:col-span-2">
                  Target Date
                  <input name="preferredDate" type="date" required />
                </label>
                <label className="form-field sm:col-span-2">
                  Key Skills Needed / Specific Challenge
                  <textarea
                    name="need"
                    required
                    rows={3}
                    placeholder="Describe specific team competencies or compliance objectives you wish to address..."
                  />
                </label>
                <div className="sm:col-span-2 mt-2">
                  <button
                    type="submit"
                    disabled={submittingLead}
                    className="btn-primary w-full justify-center text-sm font-extrabold"
                  >
                    {submittingLead ? "Submitting requirements..." : "Log Consultation Request"}
                  </button>
                </div>
              </form>
            )}
          </div>

        </div>
      </section>

      {/* 8. FAQs (Right above Footer) */}
      <section className="section bg-slate-50 border-t border-slate-200 rounded-2xl max-w-5xl mx-auto my-12 p-10 text-left">
        <div className="max-w-3xl mx-auto space-y-6">
          <div className="text-center">
            <span className="eyebrow">Learning Support</span>
            <h2 className="mt-3 text-3xl font-bold text-lani-navy tracking-tight">
              Frequently Asked Questions
            </h2>
          </div>

          <div className="grid gap-3 mt-8">
            {faqs.map((faq, idx) => {
              const isOpen = activeFaq === idx;
              return (
                <div
                  key={faq.question}
                  className="rounded-xl border border-slate-200 bg-white overflow-hidden transition-all shadow-sm"
                >
                  <button
                    type="button"
                    onClick={() => setActiveFaq(isOpen ? null : idx)}
                    className="flex w-full items-center justify-between p-5 text-left text-sm font-bold text-lani-navy focus:outline-none"
                  >
                    <span>{faq.question}</span>
                    <HelpCircle size={16} className={`text-slate-400 transition-transform ${isOpen ? "rotate-180 text-lani-green" : ""}`} />
                  </button>
                  {isOpen && (
                    <div className="px-5 pb-5 text-xs leading-6 text-slate-500 border-t border-slate-50 pt-3 bg-slate-50/50">
                      {faq.answer}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>
    </div>
  );
}
