import type { Project, Message, AgentDef, Asset, Brand, SeoPlan, PageSection, ImagePart } from '@/types';
import type { AiProvider, ToolCall } from './ai';
import { toolSpecsFor } from './tools';
import { agentById } from '@/config/agents';
import { briefSummary, normalizeBrand } from './launchKit';
import { uid, dataUrlToPart } from '@/lib/id';

/** What a studio turn may change in the project. Each callback is optional and applied immediately. */
export interface StudioEffects {
  addAsset: (asset: Asset) => void;
  patchBrand: (patch: Partial<Brand>) => void;
  patchSection: (type: PageSection['type'], patch: Partial<PageSection>) => void;
  patchSeo: (patch: Partial<SeoPlan>) => void;
}

export interface StudioTurnArgs {
  ai: AiProvider;
  agent: AgentDef;
  project: Project;
  history: Message[];
  prompt: string;
  /** Image attached to this message, as a data URL. For Segmentation Station this is the image to edit. */
  imageDataUrl?: string;
  effects: StudioEffects;
  emit: (message: Message) => void;
}

const msg = (text: string, extra: Partial<Message> = {}): Message => ({ id: uid(), author: 'agent', text, createdAt: Date.now(), ...extra });

/** Everything an agent should know about the project, rendered compactly. */
export function projectContext(project: Project): string {
  const lines: string[] = ['## Project brief', briefSummary(project.brief)];
  if (project.brand) {
    const b = project.brand;
    lines.push('', '## Brand', `Tagline: ${b.tagline}`, `Positioning: ${b.positioning}`, `Voice: ${b.voice.join(', ')}`, `Palette: ${Object.entries(b.palette).map(([k, v]) => `${k} ${v}`).join(', ')}`, `Fonts: ${b.fonts.heading} / ${b.fonts.body}`);
  }
  if (project.page) {
    lines.push('', '## Landing page sections');
    for (const s of project.page.sections) {
      lines.push(`- ${s.type}: "${s.heading}"${s.subheading ? ` / ${s.subheading}` : ''}${s.items?.length ? ` [${s.items.map((i) => i.title).join('; ')}]` : ''}`);
    }
  }
  if (project.seo) {
    const s = project.seo;
    lines.push('', '## SEO plan', `Primary keyword: ${s.primaryKeyword}`, `Secondary: ${s.secondaryKeywords.join(', ')}`, `Title: ${s.title}`, `Meta: ${s.metaDescription}`, `H1: ${s.h1}`);
  }
  return lines.join('\n');
}

const toHistory = (messages: Message[]): { role: 'user' | 'model'; text: string }[] =>
  messages
    .filter((m) => m.author !== 'system' && m.text)
    .slice(-16)
    .map((m) => ({ role: m.author === 'user' ? 'user' : 'model', text: m.via ? `[${m.via}] ${m.text}` : m.text }));

const toPart = (dataUrl?: string): ImagePart | null => {
  if (!dataUrl) return null;
  const part = dataUrlToPart(dataUrl);
  return part ? { inlineData: part } : null;
};

