import fs from 'fs';
import path from 'path';
import os from 'os';

export interface ArchVizConfig {
  geminiApiKey: string;
}

const CONFIG_DIR = path.join(os.homedir(), '.arch-viz');
const CONFIG_FILE = path.join(CONFIG_DIR, 'config.json');

export function readConfig(): ArchVizConfig | null {
  try {
    if (!fs.existsSync(CONFIG_FILE)) return null;
    const raw = fs.readFileSync(CONFIG_FILE, 'utf-8');
    return JSON.parse(raw) as ArchVizConfig;
  } catch {
    return null;
  }
}

export function writeConfig(config: ArchVizConfig): void {
  if (!fs.existsSync(CONFIG_DIR)) {
    fs.mkdirSync(CONFIG_DIR, { recursive: true });
  }
  fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2), 'utf-8');
}

export function hasConfig(): boolean {
  return readConfig() !== null;
}
