import React, { useRef, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { AnimatedCounter } from "./AnimatedCounter";

interface MetricTileProps {
  icon: React.ReactNode;
  label: string;
  value?: string;
  numericValue?: number;
  prefix?: string;
  suffix?: string;
  showSign?: boolean;
  subtext?: string;
  tone?: "jade" | "emerald" | "teal" | "rose" | "indigo" | "amber" | "moss" | "neutral";
  className?: string;
  onClick?: () => void;
}

const TONE_STYLES = {
  jade: {
    iconBg: "bg-[var(--jade-soft)] text-[var(--jade-ink)] border-[var(--jade)]/25",
    valueText: "text-[var(--jade-ink)]",
    spotlight: "rgba(77, 142, 117, 0.09)",
  },
  emerald: {
    iconBg: "bg-[var(--jade-soft)] text-[var(--jade-ink)] border-[var(--jade)]/25",
    valueText: "text-[var(--jade-ink)]",
    spotlight: "rgba(77, 142, 117, 0.09)",
  },
  teal: {
    iconBg: "bg-[var(--primary-soft)] text-[var(--primary-ink)] border-[var(--primary)]/25",
    valueText: "text-[var(--primary-ink)]",
    spotlight: "rgba(28, 89, 84, 0.08)",
  },
  rose: {
    iconBg: "bg-[var(--rose-soft)] text-[var(--rose-ink)] border-[var(--rose)]/25",
    valueText: "text-[var(--rose-ink)]",
    spotlight: "rgba(185, 109, 105, 0.09)",
  },
  amber: {
    iconBg: "bg-[var(--amber-soft)] text-[var(--amber-ink)] border-[var(--amber)]/25",
    valueText: "text-[var(--amber-ink)]",
    spotlight: "rgba(201, 154, 75, 0.09)",
  },
  moss: {
    iconBg: "bg-[var(--moss-soft)] text-[var(--moss-ink)] border-[var(--moss)]/25",
    valueText: "text-[var(--moss-ink)]",
    spotlight: "rgba(135, 155, 98, 0.09)",
  },
  indigo: {
    iconBg: "bg-[var(--moss-soft)] text-[var(--moss-ink)] border-[var(--moss)]/25",
    valueText: "text-[var(--moss-ink)]",
    spotlight: "rgba(135, 155, 98, 0.09)",
  },
  neutral: {
    iconBg: "bg-[var(--color-surface-subtle)] text-[var(--color-ink-soft)] border-[var(--color-line)]",
    valueText: "text-[var(--color-ink)]",
    spotlight: "rgba(20, 45, 43, 0.05)",
  },
};

export const MetricTile: React.FC<MetricTileProps> = ({
  icon,
  label,
  value,
  numericValue,
  prefix,
  suffix,
  showSign,
  subtext,
  tone = "neutral",
  className = "",
  onClick,
}) => {
  const styles = TONE_STYLES[tone];
  const tileRef = useRef<HTMLDivElement>(null);
  const shouldReduceMotion = useReducedMotion();

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (shouldReduceMotion || !tileRef.current) return;
    const rect = tileRef.current.getBoundingClientRect();
    tileRef.current.style.setProperty("--mouse-x", `${e.clientX - rect.left}px`);
    tileRef.current.style.setProperty("--mouse-y", `${e.clientY - rect.top}px`);
  };

  return (
    <motion.div
      ref={tileRef}
      onMouseMove={handleMouseMove}
      whileHover={!shouldReduceMotion ? { y: -2 } : undefined}
      transition={{ type: "spring", stiffness: 350, damping: 25 }}
      onClick={onClick}
      className={`group relative overflow-hidden rounded-2xl border border-[var(--color-line)] bg-[var(--color-surface)] p-4 sm:p-4.5 shadow-[var(--shadow-tile)] transition-shadow duration-300 hover:shadow-[var(--shadow-diffuse)] ${onClick ? "cursor-pointer" : ""} ${className}`}
    >
      {/* 1px Inner Refraction Top Border */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-white/40 dark:bg-white/10" />

      {/* Subtle Dynamic Spotlight Effect */}
      {!shouldReduceMotion && (
        <div
          className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 ease-out group-hover:opacity-100 z-0"
          style={{
            background: `radial-gradient(220px circle at var(--mouse-x, -999px) var(--mouse-y, -999px), ${styles.spotlight}, transparent 80%)`,
          }}
        />
      )}

      <div className="relative z-10">
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-[var(--color-ink-soft)]">
            {label}
          </span>
          <div
            className={`grid h-7 w-7 shrink-0 place-items-center rounded-lg border text-sm transition-transform duration-200 group-hover:scale-105 ${styles.iconBg}`}
          >
            {icon}
          </div>
        </div>

        <div className={`mt-2 font-mono text-xl sm:text-2xl font-bold tracking-tight ${styles.valueText}`}>
          {numericValue !== undefined ? (
            <AnimatedCounter
              value={numericValue}
              prefix={prefix}
              suffix={suffix}
              showSign={showSign}
            />
          ) : (
            value
          )}
        </div>

        {subtext && (
          <div className="mt-1 text-xs font-medium text-[var(--color-ink-faint)]">
            {subtext}
          </div>
        )}
      </div>
    </motion.div>
  );
};
