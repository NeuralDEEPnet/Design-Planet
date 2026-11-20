import { useEffect, useRef, useState } from 'react';
import type { Project, Message, AgentDef } from '@/types';
import { agents } from '@/config/agents';
import { Button, Textarea } from './ui';
import { SendIcon, PaperclipIcon, Spinner, StudioMark } from './icons';

interface Props {
  project: Project;
  agentId: string;
  onSelectAgent: (id: string) => void;
  messages: Message[];
  busy: boolean;
  hasKey: boolean;
  /** Image queued for the next message (data URL), e.g. from Assets → Edit. */
  pendingImage?: string;
  onClearPendingImage: () => void;
  onAttachImage: (dataUrl: string) => void;
  onSend: (text: string) => void;
  onNeedKey: () => void;
  draft?: string;
}

const Bubble: React.FC<{ message: Message; agent: AgentDef }> = ({ message, agent }) => {
  if (message.author === 'system') {
    return <div className="text-center text-[11px] text-muted py-1">{message.text}</div>;
  }
  const mine = message.author === 'user';
  const Icon = agent.icon;
  return (
    <div className={`flex items-end gap-2 ${mine ? 'justify-end' : 'justify-start'}`}>
      {!mine && (
        <div className="w-8 h-8 shrink-0 rounded-full bg-surface2 border border-line flex items-center justify-center" title={message.via ?? agent.name}>
          {message.via ? <span className="text-[10px] font-bold text-accent">{message.via.slice(0, 2).toUpperCase()}</span> : <Icon className="w-5 h-5" />}
        </div>
      )}
      <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm shadow ${mine ? 'bg-accent text-accent-fg rounded-br-sm' : 'bg-surface2 border border-line text-fg rounded-bl-sm'}`}>
        {message.via && <div className="text-[11px] font-semibold text-accent mb-1">{message.via}</div>}
        {message.imageUrl && <img src={message.imageUrl} alt="" className="max-w-xs w-full rounded-lg mb-2 border border-line bg-white/5" />}
        {message.text && <p className="whitespace-pre-wrap leading-relaxed">{message.text}</p>}
      </div>
    </div>
  );
};

export const StudioChat: React.FC<Props> = ({ project, agentId, onSelectAgent, messages, busy, hasKey, pendingImage, onClearPendingImage, onAttachImage, onSend, onNeedKey, draft }) => {
  const [text, setText] = useState('');
  const endRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const agent = agents.find((a) => a.id === agentId) ?? agents[0];

  useEffect(() => {
    if (draft !== undefined) setText(draft);
  }, [draft]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, busy]);

  const submit = () => {
    const value = text.trim();
    if (!value || busy) return;
    if (!hasKey) {
      onNeedKey();
      return;
    }
    onSend(value);
    setText('');
  };

  const onFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => onAttachImage(ev.target?.result as string);
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  return (
    <div className="grid gap-4 lg:grid-cols-[260px_1fr] h-full min-h-[70vh]">
      <aside className="bg-surface border border-line rounded-xl p-2 space-y-1 overflow-y-auto">
        <div className="px-2 py-1 text-[11px] font-semibold uppercase tracking-wider text-muted">The crew</div>
        {agents.map((a) => {
          const Icon = a.icon;
          const active = a.id === agentId;
          const count = (project.conversations[a.id] ?? []).filter((m) => m.author !== 'system').length;
          return (
            <button
              key={a.id}
              onClick={() => onSelectAgent(a.id)}
              className={`w-full flex items-start gap-3 rounded-lg px-2 py-2 text-left transition ${active ? 'bg-surface2 border border-line' : 'hover:bg-surface2/60 border border-transparent'}`}
              aria-pressed={active}
            >
              <Icon className="w-8 h-8 shrink-0" />
              <div className="min-w-0">
                <div className="text-sm font-semibold text-fg truncate">{a.name}</div>
                <div className="text-[11px] text-muted truncate">{a.planet}</div>
              </div>
              {count > 0 && <span className="ml-auto text-[10px] text-muted">{count}</span>}
            </button>
          );
        })}
      </aside>
      <section className="bg-surface border border-line rounded-xl flex flex-col min-h-0">
        <header className="px-4 py-3 border-b border-line flex items-center gap-3">
          <agent.icon className="w-7 h-7" />
          <div className="min-w-0">
            <div className="font-display text-xs tracking-widest uppercase text-accent">{agent.name}</div>
            <div className="text-xs text-muted truncate">{agent.description}</div>
          </div>
        </header>
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {messages.length === 0 && (
            <div className="flex flex-col items-center text-center text-muted py-10">
              <StudioMark className="w-14 h-14 rave-pulse" />
              <p className="mt-4 text-sm max-w-md text-fg">{agent.greeting}</p>
              <p className="mt-2 text-xs max-w-md">Every agent sees the brief, brand, page and SEO plan. Changes they make land in the other tabs immediately.</p>
            </div>
          )}
          {messages.map((m) => (
            <Bubble key={m.id} message={m} agent={agent} />
          ))}
          {busy && (
            <div className="flex items-center gap-2 text-muted text-sm pl-10"><Spinner /> {agent.name} is working…</div>
          )}
          <div ref={endRef} />
        </div>
        <footer className="p-3 border-t border-line">
          {pendingImage && (
            <div className="flex items-center gap-3 mb-2 text-xs text-muted">
              <img src={pendingImage} alt="Attached" className="h-12 w-12 object-cover rounded-lg border border-line" />
              <span>Image attached to your next message.</span>
              <Button size="sm" variant="ghost" onClick={onClearPendingImage}>Remove</Button>
            </div>
          )}
          <div className="relative">
            <Textarea
              rows={2}
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  submit();
                }
              }}
              placeholder={agent.id === 'segmentation-station' ? 'Describe the edit, e.g. "remove the background"' : `Ask ${agent.name}… (Enter to send, Shift+Enter for a new line)`}
              className="pr-24"
              disabled={busy}
            />
            <input ref={fileRef} type="file" accept="image/png,image/jpeg,image/webp" className="hidden" onChange={onFile} />
            <button type="button" onClick={() => fileRef.current?.click()} aria-label="Attach image" className="absolute right-12 top-1/2 -translate-y-1/2 p-2 rounded-full text-muted hover:text-accent" disabled={busy}>
              <PaperclipIcon className="w-4 h-4" />
            </button>
            <button type="button" onClick={submit} aria-label="Send" className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-accent text-accent-fg disabled:opacity-40" disabled={busy || !text.trim()}>
              <SendIcon className="w-4 h-4" />
            </button>
          </div>
          {!hasKey && <p className="text-[11px] text-amber-400 mt-2">Add a Gemini key in Settings to talk to the crew.</p>}
        </footer>
      </section>
    </div>
  );
};
