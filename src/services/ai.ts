import type { ImagePart } from '@/types';

/** A JSON schema fragment in the subset Gemini accepts. Kept loose on purpose. */
export type JsonSchema = Record<string, unknown>;

export interface ToolCall {
  name: string;
  args: Record<string, unknown>;
}

export interface ChatTurnResult {
  text: string;
  toolCalls: ToolCall[];
}

export interface ToolSpec {
  name: string;
  description: string;
  parameters: JsonSchema;
}

/**
 * Everything the app needs from a model provider.
 * The Gemini client implements it; tests use an in-memory fake.
 */
export interface AiProvider {
  generateJson<T>(args: { system: string; prompt: string; schema: JsonSchema; image?: ImagePart | null }): Promise<T>;
  chat(args: {
    system: string;
    history: { role: 'user' | 'model'; text: string }[];
    prompt: string;
    tools: ToolSpec[];
    image?: ImagePart | null;
  }): Promise<ChatTurnResult>;
  generateImage(args: { prompt: string; aspectRatio: '1:1' | '16:9' | '4:3' }): Promise<string>;
  editImage(args: { prompt: string; image: ImagePart }): Promise<{ imageDataUrl: string | null; text: string | null }>;
}

export class AiError extends Error {
  constructor(
    message: string,
    public readonly kind: 'auth' | 'rate' | 'server' | 'safety' | 'unknown' = 'unknown',
  ) {
    super(message);
    this.name = 'AiError';
  }
}

export function friendlyAiError(error: unknown): string {
  if (error instanceof AiError) {
    switch (error.kind) {
      case 'auth':
        return 'The Gemini API key was rejected. Open Settings and check the key.';
      case 'rate':
        return 'Gemini is rate limiting requests right now. Wait a moment and try again.';
      case 'server':
        return 'Gemini returned a server error. Try again in a minute.';
      case 'safety':
        return 'The request was blocked by the safety filter. Rephrase and try again.';
      default:
        return error.message;
    }
  }
  if (error instanceof Error) {
    const m = error.message.toLowerCase();
    if (m.includes('api key') || m.includes('401') || m.includes('403') || m.includes('permission')) return 'The Gemini API key was rejected. Open Settings and check the key.';
    if (m.includes('429') || m.includes('quota')) return 'Gemini is rate limiting requests right now. Wait a moment and try again.';
    if (m.includes('500') || m.includes('503')) return 'Gemini returned a server error. Try again in a minute.';
    if (m.includes('safety')) return 'The request was blocked by the safety filter. Rephrase and try again.';
    return error.message;
  }
  return 'Something went wrong.';
}
