import type { Project, Theme } from '@/types';
import { StudioMark, PlusIcon, SettingsIcon, SunIcon, MoonIcon, TrashIcon } from './icons';
import { Badge } from './ui';

interface Props {
  projects: Project[];
  activeId: string | null;
  onSelect: (id: string) => void;
  onNew: () => void;
  onDelete: (id: string) => void;
  onSettings: () => void;
  theme: Theme;
  onToggleTheme: () => void;
  hasKey: boolean;
  open: boolean;
  onClose: () => void;
}

export const Sidebar: React.FC<Props> = ({ projects, activeId, onSelect, onNew, onDelete, onSettings, theme, onToggleTheme, hasKey, open, onClose }) => (
  <>
    {open && <div className="fixed inset-0 z-30 bg-black/50 md:hidden" onClick={onClose} role="presentation" />}
    <aside
      className={`fixed md:static z-40 inset-y-0 left-0 w-72 bg-surface border-r border-line flex flex-col transition-transform md:translate-x-0 ${open ? 'translate-x-0' : '-translate-x-full'}`}
    >
      <div className="px-4 py-4 flex items-center gap-3 border-b border-line">
        <StudioMark className="w-9 h-9" />
        <div className="leading-tight">
          <div className="font-display text-sm tracking-widest text-accent">AIRAVE</div>
          <div className="text-[11px] text-muted">Studio · brief to launch kit</div>
        </div>
      </div>
      <div className="p-3">
        <button
          onClick={onNew}
          className="w-full flex items-center justify-center gap-2 rounded-lg bg-accent text-accent-fg py-2.5 text-sm font-semibold hover:brightness-110 shadow-md shadow-accent/20"
        >
          <PlusIcon className="w-4 h-4" /> New project
        </button>
      </div>
      <nav className="flex-1 overflow-y-auto px-2 space-y-1" aria-label="Projects">
        {projects.map((p) => {
          const active = p.id === activeId;
          const done = p.pipeline.every((s) => s.status === 'done' || s.status === 'skipped');
          return (
            <div key={p.id} className={`group flex items-center rounded-lg ${active ? 'bg-surface2 border border-line' : 'hover:bg-surface2/60 border border-transparent'}`}>
              <button onClick={() => { onSelect(p.id); onClose(); }} className="flex-1 text-left px-3 py-2 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: p.brand?.palette.primary ?? 'var(--line)' }} aria-hidden="true" />
                  <span className="text-sm font-medium truncate text-fg">{p.brief.name || 'Untitled'}</span>
                </div>
                <div className="flex items-center gap-1.5 mt-1 pl-4">
                  {p.isSample ? <Badge tone="accent">Sample</Badge> : done && p.brand ? <Badge tone="good">Kit ready</Badge> : p.brand ? <Badge tone="warn">Partial</Badge> : <Badge>Brief</Badge>}
                  <span className="text-[11px] text-muted">{p.assets.length} assets</span>
                </div>
              </button>
              {!p.isSample && (
                <button
                  onClick={() => onDelete(p.id)}
                  aria-label={`Delete ${p.brief.name}`}
                  className="opacity-0 group-hover:opacity-100 focus:opacity-100 p-2 mr-1 text-muted hover:text-red-400"
                >
                  <TrashIcon className="w-4 h-4" />
                </button>
              )}
            </div>
          );
        })}
      </nav>
      <div className="p-3 border-t border-line flex items-center justify-between">
        <button onClick={onSettings} className="flex items-center gap-2 text-sm text-muted hover:text-fg">
          <SettingsIcon className="w-4 h-4" />
          <span>Settings</span>
          <span className={`w-2 h-2 rounded-full ${hasKey ? 'bg-emerald-400' : 'bg-amber-400'}`} title={hasKey ? 'Gemini key set' : 'No Gemini key'} />
        </button>
        <button onClick={onToggleTheme} aria-label="Toggle theme" className="p-2 rounded-lg text-muted hover:text-fg hover:bg-surface2">
          {theme === 'dark' ? <SunIcon className="w-4 h-4" /> : <MoonIcon className="w-4 h-4" />}
        </button>
      </div>
    </aside>
  </>
);
