import type { Brief, Brand, LandingPage, SeoPlan, Asset, PipelineStep, ImagePart, PageSection } from '@/types';
import type { AiProvider } from './ai';
import { dataUrlToPart, slugify, uid } from '@/lib/id';

export const initialPipeline = (): PipelineStep[] => [
  { id: 'brand', label: 'Brand strategy', status: 'pending' },
  { id: 'page', label: 'Landing page copy', status: 'pending' },
  { id: 'seo', label: 'SEO cruise control', status: 'pending' },
  { id: 'logo', label: 'Logo concept', status: 'pending' },
  { id: 'hero', label: 'Hero visual', status: 'pending' },
];

export const briefSummary = (brief: Brief): string =>
  [
    `Product name: ${brief.name}`,
    `What it is: ${brief.description}`,
    `Audience: ${brief.audience}`,
    `Style and inspiration: ${brief.style}${brief.inspirationImage ? ' (an inspiration image is attached)' : ''}`,
    `Qualities: ${brief.qualities}`,
    `Scope: ${brief.scope}`,
    brief.websiteUrl ? `Existing website: ${brief.websiteUrl}` : '',
  ]
    .filter(Boolean)
    .join('\n');

export const BRAND_SYSTEM = `You are the Creative Director of AIrave Studio, a world-class brand strategist.
Turn a product brief into a tight brand foundation. Be specific and opinionated, never generic.
Palette colours must be 6-digit hex, accessible together (text readable on background and surface), and must suit the audience.
Fonts must be real Google Fonts family names. logoPrompt and heroPrompt are prompts for an image model: describe subject, composition, style, lighting and colour explicitly, and never ask for text or letters inside the image.`;

export const PAGE_SYSTEM = `You are the lead UX writer of AIrave Studio.
Write the copy for a conversion-focused landing page from the brief and brand foundation.
Keep headings short and concrete, avoid buzzwords, write in the brand voice, and use the audience's own words.
Return exactly these sections in order: hero, features (3 or 4 items), how (3 steps), proof (3 short testimonials with realistic first names and roles, clearly plausible but not claiming real people), faq (4 questions), cta.`;

export const SEO_SYSTEM = `You are Cruise Control, the SEO autopilot of AIrave Studio.
From the brief, brand and page copy, produce an SEO plan a growth team could act on today.
Choose one primary keyword with real search intent and 5 to 8 secondary keywords.
Title must be 30 to 60 characters and contain the primary keyword. Meta description must be 70 to 160 characters, contain the keyword and a reason to click.
The H1 must contain the primary keyword and read naturally. The slug is lowercase with hyphens. FAQ answers must be 1 to 3 sentences and useful on their own.`;

const brandSchema = {
  type: 'object',
  properties: {
    tagline: { type: 'string' },
    positioning: { type: 'string', description: 'One or two sentences on who it is for and why it wins.' },
    voice: { type: 'array', items: { type: 'string' }, description: 'Three to five adjectives.' },
    palette: {
      type: 'object',
      properties: {
        primary: { type: 'string' },
        secondary: { type: 'string' },
        accent: { type: 'string' },
        background: { type: 'string' },
        surface: { type: 'string' },
        text: { type: 'string' },
      },
      required: ['primary', 'secondary', 'accent', 'background', 'surface', 'text'],
    },
    fonts: {
      type: 'object',
      properties: { heading: { type: 'string' }, body: { type: 'string' } },
      required: ['heading', 'body'],
    },
    logoPrompt: { type: 'string' },
    heroPrompt: { type: 'string' },
  },
  required: ['tagline', 'positioning', 'voice', 'palette', 'fonts', 'logoPrompt', 'heroPrompt'],
};

const sectionSchema = {
  type: 'object',
  properties: {
    type: { type: 'string', enum: ['hero', 'features', 'how', 'proof', 'faq', 'cta'] },
    heading: { type: 'string' },
    subheading: { type: 'string' },
    body: { type: 'string' },
    items: {
      type: 'array',
      items: {
        type: 'object',
        properties: { title: { type: 'string' }, text: { type: 'string' } },
        required: ['title', 'text'],
      },
    },
    ctaLabel: { type: 'string' },
  },
  required: ['type', 'heading'],
};

const pageSchema = {
  type: 'object',
  properties: { sections: { type: 'array', items: sectionSchema } },
  required: ['sections'],
};

