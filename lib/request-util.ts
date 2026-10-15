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
        let message = `HTTP Error: ${response.status}`;
        try {
            const body = await response.json();
            if (body?.message) message = body.message;
        } catch {}
        throw new Error(message);
    }
    return response.json();
}
