import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createRateLimitMiddleware } from './middleware/rateLimit';
import { corsMiddleware } from './middleware/cors';
import { createValidationMiddleware } from './middleware/validation';
import { proofQuerySchema, leaderboardEntrySchema } from './middleware/validation';

// Create rate limit middleware
const rateLimitMiddleware = createRateLimitMiddleware({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
});

export async function middleware(request: NextRequest) {
  // Apply CORS middleware first
  const corsResponse = await corsMiddleware(request);
  if (corsResponse.status !== 200) {
    return corsResponse;
  }

  // Apply rate limiting
  const rateLimitResponse = await rateLimitMiddleware(request);
  if (rateLimitResponse.status === 429) {
    return rateLimitResponse;
  }

  // Apply validation based on the path and method
  if (request.nextUrl.pathname === '/api/proof' && request.method === 'GET') {
    const validationResponse = await createValidationMiddleware(proofQuerySchema)(request);
    if (validationResponse.status === 400) {
      return validationResponse;
    }
  }

  if (request.nextUrl.pathname === '/api/leaderboard' && request.method === 'POST') {
    const validationResponse = await createValidationMiddleware(leaderboardEntrySchema)(request);
    if (validationResponse.status === 400) {
      return validationResponse;
    }
  }

  // Log favicon requests
  if (request.nextUrl.pathname === '/favicon.ico') {
    console.log('[Middleware] Favicon request:', {
      url: request.url,
      method: request.method,
      headers: Object.fromEntries(request.headers.entries()),
    });
  }

  return NextResponse.next();
}

// Configure which routes to run middleware on
export const config = {
  matcher: [
    '/api/:path*',
    '/favicon.ico',
  ],
}; 