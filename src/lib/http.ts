export function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'no-store',
    },
  });
}

export function errorJson(code: string, message: string, status: number): Response {
  return json({ ok: false, error: { code, message } }, status);
}

export async function readJson<T>(request: Request): Promise<T> {
  return (await request.json()) as T;
}

export function clientIp(request: Request): string {
  return request.headers.get('cf-connecting-ip') ?? request.headers.get('x-forwarded-for') ?? '0.0.0.0';
}
