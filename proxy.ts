import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
    async function middleware(req) {
        const { pathname } = req.nextUrl;

        // Security Headers (Global)
        const requestHeaders = new Headers(req.headers);
        requestHeaders.set('X-Frame-Options', 'DENY');
        requestHeaders.set('X-Content-Type-Options', 'nosniff');
        requestHeaders.set('Referrer-Policy', 'strict-origin-when-cross-origin');
        // TEMPORARILY DISABLED FOR DEBUGGING
        // requestHeaders.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');

        // Content Security Policy
        // TEMPORARILY DISABLED
        // const csp = "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https://cdn.discordapp.com; font-src 'self'; connect-src 'self'; frame-ancestors 'none';";
        // requestHeaders.set('Content-Security-Policy', csp);

        // Custom logic for API routes: Inject Authorization header & User ID
        if (pathname.startsWith('/api/')) {
            const secret = process.env.API_SECRET || "scyro_secure_8f92a9912kks1";
            // console.log(`[Middleware] Injecting Auth Header: '${secret}'`); // DEBUG LINE
            requestHeaders.set('Authorization', secret);

            // IDOR Protection: Inject User ID from Session Token
            // withAuth populates req.nextauth.token
            const token = req.nextauth.token;
            // console.log(`[Proxy] API Call to ${pathname} | Token found: ${!!token} | UserID: ${token?.sub}`); // DEBUG LOG
            if (token && token.sub) {
                requestHeaders.set('X-User-ID', token.sub);
            }
        }

        // Logic from original proxy.js (preserved)
        if (pathname.startsWith("/dashboard/") && pathname !== "/dashboard") {
            // Placeholder for dashboard specific logic if needed
        }

        // Blacklist Check
        if (pathname.startsWith('/dashboard')) {
            const ip = req.headers.get('x-forwarded-for')?.split(',')[0] || '127.0.0.1';
            const userId = req.nextauth.token?.sub;

            try {
                const BOT_API_URL = process.env.INTERNAL_BOT_URL || "http://localhost:4000";
                const API_SECRET = process.env.API_SECRET || "scyro_secure_8f92a9912kks1";
                let query = `ip=${ip}`;
                if (userId) query += `&user_id=${userId}`;

                const res = await fetch(`${BOT_API_URL}/api/security/blacklist/check?${query}`, {
                    headers: { 'Authorization': API_SECRET },
                    next: { revalidate: 0 }
                });

                if (res.ok) {
                    const data = await res.json();
                    if (data.blocked) {
                        const url = req.nextUrl.clone();
                        url.pathname = '/blocked';
                        url.searchParams.set('reason', data.reason);
                        return NextResponse.redirect(url);
                    }
                }
            } catch (e) {
                // Ignore errors to avoid lockout
            }
        }

        return NextResponse.next({
            request: {
                headers: requestHeaders,
            },
        });
    },
    {
        callbacks: {
            authorized: ({ req, token }) => {
                const path = req.nextUrl.pathname;
                // Allow API routes to pass through
                if (path.startsWith('/api/')) return true;

                // Require Auth ONLY for /dashboard routes
                if (path.startsWith('/dashboard')) {
                    return !!token;
                }

                // Allow public access to everything else (Home, Premium, Vote, etc.)
                return true;
            },
        },
        pages: {
            signIn: "/auth/signin",
        },
    }
);

export const config = {
    matcher: [
        '/((?!_next/static|_next/image|favicon.ico).*)',
    ],
};
