import type { ToolName } from '@/types';
import type { ToolSpec } from './ai';
import { agents } from '@/config/agents';

const specs: Record<ToolName, ToolSpec> = {
  generateImage: {
    name: 'generateImage',
    description: 'Generate a new image for the project. Use for logos, hero visuals, illustrations and UI concepts.',
    parameters: {
      type: 'object',
      properties: {
        prompt: { type: 'string', description: 'Detailed image prompt: subject, composition, style, lighting, colours. No text in the image.' },
        kind: { type: 'string', enum: ['logo', 'hero', 'illustration', 'concept'], description: 'What the image is for.' },
        aspectRatio: { type: 'string', enum: ['1:1', '16:9', '4:3'] },
      },
      required: ['prompt', 'kind'],
    },
  },
  editImage: {
    name: 'editImage',
    description: 'Edit the image the user selected, following an instruction.',
    parameters: {
      type: 'object',
      properties: { instruction: { type: 'string', description: 'What to change in the image.' } },
      required: ['instruction'],
    },
  },
  consultAgent: {
    name: 'consultAgent',
    description: 'Ask another specialist agent for feedback or ideas before acting.',
    parameters: {
      type: 'object',
      properties: {
        agentId: { type: 'string', enum: agents.map((a) => a.id), description: 'Which agent to consult.' },
        request: { type: 'string', description: 'The specific question for them.' },
      },
      required: ['agentId', 'request'],
    },
  },
  updateBrand: {
    name: 'updateBrand',
    description: 'Change part of the brand foundation. Only include fields that change.',
    parameters: {
      type: 'object',
      properties: {
        tagline: { type: 'string' },
        positioning: { type: 'string' },
        voice: { type: 'array', items: { type: 'string' } },
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
        },
        fonts: { type: 'object', properties: { heading: { type: 'string' }, body: { type: 'string' } } },
      },
    },
  },
  updateSection: {
    name: 'updateSection',
    description: 'Rewrite a landing page section. Provide the section type and the new content; omitted fields keep their current value.',
    parameters: {
      type: 'object',
      properties: {
        type: { type: 'string', enum: ['hero', 'features', 'how', 'proof', 'faq', 'cta'] },
        heading: { type: 'string' },
        subheading: { type: 'string' },
        body: { type: 'string' },
        items: { type: 'array', items: { type: 'object', properties: { title: { type: 'string' }, text: { type: 'string' } }, required: ['title', 'text'] } },
        ctaLabel: { type: 'string' },
      },
      required: ['type'],
    },
  },
  updateSeo: {
    name: 'updateSeo',
    description: 'Change part of the SEO plan. Only include fields that change.',
    parameters: {
      type: 'object',
      properties: {
        primaryKeyword: { type: 'string' },
        secondaryKeywords: { type: 'array', items: { type: 'string' } },
        title: { type: 'string' },
        metaDescription: { type: 'string' },
        h1: { type: 'string' },
        slug: { type: 'string' },
        schemaType: { type: 'string', enum: ['SoftwareApplication', 'Product', 'Organization', 'WebSite', 'Service'] },
        faq: { type: 'array', items: { type: 'object', properties: { question: { type: 'string' }, answer: { type: 'string' } }, required: ['question', 'answer'] } },
        contentIdeas: { type: 'array', items: { type: 'string' } },
      },
    },
  },
};

export const toolSpecsFor = (names: ToolName[]): ToolSpec[] => names.map((n) => specs[n]);
