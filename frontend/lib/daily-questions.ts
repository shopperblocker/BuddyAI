export type DailyQuestion = {
  id: string;
  dimensionId: string;
  dimensionLabel: string;
  dimensionIcon: string;
  text: string;
};

export const DAILY_QUESTION_POOL: DailyQuestion[] = [
  // ── Emotional Resilience ──────────────────────────────────────────────────
  { id: 'emotional_0', dimensionId: 'emotional', dimensionLabel: 'Emotional Resilience', dimensionIcon: '💜',
    text: 'I handled my emotions well today.' },
  { id: 'emotional_1', dimensionId: 'emotional', dimensionLabel: 'Emotional Resilience', dimensionIcon: '💜',
    text: 'I felt able to bounce back from something stressful today.' },
  { id: 'emotional_2', dimensionId: 'emotional', dimensionLabel: 'Emotional Resilience', dimensionIcon: '💜',
    text: 'I did not suppress or stuff down my feelings today.' },
  { id: 'emotional_3', dimensionId: 'emotional', dimensionLabel: 'Emotional Resilience', dimensionIcon: '💜',
    text: 'I felt emotionally steady for most of today.' },
  { id: 'emotional_4', dimensionId: 'emotional', dimensionLabel: 'Emotional Resilience', dimensionIcon: '💜',
    text: 'I let myself feel what I needed to feel today without judging it.' },

  // ── Anxiety & Mental Clarity ──────────────────────────────────────────────
  { id: 'anxiety_0', dimensionId: 'anxiety', dimensionLabel: 'Anxiety & Mental Clarity', dimensionIcon: '🧠',
    text: 'My mind felt mostly clear and calm today.' },
  { id: 'anxiety_1', dimensionId: 'anxiety', dimensionLabel: 'Anxiety & Mental Clarity', dimensionIcon: '🧠',
    text: 'I did not spiral into worst-case thinking today.' },
  { id: 'anxiety_2', dimensionId: 'anxiety', dimensionLabel: 'Anxiety & Mental Clarity', dimensionIcon: '🧠',
    text: 'Anxious thoughts did not take over my day.' },
  { id: 'anxiety_3', dimensionId: 'anxiety', dimensionLabel: 'Anxiety & Mental Clarity', dimensionIcon: '🧠',
    text: 'I made at least one decision today without excessive second-guessing.' },
  { id: 'anxiety_4', dimensionId: 'anxiety', dimensionLabel: 'Anxiety & Mental Clarity', dimensionIcon: '🧠',
    text: 'I felt a general sense of safety and okayness today.' },

  // ── Spiritual Connection ──────────────────────────────────────────────────
  { id: 'spiritual_0', dimensionId: 'spiritual', dimensionLabel: 'Spiritual Connection', dimensionIcon: '✨',
    text: 'I felt connected to something meaningful today.' },
  { id: 'spiritual_1', dimensionId: 'spiritual', dimensionLabel: 'Spiritual Connection', dimensionIcon: '✨',
    text: 'I noticed a moment of gratitude or awe today.' },
  { id: 'spiritual_2', dimensionId: 'spiritual', dimensionLabel: 'Spiritual Connection', dimensionIcon: '✨',
    text: 'My actions today felt aligned with what I care about most.' },
  { id: 'spiritual_3', dimensionId: 'spiritual', dimensionLabel: 'Spiritual Connection', dimensionIcon: '✨',
    text: 'I had a moment of stillness or reflection today.' },
  { id: 'spiritual_4', dimensionId: 'spiritual', dimensionLabel: 'Spiritual Connection', dimensionIcon: '✨',
    text: 'I felt a sense of purpose in at least one thing I did today.' },

  // ── Relational Wellness ───────────────────────────────────────────────────
  { id: 'social_0', dimensionId: 'social', dimensionLabel: 'Relational Wellness', dimensionIcon: '🤝',
    text: 'I felt genuinely connected to at least one person today.' },
  { id: 'social_1', dimensionId: 'social', dimensionLabel: 'Relational Wellness', dimensionIcon: '🤝',
    text: 'I was honest about how I was feeling in at least one interaction today.' },
  { id: 'social_2', dimensionId: 'social', dimensionLabel: 'Relational Wellness', dimensionIcon: '🤝',
    text: 'I did not feel lonely or isolated today.' },
  { id: 'social_3', dimensionId: 'social', dimensionLabel: 'Relational Wellness', dimensionIcon: '🤝',
    text: 'I set or respected a boundary in a relationship today.' },
  { id: 'social_4', dimensionId: 'social', dimensionLabel: 'Relational Wellness', dimensionIcon: '🤝',
    text: 'I felt seen or understood by someone today.' },

  // ── Body & Lifestyle Balance ──────────────────────────────────────────────
  { id: 'lifestyle_0', dimensionId: 'lifestyle', dimensionLabel: 'Body & Lifestyle Balance', dimensionIcon: '🌿',
    text: 'I took care of my body today (sleep, food, or movement).' },
  { id: 'lifestyle_1', dimensionId: 'lifestyle', dimensionLabel: 'Body & Lifestyle Balance', dimensionIcon: '🌿',
    text: 'I felt physically energized at some point today.' },
  { id: 'lifestyle_2', dimensionId: 'lifestyle', dimensionLabel: 'Body & Lifestyle Balance', dimensionIcon: '🌿',
    text: 'I balanced doing things with resting appropriately today.' },
  { id: 'lifestyle_3', dimensionId: 'lifestyle', dimensionLabel: 'Body & Lifestyle Balance', dimensionIcon: '🌿',
    text: 'I avoided habits I know drain me today.' },
  { id: 'lifestyle_4', dimensionId: 'lifestyle', dimensionLabel: 'Body & Lifestyle Balance', dimensionIcon: '🌿',
    text: 'My body felt like an ally rather than a source of stress today.' },
];

const DIMENSION_IDS = ['emotional', 'anxiety', 'spiritual', 'social', 'lifestyle'];

/**
 * Returns 1 question per dimension for the given date.
 * Uses dayOfYear % 5 so each day's selection is deterministic and cycles through
 * all 5 questions per dimension over 5 days.
 */
export function getDailyQuestions(date: Date = new Date()): DailyQuestion[] {
  const startOfYear = new Date(date.getFullYear(), 0, 0);
  const dayOfYear = Math.floor((date.getTime() - startOfYear.getTime()) / 86400000);
  const idx = dayOfYear % 5;
  return DIMENSION_IDS.map((dimId) => {
    return DAILY_QUESTION_POOL.find((q) => q.id === `${dimId}_${idx}`)!;
  });
}
