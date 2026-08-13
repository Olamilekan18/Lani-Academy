export function formatMoney(amount: number): string {
  if (amount === 0 || isNaN(amount)) {
    return "Quote Required";
  }
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Ensure a user-entered URL is treated as an absolute external link.
 * Without a scheme, the browser resolves "meet.google.com/x" relative to the
 * current origin (e.g. myapp.com/meet.google.com/x). This prepends https://
 * when no scheme is present so join/meeting links open the real destination.
 */
export function externalUrl(url?: string | null): string {
  if (!url) return "";
  const trimmed = url.trim();
  if (!trimmed) return "";
  if (/^[a-z][a-z0-9+.-]*:\/\//i.test(trimmed)) return trimmed; // http://, https://, etc.
  if (/^(mailto:|tel:)/i.test(trimmed)) return trimmed;
  if (trimmed.startsWith("//")) return "https:" + trimmed;
  return "https://" + trimmed.replace(/^\/+/, "");
}

export function formatDate(dateStr: string): string {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return dateStr;
  return date.toLocaleDateString("en-NG", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}
