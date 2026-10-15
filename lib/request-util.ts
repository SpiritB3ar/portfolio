/**
 * Client-side JSON fetcher for same-origin `/api/*` routes.
 *
 * Always relative: no CORS issues on any domain, no env var needed.
 * Server Components must NOT use this — they query Prisma directly
 * via `lib/data.ts` so pages can prerender at build time.
 */
export async function fetchJSON<T>(url: string): Promise<T> {
    const response = await fetch(url, {
        method: "GET"
    });

    if (!response.ok) {
        throw new Error(await readErrorMessage(response, `HTTP Error: ${response.status}`));
    }
    return (await response.json()) as T;
}

/**
 * Safely reads `{ message }` from an error JSON body.
 * Explicitly typed: @cloudflare/workers-types declares
 * `Response.json()` as `Promise<unknown>`, so untyped
 * `body?.message` reads fail compilation once it is referenced.
 */
export async function readErrorMessage(response: Response, fallback: string): Promise<string> {
    try {
        const body = (await response.json()) as { message?: unknown };
        if (typeof body?.message === "string" && body.message) return body.message;
    } catch {}
    return fallback;
}
