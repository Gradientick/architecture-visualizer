# Agent Instructions

This document provides context, architectural rules, and guidelines for any AI agent (like Antigravity or GitHub Copilot) working on the Architecture Visualizer codebase.

## 1. Project Context
Architecture Visualizer is a Next.js application that parses file trees or web URLs and passes them to the Gemini AI API to generate an interactive graph (rendered with React Flow). 
The core philosophy is: **Heavy lifting by the LLM, rich interactivity by the client**. We prefer asking the LLM to do the clustering and tour generation in a single prompt rather than trying to calculate heuristics on the client.

## 2. Architecture & State Management
- **Single Source of Truth**: The app uses `zustand` (`lib/store.ts`) for all UI state (view mode, active filters, search query, selected nodes, active theme). Do NOT prop-drill state through components.
- **Persistence**: We use `idb-keyval` (IndexedDB) for saving sessions and file trees because architecture JSON objects can easily exceed the 5MB `localStorage` limit. `localStorage` is only used for lightweight settings (like the theme).
- **React Flow Constraints**: Always manage node classes/styling dynamically in `useMemo` hooks (e.g. `DiagramCanvas.tsx`) based on the Zustand store instead of updating the internal React Flow node states, which causes performance issues.

## 3. Semantic Versioning Rule for Agents
Agents must strictly adhere to the following **Semantic Versioning (SemVer)** protocol when modifying the project version in `package.json` or tagging releases:

- **MAJOR (X.0.0)**: Use when making incompatible API changes, overhauling the React Flow architecture, replacing the underlying LLM provider in a way that breaks previous graph schemas, or removing existing view modes.
- **MINOR (0.X.0)**: Use when adding new, backwards-compatible functionality. Examples include: adding a new View Mode (e.g., Diff Mode), introducing a new UI panel, or adding support for new API parameters.
- **PATCH (0.0.X)**: Use for backwards-compatible bug fixes, UI polish, animation tweaks, prompt optimizations (without schema changes), and dependency updates.

*When an agent modifies the codebase, it should evaluate whether the changes warrant a version bump according to this rule, and if so, propose the bump to the user.*

## 4. LLM API Resilience
- **Model Fallbacks**: The Gemini API occasionally experiences 503 Service Unavailable errors due to high demand. API routes (`app/api/analyze-local/route.ts`, etc.) must implement graceful try/catch blocks that automatically wait and retry, or fallback to an available model (e.g. `gemini-2.5-flash`).
- **Prompt Modifications**: Any changes to the JSON schema in `lib/prompts.ts` MUST be strictly reflected in the TypeScript interfaces (`GraphNode`, `GraphEdge`, `ArchitectureGraph`).

## 5. UI / UX Guidelines
- **CSS Variables Only**: Do not hardcode hex colors in components. Always use CSS variables (`var(--bg-primary)`, `var(--text-muted)`) so the Theme System (`lib/theme.ts`) continues to work flawlessly.
- **Animations**: Use pure CSS transitions where possible for performance, especially when dimming/highlighting nodes during Path Tracing or Search.
