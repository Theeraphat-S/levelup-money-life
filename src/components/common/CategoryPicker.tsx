import React from "react";
import { useCategories } from "../../hooks/useCategories";
import { CategoryIcon } from "./CategoryIcon";

interface CategoryPickerProps {
  value: string;
  onChange: (category: string) => void;
  excludeSavings?: boolean;
}

/** Grid of visible expense categories; the current value stays listed even if it was hidden. */
export const CategoryPicker: React.FC<CategoryPickerProps> = ({ value, onChange, excludeSavings }) => {
  const { expenseIds, label } = useCategories();
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
      {expenseIds({ keep: value, excludeSavings }).map((cat) => {
        const isSelected = value === cat;
        return (
          <button
            key={cat}
            type="button"
            aria-pressed={isSelected}
            onClick={() => onChange(cat)}
            className={`flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-medium transition ${
              isSelected
                ? "border-[var(--primary)] bg-[var(--primary-soft)] text-[var(--primary-ink)] font-semibold shadow-xs"
                : "border-[var(--color-line)] bg-[var(--color-surface)] text-[var(--color-ink-soft)] hover:bg-[var(--color-surface-subtle)]"
            }`}
          >
            <CategoryIcon category={cat} />
            <span className="truncate">{label(cat)}</span>
          </button>
        );
      })}
    </div>
  );
};
