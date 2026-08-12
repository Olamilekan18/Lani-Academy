import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import Navbar from "../components/Navbar";

// Mock AuthContext
vi.mock("../contexts/AuthContext", () => ({
  useAuth: () => ({
    user: { id: "user-1", email: "learner@example.com" },
    profile: { full_name: "Adewale Learner", role: "learner" },
    signOut: vi.fn().mockResolvedValue(undefined),
  }),
}));

describe("Navbar Component (src/components/Navbar.tsx)", () => {
  const defaultProps = {
    currentView: "home" as const,
    onNavigate: vi.fn(),
  };

  it("renders LANI Academy branding logo and learner navigation items", () => {
    render(<Navbar {...defaultProps} />);

    expect(screen.getByText("LANI")).toBeInTheDocument();
    expect(screen.getByText("Academy")).toBeInTheDocument();
    expect(screen.getByText("My Learning")).toBeInTheDocument();
    expect(screen.getByText("Courses")).toBeInTheDocument();
    expect(screen.getByText("Certification")).toBeInTheDocument();
  });

  it("triggers onNavigate when a navigation link is clicked", () => {
    const onNavigateMock = vi.fn();
    render(<Navbar currentView="home" onNavigate={onNavigateMock} />);

    const coursesLink = screen.getByText("Courses");
    fireEvent.click(coursesLink);

    expect(onNavigateMock).toHaveBeenCalledWith("courses");
  });
});
