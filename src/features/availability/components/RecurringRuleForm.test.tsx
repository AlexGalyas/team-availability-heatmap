import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { RecurringRuleForm } from "./RecurringRuleForm";

describe("RecurringRuleForm", () => {
  it("submits a valid rule (local coordinates)", async () => {
    const onApply = vi.fn();
    render(<RecurringRuleForm onApply={onApply} status="idle" />);

    fireEvent.change(screen.getByLabelText("По"), { target: { value: "12" } });
    fireEvent.click(screen.getByRole("button", { name: /застосувати правило/i }));

    await waitFor(() =>
      expect(onApply).toHaveBeenCalledWith({
        weekday: 1,
        startHour: 8,
        endHour: 12,
      }),
    );
  });

  it("blocks submit and shows a field error for an inverted range", async () => {
    const onApply = vi.fn();
    render(<RecurringRuleForm onApply={onApply} status="idle" />);

    fireEvent.change(screen.getByLabelText("З"), { target: { value: "10" } });
    fireEvent.change(screen.getByLabelText("По"), { target: { value: "9" } });
    fireEvent.click(screen.getByRole("button", { name: /застосувати правило/i }));

    expect(
      await screen.findByText("Кінець має бути пізніше за початок"),
    ).toBeInTheDocument();
    expect(onApply).not.toHaveBeenCalled();
    expect(screen.getByLabelText("По")).toHaveAttribute("aria-invalid", "true");
  });

  it("disables the button while pending and confirms on success", () => {
    const { rerender } = render(
      <RecurringRuleForm onApply={() => {}} status="pending" />,
    );
    expect(
      screen.getByRole("button", { name: /застосовуємо/i }),
    ).toBeDisabled();

    rerender(<RecurringRuleForm onApply={() => {}} status="success" />);
    expect(screen.getByText("Правило застосовано.")).toBeInTheDocument();
  });

  it("surfaces an apply error", () => {
    render(<RecurringRuleForm onApply={() => {}} status="error" />);
    expect(screen.getByRole("alert")).toHaveTextContent(
      /не вдалося застосувати/i,
    );
  });
});
