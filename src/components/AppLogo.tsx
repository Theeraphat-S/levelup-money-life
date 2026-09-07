import React from "react";
import { motion } from "framer-motion";
import logoImg from "../assets/logo.png";

export interface AppLogoProps {
  variant?: "icon" | "full" | "monogram";
  size?: "sm" | "md" | "lg" | "xl";
  showText?: boolean;
  animated?: boolean;
  className?: string;
}

const sizeMap = {
  sm: { icon: 28, textClass: "text-lg", subClass: "text-[10px]" },
  md: { icon: 40, textClass: "text-xl sm:text-2xl", subClass: "text-xs" },
  lg: { icon: 52, textClass: "text-3xl", subClass: "text-sm" },
  xl: { icon: 68, textClass: "text-4xl", subClass: "text-base" },
};

export const AppLogoIcon: React.FC<{ size?: number; className?: string }> = ({
  size = 40,
  className = "",
}) => {
  return (
    <img
      src={logoImg}
      alt="LevelUp Money Life Logo"
      width={size}
      height={size}
      className={`shrink-0 object-contain drop-shadow-sm select-none pointer-events-none ${className}`}
      style={{ width: size, height: size }}
      draggable={false}
      aria-label="LevelUp Money Life Logo"
    />
  );
};

export const AppLogo: React.FC<AppLogoProps> = ({
  variant = "full",
  size = "md",
  showText = true,
  animated = true,
  className = "",
}) => {
  const currentSize = sizeMap[size];

  const logoIcon = (
    <AppLogoIcon size={currentSize.icon} className="transition-transform duration-200" />
  );

  const content = (
    <div className={`inline-flex items-center gap-3 select-none ${className}`}>
      {animated ? (
        <motion.div
          whileHover={{ scale: 1.06, rotate: 1 }}
          whileTap={{ scale: 0.96 }}
          transition={{ type: "spring", stiffness: 300, damping: 15 }}
          className="cursor-pointer"
        >
          {logoIcon}
        </motion.div>
      ) : (
        logoIcon
      )}

      {(variant === "full" || showText) && (
        <div className="flex flex-col">
          <div className="flex items-center gap-1">
            <span
              className={`font-black tracking-tight text-[var(--color-ink)] ${currentSize.textClass} leading-tight font-sans`}
            >
              Level<span className="text-[var(--jade-ink)] dark:text-[var(--jade)]">Up</span>
            </span>
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-[var(--amber)] shadow-xs" />
          </div>
          <span
            className={`font-semibold tracking-wide uppercase text-[var(--color-ink-soft)] ${currentSize.subClass} leading-none mt-0.5`}
          >
            Money Life
          </span>
        </div>
      )}
    </div>
  );

  return content;
};
