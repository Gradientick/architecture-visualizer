'use client';

import { useState } from 'react';
import { exportDiagram, type ExportFormat } from '@/lib/export';

interface ExportButtonProps {
  canvasRef: React.RefObject<HTMLDivElement>;
}

export default function ExportButton({ canvasRef }: ExportButtonProps) {
  const [isExporting, setIsExporting] = useState(false);
  const [showMenu, setShowMenu] = useState(false);

  const handleExport = async (format: ExportFormat) => {
    if (!canvasRef.current) return;
    setIsExporting(true);
    setShowMenu(false);
    try {
      await exportDiagram(canvasRef.current, format, 'architecture-diagram');
    } catch (err) {
      console.error('Export failed:', err);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setShowMenu((v) => !v)}
        disabled={isExporting}
        className="flex items-center gap-2 bg-[#111111] hover:bg-[#1a1a1a] border border-[#2a2a2a] text-[#a1a1aa] hover:text-white text-sm px-3 py-2 rounded-lg transition-all shadow-lg"
      >
        {isExporting ? (
          <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        ) : (
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
        )}
        Export
        <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {showMenu && (
        <>
          {/* Backdrop */}
          <div className="fixed inset-0 z-10" onClick={() => setShowMenu(false)} />
          {/* Menu */}
          <div className="absolute right-0 top-full mt-2 z-20 bg-[#111111] border border-[#2a2a2a] rounded-lg shadow-xl overflow-hidden min-w-[120px]">
            {(['png', 'svg'] as ExportFormat[]).map((fmt) => (
              <button
                key={fmt}
                onClick={() => handleExport(fmt)}
                className="w-full text-left px-4 py-2.5 text-sm text-[#a1a1aa] hover:text-white hover:bg-[#1a1a1a] transition-colors flex items-center gap-2"
              >
                <span className="text-xs font-mono uppercase text-[#6366f1]">{fmt}</span>
                <span>{fmt === 'png' ? '— High-res image' : '— Vector graphic'}</span>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
