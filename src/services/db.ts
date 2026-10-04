import Database from "@tauri-apps/plugin-sql";
import type { Allocation, Quest, SavingsGoal, TaxProfile, Transaction } from "../types";
import { getDefaultTaxProfile } from "./taxCalculator";

let dbInstance: Database | null = null;
let isTauriSqlAvailable = true;

export async function getDb(): Promise<Database | null> {
  if (!isTauriSqlAvailable) return null;
  if (!dbInstance) {
    try {
      dbInstance = await Database.load("sqlite:levelup_money.db");
      await initTables(dbInstance);
    } catch (err) {
      console.warn("Tauri SQLite plugin unavailable, falling back to LocalStorage:", err);
      isTauriSqlAvailable = false;
      return null;
    }
  }
  return dbInstance;
}

async function initTables(db: Database) {
  await db.execute(`
    CREATE TABLE IF NOT EXISTS transactions (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      amount REAL NOT NULL,
      date TEXT NOT NULL,
      category TEXT NOT NULL,
      cleared INTEGER NOT NULL,
      notes TEXT
    )
  `);

  // Attempt migration if notes column does not exist
  try {
    await db.execute(`ALTER TABLE transactions ADD COLUMN notes TEXT`);
  } catch {
    // Column already exists
  }

  await db.execute(`
    CREATE TABLE IF NOT EXISTS allocations (
      id TEXT PRIMARY KEY,
      label TEXT NOT NULL,
      percent REAL NOT NULL,
      color TEXT NOT NULL
    )
  `);

  await db.execute(`
    CREATE TABLE IF NOT EXISTS quests (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      date TEXT NOT NULL,
      xp INTEGER NOT NULL,
      done INTEGER NOT NULL,
      category TEXT
    )
  `);

  await db.execute(`
    CREATE TABLE IF NOT EXISTS savings_goals (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      category TEXT NOT NULL,
      target_amount REAL NOT NULL,
      current_amount REAL NOT NULL,
      target_date TEXT,
      icon TEXT NOT NULL,
      color TEXT,
      status TEXT NOT NULL,
      milestones_reached TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    )
  `);

  await db.execute(`
    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    )
  `);
}

// --- Transactions CRUD ---
export async function getTransactions(): Promise<Transaction[]> {
  try {
    const db = await getDb();
    if (!db) {
      const stored = localStorage.getItem("levelup.transactions");
      return stored ? JSON.parse(stored) : [];
    }

    const rows = await db.select<Array<{
      id: string;
      name: string;
      amount: number;
      date: string;
      category: string;
      cleared: number;
      notes?: string;
    }>>("SELECT * FROM transactions ORDER BY date DESC");

    return rows.map((r) => ({
      ...r,
      category: r.category as Transaction["category"],
      cleared: Boolean(r.cleared),
      notes: r.notes || "",
    }));
  } catch (err) {
    console.error("Failed to get transactions from db:", err);
    const stored = localStorage.getItem("levelup.transactions");
    return stored ? JSON.parse(stored) : [];
  }
}

export async function saveTransaction(tx: Transaction): Promise<void> {
  try {
    const db = await getDb();
    if (db) {
      await db.execute(
        `INSERT INTO transactions (id, name, amount, date, category, cleared, notes)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         ON CONFLICT(id) DO UPDATE SET
           name=excluded.name,
           amount=excluded.amount,
           date=excluded.date,
           category=excluded.category,
           cleared=excluded.cleared,
           notes=excluded.notes`,
        [tx.id, tx.name, tx.amount, tx.date, tx.category, tx.cleared ? 1 : 0, tx.notes || ""]
      );
    }
  } catch (err) {
    console.error("Failed to save transaction to db:", err);
  }
}

export async function deleteTransaction(id: string): Promise<void> {
  try {
    const db = await getDb();
    if (db) {
      await db.execute("DELETE FROM transactions WHERE id = $1", [id]);
    }
  } catch (err) {
    console.error("Failed to delete transaction from db:", err);
  }
}

export async function saveAllTransactions(txs: Transaction[]): Promise<void> {
  const db = await getDb();
  if (!db) {
    localStorage.setItem("levelup.transactions", JSON.stringify(txs));
    return;
  }
  if (txs.some(tx => !Number.isFinite(tx.amount))) throw new Error("Invalid transaction amount");
  const payload = JSON.stringify(txs);
  // Insert the complete snapshot before removing old rows. Each SQL statement
  // is atomic; failure leaves existing rows intact and can safely be retried.
  await db.execute(`INSERT OR REPLACE INTO transactions (id, name, amount, date, category, cleared, notes)
    SELECT json_extract(value, '$.id'), json_extract(value, '$.name'),
      json_extract(value, '$.amount'), json_extract(value, '$.date'),
      json_extract(value, '$.category'), json_extract(value, '$.cleared'),
      COALESCE(json_extract(value, '$.notes'), '') FROM json_each($1)`, [payload]);
  await db.execute("DELETE FROM transactions WHERE id NOT IN (SELECT json_extract(value, '$.id') FROM json_each($1))", [payload]);
}

