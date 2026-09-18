/**
 * Local security verification helper (run after wrangler dev is up).
 * Usage: node src/lib/admin/security-test.mjs [baseUrl]
 */
const base = process.argv[2] ?? 'http://127.0.0.1:8787';

const endpoints = [
  ['GET', '/api/admin/auth/session'],
  ['GET', '/api/admin/dashboard'],
  ['GET', '/api/admin/appointments'],
  ['GET', '/api/admin/locations'],
  ['GET', '/api/admin/posts'],
  ['GET', '/api/admin/slots/available?locationId=1'],
  ['POST', '/api/admin/auth/logout'],
  ['POST', '/api/admin/appointments/1/confirm'],
];

async function main() {
  console.log('Unauthenticated access probe:', base);
  for (const [method, path] of endpoints) {
    const res = await fetch(base + path, { method });
    const snippet = (await res.text()).slice(0, 120);
    console.log(`${method} ${path} -> ${res.status} ${snippet}`);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
