import { conditionPagePath } from '~/utils/site-url';
import type { CorpusSourceType } from '~/lib/search/types';

/** Public path for a corpus document (Thai primary routes). */
export function corpusDocumentPath(sourceType: CorpusSourceType, slug: string): string {
  if (sourceType === 'condition') return conditionPagePath(slug, 'th');
  // Future D1 posts — align with admin publish routes when wired.
  return `/posts/${slug}/`;
}
