/**
 * Single source of truth for every fact on drpratchaya.com.
 *
 * Two rules govern this file:
 *
 * 1. Nothing here may be invented. Every credential, publication, date and
 *    organisation below is transcribed from the reference files in
 *    `doc-gitignored/` or from the owner's verified brief.
 * 2. Anything genuinely unknown is a `todo(...)` placeholder, never a guess.
 *    Placeholders render as a visibly unfilled `[เพิ่มทีหลัง]` chip, so a
 *    missing value is obvious on the page instead of silently plausible.
 *
 * To fill in a placeholder: replace the `todo(...)` call with a real
 * `Bilingual` value (`{ th: '…', en: '…' }`). Search this file for
 * `TODO(owner)` to find every outstanding item.
 */

export type Locale = 'th' | 'en';

/** A string that exists in both languages. Thai is never a fallback for English. */
export interface Bilingual {
  readonly th: string;
  readonly en: string;
}

/**
 * A value the repo owner still has to supply. Carries its own explanation of
 * what data is needed so the requirement travels with the placeholder.
 */
export interface Placeholder {
  readonly kind: 'placeholder';
  /** What the owner needs to provide, in plain language. */
  readonly needs: string;
  readonly label: Bilingual;
}

/** Either a real value or a marked gap. Components must handle both. */
export type Maybe<T> = T | Placeholder;

const todo = (needs: string): Placeholder => ({
  kind: 'placeholder',
  needs,
  label: { th: '[เพิ่มทีหลัง]', en: '[to be added]' },
});

export const isPlaceholder = (value: unknown): value is Placeholder =>
  typeof value === 'object' && value !== null && (value as Placeholder).kind === 'placeholder';

/** Reads a bilingual value, or the placeholder label if the value is a gap. */
export const text = (value: Maybe<Bilingual>, locale: Locale): string =>
  isPlaceholder(value) ? value.label[locale] : value[locale];

// ---------------------------------------------------------------------------
// Identity
// ---------------------------------------------------------------------------

export const doctor = {
  name: { th: 'นพ.ปรัชญา มานพ', en: 'Dr. Pratchaya Manop' } satisfies Bilingual,
  /** Surname-first form used for citations, matching the published byline. */
  citationName: 'Manop P',
  specialty: {
    th: 'ศัลยแพทย์ออร์โธปิดิกส์ · เวชศาสตร์การกีฬา',
    en: 'Orthopaedic Surgeon · Sports Medicine',
  } satisfies Bilingual,
  subSpecialty: {
    th: 'ผู้เชี่ยวชาญการผ่าตัดส่องกล้องข้อไหล่และข้อเข่า',
    en: 'Specialist in shoulder & knee arthroscopy',
  } satisfies Bilingual,
} as const;

export const site = {
  domain: 'drpratchaya.com',
  url: 'https://drpratchaya.com',
  defaultLocale: 'th' as const satisfies Locale,
  locales: ['th', 'en'] as const,
} as const;

/**
 * The 40–60 word answer to "is this the right doctor?". Written to be lifted
 * whole by an answer engine, and assembled only from verified facts.
 */
export const shortAnswer = {
  th:
    'นพ.ปรัชญา มานพ เป็นศัลยแพทย์ออร์โธปิดิกส์เฉพาะทางเวชศาสตร์การกีฬา ' +
    'ผ่าตัดส่องกล้องข้อไหล่และข้อเข่า ได้รับวุฒิบัตรศัลยกรรมออร์โธปิดิกส์ พ.ศ. 2564 (2021) ' +
    'ประกาศนียบัตรเวชศาสตร์การกีฬาจาก IOC ปี 2022 และเวชศาสตร์ฟุตบอลจาก FIFA ปี 2023 ' +
    'ปัจจุบันเป็นแพทย์ประจำทีมชาติ การกีฬาแห่งประเทศไทย ดูแลนักกีฬาใน SEA Games 2023 และ 2025',
  en:
    'Dr. Pratchaya Manop is an orthopaedic surgeon specialising in sports medicine, ' +
    'with a practice centred on shoulder and knee arthroscopy. He holds the Thai Board of ' +
    'Orthopaedic Surgery (2021), the IOC Diploma in Sports Medicine (2022) and the FIFA Diploma ' +
    'in Football Medicine (2023), and serves as a national team physician for the Sports ' +
    'Authority of Thailand, including the SEA Games in 2023 and 2025.',
} satisfies Bilingual;

