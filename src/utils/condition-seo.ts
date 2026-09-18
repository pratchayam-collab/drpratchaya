/**
 * Structured data for condition articles — values transcribed from legacy HTML
 * per `docs/content-migration-notes.md`.
 */
import { doctor, type Locale } from '~/config/site.config';
import type { CollectionEntry } from 'astro:content';
import { canonicalUrl, conditionCanonicalUrl } from '~/utils/site-url';

type ConditionEntry = CollectionEntry<'conditions'>;

const conditionAboutEn: Record<string, string> = {
  acl: 'Anterior Cruciate Ligament Tear',
  'rotator-cuff': 'Rotator Cuff Tear',
  'shoulder-dislocation': 'Shoulder Dislocation',
  patellofemoral: 'Patellofemoral Disorder',
};

const pageDescription: Record<string, string> = {
  acl: 'ข้อมูลครบเรื่องเอ็นไขว้หน้าขาด อาการ การวินิจฉัย การผ่าตัด ACL reconstruction และการฟื้นฟู',
  'rotator-cuff': 'ข้อมูลครบเรื่องเอ็นหัวไหล่ขาด อาการ การวินิจฉัย การผ่าตัด และการฟื้นฟู',
  'shoulder-dislocation':
    'ข้อมูลครบเรื่องไหล่หลุด Bankart lesion การผ่าตัดส่องกล้อง Bankart repair และการฟื้นฟู',
  patellofemoral:
    'ข้อมูลครบเรื่องปัญหาข้อสะบ้า สะบ้าหลุด MPFL reconstruction และการรักษาข้อสะบ้าเสื่อม',
};

export const conditionSlug = (entry: ConditionEntry): string =>
  entry.id.replace(/\.md$/, '');

export const buildMedicalWebPageJsonLd = (
  entry: ConditionEntry,
  locale: Locale,
): Record<string, unknown> => {
  const slug = conditionSlug(entry);
  const { data } = entry;
  const aboutName = conditionAboutEn[slug] ?? data.conditionNameEn;
  const pageUrl = conditionCanonicalUrl(slug);
  const shortAnswer = data.shortAnswer.trim();

  const page: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'MedicalWebPage',
    name: data.title,
    description: pageDescription[slug] ?? data.description,
    url: pageUrl,
    inLanguage: 'th-TH',
    author: {
      '@type': 'Physician',
      name: doctor.name.th,
      url: canonicalUrl('/'),
    },
    about: {
      '@type': 'MedicalCondition',
      name: aboutName,
      alternateName: data.conditionNameTh,
    },
  };

  if (slug === 'acl') {
    page.medicalAudience = { '@type': 'Patient' };
  }

  if (locale === 'en') {
    page.author = {
      '@type': 'Physician',
      name: doctor.name.en,
      url: canonicalUrl('/en/'),
    };
  }

  if (shortAnswer.length > 0) {
    page.speakable = {
      '@type': 'SpeakableSpecification',
      cssSelector: ['.short-answer-text', 'h1.article-title'],
    };
  }

  return page;
};

export const buildBreadcrumbJsonLd = (entry: ConditionEntry): Record<string, unknown> => {
  const { data } = entry;
  const slug = conditionSlug(entry);

  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'หน้าแรก',
        item: canonicalUrl('/'),
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: 'โรคและการรักษา',
        item: canonicalUrl('/conditions/'),
      },
      {
        '@type': 'ListItem',
        position: 3,
        name: data.conditionNameTh,
        item: conditionCanonicalUrl(slug),
      },
    ],
  };
};

export const buildFaqPageJsonLd = (entry: ConditionEntry): Record<string, unknown> => ({
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: entry.data.faq.map((item) => ({
    '@type': 'Question',
    name: item.question,
    acceptedAnswer: {
      '@type': 'Answer',
      text: item.answer,
    },
  })),
});
