import { GoogleGenerativeAI } from '@google/generative-ai';
import { readConfig } from './lib/config';

async function testModels() {
  const config = readConfig();
  if (!config) {
    console.error('No config found.');
    return;
  }
  const genAI = new GoogleGenerativeAI(config.geminiApiKey);
  const modelsToTest = ['gemini-3.6-flash', 'gemini-3.6-pro', 'gemini-2.5-flash', 'gemini-1.5-pro', 'gemini-1.5-flash'];
  
  for (const m of modelsToTest) {
    console.log(`Testing ${m}...`);
    try {
      const model = genAI.getGenerativeModel({ model: m });
      await model.generateContent('ok');
      console.log(`✅ ${m} works!`);
    } catch (err: any) {
      console.log(`❌ ${m} failed: ${err.message}`);
    }
  }
}

testModels();
