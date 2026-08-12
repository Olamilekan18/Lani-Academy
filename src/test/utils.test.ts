import { describe, it, expect } from "vitest";
import { formatMoney, formatDate } from "../lib/utils";

describe("Utility Functions (src/lib/utils.ts)", () => {
  describe("formatMoney", () => {
    it("should format positive number as Nigerian Naira (NGN)", () => {
      const result = formatMoney(150000);
      expect(result).toContain("150,000");
      expect(result).toMatch(/₦|NGN/);
    });

    it("should return 'Quote Required' for 0 or NaN inputs", () => {
      expect(formatMoney(0)).toBe("Quote Required");
      expect(formatMoney(NaN)).toBe("Quote Required");
    });
  });

  describe("formatDate", () => {
    it("should format valid ISO date strings", () => {
      const formatted = formatDate("2026-08-10");
      expect(formatted).toContain("Aug");
      expect(formatted).toContain("10");
      expect(formatted).toContain("2026");
    });

    it("should return empty string for empty input", () => {
      expect(formatDate("")).toBe("");
    });

    it("should return raw string if date is unparseable", () => {
      expect(formatDate("invalid-date-string")).toBe("invalid-date-string");
    });
  });
});
