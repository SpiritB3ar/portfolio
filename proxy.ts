import { NextRequest, NextResponse } from 'next/server';

// POST/PUT/DELETE on every other `/api/*` route is authoring-only and
// requires `x-api-key`. These are the deliberate exceptions: the recruiter
// assistant is public (rate-limited in its own route) and health is a probe.
const PUBLIC_API = new Set(['/api/assistant', '/api/health']);

// Canonical host is the apex. `www.dranzr.com` still carries a legacy Vercel
// CNAME, so requests there are 301'd to the apex (path + query preserved)
// instead of ever reaching that origin.
export async function proxy(req: NextRequest) {
    const host = (req.headers.get('host') ?? '').split(':')[0];

    if (host.startsWith('www.')) {
        const url = req.nextUrl.clone();
        url.host = host.slice(4);
        url.protocol = 'https:';
        url.port = '';
        return NextResponse.redirect(url, 301);
    }

    const { pathname } = req.nextUrl;

    // Pages, assets and public API pass through untouched.
    if (!pathname.startsWith('/api/') || PUBLIC_API.has(pathname)) {
        return NextResponse.next();
    }

    // GETs stay public so pages can prerender; mutations require the
    // x-api-key header to match ADMIN_API_KEY (must be set in the
    // environment, otherwise every mutation is rejected with 401).
    if (req.method === 'GET') {
        return NextResponse.next();
    }

    const apiKey = req.headers.get('x-api-key');

    if (apiKey && apiKey === process.env.ADMIN_API_KEY) {
        return NextResponse.next();
    }

    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
}

export const config = {
    // Every route except immutable Next assets (which the ASSETS binding
    // serves before the worker runs) — needed so the www redirect applies
    // to pages, not just the API.
    matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
