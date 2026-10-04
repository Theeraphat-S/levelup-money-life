import { describe, it, expect } from "vitest";
import { SAMPLE_TRANSACTIONS, SAMPLE_ALLOCATIONS, SAMPLE_QUESTS } from "../constants/sampleData";
import { parseBackupJSON } from "./exportImport";

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
