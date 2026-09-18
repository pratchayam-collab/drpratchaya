import type { CollectionEntry } from 'astro:content';
import { doctor } from '~/config/site.config';
import {
  canonicalUrl,
  conditionMarkdownPath,
  conditionPagePath,
} from '~/utils/site-url';
import { conditionSlug } from '~/utils/condition-seo';

type ConditionEntry = CollectionEntry<'conditions'>;

export const buildConditionMarkdownDocument = (entry: ConditionEntry): string => {
  const slug = conditionSlug(entry);
  const { data, body } = entry;
  const htmlUrl = canonicalUrl(conditionPagePath(slug, 'th'));

  const header = [
    '---',
    `title: "${data.title.replaceAll('"', '\\"')}"`,
    `canonical: ${htmlUrl}`,
    `lang: th`,
    `source_html: ${htmlUrl}`,
    `markdown_url: ${canonicalUrl(conditionMarkdownPath(slug))}`,
    `author: ${doctor.name.th}`,
    '---',
    '',
    `# ${data.title}`,
    '',
    `> Canonical page: ${htmlUrl}`,
    '',
  ].join('\n');

  return `${header}${(body ?? '').trim()}\n`;
};
