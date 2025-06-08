import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { rateLimitMiddleware } from './middleware/rateLimit';
import { createValidationMiddleware, proofQuerySchema, leaderboardEntrySchema } from './middleware/validation';

export async function middleware(request: NextRequest) {
    // Only apply middleware to API routes
    if (request.nextUrl.pathname.startsWith('/api/')) {
        // Apply rate limiting
        const rateLimitResponse = await rateLimitMiddleware(request);
        if (rateLimitResponse.status !== 200) {
            return rateLimitResponse;
        }

        // Apply validation based on the route
        if (request.nextUrl.pathname.startsWith('/api/proof')) {
            return createValidationMiddleware(proofQuerySchema)(request);
        } else if (request.nextUrl.pathname.startsWith('/api/leaderboard') && request.method === 'POST') {
            return createValidationMiddleware(leaderboardEntrySchema)(request);
        }
    }

    return NextResponse.next();
}

// Configure which routes to run middleware on
export const config = {
    matcher: [
        '/api/:path*',
    ],
}; 