export const biography = {
  th:
    'นพ.ปรัชญา มานพ เป็นศัลยแพทย์ออร์โธปิดิกส์ผู้เชี่ยวชาญด้านการผ่าตัดส่องกล้องข้อไหล่และข้อเข่า ' +
    'และเวชศาสตร์การกีฬา ปัจจุบันปฏิบัติงานเป็นศัลยแพทย์ประจำและอาจารย์แพทย์ของโครงการฝึกอบรม' +
    'แพทย์ประจำบ้าน สาขาออร์โธปิดิกส์ ได้รับการยอมรับในด้านความเชี่ยวชาญทางคลินิก โดยเฉพาะการดูแล' +
    'นักกีฬาระดับชาติ ทำหน้าที่เป็นแพทย์ประจำทีมใน SEA Games ปี 2023 และ 2025 รวมถึง ' +
    'IWF World Championships 2023 และ World Games 2025',
  en:
    'Dr. Pratchaya Manop is an orthopaedic surgeon specialising in arthroscopic surgery of the ' +
    'shoulder and knee, and in sports medicine. He serves as a staff surgeon and clinical ' +
    'instructor for an Orthopedic Resident Training Program. Recognised for his clinical ' +
    'expertise, particularly in the care of national-level athletes, he has served as team ' +
    'physician at the SEA Games (2023 and 2025), the IWF World Championships (2023) and the ' +
    'World Games (2025).',
} satisfies Bilingual;

// ---------------------------------------------------------------------------
// Credential strip — the only place `--gold` is allowed to appear
// ---------------------------------------------------------------------------

export interface Credential {
  readonly abbr: string;
  readonly title: Bilingual;
  readonly detail: Bilingual;
}

export const credentials: readonly Credential[] = [
  {
    abbr: 'IOC',
    title: { th: 'IOC Diploma', en: 'IOC Diploma' },
    detail: { th: 'เวชศาสตร์การกีฬา · 2022', en: 'Sports Medicine · 2022' },
  },
  {
    abbr: 'FIFA',
    title: { th: 'FIFA Diploma', en: 'FIFA Diploma' },
    detail: { th: 'เวชศาสตร์ฟุตบอล · 2023', en: 'Football Medicine · 2023' },
  },
  {
    abbr: 'SEA',
    title: { th: 'SEA Games', en: 'SEA Games' },
    detail: { th: 'แพทย์ประจำทีมชาติ · 2023 · 2025', en: 'Team Physician · 2023 · 2025' },
  },
  {
    abbr: 'KSES',
    title: { th: 'KSES Traveling Fellowship', en: 'KSES Traveling Fellowship' },
    detail: { th: 'เกาหลีใต้ · 2026', en: 'South Korea · 2026' },
  },
];

// ---------------------------------------------------------------------------
// Curriculum vitae
// ---------------------------------------------------------------------------

export interface CvEntry {
  readonly year: string;
  readonly title: Bilingual;
  readonly org: Maybe<Bilingual>;
  readonly detail?: Bilingual;
}

export const education: readonly CvEntry[] = [
  {
    year: '2022',
    title: {
      th: 'Certificate of Fellowship, Sports Medicine',
      en: 'Certificate of Fellowship, Sports Medicine',
    },
    org: {
      th: 'Thai Orthopedic Society for Sports Medicine (TOSSM)',
      en: 'Thai Orthopedic Society for Sports Medicine (TOSSM)',
    },
  },
  {
    year: '2021',
    title: { th: 'วุฒิบัตรศัลยกรรมออร์โธปิดิกส์', en: 'Thai Board of Orthopaedic Surgery' },
    org: {
      th: 'ราชวิทยาลัยแพทย์ออร์โธปิดิกส์แห่งประเทศไทย (RCOST)',
      en: 'Royal College of Orthopaedic Surgeons of Thailand (RCOST)',
    },
  },
  {
    year: '2016',
    title: { th: 'แพทยศาสตรบัณฑิต (พ.บ.)', en: 'Doctor of Medicine (M.D.)' },
    org: { th: 'มหาวิทยาลัยศรีนครินทรวิโรฒ', en: 'Srinakharinwirot University' },
  },
];

