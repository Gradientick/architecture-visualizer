import fs from 'fs';
import path from 'path';

// Directories and files to always ignore during traversal
const IGNORE_DIRS = new Set([
  'node_modules', '.git', '.next', 'dist', 'build', 'out',
  '__pycache__', '.venv', 'venv', 'env', '.env', 'vendor',
  'target', '.cargo', 'coverage', '.nyc_output', '.cache',
  '.turbo', '.vercel', '.netlify', 'storybook-static',
]);

// Config files that contain the most architectural signal
const CONFIG_FILES = [
  'package.json',
  'package-lock.json',
  'yarn.lock',
  'pnpm-lock.yaml',
  'requirements.txt',
  'pyproject.toml',
  'setup.py',
  'Pipfile',
  'go.mod',
  'go.sum',
  'Cargo.toml',
  'composer.json',
  'Gemfile',
  'build.gradle',
  'pom.xml',
  'docker-compose.yml',
  'docker-compose.yaml',
  'Dockerfile',
  '.dockerignore',
  'nginx.conf',
  'next.config.js',
  'next.config.ts',
  'next.config.mjs',
  'vite.config.js',
  'vite.config.ts',
  'webpack.config.js',
  'tsconfig.json',
  '.env.example',
  '.env.sample',
  'Makefile',
  'Procfile',
  'app.yaml',
  'serverless.yml',
  'terraform.tf',
  'kubernetes.yml',
  'k8s.yml',
  'helm.yaml',
  'vercel.json',
  'netlify.toml',
  'firebase.json',
  'supabase/config.toml',
  'prisma/schema.prisma',
  'drizzle.config.ts',
  'knexfile.js',
];

export interface FileTreeNode {
  name: string;
  type: 'file' | 'directory';
  children?: FileTreeNode[];
}

export interface AnalysisContext {
  tree: FileTreeNode;
  configFiles: Record<string, string>;
}

function buildTree(dirPath: string, depth = 0, maxDepth = 4): FileTreeNode {
  const name = path.basename(dirPath);
  const stat = fs.statSync(dirPath);

  if (stat.isFile()) {
    return { name, type: 'file' };
  }

  const node: FileTreeNode = { name, type: 'directory', children: [] };

  if (depth >= maxDepth) return node;

  let entries: string[] = [];
  try {
    entries = fs.readdirSync(dirPath);
  } catch {
    return node;
  }

  for (const entry of entries) {
    if (IGNORE_DIRS.has(entry) || entry.startsWith('.')) {
      // Still include hidden config files at root level
      if (depth === 0 && entry.startsWith('.') && !entry.startsWith('..')) {
        const fullPath = path.join(dirPath, entry);
        try {
          const s = fs.statSync(fullPath);
          if (s.isFile()) {
            node.children!.push({ name: entry, type: 'file' });
          }
        } catch { /* ignore */ }
      }
      continue;
    }
    const fullPath = path.join(dirPath, entry);
    try {
      const child = buildTree(fullPath, depth + 1, maxDepth);
      node.children!.push(child);
    } catch { /* ignore unreadable paths */ }
  }

  return node;
}

function readConfigFiles(rootPath: string): Record<string, string> {
  const result: Record<string, string> = {};
  const MAX_FILE_SIZE = 50 * 1024; // 50KB per file cap

  for (const relPath of CONFIG_FILES) {
    const fullPath = path.join(rootPath, relPath);
    try {
      if (fs.existsSync(fullPath)) {
        const stat = fs.statSync(fullPath);
        if (stat.isFile() && stat.size <= MAX_FILE_SIZE) {
          result[relPath] = fs.readFileSync(fullPath, 'utf-8');
        }
      }
    } catch { /* skip unreadable */ }
  }

  return result;
}

export function analyzeLocalDirectory(dirPath: string): AnalysisContext {
  const resolved = path.resolve(dirPath);
  if (!fs.existsSync(resolved)) {
    throw new Error(`Directory not found: ${resolved}`);
  }
  const stat = fs.statSync(resolved);
  if (!stat.isDirectory()) {
    throw new Error(`Path is not a directory: ${resolved}`);
  }

  const tree = buildTree(resolved);
  const configFiles = readConfigFiles(resolved);

  return { tree, configFiles };
}

export function treeToString(node: FileTreeNode, indent = 0): string {
  const prefix = '  '.repeat(indent);
  const icon = node.type === 'directory' ? '📁' : '📄';
  let result = `${prefix}${icon} ${node.name}\n`;
  if (node.children) {
    for (const child of node.children) {
      result += treeToString(child, indent + 1);
    }
  }
  return result;
}
