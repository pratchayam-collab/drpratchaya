import {
  CHUNK_MAX_CHARS,
  CHUNK_MIN_CHARS,
  CHUNK_TARGET_CHARS,
} from '~/lib/search/constants';
import { corpusDocumentPath } from '~/lib/search/paths';
import type { ChunkKind, ChunkRecord, CorpusSourceType } from '~/lib/search/types';

const sentenceSegmenter =
  typeof Intl !== 'undefined' && 'Segmenter' in Intl
    ? new Intl.Segmenter('th', { granularity: 'sentence' })
    : null;

/**
 * Thai chunking strategy:
 * 1. Structure-first — split Markdown on `##` headings so sections stay intact.
 * 2. FAQ and shortAnswer are one chunk each (already Q&A shaped).
 * 3. Within a section, split on blank lines (paragraphs). Thai has no spaces between
 *    words, so whitespace-only splits would merge entire sections; paragraph boundaries
 *    match how the articles were written.
 * 4. Long paragraphs are split with `Intl.Segmenter('th', { granularity: 'sentence' })`
 *    so we never cut mid-word (Thai "words" are not space-delimited).
 * 5. Sentences are packed up to CHUNK_TARGET_CHARS without exceeding CHUNK_MAX_CHARS.
 */
export function splitThaiSentences(text: string): string[] {
  const trimmed = text.trim();
  if (!trimmed) return [];
  if (!sentenceSegmenter) {
    return trimmed.length <= CHUNK_MAX_CHARS ? [trimmed] : splitByLength(trimmed);
  }
  const parts: string[] = [];
  for (const { segment } of sentenceSegmenter.segment(trimmed)) {
    const s = segment.trim();
    if (s) parts.push(s);
  }
  return parts.length > 0 ? parts : [trimmed];
}

function splitByLength(text: string): string[] {
  const out: string[] = [];
  for (let i = 0; i < text.length; i += CHUNK_MAX_CHARS) {
    out.push(text.slice(i, i + CHUNK_MAX_CHARS));
  }
  return out;
}

function packSentences(sentences: string[]): string[] {
  const chunks: string[] = [];
  let buf = '';
  for (const sentence of sentences) {
    const candidate = buf ? `${buf} ${sentence}` : sentence;
    if (candidate.length <= CHUNK_TARGET_CHARS) {
      buf = candidate;
      continue;
    }
    if (buf.length >= CHUNK_MIN_CHARS) chunks.push(buf);
    if (sentence.length <= CHUNK_MAX_CHARS) {
      buf = sentence;
    } else {
      for (const piece of splitByLength(sentence)) {
        if (piece.length >= CHUNK_MIN_CHARS) chunks.push(piece);
      }
      buf = '';
    }
  }
  if (buf.length >= CHUNK_MIN_CHARS) chunks.push(buf);
  return chunks;
}

function stripMarkdownNoise(line: string): string {
  return line
    .replace(/^#{1,6}\s+/, '')
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/\*([^*]+)\*/g, '$1')
    .replace(/^>\s*/, '')
    .replace(/^[-*]\s+/, '')
    .trim();
}

function parseMarkdownSections(body: string): { title: string; lines: string[] }[] {
  const sections: { title: string; lines: string[] }[] = [];
  let currentTitle = 'บทนำ';
  let currentLines: string[] = [];

  for (const rawLine of body.split('\n')) {
    const line = rawLine.trimEnd();
    const heading = /^##\s+(.+)$/.exec(line);
    if (heading) {
      if (currentLines.some((l) => l.trim())) {
        sections.push({ title: currentTitle, lines: currentLines });
      }
      currentTitle = stripMarkdownNoise(heading[1] ?? '');
      currentLines = [];
      continue;
    }
    if (/^#\s+/.test(line)) continue;
    currentLines.push(line);
  }
  if (currentLines.some((l) => l.trim())) {
    sections.push({ title: currentTitle, lines: currentLines });
  }
  return sections;
}

/** Vectorize ids must stay ≤64 bytes — no Thai section keys in the id. */
function chunkId(
  sourceType: CorpusSourceType,
  slug: string,
  sectionCode: string | number,
  kind: ChunkKind,
  index: number,
): string {
  const prefix = sourceType === 'condition' ? 'c' : 'p';
  const kindCode = kind === 'shortAnswer' ? 's' : kind === 'faq' ? 'f' : kind === 'post' ? 'o' : 'b';
  return `${prefix}:${slug}:${sectionCode}:${kindCode}:${index}`;
}

export interface ConditionFrontmatter {
  title: string;
  shortAnswer: string;
  faq: { question: string; answer: string }[];
}

export function buildConditionChunks(
  slug: string,
  frontmatter: ConditionFrontmatter,
  markdownBody: string,
): ChunkRecord[] {
  const sourceType: CorpusSourceType = 'condition';
  const path = corpusDocumentPath(sourceType, slug);
  const title = frontmatter.title;
  const records: ChunkRecord[] = [];
  let idx = 0;

  const short = frontmatter.shortAnswer.trim();
  if (short && !short.includes('TODO(owner)')) {
    records.push({
      id: chunkId(sourceType, slug, 'sa', 'shortAnswer', idx++),
      sourceType,
      slug,
      title,
      section: 'shortAnswer',
      sectionTitle: 'คำตอบสั้น',
      kind: 'shortAnswer',
      text: short,
      path,
    });
  }

  for (const item of frontmatter.faq) {
    const q = item.question.trim();
    const a = item.answer.trim();
    if (!q || !a) continue;
    const text = `คำถาม: ${q}\nคำตอบ: ${a}`;
    records.push({
      id: chunkId(sourceType, slug, `fq${idx}`, 'faq', idx++),
      sourceType,
      slug,
      title,
      section: `faq-${idx}`,
      sectionTitle: 'คำถามที่พบบ่อย',
      kind: 'faq',
      text,
      path,
    });
  }

  const sections = parseMarkdownSections(markdownBody);
  let sectionIndex = 0;
  for (const section of sections) {
    const paragraphs = section.lines
      .map(stripMarkdownNoise)
      .filter(Boolean)
      .join('\n')
      .split(/\n\s*\n/)
      .map((p) => p.replace(/\n+/g, ' ').trim())
      .filter((p) => p.length >= CHUNK_MIN_CHARS);

    const sectionKey = String(sectionIndex++);
    let bodyIdx = 0;
    for (const paragraph of paragraphs) {
      const pieces =
        paragraph.length <= CHUNK_MAX_CHARS
          ? [paragraph]
          : packSentences(splitThaiSentences(paragraph));
      for (const text of pieces) {
        if (text.length < CHUNK_MIN_CHARS) continue;
        records.push({
          id: chunkId(sourceType, slug, sectionKey, 'body', bodyIdx++),
          sourceType,
          slug,
          title,
          section: `sec-${sectionKey}`,
          sectionTitle: section.title,
          kind: 'body',
          text,
          path,
        });
      }
    }
  }

  return records;
}

/** Future: map D1 post rows into ChunkRecord[] with sourceType `post`. */
export function buildPostChunks(
  _slug: string,
  _title: string,
  _body: string,
): ChunkRecord[] {
  return [];
}
