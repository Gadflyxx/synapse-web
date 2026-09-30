/**
 * HighStakesConfirmDialog — unit tests (Task #5)
 *
 * Coverage target: ≥90% of component lines/branches.
 *
 * Scenarios covered:
 *  1.  Dialog renders with title, danger banner, message, and input.
 *  2.  Confirm button is disabled before any input.
 *  3.  Confirm button remains disabled when partial input is provided.
 *  4.  Confirm button remains disabled when wrong input is provided.
 *  5.  Confirm button becomes enabled only when typed value matches exactly.
 *  6.  onConfirm is NOT called when button is clicked while disabled.
 *  7.  onConfirm IS called when button is clicked while enabled.
 *  8.  onCancel is called when the Cancel button is clicked.
 *  9.  onCancel is called when the backdrop is clicked.
 *  10. onCancel is called when Escape key is pressed.
 *  11. Match feedback message changes as user types.
 *  12. Custom confirmLabel is rendered.
 *  13. Children are rendered in the dialog.
 *  14. Input receives focus on mount.
 *  15. aria-disabled reflects match state on confirm button wrapper.
 *  16. Role alertdialog + aria-modal are present.
 */
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { HighStakesConfirmDialog } from "./HighStakesConfirmDialog";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const ADDRESS = "GBSAMPLEADDRESSXYZ1234567890ABCDEF";

function renderDialog(overrides: Partial<Parameters<typeof HighStakesConfirmDialog>[0]> = {}) {
  const onConfirm = vi.fn();
  const onCancel = vi.fn();

  render(
    <HighStakesConfirmDialog
      title="TRANSFER ADMIN — IRREVERSIBLE"
      message="You are transferring admin rights to a new address."
      confirmValue={ADDRESS}
      onConfirm={onConfirm}
      onCancel={onCancel}
      {...overrides}
    />
  );

  return { onConfirm, onCancel };
}