export const fellowships: readonly CvEntry[] = [
  {
    year: '2026',
    title: { th: 'KSES Traveling Fellowship', en: 'KSES Traveling Fellowship' },
    org: {
      th: 'Korean Shoulder & Elbow Society, เกาหลีใต้',
      en: 'Korean Shoulder & Elbow Society, South Korea',
    },
  },
  {
    year: '2023',
    title: {
      th: 'FIFA Diploma in Football Medicine',
      en: 'FIFA Diploma in Football Medicine',
    },
    org: {
      th: 'Fédération Internationale de Football Association',
      en: 'Fédération Internationale de Football Association',
    },
  },
  {
    year: '2022',
    title: { th: 'IOC Diploma in Sports Medicine', en: 'IOC Diploma in Sports Medicine' },
    org: { th: 'International Olympic Committee', en: 'International Olympic Committee' },
  },
];

export const experience: readonly CvEntry[] = [
  {
    year: '2023—',
    title: { th: 'แพทย์ประจำทีมชาติ', en: 'National Team Physician' },
    org: {
      th: 'การกีฬาแห่งประเทศไทย (SAT)',
      en: 'Sports Authority of Thailand (SAT)',
    },
    detail: {
      th: 'SEA Games 2023 และ 2025 · IWF World Championships 2023 · World Games 2025',
      en: 'SEA Games 2023 & 2025 · IWF World Championships 2023 · World Games 2025',
    },
  },
  {
    year: '2022—',
    title: {
      th: 'ศัลยแพทย์ออร์โธปิดิกส์ และอาจารย์แพทย์',
      en: 'Staff Orthopaedic Surgeon & Clinical Instructor',
    },
    // TODO(owner): the employing hospital is not stated in any reference file.
    // Needs: the official name of the hospital or medical school that runs the
    // Orthopedic Resident Training Program, in Thai and English.
    org: todo('Name of the hospital / institution running the Orthopedic Resident Training Program (TH + EN)'),
    detail: {
      th: 'โครงการฝึกอบรมแพทย์ประจำบ้าน สาขาออร์โธปิดิกส์',
      en: 'Orthopedic Resident Training Program',
    },
  },
];

// ---------------------------------------------------------------------------
// Expertise
// ---------------------------------------------------------------------------

export interface Expertise {
  readonly index: string;
  readonly title: Bilingual;
  readonly detail: Bilingual;
}

export const expertise: readonly Expertise[] = [
  {
    index: '01',
    title: { th: 'ผ่าตัดซ่อมเอ็นหัวไหล่', en: 'Rotator Cuff Repair' },
    detail: {
      th: 'ส่องกล้องซ่อมเอ็นหัวไหล่ทุกชนิด Single-row และ Double-row พร้อมประเมินด้วย RoHI',
      en: 'Arthroscopic repair of all rotator cuff tears, single- and double-row, with RoHI assessment',
    },
  },
  {
    index: '02',
    title: { th: 'ส่องกล้องข้อไหล่', en: 'Shoulder Arthroscopy' },
    detail: {
      th: 'SLAP repair · Bankart repair · Subacromial decompression · Knotless pectoralis repair',
      en: 'SLAP repair · Bankart repair · Subacromial decompression · Knotless pectoralis repair',
    },
  },
  {
    index: '03',
    title: { th: 'เวชศาสตร์การกีฬา', en: 'Sports Medicine' },
    detail: {
      th: 'ดูแลนักกีฬาระดับชาติครบวงจร วินิจฉัย รักษา ฟื้นฟู และ return-to-competition',
      en: 'Elite athlete care: diagnosis, treatment, rehabilitation and return-to-competition',
    },
  },
  {
    index: '04',
    title: { th: 'เข่าและเอ็นไขว้', en: 'Knee & Ligament Surgery' },
    detail: {
      th: 'ACL reconstruction · MPFL reconstruction (single patellar tunnel) · Multiligament knee',
      en: 'ACL reconstruction · MPFL reconstruction (single patellar tunnel) · Multiligament knee',
    },
  },
  {
    index: '05',
    title: { th: 'การรักษาแบบไม่ผ่าตัด', en: 'Non-Surgical Treatment' },
    detail: {
      th: 'Hyaluronate · Corticosteroid · PRP สำหรับข้อเสื่อมและการอักเสบ',
      en: 'Intra-articular hyaluronate, corticosteroid and PRP for osteoarthritis and inflammation',
    },
  },
  {
    index: '06',
    title: { th: 'การเรียนการสอน', en: 'Medical Education' },
    detail: {
      th: 'อาจารย์แพทย์ประจำบ้าน บรรยายในงานประชุมทั้งในและต่างประเทศ',
      en: 'Clinical instructor; lecturer at national and international conferences',
    },
  },
];

