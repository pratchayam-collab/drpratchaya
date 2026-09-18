import { env } from 'cloudflare:workers';
import { hmacSha256Hex, timingSafeEqual } from '~/lib/crypto';

/** Magic links expire 30 days after issuance (spec default). */
export const MAGIC_LINK_TTL_SECONDS = 30 * 24 * 60 * 60;

/** Local-only fallback; never used in production builds. */
const DEV_MAGIC_LINK_SECRET = 'dev-only-magic-link-secret';

export class MagicLinkConfigurationError extends Error {
  readonly code = 'MAGIC_LINK_SECRET_MISSING';

  constructor() {
    super('MAGIC_LINK_SECRET is not configured');
    this.name = 'MagicLinkConfigurationError';
  }
}

export interface SignedManagePayload {
  appointmentId: number;
  token: string;
  exp: number;
  sig: string;
}

function magicSecret(): string {
  const configured = env.MAGIC_LINK_SECRET;
  if (configured) return configured;
  if (import.meta.env.DEV) return DEV_MAGIC_LINK_SECRET;
  throw new MagicLinkConfigurationError();
}

export async function signManageLink(
  appointmentId: number,
  magicLinkToken: string,
  issuedAtSec = Math.floor(Date.now() / 1000),
): Promise<string> {
  const exp = issuedAtSec + MAGIC_LINK_TTL_SECONDS;
  const sig = await hmacSha256Hex(magicSecret(), `${appointmentId}:${magicLinkToken}:${exp}`);
  const payload = `${appointmentId}.${exp}.${sig}`;
  return `/book/manage/${magicLinkToken}?p=${encodeURIComponent(payload)}`;
}

export async function verifyManageLink(
  appointmentId: number,
  magicLinkToken: string,
  payloadParam: string,
): Promise<boolean> {
  let secret: string;
  try {
    secret = magicSecret();
  } catch (e) {
    if (e instanceof MagicLinkConfigurationError) return false;
    throw e;
  }

  const parts = payloadParam.split('.');
  if (parts.length !== 3) return false;
  const [idStr, expStr, sig] = parts;
  if (!sig) return false;
  if (Number(idStr) !== appointmentId) return false;
  const exp = Number(expStr);
  if (!Number.isFinite(exp) || exp < Math.floor(Date.now() / 1000)) return false;
  const expected = await hmacSha256Hex(secret, `${appointmentId}:${magicLinkToken}:${exp}`);
  return timingSafeEqual(expected, sig);
}

/**
 * Wrong or expired links return null — no appointment metadata is exposed.
 */
export async function resolveManageAccess(
  db: D1Database,
  magicLinkToken: string,
  payloadParam: string | null,
): Promise<{ id: number; status: string; slot_id: number } | null> {
  if (!payloadParam) return null;
  const row = await db
    .prepare('SELECT id, status, slot_id, magic_link_token FROM appointments WHERE magic_link_token = ?')
    .bind(magicLinkToken)
    .first<{ id: number; status: string; slot_id: number; magic_link_token: string }>();
  if (!row) return null;
  const ok = await verifyManageLink(row.id, row.magic_link_token, payloadParam);
  if (!ok) return null;
  return { id: row.id, status: row.status, slot_id: row.slot_id };
}
