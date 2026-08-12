import { describe, it, expect } from "vitest";
import {
  paymentConfirmationEmail,
  certificateReadyEmail,
  broadcastEmail,
  assignmentDeadlineEmail,
  quizDeadlineEmail,
} from "../lib/emailTemplates";

describe("Email Templates (src/lib/emailTemplates.ts)", () => {
  describe("paymentConfirmationEmail", () => {
    it("should generate HTML and subject for bank transfer payments (pending = true)", () => {
      const email = paymentConfirmationEmail(
        "Adewale",
        "Full-Stack Web Development",
        "₦150,000",
        "LANI-BT-9918",
        true // pending
      );

      expect(email.subject).toBe("We received your enrolment for Full-Stack Web Development");
      expect(email.html).toContain("Adewale");
      expect(email.html).toContain("Full-Stack Web Development");
      expect(email.html).toContain("Pending confirmation");
    });

    it("should generate HTML for immediate successful payments (pending = false)", () => {
      const email = paymentConfirmationEmail(
        "Jane Doe",
        "Data Science Foundations",
        "₦200,000",
        "PAY-88219",
        false // pending
      );

      expect(email.subject).toBe("Payment confirmed — Data Science Foundations");
      expect(email.html).toContain("Jane Doe");
      expect(email.html).toContain("PAY-88219");
      expect(email.html).toContain("Enrolment active");
    });
  });

  describe("assignmentDeadlineEmail", () => {
    it("should generate HTML and subject for assignment deadline reminder", () => {
      const email = assignmentDeadlineEmail("Adewale", "Final Project", "Web Dev", "2026-10-10T23:59");
      expect(email.subject).toBe("Action Required: Assignment Due Soon — Final Project");
      expect(email.html).toContain("Adewale");
      expect(email.html).toContain("Final Project");
      expect(email.html).toContain("2026-10-10T23:59");
      expect(email.html).toContain("Action Required");
    });
  });

  describe("quizDeadlineEmail", () => {
    it("should generate HTML and subject for quiz deadline reminder", () => {
      const email = quizDeadlineEmail("Jane", "Midterm", "Data Science", "2026-10-12T12:00");
      expect(email.subject).toBe("Action Required: Quiz Closing Soon — Midterm");
      expect(email.html).toContain("Jane");
      expect(email.html).toContain("Midterm");
      expect(email.html).toContain("2026-10-12T12:00");
      expect(email.html).toContain("Action Required");
    });
  });

  describe("certificateReadyEmail", () => {
    it("should generate certificate email with certificate ID link", () => {
      const email = certificateReadyEmail("Adewale", "Cybersecurity Specialist", "CERT-2026-001");
      expect(email.subject).toBe("Your certificate for Cybersecurity Specialist is ready");
      expect(email.html).toContain("CERT-2026-001");
    });
  });

  describe("broadcastEmail", () => {
    it("should wrap custom broadcast messages in branded LANI email container", () => {
      const email = broadcastEmail("Important Update", "Class starts at 10 AM.");
      expect(email.subject).toBe("Important Update");
      expect(email.html).toContain("Class starts at 10 AM.");
      expect(email.html).toContain("LANI");
    });
  });
});
