'use client';

import { memo } from 'react';
import { NodeResizer } from '@reactflow/node-resizer';
import '@reactflow/node-resizer/dist/style.css';
import type { NodeProps } from 'reactflow';

export interface GroupNodeData {
  label: string;
  description: string;
  category: 'frontend' | 'backend' | 'database' | 'infrastructure' | 'external' | 'mobile';
}

const CATEGORY_STYLES: Record<
  GroupNodeData['category'],
  { border: string; bg: string; headerText: string; dot: string }
> = {
  frontend:       { border: '#3b82f620', bg: '#3b82f606', headerText: '#3b82f6', dot: '#3b82f6' },
  backend:        { border: '#f9731620', bg: '#f9731606', headerText: '#f97316', dot: '#f97316' },
  database:       { border: '#22c55e20', bg: '#22c55e06', headerText: '#22c55e', dot: '#22c55e' },
  infrastructure: { border: '#a855f720', bg: '#a855f706', headerText: '#a855f7', dot: '#a855f7' },
  external:       { border: '#64748b20', bg: '#64748b06', headerText: '#64748b', dot: '#64748b' },
  mobile:         { border: '#ec489920', bg: '#ec489906', headerText: '#ec4899', dot: '#ec4899' },
};

function GroupNode({ data, selected }: NodeProps<GroupNodeData>) {
  const styles = CATEGORY_STYLES[data.category] ?? CATEGORY_STYLES.external;

  return (
    <div
      className="w-full h-full rounded-2xl overflow-hidden"
      style={{
        background: styles.bg,
        border: `1.5px solid ${selected ? styles.dot : styles.border}`,
        boxShadow: selected ? `0 0 0 1px ${styles.dot}40` : 'none',
        transition: 'border-color 0.2s, box-shadow 0.2s',
      }}
    >
      {/* Resizer handles (only visible on hover / selection) */}
      <NodeResizer
        color={styles.dot}
        isVisible={selected}
        minWidth={240}
        minHeight={140}
        lineStyle={{ border: `1px dashed ${styles.dot}60` }}
        handleStyle={{ width: 8, height: 8, borderRadius: 2 }}
      />

      {/* Group header */}
      <div
        className="px-4 py-2.5 flex items-center gap-2"
        style={{ borderBottom: `1px solid ${styles.border}` }}
      >
        <span
          className="w-2 h-2 rounded-full flex-shrink-0"
          style={{ background: styles.dot }}
        />
        <span
          className="text-xs font-semibold tracking-wide uppercase truncate"
          style={{ color: styles.headerText }}
        >
          {data.label}
        </span>
        {data.description && (
          <span className="text-[10px] text-[#52525b] ml-1 truncate hidden sm:block">
            — {data.description}
          </span>
        )}
      </div>
    </div>
  );
}

export default memo(GroupNode);
