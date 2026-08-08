// Tiny dependency-free CSV export helper (client-side only).

type Column<T> = { header: string; value: (row: T) => unknown };

// RFC-4180-ish escaping: wrap in quotes and double any embedded quotes.
function escapeCell(v: unknown): string {
  if (v === null || v === undefined) return "";
  const s = String(v);
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

export function toCSV<T>(rows: T[], columns: Column<T>[]): string {
  const head = columns.map((c) => escapeCell(c.header)).join(",");
  const body = rows.map((r) => columns.map((c) => escapeCell(c.value(r))).join(",")).join("\n");
  return `${head}\n${body}`;
}

// Trigger a browser download of a CSV string.
export function downloadCSV<T>(filename: string, rows: T[], columns: Column<T>[]): void {
  const csv = toCSV(rows, columns);
  // Prepend BOM so Excel opens UTF-8 correctly.
  const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename.endsWith(".csv") ? filename : `${filename}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
