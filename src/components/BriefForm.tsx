import { useRef, useState } from 'react';
import type { Brief } from '@/types';
import { Button, Card, Field, Input, Textarea, Select } from './ui';
import { PaperclipIcon, SparkIcon } from './icons';

const empty: Brief = { name: '', description: '', audience: '', style: '', qualities: '', scope: 'launch ready' };

interface Props {
  initial?: Brief;
  submitLabel: string;
  busy?: boolean;
  hasKey: boolean;
  onSubmit: (brief: Brief) => void;
  onNeedKey: () => void;
}

export const BriefForm: React.FC<Props> = ({ initial, submitLabel, busy, hasKey, onSubmit, onNeedKey }) => {
  const [brief, setBrief] = useState<Brief>(initial ?? empty);
  const fileRef = useRef<HTMLInputElement>(null);
  const set = <K extends keyof Brief>(key: K, value: Brief[K]) => setBrief((b) => ({ ...b, [key]: value }));
  const valid = brief.name.trim() && brief.description.trim() && brief.audience.trim();

  const onFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => set('inspirationImage', ev.target?.result as string);
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  return (
    <form
      className="max-w-3xl mx-auto space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        if (!valid) return;
        onSubmit({ ...brief, name: brief.name.trim() });
      }}
    >
      <Card title="Project brief">
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Product or brand name">
            <Input value={brief.name} onChange={(e) => set('name', e.target.value)} placeholder="Tidal" required autoFocus />
          </Field>
          <Field label="Scope" hint="Sets how ambitious the copy and visuals get.">
            <Select value={brief.scope} onChange={(e) => set('scope', e.target.value as Brief['scope'])}>
              <option value="quick concept">Quick concept</option>
              <option value="launch ready">Launch ready</option>
              <option value="full campaign">Full campaign</option>
            </Select>
          </Field>
        </div>
        <div className="mt-4 space-y-4">
          <Field label="What it is and what it does">
            <Textarea rows={3} value={brief.description} onChange={(e) => set('description', e.target.value)} placeholder="A focus timer that syncs a remote team's deep-work blocks so nobody gets interrupted." required />
          </Field>
          <Field label="Audience" hint="Who buys it, and what they are tired of.">
            <Input value={brief.audience} onChange={(e) => set('audience', e.target.value)} placeholder="Remote product teams of 5 to 50 who hate meeting creep" required />
          </Field>
          <Field label="Style and inspiration" hint="Brands, aesthetics, colours, or attach an image.">
            <div className="flex gap-2">
              <Input value={brief.style} onChange={(e) => set('style', e.target.value)} placeholder="Calm, oceanic, precise. Linear and Arc as references." />
              <input ref={fileRef} type="file" accept="image/png,image/jpeg,image/webp" className="hidden" onChange={onFile} />
              <Button type="button" variant="secondary" onClick={() => fileRef.current?.click()} aria-label="Attach inspiration image">
                <PaperclipIcon className="w-4 h-4" />
              </Button>
            </div>
            {brief.inspirationImage && (
              <div className="mt-2 flex items-center gap-3">
                <img src={brief.inspirationImage} alt="Inspiration" className="h-16 w-16 object-cover rounded-lg border border-line" />
                <Button type="button" size="sm" variant="ghost" onClick={() => set('inspirationImage', undefined)}>Remove</Button>
              </div>
            )}
          </Field>
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Qualities" hint="Three to five adjectives.">
              <Input value={brief.qualities} onChange={(e) => set('qualities', e.target.value)} placeholder="trustworthy, calm, modern, a little playful" />
            </Field>
            <Field label="Website (optional)" hint="Used for canonical URLs.">
              <Input value={brief.websiteUrl ?? ''} onChange={(e) => set('websiteUrl', e.target.value || undefined)} placeholder="https://tidal.example.com" inputMode="url" />
            </Field>
          </div>
        </div>
      </Card>
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <p className="text-xs text-muted max-w-md">
          Launch runs five steps: brand strategy, landing page copy, SEO plan, logo and hero visual. Text steps take about 20 seconds; images about a minute.
        </p>
        {hasKey ? (
          <Button type="submit" variant="primary" size="lg" disabled={!valid || busy}>
            <SparkIcon className="w-4 h-4" /> {busy ? 'Working…' : submitLabel}
          </Button>
        ) : (
          <div className="flex gap-2">
            <Button type="submit" variant="secondary" size="lg" disabled={!valid || busy}>Save brief</Button>
            <Button type="button" variant="primary" size="lg" onClick={onNeedKey}>Add Gemini key to launch</Button>
          </div>
        )}
      </div>
    </form>
  );
};