const seoSchema = {
  type: 'object',
  properties: {
    primaryKeyword: { type: 'string' },
    secondaryKeywords: { type: 'array', items: { type: 'string' } },
    title: { type: 'string' },
    metaDescription: { type: 'string' },
    slug: { type: 'string' },
    h1: { type: 'string' },
    ogTitle: { type: 'string' },
    ogDescription: { type: 'string' },
    schemaType: { type: 'string', enum: ['SoftwareApplication', 'Product', 'Organization', 'WebSite', 'Service'] },
    faq: {
      type: 'array',
      items: {
        type: 'object',
        properties: { question: { type: 'string' }, answer: { type: 'string' } },
        required: ['question', 'answer'],
      },
    },
    contentIdeas: { type: 'array', items: { type: 'string' } },
  },
  required: ['primaryKeyword', 'secondaryKeywords', 'title', 'metaDescription', 'slug', 'h1', 'ogTitle', 'ogDescription', 'schemaType', 'faq', 'contentIdeas'],
};

const HEX = /^#[0-9a-f]{6}$/i;
const fallbackPalette = { primary: '#0ea5e9', secondary: '#6366f1', accent: '#f59e0b', background: '#0b1020', surface: '#1e293b', text: '#e2e8f0' };

/** Guards against the model returning near-valid output: bad hex, empty lists, missing fonts. */
export function normalizeBrand(raw: Partial<Brand> | undefined): Brand {
  const palette = { ...fallbackPalette };
  for (const key of Object.keys(palette) as (keyof typeof palette)[]) {
    const v = raw?.palette?.[key];
    if (typeof v === 'string' && HEX.test(v.trim())) palette[key] = v.trim().toLowerCase();
  }
  return {
    tagline: raw?.tagline?.trim() || 'Built to launch.',
    positioning: raw?.positioning?.trim() || '',
    voice: Array.isArray(raw?.voice) && raw.voice.length ? raw.voice.slice(0, 5) : ['clear', 'confident'],
    palette,
    fonts: {
      heading: raw?.fonts?.heading?.trim() || 'Inter',
      body: raw?.fonts?.body?.trim() || 'Inter',
    },
    logoPrompt: raw?.logoPrompt?.trim() || '',
    heroPrompt: raw?.heroPrompt?.trim() || '',
  };
}

export function normalizePage(raw: Partial<LandingPage> | undefined, brief: Brief): LandingPage {
  const order: PageSection['type'][] = ['hero', 'features', 'how', 'proof', 'faq', 'cta'];
  const sections: PageSection[] = [];
  const given = Array.isArray(raw?.sections) ? raw.sections : [];
  for (const type of order) {
    const found = given.find((s) => s?.type === type);
    if (found && found.heading) {
      sections.push({
        id: `${type}-${uid().slice(0, 6)}`,
        type,
        heading: found.heading,
        subheading: found.subheading,
        body: found.body,
        items: Array.isArray(found.items) ? found.items.filter((i) => i && i.title) : undefined,
        ctaLabel: found.ctaLabel || (type === 'hero' || type === 'cta' ? 'Get started' : undefined),
        ctaHref: '#cta',
      });
    }
  }
  if (!sections.some((s) => s.type === 'hero')) {
    sections.unshift({ id: `hero-${uid().slice(0, 6)}`, type: 'hero', heading: brief.name, subheading: brief.description, ctaLabel: 'Get started', ctaHref: '#cta' });
  }
  const cta = sections.find((s) => s.type === 'cta');
  if (cta) cta.id = 'cta';
  return { sections };
}

export function normalizeSeo(raw: Partial<SeoPlan> | undefined, brief: Brief): SeoPlan {
  const slug = slugify(raw?.slug || brief.name);
  const base = brief.websiteUrl && /^https?:\/\//.test(brief.websiteUrl) ? brief.websiteUrl.replace(/\/+$/, '') : `https://${slugify(brief.name)}.example.com`;
  return {
    primaryKeyword: raw?.primaryKeyword?.trim() || brief.name,
    secondaryKeywords: Array.isArray(raw?.secondaryKeywords) ? raw.secondaryKeywords.filter(Boolean).slice(0, 8) : [],
    title: raw?.title?.trim() || `${brief.name}: ${brief.description}`.slice(0, 60),
    metaDescription: raw?.metaDescription?.trim() || brief.description.slice(0, 160),
    slug,
    h1: raw?.h1?.trim() || brief.name,
    canonicalUrl: `${base}/${slug}`,
    ogTitle: raw?.ogTitle?.trim() || raw?.title?.trim() || brief.name,
    ogDescription: raw?.ogDescription?.trim() || raw?.metaDescription?.trim() || brief.description,
    schemaType: raw?.schemaType && ['SoftwareApplication', 'Product', 'Organization', 'WebSite', 'Service'].includes(raw.schemaType) ? raw.schemaType : 'Product',
    faq: Array.isArray(raw?.faq) ? raw.faq.filter((f) => f && f.question && f.answer).slice(0, 6) : [],
    contentIdeas: Array.isArray(raw?.contentIdeas) ? raw.contentIdeas.filter(Boolean).slice(0, 8) : [],
  };
}

