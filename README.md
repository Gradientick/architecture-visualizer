# Architecture Visualizer

Architecture Visualizer is a powerful, local-first tool that analyzes your codebases (or website URLs) and automatically generates highly detailed, interactive architectural diagrams. Powered by Next.js, React Flow, and Google's Gemini AI, it acts as an intelligent map for your projects.

## Features

- **End-to-End Mapping**: Automatically reads your local directory (or fetches website headers/HTML) and infers the full technical architecture using Gemini Flash models.
- **Node Clustering**: Intelligently groups related services by domain (e.g., "Core Backend", "Client Facing").
- **Path Tracing**: Click any node to instantly highlight its upstream dependencies and downstream consumers.
- **Guided Project Tour**: Automatically generates a step-by-step walkthrough of the architecture to help onboard new developers fast.
- **View Modes**: Switch between **Overview**, **Learn** (Tour), **Deep Dive** (inline descriptions), and **Diff** modes.
- **Fuzzy Search & Filters**: Instantly find specific nodes or filter the graph by categories (Frontend, Database, Infra, etc.).
- **Robust Persistence**: Sessions and file trees are saved to IndexedDB, meaning you never lose your analysis when you refresh the page.
- **Theming**: Toggle between Midnight, Warm Dark, and Light themes.

## Getting Started

### Prerequisites
- Node.js 18+
- A Google Gemini API Key (get one at [Google AI Studio](https://aistudio.google.com/app/apikey))

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the development server:
   ```bash
   npm run dev
   ```
4. Open [http://localhost:3000](http://localhost:3000) in your browser.
5. You will be prompted to enter your Gemini API Key on first launch.

### CLI Usage (Optional)

You can also run the visualizer directly against any local directory via the CLI:
```bash
npx architecture-visualizer ./path-to-your-project
```

## Tech Stack
- **Framework**: Next.js (App Router)
- **Diagramming**: React Flow
- **State Management**: Zustand
- **Search**: Fuse.js
- **Storage**: idb-keyval (IndexedDB)
- **AI**: @google/generative-ai
