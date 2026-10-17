import React from "react";
import { motion, AnimatePresence, useReducedMotion } from "motion/react";
import { easeOut } from "../../constants/motion";

export interface FloatingRewardItem {
  id: string;
  text: string;
  x?: number;
  y?: number;
  type?: "xp" | "coin" | "badge";
}

interface FloatingRewardProps {
  rewards: FloatingRewardItem[];
  onComplete?: (id: string) => void;
}

export const FloatingReward: React.FC<FloatingRewardProps> = ({
  rewards,
  onComplete,
}) => {
  const shouldReduceMotion = useReducedMotion();

  return (
    <div className="pointer-events-none fixed inset-0 z-50 overflow-hidden">
      <AnimatePresence>
        {rewards.map((reward) => (
          <motion.div
            key={reward.id}
            initial={
              shouldReduceMotion
                ? { opacity: 0, scale: 0.95 }
                : { opacity: 0, y: 10, scale: 0.9 }
            }
            animate={
              shouldReduceMotion
                ? { opacity: 1, scale: 1 }
                : { opacity: 1, y: -28, scale: 1 }
            }
            exit={
              shouldReduceMotion
                ? { opacity: 0 }
                : { opacity: 0, y: -45, scale: 0.95 }
            }
            transition={easeOut(0.5)}
            onAnimationComplete={() => onComplete?.(reward.id)}
            style={{
              left: reward.x ?? "50%",
              top: reward.y ?? "40%",
              transform: "translate(-50%, -50%)",
            }}
            className="absolute flex items-center gap-1.5 rounded-full border border-[var(--jade)]/40 bg-[var(--color-surface)] px-3 py-1 text-xs font-bold text-[var(--jade-ink)] shadow-[var(--shadow-diffuse)] backdrop-blur-md"
          >
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-[var(--jade)]" />
            <span>{reward.text}</span>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};

