import type { PipelineStep } from '@/types';
import { CheckIcon, AlertIcon, Spinner } from './icons';

export const PipelinePanel: React.FC<{ steps: PipelineStep[]; error?: string | null; onRetry?: () => void }> = ({ steps, error, onRetry }) => {
  const running = steps.some((s) => s.status === 'running');
  const done = steps.filter((s) => s.status === 'done').length;
  return (
    <div className="bg-surface border border-line rounded-xl p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold">{running ? 'Launch in progress' : error ? 'Launch stopped' : 'Launch pipeline'}</h3>
        <span className="text-xs text-muted">{done} of {steps.length} steps</span>
      </div>
      <ol className="grid gap-2 sm:grid-cols-5">
        {steps.map((s) => (
          <li key={s.id} className={`rounded-lg border px-3 py-2 text-xs ${s.status === 'done' ? 'border-emerald-500/30 bg-emerald-500/10' : s.status === 'failed' ? 'border-red-500/30 bg-red-500/10' : s.status === 'running' ? 'border-accent/40 bg-accent/10' : 'border-line bg-surface2'}`}>
            <div className="flex items-center gap-2 font-semibold text-fg">
              {s.status === 'done' ? <CheckIcon className="w-3.5 h-3.5 text-emerald-400" /> : s.status === 'failed' ? <AlertIcon className="w-3.5 h-3.5 text-red-400" /> : s.status === 'running' ? <span className="text-accent"><Spinner /></span> : <span className="w-3.5 h-3.5 rounded-full border border-line" />}
              {s.label}
            </div>
            {s.detail && <div className="mt-1 text-muted truncate" title={s.detail}>{s.detail}</div>}
          </li>
        ))}
      </ol>
      {error && (
        <div className="mt-3 flex items-center justify-between gap-3 text-sm text-red-300">
          <span>{error}</span>
          {onRetry && <button onClick={onRetry} className="underline hover:text-red-200">Retry</button>}
        </div>
      )}
    </div>
  );
};
