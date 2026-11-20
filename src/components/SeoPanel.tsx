import { useMemo, useState } from 'react';
import type { Project, SeoPlan, SeoAudit } from '@/types';
import { auditHtml, topFixes } from '@/services/seoAudit';
import { renderLandingHtml } from '@/services/exportKit';
import { Button, Card, Field, Input, Textarea, Select, Badge, EmptyState } from './ui';
import { CruiseIcon } from './icons';
import { slugify } from '@/lib/id';

interface Props {
  project: Project;
  onChange: (seo: SeoPlan) => void;
  onAskAgent: (agentId: string, prompt: string) => void;
}

const ScoreRing: React.FC<{ score: number }> = ({ score }) => {
  const r = 44;
  const c = 2 * Math.PI * r;
  const tone = score >= 85 ? '#34d399' : score >= 60 ? '#fbbf24' : '#f87171';
  return (
    <svg viewBox="0 0 110 110" className="w-28 h-28" role="img" aria-label={`SEO score ${score} of 100`}>
      <circle cx="55" cy="55" r={r} fill="none" stroke="var(--line)" strokeWidth="10" />
      <circle cx="55" cy="55" r={r} fill="none" stroke={tone} strokeWidth="10" strokeLinecap="round" strokeDasharray={`${(score / 100) * c} ${c}`} transform="rotate(-90 55 55)" />
      <text x="55" y="60" textAnchor="middle" fontSize="26" fontWeight="700" fill="var(--fg)">{score}</text>
      <text x="55" y="76" textAnchor="middle" fontSize="9" fill="var(--muted)">of 100</text>
    </svg>
  );
};

const ChecksList: React.FC<{ audit: SeoAudit }> = ({ audit }) => (
  <ul className="divide-y divide-line">
    {audit.checks.map((c) => (
      <li key={c.id} className="py-2 flex gap-3 items-start text-sm">
        <Badge tone={c.status === 'pass' ? 'good' : c.status === 'warn' ? 'warn' : 'bad'} className="mt-0.5 w-12 justify-center">{c.status}</Badge>
        <div className="min-w-0">
          <div className="font-medium text-fg">{c.label}</div>
          <div className="text-xs text-muted break-words">{c.detail}</div>
        </div>
      </li>
    ))}
  </ul>
);

const lenTone = (n: number, min: number, max: number) => (n === 0 ? 'bad' : n < min || n > max ? 'warn' : 'good');

