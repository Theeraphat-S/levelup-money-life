import React, { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowUUpLeft,
  CheckCircle,
  Circle,
  Fire,
  Lock,
  Plus,
  Sparkle,
  Trash,
  Trophy,
} from "@phosphor-icons/react";
import { useTranslation } from "react-i18next";
import { BentoCard } from "../common/BentoCard";
import { TactileButton } from "../common/TactileButton";
import { AnimatedCounter } from "../common/AnimatedCounter";
import { FloatingReward, type FloatingRewardItem } from "../common/FloatingReward";
import type { Achievement, GamificationState, Quest } from "../../types";

interface QuestsGrowthProps {
  quests: Quest[];
  setQuests: React.Dispatch<React.SetStateAction<Quest[]>>;
  gamification: GamificationState;
  achievements: Achievement[];
  onToggleQuest: (id: string) => void;
}

const RANKS = [
  { level: 1, rankKey: "rank.novice" },
  { level: 3, rankKey: "rank.tactician" },
  { level: 6, rankKey: "rank.strategist" },
  { level: 10, rankKey: "rank.guardian" },
  { level: 15, rankKey: "rank.sovereign" },
  { level: 20, rankKey: "rank.maestro" },
];

export const QuestsGrowth: React.FC<QuestsGrowthProps> = ({
  quests,
  setQuests,
  gamification,
  achievements,
  onToggleQuest,
}) => {
  const { t } = useTranslation();
  const today = new Date().toISOString().slice(0, 10);

  const [newQuestTitle, setNewQuestTitle] = useState("");
  const [isAdding, setIsAdding] = useState(false);
  const [lastDeleted, setLastDeleted] = useState<Quest | null>(null);
  const [floatingRewards, setFloatingRewards] = useState<FloatingRewardItem[]>([]);

  const handleToggle = (quest: Quest, e: React.MouseEvent) => {
    if (!quest.done) {
      setFloatingRewards((prev) => [
        ...prev,
        {
          id: `${quest.id}-${Date.now()}`,
          text: `+${quest.xp} XP Completed!`,
          x: e.clientX,
          y: e.clientY,
        },
      ]);
    }
    onToggleQuest(quest.id);
  };

  const handleAddQuest = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newQuestTitle.trim()) return;

    const newQ: Quest = {
      id: crypto.randomUUID(),
      title: newQuestTitle.trim(),
      date: today,
      xp: 20,
      done: false,
    };

    setQuests((prev) => [newQ, ...prev]);
    setNewQuestTitle("");
    setIsAdding(false);
  };

  const deleteQuest = (quest: Quest) => {
    setLastDeleted(quest);
    setQuests((prev) => prev.filter((q) => q.id !== quest.id));
  };

  const undoDelete = () => {
    if (!lastDeleted) return;
    setQuests((prev) => [lastDeleted, ...prev.filter((q) => q.id !== lastDeleted.id)]);
    setLastDeleted(null);
  };

  const unlockedCount = achievements.filter((a) => a.unlocked).length;

  return (
    <div className="space-y-6">
      <FloatingReward
        rewards={floatingRewards}
        onComplete={(id) => {
          setFloatingRewards((prev) => prev.filter((r) => r.id !== id));
        }}
      />

      {/* Top Streak & Gamification Banner */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
        {/* Streak Flame Banner (5 cols) */}
        <BentoCard className="lg:col-span-5 bg-gradient-to-br from-[var(--amber-soft)] via-[var(--color-surface)] to-[var(--color-surface)]">
          <div className="flex items-start gap-4">
            <div className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl border border-[var(--amber)]/30 bg-[var(--amber-soft)] text-[var(--amber)] shadow-sm">
              <Fire size={32} weight="fill" />
            </div>
            <div>
              <span className="inline-flex items-center gap-1 text-xs font-bold uppercase tracking-wider text-[var(--amber-ink)]">
                Discipline Streak
              </span>
              <h2 className="text-xl font-bold tracking-tight text-[var(--color-ink)] flex items-center gap-1.5">
                <AnimatedCounter value={gamification.streakDays} duration={0.3} />
                <span>{t("quests.streakTitle", { days: "" }).replace("0", "").trim()}</span>
              </h2>
              <p className="mt-1 text-xs text-[var(--color-ink-soft)] leading-relaxed">
                {t("quests.streakSubtitle")}
              </p>
            </div>
          </div>
        </BentoCard>

        {/* Level Roadmap Overview (7 cols) */}
        <BentoCard
          className="lg:col-span-7"
          header={
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Trophy size={18} weight="fill" className="text-[var(--jade)]" />
                <h3 className="text-sm font-bold text-[var(--color-ink)]">
                  {t("quests.roadmapTitle")}
                </h3>
              </div>
              <span className="font-mono text-xs font-bold text-[var(--jade-ink)] flex items-center gap-1">
                <span>Level</span>
                <AnimatedCounter value={gamification.level} duration={0.3} />
              </span>
            </div>
          }
        >
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {RANKS.map((r) => {
              const isPassed = gamification.level >= r.level;

              return (
                <div
                  key={r.level}
                  className={`rounded-xl border p-2.5 transition ${
                    isPassed
                      ? "border-[var(--jade)]/40 bg-[var(--jade-soft)] text-[var(--jade-ink)]"
                      : "border-[var(--color-line)] bg-[var(--color-surface-subtle)] text-[var(--color-ink-soft)] opacity-60"
                  }`}
                >
                  <div className="flex items-center justify-between text-xs font-mono font-bold">
                    <span>Lv. {r.level}+</span>
                    {isPassed ? (
                      <CheckCircle size={14} weight="fill" className="text-[var(--jade)]" />
                    ) : (
                      <Lock size={12} />
                    )}
                  </div>
                  <div className="mt-1 text-xs font-semibold truncate">
                    {t(r.rankKey)}
                  </div>
                </div>
              );
            })}
          </div>
        </BentoCard>
      </div>

      {/* Daily Quests Management */}
      <BentoCard
        header={
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-[var(--color-ink)]">
                {t("quests.title")}
              </h3>
              <p className="text-xs text-[var(--color-ink-soft)]">
                {t("quests.subtitle")}
              </p>
            </div>
            <TactileButton
              type="button"
              onClick={() => setIsAdding((p) => !p)}
              className="inline-flex items-center gap-1.5 rounded-lg bg-[#1C5954] text-[#FEFFFC] dark:bg-[#76AA9D] dark:text-[#071B1A] px-3 py-1.5 text-xs font-semibold hover:opacity-90 transition shadow-xs"
            >
              <Plus size={14} weight="bold" />
              <span>{t("quests.add")}</span>
            </TactileButton>
          </div>
        }
      >
        <AnimatePresence>
          {lastDeleted && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-3 flex items-center justify-between border-b border-[var(--amber)]/30 bg-[var(--amber-soft)] px-4 py-2 text-xs text-[var(--amber-ink)] rounded-xl"
            >
              <span>{t("quests.deleted")}</span>
              <button
                type="button"
                onClick={undoDelete}
                className="inline-flex items-center gap-1 font-bold text-[var(--amber-ink)] underline hover:no-underline cursor-pointer"
              >
                <ArrowUUpLeft size={14} /> {t("quests.undo")}
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {isAdding && (
          <form onSubmit={handleAddQuest} className="mb-4 flex items-center gap-2">
            <input
              type="text"
              autoFocus
              required
              placeholder="e.g. Save 100 THB into piggy bank"
              value={newQuestTitle}
              onChange={(e) => setNewQuestTitle(e.target.value)}
              className="flex-1 rounded-xl border border-[var(--color-line)] bg-[var(--color-surface)] px-3 py-2 text-xs text-[var(--color-ink)] outline-none focus:border-[var(--primary)] shadow-xs"
            />
            <TactileButton
              type="submit"
              className="rounded-xl bg-[#1C5954] text-[#FEFFFC] dark:bg-[#76AA9D] dark:text-[#071B1A] px-3.5 py-2 text-xs font-bold shadow-xs hover:opacity-90"
            >
              Save Quest
            </TactileButton>
            <button
              type="button"
              onClick={() => setIsAdding(false)}
              className="rounded-xl border border-[var(--color-line)] px-3 py-2 text-xs text-[var(--color-ink-soft)] hover:bg-[var(--color-surface-subtle)] cursor-pointer"
            >
              Cancel
            </button>
          </form>
        )}

        <div className="space-y-2.5">
          {quests.map((quest) => (
            <div
              key={quest.id}
              className={`flex items-center justify-between rounded-xl border p-3.5 transition ${
                quest.done
                  ? "border-[var(--jade)]/30 bg-[var(--jade-soft)]/50 text-[var(--color-ink-soft)]"
                  : "border-[var(--color-line)] bg-[var(--color-surface)] text-[var(--color-ink)] hover:bg-[var(--color-surface-subtle)]"
              }`}
            >
              <button
                type="button"
                onClick={(e) => handleToggle(quest, e)}
                className="flex flex-1 items-center gap-3 text-left cursor-pointer"
              >
                {quest.done ? (
                  <CheckCircle size={22} weight="fill" className="text-[var(--jade)] shrink-0" />
                ) : (
                  <Circle size={22} weight="duotone" className="text-[var(--color-ink-soft)] shrink-0" />
                )}
                <div>
                  <span
                    className={`block text-xs font-semibold ${
                      quest.done ? "line-through text-[var(--color-ink-soft)] opacity-70" : "text-[var(--color-ink)]"
                    }`}
                  >
                    {quest.title}
                  </span>
                  <span className="font-mono text-xs text-[var(--color-ink-soft)]">
                    {quest.date}
                  </span>
                </div>
              </button>

              <div className="flex items-center gap-2 pl-2">
                <span className="inline-flex items-center gap-1 font-mono text-xs font-bold text-[var(--jade-ink)] bg-[var(--jade-soft)] px-2.5 py-1 rounded-lg border border-[var(--jade)]/25">
                  <Sparkle size={12} weight="fill" /> +{quest.xp} XP
                </span>
                <button
                  type="button"
                  onClick={() => deleteQuest(quest)}
                  className="rounded-lg p-1.5 text-[var(--color-ink-soft)] hover:bg-[var(--rose-soft)] hover:text-[var(--rose-ink)] transition"
                >
                  <Trash size={14} />
                </button>
              </div>
            </div>
          ))}

          {quests.length === 0 && (
            <div className="py-8 text-center text-xs text-[var(--color-ink-soft)]">
              {t("quests.empty")}
            </div>
          )}
        </div>
      </BentoCard>

      {/* Trophies & Financial Milestones */}
      <BentoCard
        header={
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-[var(--color-ink)]">
                {t("quests.achievementsTitle")}
              </h3>
              <p className="text-xs text-[var(--color-ink-soft)]">
                Unlock permanent financial trophies as your habits grow.
              </p>
            </div>
            <span className="rounded-full bg-[var(--jade-soft)] px-3 py-1 font-mono text-xs font-bold text-[var(--jade-ink)] border border-[var(--jade)]/30">
              {t("quests.unlockedCount", {
                unlocked: unlockedCount,
                total: achievements.length,
              })}
            </span>
          </div>
        }
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {achievements.map((ach) => {
            return (
              <div
                key={ach.id}
                className={`rounded-2xl border p-4 transition ${
                  ach.unlocked
                    ? "border-[var(--jade)]/30 bg-[var(--jade-soft)]/40 shadow-xs"
                    : "border-[var(--color-line)] bg-[var(--color-surface-subtle)] opacity-70"
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div
                    className={`grid h-9 w-9 place-items-center rounded-xl border text-base ${
                      ach.unlocked
                        ? "border-[var(--amber)]/40 bg-[var(--amber-soft)] text-[var(--amber)]"
                        : "border-[var(--color-line)] bg-[var(--color-surface-subtle)] text-[var(--color-ink-faint)]"
                    }`}
                  >
                    <Trophy size={18} weight={ach.unlocked ? "fill" : "duotone"} />
                  </div>

                  <span className="font-mono text-xs font-bold text-[var(--jade-ink)] bg-[var(--jade-soft)] px-2 py-0.5 rounded-md border border-[var(--jade)]/25">
                    +{ach.xpReward} XP
                  </span>
                </div>

                <div className="mt-3">
                  <h4 className="text-xs font-bold text-[var(--color-ink)]">
                    {t(ach.titleKey)}
                  </h4>
                  <p className="mt-1 text-xs text-[var(--color-ink-soft)] leading-relaxed">
                    {t(ach.descKey)}
                  </p>
                </div>

                <div className="mt-3 border-t border-[var(--color-line)] pt-2 text-xs text-[var(--color-ink-faint)] font-mono">
                  {ach.unlocked ? (
                    <span className="text-[var(--jade-ink)] font-semibold">
                      {t("quests.unlockedAt", { date: ach.unlockedAt || today })}
                    </span>
                  ) : (
                    <span>{t("quests.locked")}</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </BentoCard>
    </div>
  );
};
