import React from "react";
import { motion, useReducedMotion, type HTMLMotionProps } from "motion/react";
import { SPRING } from "../../constants/motion";

interface TactileButtonProps extends HTMLMotionProps<"button"> {
  children: React.ReactNode;
  className?: string;
  disabled?: boolean;
}

export const TactileButton: React.FC<TactileButtonProps> = ({
  children,
  className = "",
  disabled = false,
  ...props
}) => {
  const shouldReduceMotion = useReducedMotion();

  return (
    <motion.button
      whileTap={!disabled && !shouldReduceMotion ? { scale: 0.97 } : undefined}
      whileHover={!disabled && !shouldReduceMotion ? { y: -1 } : undefined}
      transition={SPRING.press}
      disabled={disabled}
      className={`relative select-none transition-colors ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"} ${className}`}
      {...props}
    >
      {children}
    </motion.button>
  );
};

