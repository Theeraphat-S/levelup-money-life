import React, { useRef } from "react";
import { motion, useReducedMotion, type HTMLMotionProps } from "motion/react";
import { DURATION, easeOut } from "../../constants/motion";

interface BentoCardProps extends HTMLMotionProps<"section"> {
  children: React.ReactNode;
  className?: string;
  header?: React.ReactNode;
  footer?: React.ReactNode;
  noPadding?: boolean;
  enableSpotlight?: boolean;
}

export const BentoCard: React.FC<BentoCardProps> = ({
  children,
  className = "",
  header,
  footer,
  noPadding = false,
  enableSpotlight = true,
  ...motionProps
}) => {
  const cardRef = useRef<HTMLElement>(null);
  const shouldReduceMotion = useReducedMotion();

  const handleMouseMove = (e: React.MouseEvent<HTMLElement>) => {
    if (!enableSpotlight || shouldReduceMotion || !cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    cardRef.current.style.setProperty("--mouse-x", `${e.clientX - rect.left}px`);
    cardRef.current.style.setProperty("--mouse-y", `${e.clientY - rect.top}px`);
  };

  return (
    <motion.section
      ref={cardRef}
      onMouseMove={handleMouseMove}
      initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: 12 }}
      animate={shouldReduceMotion ? { opacity: 1 } : { opacity: 1, y: 0 }}
      exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: 8 }}
      transition={easeOut(DURATION.overlay)}
      className={`group/bento relative overflow-hidden rounded-2xl border border-[var(--color-line)] bg-[var(--color-surface)] shadow-[var(--shadow-tile)] transition-shadow duration-300 hover:shadow-[var(--shadow-diffuse)] ${className}`}
      {...motionProps}
    >
      {/* 1px Inner Refraction Top Border */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-white/40 dark:bg-white/10" />

      {/* Dynamic Cursor Spotlight Effect */}
      {enableSpotlight && !shouldReduceMotion && (
        <div
          className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 ease-out group-hover/bento:opacity-100 z-0"
          style={{
            background: "radial-gradient(400px circle at var(--mouse-x, -999px) var(--mouse-y, -999px), rgba(28, 89, 84, 0.05), transparent 80%)",
          }}
        />
      )}

      {header && (
        <div className="relative z-10 border-b border-[var(--color-line)] bg-[var(--color-surface-subtle)] px-5 py-3.5 sm:px-6 sm:py-4">
          {header}
        </div>
      )}

      <div className={`relative z-10 ${noPadding ? "" : "p-5 sm:p-6"}`}>{children}</div>

      {footer && (
        <div className="relative z-10 border-t border-[var(--color-line)] bg-[var(--color-surface-subtle)] px-5 py-3 sm:px-6">
          {footer}
        </div>
      )}
    </motion.section>
  );
};


