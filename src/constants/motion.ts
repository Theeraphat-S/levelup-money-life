import type { Transition } from "motion/react";

// Shared motion language. Durations follow distance and consequence:
// feedback 100–150ms, state 150–300ms, overlay/layout 300–500ms, focal 500–800ms.
// Routine springs use bounce: 0 so elements settle without overshoot.

export const EASE_OUT_EXPO = [0.16, 1, 0.3, 1] as const;

export const DURATION = {
  feedback: 0.12,
  state: 0.2,
  overlay: 0.3,
  focal: 0.6,
} as const;

export const SPRING = {
  /** Press / hover feedback on buttons and tiles. */
  press: { type: "spring", visualDuration: 0.15, bounce: 0 },
  /** Indicators, pills, popovers: routine state changes. */
  state: { type: "spring", visualDuration: 0.22, bounce: 0 },
  /** Modals, toasts, drawers entering the screen. */
  overlay: { type: "spring", visualDuration: 0.3, bounce: 0 },
  /** The one earned moment (level up). A little overshoot is allowed here only. */
  celebrate: { type: "spring", visualDuration: 0.5, bounce: 0.2 },
} as const satisfies Record<string, Transition>;

/** Ease-out tween for entrances and progress fills. */
export const easeOut = (duration: number = DURATION.state): Transition => ({
  duration,
  ease: EASE_OUT_EXPO,
});
