import { bumpCacheTags, postCacheTags } from '~/lib/admin/cache-tags';
import { writeAuditLog } from '~/lib/admin/audit';
import type { AdminAuthContext } from '~/lib/auth/guard';
import { utcNowIso } from '~/lib/timezone';

export interface PostRow {
  id: number;
  translation_key: string;
  language: 'th' | 'en';
  slug: string;
  status: 'draft' | 'scheduled' | 'published';
  published_at: string | null;
  title: string;
  excerpt: string | null;
  body_markdown: string;
  cover_image_key: string | null;
  seo_title: string | null;
  seo_description: string | null;
}

export async function listPosts(db: D1Database): Promise<PostRow[]> {
  const result = await db
    .prepare(`SELECT * FROM posts ORDER BY updated_at DESC LIMIT 200`)
    .all<PostRow>();
  return result.results ?? [];
}

export async function getPost(db: D1Database, id: number): Promise<PostRow | null> {
  return db.prepare(`SELECT * FROM posts WHERE id = ?`).bind(id).first<PostRow>();
}

export async function savePost(
  auth: AdminAuthContext,
  db: D1Database,
  data: {
    id?: number;
    translation_key: string;
    language: 'th' | 'en';
    slug: string;
    title: string;
    excerpt?: string | null;
    body_markdown: string;
    status: PostRow['status'];
    published_at?: string | null;
    cover_image_key?: string | null;
    seo_title?: string | null;
    seo_description?: string | null;
  },
): Promise<number> {
  const now = utcNowIso();
  let postId = data.id;
  let before: PostRow | null = null;
  if (data.id) {
    before = await getPost(db, data.id);
    await db
      .prepare(
        `UPDATE posts SET
           translation_key = ?, language = ?, slug = ?, title = ?, excerpt = ?,
           body_markdown = ?, status = ?, published_at = ?, cover_image_key = ?,
           seo_title = ?, seo_description = ?, updated_at = ?
         WHERE id = ?`,
      )
      .bind(
        data.translation_key,
        data.language,
        data.slug,
        data.title,
        data.excerpt ?? null,
        data.body_markdown,
        data.status,
        data.published_at ?? null,
        data.cover_image_key ?? null,
        data.seo_title ?? null,
        data.seo_description ?? null,
        now,
        data.id,
      )
      .run();
  } else {
    const row = await db
      .prepare(
        `INSERT INTO posts (
           translation_key, language, slug, status, published_at, author_id,
           title, excerpt, body_markdown, cover_image_key, seo_title, seo_description,
           created_at, updated_at
         ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
         RETURNING id`,
      )
      .bind(
        data.translation_key,
        data.language,
        data.slug,
        data.status,
        data.published_at ?? null,
        auth.user.id,
        data.title,
        data.excerpt ?? null,
        data.body_markdown,
        data.cover_image_key ?? null,
        data.seo_title ?? null,
        data.seo_description ?? null,
        now,
        now,
      )
      .first<{ id: number }>();
    postId = row?.id;
  }
  if (!postId) throw new Error('post_save_failed');
  const after = await getPost(db, postId);
  await writeAuditLog(db, {
    adminUserId: auth.user.id,
    action: data.id ? 'post.update' : 'post.create',
    entityType: 'post',
    entityId: postId,
    before,
    after,
    ipAddress: auth.ip,
    userAgent: auth.userAgent,
  });
  if (after?.status === 'published') {
    await bumpCacheTags(postCacheTags(after.slug, after.language));
  }
  return postId;
}

export async function publishPost(auth: AdminAuthContext, db: D1Database, id: number): Promise<void> {
  const before = await getPost(db, id);
  if (!before) throw new Error('NOT_FOUND');
  const now = utcNowIso();
  await db
    .prepare(`UPDATE posts SET status = 'published', published_at = ?, updated_at = ? WHERE id = ?`)
    .bind(now, now, id)
    .run();
  const after = await getPost(db, id);
  await writeAuditLog(db, {
    adminUserId: auth.user.id,
    action: 'post.publish',
    entityType: 'post',
    entityId: id,
    before,
    after,
    ipAddress: auth.ip,
    userAgent: auth.userAgent,
  });
  if (after) {
    await bumpCacheTags(postCacheTags(after.slug, after.language));
  }
}

export async function registerMedia(
  auth: AdminAuthContext,
  db: D1Database,
  input: {
    postId?: number | null;
    r2ObjectKey: string;
    altText: string;
    contentType: string;
    byteSize: number;
    widthPx?: number;
    heightPx?: number;
  },
): Promise<number> {
  const trimmedAlt = input.altText.trim();
  if (!trimmedAlt) throw new Error('ALT_REQUIRED');
  const now = utcNowIso();
  const row = await db
    .prepare(
      `INSERT INTO post_media (
         post_id, r2_object_key, alt_text, width_px, height_px, content_type, byte_size, created_at
       ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
       RETURNING id`,
    )
    .bind(
      input.postId ?? null,
      input.r2ObjectKey,
      trimmedAlt,
      input.widthPx ?? null,
      input.heightPx ?? null,
      input.contentType,
      input.byteSize,
      now,
    )
    .first<{ id: number }>();
  if (!row) throw new Error('media_insert_failed');
  await writeAuditLog(db, {
    adminUserId: auth.user.id,
    action: 'post.media.create',
    entityType: 'post_media',
    entityId: row.id,
    after: input,
    ipAddress: auth.ip,
    userAgent: auth.userAgent,
  });
  return row.id;
}
