import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { writeConfig } from '@/lib/config';

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { apiKey } = body as { apiKey: string };

  if (!apiKey || apiKey.length < 10) {
    return NextResponse.json({ error: 'Invalid API key format' }, { status: 400 });
  }

  // Test the key with a lightweight call
  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    let model = genAI.getGenerativeModel({ model: 'gemini-3.6-flash' });
    
    try {
      await model.generateContent('Reply with the single word: ok');
    } catch (flashErr: any) {
      if (flashErr?.message?.includes('503') || flashErr?.status === 503) {
        console.log('Flash model 503 during validation. Accepting key anyway to unblock user.');
        // Do not throw; let the key be accepted so they can enter the app
      } else {
        throw flashErr;
      }
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Key validation failed';
    return NextResponse.json({ error: `API key is invalid: ${message}` }, { status: 400 });
  }

  // Save to config
  writeConfig({ geminiApiKey: apiKey });

  return NextResponse.json({ success: true });
}
