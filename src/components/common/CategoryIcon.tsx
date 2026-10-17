import React from "react";
import { AppIcon } from "../icons/registry";
import { useCategories } from "../../hooks/useCategories";

/** The category's icon in its colour, so categories are never told apart by colour alone. */
export const CategoryIcon: React.FC<{ category: string; size?: number; className?: string }> = ({ category, size = 14, className }) => {
  const { get } = useCategories();
  const def = get(category);
  return <AppIcon name={def.icon} size={size} weight="duotone" color={def.color} className={`shrink-0 ${className ?? ""}`} aria-hidden />;
};

/** Icon + label chip used wherever a category is shown inline. */
export const CategoryBadge: React.FC<{ category: string; className?: string }> = ({ category, className }) => {
  const { label } = useCategories();
  return (
    <span className={`inline-flex items-center gap-1.5 ${className ?? ""}`}>
      <CategoryIcon category={category} />
      <span className="truncate">{label(category)}</span>
    </span>
  );
};
