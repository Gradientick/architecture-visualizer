import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { readConfig } from '@/lib/config';
import { buildUrlAnalysisPrompt } from '@/lib/prompts';

export async function POST(req: NextRequest) {
  const config = readConfig();
  if (!config) {
    return NextResponse.json({ error: 'No API key configured. Please complete setup.' }, { status: 401 });
  }

  const body = await req.json();
  const { url, customInstructions } = body as { url: string; customInstructions?: string };

  if (!url) {
    return NextResponse.json({ error: 'url is required' }, { status: 400 });
  }

  // Validate URL
  let parsedUrl: URL;
  try {
    parsedUrl = new URL(url);
  } catch {
    return NextResponse.json({ error: 'Invalid URL' }, { status: 400 });
  }

  // Phase 1: Fetch the website (deterministic)
  let htmlSnippet = '';
  let headers: Record<string, string> = {};

  try {
    const response = await fetch(parsedUrl.toString(), {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; ArchitectureVisualizer/1.0)',
      },
      signal: AbortSignal.timeout(10000), // 10s timeout
    });

    // Capture response headers
    response.headers.forEach((value, key) => {
      headers[key] = value;
    });

    // Read first 30KB of HTML
    const text = await response.text();
    htmlSnippet = text.slice(0, 30 * 1024);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to fetch URL';
    return NextResponse.json({ error: `Could not fetch URL: ${message}` }, { status: 400 });
  }

  // Phase 2: LLM analysis
  const prompt = buildUrlAnalysisPrompt(url, headers, htmlSnippet, customInstructions);

  try {
    const genAI = new GoogleGenerativeAI(config.geminiApiKey);
    let model = genAI.getGenerativeModel({
      model: 'gemini-2.5-flash',
      generationConfig: {
        responseMimeType: 'application/json',
        temperature: 0.3, // Slightly more creative for hypothesis
      },
    });

    let result;
    try {
      result = await model.generateContent(prompt);
    } catch (flashErr: any) {
      if (flashErr?.message?.includes('503') || flashErr?.status === 503) {
        console.log('Flash model 503, retrying in 2 seconds...');
        await new Promise(resolve => setTimeout(resolve, 2000));
        result = await model.generateContent(prompt);
      } else {
        throw flashErr;
      }
    }

    const text = result.response.text();

    // Clean potential markdown blocks
    const cleanText = text.replace(/```json/gi, '').replace(/```/g, '').trim();

    let graph;
    try {
      graph = JSON.parse(cleanText);
    } catch (parseErr) {
      console.error('Failed to parse LLM JSON output. Raw text:', text);
      return NextResponse.json({ error: 'LLM returned invalid JSON', raw: text }, { status: 500 });
    }

    return NextResponse.json({ graph, url });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'LLM request failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
