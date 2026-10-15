import type { AssistantLang, ChatMessage } from "./types";

/**
 * Last-resort reply cache: when every model in the fallback chain fails,
 * serve the last successful reply for the SAME question instead of a 503.
 *
 * Key = lang + normalized last user message (exact match only — never fuzzy,
 * so a cached reply always answers the question actually asked). History is
 * intentionally ignored: answers are grounded in the (slow-changing) profile
 * context, and a retry of the same question deserves the stored answer.
 *
 * In-memory per instance (warm serverless containers reuse it), TTL + size
 * bounded. Only successful (non-cached) replies are stored.
 */

const TTL_MS = Math.max(
    60_000,
    Number.parseInt(process.env.ASSISTANT_CACHE_TTL_MS ?? "3600000", 10) || 3600000
);
const MAX_ENTRIES = 200;

interface CacheEntry {
    reply: string;
    model: string;
    at: number;
}

const store = new Map<string, CacheEntry>();

/** Normalized cache key, or null when there is no user message to key on. */
export function buildReplyCacheKey(
    lang: AssistantLang,
    messages: ChatMessage[]
): string | null {
    const lastUser = [...messages].reverse().find((m) => m.role === "user");
    const text = lastUser?.content
        .trim()
        .toLowerCase()
        .replace(/\s+/g, " ")
        .replace(/^[?!¡¿.,;:]+/g, "")
        .replace(/[?!¡¿.,;:]+$/g, "");
    if (!text) return null;
    return `${lang}:${text.slice(0, 500)}`;
}

export function getCachedReply(key: string): { reply: string; model: string } | null {
    const entry = store.get(key);
    if (!entry) return null;
    if (Date.now() - entry.at > TTL_MS) {
        store.delete(key);
        return null;
    }
    // LRU touch.
    store.delete(key);
    store.set(key, entry);
    return { reply: entry.reply, model: entry.model };
}

export function setCachedReply(key: string, reply: string, model: string): void {
    if (!reply.trim()) return;
    if (store.has(key)) store.delete(key);
    while (store.size >= MAX_ENTRIES) {
        const oldest = store.keys().next().value;
        if (oldest === undefined) break;
        store.delete(oldest);
    }
    store.set(key, { reply, model, at: Date.now() });
}
