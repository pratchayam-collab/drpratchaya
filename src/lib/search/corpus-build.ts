import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { buildConditionChunks, buildPostChunks } from '~/lib/search/chunk';
import type { ChunkRecord } from '~/lib/search/types';

const FRONTMATTER_RE = /^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/;

function parseSimpleYamlList(block: string): { question: string; answer: string }[] {
  const lines = block.split('\n');
  const items: { question: string; answer: string }[] = [];
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    if (!line?.startsWith(`  - question:`)) {
      i += 1;
      continue;
    }
    const question = line.replace(/^\s*-\s*question:\s*/, '').replace(/^["']|["']$/g, '');
    i += 1;
    const answerLine = lines[i];
    const answer = answerLine?.replace(/^\s*answer:\s*/, '').replace(/^["']|["']$/g, '') ?? '';
    if (question && answer) items.push({ question, answer });
    i += 1;
  }
  return items;
}

function parseFrontmatter(raw: string): { title: string; shortAnswer: string; faq: { question: string; answer: string }[] } {
  const title = /^title:\s*["']?(.+?)["']?\s*$/m.exec(raw)?.[1] ?? '';
  const shortAnswer = /^shortAnswer:\s*["']?(.*?)["']?\s*$/m.exec(raw)?.[1]?.trim() ?? '';
  const faq = parseSimpleYamlList(raw);
  return { title, shortAnswer, faq };
}

export async function loadConditionChunksFromRepo(
  conditionsDir = path.join(process.cwd(), 'src/content/conditions'),
): Promise<ChunkRecord[]> {
  const entries = await readdir(conditionsDir);
  const all: ChunkRecord[] = [];
  for (const file of entries) {
    if (!file.endsWith('.md')) continue;
    const slug = file.replace(/\.md$/, '');
    const full = await readFile(path.join(conditionsDir, file), 'utf8');
    const match = FRONTMATTER_RE.exec(full);
    if (!match) continue;
    const frontmatter = parseFrontmatter(match[1] ?? '');
    const body = match[2] ?? '';
    all.push(...buildConditionChunks(slug, frontmatter, body));
  }
  return all;
}

export async function loadAllCorpusChunks(): Promise<ChunkRecord[]> {
  const conditions = await loadConditionChunksFromRepo();
  const posts = buildPostChunks('', '', '');
  return [...conditions, ...posts];
}

export function chunkToVectorMetadata(chunk: ChunkRecord): Record<string, string> {
  return {
    sourceType: chunk.sourceType,
    slug: chunk.slug,
    title: chunk.title,
    section: chunk.section,
    sectionTitle: chunk.sectionTitle,
    kind: chunk.kind,
    path: chunk.path,
    text: chunk.text,
  };
}