// --- Allocations CRUD ---
export async function getAllocations(): Promise<Allocation[]> {
  try {
    const db = await getDb();
    if (!db) {
      const stored = localStorage.getItem("levelup.allocations");
      return stored ? JSON.parse(stored) : [];
    }
    return await db.select<Allocation[]>("SELECT * FROM allocations");
  } catch (err) {
    console.error("Failed to get allocations:", err);
    const stored = localStorage.getItem("levelup.allocations");
    return stored ? JSON.parse(stored) : [];
  }
}

export async function saveAllocations(allocations: Allocation[]): Promise<void> {
  localStorage.setItem("levelup.allocations", JSON.stringify(allocations));
  try {
    const db = await getDb();
    if (db) {
      await db.execute("DELETE FROM allocations");
      for (const a of allocations) {
        await db.execute(
          "INSERT INTO allocations (id, label, percent, color) VALUES ($1, $2, $3, $4)",
          [a.id, a.label, a.percent, a.color]
        );
      }
    }
  } catch (err) {
    console.error("Failed to save allocations to db:", err);
  }
}

// --- Quests CRUD ---
export async function getQuests(): Promise<Quest[]> {
  try {
    const db = await getDb();
    if (!db) {
      const stored = localStorage.getItem("levelup.quests");
      return stored ? JSON.parse(stored) : [];
    }
    const rows = await db.select<Array<{
      id: string;
      title: string;
      date: string;
      xp: number;
      done: number;
      category?: string;
    }>>("SELECT * FROM quests");

    return rows.map((q) => ({
      ...q,
      done: Boolean(q.done),
      category: (q.category as Quest["category"]) || "daily",
    }));
  } catch (err) {
    console.error("Failed to get quests:", err);
    const stored = localStorage.getItem("levelup.quests");
    return stored ? JSON.parse(stored) : [];
  }
}

export async function saveQuest(quest: Quest): Promise<void> {
  try {
    const db = await getDb();
    if (db) {
      await db.execute(
        `INSERT INTO quests (id, title, date, xp, done, category)
         VALUES ($1, $2, $3, $4, $5, $6)
         ON CONFLICT(id) DO UPDATE SET
           title=excluded.title,
           date=excluded.date,
           xp=excluded.xp,
           done=excluded.done,
           category=excluded.category`,
        [quest.id, quest.title, quest.date, quest.xp, quest.done ? 1 : 0, quest.category || "daily"]
      );
    }
  } catch (err) {
    console.error("Failed to save quest to db:", err);
  }
}

export async function saveAllQuests(quests: Quest[]): Promise<void> {
  localStorage.setItem("levelup.quests", JSON.stringify(quests));
  try {
    const db = await getDb();
    if (db) {
      await db.execute("DELETE FROM quests");
      for (const q of quests) {
        await saveQuest(q);
      }
    }
  } catch (err) {
    console.error("Failed to save all quests to db:", err);
  }
}

// --- Settings CRUD ---
export async function getSetting<T>(key: string, defaultValue: T): Promise<T> {
  try {
    const db = await getDb();
    if (!db) {
      const stored = localStorage.getItem(`levelup.setting.${key}`);
      return stored ? JSON.parse(stored) : defaultValue;
    }
    const rows = await db.select<Array<{ key: string; value: string }>>(
      "SELECT value FROM settings WHERE key = $1",
      [key]
    );

    if (rows.length === 0) return defaultValue;
    return JSON.parse(rows[0].value) as T;
  } catch {
    const stored = localStorage.getItem(`levelup.setting.${key}`);
    return stored ? JSON.parse(stored) : defaultValue;
  }
}

export async function saveSetting<T>(key: string, value: T): Promise<void> {
  localStorage.setItem(`levelup.setting.${key}`, JSON.stringify(value));
  try {
    const db = await getDb();
    if (db) {
      const valStr = JSON.stringify(value);
      await db.execute(
        `INSERT INTO settings (key, value)
         VALUES ($1, $2)
         ON CONFLICT(key) DO UPDATE SET value=excluded.value`,
        [key, valStr]
      );
    }
  } catch (err) {
    console.error(`Failed to save setting ${key}:`, err);
  }
}

// --- Tax Profile CRUD ---
export async function getTaxProfile(): Promise<TaxProfile> {
  return getSetting<TaxProfile>("tax_profile", getDefaultTaxProfile());
}

export async function saveTaxProfile(profile: TaxProfile): Promise<void> {
  return saveSetting<TaxProfile>("tax_profile", profile);
}

// --- Savings Goals CRUD ---
export const INITIAL_SAVINGS_GOALS: SavingsGoal[] = [
  {
    id: "goal-emergency-fund",
    title: "เงินสำรองฉุกเฉิน (Emergency Fund)",
    category: "emergency",
    targetAmount: 150000,
    currentAmount: 45000,
    targetDate: "2026-12-31",
    icon: "ShieldCheck",
    color: "#4D8E75",
    status: "active",
    milestonesReached: [25],
    createdAt: "2026-01-01",
    updatedAt: "2026-01-01",
  },
  {
    id: "goal-vacation",
    title: "ทริปเที่ยวสิ้นปี (Vacation Trip)",
    category: "travel",
    targetAmount: 40000,
    currentAmount: 20000,
    targetDate: "2026-11-30",
    icon: "AirplaneTilt",
    color: "#C99A4B",
    status: "active",
    milestonesReached: [25, 50],
    createdAt: "2026-02-01",
    updatedAt: "2026-02-01",
  },
];

