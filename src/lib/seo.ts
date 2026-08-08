// Per-page SEO: set the document title and meta description.

const BASE_TITLE = "LANI Academy";
const DEFAULT_DESC =
  "LANI Academy — build future-ready capability with open programmes, corporate training, certification and digital learning across high-impact sectors.";

// Map a route path to its title + description.
const ROUTES: Record<string, { title: string; description: string }> = {
  "/": { title: "Integrated Learning & Training Marketplace", description: DEFAULT_DESC },
  "/courses": { title: "Course Marketplace", description: "Browse and enrol in open programmes across eight thematic academies." },
  "/pathways": { title: "Learning Pathways", description: "Curated sequences of courses that build role-ready skills step by step." },
  "/certification": { title: "Certification Programmes", description: "Professional certification preparation with verifiable digital certificates." },
  "/calendar": { title: "Training Calendar", description: "Upcoming open programmes and scheduled live sessions." },
  "/corporate": { title: "Corporate Training", description: "Custom in-plant, hybrid and executive training for organisations." },
  "/applications": { title: "Scholarships & Applications", description: "Apply for sponsored bootcamps and cohort programmes." },
  "/resources": { title: "Resources", description: "Brochures, guides and insights from the LANI Academy faculty." },
  "/about": { title: "About", description: "The human capital development engine of LANI Consulting." },
  "/contact": { title: "Contact", description: "Get in touch or request a training proposal." },
  "/verify": { title: "Verify a Certificate", description: "Confirm the authenticity of a LANI Academy certificate." },
};

export function applySeo(path: string) {
  const match =
    ROUTES[path] ||
    ROUTES[Object.keys(ROUTES).find((p) => p !== "/" && path.startsWith(p)) || "/"] ||
    { title: BASE_TITLE, description: DEFAULT_DESC };

  document.title = `${match.title} — ${BASE_TITLE}`;

  let tag = document.querySelector('meta[name="description"]');
  if (!tag) {
    tag = document.createElement("meta");
    tag.setAttribute("name", "description");
    document.head.appendChild(tag);
  }
  tag.setAttribute("content", match.description);
  return match.title;
}
