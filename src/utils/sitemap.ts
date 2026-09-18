import fs from 'node:fs';
import path from 'node:path';
import { getCollection } from 'astro:content';
import { conditionSlug } from '~/utils/condition-seo';
import { canonicalUrl, conditionPagePath } from '~/utils/site-url';

export interface SitemapUrl {
  loc: string;
  lastmod?: string;
}

/**
 * D1-published posts (news/general). Wired when `posts` is populated; returns
 * empty today so sitemap stays build-time static without touching DB.
 */
export const getPublishedPostSitemapUrls = async (
  _db?: CloudflareEnv['DB'],
): Promise<SitemapUrl[]> => {
  if (!_db) {
    return [];
  }
  // Future: SELECT slug, updated_at FROM posts WHERE status = 'published'
  return [];
};

const fileLastMod = (relativePath: string): string | undefined => {
  try {
    const stat = fs.statSync(path.join(process.cwd(), relativePath));
    return stat.mtime.toISOString().split('T')[0];
  } catch {
    return undefined;
  }
};

export const getStaticSitemapUrls = async (): Promise<SitemapUrl[]> => {
  const buildDate = new Date().toISOString().split('T')[0];
  const urls: SitemapUrl[] = [
    { loc: canonicalUrl('/'), lastmod: fileLastMod('src/pages/index.astro') ?? buildDate },
    { loc: canonicalUrl('/en/'), lastmod: fileLastMod('src/pages/en/index.astro') ?? buildDate },
    {
      loc: canonicalUrl('/conditions/'),
      lastmod: fileLastMod('src/pages/conditions/index.astro') ?? buildDate,
    },
    {
      loc: canonicalUrl('/en/conditions/'),
      lastmod: fileLastMod('src/pages/en/conditions/index.astro') ?? buildDate,
    },
  ];

  const entries = await getCollection('conditions');
  for (const entry of entries) {
    const slug = conditionSlug(entry);
    const mdPath = `src/content/conditions/${slug}.md`;
    const lastmod = fileLastMod(mdPath) ?? buildDate;
    urls.push({
      loc: canonicalUrl(conditionPagePath(slug, 'th')),
      lastmod,
    });
    urls.push({
      loc: canonicalUrl(conditionPagePath(slug, 'en')),
      lastmod,
    });
  }

  return urls;
};

export const buildSitemapXml = (urls: SitemapUrl[]): string => {
  const body = urls
    .map(
      (entry) =>
        `  <url>\n    <loc>${escapeXml(entry.loc)}</loc>${
          entry.lastmod ? `\n    <lastmod>${entry.lastmod}</lastmod>` : ''
        }\n  </url>`,
    )
    .join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${body}\n</urlset>\n`;
};

const escapeXml = (value: string): string =>
  value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');

export const collectSitemapUrls = async (db?: CloudflareEnv['DB']): Promise<SitemapUrl[]> => {
  const staticUrls = await getStaticSitemapUrls();
  const postUrls = await getPublishedPostSitemapUrls(db);
  return [...staticUrls, ...postUrls];
};
