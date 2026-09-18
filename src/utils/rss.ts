import { getCollection } from 'astro:content';
import { conditionSlug } from '~/utils/condition-seo';
import {
  CANONICAL_ORIGIN,
  canonicalUrl,
  conditionPagePath,
} from '~/utils/site-url';

export interface RssItem {
  title: string;
  link: string;
  description: string;
  pubDate: string;
  guid: string;
}

export const getConditionRssItems = async (): Promise<RssItem[]> => {
  const entries = await getCollection('conditions');
  return entries
    .map((entry) => {
      const slug = conditionSlug(entry);
      const link = canonicalUrl(conditionPagePath(slug, 'th'));
      return {
        title: entry.data.seo.title,
        link,
        description: entry.data.seo.description,
        pubDate: new Date(`${entry.data.publishedYear}-01-01T00:00:00Z`).toUTCString(),
        guid: link,
      };
    })
    .sort((a, b) => Date.parse(b.pubDate) - Date.parse(a.pubDate));
};

/**
 * Future: merge D1 `posts` RSS items here when the table is populated.
 */
export const getPublishedPostRssItems = async (_db?: CloudflareEnv['DB']): Promise<RssItem[]> => [];

export const buildRssXml = (items: RssItem[]): string => {
  const channelTitle = 'นพ.ปรัชญา มานพ — ข้อมูลโรคและการรักษา';
  const channelLink = canonicalUrl('/');
  const channelDescription =
    'บทความทางการแพทย์ภาษาไทยเรื่องโรคที่รักษา โดยศัลยแพทย์ออร์โธปิดิกส์เวชศาสตร์การกีฬา';

  const itemXml = items
    .map(
      (item) => `    <item>
      <title>${escapeXml(item.title)}</title>
      <link>${escapeXml(item.link)}</link>
      <guid isPermaLink="true">${escapeXml(item.guid)}</guid>
      <description>${escapeXml(item.description)}</description>
      <pubDate>${item.pubDate}</pubDate>
    </item>`,
    )
    .join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${escapeXml(channelTitle)}</title>
    <link>${escapeXml(channelLink)}</link>
    <description>${escapeXml(channelDescription)}</description>
    <language>th-TH</language>
    <atom:link href="${escapeXml(`${CANONICAL_ORIGIN}/rss.xml`)}" rel="self" type="application/rss+xml"/>
${itemXml}
  </channel>
</rss>
`;
};

const escapeXml = (value: string): string =>
  value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');

export const collectRssItems = async (db?: CloudflareEnv['DB']): Promise<RssItem[]> => {
  const conditions = await getConditionRssItems();
  const posts = await getPublishedPostRssItems(db);
  return [...conditions, ...posts].sort((a, b) => Date.parse(b.pubDate) - Date.parse(a.pubDate));
};
