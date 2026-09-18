/** Workers AI embedding model — must match Vectorize index dimensions (1024, cosine). */
export const EMBEDDING_MODEL = '@cf/baai/bge-m3' as const;

/** Instruction-following model for RAG answer formatting only (not for medical facts). */
export const GENERATION_MODEL = '@cf/meta/llama-3.1-8b-instruct-fp8' as const;

/**
 * Minimum Vectorize cosine similarity for a chunk to count as grounded.
 * Chosen conservatively: unrelated queries on this small corpus often score ~0.35–0.50;
 * on-topic FAQ/body matches typically ≥0.62. Adjacent-but-wrong topics tend to land 0.52–0.58.
 */
/** Search results list — slightly permissive so users can browse related sections. */
export const MIN_GROUNDING_SCORE = 0.62;

/** `/api/ask` — stricter; weak matches must not produce clinical-sounding answers. */
/** Just above unrelated orthopaedic queries (~0.61–0.62); lexical anchors block wrong anatomy. */
export const ASK_MIN_GROUNDING_SCORE = 0.635;

/** Top match must exceed the second match by at least this margin when slugs differ (reduces wrong-article answers). */
export const MIN_LEADING_MARGIN = 0.04;

/** Target chunk size for embedding (characters). */
export const CHUNK_TARGET_CHARS = 480;

export const CHUNK_MAX_CHARS = 720;

export const CHUNK_MIN_CHARS = 60;

export const SEARCH_TOP_K = 8;

export const ASK_TOP_K = 6;

export const MAX_QUESTION_LENGTH = 500;

/** `/api/search` — 60 requests/hour per IP. */
export const SEARCH_RATE_LIMIT = { limit: 60, windowSeconds: 3600 } as const;

/** `/api/ask` — 12 requests/hour per IP (Workers AI generation cost). */
export const ASK_RATE_LIMIT = { limit: 12, windowSeconds: 3600 } as const;

export const BOOK_PATH = '/book';
