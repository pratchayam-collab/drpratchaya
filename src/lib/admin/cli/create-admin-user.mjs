#!/usr/bin/env node
/**
 * One-off bootstrap: hash password + TOTP secret for INSERT into admin_users.
 * Does not write secrets to git — run locally, then apply SQL via wrangler d1 execute.
 *
 * Usage:
 *   node src/lib/admin/cli/create-admin-user.mjs --email admin@example.com
 *
 * Prompts for password on stdin (or pass ADMIN_PASSWORD env for CI-style runs).
 * Prints SQL and otpauth URI — store TOTP in an authenticator app before first login.
 */
import { randomBytes, pbkdf2Sync } from 'node:crypto';
import { createInterface } from 'node:readline';

const ITERATIONS = 600_000;
const BASE32 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

function parseArgs(argv) {
  const emailIdx = argv.indexOf('--email');
  if (emailIdx < 0 || !argv[emailIdx + 1]) {
    console.error('Usage: node create-admin-user.mjs --email you@example.com');
    process.exit(1);
  }
  return { email: argv[emailIdx + 1].toLowerCase() };
}

function bytesToHex(buf) {
  return [...buf].map((b) => b.toString(16).padStart(2, '0')).join('');
}

function generateTotpSecret() {
  const buf = randomBytes(20);
  let out = '';
  for (const b of buf) out += BASE32[b % 32];
  return out;
}

function totpUri(email, secret) {
  const label = encodeURIComponent(`drpratchaya-admin:${email}`);
  const q = new URLSearchParams({ secret, issuer: 'drpratchaya-admin', algorithm: 'SHA1', digits: '6', period: '30' });
  return `otpauth://totp/${label}?${q.toString()}`;
}

async function readPassword() {
  if (process.env.ADMIN_PASSWORD) return process.env.ADMIN_PASSWORD;
  const rl = createInterface({ input: process.stdin, output: process.stderr });
  return new Promise((resolve) => {
    rl.question('Admin password (min 12 chars): ', (answer) => {
      rl.close();
      resolve(answer);
    });
  });
}

const { email } = parseArgs(process.argv.slice(2));
const password = await readPassword();
if (!password || password.length < 12) {
  console.error('Password must be at least 12 characters.');
  process.exit(1);
}

const salt = randomBytes(16);
const saltHex = bytesToHex(salt);
const hashHex = pbkdf2Sync(password, salt, ITERATIONS, 32, 'sha256').toString('hex');
const totpSecret = generateTotpSecret();

const sql = `-- Run against local or remote D1 (never commit this output):
INSERT INTO admin_users (email, password_hash, pbkdf2_iterations, pbkdf2_salt, totp_secret, is_active)
VALUES (
  '${email.replace(/'/g, "''")}',
  '${hashHex}',
  ${ITERATIONS},
  '${saltHex}',
  '${totpSecret}',
  1
);`;

console.log('\n=== TOTP (scan before login) ===');
console.log(totpUri(email, totpSecret));
console.log('\n=== SQL ===\n');
console.log(sql);
console.log('\nLocal apply example:');
console.log(
  `npx wrangler d1 execute drpratchaya-db --local --command "${sql.replace(/\n/g, ' ').replace(/"/g, '\\"')}"`,
);
