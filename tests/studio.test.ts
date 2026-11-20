import { describe, it, expect, vi } from 'vitest';
import { runStudioTurn, projectContext, type StudioEffects } from '@/services/studio';
import type { AiProvider } from '@/services/ai';
import { agentById } from '@/config/agents';
import { sampleProject } from '@/sample/sampleProject';
import type { Message } from '@/types';

const effects = (): StudioEffects & { log: string[] } => {
  const log: string[] = [];
  return {
    log,
    addAsset: (a) => log.push(`asset:${a.kind}`),
    patchBrand: (p) => log.push(`brand:${Object.keys(p).join(',')}`),
    patchSection: (t, p) => log.push(`section:${t}:${Object.keys(p).join(',')}`),
    patchSeo: (p) => log.push(`seo:${Object.keys(p).join(',')}`),
  };
};

describe('projectContext', () => {
  it('summarises brief, brand, page and seo', () => {
    const ctx = projectContext(sampleProject);
    expect(ctx).toContain('Product name: Tidal');
    expect(ctx).toContain('Tagline: Deep work, in sync.');
    expect(ctx).toContain('- hero: "Deep work');
    expect(ctx).toContain('Primary keyword: team focus timer');
  });
});

describe('runStudioTurn', () => {
  it('applies updateSeo and updateSection tool calls and emits system notes', async () => {
    const ai: AiProvider = {
      chat: vi.fn(async () => ({ text: 'Retargeting.', toolCalls: [
        { name: 'updateSeo', args: { title: 'New title', schemaType: 'Nope', secondaryKeywords: ['a', 'b'] } },
        { name: 'updateSection', args: { type: 'hero', heading: 'New H1', items: [{ title: 'x', text: 'y' }, { text: 'no title' }] } },
        { name: 'updateSection', args: { type: 'bogus', heading: 'ignored' } },
      ] })),
      generateJson: vi.fn(), generateImage: vi.fn(), editImage: vi.fn(),
    };
    const fx = effects();
    const out: Message[] = [];
    await runStudioTurn({ ai, agent: agentById('cruise-control'), project: sampleProject, history: [], prompt: 'retarget', effects: fx, emit: (m) => out.push(m) });
    expect(fx.log).toEqual(['seo:title,secondaryKeywords', 'section:hero:heading,items']);
    expect(out[0].text).toBe('Retargeting.');
    expect(out.filter((m) => m.author === 'system')).toHaveLength(2);
    expect(ai.chat).toHaveBeenCalledTimes(1);
  });

  it('consults another agent, then runs a follow-up turn without consultAgent available', async () => {
    const chat = vi.fn()
      .mockResolvedValueOnce({ text: 'Let me ask the Labyrinth.', toolCalls: [{ name: 'consultAgent', args: { agentId: 'logo-labyrinth', request: 'Symbol ideas?' } }] })
      .mockResolvedValueOnce({ text: 'Use a tide ring.', toolCalls: [] })
      .mockResolvedValueOnce({ text: 'Generating.', toolCalls: [{ name: 'generateImage', args: { prompt: 'tide ring', kind: 'logo' } }] });
    const ai: AiProvider = { chat, generateJson: vi.fn(), generateImage: vi.fn(async () => 'data:image/png;base64,AAA'), editImage: vi.fn() };
    const fx = effects();
    const out: Message[] = [];
    await runStudioTurn({ ai, agent: agentById('design-planet'), project: sampleProject, history: [], prompt: 'new logo', effects: fx, emit: (m) => out.push(m) });

    expect(chat).toHaveBeenCalledTimes(3);
    expect(chat.mock.calls[1][0].tools).toEqual([]);
    expect(chat.mock.calls[2][0].tools.map((t: { name: string }) => t.name)).not.toContain('consultAgent');
    expect(chat.mock.calls[2][0].prompt).toContain('Feedback from Logo Labyrinth: Use a tide ring.');
    expect(out.find((m) => m.via === 'Logo Labyrinth')?.text).toBe('Use a tide ring.');
    expect(fx.log).toEqual(['asset:logo']);
    expect(out.at(-1)?.imageUrl).toBe('data:image/png;base64,AAA');
  });

  it('edits the most recent image in the conversation when none is attached', async () => {
    const ai: AiProvider = {
      chat: vi.fn(async () => ({ text: '', toolCalls: [{ name: 'editImage', args: { instruction: 'make it blue' } }] })),
      generateJson: vi.fn(), generateImage: vi.fn(),
      editImage: vi.fn(async () => ({ imageDataUrl: 'data:image/png;base64,BBB', text: 'Blue now.' })),
    };
    const fx = effects();
    const out: Message[] = [];
    const history: Message[] = [{ id: '1', author: 'user', text: '', imageUrl: 'data:image/png;base64,AAA', createdAt: 1 }];
    await runStudioTurn({ ai, agent: agentById('segmentation-station'), project: sampleProject, history, prompt: 'make it blue', effects: fx, emit: (m) => out.push(m) });
    expect((ai.editImage as ReturnType<typeof vi.fn>).mock.calls[0][0].image.inlineData.data).toBe('AAA');
    expect(fx.log).toEqual(['asset:edit']);
    expect(out.at(-1)?.text).toBe('Blue now.');
  });
});
