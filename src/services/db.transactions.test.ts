import { beforeEach, describe, expect, it, vi } from "vitest";

const database = vi.hoisted(() => ({
  execute: vi.fn().mockResolvedValue({}),
  load: vi.fn(),
}));
vi.mock("@tauri-apps/plugin-sql", () => ({ default: { load: database.load } }));

beforeEach(() => {
  vi.resetModules();
  vi.clearAllMocks();
  database.execute.mockResolvedValue({});
  localStorage.clear();
});

const tx = { id: "one", name: "Coffee's ฿", amount: -85.75, date: "2026-10-04", category: "Food" as const, cleared: true };

describe("transaction persistence", () => {
  it("reports storage quota failure instead of returning successful persistence", async () => {
    database.load.mockRejectedValueOnce(new Error("No native runtime"));
    const { saveAllTransactions } = await import("./db");
    const storage = vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => { throw new Error("Quota exceeded"); });
    try {
      await expect(saveAllTransactions([tx])).rejects.toThrow("Quota exceeded");
    } finally { storage.mockRestore(); }
  });

  it("does not delete existing native records when insertion fails", async () => {
    database.load.mockResolvedValueOnce({ execute: database.execute });
    const { getDb, saveAllTransactions } = await import("./db");
    await getDb();
    database.execute.mockClear();
    database.execute.mockRejectedValueOnce(new Error("Disk full"));
    await expect(saveAllTransactions([tx])).rejects.toThrow("Disk full");
    expect(database.execute).toHaveBeenCalledTimes(1);
    expect(database.execute.mock.calls[0][0]).toContain("INSERT OR REPLACE");
  });

  it("writes a parameterized snapshot before removing obsolete rows", async () => {
    database.load.mockResolvedValueOnce({ execute: database.execute });
    const { getDb, saveAllTransactions } = await import("./db");
    await getDb();
    database.execute.mockClear();
    await saveAllTransactions([tx]);
    expect(database.execute.mock.calls[0][1]).toEqual([JSON.stringify([tx])]);
    expect(database.execute.mock.calls[0][0]).not.toContain(tx.name);
    expect(database.execute.mock.calls[1][0]).toContain("DELETE FROM transactions WHERE id NOT IN");
  });
});
