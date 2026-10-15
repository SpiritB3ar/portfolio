import { ProjectType, SocialLinkType } from "../app/components/types/types";



export async function fetchJSON<T>(url: string): Promise<T> {
    let fullUrl: string;
    if (url.startsWith('http')) {
        fullUrl = url;
    } else if (url.startsWith('undefined')) {
        fullUrl = url.replace(/^undefined/, '/');
    } else if (typeof window !== "undefined") {
        // Client: same-origin relative request — avoids CORS entirely
        // no matter which domain serves the page.
        fullUrl = url.startsWith('/') ? url : `/${url}`;
    } else {
        // Server: absolute URL required (no origin context).
        const baseUrl = (process.env.NEXT_PUBLIC_API_URL || "").replace(/\/+$/, "");
        fullUrl = baseUrl ? `${baseUrl}${url.startsWith('/') ? url : `/${url}`}` : url;
    }

    const response = await fetch(fullUrl, {
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
