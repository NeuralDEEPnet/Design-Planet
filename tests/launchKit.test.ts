import { describe, it, expect, vi } from 'vitest';
import { runLaunchPipeline, normalizeBrand, normalizePage, normalizeSeo } from '@/services/launchKit';
import type { AiProvider } from '@/services/ai';
import type { Brief } from '@/types';

const brief: Brief = {
  name: 'Tidal',
  description: 'A focus timer for remote teams',
  audience: 'Remote product teams',
  style: 'Calm and oceanic',
  qualities: 'calm, precise',
  scope: 'launch ready',
  websiteUrl: 'https://tidal.example.com/',
};

function fakeAi(overrides: Partial<AiProvider> = {}): AiProvider {
  return {
    generateJson: vi.fn(async ({ system }: { system: string }) => {
      if (system.includes('Creative Director')) {
        return { tagline: 'Deep work, in sync.', positioning: 'p', voice: ['calm'], palette: { primary: '#0891b2', secondary: 'nope', accent: '#F59E0B', background: '#0b1326', surface: '#13203a', text: '#e2e8f0' }, fonts: { heading: 'Space Grotesk', body: '' }, logoPrompt: 'a ring', heroPrompt: 'tides' };
      }
      if (system.includes('UX writer')) {
        return { sections: [{ type: 'cta', heading: 'Go' }, { type: 'hero', heading: 'Hello', subheading: 'sub' }, { type: 'features', heading: 'F', items: [{ title: 'a', text: 'b' }, { title: '', text: 'dropped' }] }] };
      }
      return { primaryKeyword: 'team focus timer', secondaryKeywords: ['x'], title: 'Tidal: Team Focus Timer', metaDescription: 'd', slug: 'Team Focus Timer!', h1: 'h', ogTitle: 'o', ogDescription: 'od', schemaType: 'Bogus', faq: [{ question: 'q', answer: 'a' }], contentIdeas: ['i'] };
    }) as AiProvider['generateJson'],
    chat: vi.fn(),
    generateImage: vi.fn(async ({ aspectRatio }: { aspectRatio: string }) => `data:image/png;base64,${aspectRatio === '1:1' ? 'LOGO' : 'HERO'}`),
    editImage: vi.fn(),
    ...overrides,
  };
}

describe('runLaunchPipeline', () => {
  it('runs every step, normalises output and attaches both images to the brand', async () => {
    const ai = fakeAi();
    const stepLog: string[] = [];
    const result = await runLaunchPipeline(brief, ai, { onStep: (steps) => stepLog.push(steps.map((s) => s.status[0]).join('')) });

    expect(result.steps.every((s) => s.status === 'done')).toBe(true);
    expect(result.brand.palette.secondary).toBe('#6366f1');
    expect(result.brand.palette.accent).toBe('#f59e0b');
    expect(result.brand.fonts.body).toBe('Inter');
    expect(result.page.sections.map((s) => s.type)).toEqual(['hero', 'features', 'cta']);
    expect(result.page.sections[1].items).toHaveLength(1);
    expect(result.page.sections.at(-1)!.id).toBe('cta');
    expect(result.seo.slug).toBe('team-focus-timer');
    expect(result.seo.schemaType).toBe('Product');
    expect(result.seo.canonicalUrl).toBe('https://tidal.example.com/team-focus-timer');
    expect(result.assets).toHaveLength(2);
    expect(result.brand.logoAssetId).toBe(result.assets.find((a) => a.kind === 'logo')!.id);
    expect(result.brand.heroAssetId).toBe(result.assets.find((a) => a.kind === 'hero')!.id);
    expect(stepLog[0]).toBe('rpppp');
    expect(stepLog.at(-1)).toBe('ddddd');
    expect(ai.generateJson).toHaveBeenCalledTimes(3);
  });

  it('keeps the kit when image generation fails', async () => {
    const ai = fakeAi({ generateImage: vi.fn(async () => { throw new Error('imagen down'); }) });
    const result = await runLaunchPipeline(brief, ai);
    expect(result.assets).toEqual([]);
    expect(result.steps.find((s) => s.id === 'logo')!.status).toBe('failed');
    expect(result.steps.find((s) => s.id === 'hero')!.detail).toBe('imagen down');
    expect(result.brand.logoAssetId).toBeUndefined();
    expect(result.page.sections.length).toBeGreaterThan(0);
  });

  it('throws when the brand step fails and marks it failed', async () => {
    const ai = fakeAi({ generateJson: vi.fn(async () => { throw new Error('boom'); }) as AiProvider['generateJson'] });
    let last: string[] = [];
    await expect(runLaunchPipeline(brief, ai, { onStep: (s) => (last = s.map((x) => x.status)) })).rejects.toThrow('boom');
    expect(last[0]).toBe('failed');
    expect(ai.generateImage).not.toHaveBeenCalled();
  });
});

describe('normalisers', () => {
  it('fall back safely on empty input', () => {
    const b = normalizeBrand(undefined);
    expect(b.palette.primary).toMatch(/^#[0-9a-f]{6}$/);
    const p = normalizePage(undefined, brief);
    expect(p.sections[0].type).toBe('hero');
    expect(p.sections[0].heading).toBe('Tidal');
    const s = normalizeSeo(undefined, { ...brief, websiteUrl: undefined });
    expect(s.canonicalUrl).toBe('https://tidal.example.com/tidal');
    expect(s.primaryKeyword).toBe('Tidal');
  });
});
