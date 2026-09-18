import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';
import { registerMedia } from '~/lib/admin/posts';
import { requireAdminApi } from '~/lib/auth/guard';
import { errorJson, json } from '~/lib/http';
import { randomToken } from '~/lib/crypto';

export const prerender = false;

export const POST: APIRoute = async (context) => {
  const auth = await requireAdminApi(context, { requireCsrf: true });
  if (auth instanceof Response) return auth;

  const form = await context.request.formData();
  const file = form.get('file');
  const altText = String(form.get('altText') ?? '').trim();
  const postIdRaw = form.get('postId');
  const postId = postIdRaw ? Number.parseInt(String(postIdRaw), 10) : null;

  if (!(file instanceof File)) return errorJson('INVALID_INPUT', 'ไม่มีไฟล์', 400);
  if (!altText) return errorJson('ALT_REQUIRED', 'ต้องระบุ alt text', 400);

  const ext = file.name.includes('.') ? file.name.split('.').pop() : 'bin';
  const key = `posts/${new Date().toISOString().slice(0, 10)}/${randomToken(8)}.${ext}`;
  const bytes = new Uint8Array(await file.arrayBuffer());

  if (!env.MEDIA) return errorJson('MEDIA_UNAVAILABLE', '', 503);
  await env.MEDIA.put(key, bytes, {
    httpMetadata: { contentType: file.type || 'application/octet-stream' },
  });

  const mediaId = await registerMedia(auth, env.DB, {
    postId: Number.isFinite(postId) ? postId : null,
    r2ObjectKey: key,
    altText,
    contentType: file.type || 'application/octet-stream',
    byteSize: bytes.byteLength,
  });

  return json({ ok: true, mediaId, key });
};