// ---------------------------------------------------------------------------
// Conditions
//
// `href` points at routes that do not exist yet. The Thai article content is
// preserved in `legacy/` and will be migrated into an Astro content collection
// in a later task, at which point these routes become real.
// ---------------------------------------------------------------------------

export interface Condition {
  readonly slug: string;
  readonly title: Bilingual;
  readonly summary: Bilingual;
}

export const conditions: readonly Condition[] = [
  {
    slug: 'rotator-cuff',
    title: { th: 'เอ็นหัวไหล่ขาด', en: 'Rotator Cuff Tear' },
    summary: {
      th: 'เส้นเอ็นหัวไหล่ที่ขาดจะไม่หายเองและรอยขาดจะขยายใหญ่ขึ้นเรื่อยๆ การผ่าตัดส่องกล้องซ่อมเอ็นให้ผลการรักษาที่ดีในระยะยาว',
      en: 'Rotator cuff tears do not heal on their own and progressively enlarge. Arthroscopic repair provides excellent long-term outcomes.',
    },
  },
  {
    slug: 'shoulder-dislocation',
    title: { th: 'ไหล่หลุด (Bankart Lesion)', en: 'Shoulder Dislocation & Bankart' },
    summary: {
      th: 'ข้อไหล่หลุดซ้ำได้สูงมากในคนอายุน้อย การผ่าตัด Bankart repair ด้วยการส่องกล้องป้องกันการหลุดซ้ำได้ถึง 95%',
      en: 'High recurrence risk in young patients. Arthroscopic Bankart repair prevents re-dislocation in 95% of cases.',
    },
  },
  {
    slug: 'acl',
    title: { th: 'เอ็นไขว้หน้าขาด (ACL Tear)', en: 'ACL Tear' },
    summary: {
      th: 'เอ็นไขว้หน้าที่ขาดไม่สมานกันเอง ต้องผ่าตัดสร้างเส้นเอ็นใหม่ทดแทน เพื่อให้เข่ากลับมามั่นคง',
      en: 'ACL tears cannot heal spontaneously and require reconstruction with a graft to restore knee stability.',
    },
  },
  {
    slug: 'patellofemoral',
    title: { th: 'ข้อสะบ้า (Patellofemoral)', en: 'Patellofemoral Disorders' },
    summary: {
      th: 'สะบ้าหลุดซ้ำ เจ็บเข่าด้านหน้า และข้อสะบ้าเสื่อม รักษาด้วย MPFL reconstruction หรือการฉีด Hyaluronate',
      en: 'Patellar instability, anterior knee pain and patellofemoral OA — treated with MPFL reconstruction or hyaluronate injection.',
    },
  },
];

// ---------------------------------------------------------------------------
// Research
//
// Citations are transcribed verbatim from `doc-gitignored/drpratchaya_v3.html`
// and `doc-gitignored/Dr Pratchaya Website.dc.html`. Do not paraphrase, reorder
// authors, or "tidy" the titles — these are published references.
// ---------------------------------------------------------------------------

export interface Publication {
  readonly year: string;
  readonly title: string;
  /** Verbatim author list. `authorSelf` is emphasised in the rendered citation. */
  readonly authors: string;
  readonly journal: string;
}

/** The author string rendered in bold within each citation. */
export const authorSelf = 'Manop P';

export const publications: readonly Publication[] = [
  {
    year: '2026',
    title:
      'Efficacy of single intra-articular 2% sodium hyaluronate versus corticosteroid injection in isolated patellofemoral osteoarthritis: A double-blind, randomized controlled trial.',
    authors: 'Mekariya K, Manop P, Chernchujit B.',
    journal: 'Journal of ISAKOS',
  },
  {
    year: '2024',
    title:
      'Optimizing pectoralis major tendon repair: a modified knotless suture anchor technique using high-strength suture and tape.',
    authors: 'Manop P, Kongmalai P.',
    journal: 'JSES Reviews, Reports, and Techniques',
  },
  {
    year: '2024',
    title:
      'Suture Repair and Suspensory Button Fixation of Avulsion Fracture of the Fibular Styloid (Arcuate Fracture).',
    authors: 'Srimongkolpitak S, Manop P, Chernchujit B.',
    journal: 'Arthroscopy Techniques',
  },
  {
    year: '2023',
    title:
      'Risk Factors for Rotator Cuff Repair Failure and Reliability of the Rotator Cuff Healing Index (RoHI) in Thai Patients.',
    authors: 'Manop P, Apivatgaroon A, et al.',
    journal: 'Orthopaedic Journal of Sports Medicine',
  },
  {
    year: '2021',
    title:
      'Anatomical Double-Bundle MPFL Reconstruction with Autologous Semitendinosus, a Single Patellar Tunnel Technique.',
    authors: 'Manop P, Apivatgaroon A.',
    journal: 'Arthroscopy Techniques',
  },
  {
    year: '2021',
    title:
      'The Relationship between Plate and Screw to Ulnar Nerve in Distal Humeral Fracture: A Cadaveric Study.',
    authors: 'Manop P, Vilai P.',
    journal: 'Journal of the Medical Association of Thailand',
  },
];

