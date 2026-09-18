import {
  contact,
  doctor,
  education,
  fellowships,
  isPlaceholder,
  organizations,
  practiceLocations,
  type Locale,
  type PracticeLocation,
} from '~/config/site.config';
import { canonicalUrl } from '~/utils/site-url';

const locationIsReal = (location: PracticeLocation): boolean => {
  const nameTh = location.name.th;
  const nameEn = location.name.en;
  return !nameTh.includes('TODO(owner)') && !nameEn.includes('TODO(owner)');
};

const medicalBusinessFromLocation = (
  location: PracticeLocation,
  locale: Locale,
): Record<string, unknown> | null => {
  if (!locationIsReal(location)) {
    return null;
  }

  const base: Record<string, unknown> = {
    '@type': 'MedicalBusiness',
    name: locale === 'th' ? location.name.th : location.name.en,
    url: canonicalUrl('/#appointment'),
    address: {
      '@type': 'PostalAddress',
      streetAddress: locale === 'th' ? location.address.th : location.address.en,
    },
    telephone: location.phone,
  };

  if (location.booking === 'bookable-here') {
    base.openingHoursSpecification = {
      '@type': 'OpeningHoursSpecification',
      description: locale === 'th' ? location.hoursSummary.th : location.hoursSummary.en,
    };
  }

  return base;
};

export const buildHomeStructuredDataGraph = (locale: Locale): Record<string, unknown> => {
  const pageUrl = canonicalUrl(locale === 'th' ? '/' : '/en/');

  const physician: Record<string, unknown> = {
    '@type': 'Physician',
    '@id': `${pageUrl}#physician`,
    name: doctor.name[locale],
    alternateName: locale === 'th' ? doctor.name.en : doctor.name.th,
    url: pageUrl,
    email: contact.email,
    medicalSpecialty: 'https://schema.org/Orthopedic',
    jobTitle: doctor.specialty.en,
    alumniOf: {
      '@type': 'CollegeOrUniversity',
      name: 'Srinakharinwirot University',
    },
    hasCredential: [...education, ...fellowships].map((entry) => ({
      '@type': 'EducationalOccupationalCredential',
      name: entry.title.en,
      dateCreated: entry.year,
    })),
    memberOf: organizations.map((org) => ({
      '@type': 'Organization',
      name: org.name.en,
      alternateName: org.abbr,
    })),
    knowsAbout: [
      'Shoulder arthroscopy',
      'Rotator cuff repair',
      'Bankart repair',
      'ACL reconstruction',
      'MPFL reconstruction',
      'Sports medicine',
      'Return to competition',
    ],
  };

  if (!isPlaceholder(contact.phone)) {
    physician.telephone = contact.phone;
  }

  const businesses = practiceLocations
    .map((loc) => medicalBusinessFromLocation(loc, locale))
    .filter((item): item is Record<string, unknown> => item !== null);

  if (businesses.length === 0) {
    return {
      '@context': 'https://schema.org',
      ...physician,
    };
  }

  return {
    '@context': 'https://schema.org',
    '@graph': [physician, ...businesses],
  };
};
