/**
 * Tiny in-memory sliding-window rate limiter (per IP).
 * Good enough for a low-traffic portfolio widget; replace with
 * Upstash/Vercel KV if abuse appears.
 */

const WINDOW_MS = 60_000;
const MAX_REQUESTS = 10;

const hits = new Map<string, number[]>();

export function isRateLimited(key: string): boolean {
    const now = Date.now();
    const windowStart = now - WINDOW_MS;
    const list = (hits.get(key) ?? []).filter((t) => t > windowStart);
    if (list.length >= MAX_REQUESTS) {
        hits.set(key, list);
        return true;
    }
    list.push(now);
    hits.set(key, list);
    return false;
}
