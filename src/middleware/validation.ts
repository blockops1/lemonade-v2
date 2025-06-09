import { z } from 'zod';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Schema for proof API query parameters
export const proofQuerySchema = z.object({
    extrinsicId: z.string().min(1, 'Extrinsic ID is required'),
});

// Schema for leaderboard POST request body
export const leaderboardEntrySchema = z.object({
    address: z.string().min(1, 'Address is required'),
    score: z.number().min(0, 'Score must be a positive number'),
    proof_url: z.string().url('Proof URL must be a valid URL'),
});

// Validation middleware factory
export function createValidationMiddleware(schema: z.ZodSchema) {
    return async (request: NextRequest) => {
        try {
            if (request.method === 'GET') {
                // Validate query parameters
                const searchParams = new URL(request.url).searchParams;
                const params = Object.fromEntries(searchParams.entries());
                await schema.parseAsync(params);
            } else if (request.method === 'POST') {
                // Validate request body
                const body = await request.json();
                await schema.parseAsync(body);
            }
            return NextResponse.next();
        } catch (error) {
            if (error instanceof z.ZodError) {
                return NextResponse.json(
                    { 
                        error: 'Validation failed',
                        details: error.errors 
                    },
                    { status: 400 }
                );
            }
            return NextResponse.json(
                { error: 'Invalid request' },
                { status: 400 }
            );
        }
    };
}

// Pre-validated request types
export type ValidatedProofRequest = z.infer<typeof proofQuerySchema>;
export type ValidatedLeaderboardRequest = z.infer<typeof leaderboardEntrySchema>; 