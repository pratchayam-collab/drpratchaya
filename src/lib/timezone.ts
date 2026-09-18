/** Asia/Bangkok scheduling helpers (UTC+7, no DST). */

const BANGKOK_OFFSET_MS = 7 * 60 * 60 * 1000;

/** Calendar date YYYY-MM-DD in Bangkok for a UTC instant string. */
export function bangkokDateFromUtcInstant(utcIso: string): string {
  const ms = Date.parse(utcIso);
  const bangkok = new Date(ms + BANGKOK_OFFSET_MS);
  const y = bangkok.getUTCFullYear();
  const m = String(bangkok.getUTCMonth() + 1).padStart(2, '0');
  const d = String(bangkok.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/** ISO weekday 1=Mon … 7=Sun in Bangkok for a calendar date. */
function parseYmd(dateYmd: string): { y: number; m: number; d: number } {
  const [ys, ms, ds] = dateYmd.split('-');
  return { y: Number(ys), m: Number(ms), d: Number(ds) };
}

export function bangkokIsoWeekday(dateYmd: string): number {
  const { y, m, d } = parseYmd(dateYmd);
  const utcMs = Date.UTC(y, m - 1, d) - BANGKOK_OFFSET_MS;
  const day = new Date(utcMs).getUTCDay();
  return day === 0 ? 7 : day;
}

/** Parse HH:MM to minutes since midnight. */
export function parseHm(hm: string): number {
  const [hs, mins] = hm.split(':');
  const h = Number(hs);
  const min = Number(mins);
  return h * 60 + min;
}

/**
 * Bangkok wall-clock start of a calendar day as UTC ISO instant (with Z).
 * `dateYmd` is Bangkok calendar date; `hm` is Bangkok HH:MM.
 */
export function bangkokLocalToUtcInstant(dateYmd: string, hm: string): string {
  const { y, m, d } = parseYmd(dateYmd);
  const [hhs, mms] = hm.split(':');
  const hh = Number(hhs);
  const mm = Number(mms);
  const utcMs = Date.UTC(y, m - 1, d, hh, mm, 0, 0) - BANGKOK_OFFSET_MS;
  return new Date(utcMs).toISOString().replace(/\.\d{3}Z$/, '.000Z');
}

/** Add N calendar days to YYYY-MM-DD (Bangkok calendar arithmetic). */
export function addBangkokDays(dateYmd: string, days: number): string {
  const { y, m, d } = parseYmd(dateYmd);
  const utcMs = Date.UTC(y, m - 1, d) + days * 24 * 60 * 60 * 1000;
  const dt = new Date(utcMs);
  const yy = dt.getUTCFullYear();
  const mm = String(dt.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(dt.getUTCDate()).padStart(2, '0');
  return `${yy}-${mm}-${dd}`;
}

export function utcNowIso(): string {
  return new Date().toISOString().replace(/\.\d{3}Z$/, '.000Z');
}

/** Format UTC slot range for patient display in Bangkok. */
export function formatSlotBangkok(startsAt: string, endsAt: string, locale: 'th' | 'en'): string {
  const ms = Date.parse(startsAt);
  const bangkok = new Date(ms + BANGKOK_OFFSET_MS);
  const y = bangkok.getUTCFullYear();
  const mon = bangkok.getUTCMonth();
  const day = bangkok.getUTCDate();
  const hh = String(bangkok.getUTCHours()).padStart(2, '0');
  const mm = String(bangkok.getUTCMinutes()).padStart(2, '0');
  const endBangkok = new Date(Date.parse(endsAt) + BANGKOK_OFFSET_MS);
  const eh = String(endBangkok.getUTCHours()).padStart(2, '0');
  const em = String(endBangkok.getUTCMinutes()).padStart(2, '0');

  if (locale === 'th') {
    const thMonths = [
      'ม.ค.',
      'ก.พ.',
      'มี.ค.',
      'เม.ย.',
      'พ.ค.',
      'มิ.ย.',
      'ก.ค.',
      'ส.ค.',
      'ก.ย.',
      'ต.ค.',
      'พ.ย.',
      'ธ.ค.',
    ];
    const be = y + 543;
    return `${day} ${thMonths[mon]} ${be} · ${hh}:${mm}–${eh}:${em} น.`;
  }
  const enMonths = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${day} ${enMonths[mon]} ${y} · ${hh}:${mm}–${eh}:${em}`;
}
