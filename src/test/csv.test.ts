import { describe, it, expect, vi } from "vitest";
import { toCSV, downloadCSV } from "../lib/csv";

describe("CSV Export Helpers (src/lib/csv.ts)", () => {
  const sampleData = [
    { id: "1", name: "John Doe", amount: 50000, notes: "Paid via Transfer" },
    { id: "2", name: "Jane Smith", amount: 75000, notes: 'Quote "Approved"' },
  ];

  const columns = [
    { header: "ID", value: (r: typeof sampleData[0]) => r.id },
    { header: "Full Name", value: (r: typeof sampleData[0]) => r.name },
    { header: "Amount", value: (r: typeof sampleData[0]) => r.amount },
    { header: "Notes", value: (r: typeof sampleData[0]) => r.notes },
  ];

  describe("toCSV", () => {
    it("should format objects into valid CSV string with double-quote escaping", () => {
      const csv = toCSV(sampleData, columns);
      expect(csv).toContain("ID,Full Name,Amount,Notes");
      expect(csv).toContain("1,John Doe,50000,Paid via Transfer");
      expect(csv).toContain('2,Jane Smith,75000,"Quote ""Approved"""');
    });
  });

  describe("downloadCSV", () => {
    it("should create blob URL and trigger anchor download click", () => {
      const createElementSpy = vi.spyOn(document, "createElement");
      const appendChildSpy = vi.spyOn(document.body, "appendChild").mockImplementation((node) => node);
      const removeChildSpy = vi.spyOn(document.body, "removeChild").mockImplementation((node) => node);

      global.URL.createObjectURL = vi.fn(() => "blob:http://localhost/test-url");
      global.URL.revokeObjectURL = vi.fn();

      downloadCSV("export.csv", sampleData, columns);

      expect(createElementSpy).toHaveBeenCalledWith("a");
      expect(appendChildSpy).toHaveBeenCalled();
      expect(removeChildSpy).toHaveBeenCalled();
      expect(global.URL.createObjectURL).toHaveBeenCalled();
      expect(global.URL.revokeObjectURL).toHaveBeenCalled();
    });
  });
});
