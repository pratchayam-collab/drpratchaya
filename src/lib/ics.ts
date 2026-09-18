/** Minimal iCalendar for confirmed appointments. */
export function buildIcsEvent(opts: {
  uid: string;
  startsAtUtc: string;
  endsAtUtc: string;
  summary: string;
  location: string;
  description: string;
}): string {
  const dtStart = opts.startsAtUtc.replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z');
  const dtEnd = opts.endsAtUtc.replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z');
  const stamp = new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z');
  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//drpratchaya.com//booking//EN',
    'CALSCALE:GREGORIAN',
    'BEGIN:VEVENT',
    `UID:${opts.uid}`,
    `DTSTAMP:${stamp}`,
    `DTSTART:${dtStart}`,
    `DTEND:${dtEnd}`,
    `SUMMARY:${escapeIcs(opts.summary)}`,
    `LOCATION:${escapeIcs(opts.location)}`,
    `DESCRIPTION:${escapeIcs(opts.description)}`,
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n');
}

function escapeIcs(value: string): string {
  return value.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\n/g, '\\n');
}
