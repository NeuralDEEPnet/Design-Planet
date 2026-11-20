import { GoogleGenAI, Modality, type Content, type Schema } from '@google/genai';
import type { ImagePart } from '@/types';
import { AiError, type AiProvider, type JsonSchema } from './ai';

export const MODELS = {
  text: 'gemini-2.5-flash',
  image: 'imagen-4.0-generate-001',
  edit: 'gemini-2.5-flash-image',
} as const;

/** Gemini wants schema `type` values in upper case; the app writes plain JSON Schema. */
export function toGeminiSchema(schema: JsonSchema): Schema {
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(schema)) {
    if (key === 'type' && typeof value === 'string') out.type = value.toUpperCase();
    else if (key === 'properties' && value && typeof value === 'object')
      out.properties = Object.fromEntries(Object.entries(value as Record<string, JsonSchema>).map(([k, v]) => [k, toGeminiSchema(v)]));
    else if (key === 'items' && value && typeof value === 'object') out.items = toGeminiSchema(value as JsonSchema);
    else out[key] = value;
  }
  return out as Schema;
}

function classify(error: unknown): AiError {
  const message = error instanceof Error ? error.message : String(error);
  const m = message.toLowerCase();
  if (m.includes('api key') || m.includes('api_key') || m.includes('401') || m.includes('403') || m.includes('permission_denied') || m.includes('unauthenticated'))
    return new AiError(message, 'auth');
  if (m.includes('429') || m.includes('resource_exhausted') || m.includes('quota')) return new AiError(message, 'rate');
  if (m.includes('500') || m.includes('503') || m.includes('unavailable') || m.includes('internal')) return new AiError(message, 'server');
  if (m.includes('safety') || m.includes('blocked')) return new AiError(message, 'safety');
  return new AiError(message, 'unknown');
}

function extractJson(text: string): unknown {
  const trimmed = text.trim().replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/, '');
  try {
    return JSON.parse(trimmed);
  } catch {
    const start = trimmed.indexOf('{');
    const end = trimmed.lastIndexOf('}');
    if (start >= 0 && end > start) return JSON.parse(trimmed.slice(start, end + 1));
    throw new AiError('The model did not return valid JSON.', 'unknown');
  }
}

export function createGeminiProvider(apiKey: string): AiProvider {
  if (!apiKey) throw new AiError('No Gemini API key configured.', 'auth');
  const client = new GoogleGenAI({ apiKey });

  return {
    async generateJson<T>({ system, prompt, schema, image }: { system: string; prompt: string; schema: JsonSchema; image?: ImagePart | null }): Promise<T> {
      try {
        const parts: ({ text: string } | ImagePart)[] = [{ text: prompt }];
        if (image) parts.unshift(image);
        const response = await client.models.generateContent({
          model: MODELS.text,
          contents: [{ role: 'user', parts }],
          config: { systemInstruction: system, responseMimeType: 'application/json', responseSchema: toGeminiSchema(schema), temperature: 0.8 },
        });
        const text = response.text ?? '';
        if (!text) throw new AiError('The model returned an empty response.', 'safety');
        return extractJson(text) as T;
      } catch (error) {
        throw error instanceof AiError ? error : classify(error);
      }
    },

    async chat({ system, history, prompt, tools, image }) {
      try {
        const contents: Content[] = history.map((h) => ({ role: h.role, parts: [{ text: h.text }] }));
        const parts: ({ text: string } | ImagePart)[] = [{ text: prompt }];
        if (image) parts.unshift(image);
        contents.push({ role: 'user', parts });
        const response = await client.models.generateContent({
          model: MODELS.text,
          contents,
          config: {
            systemInstruction: system,
            tools: tools.length ? [{ functionDeclarations: tools.map((t) => ({ name: t.name, description: t.description, parameters: toGeminiSchema(t.parameters) })) }] : undefined,
          },
        });
        const toolCalls = (response.functionCalls ?? []).filter((c) => c.name).map((c) => ({ name: c.name as string, args: (c.args ?? {}) as Record<string, unknown> }));
        return { text: response.text ?? '', toolCalls };
      } catch (error) {
        throw classify(error);
      }
    },

    async generateImage({ prompt, aspectRatio }) {
      try {
        const response = await client.models.generateImages({
          model: MODELS.image,
          prompt,
          config: { numberOfImages: 1, outputMimeType: 'image/png', aspectRatio },
        });
        const bytes = response.generatedImages?.[0]?.image?.imageBytes;
        if (!bytes) throw new AiError('No image was generated. The prompt may have been filtered.', 'safety');
        return `data:image/png;base64,${bytes}`;
      } catch (error) {
        throw error instanceof AiError ? error : classify(error);
      }
    },

    async editImage({ prompt, image }) {
      try {
        const response = await client.models.generateContent({
          model: MODELS.edit,
          contents: [{ role: 'user', parts: [image, { text: prompt }] }],
          config: { responseModalities: [Modality.IMAGE, Modality.TEXT] },
        });
        let imageDataUrl: string | null = null;
        let text: string | null = null;
        for (const part of response.candidates?.[0]?.content?.parts ?? []) {
          if (part.text) text = part.text;
          else if (part.inlineData?.data) imageDataUrl = `data:${part.inlineData.mimeType ?? 'image/png'};base64,${part.inlineData.data}`;
        }
        return { imageDataUrl, text };
      } catch (error) {
        throw classify(error);
      }
    },
  };
}
