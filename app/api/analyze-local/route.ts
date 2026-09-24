import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { readConfig } from '@/lib/config';
import { analyzeLocalDirectory, treeToString } from '@/lib/analyzer';
import { buildLocalAnalysisPrompt } from '@/lib/prompts';
import path from 'path';

export async function POST(req: NextRequest) {
  const config = readConfig();
  if (!config) {
    return NextResponse.json({ error: 'No API key configured. Please complete setup.' }, { status: 401 });
  }

  const body = await req.json();
  const { dirPath, customInstructions } = body as { dirPath: string; customInstructions?: string };

  if (!dirPath) {
    return NextResponse.json({ error: 'dirPath is required' }, { status: 400 });
  }

  // Phase 1: Read file tree and config files (deterministic, fast)
  let context;
  try {
    context = analyzeLocalDirectory(dirPath);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to read directory';
    return NextResponse.json({ error: message }, { status: 400 });
  }

  const projectName = path.basename(dirPath);
  const treeString = treeToString(context.tree);

  // Phase 2: LLM analysis
  const prompt = buildLocalAnalysisPrompt(projectName, treeString, context.configFiles, customInstructions);

  try {
    const genAI = new GoogleGenerativeAI(config.geminiApiKey);
    let model = genAI.getGenerativeModel({
      model: 'gemini-2.5-flash',
      generationConfig: {
        responseMimeType: 'application/json',
        temperature: 0.2,
      },
    });

    let result;
    try {
      result = await model.generateContent(prompt);
    } catch (flashErr: any) {
      if (flashErr?.message?.includes('503') || flashErr?.status === 503) {
        console.log('Flash model 503, retrying with gemini-2.5-flash in 2 seconds...');
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

    return NextResponse.json({
      graph,
      projectName,
      tree: context.tree,
      configFileNames: Object.keys(context.configFiles),
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'LLM request failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
