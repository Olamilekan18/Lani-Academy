import { describe, it, expect } from "vitest";
import { toSnakeCaseKeys, toCamelCaseKeys, dbUploadFile } from "../lib/db";

describe("Database Helpers & Security Validation", () => {
  describe("Object Key Mapping Utilities", () => {
    it("should recursively convert camelCase keys to snake_case", () => {
      const input = {
        courseId: "course-123",
        learnerEmail: "learner@example.com",
        bankMeta: {
          depositorName: "Adewale",
          sourceBank: "GTBank",
        },
      };

      const result = toSnakeCaseKeys(input);
      expect(result).toEqual({
        course_id: "course-123",
        learner_email: "learner@example.com",
        bank_meta: {
          depositor_name: "Adewale",
          source_bank: "GTBank",
        },
      });
    });

    it("should recursively convert snake_case keys to camelCase", () => {
      const input = {
        course_id: "course-123",
        learner_email: "learner@example.com",
        payment_status: "Successful",
        transfer_reference: "REF12345",
      };

      const result = toCamelCaseKeys(input);
      expect(result).toEqual({
        courseId: "course-123",
        learnerEmail: "learner@example.com",
        paymentStatus: "Successful",
        transferReference: "REF12345",
      });
    });
  });

  describe("dbUploadFile Security Validation", () => {
    it("should block uploads with dangerous script or executable file extensions", async () => {
      const dangerousFiles = [
        new File(["<script>alert(1)</script>"], "hack.html", { type: "text/html" }),
        new File(["<svg onload=alert(1)>"], "badge.svg", { type: "image/svg+xml" }),
        new File(["console.log('xss')"], "payload.js", { type: "text/javascript" }),
        new File(["<?php echo 'hi'; ?>"], "shell.php", { type: "application/x-httpd-php" }),
        new File(["rm -rf /"], "script.sh", { type: "application/x-sh" }),
      ];

      for (const file of dangerousFiles) {
        const url = await dbUploadFile(file, "receipts");
        expect(url).toBeNull();
      }
    });

    it("should block uploads when file type doesn't match allowedTypes filter", async () => {
      const txtFile = new File(["some text"], "notes.txt", { type: "text/plain" });
      const url = await dbUploadFile(txtFile, "receipts", ["image/*", "application/pdf"]);
      expect(url).toBeNull();
    });
  });
});