export async function getSavingsGoals(): Promise<SavingsGoal[]> {
  try {
    const db = await getDb();
    if (!db) {
      const stored = localStorage.getItem("levelup.savings_goals");
      return stored ? JSON.parse(stored) : INITIAL_SAVINGS_GOALS;
    }

    const rows = await db.select<Array<{
      id: string;
      title: string;
      category: string;
      target_amount: number;
      current_amount: number;
      target_date: string | null;
      icon: string;
      color: string | null;
      status: string;
      milestones_reached: string;
      created_at: string;
      updated_at: string;
    }>>("SELECT * FROM savings_goals ORDER BY created_at ASC");

    if (rows.length === 0) {
      for (const g of INITIAL_SAVINGS_GOALS) {
        await saveSavingsGoal(g);
      }
      return INITIAL_SAVINGS_GOALS;
    }

    return rows.map((r) => ({
      id: r.id,
      title: r.title,
      category: r.category as SavingsGoal["category"],
      targetAmount: r.target_amount,
      currentAmount: r.current_amount,
      targetDate: r.target_date || undefined,
      icon: r.icon,
      color: r.color || undefined,
      status: (r.status as SavingsGoal["status"]) || "active",
      milestonesReached: r.milestones_reached ? JSON.parse(r.milestones_reached) : [],
      createdAt: r.created_at,
      updatedAt: r.updated_at,
    }));
  } catch (err) {
    console.error("Failed to get savings goals:", err);
    const stored = localStorage.getItem("levelup.savings_goals");
    return stored ? JSON.parse(stored) : INITIAL_SAVINGS_GOALS;
  }
}

export async function saveSavingsGoal(goal: SavingsGoal): Promise<void> {
  try {
    const stored = localStorage.getItem("levelup.savings_goals");
    const list: SavingsGoal[] = stored ? JSON.parse(stored) : [...INITIAL_SAVINGS_GOALS];
    const idx = list.findIndex((g) => g.id === goal.id);
    if (idx >= 0) list[idx] = goal;
    else list.push(goal);
    localStorage.setItem("levelup.savings_goals", JSON.stringify(list));

    const db = await getDb();
    if (db) {
      await db.execute(
        `INSERT INTO savings_goals (id, title, category, target_amount, current_amount, target_date, icon, color, status, milestones_reached, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
         ON CONFLICT(id) DO UPDATE SET
           title=excluded.title,
           category=excluded.category,
           target_amount=excluded.target_amount,
           current_amount=excluded.current_amount,
           target_date=excluded.target_date,
           icon=excluded.icon,
           color=excluded.color,
           status=excluded.status,
           milestones_reached=excluded.milestones_reached,
           updated_at=excluded.updated_at`,
        [
          goal.id,
          goal.title,
          goal.category,
          goal.targetAmount,
          goal.currentAmount,
          goal.targetDate || null,
          goal.icon,
          goal.color || null,
          goal.status,
          JSON.stringify(goal.milestonesReached || []),
          goal.createdAt,
          goal.updatedAt,
        ]
      );
    }
  } catch (err) {
    console.error("Failed to save savings goal to db:", err);
  }
}

export async function saveAllSavingsGoals(goals: SavingsGoal[]): Promise<void> {
  localStorage.setItem("levelup.savings_goals", JSON.stringify(goals));
  try {
    const db = await getDb();
    if (db) {
      await db.execute("DELETE FROM savings_goals");
      for (const goal of goals) {
        await db.execute(
          `INSERT OR REPLACE INTO savings_goals (
            id, title, category, target_amount, current_amount, target_date, icon, color, status, milestones_reached, created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            goal.id,
            goal.title,
            goal.category,
            goal.targetAmount,
            goal.currentAmount,
            goal.targetDate || null,
            goal.icon,
            goal.color || null,
            goal.status,
            JSON.stringify(goal.milestonesReached || []),
            goal.createdAt,
            goal.updatedAt,
          ]
        );
      }
    }
  } catch (err) {
    console.error("Failed to save all savings goals to db:", err);
  }
}

export async function deleteSavingsGoal(id: string): Promise<void> {
  try {
    const stored = localStorage.getItem("levelup.savings_goals");
    if (stored) {
      const list: SavingsGoal[] = JSON.parse(stored);
      localStorage.setItem("levelup.savings_goals", JSON.stringify(list.filter((g) => g.id !== id)));
    }
    const db = await getDb();
    if (db) {
      await db.execute("DELETE FROM savings_goals WHERE id = $1", [id]);
    }
  } catch (err) {
    console.error("Failed to delete savings goal:", err);
  }
}


