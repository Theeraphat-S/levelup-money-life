import React, { useState, useRef, useEffect, useId } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CaretDown, Check } from "@phosphor-icons/react";

export interface CustomSelectOption {
  value: string;
  label: React.ReactNode;
  textValue?: string; // fallback string for search/aria
  colorDot?: string;
  icon?: React.ReactNode;
  badge?: string;
  disabled?: boolean;
}

export interface CustomSelectProps {
  value: string;
  onChange: (value: string) => void;
  options: CustomSelectOption[];
  placeholder?: string;
  disabled?: boolean;
  size?: "sm" | "md";
  className?: string;
  menuClassName?: string;
  align?: "left" | "right";
  ariaLabel?: string;
}

export const CustomSelect: React.FC<CustomSelectProps> = ({
  value,
  onChange,
  options,
  placeholder = "Select...",
  disabled = false,
  size = "md",
  className = "",
  menuClassName = "",
  align = "left",
  ariaLabel,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState<number>(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const listboxId = useId();

  const selectedOption = options.find((opt) => opt.value === value);

  // Close on outside click
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    const handleKeyDownGlobal = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDownGlobal);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDownGlobal);
    };
  }, [isOpen]);

  // Sync highlighted index when opening
  useEffect(() => {
    if (isOpen) {
      const idx = options.findIndex((opt) => opt.value === value);
      setHighlightedIndex(idx >= 0 ? idx : 0);
    }
  }, [isOpen, value, options]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>) => {
    if (disabled) return;

    if (!isOpen) {
      if (e.key === "ArrowDown" || e.key === "ArrowUp" || e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        setIsOpen(true);
      }
      return;
    }

    switch (e.key) {
      case "ArrowDown": {
        e.preventDefault();
        setHighlightedIndex((prev) => {
          let next = prev + 1;
          while (next < options.length && options[next]?.disabled) {
            next++;
          }
          return next < options.length ? next : prev;
        });
        break;
      }
      case "ArrowUp": {
        e.preventDefault();
        setHighlightedIndex((prev) => {
          let next = prev - 1;
          while (next >= 0 && options[next]?.disabled) {
            next--;
          }
          return next >= 0 ? next : prev;
        });
        break;
      }
      case "Enter":
      case " ": {
        e.preventDefault();
        if (highlightedIndex >= 0 && highlightedIndex < options.length) {
          const opt = options[highlightedIndex];
          if (opt && !opt.disabled) {
            onChange(opt.value);
            setIsOpen(false);
          }
        }
        break;
      }
      case "Tab": {
        setIsOpen(false);
        break;
      }
    }
  };

  const isSmall = size === "sm";

  return (
    <div
      ref={containerRef}
      className={`relative inline-block text-left ${className}`}
    >
      {/* Trigger Button */}
      <button
        type="button"
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-controls={listboxId}
        aria-label={ariaLabel || (typeof selectedOption?.label === "string" ? selectedOption.label : undefined)}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        onKeyDown={handleKeyDown}
        className={`group relative flex w-full items-center justify-between gap-2 rounded-xl border font-medium transition-all duration-200 outline-none select-none cursor-pointer disabled:cursor-not-allowed disabled:opacity-50 ${
          isSmall
            ? "px-2.5 py-1 text-xs"
            : "px-3 py-1.5 text-xs sm:text-sm"
        } ${
          isOpen
            ? "border-[var(--primary)] bg-[var(--color-surface)] shadow-[0_0_0_2px_rgba(77,142,117,0.15)]"
            : "border-[var(--color-line)] bg-[var(--color-surface)] hover:border-[var(--primary)]/70 hover:bg-[var(--color-surface-hover)] shadow-xs"
        }`}
      >
        <div className="flex items-center gap-2 truncate">
          {selectedOption?.colorDot && (
            <span
              className="h-2 w-2 shrink-0 rounded-full ring-2 ring-white/20 transition-transform group-hover:scale-110"
              style={{ backgroundColor: selectedOption.colorDot }}
            />
          )}
          {selectedOption?.icon && (
            <span className="shrink-0 text-[var(--color-ink-soft)]">
              {selectedOption.icon}
            </span>
          )}
          <span className="truncate text-[var(--color-ink)] font-medium">
            {selectedOption ? selectedOption.label : placeholder}
          </span>
          {selectedOption?.badge && (
            <span className="rounded-md bg-[var(--primary-soft)] px-1.5 py-0.5 text-xs font-semibold text-[var(--primary-ink)]">
              {selectedOption.badge}
            </span>
          )}
        </div>

        <CaretDown
          size={isSmall ? 13 : 15}
          weight="bold"
          className={`shrink-0 text-[var(--color-ink-soft)] transition-transform duration-200 ${
            isOpen ? "rotate-180 text-[var(--primary)]" : "group-hover:text-[var(--color-ink)]"
          }`}
        />
      </button>

      {/* Dropdown Menu Popover */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            id={listboxId}
            role="listbox"
            tabIndex={-1}
            aria-label={ariaLabel}
            initial={{ opacity: 0, y: -4, scale: 0.98 }}
            animate={{ opacity: 1, y: 4, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.98 }}
            transition={{ type: "spring", stiffness: 450, damping: 30 }}
            className={`absolute z-50 min-w-[160px] max-h-64 overflow-y-auto rounded-xl border border-[var(--color-line)] bg-[var(--color-surface)]/95 p-1 backdrop-blur-xl shadow-2xl outline-none ${
              align === "right" ? "right-0" : "left-0"
            } ${menuClassName}`}
          >
            {options.map((opt, idx) => {
              const isSelected = opt.value === value;
              const isHighlighted = idx === highlightedIndex;

              return (
                <div
                  key={opt.value}
                  role="option"
                  aria-selected={isSelected}
                  aria-disabled={opt.disabled}
                  onClick={() => {
                    if (!opt.disabled) {
                      onChange(opt.value);
                      setIsOpen(false);
                    }
                  }}
                  onMouseEnter={() => !opt.disabled && setHighlightedIndex(idx)}
                  className={`group flex items-center justify-between gap-2 rounded-lg px-2.5 py-1.5 text-xs font-medium cursor-pointer select-none transition-all duration-150 ${
                    opt.disabled
                      ? "opacity-40 cursor-not-allowed"
                      : isSelected
                      ? "bg-[var(--primary-soft)] text-[var(--primary-ink)] font-semibold"
                      : isHighlighted
                      ? "bg-[var(--color-surface-subtle)] text-[var(--color-ink)]"
                      : "text-[var(--color-ink)] hover:bg-[var(--color-surface-subtle)]"
                  }`}
                >
                  <div className="flex items-center gap-2 truncate">
                    {opt.colorDot && (
                      <span
                        className="h-2 w-2 shrink-0 rounded-full ring-2 ring-white/10"
                        style={{ backgroundColor: opt.colorDot }}
                      />
                    )}
                    {opt.icon && (
                      <span
                        className={`shrink-0 ${
                          isSelected ? "text-[var(--primary)]" : "text-[var(--color-ink-soft)]"
                        }`}
                      >
                        {opt.icon}
                      </span>
                    )}
                    <span className="truncate">{opt.label}</span>
                    {opt.badge && (
                      <span className="ml-1 rounded bg-[var(--primary-soft)] px-1.5 py-0.2 text-xs font-semibold text-[var(--primary-ink)]">
                        {opt.badge}
                      </span>
                    )}
                  </div>

                  {isSelected && (
                    <Check
                      size={14}
                      weight="bold"
                      className="shrink-0 text-[var(--primary)] animate-in fade-in"
                    />
                  )}
                </div>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