async function runTool(call: ToolCall, args: StudioTurnArgs, depth: number): Promise<string | null> {
  const { ai, agent, project, effects, emit } = args;
  const a = call.args;
  switch (call.name) {
    case 'generateImage': {
      const prompt = String(a.prompt ?? '').trim();
      if (!prompt) return null;
      const kind = (['logo', 'hero', 'illustration', 'concept'] as const).find((k) => k === a.kind) ?? 'concept';
      const aspectRatio = (['1:1', '16:9', '4:3'] as const).find((r) => r === a.aspectRatio) ?? (kind === 'hero' ? '16:9' : '1:1');
      emit(msg(`Generating a ${kind} image…`, { author: 'system' }));
      const url = await ai.generateImage({ prompt, aspectRatio });
      const asset: Asset = { id: uid(), url, prompt, kind, createdAt: Date.now(), saved: false };
      effects.addAsset(asset);
      emit(msg(`Here is the ${kind}. Save it from Assets, or tell me what to change.`, { imageUrl: url }));
      return `Generated ${kind} image (asset ${asset.id}).`;
    }
    case 'editImage': {
      const instruction = String(a.instruction ?? '').trim();
      const source = args.imageDataUrl ?? [...args.history].reverse().find((m) => m.imageUrl)?.imageUrl;
      const part = toPart(source);
      if (!instruction || !part) {
        emit(msg('I need an image to edit. Open Assets and press the edit button on one.'));
        return null;
      }
      emit(msg('Editing the image…', { author: 'system' }));
      const { imageDataUrl, text } = await ai.editImage({ prompt: instruction, image: part });
      if (!imageDataUrl) {
        emit(msg(text || 'I could not apply that edit. Try a more specific instruction.'));
        return null;
      }
      const asset: Asset = { id: uid(), url: imageDataUrl, prompt: `Edit: ${instruction}`, kind: 'edit', createdAt: Date.now(), saved: false };
      effects.addAsset(asset);
      emit(msg(text || 'Done. Keep going with another instruction, or save it from Assets.', { imageUrl: imageDataUrl }));
      return `Edited image (asset ${asset.id}).`;
    }
    case 'consultAgent': {
      if (depth > 0) return null;
      const consultant = agentById(String(a.agentId ?? ''));
      const request = String(a.request ?? '').trim();
      if (!request || consultant.id === agent.id) return null;
      emit(msg(`Consulting ${consultant.name}…`, { author: 'system' }));
      const reply = await ai.chat({
        system: `${consultant.systemInstruction}\n\nYou are being consulted by ${agent.name}. Answer with direct, specific feedback in under 150 words. Do not call tools.\n\n${projectContext(project)}`,
        history: [],
        prompt: request,
        tools: [],
      });
      emit(msg(reply.text, { via: consultant.name }));
      return `Feedback from ${consultant.name}: ${reply.text}`;
    }
    case 'updateBrand': {
      const patch: Partial<Brand> = {};
      if (typeof a.tagline === 'string') patch.tagline = a.tagline;
      if (typeof a.positioning === 'string') patch.positioning = a.positioning;
      if (Array.isArray(a.voice)) patch.voice = a.voice.map(String);
      if (a.palette && typeof a.palette === 'object') {
        const normalized = normalizeBrand({ palette: { ...(project.brand?.palette ?? {}), ...(a.palette as Record<string, string>) } as Brand['palette'] }).palette;
        patch.palette = normalized;
      }
      if (a.fonts && typeof a.fonts === 'object') {
        const f = a.fonts as Partial<Brand['fonts']>;
        patch.fonts = { heading: f.heading || project.brand?.fonts.heading || 'Inter', body: f.body || project.brand?.fonts.body || 'Inter' };
      }
      if (Object.keys(patch).length === 0) return null;
      effects.patchBrand(patch);
      emit(msg(`Brand updated: ${Object.keys(patch).join(', ')}.`, { author: 'system' }));
      return `Brand updated (${Object.keys(patch).join(', ')}).`;
    }
    case 'updateSection': {
      const type = String(a.type ?? '') as PageSection['type'];
      if (!['hero', 'features', 'how', 'proof', 'faq', 'cta'].includes(type)) return null;
      const patch: Partial<PageSection> = {};
      if (typeof a.heading === 'string') patch.heading = a.heading;
      if (typeof a.subheading === 'string') patch.subheading = a.subheading;
      if (typeof a.body === 'string') patch.body = a.body;
      if (typeof a.ctaLabel === 'string') patch.ctaLabel = a.ctaLabel;
      if (Array.isArray(a.items)) patch.items = (a.items as { title?: string; text?: string }[]).filter((i) => i && i.title).map((i) => ({ title: String(i.title), text: String(i.text ?? '') }));
      if (Object.keys(patch).length === 0) return null;
      effects.patchSection(type, patch);
      emit(msg(`${type} section updated.`, { author: 'system' }));
      return `Section ${type} updated.`;
    }
    case 'updateSeo': {
      const patch: Partial<SeoPlan> = {};
      for (const key of ['primaryKeyword', 'title', 'metaDescription', 'h1', 'slug'] as const) {
        if (typeof a[key] === 'string') patch[key] = a[key] as string;
      }
      if (typeof a.schemaType === 'string' && ['SoftwareApplication', 'Product', 'Organization', 'WebSite', 'Service'].includes(a.schemaType)) patch.schemaType = a.schemaType as SeoPlan['schemaType'];
      if (Array.isArray(a.secondaryKeywords)) patch.secondaryKeywords = a.secondaryKeywords.map(String);
      if (Array.isArray(a.contentIdeas)) patch.contentIdeas = a.contentIdeas.map(String);
      if (Array.isArray(a.faq)) patch.faq = (a.faq as { question?: string; answer?: string }[]).filter((f) => f && f.question && f.answer).map((f) => ({ question: String(f.question), answer: String(f.answer) }));
      if (Object.keys(patch).length === 0) return null;
      effects.patchSeo(patch);
      emit(msg(`SEO plan updated: ${Object.keys(patch).join(', ')}.`, { author: 'system' }));
      return `SEO plan updated (${Object.keys(patch).join(', ')}).`;
    }
    default:
      return null;
  }
}

/**
 * One user turn with an agent: model reply → tool calls → (optional) follow-up turn with tool results.
 * Messages are emitted as they happen so the chat feels live.
 */
export async function runStudioTurn(args: StudioTurnArgs): Promise<void> {
  const { ai, agent, project, history, prompt, imageDataUrl, emit } = args;
  const system = `${agent.systemInstruction}\n\n${projectContext(project)}`;
  const tools = toolSpecsFor(agent.tools);

  let turn = await ai.chat({ system, history: toHistory(history), prompt, tools, image: toPart(imageDataUrl) });
  if (turn.text) emit(msg(turn.text));

  for (let depth = 0; depth < 2 && turn.toolCalls.length > 0; depth += 1) {
    const results: string[] = [];
    for (const call of turn.toolCalls) {
      const result = await runTool(call, args, depth);
      if (result) results.push(result);
    }
    const needsFollowUp = turn.toolCalls.some((c) => c.name === 'consultAgent') && results.length > 0;
    if (!needsFollowUp) break;
    const followTools = tools.filter((t) => t.name !== 'consultAgent');
    turn = await ai.chat({
      system,
      history: [...toHistory(history), { role: 'user', text: prompt }, ...(turn.text ? [{ role: 'model' as const, text: turn.text }] : [])],
      prompt: `Tool results:\n${results.join('\n')}\n\nNow act on this feedback with the tools available, then summarise in one or two sentences.`,
      tools: followTools,
    });
    if (turn.text) emit(msg(turn.text));
  }
}
