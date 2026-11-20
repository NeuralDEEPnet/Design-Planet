import { useMemo, useState } from 'react';
import type { Project, PageSection, LandingPage } from '@/types';
import { renderLandingHtml, buildKitZip, downloadBlob, kitFileName } from '@/services/exportKit';
import { Button, Card, Field, Input, Textarea, EmptyState, Badge } from './ui';
import { DownloadIcon, ExternalIcon, UIIcon, ChevronIcon } from './icons';

interface Props {
  project: Project;
  onChange: (page: LandingPage) => void;
  onAskAgent: (agentId: string, prompt: string) => void;
}

const labels: Record<PageSection['type'], string> = { hero: 'Hero', features: 'Features', how: 'How it works', proof: 'Social proof', faq: 'FAQ', cta: 'Call to action' };

const SectionEditor: React.FC<{ section: PageSection; onChange: (s: PageSection) => void; onAsk: () => void }> = ({ section, onChange, onAsk }) => {
  const [open, setOpen] = useState(section.type === 'hero');
  const set = (patch: Partial<PageSection>) => onChange({ ...section, ...patch });
  const setItem = (i: number, patch: Partial<{ title: string; text: string }>) =>
    set({ items: (section.items ?? []).map((it, idx) => (idx === i ? { ...it, ...patch } : it)) });
  return (
    <div className="border border-line rounded-lg bg-surface2/50">
      <button onClick={() => setOpen((o) => !o)} className="w-full flex items-center gap-2 px-3 py-2 text-left" aria-expanded={open}>
        <ChevronIcon className={`w-4 h-4 text-muted transition-transform ${open ? 'rotate-90' : ''}`} />
        <span className="text-xs font-semibold uppercase tracking-wider text-muted">{labels[section.type]}</span>
        <span className="text-sm truncate text-fg ml-1">{section.heading}</span>
      </button>
      {open && (
        <div className="px-3 pb-3 space-y-3">
          <Field label="Heading">
            <Input value={section.heading} onChange={(e) => set({ heading: e.target.value })} />
          </Field>
          {(section.type === 'hero' || section.type === 'features' || section.type === 'how' || section.type === 'proof') && (
            <Field label="Subheading">
              <Input value={section.subheading ?? ''} onChange={(e) => set({ subheading: e.target.value })} />
            </Field>
          )}
          {(section.type === 'hero' || section.type === 'cta') && (
            <>
              <Field label="Body">
                <Textarea rows={2} value={section.body ?? ''} onChange={(e) => set({ body: e.target.value })} />
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Button label">
                  <Input value={section.ctaLabel ?? ''} onChange={(e) => set({ ctaLabel: e.target.value })} />
                </Field>
                <Field label="Button link">
                  <Input value={section.ctaHref ?? ''} onChange={(e) => set({ ctaHref: e.target.value })} placeholder="#cta or https://…" />
                </Field>
              </div>
            </>
          )}
          {section.items && (
            <div className="space-y-2">
              {section.items.map((item, i) => (
                <div key={i} className="grid gap-2 rounded-lg border border-line p-2">
                  <Input value={item.title} onChange={(e) => setItem(i, { title: e.target.value })} aria-label={`Item ${i + 1} title`} />
                  <Textarea rows={2} value={item.text} onChange={(e) => setItem(i, { text: e.target.value })} aria-label={`Item ${i + 1} text`} />
                </div>
              ))}
            </div>
          )}
          <Button size="sm" onClick={onAsk}>Improve with UI/UX Universe</Button>
        </div>
      )}
    </div>
  );
};

export const PagePanel: React.FC<Props> = ({ project, onChange, onAskAgent }) => {
  const [device, setDevice] = useState<'desktop' | 'mobile'>('desktop');
  const [busy, setBusy] = useState(false);
  const ready = Boolean(project.brand && project.page && project.seo);
  const html = useMemo(() => (ready ? renderLandingHtml(project) : ''), [project, ready]);

  if (!ready || !project.page) {
    return <EmptyState icon={<UIIcon className="w-20 h-20" />} title="No landing page yet" text="Launch the brief to generate copy, then edit every section here while the preview updates live." />;
  }

  const openTab = () => {
    const url = URL.createObjectURL(new Blob([html], { type: 'text/html' }));
    window.open(url, '_blank', 'noopener');
    setTimeout(() => URL.revokeObjectURL(url), 60_000);
  };
  const downloadHtml = () => downloadBlob(new Blob([html], { type: 'text/html' }), `${project.seo!.slug}.html`);
  const downloadKit = async () => {
    setBusy(true);
    try {
      downloadBlob(await buildKitZip(project), kitFileName(project));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="grid gap-4 xl:grid-cols-5 h-full">
      <div className="xl:col-span-3 flex flex-col min-h-[60vh]">
        <div className="flex items-center gap-2 mb-3 flex-wrap">
          <Button size="sm" variant={device === 'desktop' ? 'primary' : 'secondary'} onClick={() => setDevice('desktop')}>Desktop</Button>
          <Button size="sm" variant={device === 'mobile' ? 'primary' : 'secondary'} onClick={() => setDevice('mobile')}>Mobile</Button>
          <Badge tone="neutral" className="ml-1">{Math.round(html.length / 1024)} KB</Badge>
          <div className="ml-auto flex gap-2">
            <Button size="sm" onClick={openTab}><ExternalIcon className="w-4 h-4" /> Open</Button>
            <Button size="sm" onClick={downloadHtml}><DownloadIcon className="w-4 h-4" /> HTML</Button>
            <Button size="sm" variant="primary" onClick={downloadKit} disabled={busy}><DownloadIcon className="w-4 h-4" /> {busy ? 'Zipping…' : 'Launch kit (.zip)'}</Button>
          </div>
        </div>
        <div className="flex-1 bg-surface2 border border-line rounded-xl p-3 flex justify-center overflow-hidden">
          <iframe
            title="Landing page preview"
            srcDoc={html}
            sandbox=""
            className={`bg-white rounded-lg border border-line h-full min-h-[60vh] transition-all ${device === 'mobile' ? 'w-[390px]' : 'w-full'}`}
          />
        </div>
      </div>
      <div className="xl:col-span-2 space-y-2 overflow-y-auto">
        <Card title="Sections" actions={<Button size="sm" onClick={() => onAskAgent('ui-ux-universe', 'Review the whole landing page for conversion. Rewrite the weakest section with updateSection and tell me why.')}>Review all</Button>}>
          <div className="space-y-2">
            {project.page.sections.map((section) => (
              <SectionEditor
                key={section.id}
                section={section}
                onChange={(s) => onChange({ sections: project.page!.sections.map((x) => (x.id === s.id ? s : x)) })}
                onAsk={() => onAskAgent('ui-ux-universe', `Improve the ${labels[section.type]} section. Current heading: "${section.heading}". Make it sharper and more concrete for ${project.brief.audience}, then apply it with updateSection.`)}
              />
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
};