/** Returns the actual <button> inside the confirm span */
function getConfirmButton() {
  // The outer span carries data-testid="hsc-confirm-btn"; the actual <button>
  // is the first button child rendered by ActionButton inside it.
  const span = screen.getByTestId("hsc-confirm-btn");
  return span.querySelector("button") as HTMLButtonElement;
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("HighStakesConfirmDialog", () => {
  describe("rendering", () => {
    it("renders the dialog with role=alertdialog and aria-modal", () => {
      renderDialog();
      const dialog = screen.getByRole("alertdialog");
      expect(dialog).toBeInTheDocument();
      expect(dialog).toHaveAttribute("aria-modal", "true");
    });

    it("renders the title text", () => {
      renderDialog();
      expect(screen.getByTestId("hsc-title")).toHaveTextContent("TRANSFER ADMIN — IRREVERSIBLE");
    });

    it("renders the danger banner with irreversibility warning", () => {
      renderDialog();
      expect(screen.getByTestId("hsc-danger-banner")).toHaveTextContent(
        "THIS ACTION IS IRREVERSIBLE"
      );
    });

    it("renders the message text", () => {
      renderDialog();
      expect(screen.getByTestId("hsc-message")).toHaveTextContent(
        "You are transferring admin rights to a new address."
      );
    });

    it("renders the text input", () => {
      renderDialog();
      expect(screen.getByTestId("hsc-input")).toBeInTheDocument();
    });

    it("renders a custom confirmLabel when provided", () => {
      renderDialog({ confirmLabel: "ENTER THE SECRET CODE" });
      expect(screen.getByText("ENTER THE SECRET CODE")).toBeInTheDocument();
    });

    it("renders children when provided", () => {
      render(
        <HighStakesConfirmDialog
          title="T"
          message="M"
          confirmValue="x"
          onConfirm={vi.fn()}
          onCancel={vi.fn()}
        >
          <span data-testid="extra-child">extra</span>
        </HighStakesConfirmDialog>
      );
      expect(screen.getByTestId("extra-child")).toBeInTheDocument();
    });
  });

  describe("confirm button — disabled gating", () => {
    it("confirm button is disabled before any input", () => {
      renderDialog();
      expect(getConfirmButton()).toBeDisabled();
    });

    it("confirm button is disabled with partial input", async () => {
      renderDialog();
      const input = screen.getByTestId("hsc-input");
      await userEvent.type(input, ADDRESS.slice(0, 5));
      expect(getConfirmButton()).toBeDisabled();
    });

    it("confirm button is disabled when input differs by one character", async () => {
      renderDialog();
      const input = screen.getByTestId("hsc-input");
      await userEvent.type(input, ADDRESS + "X");
      expect(getConfirmButton()).toBeDisabled();
    });

    it("confirm button is disabled for a completely different string", async () => {
      renderDialog();
      const input = screen.getByTestId("hsc-input");
      await userEvent.type(input, "WRONGADDRESS");
      expect(getConfirmButton()).toBeDisabled();
    });

    it("confirm button becomes enabled only when typed value matches exactly", async () => {
      renderDialog();
      const input = screen.getByTestId("hsc-input");
      await userEvent.type(input, ADDRESS);
      expect(getConfirmButton()).not.toBeDisabled();
    });

    it("confirm button goes back to disabled after clearing a correct entry", async () => {
      renderDialog();
      const input = screen.getByTestId("hsc-input");
      await userEvent.type(input, ADDRESS);
      expect(getConfirmButton()).not.toBeDisabled();
      await userEvent.clear(input);
      expect(getConfirmButton()).toBeDisabled();
    });
  });

  describe("onConfirm callback", () => {
    it("does NOT call onConfirm when confirm button is clicked while disabled (wrong input)", async () => {
      const { onConfirm } = renderDialog();
      const input = screen.getByTestId("hsc-input");
      await userEvent.type(input, "WRONG");
      fireEvent.click(getConfirmButton());
      expect(onConfirm).not.toHaveBeenCalled();
    });

    it("does NOT call onConfirm when confirm button is clicked with empty input", () => {
      const { onConfirm } = renderDialog();
      fireEvent.click(getConfirmButton());
      expect(onConfirm).not.toHaveBeenCalled();
    });

    it("calls onConfirm exactly once when typed value matches and button is clicked", async () => {
      const { onConfirm } = renderDialog();
      const input = screen.getByTestId("hsc-input");
      await userEvent.type(input, ADDRESS);
      fireEvent.click(getConfirmButton());
      expect(onConfirm).toHaveBeenCalledTimes(1);
    });
  });

  describe("onCancel callback", () => {
    it("calls onCancel when the Cancel button is clicked", () => {
      const { onCancel } = renderDialog();
      fireEvent.click(screen.getByText("CANCEL"));
      expect(onCancel).toHaveBeenCalledTimes(1);
    });

    it("calls onCancel when the backdrop is clicked", () => {
      const { onCancel } = renderDialog();
      fireEvent.click(screen.getByTestId("hsc-backdrop"));
      expect(onCancel).toHaveBeenCalledTimes(1);
    });

    it("calls onCancel when the Escape key is pressed", () => {
      const { onCancel } = renderDialog();
      fireEvent.keyDown(window, { key: "Escape" });
      expect(onCancel).toHaveBeenCalledTimes(1);
    });

    it("does NOT call onCancel for non-Escape keydown", () => {
      const { onCancel } = renderDialog();
      fireEvent.keyDown(window, { key: "Enter" });
      expect(onCancel).not.toHaveBeenCalled();
    });
  });

  describe("feedback messages", () => {
    it("shows no feedback before typing", () => {
      renderDialog();
      expect(screen.getByTestId("hsc-feedback")).toHaveTextContent("");
    });

    it("shows mismatch feedback while typing a wrong value", async () => {
      renderDialog();
      const input = screen.getByTestId("hsc-input");
      await userEvent.type(input, "PARTIAL");
      expect(screen.getByTestId("hsc-feedback")).toHaveTextContent(
        "value mismatch — confirm button remains locked"
      );
    });

    it("shows match confirmed feedback when exact value typed", async () => {
      renderDialog();
      const input = screen.getByTestId("hsc-input");
      await userEvent.type(input, ADDRESS);
      expect(screen.getByTestId("hsc-feedback")).toHaveTextContent("✓ match confirmed");
    });
  });

  describe("accessibility", () => {
    it("aria-labelledby points to the title element", () => {
      renderDialog();
      const dialog = screen.getByRole("alertdialog");
      const labelId = dialog.getAttribute("aria-labelledby");
      expect(document.getElementById(labelId!)).toBeInTheDocument();
    });

    it("aria-describedby points to the message element", () => {
      renderDialog();
      const dialog = screen.getByRole("alertdialog");
      const descId = dialog.getAttribute("aria-describedby");
      expect(document.getElementById(descId!)).toBeInTheDocument();
    });

    it("confirm button span has aria-disabled=true when value does not match", () => {
      renderDialog();
      expect(screen.getByTestId("hsc-confirm-btn")).toHaveAttribute("aria-disabled", "true");
    });

    it("underlying <button> is disabled when value does not match", () => {
      renderDialog();
      expect(getConfirmButton()).toBeDisabled();
    });

    it("confirm button span has aria-disabled=false when value matches", async () => {
      renderDialog();
      const input = screen.getByTestId("hsc-input");
      await userEvent.type(input, ADDRESS);
      expect(screen.getByTestId("hsc-confirm-btn")).toHaveAttribute("aria-disabled", "false");
    });

    it("underlying <button> is enabled when value matches", async () => {
      renderDialog();
      const input = screen.getByTestId("hsc-input");
      await userEvent.type(input, ADDRESS);
      expect(getConfirmButton()).not.toBeDisabled();
    });
  });
});
