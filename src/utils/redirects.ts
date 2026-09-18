import { CANONICAL_ORIGIN, conditionPagePath } from '~/utils/site-url';

/** Condition slugs aligned with `src/content/conditions/*.md`. */
export const CONDITION_SLUGS = [
  'acl',
  'rotator-cuff',
  'shoulder-dislocation',
  'patellofemoral',
] as const;

export type ConditionSlug = (typeof CONDITION_SLUGS)[number];

const conditionTarget = (slug: ConditionSlug): string => conditionPagePath(slug, 'th');

/** Legacy `.html` filenames from the pre-Astro Worker upload. */
export const LEGACY_HTML_REDIRECTS: Readonly<Record<string, string>> = {
  '/index.html': '/',
  '/acl.html': conditionTarget('acl'),
  '/rotator-cuff.html': conditionTarget('rotator-cuff'),
  '/shoulder-dislocation.html': conditionTarget('shoulder-dislocation'),
  '/patellofemoral.html': conditionTarget('patellofemoral'),
};

/**
 * Short canonical URLs declared in legacy `<link rel="canonical">` (July 2025–2026).
 * 301 to `/conditions/{slug}/` so equity consolidates on the v2 route tree.
 */
export const LEGACY_SHORT_SLUG_REDIRECTS: Readonly<Record<string, string>> = {
  '/acl': conditionTarget('acl'),
  '/rotator-cuff': conditionTarget('rotator-cuff'),
  '/shoulder-dislocation': conditionTarget('shoulder-dislocation'),
  '/patellofemoral': conditionTarget('patellofemoral'),
};

const normalizePath = (pathname: string): string => {
  if (pathname.length > 1 && pathname.endsWith('/')) {
    return pathname.slice(0, -1);
  }
  return pathname;
};

/** Path migrations only (safe during static prerender when `site` is still apex). */
export const resolvePathMigration = (requestUrl: URL): string | null => {
  const { pathname } = requestUrl;
  const bare = normalizePath(pathname);

  if (pathname in LEGACY_HTML_REDIRECTS) {
    return LEGACY_HTML_REDIRECTS[pathname]!;
  }
  if (LEGACY_HTML_REDIRECTS[bare]) {
    return LEGACY_HTML_REDIRECTS[bare]!;
  }
  if (LEGACY_SHORT_SLUG_REDIRECTS[bare]) {
    return LEGACY_SHORT_SLUG_REDIRECTS[bare]!;
  }

  if (bare === '/conditions' && pathname !== '/conditions/') {
    return '/conditions/';
  }
  if (bare === '/en/conditions' && pathname !== '/en/conditions/') {
    return '/en/conditions/';
  }
  for (const slug of CONDITION_SLUGS) {
    if (bare === `/conditions/${slug}` && !pathname.endsWith('/')) {
      return conditionTarget(slug);
    }
    if (bare === `/en/conditions/${slug}` && !pathname.endsWith('/')) {
      return `/en/conditions/${slug}/`;
    }
  }

  return null;
};

export const resolveSiteRedirect = (requestUrl: URL): string | null => {
  const migratedPath = resolvePathMigration(requestUrl);
  const needsApexToWww = requestUrl.hostname === 'drpratchaya.com';

  if (!migratedPath && !needsApexToWww) {
    return null;
  }

  const pathname = migratedPath ?? requestUrl.pathname;
  return `${CANONICAL_ORIGIN}${pathname}${requestUrl.search}`;
};

/** Lines for `public/_redirects` (Workers static assets redirect engine). */
export const staticRedirectFileLines = (): string[] => {
  const lines: string[] = [
    '# Legacy Worker HTML filenames → v2 condition routes',
    ...Object.entries(LEGACY_HTML_REDIRECTS).map(
      ([from, to]) => `${from} ${to} 301`,
    ),
    '',
    '# Legacy short slugs (old canonical shape) → /conditions/{slug}/',
    ...Object.entries(LEGACY_SHORT_SLUG_REDIRECTS).map(
      ([from, to]) => `${from} ${to} 301`,
    ),
    ...Object.entries(LEGACY_SHORT_SLUG_REDIRECTS).map(
      ([from, to]) => `${from}/ ${to} 301`,
    ),
    '/conditions /conditions/ 301',
    '/en/conditions /en/conditions/ 301',
  ];

  for (const slug of CONDITION_SLUGS) {
    lines.push(`/conditions/${slug} ${conditionTarget(slug)} 301`);
    lines.push(`/en/conditions/${slug} /en/conditions/${slug}/ 301`);
  }

  lines.push('', `# Canonical origin: ${CANONICAL_ORIGIN} (apex→www handled in middleware)`);
  return lines;
};
