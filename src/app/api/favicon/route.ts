import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET() {
    console.log('[Favicon API] Handling favicon request');
    
    try {
        const faviconPath = path.join(process.cwd(), 'public', 'favicon.ico');
        console.log('[Favicon API] Reading favicon from:', faviconPath);
        
        const fileExists = fs.existsSync(faviconPath);
        console.log('[Favicon API] File exists:', fileExists);
        
        if (!fileExists) {
            console.error('[Favicon API] Favicon file not found');
            return new NextResponse('Favicon not found', { status: 404 });
        }

        const fileBuffer = fs.readFileSync(faviconPath);
        console.log('[Favicon API] File size:', fileBuffer.length);

        return new NextResponse(fileBuffer, {
            headers: {
                'Content-Type': 'image/x-icon',
                'Cache-Control': 'public, max-age=31536000',
            },
        });
    } catch (error) {
        console.error('[Favicon API] Error serving favicon:', error);
        return new NextResponse('Internal Server Error', { status: 500 });
    }
} 