import rateLimit from 'express-rate-limit';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Create a rate limiter configuration
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per windowMs
    message: 'Too many requests from this IP, please try again later.',
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});

// Middleware function to apply rate limiting
export async function rateLimitMiddleware(request: NextRequest) {
    try {
        // Get the client's IP address
        const ip = request.ip || request.headers.get('x-forwarded-for') || 'unknown';
        
        // Apply rate limiting
        await new Promise((resolve, reject) => {
            limiter({
                ip,
                headers: Object.fromEntries(request.headers),
                method: request.method,
                path: request.nextUrl.pathname,
            } as any, {
                statusCode: 429,
                setHeader: (name: string, value: string) => {
                    // Headers will be set by Next.js
                },
                end: () => {
                    reject(new Error('Rate limit exceeded'));
                },
            } as any, resolve);
        });

        return NextResponse.next();
    } catch (error) {
        // If rate limit is exceeded, return a 429 response
        return new NextResponse('Too many requests, please try again later.', {
            status: 429,
            headers: {
                'Content-Type': 'text/plain',
                'Retry-After': '900', // 15 minutes in seconds
            },
        });
    }
}

// Export a function to create rate limiters with custom options
export function createRateLimiter(options: {
    windowMs?: number;
    max?: number;
    message?: string;
}) {
    return rateLimit({
        windowMs: options.windowMs || 15 * 60 * 1000,
        max: options.max || 100,
        message: options.message || 'Too many requests from this IP, please try again later.',
        standardHeaders: true,
        legacyHeaders: false,
    });
} 