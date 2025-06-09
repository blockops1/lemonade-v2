import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// List of allowed origins
const allowedOrigins = [
    'https://lemonade-game.vercel.app',
    'http://localhost:3000',
    'http://localhost:3001',
    'http://127.0.0.1:3000',
    'http://127.0.0.1:3001',
];

// CORS middleware function
export async function corsMiddleware(request: NextRequest) {
    // Get the origin from the request headers
    const origin = request.headers.get('origin') || '';

    // Check if the origin is allowed
    const isAllowedOrigin = allowedOrigins.includes(origin);

    // Handle preflight requests
    if (request.method === 'OPTIONS') {
        return new NextResponse(null, {
            status: 204,
            headers: {
                'Access-Control-Allow-Origin': isAllowedOrigin ? origin : allowedOrigins[0],
                'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS, PATCH',
                'Access-Control-Allow-Headers': '*',
                'Access-Control-Max-Age': '86400', // 24 hours
                'Access-Control-Allow-Credentials': 'true',
            },
        });
    }

    // For actual requests, add CORS headers to the response
    const response = NextResponse.next();

    // Add CORS headers
    if (isAllowedOrigin) {
        response.headers.set('Access-Control-Allow-Origin', origin);
        response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
        response.headers.set('Access-Control-Allow-Headers', '*');
        response.headers.set('Access-Control-Allow-Credentials', 'true');
    }

    return response;
} 