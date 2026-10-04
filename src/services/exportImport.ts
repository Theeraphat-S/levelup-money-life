import type { Allocation, GamificationState, PresetItem, Quest, RecurringBill, SavingsGoal, TaxProfile, Transaction, TransactionCategory } from "../types";
import { TRANSACTION_CATEGORIES } from "../types";

/**
 * Escapes a string field for CSV RFC 4180
 */
function escapeCSVField(str: string | number | boolean | undefined | null): string {
  if (str === undefined || str === null) return "";
  const val = String(str);
  if (val.includes(",") || val.includes('"') || val.includes("\n") || val.includes("\r")) {
    return `"${val.replace(/"/g, '""')}"`;
  }
  return val;
}

/**
 * Exports transactions to a downloadable CSV file
 */
export function exportToCSV(transactions: Transaction[], filename?: string): void {
  const headers = ["ID", "Name", "Amount", "Date", "Category", "Cleared", "Notes"];
  const rows = transactions.map((t) => [
    escapeCSVField(t.id),
    escapeCSVField(t.name),
    escapeCSVField(t.amount),
    escapeCSVField(t.date),
    escapeCSVField(t.category),
    escapeCSVField(t.cleared ? "true" : "false"),
    escapeCSVField(t.notes || ""),
  ]);

  const csvContent = [headers.join(","), ...rows.map((r) => r.join(","))].join("\r\n");
  const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  const dateStr = new Date().toISOString().slice(0, 10);
  link.setAttribute("href", url);
  link.setAttribute("download", filename || `levelup_transactions_${dateStr}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Parses raw CSV string into Transaction array
 */
export function parseCSV(csvText: string): Transaction[] {
  const lines = csvText.trim().split(/\r?\n/);
  if (lines.length <= 1) return [];

  // Parse lines considering quotes
  const parsedRows: string[][] = [];
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    const row: string[] = [];
    let insideQuotes = false;
    let currentField = "";

    for (let j = 0; j < line.length; j++) {
      const char = line[j];
      if (char === '"') {
        if (insideQuotes && line[j + 1] === '"') {
          currentField += '"';
          j++;
        } else {
          insideQuotes = !insideQuotes;
        }
      } else if (char === "," && !insideQuotes) {
        row.push(currentField.trim());
        currentField = "";
      } else {
        currentField += char;
      }
    }
    row.push(currentField.trim());
    parsedRows.push(row);
  }

  const transactions: Transaction[] = [];

  for (const cols of parsedRows) {
    if (cols.length < 3) continue;

    // Header order expected: ID, Name, Amount, Date, Category, Cleared, Notes (or Name, Amount, Date, Category...)
    let id: string = crypto.randomUUID();
    let name = "Entry";
    let amount = 0;
    let date = new Date().toISOString().slice(0, 10);
    let category: TransactionCategory = "Food";
    let cleared = false;
    let notes = "";

    if (cols.length >= 5 && cols[0].includes("-") && cols[0].length > 10) {
      // Has ID
      id = cols[0] || crypto.randomUUID();
      name = cols[1] || "Entry";
      amount = parseFloat(cols[2]) || 0;
      date = cols[3] || date;
      const cat = cols[4] as TransactionCategory;
      category = (TRANSACTION_CATEGORIES as readonly string[]).includes(cat) ? cat : "Food";
      cleared = cols[5]?.toLowerCase() === "true" || cols[5] === "1";
      notes = cols[6] || "";
    } else {
      // Basic format: Name, Amount, Date, Category
      name = cols[0] || "Entry";
      amount = parseFloat(cols[1]) || 0;
      date = cols[2] || date;
      const cat = cols[3] as TransactionCategory;
      category = (TRANSACTION_CATEGORIES as readonly string[]).includes(cat) ? cat : "Food";
      cleared = cols[4]?.toLowerCase() === "true" || cols[4] === "1";
      notes = cols[5] || "";
    }

    transactions.push({
      id,
      name,
      amount,
      date,
      category,
      cleared,
      notes,
    });
  }

  return transactions;
}

export type BackupData = {
  version: string;
  exportedAt: string;
  transactions: Transaction[];
  allocations: Allocation[];
  quests: Quest[];
  income: number;
  gamification?: GamificationState;
  taxProfile?: TaxProfile;
  presets?: PresetItem[];
  savingsGoals?: SavingsGoal[];
  recurringBills?: RecurringBill[];
};

/**
 * Exports complete application snapshot as JSON backup
 */
export function exportBackupJSON(data: Omit<BackupData, "version" | "exportedAt">): void {
  const fullBackup: BackupData = {
    version: "4.0.0",
    exportedAt: new Date().toISOString(),
    ...data,
  };

  const jsonStr = JSON.stringify(fullBackup, null, 2);
  const blob = new Blob([jsonStr], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  const dateStr = new Date().toISOString().slice(0, 10);
  link.setAttribute("href", url);
  link.setAttribute("download", `levelup_backup_${dateStr}.json`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Validates and parses a JSON backup file
 */
export function parseBackupJSON(jsonStr: string): BackupData {
  const parsed = JSON.parse(jsonStr);
  if (!parsed || typeof parsed !== "object") {
    throw new Error("Invalid JSON format");
  }
  if (!Array.isArray(parsed.transactions)) {
    throw new Error("Missing transactions array in backup file");
  }
  return parsed as BackupData;
}

