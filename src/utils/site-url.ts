/**
 * Canonical public origin. Production HTML must never cite apex or workers.dev.
 * `site.config.ts` keeps apex for historical imports; SEO uses www only.
 */
export const CANONICAL_ORIGIN = 'https://www.drpratchaya.com';
export const APEX_HOST = 'drpratchaya.com';
export const CANONICAL_HOST = 'www.drpratchaya.com';

/** Build an absolute URL on the canonical host (path must start with `/`). */
export const canonicalUrl = (pathname: string): string => {
  const path = pathname.startsWith('/') ? pathname : `/${pathname}`;
  return new URL(path, CANONICAL_ORIGIN).href;
};

export const conditionPagePath = (slug: string, locale: 'th' | 'en' = 'th'): string =>
  locale === 'en' ? `/en/conditions/${slug}/` : `/conditions/${slug}/`;

export const conditionCanonicalUrl = (slug: string): string =>
  canonicalUrl(conditionPagePath(slug, 'th'));

export const conditionMarkdownPath = (slug: string): string => `/${slug}.md`;

export const conditionOgImagePath = (slug: string): string => `/og/conditions/${slug}.png`;

export const homeOgImagePath = '/og/home.png';
