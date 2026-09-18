/** Minimum wall time for DSR request handling (reduces email-enumeration via latency). */
export const DSR_REQUEST_MIN_DURATION_MS = 320;

export async function withMinimumDuration<T>(
  minimumMs: number,
  fn: () => Promise<T>,
): Promise<T> {
  const started = Date.now();
  const result = await fn();
  const remaining = minimumMs - (Date.now() - started);
  if (remaining > 0) {
    await new Promise<void>((resolve) => {
      setTimeout(resolve, remaining);
    });
  }
  return result;
}
