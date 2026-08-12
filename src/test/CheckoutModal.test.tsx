import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import CheckoutModal from "../components/CheckoutModal";
import type { Course } from "../lib/types";

// Mock dbValidatePromo
vi.mock("../lib/db", async () => {
  const actual = await vi.importActual("../lib/db");
  return {
    ...actual,
    dbValidatePromo: vi.fn().mockImplementation((code: string) => {
      if (code === "LANI20") {
        return Promise.resolve({ id: "p1", code: "LANI20", discountPercent: 20, active: true });
      }
      return Promise.resolve(null);
    }),
  };
});

const mockCourse: Course = {
  id: "course-1",
  title: "Executive Leadership Masterclass",
  code: "ELM-101",
  category: "Leadership",
  thematicArea: "Management",
  type: "Open Programme",
  level: "Executive",
  deliveryModes: ["Virtual"],
  duration: "4 Weeks",
  price: 250000,
  certification: "Certificate of Completion",
  status: "Open",
  startDate: "2026-09-01",
  endDate: "2026-09-30",
  image: "https://example.com/image.jpg",
  shortDescription: "Master executive leadership skills.",
  fullDescription: "Full course description here.",
  outcomes: ["Strategic Thinking", "Team Management"],
  audience: ["Executives", "Directors"],
  modules: [],
  facilitator: "Dr. Smith",
  materials: [],
  assessment: "Final Capstone",
  seats: 30,
  enrolled: 5,
  featured: true,
};

describe("CheckoutModal Component (src/components/CheckoutModal.tsx)", () => {
  const defaultProps = {
    course: mockCourse,
    learnerEmail: "learner@example.com",
    learnerName: "Adewale Learner",
    onClose: vi.fn(),
    onPaymentComplete: vi.fn().mockResolvedValue(undefined),
  };

  it("renders course details and total price initially", () => {
    render(<CheckoutModal {...defaultProps} />);

    expect(screen.getByText("Secure Checkout")).toBeInTheDocument();
    expect(screen.getByText("ELM-101 — Executive Leadership Masterclass")).toBeInTheDocument();
    expect(screen.getByText("₦250,000")).toBeInTheDocument();
  });

  it("applies promo code discount when valid code is entered", async () => {
    render(<CheckoutModal {...defaultProps} />);

    const promoInput = screen.getByPlaceholderText("Enter code");
    fireEvent.change(promoInput, { target: { value: "LANI20" } });

    const applyBtn = screen.getByText("Apply");
    fireEvent.click(applyBtn);

    expect(await screen.findByText(/20% discount applied/i)).toBeInTheDocument();
    // 250,000 - 20% = 200,000
    expect(screen.getByText("₦200,000")).toBeInTheDocument();
  });

  it("switches to Bank Transfer option and proceeds to bank details step", () => {
    render(<CheckoutModal {...defaultProps} />);

    // Select Bank Transfer option
    const bankTransferBtn = screen.getByText("Bank Transfer");
    fireEvent.click(bankTransferBtn);

    // Click Continue to step 2 (Payment / Proof input)
    const continueBtn = screen.getByText("Continue");
    fireEvent.click(continueBtn);

    // Verify Bank account details are displayed
    expect(screen.getByText("Access Bank Plc")).toBeInTheDocument();
    expect(screen.getByText("LANI Group Academy")).toBeInTheDocument();
    expect(screen.getByText("101-202-3034")).toBeInTheDocument();

    // Verify input fields for transfer proof
    expect(screen.getByPlaceholderText("Name on the sending account")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("e.g. GTBank, First Bank")).toBeInTheDocument();
  });
});
