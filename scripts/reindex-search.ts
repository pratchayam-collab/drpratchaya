/**
 * Idempotent semantic index build for condition articles (+ future D1 posts).
 *
 * When to run: after any change to `src/content/conditions/*.md` or when adding
 * published posts to the corpus — before deploy. Not on every `npm run build`
 * (keeps CI fast; embeddings are remote API calls).
 *
 * Requires: `CLOUDFLARE_API_TOKEN` with Workers AI + Vectorize edit on account
 * `5093b764ea33977e138b71627193ea52`.
 *
 * Usage: `npm run index:search`
 */
import { createHash } from 'node:crypto';
import { homedir } from 'node:os';
import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { EMBEDDING_MODEL } from '../src/lib/search/constants.ts';
import {
  chunkToVectorMetadata,
  loadAllCorpusChunks,
} from '../src/lib/search/corpus-build.ts';

const ACCOUNT_ID = '5093b764ea33977e138b71627193ea52';
const INDEX_NAME = 'drpratchaya-embeddings';
const MANIFEST_PATH = path.join(process.cwd(), 'scripts/search-index-manifest.json');
const DIGEST_PATH = path.join(process.cwd(), 'scripts/search-corpus-digest.txt');
const BATCH = 32;

function digestChunks(chunks: { id: string; text: string }[]): string {
  const payload = chunks
    .map((c) => `${c.id}\0${c.text}`)
    .sort()
    .join('\n');
  return createHash('sha256').update(payload, 'utf8').digest('hex');
}

async function resolveCloudflareToken(): Promise<string> {
  if (process.env.CLOUDFLARE_API_TOKEN) return process.env.CLOUDFLARE_API_TOKEN;
  const configCandidates = [
    path.join(homedir(), 'Library/Preferences/.wrangler/config/default.toml'),
    path.join(homedir(), '.config/.wrangler/config/default.toml'),
  ];
  for (const configPath of configCandidates) {
    try {
      const raw = await readFile(configPath, 'utf8');
      const match = /^oauth_token\s*=\s*"([^"]+)"/m.exec(raw);
      if (match?.[1]) return match[1];
    } catch {
      /* try next */
    }
  }
  throw new Error(
    'Set CLOUDFLARE_API_TOKEN or run `wrangler login` (Vectorize + Workers AI on production account).',
  );
}

async function cfFetch<T>(pathname: string, body: unknown): Promise<T> {
  const token = await resolveCloudflareToken();
  const res = await fetch(`https://api.cloudflare.com/client/v4/accounts/${ACCOUNT_ID}${pathname}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });
  const json = (await res.json()) as { success?: boolean; errors?: unknown; result?: T };
  if (!res.ok || !json.success) {
    throw new Error(`Cloudflare API ${pathname} failed: ${JSON.stringify(json.errors ?? json)}`);
  }
  return json.result as T;
}

async function embedBatch(texts: string[]): Promise<number[][]> {
  const result = await cfFetch<{ data?: number[][] }>(`/ai/run/${EMBEDDING_MODEL}`, {
    text: texts,
    truncate_inputs: true,
  });
  if (!result.data || result.data.length !== texts.length) {
    throw new Error('Unexpected embedding batch response');
  }
  return result.data;
}

async function upsertVectors(
  vectors: { id: string; values: number[]; metadata: Record<string, string> }[],
): Promise<void> {
  await cfFetch(`/vectorize/v2/indexes/${INDEX_NAME}/upsert`, { vectors });
}

async function deleteByIds(ids: string[]): Promise<void> {
  if (ids.length === 0) return;
  await cfFetch(`/vectorize/v2/indexes/${INDEX_NAME}/delete-by-ids`, { ids });
}

async function main(): Promise<void> {
  const chunks = await loadAllCorpusChunks();
  console.log(`Corpus: ${chunks.length} chunks from conditions (+ posts when wired).`);

  const allIds: string[] = [];
  for (let i = 0; i < chunks.length; i += BATCH) {
    const batch = chunks.slice(i, i + BATCH);
    const texts = batch.map((c) => c.text);
    const vectors = await embedBatch(texts);
    const records = batch.map((chunk, j) => ({
      id: chunk.id,
      values: vectors[j]!,
      metadata: chunkToVectorMetadata(chunk),
    }));
    await upsertVectors(records);
    allIds.push(...batch.map((c) => c.id));
    console.log(`Upserted ${Math.min(i + BATCH, chunks.length)} / ${chunks.length}`);
  }

  let previous: string[] = [];
  try {
    previous = JSON.parse(await readFile(MANIFEST_PATH, 'utf8')) as string[];
  } catch {
    previous = [];
  }
  const removed = previous.filter((id) => !allIds.includes(id));
  if (removed.length > 0) {
    await deleteByIds(removed);
    console.log(`Deleted ${removed.length} stale vector ids.`);
  }
  await writeFile(MANIFEST_PATH, `${JSON.stringify(allIds, null, 2)}\n`, 'utf8');
  const digest = digestChunks(chunks);
  await writeFile(DIGEST_PATH, `${digest}\n`, 'utf8');
  console.log('Done. Manifest updated at scripts/search-index-manifest.json');
  console.log(`Corpus digest: ${digest}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
