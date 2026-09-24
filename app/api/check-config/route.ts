import { NextResponse } from 'next/server';
import { hasConfig } from '@/lib/config';

export async function GET() {
  return NextResponse.json({ configured: hasConfig() });
}
