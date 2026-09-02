/**
 * Generic in-memory, per-key rate limiter. Same shape as the one built for the
 * subscribe form (lib/subscribe-guard.ts), pulled out here so comments and
 * likes can each get their own bucket and limits without duplicating the
 * eviction logic, and without touching the subscribe flow.
 */

type Bucket = { count: number; resetAt: number }

export function createRateLimiter(opts: { max: number; windowMs: number; maxKeys?: number }) {
  const { max, windowMs, maxKeys = 5000 } = opts
  const buckets = new Map<string, Bucket>()

  function evict(now: number) {
    for (const [key, bucket] of buckets) {
      if (bucket.resetAt <= now) buckets.delete(key)
    }
    // Map iterates in insertion order, so the first keys are the least recent.
    while (buckets.size > maxKeys) {
      const oldest = buckets.keys().next()
      if (oldest.done) break
      buckets.delete(oldest.value)
    }
  }

  function check(key: string, now = Date.now()): boolean {
    evict(now)
    const bucket = buckets.get(key)
    if (!bucket || bucket.resetAt <= now) {
      buckets.set(key, { count: 1, resetAt: now + windowMs })
      return true
    }
    bucket.count += 1
    // Refresh recency so an active key is not evicted while it is being limited.
    buckets.delete(key)
    buckets.set(key, bucket)
    return bucket.count <= max
  }

  /** Test seam: the bucket map is module state and outlives a single request. */
  function reset() {
    buckets.clear()
  }

  return { check, reset }
}
