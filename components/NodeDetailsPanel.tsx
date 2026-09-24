'use client';

import { ArchitectureNodeData } from './nodes/ArchitectureNode';

interface NodeDetailsPanelProps {
  nodeData: ArchitectureNodeData | null;
  onClose: () => void;
}

const CATEGORY_COLORS = {
  frontend: '#3b82f6',
  backend: '#f97316',
  database: '#22c55e',
  infrastructure: '#a855f7',
  external: '#64748b',
  mobile: '#ec4899',
};

const CATEGORY_LABELS = {
  frontend: 'Frontend',
  backend: 'Backend',
  database: 'Database',
  infrastructure: 'Infrastructure',
  external: 'External',
  mobile: 'Mobile',
};

export default function NodeDetailsPanel({ nodeData, onClose }: NodeDetailsPanelProps) {
  if (!nodeData) return null;

  const color = CATEGORY_COLORS[nodeData.category] ?? CATEGORY_COLORS.external;

  return (
    <div className="absolute right-4 top-16 w-[360px] bg-[#111111] border border-[#2a2a2a] rounded-xl shadow-[0_8px_32px_rgba(0,0,0,0.8)] z-20 flex flex-col overflow-hidden transition-all duration-200 ease-out transform translate-x-0 opacity-100">
      {/* Accent Header */}
      <div className="h-1.5 w-full" style={{ backgroundColor: color }} />
      
      {/* Title Area */}
      <div className="px-5 pt-5 pb-4 border-b border-[#1a1a1a] flex items-start justify-between">
        <div className="flex gap-3 items-start">
          {nodeData.icon && (
            <div className="text-2xl mt-1">{nodeData.icon}</div>
          )}
          <div>
            <h3 className="text-white font-semibold text-lg leading-tight mb-1">
              {nodeData.label}
            </h3>
            <p className="text-[#a1a1aa] text-sm">
              {nodeData.tech}
            </p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="text-[#71717a] hover:text-white p-1 rounded-md transition-colors"
          aria-label="Close details"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Content Body */}
      <div className="p-5 flex flex-col gap-5">
        
        {/* Description Section */}
        <div>
          <h4 className="text-xs uppercase tracking-wider text-[#52525b] font-semibold mb-2">
            Purpose & Responsibilities
          </h4>
          <p className="text-[#d4d4d8] text-sm leading-relaxed">
            {nodeData.description || "No detailed description available."}
          </p>
        </div>

        {/* Metadata Grid */}
        <div className="grid grid-cols-2 gap-4 bg-[#1a1a1a] rounded-lg p-3 border border-[#2a2a2a]">
          <div>
            <span className="block text-[10px] uppercase text-[#71717a] mb-1">Category</span>
            <span className="text-xs font-medium text-white px-2 py-0.5 rounded-md" style={{ backgroundColor: `${color}20`, color: color }}>
              {CATEGORY_LABELS[nodeData.category]}
            </span>
          </div>
          <div>
            <span className="block text-[10px] uppercase text-[#71717a] mb-1">Confidence</span>
            <span className={`text-xs font-medium ${nodeData.confidence === 'inferred' ? 'text-yellow-500' : 'text-green-500'}`}>
              {nodeData.confidence === 'inferred' ? 'Inferred ~' : 'Confirmed ✓'}
            </span>
          </div>
          <div className="col-span-2">
            <span className="block text-[10px] uppercase text-[#71717a] mb-1">Role Subtitle</span>
            <span className="text-xs text-[#a1a1aa]">{nodeData.subtitle}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
