import { env } from 'cloudflare:workers';
import {
  addBangkokDays,
  bangkokDateFromUtcInstant,
  bangkokLocalToUtcInstant,
  utcNowIso,
} from '~/lib/timezone';

export interface DashboardFunnel {
  pendingAppointments: number;
  confirmedToday: number;
  completedThisWeek: number;
  /** Placeholder when Analytics Engine read API is unavailable from Workers. */
  analyticsNote: string;
}

/** D1-backed operational funnel; AE dataset is write-only from the Worker binding. */
export async function loadDashboardFunnel(db: D1Database): Promise<DashboardFunnel> {
  const todayBangkok = bangkokDateFromUtcInstant(utcNowIso());
  const pending = await db
    .prepare(`SELECT COUNT(*) AS c FROM appointments WHERE status = 'pending'`)
    .first<{ c: number }>();

  const dayStart = bangkokLocalToUtcInstant(todayBangkok, '00:00');
  const dayEnd = bangkokLocalToUtcInstant(addBangkokDays(todayBangkok, 1), '00:00');
  const confirmedToday = await db
    .prepare(
      `SELECT COUNT(*) AS c
       FROM appointments a
       JOIN slots s ON s.id = a.slot_id
       WHERE a.status = 'confirmed'
         AND s.starts_at >= ? AND s.starts_at < ?`,
    )
    .bind(dayStart, dayEnd)
    .first<{ c: number }>();

  const completedWeek = await db
    .prepare(
      `SELECT COUNT(*) AS c FROM appointments
       WHERE status = 'completed'
         AND completed_at >= datetime('now', '-7 days')`,
    )
    .first<{ c: number }>();

  if (env.ANALYTICS) {
    // Booking funnel events can be written with writeDataPoint from public routes;
    // reading aggregates requires the Cloudflare dashboard or GraphQL API.
  }

  return {
    pendingAppointments: pending?.c ?? 0,
    confirmedToday: confirmedToday?.c ?? 0,
    completedThisWeek: completedWeek?.c ?? 0,
    analyticsNote:
      'Analytics Engine (drpratchaya_metrics) is bound for writes; funnel charts use D1 counts until an external AE query is wired.',
  };
}
