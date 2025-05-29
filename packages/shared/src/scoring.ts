import type { ScoreFactors, ScoreWeights, Specialty } from './types';

export function clamp01(v: number): number {
  if (Number.isNaN(v)) return 0;
  return Math.max(0, Math.min(1, v));
}

export function normalize(value: number, min: number, max: number): number {
  if (max <= min) return 0;
  return clamp01((value - min) / (max - min));
}

export function weightedTotal(f: ScoreFactors, w: ScoreWeights): number {
  return (
    clamp01(f.ai_sophistication) * w.ai +
    clamp01(f.market_potential) * w.market +
    clamp01(f.funding_stage) * w.funding +
    clamp01(f.team_expertise) * w.team +
    clamp01(f.regulatory_positioning) * w.regulatory
  );
}

// Basic keyword map to bootstrap specialty classification
const SPECIALTY_KEYWORDS: Record<Specialty, string[]> = {
  cardiovascular: ['cardio', 'heart', 'arrhythmia', 'hypertension', 'cvd', 'ecg', 'stemi', 'cardiology'],
  diagnostics: ['diagnostic', 'imaging', 'assay', 'biomarker', 'lab', 'radiology', 'ct', 'mri'],
  'remote patient monitoring': ['rpm', 'remote monitoring', 'telemetry', 'wearable', 'home monitoring', 'telehealth'],
  other: []
};

// Very small TF-IDF-like cosine similarity: counts per category vs. text vector
export function classifySpecialties(text: string, threshold = 0.15): { label: Specialty; score: number }[] {
  const cleaned = text.toLowerCase();
  const vocab = new Set<string>();
  Object.values(SPECIALTY_KEYWORDS).forEach(list => list.forEach(k => vocab.add(k)));

  const textVec: Record<string, number> = {};
  for (const term of vocab) {
    const occurrences = (cleaned.match(new RegExp(`\\b${escapeRegExp(term)}\\b`, 'g')) || []).length;
    if (occurrences > 0) textVec[term] = occurrences;
  }

  const results: { label: Specialty; score: number }[] = [];
  for (const [label, words] of Object.entries(SPECIALTY_KEYWORDS) as [Specialty, string[]][]) {
    if (label === 'other') continue;
    const catVec: Record<string, number> = {};
    for (const w of words) catVec[w] = 1; // simple idf prior
    const score = cosine(textVec, catVec);
    if (score >= threshold) results.push({ label, score });
  }
  if (results.length === 0) results.push({ label: 'other', score: 0 });
  // Sort by score desc and cap to 2 labels for MVP multi-label
  return results.sort((a, b) => b.score - a.score).slice(0, 2);
}

function cosine(a: Record<string, number>, b: Record<string, number>): number {
  const keys = new Set([...Object.keys(a), ...Object.keys(b)]);
  let dot = 0, na = 0, nb = 0;
  for (const k of keys) {
    const va = a[k] ?? 0;
    const vb = b[k] ?? 0;
    dot += va * vb;
    na += va * va;
    nb += vb * vb;
  }
  const denom = Math.sqrt(na) * Math.sqrt(nb);
  return denom === 0 ? 0 : dot / denom;
}

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

