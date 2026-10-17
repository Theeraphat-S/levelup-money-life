import React from "react";
import { AppIcon } from "../icons/registry";
import { useCategories } from "../../hooks/useCategories";

/** A preset's icon in its category colour, on a soft tile of the same colour. */
export const PresetIcon: React.FC<{ icon: string; category: string; size?: number; className?: string }> = ({
  icon,
  category,
  size = 18,
  className,
}) => {
  const { color } = useCategories();
  const tint = color(category);
  return (
    <span
      className={`flex shrink-0 items-center justify-center rounded-xl ${className ?? ""}`}
      style={{ backgroundColor: `color-mix(in srgb, ${tint} 14%, transparent)` }}
      aria-hidden
    >
      <AppIcon name={icon} fallback="note" size={size} weight="duotone" color={tint} />
    </span>
  );
};
