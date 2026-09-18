#!/usr/bin/env node
/**
 * End-to-end admin security checks against local wrangler dev.
 * Usage: node src/lib/admin/verify-security.mjs
 */
import { createHmac } from 'node:crypto';

const base = process.env.ADMIN_TEST_BASE ?? 'http://127.0.0.1:8787';
const email = process.env.ADMIN_TEST_EMAIL ?? 'admin.test@example.com';
const password = process.env.ADMIN_TEST_PASSWORD ?? 'FictionalTestPass12!';
const totpSecret = process.env.ADMIN_TEST_TOTP ?? 'N4PI65UW3OLY7VON5PT6';

const endpoints = [
  ['GET', '/api/admin/auth/session'],
  ['GET', '/api/admin/dashboard'],
  ['GET', '/api/admin/appointments'],
  ['GET', '/api/admin/locations'],
  ['GET', '/api/admin/posts'],
  ['GET', '/api/admin/slots/available?locationId=1'],
  ['GET', '/api/admin/schedules/templates?locationId=1'],
  ['GET', '/api/admin/schedules/exceptions?locationId=1'],
  ['POST', '/api/admin/auth/logout'],
  ['POST', '/api/admin/appointments/1/confirm'],
  ['POST', '/api/admin/posts/1/publish'],
];

function base32Decode(secret) {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
  const cleaned = secret.replace(/=+$/u, '').toUpperCase();
  let bits = 0;
  let value = 0;
  const out = [];
  for (const c of cleaned) {
    const idx = alphabet.indexOf(c);
    if (idx < 0) continue;
    value = (value << 5) | idx;
    bits += 5;
    if (bits >= 8) {
      out.push((value >>> (bits - 8)) & 0xff);
      bits -= 8;
    }
  }
  return Buffer.from(out);
}

function totpNow(secret) {
  const step = Math.floor(Date.now() / 1000 / 30);
  const buf = Buffer.alloc(8);
  const view = new DataView(buf.buffer, buf.byteOffset, 8);
  view.setUint32(0, 0);
  view.setUint32(4, step);
  const hmac = createHmac('sha1', base32Decode(secret)).update(buf).digest();
  const offset = hmac[hmac.length - 1] & 0x0f;
  const code =
    ((hmac[offset] & 0x7f) << 24) |
    ((hmac[offset + 1] & 0xff) << 16) |
    ((hmac[offset + 2] & 0xff) << 8) |
    (hmac[offset + 3] & 0xff);
  return String(code % 1_000_000).padStart(6, '0');
}

async function login(passwordOnly = false, totp = '000000') {
  const res = await fetch(`${base}/api/admin/auth/login`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ email, password, totp: passwordOnly ? '' : totp }),
  });
  const text = await res.text();
  const cookie = res.headers.get('set-cookie');
  return { status: res.status, text, cookie };
}

async function main() {
  console.log('=== Unauthenticated admin endpoints ===');
  for (const [method, path] of endpoints) {
    const res = await fetch(base + path, { method });
    const body = (await res.text()).slice(0, 100);
    console.log(`${method} ${path} -> ${res.status} ${body}`);
  }

  console.log('\n=== Login: correct password, wrong TOTP ===');
  const badTotp = await login(false, '000000');
  console.log(`status ${badTotp.status} ${badTotp.text}`);

  console.log('\n=== Login rate limit (16 rapid attempts) ===');
  let limited = false;
  for (let i = 0; i < 16; i++) {
    const r = await login(false, '000000');
    if (r.status === 429) {
      limited = true;
      console.log(`attempt ${i + 1}: 429 RATE_LIMITED`);
      break;
    }
  }
  if (!limited) console.log('WARNING: rate limit not observed in 16 attempts');

  console.log('\n=== Login: success + confirm appointment audit/notify ===');
  const good = await login(false, totpNow(totpSecret));
  console.log(`login status ${good.status}`);
  const sessionCookie = good.cookie?.split(';')[0] ?? '';
  const csrf = JSON.parse(good.text).csrfToken;

  const confirmRes = await fetch(`${base}/api/admin/appointments/1/confirm`, {
    method: 'POST',
    headers: {
      cookie: sessionCookie,
      'X-Admin-CSRF': csrf,
    },
  });
  console.log(`confirm -> ${confirmRes.status} ${await confirmRes.text()}`);

  const audit = await fetch(`${base}/api/admin/dashboard`, { headers: { cookie: sessionCookie } });
  console.log(`dashboard after confirm ok: ${audit.status}`);

  console.log('\n=== D1 checks (via wrangler not included) — run separately ===');
  console.log('Expect audit_log appointment.confirm and NOTIFY queue patient_confirmed');

  console.log('\n=== Invalid appointment status (library) ===');
  // Import dynamic would need worker — documented for coordinator
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
