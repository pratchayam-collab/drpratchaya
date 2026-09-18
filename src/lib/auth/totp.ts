/** RFC 6238 TOTP (SHA-1, 30s step, 6 digits) for mandatory admin 2FA. */

const BASE32_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

function base32Decode(secret: string): Uint8Array {
  const cleaned = secret.replace(/=+$/u, '').replace(/\s+/gu, '').toUpperCase();
  let bits = 0;
  let value = 0;
  const out: number[] = [];
  for (const char of cleaned) {
    const idx = BASE32_ALPHABET.indexOf(char);
    if (idx < 0) continue;
    value = (value << 5) | idx;
    bits += 5;
    if (bits >= 8) {
      out.push((value >>> (bits - 8)) & 0xff);
      bits -= 8;
    }
  }
  return new Uint8Array(out);
}

async function hotp(secret: Uint8Array, counter: number): Promise<string> {
  const buf = new ArrayBuffer(8);
  const view = new DataView(buf);
  view.setUint32(0, Math.floor(counter / 0x1_0000_0000));
  view.setUint32(4, counter >>> 0);
  const key = await crypto.subtle.importKey(
    'raw',
    secret as BufferSource,
    { name: 'HMAC', hash: 'SHA-1' },
    false,
    ['sign'],
  );
  const sig = new Uint8Array(await crypto.subtle.sign('HMAC', key, new Uint8Array(buf)));
  const offset = sig[sig.length - 1]! & 0x0f;
  const code =
    ((sig[offset]! & 0x7f) << 24) |
    ((sig[offset + 1]! & 0xff) << 16) |
    ((sig[offset + 2]! & 0xff) << 8) |
    (sig[offset + 3]! & 0xff);
  return String(code % 1_000_000).padStart(6, '0');
}

export function generateTotpSecretBase32(length = 20): string {
  const buf = new Uint8Array(length);
  crypto.getRandomValues(buf);
  let out = '';
  for (let i = 0; i < buf.length; i++) {
    out += BASE32_ALPHABET[buf[i]! % 32];
  }
  return out;
}

export function totpProvisioningUri(email: string, secret: string, issuer = 'drpratchaya-admin'): string {
  const label = encodeURIComponent(`${issuer}:${email}`);
  const params = new URLSearchParams({
    secret,
    issuer,
    algorithm: 'SHA1',
    digits: '6',
    period: '30',
  });
  return `otpauth://totp/${label}?${params.toString()}`;
}

/** Accepts current ±1 window for clock skew. */
export async function verifyTotp(secretBase32: string, code: string): Promise<boolean> {
  const normalized = code.replace(/\s+/gu, '');
  if (!/^\d{6}$/u.test(normalized)) return false;
  const secret = base32Decode(secretBase32);
  const step = Math.floor(Date.now() / 1000 / 30);
  for (let delta = -1; delta <= 1; delta++) {
    const expected = await hotp(secret, step + delta);
    if (expected === normalized) return true;
  }
  return false;
}