export interface Conference {
  readonly name: string;
  readonly place: string;
  readonly year: string;
  readonly note?: Bilingual;
}

export const conferences: readonly Conference[] = [
  {
    name: 'KSES Traveling Congress',
    place: 'South Korea',
    year: '2023 · 2026',
    note: { th: 'Oral Presentation 2023', en: 'Oral Presentation 2023' },
  },
  { name: 'Isokinetic Conference', place: 'Athens, Greece', year: '2026' },
  { name: 'ISAKOS Congress 2025', place: 'Munich, Germany', year: '2025' },
  {
    name: 'IOC Sports Medicine Workshop & Diploma Course',
    place: 'Oslo, Norway',
    year: '2025',
  },
  { name: '21st ESSKA Congress 2024', place: 'Milan, Italy', year: '2024' },
  {
    name: '18th AFSM Congress & 8th ISN-ISMSSC',
    place: 'Kuala Lumpur, Malaysia',
    year: '2024',
  },
  { name: '20th ROC & 12th PKC 2024', place: 'Pune, India', year: '2024' },
];

// ---------------------------------------------------------------------------
// Professional organisations
// ---------------------------------------------------------------------------

export interface Organization {
  readonly abbr: string;
  readonly name: Bilingual;
  readonly since: string;
  readonly role?: Bilingual;
}

export const organizations: readonly Organization[] = [
  {
    abbr: 'RCOST',
    name: {
      th: 'ราชวิทยาลัยแพทย์ออร์โธปิดิกส์แห่งประเทศไทย',
      en: 'Royal College of Orthopaedic Surgeons of Thailand',
    },
    since: '2021',
    role: { th: 'อนุกรรมการ ตั้งแต่ 2025', en: 'Subcommittee since 2025' },
  },
  {
    abbr: 'TOSSM',
    name: {
      th: 'สมาคมเวชศาสตร์การกีฬาออร์โธปิดิกส์แห่งประเทศไทย',
      en: 'Thai Orthopedic Society for Sports Medicine',
    },
    since: '2022',
    role: { th: 'กรรมการ ตั้งแต่ 2022', en: 'Committee since 2022' },
  },
  {
    abbr: 'SMAT',
    name: {
      th: 'สมาคมเวชศาสตร์การกีฬาแห่งประเทศไทย',
      en: 'Sports Medicine Association of Thailand',
    },
    since: '2023',
  },
  {
    abbr: 'MAT',
    name: { th: 'แพทยสมาคมแห่งประเทศไทย', en: 'Medical Association of Thailand' },
    since: '2022',
  },
  {
    abbr: 'MCT',
    name: { th: 'แพทยสภา', en: 'Medical Council of Thailand' },
    since: '2016',
  },
];

// ---------------------------------------------------------------------------
// Contact and appointments
//
// Almost everything in this block is still unknown. These are the highest
// priority values for the owner to fill in, because the site's primary job is
// to get a patient from "is this the right doctor?" to a booked appointment.
// ---------------------------------------------------------------------------

export const contact = {
  email: 'dr.pratchaya@gmail.com',

  // TODO(owner): no appointment telephone number exists in any reference file.
  // Needs: the number a patient should call to book, in +66 international form,
  // plus who answers it (the doctor's secretary, or the hospital call centre).
  phone: todo('Appointment phone number in +66 format, and who answers it'),

  // TODO(owner): no LINE Official Account has been created or recorded.
  // Needs: the LINE OA ID (including the leading @) and its https://line.me/R/ti/p/ URL.
  lineOfficialAccount: todo('LINE Official Account ID (with leading @) and its line.me invite URL'),

  // TODO(owner): the booking destination is undecided.
  // Needs: either a booking URL, or a decision that booking happens by phone or
  // LINE only. Until this is set, the "book" action falls back to the contact
  // section anchor.
  bookingUrl: todo('Booking URL, or a decision that booking is by phone / LINE only'),
} as const;

