import { utcNowIso } from '~/lib/timezone';

export interface AuditParams {
  adminUserId: number;
  action: string;
  entityType: string;
  entityId: string | number;
  before?: unknown;
  after?: unknown;
  ipAddress?: string;
  userAgent?: string;
}

export async function writeAuditLog(db: D1Database, params: AuditParams): Promise<void> {
  await db
    .prepare(
      `INSERT INTO audit_log (
         admin_user_id, action, entity_type, entity_id,
         before_json, after_json, ip_address, user_agent, created_at
       ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .bind(
      params.adminUserId,
      params.action,
      params.entityType,
      String(params.entityId),
      params.before != null ? JSON.stringify(params.before) : null,
      params.after != null ? JSON.stringify(params.after) : null,
      params.ipAddress ?? null,
      params.userAgent ?? null,
      utcNowIso(),
    )
    .run();
}
