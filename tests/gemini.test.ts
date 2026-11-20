import { describe, it, expect } from 'vitest';
import { toGeminiSchema } from '@/services/gemini';

describe('toGeminiSchema', () => {
  it('upper-cases type keys recursively and keeps enums, required and descriptions', () => {
    const out = toGeminiSchema({
      type: 'object',
      properties: { a: { type: 'string', enum: ['x'] }, b: { type: 'array', items: { type: 'object', properties: { c: { type: 'number', description: 'd' } } } } },
      required: ['a'],
    }) as Record<string, any>;
    expect(out.type).toBe('OBJECT');
    expect(out.properties.a.type).toBe('STRING');
    expect(out.properties.a.enum).toEqual(['x']);
    expect(out.properties.b.items.type).toBe('OBJECT');
    expect(out.properties.b.items.properties.c.type).toBe('NUMBER');
    expect(out.properties.b.items.properties.c.description).toBe('d');
    expect(out.required).toEqual(['a']);
  });
});