export interface PipelineResult {
  brand: Brand;
  page: LandingPage;
  seo: SeoPlan;
  assets: Asset[];
  steps: PipelineStep[];
}

export interface PipelineCallbacks {
  onStep?: (steps: PipelineStep[]) => void;
  onBrand?: (brand: Brand) => void;
  onPage?: (page: LandingPage) => void;
  onSeo?: (seo: SeoPlan) => void;
  onAsset?: (asset: Asset) => void;
}

const inspirationPart = (brief: Brief): ImagePart | null => {
  if (!brief.inspirationImage) return null;
  const part = dataUrlToPart(brief.inspirationImage);
  return part ? { inlineData: part } : null;
};

/**
 * Runs the whole launch pipeline: brand → page copy and SEO (parallel) → logo and hero images (parallel).
 * Text steps are required; image steps degrade gracefully so a flaky image model never blocks the kit.
 */
export async function runLaunchPipeline(brief: Brief, ai: AiProvider, cb: PipelineCallbacks = {}): Promise<PipelineResult> {
  const steps = initialPipeline();
  const setStep = (id: PipelineStep['id'], status: PipelineStep['status'], detail?: string) => {
    const step = steps.find((s) => s.id === id)!;
    step.status = status;
    step.detail = detail;
    cb.onStep?.(steps.map((s) => ({ ...s })));
  };
  const summary = briefSummary(brief);
  const assets: Asset[] = [];

  setStep('brand', 'running');
  let brand: Brand;
  try {
    const raw = await ai.generateJson<Partial<Brand>>({
      system: BRAND_SYSTEM,
      prompt: `Create the brand foundation for this brief.\n\n${summary}`,
      schema: brandSchema,
      image: inspirationPart(brief),
    });
    brand = normalizeBrand(raw);
    setStep('brand', 'done', brand.tagline);
    cb.onBrand?.(brand);
  } catch (error) {
    setStep('brand', 'failed', error instanceof Error ? error.message : String(error));
    throw error;
  }

  const brandContext = `Brand foundation:\nTagline: ${brand.tagline}\nPositioning: ${brand.positioning}\nVoice: ${brand.voice.join(', ')}`;

  setStep('page', 'running');
  setStep('seo', 'running');
  const pagePromise = ai
    .generateJson<Partial<LandingPage>>({ system: PAGE_SYSTEM, prompt: `${summary}\n\n${brandContext}\n\nWrite the landing page sections.`, schema: pageSchema })
    .then((raw) => normalizePage(raw, brief));

  let page: LandingPage;
  try {
    page = await pagePromise;
    setStep('page', 'done', `${page.sections.length} sections`);
    cb.onPage?.(page);
  } catch (error) {
    setStep('page', 'failed', error instanceof Error ? error.message : String(error));
    setStep('seo', 'skipped', 'Needs page copy');
    throw error;
  }

  let seo: SeoPlan;
  try {
    const pageText = page.sections.map((s) => `${s.type}: ${s.heading} ${s.subheading ?? ''} ${(s.items ?? []).map((i) => i.title).join(', ')}`).join('\n');
    const raw = await ai.generateJson<Partial<SeoPlan>>({ system: SEO_SYSTEM, prompt: `${summary}\n\n${brandContext}\n\nPage copy:\n${pageText}\n\nProduce the SEO plan.`, schema: seoSchema });
    seo = normalizeSeo(raw, brief);
    setStep('seo', 'done', seo.primaryKeyword);
    cb.onSeo?.(seo);
  } catch (error) {
    setStep('seo', 'failed', error instanceof Error ? error.message : String(error));
    throw error;
  }

  const makeImage = async (id: 'logo' | 'hero', prompt: string, aspectRatio: '1:1' | '16:9') => {
    if (!prompt) {
      setStep(id, 'skipped', 'No prompt');
      return;
    }
    setStep(id, 'running');
    try {
      const url = await ai.generateImage({ prompt, aspectRatio });
      const asset: Asset = { id: uid(), url, prompt, kind: id, createdAt: Date.now(), saved: true };
      assets.push(asset);
      if (id === 'logo') brand.logoAssetId = asset.id;
      else brand.heroAssetId = asset.id;
      setStep(id, 'done');
      cb.onAsset?.(asset);
      cb.onBrand?.({ ...brand });
    } catch (error) {
      setStep(id, 'failed', error instanceof Error ? error.message : String(error));
    }
  };

  await Promise.all([
    makeImage('logo', brand.logoPrompt ? `${brand.logoPrompt}. Flat vector logo mark, centred on a plain ${brand.palette.background} background, no text.` : '', '1:1'),
    makeImage('hero', brand.heroPrompt ? `${brand.heroPrompt}. Colour palette ${brand.palette.primary}, ${brand.palette.accent}. No text.` : '', '16:9'),
  ]);

  return { brand, page, seo, assets, steps };
}
