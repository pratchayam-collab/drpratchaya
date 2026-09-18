import { getCollection } from 'astro:content';
import { doctor } from '~/config/site.config';
import { conditionSlug } from '~/utils/condition-seo';
import {
  CANONICAL_ORIGIN,
  canonicalUrl,
  conditionMarkdownPath,
  conditionPagePath,
} from '~/utils/site-url';

export const buildLlmsTxt = async (): Promise<string> => {
  const entries = await getCollection('conditions');
  const lines = [
    '# drpratchaya.com',
    '',
    `> ${doctor.name.th} (${doctor.name.en}) — orthopaedic surgeon and sports medicine specialist. Thai clinical articles; English routes are navigation shells only until owner-approved translations exist.`,
    '',
    '## Primary pages',
    `- [Home (Thai)](${canonicalUrl('/')}): credentials, expertise, booking overview`,
    `- [Home (English UI)](${canonicalUrl('/en/')}): English navigation; clinical copy follows site config`,
    `- [Conditions index](${canonicalUrl('/conditions/')}): Thai medical articles`,
    '',
    '## Condition articles (Thai clinical content)',
  ];

  for (const entry of entries) {
    const slug = conditionSlug(entry);
    lines.push(
      `- [${entry.data.conditionNameTh}](${canonicalUrl(conditionPagePath(slug, 'th'))}): Markdown mirror at ${canonicalUrl(conditionMarkdownPath(slug))}`,
    );
  }

  lines.push(
    '',
    '## Machine-readable exports',
    `- Full index: ${CANONICAL_ORIGIN}/llms-full.txt`,
    `- RSS: ${CANONICAL_ORIGIN}/rss.xml`,
    `- Sitemap: ${CANONICAL_ORIGIN}/sitemap.xml`,
    '',
    '## Contact',
    `- Email: dr.pratchaya@gmail.com`,
    `- Booking: ${canonicalUrl('/#appointment')}`,
  );

  return `${lines.join('\n')}\n`;
};

export const buildLlmsFullTxt = async (): Promise<string> => {
  const entries = await getCollection('conditions');
  const sorted = [...entries].sort((a, b) =>
    conditionSlug(a).localeCompare(conditionSlug(b)),
  );

  const blocks: string[] = [
    '# drpratchaya.com — full public corpus index',
    '',
    `Canonical origin: ${CANONICAL_ORIGIN}`,
    '',
  ];

  for (const entry of sorted) {
    const slug = conditionSlug(entry);
    blocks.push(
      `## ${entry.data.conditionNameTh} (${entry.data.conditionNameEn})`,
      `- HTML: ${canonicalUrl(conditionPagePath(slug, 'th'))}`,
      `- Markdown: ${canonicalUrl(conditionMarkdownPath(slug))}`,
      `- Description: ${entry.data.seo.description}`,
      `- Keywords: ${entry.data.seo.keywords}`,
      '',
    );
  }

  blocks.push(
    '## Future posts',
    'News and general articles will appear in this index when published via admin (D1 `posts` table).',
    '',
  );

  return `${blocks.join('\n')}\n`;
};
