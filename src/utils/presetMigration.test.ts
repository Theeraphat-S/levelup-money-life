import { describe, expect, it, vi } from "vitest";

const saveSetting = vi.fn().mockResolvedValue(undefined);
vi.mock("../services/db", () => ({
  getSetting: vi.fn().mockResolvedValue([
    { id: "a", icon: "☕", name: "กาแฟ", amount: 60, category: "Food", type: "expense" },
    { id: "b", icon: "🦄", name: "อื่นๆ", amount: 10, category: "Fun", type: "expense" },
  ]),
  saveSetting: (...args: unknown[]) => saveSetting(...args),
}));

import { CATEGORY_DEFAULT_ICONS, getStoredPresets } from "./presetManager";
import { BUILT_IN_CATEGORIES } from "./categories";

describe("preset icon migration", () => {
  it("converts stored emoji to keys, falls back for unknown ones, and writes the result back", async () => {
    const presets = await getStoredPresets();
    expect(presets.map((p) => p.icon)).toEqual(["coffee", "note"]);
    expect(saveSetting).toHaveBeenCalledWith("presets", presets);
  });

  it("uses each built-in category's own icon for auto-created presets", () => {
    for (const c of BUILT_IN_CATEGORIES) expect(CATEGORY_DEFAULT_ICONS[c.id]).toBe(c.icon);
  });
});
