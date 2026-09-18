/**
 * Interface copy. Facts live in `src/config/site.config.ts`; this file holds
 * only labels, headings and instructional text.
 *
 * Thai labels are kept short — Thai runs longer than English at the same
 * type size, and these strings sit in tight places like the mobile dock.
 */
import type { Locale } from '~/config/site.config';

export const ui = {
  th: {
    skipToContent: 'ข้ามไปที่เนื้อหาหลัก',
    langSwitchLabel: 'เปลี่ยนภาษา',
    thai: 'ไทย',
    english: 'EN',
    menu: 'เมนู',

    book: 'นัดหมาย',
    call: 'โทร',
    line: 'LINE',
    bookConsultation: 'นัดหมายปรึกษา',
    viewCv: 'ประวัติและผลงาน',

    aboutKicker: 'เกี่ยวกับผม',
    aboutHeading: 'ประวัติและการฝึกอบรม',
    educationHeading: 'การศึกษาและวุฒิบัตร',
    fellowshipsHeading: 'Fellowships และการอบรมนานาชาติ',
    experienceHeading: 'ประสบการณ์',

    credentialsKicker: 'วุฒิบัตรนานาชาติ',

    appointmentKicker: 'นัดหมาย',
    appointmentHeading: 'เลือกสถานที่และช่องทางนัดหมาย',
    appointmentIntro:
      'แต่ละสถานที่มีช่องทางนัดหมายไม่เหมือนกัน — บางแห่งจองผ่านเว็บไซต์นี้ได้ บางแห่งต้องติดต่อโรงพยาบาลโดยตรง',
    bookableHereNote: 'จองผ่านเว็บไซต์นี้ได้ (ตัวอย่างช่วงเวลา)',
    bookViaHospitalNote: 'นัดหมายผ่านช่องทางของโรงพยาบาลเท่านั้น — ไม่มีช่วงเวลาในระบบนี้',
    chooseSlot: 'เลือกเวลา',
    bookingPendingNote:
      'คำขอนัดหมายยังไม่ใช่การยืนยัน — ทีมงานจะติดต่อกลับหลังส่งคำขอ (ระบบจองเต็มรูปแบบจะเปิดใช้ในขั้นถัดไป)',
    noSlotsExternalNote: 'ไม่แสดงช่วงเวลาว่าง เพราะการนัดหมายต้องทำผ่านโรงพยาบาลโดยตรง',
    viewMap: 'ดูแผนที่',
    externalBookingLabel: 'จองออนไลน์',
    openHospitalBooking: 'เปิดหน้าจองของโรงพยาบาล',

    conditionsIndexTitle: 'โรคและการรักษา — นพ.ปรัชญา มานพ',
    conditionsIndexDescription:
      'ข้อมูลโรคที่รักษา อาการ การวินิจฉัย และแนวทางการรักษา โดยศัลยแพทย์ออร์โธปิดิกส์เวชศาสตร์การกีฬา',
    conditionsIndexHeading: 'ข้อมูลโรคที่รักษา',
    conditionsIndexIntro: 'บทความทางการแพทย์ภาษาไทย — อ่านรายละเอียดแต่ละโรคด้านล่าง',
    shortAnswerLabel: 'คำตอบสั้น',
    faqHeading: 'คำถามที่พบบ่อย',
    onThisPage: 'ในหน้านี้',
    backToConditions: 'กลับไปรายการโรค',
    thaiArticleNotice: '',
    englishArticleNotice:
      'บทความนี้มีเฉพาะภาษาไทย — เนื้อหาทางการแพทย์ด้านล่างเป็นภาษาไทยทั้งหมด',
    devMissingShortAnswer: 'TODO(owner): shortAnswer ว่าง — ต้องเติมก่อนเผยแพร่',

    expertiseKicker: 'ความเชี่ยวชาญ',
    expertiseHeading: 'สาขาที่เชี่ยวชาญ',

    conditionsKicker: 'โรคและการรักษา',
    conditionsHeading: 'ข้อมูลโรคที่รักษา',
    conditionsIntro: 'ทำความเข้าใจอาการ สาเหตุ และแนวทางการรักษาที่เหมาะสมกับคุณ',
    readMore: 'อ่านเพิ่มเติม',

    researchKicker: 'งานวิจัยและวิชาการ',
    researchHeading: 'งานวิจัยและการประชุมวิชาการ',
    publicationsHeading: 'งานวิจัยตีพิมพ์',
    conferencesHeading: 'การประชุมนานาชาติ',

    organizationsKicker: 'สมาชิกภาพ',
    organizationsHeading: 'องค์กรวิชาชีพ',
    memberSince: 'สมาชิกตั้งแต่',

    testimonialsHeading: 'เสียงจากผู้ป่วย',
    testimonialsEmpty:
      'ยังไม่มีการเผยแพร่ความเห็นจากผู้ป่วย ส่วนนี้จะเพิ่มเนื้อหาเมื่อได้รับความยินยอมเป็นลายลักษณ์อักษรจากผู้ป่วยแล้ว',

    contactKicker: 'ติดต่อและนัดหมาย',
    contactHeading: 'นัดหมายปรึกษา',
    contactIntro: 'ติดต่อได้โดยตรงตามช่องทางด้านล่าง',
    emailLabel: 'อีเมล',
    phoneLabel: 'โทรศัพท์',
    lineLabel: 'LINE Official',
    locationLabel: 'สถานที่ออกตรวจ',
    hoursLabel: 'วันและเวลาออกตรวจ',

    privacyPolicy: 'นโยบายความเป็นส่วนตัว',
    footerRights: 'สงวนลิขสิทธิ์',
    footerDisclaimer:
      'ข้อมูลบนเว็บไซต์นี้มีวัตถุประสงค์เพื่อให้ความรู้ทั่วไป ไม่ใช่การวินิจฉัยหรือคำแนะนำทางการแพทย์เฉพาะบุคคล กรุณาปรึกษาแพทย์เพื่อประเมินอาการของคุณ',

    homeTitle: 'นพ.ปรัชญา มานพ — ศัลยแพทย์ออร์โธปิดิกส์ เวชศาสตร์การกีฬา',
    homeDescription:
      'ศัลยแพทย์ออร์โธปิดิกส์ ผู้เชี่ยวชาญการผ่าตัดส่องกล้องข้อไหล่และข้อเข่า และเวชศาสตร์การกีฬา แพทย์ประจำทีมชาติ SEA Games 2023 และ 2025',
  },

  en: {
    skipToContent: 'Skip to main content',
    langSwitchLabel: 'Change language',
    thai: 'ไทย',
    english: 'EN',
    menu: 'Menu',

    book: 'Book',
    call: 'Call',
    line: 'LINE',
    bookConsultation: 'Book a consultation',
    viewCv: 'About & CV',

    aboutKicker: 'About',
    aboutHeading: 'Background & Training',
    educationHeading: 'Education & Certification',
    fellowshipsHeading: 'Fellowships & International Training',
    experienceHeading: 'Experience',

    credentialsKicker: 'International Credentials',

    appointmentKicker: 'Appointments',
    appointmentHeading: 'Choose a location and booking channel',
    appointmentIntro:
      'Each location uses a different booking path — some accept requests here, others only through the hospital.',
    bookableHereNote: 'Book through this site (sample times shown)',
    bookViaHospitalNote: 'Book only via the hospital — no slots are listed here',
    chooseSlot: 'Choose time',
    bookingPendingNote:
      'A request is not a confirmation — the team will follow up after you submit (full booking flow coming next)',
    noSlotsExternalNote: 'No time slots are shown because appointments must go through the hospital',
    viewMap: 'View map',
    externalBookingLabel: 'Online booking',
    openHospitalBooking: 'Open hospital booking page',

    conditionsIndexTitle: 'Conditions & Treatment — Dr. Pratchaya Manop',
    conditionsIndexDescription:
      'Condition guides covering symptoms, diagnosis, and treatment by an orthopaedic sports medicine surgeon.',
    conditionsIndexHeading: 'Conditions treated',
    conditionsIndexIntro:
      'Clinical articles are in Thai only — select a condition below to read the full article.',
    shortAnswerLabel: 'Short answer',
    faqHeading: 'Frequently asked questions',
    onThisPage: 'On this page',
    backToConditions: 'Back to all conditions',
    thaiArticleNotice: '',
    englishArticleNotice:
      'This article is available in Thai only — the clinical content below is entirely in Thai.',
    devMissingShortAnswer: 'TODO(owner): shortAnswer is empty — must be filled before launch',

    expertiseKicker: 'Expertise',
    expertiseHeading: 'Areas of Expertise',

    conditionsKicker: 'Conditions & Treatment',
    conditionsHeading: 'Conditions Treated',
    conditionsIntro:
      'Understand the symptoms, the causes, and the treatment options appropriate for you.',
    readMore: 'Read more',

    researchKicker: 'Research & Academic',
    researchHeading: 'Publications & Conferences',
    publicationsHeading: 'Peer-Reviewed Publications',
    conferencesHeading: 'International Conferences',

    organizationsKicker: 'Memberships',
    organizationsHeading: 'Professional Organizations',
    memberSince: 'Member since',

    testimonialsHeading: 'Patient Voices',
    testimonialsEmpty:
      'No patient testimonials are published yet. This section will be filled once written patient consent has been obtained.',

    contactKicker: 'Contact & Appointments',
    contactHeading: 'Book a Consultation',
    contactIntro: 'Reach out directly through any of the channels below.',
    emailLabel: 'Email',
    phoneLabel: 'Telephone',
    lineLabel: 'LINE Official',
    locationLabel: 'Practice location',
    hoursLabel: 'Consultation days & hours',

    privacyPolicy: 'Privacy policy',
    footerRights: 'All rights reserved',
    footerDisclaimer:
      'The information on this site is provided for general education and is not a diagnosis or individual medical advice. Please consult a physician to have your own symptoms assessed.',

    homeTitle: 'Dr. Pratchaya Manop — Orthopaedic Surgeon, Sports Medicine',
    homeDescription:
      'Orthopaedic surgeon specialising in shoulder and knee arthroscopy and sports medicine. National team physician, SEA Games 2023 and 2025.',
  },
} as const satisfies Record<Locale, Record<string, string>>;

export type UiStrings = (typeof ui)[Locale];

/** Root-relative href for a path within the given locale's route tree. */
export const localePath = (locale: Locale, path = ''): string => {
  const clean = path.replace(/^\/+/, '');
  return locale === 'th' ? `/${clean}` : `/en/${clean}`;
};
