import React, { useEffect, useRef, useState } from "react";
import { animate, useReducedMotion } from "framer-motion";

interface AnimatedCounterProps {
  value: number;
  prefix?: string;
  suffix?: string;
  showSign?: boolean;
  highlightOnChange?: boolean;
  className?: string;
  duration?: number;
}

const defaultNumberFormatter = new Intl.NumberFormat("en-US", {
  maximumFractionDigits: 2,
});

export const AnimatedCounter: React.FC<AnimatedCounterProps> = ({
  value,
  prefix = "",
  suffix = "",
  showSign = false,
  highlightOnChange = true,
  className = "",
  duration = 0.4,
}) => {
  const shouldReduceMotion = useReducedMotion();
  const [displayValue, setDisplayValue] = useState<number>(value);
  const [glowState, setGlowState] = useState<"up" | "down" | null>(null);
  const prevValueRef = useRef<number>(value);
  const glowTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const prev = prevValueRef.current;
    if (prev !== value) {
      if (highlightOnChange && !shouldReduceMotion) {
        if (value > prev) {
          setGlowState("up");
        } else if (value < prev) {
          setGlowState("down");
        }

        if (glowTimeoutRef.current) {
          clearTimeout(glowTimeoutRef.current);
        }
        glowTimeoutRef.current = setTimeout(() => {
          setGlowState(null);
        }, 450);
      }

      if (shouldReduceMotion) {
        setDisplayValue(value);
      } else {
        const controls = animate(prev, value, {
          duration,
          ease: [0.16, 1, 0.3, 1],
          onUpdate: (latest) => {
            setDisplayValue(Math.round(latest * 100) / 100);
          },
        });

        prevValueRef.current = value;
        return () => {
          controls.stop();
        };
      }
      prevValueRef.current = value;
    }
  }, [value, duration, highlightOnChange, shouldReduceMotion]);

  useEffect(() => {
    return () => {
      if (glowTimeoutRef.current) {
        clearTimeout(glowTimeoutRef.current);
      }
    };
  }, []);

  const isNegative = displayValue < 0;
  const absValue = Math.abs(displayValue);
  const formattedAbs = defaultNumberFormatter.format(absValue);

  let formattedString = "";
  if (showSign) {
    if (displayValue > 0) {
      formattedString = `+${prefix}${formattedAbs}${suffix}`;
    } else if (displayValue < 0) {
      formattedString = `-${prefix}${formattedAbs}${suffix}`;
    } else {
      formattedString = `${prefix}${formattedAbs}${suffix}`;
    }
  } else {
    if (isNegative) {
      formattedString = `-${prefix}${formattedAbs}${suffix}`;
    } else {
      formattedString = `${prefix}${formattedAbs}${suffix}`;
    }
  }

  const glowClass =
    glowState === "up"
      ? "text-[var(--jade-ink)] bg-[var(--jade-soft)] ring-2 ring-[var(--jade)]/30 rounded-md px-1 -mx-1 transition-all duration-300"
      : glowState === "down"
      ? "text-[var(--rose-ink)] bg-[var(--rose-soft)] ring-2 ring-[var(--rose)]/30 rounded-md px-1 -mx-1 transition-all duration-300"
      : "transition-colors duration-300";

  return (
    <span className={`inline-block font-mono ${glowClass} ${className}`}>
      {formattedString}
    </span>
  );
};
