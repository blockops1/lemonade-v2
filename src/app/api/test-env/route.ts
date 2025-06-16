import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    hasCronSecret: !!process.env.CRON_SECRET,
    envKeys: Object.keys(process.env).filter(key => !key.includes('SECRET')),
    nodeEnv: process.env.NODE_ENV,
  });
} 