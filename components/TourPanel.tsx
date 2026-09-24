'use client';

import { useAppStore } from '@/lib/store';
import type { TourStep } from '@/lib/prompts';

interface TourPanelProps {
  steps: TourStep[];
  onFocusNodes: (nodeIds: string[]) => void;
}

export default function TourPanel({ steps, onFocusNodes }: TourPanelProps) {
  const { tourActive, tourStepIndex, setTourActive, setTourStepIndex } = useAppStore();

  if (!steps || steps.length === 0) return null;

  const currentStep = steps[tourStepIndex];
  const total = steps.length;

  const goTo = (index: number) => {
    const clamped = Math.max(0, Math.min(total - 1, index));
    setTourStepIndex(clamped);
    onFocusNodes(steps[clamped].focusNodeIds);
  };

  if (!tourActive) {
    return (
      <div className="flex flex-col gap-3">
        <div>
          <h3 className="text-white font-semibold text-sm mb-0.5">Project Tour</h3>
          <p className="text-[var(--text-muted)] text-[11px]">
            {total} steps · Guided walkthrough of the codebase
          </p>
        </div>
        <button
          onClick={() => {
            setTourActive(true);
            onFocusNodes(steps[0].focusNodeIds);
          }}
          className="w-full bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white text-sm font-medium py-2 rounded-lg transition-colors"
        >
          Start Tour
        </button>

        {/* Steps preview list */}
        <div className="mt-2 space-y-1">
          <p className="text-[10px] uppercase text-[var(--text-muted)] tracking-wider mb-2">Steps</p>
          {steps.map((step, i) => (
            <button
              key={step.id}
              onClick={() => {
                setTourActive(true);
                goTo(i);
              }}
              className="w-full flex items-center gap-3 px-2 py-1.5 rounded-md hover:bg-[var(--bg-card)] transition-colors text-left group"
            >
              <span className="w-5 h-5 rounded-full bg-[var(--bg-card)] border border-[var(--border)] flex items-center justify-center text-[10px] text-[var(--text-muted)] group-hover:border-[var(--accent)] group-hover:text-[var(--accent)] flex-shrink-0 transition-colors">
                {i + 1}
              </span>
              <span className="text-[12px] text-[var(--text-secondary)] group-hover:text-white transition-colors truncate">
                {step.title}
              </span>
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider mb-1">
            Step {tourStepIndex + 1} of {total}
          </div>
          <h3 className="text-white font-semibold text-sm leading-snug">
            {currentStep.title}
          </h3>
        </div>
        <button
          onClick={() => {
            setTourActive(false);
            onFocusNodes([]);
          }}
          className="text-[var(--text-muted)] hover:text-white transition-colors p-1"
          title="Exit tour"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Progress bar */}
      <div className="h-1 bg-[var(--bg-card)] rounded-full overflow-hidden">
        <div
          className="h-full bg-[var(--accent)] rounded-full transition-all duration-300"
          style={{ width: `${((tourStepIndex + 1) / total) * 100}%` }}
        />
      </div>

      {/* Step description */}
      <p className="text-[var(--text-secondary)] text-[13px] leading-relaxed">
        {currentStep.description}
      </p>

      {/* Navigation */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => goTo(tourStepIndex - 1)}
          disabled={tourStepIndex === 0}
          className="flex-1 py-2 rounded-lg text-[13px] font-medium border border-[var(--border)] text-[var(--text-secondary)] hover:text-white hover:border-[var(--bg-card)] disabled:opacity-30 disabled:cursor-not-allowed transition-all"
        >
          ← Prev
        </button>
        <button
          onClick={() => goTo(tourStepIndex + 1)}
          disabled={tourStepIndex === total - 1}
          className="flex-1 py-2 rounded-lg text-[13px] font-medium bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all"
        >
          Next →
        </button>
      </div>

      {/* Step dots */}
      <div className="flex justify-center gap-1.5">
        {steps.map((_, i) => (
          <button
            key={i}
            onClick={() => goTo(i)}
            className={`rounded-full transition-all duration-200 ${
              i === tourStepIndex
                ? 'w-4 h-1.5 bg-[var(--accent)]'
                : i < tourStepIndex
                ? 'w-1.5 h-1.5 bg-[var(--accent)]  opacity-40'
                : 'w-1.5 h-1.5 bg-[var(--border)]'
            }`}
          />
        ))}
      </div>

      {/* Step list (mini) */}
      <div className="border-t border-[var(--border)] pt-3 mt-1">
        <div className="space-y-0.5">
          {steps.map((step, i) => {
            const isDone = i < tourStepIndex;
            const isCurrent = i === tourStepIndex;
            return (
              <button
                key={step.id}
                onClick={() => goTo(i)}
                className={`w-full flex items-center gap-2.5 px-2 py-1.5 rounded-md transition-colors text-left ${
                  isCurrent ? 'bg-[var(--bg-card)]' : 'hover:bg-[var(--bg-card)]/50'
                }`}
              >
                <span
                  className={`w-4 h-4 rounded-full flex items-center justify-center text-[9px] flex-shrink-0 ${
                    isDone
                      ? 'bg-[#22c55e] text-white'
                      : isCurrent
                      ? 'bg-[var(--accent)] text-white'
                      : 'bg-[var(--bg-card)] border border-[var(--border)] text-[var(--text-muted)]'
                  }`}
                >
                  {isDone ? '✓' : i + 1}
                </span>
                <span
                  className={`text-[11px] truncate ${
                    isCurrent
                      ? 'text-white font-medium'
                      : isDone
                      ? 'text-[var(--text-muted)] line-through'
                      : 'text-[var(--text-muted)]'
                  }`}
                >
                  {step.title}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
