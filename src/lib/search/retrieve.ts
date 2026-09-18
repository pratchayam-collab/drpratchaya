import { embedQuery } from '~/lib/search/embed';
import type { SearchHit, VectorChunkMetadata } from '~/lib/search/types';
import { canonicalUrl } from '~/utils/site-url';

function metadataFromMatch(
  meta: Record<string, VectorizeVectorMetadataValue> | VectorizeVectorMetadata | undefined,
): VectorChunkMetadata | null {
  if (!meta) return null;
  const flat = meta as Record<string, VectorizeVectorMetadataValue>;
  const text = flat.text;
  const slug = flat.slug;
  const title = flat.title;
  const path = flat.path;
  if (
    typeof text !== 'string' ||
    typeof slug !== 'string' ||
    typeof title !== 'string' ||
    typeof path !== 'string'
  ) {
    return null;
  }
  return {
    sourceType: (flat.sourceType as VectorChunkMetadata['sourceType']) ?? 'condition',
    slug,
    title,
    section: String(flat.section ?? ''),
    sectionTitle: String(flat.sectionTitle ?? ''),
    kind: (flat.kind as VectorChunkMetadata['kind']) ?? 'body',
    path,
    text,
  };
}

function excerpt(text: string, max = 220): string {
  const normalized = text.replace(/\s+/g, ' ').trim();
  if (normalized.length <= max) return normalized;
  return `${normalized.slice(0, max - 1)}…`;
}

export async function semanticSearch(
  ai: Ai,
  index: VectorizeIndex,
  query: string,
  topK: number,
): Promise<SearchHit[]> {
  const vector = await embedQuery(ai, query);
  const { matches } = await index.query(vector, {
    topK,
    returnMetadata: 'all',
  });

  const hits: SearchHit[] = [];
  for (const match of matches) {
    const parsed = metadataFromMatch(
      match.metadata as Record<string, VectorizeVectorMetadataValue> | undefined,
    );
    if (!parsed || match.score === undefined) continue;
    hits.push({
      id: match.id,
      score: match.score,
      slug: parsed.slug,
      title: parsed.title,
      section: parsed.section,
      sectionTitle: parsed.sectionTitle,
      kind: parsed.kind,
      path: parsed.path,
      excerpt: excerpt(parsed.text),
      url: canonicalUrl(parsed.path),
    });
  }
  return hits;
}

export async function retrieveChunks(
  ai: Ai,
  index: VectorizeIndex,
  query: string,
  topK: number,
): Promise<{ hits: SearchHit[]; chunks: VectorChunkMetadata[]; scores: number[] }> {
  const vector = await embedQuery(ai, query);
  const { matches } = await index.query(vector, {
    topK,
    returnMetadata: 'all',
  });

  const hits: SearchHit[] = [];
  const chunks: VectorChunkMetadata[] = [];
  const scores: number[] = [];

  for (const match of matches) {
    const parsed = metadataFromMatch(
      match.metadata as Record<string, VectorizeVectorMetadataValue> | undefined,
    );
    if (!parsed || match.score === undefined) continue;
    scores.push(match.score);
    chunks.push(parsed);
    hits.push({
      id: match.id,
      score: match.score,
      slug: parsed.slug,
      title: parsed.title,
      section: parsed.section,
      sectionTitle: parsed.sectionTitle,
      kind: parsed.kind,
      path: parsed.path,
      excerpt: excerpt(parsed.text),
      url: canonicalUrl(parsed.path),
    });
  }

  return { hits, chunks, scores };
}
