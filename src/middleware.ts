import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { rateLimitMiddleware } from './middleware/rateLimit';

export async function middleware(request: NextRequest) {
    // Only apply rate limiting to API routes
    if (request.nextUrl.pathname.startsWith('/api/')) {
        return rateLimitMiddleware(request);
    }

    return NextResponse.next();
}

// Configure which routes to run middleware on
export const config = {
    matcher: [
        '/api/:path*',
    ],
}; 