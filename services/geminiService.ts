import { GoogleGenAI, GenerateContentResponse, FunctionDeclaration, Type } from "@google/genai";
import type { ImagePart } from '../types';

let ai: GoogleGenAI;

// Lazy initialization of the GoogleGenAI client
const getAiClient = () => {
  if (!ai) {
    if (!process.env.API_KEY) {
      throw new Error("API_KEY environment variable is not set");
    }
    ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  }
  return ai;
};

const generateImageFunctionDeclaration: FunctionDeclaration = {
  name: 'generateImage',
  description: 'Generates an image based on a detailed user prompt. Use this function whenever the user asks for a logo, illustration, picture, or any visual asset.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      prompt: {
        type: Type.STRING,
        description: 'A detailed, descriptive prompt for the image generation model. This should be a creative interpretation of the user\'s request, suitable for an AI image generator.',
      },
    },
    required: ['prompt'],
  },
};

const consultAgentFunctionDeclaration: FunctionDeclaration = {
  name: 'consultAgent',
  description: 'Consult another specialized AI agent to get feedback or ideas on the current design brief before generating the final image. Use this to improve the prompt.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      agentId: {
        type: Type.STRING,
        description: 'The ID of the agent to consult (e.g., "logo-labyrinth", "illustration-nebula").',
      },
      request: {
        type: Type.STRING,
        description: 'A specific question or request for the agent you are consulting.',
      },
    },
    required: ['agentId', 'request'],
  },
};

export const allTools = [generateImageFunctionDeclaration, consultAgentFunctionDeclaration];
export const generationTool = [generateImageFunctionDeclaration];


export async function reasonAndPlan(prompt: string, systemInstruction: string, tools: FunctionDeclaration[], image?: ImagePart | null): Promise<GenerateContentResponse> {
  try {
    const textPart = { text: prompt };
    const parts: ({ text: string } | ImagePart)[] = [textPart];
    if (image) {
      parts.unshift(image);
    }

    const aiClient = getAiClient();
    const response = await aiClient.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: { parts },
      config: {
        systemInstruction: systemInstruction,
        tools: [{ functionDeclarations: tools }],
      },
    });
    return response;
  } catch (error) {
    console.error("Error in Gemini reasoning API call:", error);
    throw error;
  }
}

export async function generateImage(prompt: string): Promise<string | null> {
  try {
    const aiClient = getAiClient();
    const response = await aiClient.models.generateImages({
      model: 'imagen-4.0-generate-001',
      prompt: prompt,
      config: {
        numberOfImages: 1,
        outputMimeType: 'image/png',
        aspectRatio: '1:1',
      },
    });
    
    if (response.generatedImages && response.generatedImages.length > 0) {
      return response.generatedImages[0].image.imageBytes;
    }
    return null;
  } catch (error) {
    console.error("Error in Gemini image generation API call:", error);
    throw error;
  }
}