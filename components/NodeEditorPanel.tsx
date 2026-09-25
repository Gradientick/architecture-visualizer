'use client';

import { useState } from 'react';
import { useAppStore } from '@/lib/store';
import type { ArchitectureNodeData } from './nodes/ArchitectureNode';
import type { NodeCategory } from '@/lib/store';
import type { GraphNode } from '@/lib/prompts';

interface NodeEditorPanelProps {
  nodeId: string | null;
  initialData: ArchitectureNodeData | null;
  onClose: () => void;
}

export default function NodeEditorPanel({ nodeId, initialData, onClose }: NodeEditorPanelProps) {
  const { updateNodeInActiveSession, addNodeToActiveSession } = useAppStore();

  const [label, setLabel] = useState(initialData?.label || 'New Node');
  const [subtitle, setSubtitle] = useState(initialData?.subtitle || '');
  const [description, setDescription] = useState(initialData?.description || '');
  const [category, setCategory] = useState<NodeCategory>(initialData?.category || 'backend');
  const [tech, setTech] = useState(initialData?.tech || '');
  const [inputSchema, setInputSchema] = useState(initialData?.inputSchema || '');
  const [outputSchema, setOutputSchema] = useState(initialData?.outputSchema || '');

  const handleSave = () => {
    const data: ArchitectureNodeData = {
      label,
      subtitle,
      description,
      category,
      tech,
      confidence: initialData?.confidence || 'confirmed',
      inputSchema,
      outputSchema,
    };

    if (nodeId) {
      updateNodeInActiveSession(nodeId, data);
    } else {
      const newNode: GraphNode = {
        id: crypto.randomUUID(),
        type: 'architectureNode',
        position: { x: 0, y: 0 },
        data,
      };
      addNodeToActiveSession(newNode);
    }
    onClose();
  };

  return (
    <div className="flex flex-col gap-3 p-1">
      <div>
        <label className="block text-[10px] uppercase text-[var(--text-muted)] mb-1">Name</label>
        <input type="text" value={label} onChange={e => setLabel(e.target.value)} className="w-full bg-[var(--bg-primary)] border border-[var(--border)] rounded px-2 py-1 text-xs text-white" />
      </div>
      <div>
        <label className="block text-[10px] uppercase text-[var(--text-muted)] mb-1">Category</label>
        <select value={category} onChange={e => setCategory(e.target.value as NodeCategory)} className="w-full bg-[var(--bg-primary)] border border-[var(--border)] rounded px-2 py-1 text-xs text-white">
          <option value="frontend">Frontend</option>
          <option value="backend">Backend</option>
          <option value="database">Database</option>
          <option value="infrastructure">Infrastructure</option>
          <option value="external">External</option>
          <option value="mobile">Mobile</option>
          <option value="user">User / Actor</option>
          <option value="process">Process / Step</option>
          <option value="mockup">UI / Screen</option>
        </select>
      </div>
      <div>
        <label className="block text-[10px] uppercase text-[var(--text-muted)] mb-1">Tech / Tool</label>
        <input type="text" value={tech} onChange={e => setTech(e.target.value)} className="w-full bg-[var(--bg-primary)] border border-[var(--border)] rounded px-2 py-1 text-xs text-white" />
      </div>
      <div>
        <label className="block text-[10px] uppercase text-[var(--text-muted)] mb-1">Role / Subtitle</label>
        <input type="text" value={subtitle} onChange={e => setSubtitle(e.target.value)} className="w-full bg-[var(--bg-primary)] border border-[var(--border)] rounded px-2 py-1 text-xs text-white" />
      </div>
      <div>
        <label className="block text-[10px] uppercase text-[var(--text-muted)] mb-1">Description</label>
        <textarea value={description} onChange={e => setDescription(e.target.value)} rows={3} className="w-full bg-[var(--bg-primary)] border border-[var(--border)] rounded px-2 py-1 text-xs text-white" />
      </div>
      <div>
        <label className="block text-[10px] uppercase text-[var(--text-muted)] mb-1">Input Schema</label>
        <textarea value={inputSchema} onChange={e => setInputSchema(e.target.value)} rows={3} className="w-full bg-[var(--bg-primary)] border border-[var(--border)] rounded px-2 py-1 text-xs text-white font-mono" placeholder="JSON or description..." />
      </div>
      <div>
        <label className="block text-[10px] uppercase text-[var(--text-muted)] mb-1">Output Schema</label>
        <textarea value={outputSchema} onChange={e => setOutputSchema(e.target.value)} rows={3} className="w-full bg-[var(--bg-primary)] border border-[var(--border)] rounded px-2 py-1 text-xs text-white font-mono" placeholder="JSON or description..." />
      </div>
      
      <div className="flex gap-2 mt-2">
        <button onClick={handleSave} className="flex-1 bg-[var(--accent)] text-white text-xs py-1.5 rounded hover:opacity-90 transition-opacity">Save</button>
        <button onClick={onClose} className="flex-1 bg-[var(--bg-primary)] text-white text-xs py-1.5 rounded border border-[var(--border)] hover:bg-[var(--bg-card)] transition-colors">Cancel</button>
      </div>
    </div>
  );
}
