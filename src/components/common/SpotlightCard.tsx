import React, { useRef } from "react";
import { motion, useReducedMotion, type HTMLMotionProps } from "motion/react";
import { SPRING } from "../../constants/motion";

interface SpotlightCardProps extends HTMLMotionProps<"div"> {
  children: React.ReactNode;
  className?: string;
  spotlightColor?: string;
  enableGlow?: boolean;
  enableLift?: boolean;
}

export const SpotlightCard: React.FC<SpotlightCardProps> = ({
  children,
  className = "",
  spotlightColor = "rgba(28, 89, 84, 0.07)",
  enableGlow = true,
  enableLift = true,
  ...props
}) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const shouldReduceMotion = useReducedMotion();

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!enableGlow || shouldReduceMotion || !cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    cardRef.current.style.setProperty("--mouse-x", `${e.clientX - rect.left}px`);
    cardRef.current.style.setProperty("--mouse-y", `${e.clientY - rect.top}px`);
  };

  return (
    <motion.div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      whileHover={
        enableLift && !shouldReduceMotion
          ? { y: -2 }
          : undefined
      }
      transition={SPRING.press}
      className={`group/spotlight relative overflow-hidden rounded-2xl border border-[var(--color-line)] bg-[var(--color-surface)] shadow-[var(--shadow-tile)] transition-shadow duration-300 hover:shadow-[var(--shadow-diffuse)] ${className}`}
      {...props}
    >
      {/* 1px Inner Refraction Top Border */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-white/40 dark:bg-white/10" />

      {/* Dynamic Cursor Spotlight Effect */}
      {enableGlow && !shouldReduceMotion && (
        <div
          className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 ease-out group-hover/spotlight:opacity-100 z-0"
          style={{
            background: `radial-gradient(350px circle at var(--mouse-x, -999px) var(--mouse-y, -999px), ${spotlightColor}, transparent 80%)`,
          }}
        />
      )}

      {/* Content wrapper */}
      <div className="relative z-10">{children}</div>
    </motion.div>
  );
};

