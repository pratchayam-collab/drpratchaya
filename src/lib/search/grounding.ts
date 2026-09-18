import {
  ASK_MIN_GROUNDING_SCORE,
  MIN_GROUNDING_SCORE,
  MIN_LEADING_MARGIN,
} from '~/lib/search/constants';
import type { SearchHit, VectorChunkMetadata } from '~/lib/search/types';

export interface GroundingDecision {
  grounded: boolean;
  reason?: 'no_hits' | 'low_score' | 'ambiguous';
  topScore?: number;
}

export function assessGrounding(
  hits: SearchHit[],
  minScore = MIN_GROUNDING_SCORE,
): GroundingDecision {
  if (hits.length === 0) {
    return { grounded: false, reason: 'no_hits' };
  }
  const top = hits[0]!;
  const topScore = top.score;
  if (topScore < minScore) {
    return { grounded: false, reason: 'low_score', topScore };
  }
  const second = hits[1];
  if (
    second &&
    second.slug !== top.slug &&
    topScore - second.score < MIN_LEADING_MARGIN &&
    second.score >= minScore - 0.05
  ) {
    return { grounded: false, reason: 'ambiguous', topScore };
  }
  return { grounded: true, topScore };
}

/**
 * If the question names an anatomy topic (e.g. wrist) that does not appear in any
 * retrieved passage, refuse — embedding-only similarity is not enough for safety.
 */
const ANCHOR_GROUPS: string[][] = [
  ['ข้อมือ', 'wrist'],
  ['สะโพก', 'hip'],
  ['หลังส่วน', 'spine', 'lower back'],
  ['คอ', 'neck'],
  ['นิ้วมือ', 'finger'],
  ['ข้อเท้า', 'ankle'],
  ['กระดูกแขน', 'humerus fracture'],
];

export function queryAnchorsMismatch(question: string, chunks: VectorChunkMetadata[]): boolean {
  const q = question.toLowerCase();
  const corpus = chunks.map((c) => c.text).join('\n').toLowerCase();
  for (const terms of ANCHOR_GROUPS) {
    const inQuery = terms.some((t) => q.includes(t.toLowerCase()));
    if (!inQuery) continue;
    const inCorpus = terms.some((t) => corpus.includes(t.toLowerCase()));
    if (!inCorpus) return true;
  }
  return false;
}

export function assessAskGrounding(
  hits: SearchHit[],
  question: string,
  chunks: VectorChunkMetadata[],
): GroundingDecision {
  if (queryAnchorsMismatch(question, chunks)) {
    return { grounded: false, reason: 'low_score', topScore: hits[0]?.score };
  }
  return assessGrounding(hits, ASK_MIN_GROUNDING_SCORE);
}

/** Normalize for substring checks (collapse whitespace). */
export function normalizeForMatch(text: string): string {
  return text.replace(/\s+/g, ' ').trim();
}

export function isVerbatimSubstring(quote: string, source: string): boolean {
  const q = normalizeForMatch(quote);
  const s = normalizeForMatch(source);
  if (!q || q.length < 12) return false;
  return s.includes(q);
}