export const SeoPanel: React.FC<Props> = ({ project, onChange, onAskAgent }) => {
  const [pasted, setPasted] = useState('');
  const [pastedKeyword, setPastedKeyword] = useState('');
  const [pastedAudit, setPastedAudit] = useState<SeoAudit | null>(null);
  const seo = project.seo;
  const ready = Boolean(project.brand && project.page && seo);
  const audit = useMemo(() => (ready ? auditHtml(renderLandingHtml(project), { keyword: seo!.primaryKeyword }) : null), [project, ready, seo]);

  const externalAudit = (
    <Card title="Audit any page">
      <p className="text-xs text-muted mb-3">Paste the HTML of an existing page (view-source) and Cruise Control scores it with the same checks. Nothing leaves your browser.</p>
      <div className="grid gap-3 sm:grid-cols-[1fr_auto] items-end">
        <Field label="Target keyword (optional)">
          <Input value={pastedKeyword} onChange={(e) => setPastedKeyword(e.target.value)} placeholder="team focus timer" />
        </Field>
        <Button variant="primary" disabled={!pasted.trim()} onClick={() => setPastedAudit(auditHtml(pasted, { keyword: pastedKeyword }))}>Audit</Button>
      </div>
      <Textarea className="mt-3 font-mono text-xs" rows={6} value={pasted} onChange={(e) => setPasted(e.target.value)} placeholder="<!DOCTYPE html>…" spellCheck={false} />
      {pastedAudit && (
        <div className="mt-4 flex gap-4 items-start">
          <ScoreRing score={pastedAudit.score} />
          <div className="flex-1 min-w-0">
            <ChecksList audit={pastedAudit} />
          </div>
        </div>
      )}
    </Card>
  );

  if (!ready || !seo || !audit) {
    return (
      <div className="space-y-4 max-w-3xl mx-auto">
        <EmptyState icon={<CruiseIcon className="w-20 h-20" />} title="Cruise Control is idle" text="Launch the brief to generate an SEO plan for your page. Meanwhile you can audit any existing page below." />
        {externalAudit}
      </div>
    );
  }

  const set = (patch: Partial<SeoPlan>) => onChange({ ...seo, ...patch });
  const fixes = topFixes(audit, 4);

  return (
    <div className="grid gap-4 xl:grid-cols-5">
      <div className="xl:col-span-2 space-y-4">
        <Card title="Page score" actions={<Button size="sm" onClick={() => onAskAgent('cruise-control', `The page scores ${audit.score}/100. Open issues: ${fixes.map((f) => `${f.label} (${f.detail})`).join('; ') || 'none'}. Fix what you can with updateSeo and updateSection and explain the ranking reasoning.`)}>Fix with Cruise Control</Button>}>
          <div className="flex gap-4 items-center">
            <ScoreRing score={audit.score} />
            <div className="text-sm">
              <div className="font-semibold text-fg">{audit.score >= 85 ? 'Ready to ship' : audit.score >= 60 ? 'Nearly there' : 'Needs work'}</div>
              <div className="text-xs text-muted mt-1">{audit.wordCount} words on page. Score is computed on the exported HTML, so what you ship is what is scored.</div>
              {fixes.length > 0 && (
                <ul className="mt-2 space-y-1 text-xs">
                  {fixes.map((f) => (
                    <li key={f.id} className="flex gap-2"><span className={f.status === 'fail' ? 'text-red-400' : 'text-amber-400'}>•</span><span><span className="text-fg">{f.label}:</span> {f.detail}</span></li>
                  ))}
                </ul>
              )}
            </div>
          </div>
          <div className="mt-4">
            <ChecksList audit={audit} />
          </div>
        </Card>
        {externalAudit}
      </div>
      <div className="xl:col-span-3 space-y-4">
        <Card title="On-page plan" actions={<Button size="sm" onClick={() => onAskAgent('cruise-control', 'Propose a sharper primary keyword with clearer buying intent and rewrite title, meta description and H1 around it. Apply with updateSeo.')}>Retarget keyword</Button>}>
          <div className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Primary keyword">
                <Input value={seo.primaryKeyword} onChange={(e) => set({ primaryKeyword: e.target.value })} />
              </Field>
              <Field label="Schema type">
                <Select value={seo.schemaType} onChange={(e) => set({ schemaType: e.target.value as SeoPlan['schemaType'] })}>
                  {['SoftwareApplication', 'Product', 'Organization', 'WebSite', 'Service'].map((t) => <option key={t} value={t}>{t}</option>)}
                </Select>
              </Field>
            </div>
            <Field label="Secondary keywords" hint="Comma separated.">
              <Input value={seo.secondaryKeywords.join(', ')} onChange={(e) => set({ secondaryKeywords: e.target.value.split(',').map((k) => k.trim()).filter(Boolean) })} />
            </Field>
            <Field label="Title tag" count={`${seo.title.length} / 60`}>
              <div className="flex items-center gap-2">
                <Input value={seo.title} onChange={(e) => set({ title: e.target.value })} />
                <Badge tone={lenTone(seo.title.length, 30, 60)}>{lenTone(seo.title.length, 30, 60) === 'good' ? 'ok' : 'length'}</Badge>
              </div>
            </Field>
            <Field label="Meta description" count={`${seo.metaDescription.length} / 160`}>
              <div className="flex items-start gap-2">
                <Textarea rows={2} value={seo.metaDescription} onChange={(e) => set({ metaDescription: e.target.value })} />
                <Badge tone={lenTone(seo.metaDescription.length, 70, 160)} className="mt-2">{lenTone(seo.metaDescription.length, 70, 160) === 'good' ? 'ok' : 'length'}</Badge>
              </div>
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="H1" hint="Applied to the hero heading on export.">
                <Input value={seo.h1} onChange={(e) => set({ h1: e.target.value })} />
              </Field>
              <Field label="Slug">
                <Input value={seo.slug} onChange={(e) => set({ slug: slugify(e.target.value) || e.target.value })} onBlur={(e) => set({ slug: slugify(e.target.value), canonicalUrl: seo.canonicalUrl.replace(/\/[^/]*$/, `/${slugify(e.target.value)}`) })} />
              </Field>
            </div>
            <Field label="Canonical URL">
              <Input value={seo.canonicalUrl} onChange={(e) => set({ canonicalUrl: e.target.value })} />
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Social title">
                <Input value={seo.ogTitle} onChange={(e) => set({ ogTitle: e.target.value })} />
              </Field>
              <Field label="Social description">
                <Input value={seo.ogDescription} onChange={(e) => set({ ogDescription: e.target.value })} />
              </Field>
            </div>
          </div>
        </Card>
        <Card title="FAQ (rich results)">
          <div className="space-y-2">
            {seo.faq.map((f, i) => (
              <div key={i} className="grid gap-2 rounded-lg border border-line p-2">
                <Input value={f.question} onChange={(e) => set({ faq: seo.faq.map((x, j) => (j === i ? { ...x, question: e.target.value } : x)) })} aria-label={`Question ${i + 1}`} />
                <Textarea rows={2} value={f.answer} onChange={(e) => set({ faq: seo.faq.map((x, j) => (j === i ? { ...x, answer: e.target.value } : x)) })} aria-label={`Answer ${i + 1}`} />
                <Button size="sm" variant="ghost" className="justify-self-end" onClick={() => set({ faq: seo.faq.filter((_, j) => j !== i) })}>Remove</Button>
              </div>
            ))}
            <Button size="sm" onClick={() => set({ faq: [...seo.faq, { question: '', answer: '' }] })}>Add question</Button>
          </div>
        </Card>
        <Card title="Content ideas" actions={<Button size="sm" onClick={() => onAskAgent('cruise-control', 'Give me six more content ideas that target the secondary keywords, ranked by how fast they could rank. Add the best ones with updateSeo.')}>More ideas</Button>}>
          <ul className="list-disc pl-5 text-sm space-y-1 text-fg">
            {seo.contentIdeas.map((c, i) => <li key={i}>{c}</li>)}
          </ul>
        </Card>
      </div>
    </div>
  );
};
