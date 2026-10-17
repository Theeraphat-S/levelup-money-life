import React, { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Calculator, CaretDown, Database, GearSix, Tag, Toolbox } from "./icons";
import { useTranslation } from "react-i18next";

interface ToolsMenuProps {
  onOpenTax: () => void;
  onOpenCategories: () => void;
  onOpenDataManager: () => void;
  onOpenSettings: () => void;
}

/** Occasional tools live here so the main tabs only hold what is used every day or week. */
export const ToolsMenu: React.FC<ToolsMenuProps> = ({ onOpenTax, onOpenCategories, onOpenDataManager, onOpenSettings }) => {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const itemRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const menuRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState<{ top: number; left: number } | null>(null);
  const MENU_WIDTH = 224;
  const EDGE = 8;

  // The header clips overflow, so the menu is portalled and kept inside the viewport
  useLayoutEffect(() => {
    if (!open) return;
    const place = () => {
      const rect = triggerRef.current?.getBoundingClientRect();
      if (!rect) return;
      const left = Math.min(Math.max(rect.right - MENU_WIDTH, EDGE), window.innerWidth - MENU_WIDTH - EDGE);
      setPosition({ top: rect.bottom + 6, left });
    };
    place();
    window.addEventListener("resize", place);
    window.addEventListener("scroll", place, true);
    return () => {
      window.removeEventListener("resize", place);
      window.removeEventListener("scroll", place, true);
    };
  }, [open]);

  const items = [
    { id: "tax", label: t("tools.tax"), icon: Calculator, action: onOpenTax },
    { id: "categories", label: t("categories.manage"), icon: Tag, action: onOpenCategories },
    { id: "data", label: t("header.dataManager"), icon: Database, action: onOpenDataManager },
    { id: "settings", label: t("settings.title"), icon: GearSix, action: onOpenSettings },
  ];

  // Focus the first item once the portalled menu has been placed
  const isPlaced = position !== null;
  useEffect(() => {
    if (open && isPlaced) itemRefs.current[0]?.focus();
  }, [open, isPlaced]);

  useEffect(() => {
    if (!open) return;
    const onClick = (event: MouseEvent) => {
      const target = event.target as Node;
      if (!containerRef.current?.contains(target) && !menuRef.current?.contains(target)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [open]);

  const close = (refocus = true) => {
    setOpen(false);
    setPosition(null);
    if (refocus) triggerRef.current?.focus();
  };

  const onMenuKeyDown = (event: React.KeyboardEvent) => {
    const index = itemRefs.current.findIndex((el) => el === document.activeElement);
    if (event.key === "Escape") {
      event.preventDefault();
      event.stopPropagation();
      close();
    } else if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      const step = event.key === "ArrowDown" ? 1 : -1;
      itemRefs.current[(index + step + items.length) % items.length]?.focus();
    } else if (event.key === "Home" || event.key === "End") {
      event.preventDefault();
      itemRefs.current[event.key === "Home" ? 0 : items.length - 1]?.focus();
    } else if (event.key === "Tab") {
      close(false);
    }
  };

  return (
    <div ref={containerRef} className="relative">
      <button
        ref={triggerRef}
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls="tools-menu"
        onClick={() => setOpen((v) => !v)}
        title={t("tools.title")}
        className="inline-flex items-center gap-1.5 rounded-xl border border-[var(--color-line)] bg-[var(--color-surface-subtle)] px-3 py-2 text-xs font-semibold text-[var(--color-ink)] shadow-xs transition hover:bg-[var(--color-surface)] active:scale-[0.98]"
      >
        <Toolbox size={15} weight="duotone" />
        <span className="hidden xl:inline whitespace-nowrap">{t("tools.title")}</span>
        <CaretDown size={11} weight="bold" className={`transition ${open ? "rotate-180" : ""}`} aria-hidden />
        <span className="sr-only xl:hidden">{t("tools.title")}</span>
      </button>
      {open && position && createPortal(
        <div
          ref={menuRef}
          id="tools-menu"
          role="menu"
          aria-label={t("tools.title")}
          onKeyDown={onMenuKeyDown}
          style={{ top: position.top, left: position.left, width: MENU_WIDTH }}
          className="fixed z-50 overflow-hidden rounded-2xl border border-[var(--color-line)] bg-[var(--color-surface)] p-1.5 shadow-xl"
        >
          {items.map((item, index) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                ref={(el) => { itemRefs.current[index] = el; }}
                type="button"
                role="menuitem"
                tabIndex={-1}
                onClick={() => { close(false); item.action(); }}
                className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left text-xs font-semibold text-[var(--color-ink)] outline-none transition hover:bg-[var(--color-surface-subtle)] focus:bg-[var(--primary-soft)] focus:text-[var(--primary-ink)]"
              >
                <Icon size={16} weight="duotone" className="text-[var(--primary)]" aria-hidden />
                {item.label}
              </button>
            );
          })}
        </div>,
        document.body
      )}
    </div>
  );
};
