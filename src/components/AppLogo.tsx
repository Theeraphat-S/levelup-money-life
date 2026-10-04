import React from "react";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";

export interface AppLogoProps {
  variant?: "icon" | "full" | "monogram";
  size?: "sm" | "md" | "lg" | "xl";
  showText?: boolean;
  animated?: boolean;
  className?: string;
}

const sizeMap = {
  sm: { icon: 28, textClass: "text-lg", subClass: "text-xs" },
  md: { icon: 40, textClass: "text-xl sm:text-2xl", subClass: "text-xs" },
  lg: { icon: 52, textClass: "text-3xl", subClass: "text-sm" },
  xl: { icon: 68, textClass: "text-4xl", subClass: "text-base" },
};

export const AppLogoIcon: React.FC<{ size?: number; className?: string }> = ({
  size = 40,
  className = "",
}) => {
  const { t } = useTranslation();

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`shrink-0 ${className}`}
      aria-label={t("app.logoLabel")}
    >
      <defs>
        <linearGradient id="shield-base-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#113831" />
          <stop offset="50%" stopColor="#0D2621" />
          <stop offset="100%" stopColor="#081A16" />
        </linearGradient>

        <linearGradient id="crest-l-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#8CCBB5" />
          <stop offset="100%" stopColor="#5D9F88" />
        </linearGradient>

        <linearGradient id="crest-r-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#9EE0C7" />
          <stop offset="100%" stopColor="#6EB298" />
        </linearGradient>

        <linearGradient id="flank-l-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#569882" />
          <stop offset="100%" stopColor="#37725F" />
        </linearGradient>

        <linearGradient id="flank-r-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#81C4AC" />
          <stop offset="100%" stopColor="#50917D" />
        </linearGradient>

        <linearGradient id="mid-l-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#42836E" />
          <stop offset="100%" stopColor="#275A4B" />
        </linearGradient>

        <linearGradient id="arrow-top-grad" x1="0%" y1="100%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#79CDAF" />
          <stop offset="50%" stopColor="#A3E6CC" />
          <stop offset="100%" stopColor="#BAF2DB" />
        </linearGradient>

        <linearGradient id="arrow-shade-grad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#35735F" />
          <stop offset="100%" stopColor="#1B493B" />
        </linearGradient>

        <linearGradient id="star-gold-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FFE082" />
          <stop offset="40%" stopColor="#EBA53D" />
          <stop offset="100%" stopColor="#CE8722" />
        </linearGradient>

        <filter id="shield-drop-shadow" x="-10%" y="-10%" width="120%" height="125%">
          <feDropShadow dx="0" dy="2" stdDeviation="2.5" floodColor="#071B1A" floodOpacity="0.5" />
        </filter>
      </defs>

      <g filter="url(#shield-drop-shadow)">
        {/* Base Shield Silhouette */}
        <path
          d="M 48 8 L 14 20 L 16 52 L 50 96 L 84 52 L 86 20 L 52 8 Q 50 18 48 8 Z"
          fill="url(#shield-base-grad)"
          stroke="#1F4E42"
          strokeWidth="0.75"
          strokeLinejoin="round"
        />

        {/* Top Left Crest */}
        <polygon points="48,8 14,20 26,32 48,18" fill="url(#crest-l-grad)" />

        {/* Top Right Crest */}
        <polygon points="52,8 86,20 74,32 52,18" fill="url(#crest-r-grad)" />

        {/* Left Outer Flank */}
        <polygon points="14,20 16,52 25,60 26,32" fill="url(#flank-l-grad)" />

        {/* Right Outer Flank */}
        <polygon points="86,20 84,52 73,68 74,32" fill="url(#flank-r-grad)" />

        {/* Left Mid Facet */}
        <polygon points="26,32 43,47 25,60" fill="url(#mid-l-grad)" />

        {/* Lower Left Flank */}
        <polygon points="25,60 38,72 50,77 50,96 16,52" fill="#26594B" />

        {/* Lower Right Flank */}
        <polygon points="50,96 50,77 62,72 73,68 84,52" fill="#519480" />

        {/* Bottom Center Ridge Left */}
        <polygon points="50,96 41,75 50,68" fill="#31705D" />
        {/* Bottom Center Ridge Right */}
        <polygon points="50,96 50,68 59,75" fill="#62A791" />

        {/* Gold Star */}
        <polygon
          points="50,19 52.2,24.5 58,24.8 53.5,28.5 55.2,34 50,30.5 44.8,34 46.5,28.5 42,24.8 47.8,24.5"
          fill="url(#star-gold-grad)"
          stroke="#FFF1C2"
          strokeWidth="0.4"
          strokeLinejoin="round"
        />

        {/* Arrow Drop Shadow (Depth Layer) */}
        <path
          d="M 23 72 L 43 51 L 49 59 L 69 37 L 66 31 L 79 26 L 82 40 L 75 35 L 53 60 L 43 53 L 26 73 Z"
          fill="#081714"
          opacity="0.7"
        />

        {/* Arrow Side Shading */}
        <path
          d="M 23 70 L 43 49 L 49 57 L 72 34 L 72 38 L 49 61 L 43 53 L 23 74 Z"
          fill="url(#arrow-shade-grad)"
        />

        {/* Arrow Main Top Facet */}
        <path
          d="M 23 68 L 42 47 L 48 54 L 71 31 L 63 26 L 82 24 L 76 43 L 71 36 L 48 57 L 42 51 L 23 70 Z"
          fill="url(#arrow-top-grad)"
          stroke="#D8FDF0"
          strokeWidth="0.35"
          strokeLinejoin="round"
        />
      </g>
    </svg>
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
  const shouldShowText = variant !== "icon" && showText;

  const logoIcon = (
    <AppLogoIcon size={currentSize.icon} className="transition-transform duration-200" />
  );

  return (
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

      {shouldShowText && (
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
};
