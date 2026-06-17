import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { Member } from "../model/types";
import { MemberSwitcher } from "./MemberSwitcher";

const members: Member[] = [
  { id: "m1", name: "Олена" },
  { id: "m2", name: "Богдан" },
];

describe("MemberSwitcher", () => {
  it("renders a labelled option per member and reflects the current selection", () => {
    render(
      <MemberSwitcher
        members={members}
        currentMemberId="m2"
        onSelect={() => {}}
      />,
    );
    const select = screen.getByRole("combobox", { name: /я —/i });
    expect(select).toHaveValue("m2");
    expect(screen.getByRole("option", { name: "Олена" })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "Богдан" })).toBeInTheDocument();
  });

  it("reports the chosen member id", () => {
    const onSelect = vi.fn();
    render(
      <MemberSwitcher
        members={members}
        currentMemberId={null}
        onSelect={onSelect}
      />,
    );
    fireEvent.change(screen.getByRole("combobox"), {
      target: { value: "m1" },
    });
    expect(onSelect).toHaveBeenCalledWith("m1");
  });

  it("maps the placeholder option back to null", () => {
    const onSelect = vi.fn();
    render(
      <MemberSwitcher
        members={members}
        currentMemberId="m1"
        onSelect={onSelect}
      />,
    );
    fireEvent.change(screen.getByRole("combobox"), { target: { value: "" } });
    expect(onSelect).toHaveBeenCalledWith(null);
  });
});
