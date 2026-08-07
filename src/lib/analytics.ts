// Lightweight analytics init — Google Analytics 4 + Microsoft Clarity.
// Both are optional and only load when the matching env var is set.

declare global {
  interface Window {
    dataLayer?: any[];
    gtag?: (...args: any[]) => void;
    clarity?: (...args: any[]) => void;
  }
}

const GA_ID = import.meta.env.VITE_GA_ID as string | undefined;
const CLARITY_ID = import.meta.env.VITE_CLARITY_ID as string | undefined;

export function initAnalytics() {
  if (GA_ID) {
    const s = document.createElement("script");
    s.async = true;
    s.src = `https://www.googletagmanager.com/gtag/js?id=${GA_ID}`;
    document.head.appendChild(s);
    window.dataLayer = window.dataLayer || [];
    window.gtag = function gtag() { window.dataLayer!.push(arguments); };
    window.gtag("js", new Date());
    window.gtag("config", GA_ID);
  }

  if (CLARITY_ID) {
    (function (c: any, l: any, a: any, r: any, i: any) {
      c[a] = c[a] || function () { (c[a].q = c[a].q || []).push(arguments); };
      const t = l.createElement(r); t.async = 1; t.src = "https://www.clarity.ms/tag/" + i;
      const y = l.getElementsByTagName(r)[0]; y.parentNode.insertBefore(t, y);
    })(window, document, "clarity", "script", CLARITY_ID);
  }
}

export function trackPage(path: string, title?: string) {
  if (GA_ID && window.gtag) {
    window.gtag("event", "page_view", { page_path: path, page_title: title });
  }
}
