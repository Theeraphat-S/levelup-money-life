import { describe, it, expect } from "vitest";
import {
  DEFAULT_PRESETS,
  addPreset,
  updatePreset,
  deletePreset,
  incrementPresetUsage,
  getSmartSuggestedPresets,
  getAutocompleteSuggestions,
} from "./presetManager";
import type { PresetItem, Transaction } from "../types";

describe("presetManager", () => {
  it("has valid default presets with icons, names, amounts and categories", () => {
    expect(DEFAULT_PRESETS.length).toBeGreaterThanOrEqual(4);
    const coffee = DEFAULT_PRESETS.find((p) => p.name.includes("กาแฟ"));
    expect(coffee).toBeDefined();
    expect(coffee?.amount).toBe(60);
    expect(coffee?.category).toBe("Food");
  });

  it("adds a custom preset", () => {
    const newPreset: Omit<PresetItem, "id"> = {
      icon: "movie",
      name: "ตั๋วหนัง SF",
      amount: 240,
      category: "Fun",
      type: "expense",
    };

    const updated = addPreset(newPreset, DEFAULT_PRESETS);
    expect(updated.length).toBe(DEFAULT_PRESETS.length + 1);
    const created = updated.find((p) => p.name === "ตั๋วหนัง SF");
    expect(created).toBeDefined();
    expect(created?.id).toMatch(/^custom-preset-/);
    expect(created?.isCustom).toBe(true);
  });

  it("updates an existing preset", () => {
    const first = DEFAULT_PRESETS[0];
    const modified: PresetItem = { ...first, amount: 75, name: "กาแฟพรีเมียม" };
    const updatedList = updatePreset(modified, DEFAULT_PRESETS);
    const found = updatedList.find((p) => p.id === first.id);
    expect(found?.amount).toBe(75);
    expect(found?.name).toBe("กาแฟพรีเมียม");
  });

  it("deletes a preset by id", () => {
    const toDeleteId = DEFAULT_PRESETS[0].id;
    const updatedList = deletePreset(toDeleteId, DEFAULT_PRESETS);
    expect(updatedList.find((p) => p.id === toDeleteId)).toBeUndefined();
    expect(updatedList.length).toBe(DEFAULT_PRESETS.length - 1);
  });

  it("increments preset usage count on tap", () => {
    const target = DEFAULT_PRESETS[0];
    const initialCount = target.usageCount || 0;
    const updatedList = incrementPresetUsage(target.id, DEFAULT_PRESETS);
    const found = updatedList.find((p) => p.id === target.id);
    expect(found?.usageCount).toBe(initialCount + 1);
  });

  it("generates smart suggestions combining presets and frequent history", () => {
    const transactions: Transaction[] = [
      { id: "1", name: "ข้าวเหนียวหมูปิ้ง", amount: -40, date: "2026-08-20", category: "Food", cleared: true },
      { id: "2", name: "ข้าวเหนียวหมูปิ้ง", amount: -40, date: "2026-08-21", category: "Food", cleared: true },
      { id: "3", name: "ข้าวเหนียวหมูปิ้ง", amount: -40, date: "2026-08-22", category: "Food", cleared: true },
      { id: "4", name: "ซื้อหนังสือ", amount: -350, date: "2026-08-22", category: "Learning", cleared: true },
    ];

    const suggestions = getSmartSuggestedPresets(transactions, DEFAULT_PRESETS, 8);
    expect(suggestions.length).toBeLessThanOrEqual(8);
    const porkRice = suggestions.find((s) => s.name === "ข้าวเหนียวหมูปิ้ง");
    expect(porkRice).toBeDefined();
    expect(porkRice?.amount).toBe(40);
    expect(porkRice?.type).toBe("expense");
  });

  it("distinguishes income and expense with identical names in smart suggestions", () => {
    const transactions: Transaction[] = [
      { id: "1", name: "Transfer", amount: -500, date: "2026-08-20", category: "Debt", cleared: true },
      { id: "2", name: "Transfer", amount: -500, date: "2026-08-21", category: "Debt", cleared: true },
      { id: "3", name: "Transfer", amount: 500, date: "2026-08-20", category: "Income", cleared: true },
      { id: "4", name: "Transfer", amount: 500, date: "2026-08-21", category: "Income", cleared: true },
    ];

    const suggestions = getSmartSuggestedPresets(transactions, [], 8);
    expect(suggestions.length).toBe(2);
    const expItem = suggestions.find((s) => s.type === "expense");
    const incItem = suggestions.find((s) => s.type === "income");
    expect(expItem).toBeDefined();
    expect(incItem).toBeDefined();
    expect(expItem?.category).toBe("Debt");
    expect(incItem?.category).toBe("Income");
  });

  it("provides live autocomplete matching search query", () => {
    const transactions: Transaction[] = [
      { id: "1", name: "Grab Taxi ไปทำงาน", amount: -150, date: "2026-08-20", category: "Transport", cleared: true },
      { id: "2", name: "Starbucks Iced Latte", amount: -165, date: "2026-08-21", category: "Food", cleared: true },
    ];

    const results = getAutocompleteSuggestions("taxi", transactions, DEFAULT_PRESETS);
    expect(results.length).toBeGreaterThanOrEqual(1);
    expect(results[0].name).toContain("Taxi");
  });
});
