// Simple per-key sliding-window rate limiter (in-memory, per edge instance).
// Not a hard guarantee across instances but blocks the obvious abuse cases.
const buckets = new Map<string, number[]>();

export function rateLimit(key: string, max: number, windowMs: number): { ok: boolean; retryAfter: number } {
  const now = Date.now();
  const arr = (buckets.get(key) ?? []).filter((t) => now - t < windowMs);
  if (arr.length >= max) {
    const retryAfter = Math.ceil((windowMs - (now - arr[0])) / 1000);
    buckets.set(key, arr);
    return { ok: false, retryAfter };
  }
  arr.push(now);
  buckets.set(key, arr);
  // opportunistic cleanup
  if (buckets.size > 5000) {
    for (const [k, v] of buckets) {
      const filtered = v.filter((t) => now - t < windowMs);
      if (filtered.length === 0) buckets.delete(k);
      else buckets.set(k, filtered);
    }
  }
  return { ok: true, retryAfter: 0 };
}
