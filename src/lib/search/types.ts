export type CorpusSourceType = 'condition' | 'post';

export type ChunkKind = 'shortAnswer' | 'faq' | 'body' | 'post';

export interface ChunkRecord {
  id: string;
  sourceType: CorpusSourceType;
  slug: string;
  title: string;
  section: string;
  sectionTitle: string;
  kind: ChunkKind;
  text: string;
  /** Site path, e.g. `/conditions/acl/` */
  path: string;
}

export interface VectorChunkMetadata {
  sourceType: CorpusSourceType;
  slug: string;
  title: string;
  section: string;
  sectionTitle: string;
  kind: ChunkKind;
  path: string;
  text: string;
}

export interface SearchHit {
  id: string;
  score: number;
  slug: string;
  title: string;
  section: string;
  sectionTitle: string;
  kind: ChunkKind;
  path: string;
  excerpt: string;
  url: string;
}

export interface AskCitation {
  slug: string;
  title: string;
  path: string;
  url: string;
  /** Verbatim excerpt from the article used in the answer. */
  quote: string;
}

export type AskOutcome = 'answered' | 'refused';

export interface AskResponseBody {
  ok: true;
  outcome: AskOutcome;
  answer?: string;
  citations?: AskCitation[];
  message?: string;
  bookPath: string;
}
