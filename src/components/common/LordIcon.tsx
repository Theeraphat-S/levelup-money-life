import React, { useEffect, useRef, useState } from "react";
import { useReducedMotion } from "motion/react";
import lottie from "lottie-web/build/player/lottie_light";

/**
 * Lordicon "Wired Outline" animations (free set, credited in Settings). The JSON files live in the
 * repo and load on demand; nothing is fetched from a CDN at runtime.
 */
const LOADERS = {
  confetti: () => import("../../assets/lordicon/confetti.json"),
  medal: () => import("../../assets/lordicon/medal.json"),
  check: () => import("../../assets/lordicon/check.json"),
  scale: () => import("../../assets/lordicon/scale.json"),
  coins: () => import("../../assets/lordicon/coins.json"),
  "piggy-bank": () => import("../../assets/lordicon/piggy-bank.json"),
} as const;

export type LordIconName = keyof typeof LOADERS;

type LottieData = Record<string, unknown>;

function parseRgb(css: string): [number, number, number] {
  const m = css.match(/[\d.]+/g);
  if (!m || m.length < 3) return [0.1, 0.35, 0.33];
  return [Number(m[0]) / 255, Number(m[1]) / 255, Number(m[2]) / 255];
}

/** Lordicon files bake in a fixed navy; repaint every stroke and fill with the theme colour. */
function recolor(data: LottieData, rgb: [number, number, number]): LottieData {
  const paint = (node: unknown): unknown => {
    if (Array.isArray(node)) return node.map(paint);
    if (node && typeof node === "object") {
      const o = node as Record<string, unknown>;
      const out: Record<string, unknown> = {};
      for (const [k, v] of Object.entries(o)) out[k] = paint(v);
      if ((o.ty === "st" || o.ty === "fl") && o.c && typeof o.c === "object") {
        out.c = { ...(o.c as object), k: [rgb[0], rgb[1], rgb[2], 1], a: 0 };
      }
      return out;
    }
    return node;
  };
  return paint(data) as LottieData;
}

interface LordIconProps {
  name: LordIconName;
  size?: number;
  /** Shown instead of the animation when the user prefers reduced motion. */
  fallback: React.ReactNode;
  /** Plays once by default; pass true for a loop. */
  loop?: boolean;
  className?: string;
  /** CSS colour of the strokes; defaults to the surrounding text colour. */
  color?: string;
}

export const LordIcon: React.FC<LordIconProps> = ({ name, size = 64, fallback, loop = false, className, color }) => {
  const reduced = useReducedMotion();
  const host = useRef<HTMLSpanElement>(null);
  const [theme, setTheme] = useState(0);

  // Dark mode toggles a class on <html>; repaint when it changes.
  useEffect(() => {
    const observer = new MutationObserver(() => setTheme((n) => n + 1));
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const el = host.current;
    if (reduced || !el) return;
    let cancelled = false;
    let anim: ReturnType<typeof lottie.loadAnimation> | undefined;
    LOADERS[name]().then((mod) => {
      if (cancelled || !host.current) return;
      const css = color ?? getComputedStyle(host.current).color;
      anim = lottie.loadAnimation({
        container: host.current,
        renderer: "svg",
        loop,
        autoplay: true,
        animationData: recolor(mod.default as unknown as LottieData, parseRgb(css)),
        rendererSettings: { preserveAspectRatio: "xMidYMid meet" },
      });
    });
    return () => {
      cancelled = true;
      anim?.destroy();
    };
  }, [name, loop, color, reduced, theme]);

  if (reduced) return <span className={className}>{fallback}</span>;
  return <span ref={host} aria-hidden className={`inline-block ${className ?? ""}`} style={{ width: size, height: size }} />;
};
