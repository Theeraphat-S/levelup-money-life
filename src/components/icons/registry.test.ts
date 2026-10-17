import { describe, expect, it } from "vitest";
import { ICONS, PICKER_ICON_KEYS, SAVINGS_GOAL_ICON_KEYS, normalizeIconKey, resolveIconKey } from "./registry";

describe("icon registry", () => {
  it("maps legacy preset emoji, including variation-selector forms", () => {
    expect(resolveIconKey("☕")).toBe("coffee");
    expect(resolveIconKey("🏋️")).toBe("fitness");
    expect(resolveIconKey("🛍️")).toBe("shopping");
    expect(resolveIconKey("🍜")).toBe("meal");
  });

  it("maps legacy Phosphor names and keeps new keys as they are", () => {
    expect(resolveIconKey("ForkKnife")).toBe("meal");
    expect(resolveIconKey("AirplaneTilt")).toBe("airplane");
    expect(resolveIconKey("ShieldCheck")).toBe("shield");
    expect(resolveIconKey("transit")).toBe("transit");
  });

  it("falls back for unknown values, and never resolves inherited object keys", () => {
    expect(resolveIconKey("🦄")).toBeNull();
    expect(resolveIconKey("constructor")).toBeNull();
    expect(normalizeIconKey("🦄", "note")).toBe("note");
    expect(normalizeIconKey(undefined)).toBe("tag");
  });

  it("only offers pickable keys that exist", () => {
    for (const key of [...PICKER_ICON_KEYS, ...SAVINGS_GOAL_ICON_KEYS]) expect(ICONS[key]).toBeDefined();
  });
});
