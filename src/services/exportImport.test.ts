import { describe, it, expect } from "vitest";
import { SAMPLE_TRANSACTIONS, SAMPLE_ALLOCATIONS, SAMPLE_QUESTS } from "../constants/sampleData";
import { parseBackupJSON, parseCSV } from "./exportImport";

describe("Sample Data & Defaults Integrity", () => {
  it("should have valid sample transactions", () => {
    expect(SAMPLE_TRANSACTIONS.length).toBeGreaterThan(0);
    SAMPLE_TRANSACTIONS.forEach((tx) => {
      expect(tx.id).toBeDefined();
      expect(tx.name).toBeTruthy();
      expect(typeof tx.amount).toBe("number");
      expect(tx.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(typeof tx.cleared).toBe("boolean");
    });
  });

  it("should have balanced sample allocations", () => {
    const totalPercent = SAMPLE_ALLOCATIONS.reduce((sum, a) => sum + a.percent, 0);
    expect(totalPercent).toBe(100);
  });

  it("should have valid sample quests with positive XP", () => {
    expect(SAMPLE_QUESTS.length).toBeGreaterThan(0);
    SAMPLE_QUESTS.forEach((q) => {
      expect(q.id).toBeDefined();
      expect(q.title).toBeTruthy();
      expect(q.xp).toBeGreaterThan(0);
      expect(typeof q.done).toBe("boolean");
    });
  });
});

describe("backup compatibility", () => {
  it("loads recurring bills from new backups and accepts older backups without them", () => {
    expect(parseBackupJSON('{"transactions":[],"recurringBills":[]}').recurringBills).toEqual([]);
    expect(parseBackupJSON('{"transactions":[]}').recurringBills).toBeUndefined();
  });
});

describe("custom categories in backups and CSV", () => {
  it("carries categories in new backups and leaves them out of old ones", () => {
    const categories = [{ id: "cat-pets", name: "Pets", icon: "PawPrint", color: "#A055A8", bucket: "Needs", builtIn: false, hidden: false }];
    expect(parseBackupJSON(JSON.stringify({ transactions: [], categories })).categories).toEqual(categories);
    expect(parseBackupJSON('{"transactions":[]}').categories).toBeUndefined();
  });

  it("keeps custom category ids from CSV but maps unknown names to Food", () => {
    const csv = [
      "ID,Name,Amount,Date,Category,Cleared,Notes,Account",
      "11111111-aaaa-bbbb-cccc-000000000001,Cat food,-120,2026-10-05,cat-pets,true,,",
      "11111111-aaaa-bbbb-cccc-000000000002,Thing,-50,2026-10-05,Whatever,true,,",
    ].join("\n");
    expect(parseCSV(csv).map((t) => t.category)).toEqual(["cat-pets", "Food"]);
  });
});
