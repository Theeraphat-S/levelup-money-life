import type { Quest } from "../types";
import { SAMPLE_QUESTS } from "../constants/sampleData";

const DEFAULT_TITLES = new Map(SAMPLE_QUESTS.map((quest) => [quest.id, quest.title]));

/** Starter quests are stored with English titles; show them translated unless the user renamed them. */
export function displayQuestTitle(quest: Quest, t: (key: string) => string): string {
  return DEFAULT_TITLES.get(quest.id) === quest.title ? t(`quests.defaults.${quest.id}`) : quest.title;
}
