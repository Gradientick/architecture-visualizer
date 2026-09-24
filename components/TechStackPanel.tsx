'use client';

import type { TechBadge } from '@/lib/prompts';

const CATEGORY_COLORS: Record<TechBadge['category'], string> = {
  frontend:       'bg-blue-500/10 text-blue-300 border-blue-500/20',
  backend:        'bg-orange-500/10 text-orange-300 border-orange-500/20',
  database:       'bg-green-500/10 text-green-300 border-green-500/20',
  infrastructure: 'bg-purple-500/10 text-purple-300 border-purple-500/20',
  language:       'bg-yellow-500/10 text-yellow-300 border-yellow-500/20',
  devops:         'bg-cyan-500/10 text-cyan-300 border-cyan-500/20',
};

interface TechStackPanelProps {
  techStack: TechBadge[];
  summary?: string;
}

export default function TechStackPanel({ techStack, summary }: TechStackPanelProps) {
  if (!techStack || techStack.length === 0) return null;

  return (
    <div className="border-t border-[#1a1a1a] bg-[#0d0d0d] px-4 py-3">
      {summary && (
        <p className="text-[#71717a] text-xs mb-3 leading-relaxed">{summary}</p>
      )}
      <div className="flex flex-wrap gap-1.5">
        {techStack.map((tech, i) => (
          <span
            key={i}
            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium border ${
              CATEGORY_COLORS[tech.category] ?? CATEGORY_COLORS.backend
            }`}
          >
            {tech.name}
            {tech.version && (
              <span className="opacity-60 font-normal">v{tech.version}</span>
            )}
          </span>
        ))}
      </div>
    </div>
  );
}