/** Sample bookable slot — mirrors `scripts/seed-dev-booking-fixtures.sql` (local dev only). */
export interface BookableSlot {
  readonly startsAtLabel: Bilingual;
  /** Future SSR booking route; `#contact` until the flow ships. */
  readonly bookHref: string;
}

/** Appointments can be requested on-site when `booking` is `bookable-here`. */
export interface BookablePracticeLocation {
  readonly booking: 'bookable-here';
  readonly name: Bilingual;
  readonly address: Bilingual;
  readonly mapUrl: string;
  readonly phone: string;
  readonly hoursSummary: Bilingual;
  readonly availableSlots: readonly BookableSlot[];
}

/** Hospital-only booking — never show time slots we cannot honour. */
export interface ExternalPracticeLocation {
  readonly booking: 'book-via-hospital';
  readonly name: Bilingual;
  readonly address: Bilingual;
  readonly mapUrl: string;
  readonly phone: string;
  readonly externalChannelLabel: Bilingual;
  readonly externalPhone: string;
  readonly externalLineId: string;
  readonly externalBookingUrl: string;
}

export type PracticeLocation = BookablePracticeLocation | ExternalPracticeLocation;

/**
 * Placeholder locations for UI development (see scripts/seed-dev-booking-fixtures.sql).
 * TODO(owner): replace names, addresses, phones, and channels before go-live.
 */
export const practiceLocations: readonly PracticeLocation[] = [
  {
    booking: 'bookable-here',
    name: {
      th: 'TODO(owner) โรงพยาบาลตัวอย่าง A',
      en: 'TODO(owner) Example Hospital A',
    },
    address: {
      th: 'TODO(owner) ที่อยู่ตัวอย่าง กรุงเทพฯ',
      en: 'TODO(owner) Example address, Bangkok',
    },
    mapUrl: 'https://example.invalid/map/hospital-a',
    phone: '+66000000001',
    hoursSummary: {
      th: 'พุธ 17:00–20:00 น. (ตัวอย่าง)',
      en: 'Wednesdays 17:00–20:00 (sample)',
    },
    availableSlots: [
      {
        startsAtLabel: {
          th: 'ดูช่วงเวลาที่ว่างในระบบจอง',
          en: 'View available times in the booking flow',
        },
        bookHref: '/book',
      },
    ],
  },
  {
    booking: 'book-via-hospital',
    name: {
      th: 'TODO(owner) คลินิกตัวอย่าง B',
      en: 'TODO(owner) Example Clinic B',
    },
    address: {
      th: 'TODO(owner) ที่อยู่ตัวอย่าง นนทบุรี',
      en: 'TODO(owner) Example address, Nonthaburi',
    },
    mapUrl: 'https://example.invalid/map/clinic-b',
    phone: '+66000000002',
    externalChannelLabel: {
      th: 'โทรศัพท์โรงพยาบาล (ตัวอย่าง)',
      en: 'Hospital call centre (sample)',
    },
    externalPhone: '+66000000099',
    externalLineId: '@example-line-placeholder',
    externalBookingUrl: 'https://example.invalid/booking/clinic-b',
  },
];

/**
 * TODO(owner): there are no patient testimonials yet.
 *
 * Needs: written, consented testimonials. Nothing may be published here without
 * explicit patient consent, and no identifying clinical detail may appear.
 * While this array is empty the homepage renders an obvious empty placeholder.
 */
export const testimonials: readonly { readonly quote: Bilingual; readonly attribution: Bilingual }[] = [];

// ---------------------------------------------------------------------------
// Navigation
// ---------------------------------------------------------------------------

export interface NavItem {
  readonly hash: string;
  readonly label: Bilingual;
}

export const nav: readonly NavItem[] = [
  { hash: '#about', label: { th: 'เกี่ยวกับผม', en: 'About' } },
  { hash: '#appointment', label: { th: 'นัดหมาย', en: 'Appointments' } },
  { hash: '#expertise', label: { th: 'ความเชี่ยวชาญ', en: 'Expertise' } },
  { hash: '#conditions', label: { th: 'โรคและการรักษา', en: 'Conditions' } },
  { hash: '#research', label: { th: 'งานวิจัย', en: 'Research' } },
  { hash: '#organizations', label: { th: 'องค์กร', en: 'Organizations' } },
  { hash: '#contact', label: { th: 'ติดต่อ', en: 'Contact' } },
];
