import type { Project, Brand } from '@/types';
import { Card, Field, Input, Textarea, Swatch, Badge, Button, EmptyState } from './ui';
import { PlanetIcon } from './icons';

const HEX = /^#[0-9a-f]{6}$/i;

interface Props {
  project: Project;
  onChange: (brand: Brand) => void;
  onAskAgent: (agentId: string, prompt: string) => void;
}

export const BrandPanel: React.FC<Props> = ({ project, onChange, onAskAgent }) => {
  const brand = project.brand;
  if (!brand) {
    return <EmptyState icon={<PlanetIcon className="w-20 h-20" />} title="No brand yet" text="Launch the brief and the Creative Director will write the brand foundation, palette and fonts." />;
  }
  const logo = project.assets.find((a) => a.id === brand.logoAssetId);
  const hero = project.assets.find((a) => a.id === brand.heroAssetId);
  const set = (patch: Partial<Brand>) => onChange({ ...brand, ...patch });
  const setColor = (key: keyof Brand['palette'], value: string) => set({ palette: { ...brand.palette, [key]: value } });

  return (
    <div className="grid gap-4 lg:grid-cols-5">
      <div className="lg:col-span-3 space-y-4">
        <Card title="Foundation" actions={<Button size="sm" onClick={() => onAskAgent('design-planet', 'Give me a bolder alternative brand direction: new tagline, positioning and palette. Update the brand when you are confident.')}>Ask the Creative Director</Button>}>
          <div className="space-y-4">
            <Field label="Tagline">
              <Input value={brand.tagline} onChange={(e) => set({ tagline: e.target.value })} />
            </Field>
            <Field label="Positioning">
              <Textarea rows={3} value={brand.positioning} onChange={(e) => set({ positioning: e.target.value })} />
            </Field>
            <Field label="Voice" hint="Comma separated.">
              <Input value={brand.voice.join(', ')} onChange={(e) => set({ voice: e.target.value.split(',').map((v) => v.trim()).filter(Boolean) })} />
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Heading font" hint="Google Fonts family name.">
                <Input value={brand.fonts.heading} onChange={(e) => set({ fonts: { ...brand.fonts, heading: e.target.value } })} />
              </Field>
              <Field label="Body font">
                <Input value={brand.fonts.body} onChange={(e) => set({ fonts: { ...brand.fonts, body: e.target.value } })} />
              </Field>
            </div>
          </div>
        </Card>
        <Card title="Palette">
          <div className="grid gap-3 sm:grid-cols-2">
            {(Object.keys(brand.palette) as (keyof Brand['palette'])[]).map((key) => (
              <div key={key} className="flex items-center gap-3">
                <input
                  type="color"
                  value={HEX.test(brand.palette[key]) ? brand.palette[key] : '#000000'}
                  onChange={(e) => setColor(key, e.target.value)}
                  aria-label={`${key} colour`}
                  className="w-10 h-10 rounded-lg border border-line bg-transparent cursor-pointer"
                />
                <div className="flex-1">
                  <Swatch color={brand.palette[key]} label={key} />
                </div>
                <Input className="w-28 font-mono text-xs" value={brand.palette[key]} onChange={(e) => setColor(key, e.target.value)} />
              </div>
            ))}
          </div>
          <div className="mt-4 rounded-xl overflow-hidden border border-line" style={{ background: brand.palette.background, color: brand.palette.text }}>
            <div className="p-5" style={{ fontFamily: `'${brand.fonts.body}', sans-serif` }}>
              <div className="text-2xl font-bold" style={{ fontFamily: `'${brand.fonts.heading}', sans-serif` }}>{brand.tagline}</div>
              <p className="text-sm mt-1 opacity-80 max-w-md">{brand.positioning}</p>
              <div className="mt-3 flex gap-2">
                <span className="px-3 py-1.5 rounded-full text-xs font-semibold text-white" style={{ background: brand.palette.primary }}>Primary</span>
                <span className="px-3 py-1.5 rounded-full text-xs font-semibold text-white" style={{ background: brand.palette.secondary }}>Secondary</span>
                <span className="px-3 py-1.5 rounded-full text-xs font-semibold text-white" style={{ background: brand.palette.accent }}>Accent</span>
                <span className="px-3 py-1.5 rounded-full text-xs font-semibold" style={{ background: brand.palette.surface }}>Surface</span>
              </div>
            </div>
          </div>
        </Card>
      </div>
      <div className="lg:col-span-2 space-y-4">
        <Card title="Logo" actions={<Button size="sm" onClick={() => onAskAgent('logo-labyrinth', `Design a new logo mark for ${project.brief.name}. ${brand.logoPrompt ? `Current direction: ${brand.logoPrompt}` : ''} Generate it.`)}>Explore in Logo Labyrinth</Button>}>
          {logo ? (
            <img src={logo.url} alt={`${project.brief.name} logo`} className="w-full max-w-[220px] mx-auto rounded-xl border border-line" />
          ) : (
            <p className="text-sm text-muted">No logo yet. Ask Logo Labyrinth, or regenerate the kit.</p>
          )}
          <Field label="Logo prompt">
            <Textarea rows={3} className="mt-2" value={brand.logoPrompt} onChange={(e) => set({ logoPrompt: e.target.value })} />
          </Field>
        </Card>
        <Card title="Hero visual" actions={<Button size="sm" onClick={() => onAskAgent('illustration-nebula', `Create a new hero visual for ${project.brief.name}. ${brand.heroPrompt ? `Current direction: ${brand.heroPrompt}` : ''} Generate it in 16:9.`)}>Explore in the Nebula</Button>}>
          {hero ? (
            <img src={hero.url} alt="Hero visual" className="w-full rounded-xl border border-line" />
          ) : (
            <p className="text-sm text-muted">No hero visual yet.</p>
          )}
          <Field label="Hero prompt">
            <Textarea rows={3} className="mt-2" value={brand.heroPrompt} onChange={(e) => set({ heroPrompt: e.target.value })} />
          </Field>
        </Card>
        <div className="flex flex-wrap gap-1.5">
          {brand.voice.map((v) => (
            <Badge key={v} tone="accent">{v}</Badge>
          ))}
        </div>
      </div>
    </div>
  );
};
