import { env } from 'cloudflare:workers';

/** Bump monotonic cache tag versions (design spec §4 CACHE_TAGS KV). */
export async function bumpCacheTags(tags: string[]): Promise<void> {
  const kv = env.CACHE_TAGS;
  if (!kv || tags.length === 0) return;
  for (const tag of tags) {
    const current = await kv.get(tag);
    const next = String((Number.parseInt(current ?? '0', 10) || 0) + 1);
    await kv.put(tag, next);
  }
}

export function postCacheTags(slug: string, language: 'th' | 'en'): string[] {
  return ['posts:list', `posts:${language}`, `post:${language}:${slug}`, 'rss', 'sitemap'];
}
