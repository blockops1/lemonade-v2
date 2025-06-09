import rateLimit from 'express-rate-limit';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Simple in-memory store for rate limiting
// In production, you should use a more persistent solution like Redis
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

export const createRateLimitMiddleware = (options: {
    windowMs?: number;
    max?: number;
}) => {
    const { windowMs = 15 * 60 * 1000, max = 100 } = options;

    return async function rateLimitMiddleware(request: NextRequest) {
        // Get the IP address from the request
        const ip = request.ip || 'unknown';
        const key = `rate-limit:${ip}`;

        // Get the current count from the request headers
        const currentCount = parseInt(request.headers.get('x-rate-limit-count') || '0', 10);

        // Check if the request should be rate limited
        if (currentCount >= max) {
            return new NextResponse('Too Many Requests', {
                status: 429,
                headers: {
                    'Retry-After': Math.ceil(windowMs / 1000).toString(),
                },
            });
        }

        // Increment the count and set the headers
        const response = NextResponse.next();
        response.headers.set('x-rate-limit-count', (currentCount + 1).toString());
        response.headers.set('x-rate-limit-limit', max.toString());
        response.headers.set('x-rate-limit-remaining', (max - currentCount - 1).toString());
        response.headers.set('x-rate-limit-reset', (Date.now() + windowMs).toString());

        return response;
    };
}; 