import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";

// Bare smoke test: proves Vitest + React Testing Library + jsdom are wired up.
describe("test harness", () => {
  it("renders a component with React Testing Library", () => {
    render(<h1>Team Availability</h1>);
    expect(
      screen.getByRole("heading", { name: "Team Availability" }),
    ).toBeInTheDocument();
  });
});
