/**
 * CI gate: corpus chunk ids must match the committed Vectorize manifest, and the
 * corpus digest must match the digest written by the last `npm run index:search`.
 *
 * Catches clinical Markdown edits that were not re-indexed (silent stale search).
 */
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { loadAllCorpusChunks } from '../src/lib/search/corpus-build.ts';

const MANIFEST_PATH = path.join(process.cwd(), 'scripts/search-index-manifest.json');
const DIGEST_PATH = path.join(process.cwd(), 'scripts/search-corpus-digest.txt');

function digestChunks(chunks: { id: string; text: string }[]): string {
  const payload = chunks
    .map((c) => `${c.id}\0${c.text}`)
    .sort()
    .join('\n');
  return createHash('sha256').update(payload, 'utf8').digest('hex');
}

async function main(): Promise<void> {
  const chunks = await loadAllCorpusChunks();
  const ids = chunks.map((c) => c.id).sort();
  const digest = digestChunks(chunks);

  let manifestIds: string[] = [];
  try {
    manifestIds = JSON.parse(await readFile(MANIFEST_PATH, 'utf8')) as string[];
  } catch {
    throw new Error(`Missing or invalid ${MANIFEST_PATH}. Run npm run index:search.`);
  }
  manifestIds.sort();

  if (ids.length !== manifestIds.length || ids.some((id, i) => id !== manifestIds[i])) {
    console.error(
      'Search index manifest is out of date with src/content/conditions.\n' +
        `  Corpus chunks: ${ids.length}, manifest: ${manifestIds.length}\n` +
        '  Run: npm run index:search and commit scripts/search-index-manifest.json',
    );
    process.exit(1);
  }

  let committedDigest = '';
  try {
    committedDigest = (await readFile(DIGEST_PATH, 'utf8')).trim();
  } catch {
    throw new Error(`Missing ${DIGEST_PATH}. Run npm run index:search.`);
  }

  if (digest !== committedDigest) {
    console.error(
      'Search corpus digest does not match committed digest (content changed without re-index).\n' +
        `  Expected: ${committedDigest}\n  Actual:   ${digest}\n` +
        '  Run: npm run index:search and commit scripts/search-corpus-digest.txt',
    );
    process.exit(1);
  }

  console.log(`Search corpus OK (${ids.length} chunks, digest ${digest.slice(0, 12)}…).`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
