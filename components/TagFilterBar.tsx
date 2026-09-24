'use client';

import { useAppStore, type NodeCategory } from '@/lib/store';

interface Tag {
  id: NodeCategory;
  label: string;
  color: string;
  bg: string;
}

const TAGS: Tag[] = [
  { id: 'frontend',       label: 'Frontend',       color: '#3b82f6', bg: '#3b82f615' },
  { id: 'backend',        label: 'Backend',        color: '#f97316', bg: '#f9731615' },
  { id: 'database',       label: 'Data',           color: '#22c55e', bg: '#22c55e15' },
  { id: 'infrastructure', label: 'Infra',          color: '#a855f7', bg: '#a855f715' },
  { id: 'external',       label: 'External',       color: '#64748b', bg: '#64748b15' },
  { id: 'mobile',         label: 'Mobile',         color: '#ec4899', bg: '#ec489915' },
];

export default function TagFilterBar() {
  const { activeFilters, toggleFilter, clearFilters, searchQuery, setSearchQuery } = useAppStore();

  const hasActiveFilters = activeFilters.length > 0 || searchQuery.length > 0;

  return (
    <div className="h-10 flex items-center gap-3 px-4 border-b border-[var(--border)] bg-[var(--bg-primary)] flex-shrink-0 overflow-x-auto scrollbar-hide">
      {/* Search box */}
      <div className="relative flex-shrink-0">
        <svg
          className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[var(--text-muted)]"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search nodes..."
          className="h-7 pl-8 pr-3 bg-[var(--bg-secondary)] border border-[var(--border)] rounded-md text-[12px] text-[var(--text-secondary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--accent)] w-40 transition-colors"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-secondary)]"
          >
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {/* Divider */}
      <div className="w-px h-5 bg-[var(--border)] flex-shrink-0" />

      {/* Category tag pills */}
      {TAGS.map((tag) => {
        const isActive = activeFilters.includes(tag.id);
        return (
          <button
            key={tag.id}
            onClick={() => toggleFilter(tag.id)}
            className={`
              flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium
              border transition-all duration-150 flex-shrink-0
              ${isActive
                ? 'border-transparent'
                : 'border-[var(--border)] text-[var(--text-muted)] hover:border-[var(--bg-card)] hover:text-[var(--text-secondary)]'
              }
            `}
            style={
              isActive
                ? { background: tag.bg, color: tag.color, borderColor: `${tag.color}40` }
                : {}
            }
          >
            <span
              className="w-1.5 h-1.5 rounded-full flex-shrink-0"
              style={{ background: isActive ? tag.color : 'var(--text-muted)' }}
            />
            {tag.label}
          </button>
        );
      })}

      {/* Clear all */}
      {hasActiveFilters && (
        <>
          <div className="w-px h-5 bg-[var(--border)] flex-shrink-0" />
          <button
            onClick={() => {
              clearFilters();
              setSearchQuery('');
            }}
            className="text-[11px] text-[var(--text-muted)] hover:text-[var(--text-secondary)] flex-shrink-0 transition-colors"
          >
            Clear all
          </button>
        </>
      )}
    </div>
  );
}
