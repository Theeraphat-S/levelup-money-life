import { afterEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { QuickAddModal } from "./QuickAddModal";
import i18n from "../i18n";

afterEach(cleanup);

async function open(save = vi.fn().mockResolvedValue(undefined)) {
  await i18n.changeLanguage("en");
  const close = vi.fn();
  render(<QuickAddModal isOpen onClose={close} onSave={save} defaultDate="2026-10-04" />);
  fireEvent.change(screen.getByLabelText(/Amount/), { target: { value: "150.50" } });
  fireEvent.change(screen.getByLabelText(/Description/), { target: { value: "Salary adjustment" } });
  return { close, save };
}

describe("QuickAddModal", () => {
  it("preserves amount and description when switching expense to income", async () => {
    const { save } = await open();
    fireEvent.click(screen.getByRole("button", { name: /^Income$/ }));
    expect((screen.getByLabelText(/Amount/) as HTMLInputElement).value).toBe("150.50");
    expect((screen.getByLabelText(/Description/) as HTMLInputElement).value).toBe("Salary adjustment");
    fireEvent.click(screen.getByRole("button", { name: "Save transaction" }));
    await waitFor(() => expect(save).toHaveBeenCalledWith(expect.objectContaining({ amount: 150.5, category: "Income" })));
  });

  it("keeps failed input open and retries with the same transaction id", async () => {
    const save = vi.fn().mockRejectedValueOnce(new Error("Storage unavailable")).mockResolvedValue(undefined);
    const { close } = await open(save);
    fireEvent.click(screen.getByRole("button", { name: "Save transaction" }));
    await screen.findByRole("alert");
    expect(close).not.toHaveBeenCalled();
    expect((screen.getByLabelText(/Amount/) as HTMLInputElement).value).toBe("150.50");
    fireEvent.click(screen.getByRole("button", { name: "Save transaction" }));
    await waitFor(() => expect(close).toHaveBeenCalledTimes(1));
    expect(save.mock.calls[0][0].id).toBe(save.mock.calls[1][0].id);
  });

  it("waits for persistence and asks before discarding entered information", async () => {
    let resolve!: () => void;
    const save = vi.fn(() => new Promise<void>(done => { resolve = done; }));
    const { close } = await open(save);
    fireEvent.click(screen.getByRole("button", { name: /Cancel/ }));
    expect(screen.getByText(/Discard the information/)).toBeDefined();
    expect(close).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "Keep editing" }));
    fireEvent.click(screen.getByRole("button", { name: "Save transaction" }));
    expect(close).not.toHaveBeenCalled();
    expect(screen.getByRole("button", { name: "Saving…" }).closest("fieldset")?.disabled).toBe(true);
    await act(async () => resolve());
    expect(close).toHaveBeenCalledTimes(1);
  });
});
