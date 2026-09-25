import type { CSSProperties } from 'react';

export interface GraphNode {
  id: string;
  type: 'architectureNode';
  position: { x: number; y: number };
  data: {
    label: string;
    subtitle: string;
    description: string;
    category: 'frontend' | 'backend' | 'database' | 'infrastructure' | 'external' | 'mobile' | 'user' | 'process' | 'mockup';
    tech: string;        // e.g. "Next.js", "PostgreSQL"
    confidence: 'confirmed' | 'inferred';
    icon?: string;       // emoji or icon name
    inputSchema?: string;
    outputSchema?: string;
  };
  // React Flow parent/child — injected by clustering.ts, not from Gemini
  parentNode?: string;
  extent?: 'parent';
  style?: CSSProperties;
}

export interface GraphEdge {
  id: string;
  source: string;
  target: string;
  label?: string;         // e.g. "REST API", "SQL", "WebSocket"
  animated?: boolean;
}

export interface TechBadge {
  name: string;
  category: 'frontend' | 'backend' | 'database' | 'infrastructure' | 'language' | 'devops';
  version?: string;
}

/** A named cluster / container for grouping related nodes */
export interface GraphGroup {
  id: string;
  label: string;
  description: string;
  category: GraphNode['data']['category'];
  nodeIds: string[];
}

/** A single step in the guided project tour */
export interface TourStep {
  id: number;
  title: string;
  description: string;
  focusNodeIds: string[];
}

export interface ArchitectureGraph {
  nodes: GraphNode[];
  edges: GraphEdge[];
  techStack: TechBadge[];
  summary: string;
  /** Gemini-generated node groups / clusters */
  groups?: GraphGroup[];
  /** Gemini-generated guided tour steps */
  tour?: TourStep[];
}

// ── Prompt builders ──────────────────────────────────────────────────────────

const SYSTEM_PROMPT = `You are an expert software architect specializing in analyzing codebases and inferring application architecture.
Your job is to analyze the provided project metadata and generate a clear, accurate, highly detailed architecture diagram in JSON format.

RULES:
1. Return ONLY valid JSON. No markdown, no code fences, no explanation text.
2. The JSON must exactly match the schema provided.
3. Assign logical x/y positions so nodes don't overlap. Use a left-to-right or top-to-bottom flow layout.
4. Use "confirmed" confidence only for things explicitly proven by config files.
5. Use "inferred" for things you are deducing.
6. Keep labels concise (max 4-5 words). Use descriptions for deep context.
7. COMPREHENSIVE COVERAGE: Do NOT summarize the entire app into just 3 or 4 nodes. Map out the full end-to-end architecture (all major directories, internal services, databases, external APIs, CI/CD pipelines, and infrastructure layers found in the tree).
8. Edges should show meaningful data flows, not just generic connections. Include labels like "REST", "gRPC", "Pub/Sub".
9. Always include "groups" that cluster related nodes by layer or domain (e.g. "Frontend", "Microservices", "Data Layer"). Every node must belong to exactly one group.
10. Always include a "tour" with 5-10 sequential steps that guide someone through the architecture from the user entry point down to the data layer.`;

const JSON_SCHEMA = `{
  "nodes": [
    {
      "id": "string (unique, e.g. 'frontend-1')",
      "type": "architectureNode",
      "position": { "x": number, "y": number },
      "data": {
        "label": "string (short name, e.g. 'Next.js Frontend')",
        "subtitle": "string (role, e.g. 'Server-Side Rendered UI')",
        "description": "string (2-3 detailed sentences explaining what this component does, its responsibilities, and why it exists)",
        "category": "frontend | backend | database | infrastructure | external | mobile",
        "tech": "string (primary technology, e.g. 'Next.js')",
        "confidence": "confirmed | inferred",
        "icon": "string (emoji representing the tech, e.g. '⚛️')"
      }
    }
  ],
  "edges": [
    {
      "id": "string (unique, e.g. 'e1-2')",
      "source": "string (node id)",
      "target": "string (node id)",
      "label": "string (protocol/method, e.g. 'REST API')",
      "animated": boolean
    }
  ],
  "techStack": [
    {
      "name": "string (e.g. 'Next.js')",
      "category": "frontend | backend | database | infrastructure | language | devops",
      "version": "string (if detectable, else omit)"
    }
  ],
  "summary": "string (1-2 sentences describing the architecture)",
  "groups": [
    {
      "id": "string (unique, e.g. 'group-frontend')",
      "label": "string (group display name, e.g. 'Frontend Layer')",
      "description": "string (1 sentence describing what belongs here)",
      "category": "frontend | backend | database | infrastructure | external | mobile",
      "nodeIds": ["array of node ids that belong to this group"]
    }
  ],
  "tour": [
    {
      "id": number,
      "title": "string (short step name, e.g. 'Architecture Overview')",
      "description": "string (2-4 sentences walkthrough — explain what these nodes do and how they connect)",
      "focusNodeIds": ["node ids to highlight in this step"]
    }
  ]
}`;

export function buildLocalAnalysisPrompt(
  projectName: string,
  treeString: string,
  configFiles: Record<string, string>,
  customInstructions?: string
): string {
  const configSection = Object.entries(configFiles)
    .map(([file, content]) => `--- ${file} ---\n${content}`)
    .join('\n\n');

  const instructionsText = customInstructions 
    ? `\nUSER INSTRUCTIONS (Follow these explicitly):\n${customInstructions}\n`
    : '';

  return `${SYSTEM_PROMPT}

PROJECT: "${projectName}"
${instructionsText}
DIRECTORY STRUCTURE:
${treeString}

CONFIGURATION FILES:
${configSection || '(no standard config files found)'}

Analyze this project and return architecture JSON matching this exact schema:
${JSON_SCHEMA}`;
}

export function buildUrlAnalysisPrompt(
  url: string,
  headers: Record<string, string>,
  htmlSnippet: string,
  customInstructions?: string
): string {
  const headerSection = Object.entries(headers)
    .map(([k, v]) => `${k}: ${v}`)
    .join('\n');

  const instructionsText = customInstructions 
    ? `\nUSER INSTRUCTIONS (Follow these explicitly):\n${customInstructions}\n`
    : '';

  return `${SYSTEM_PROMPT}

WEBSITE URL: "${url}"
${instructionsText}
HTTP RESPONSE HEADERS:
${headerSection}

HTML BODY (first 30KB):
${htmlSnippet}

Based on the headers and HTML, determine the tech stack and hypothesize the full architecture.
Mark anything not directly visible in the HTML/headers as "inferred" confidence.
Return architecture JSON matching this exact schema:
${JSON_SCHEMA}`;
}
