import { timingSafeEqual } from '~/lib/crypto';

export const DEFAULT_PBKDF2_ITERATIONS = 600_000;

function bytesToHex(bytes: ArrayBuffer): string {
  return [...new Uint8Array(bytes)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

function hexToBytes(hex: string): Uint8Array {
  const out = new Uint8Array(hex.length / 2);
  for (let i = 0; i < out.length; i++) {
    out[i] = Number.parseInt(hex.slice(i * 2, i * 2 + 2), 16);
  }
  return out;
}

export async function hashPassword(
  password: string,
  saltHex: string,
  iterations: number,
): Promise<string> {
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(password),
    'PBKDF2',
    false,
    ['deriveBits'],
  );
  const bits = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt: hexToBytes(saltHex) as BufferSource,
      iterations,
      hash: 'SHA-256',
    },
    keyMaterial,
    256,
  );
  return bytesToHex(bits);
}

export function newPasswordSaltHex(): string {
  const buf = new Uint8Array(16);
  crypto.getRandomValues(buf);
  return bytesToHex(buf.buffer);
}

export async function verifyPassword(
  password: string,
  storedHashHex: string,
  saltHex: string,
  iterations: number,
): Promise<boolean> {
  const derived = await hashPassword(password, saltHex, iterations);
  return timingSafeEqual(derived, storedHashHex);
}
