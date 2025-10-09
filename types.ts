import React from 'react';

export enum Author {
  USER = 'user',
  AGENT = 'agent',
}

export interface Message {
  author: Author;
  text: string;
  imageUrl?: string;
}

export interface Image {
  id: string;
  url: string;
  prompt: string;
}

export type DesignStep = 'task' | 'inspiration' | 'audience' | 'quality' | 'budget';

export interface Agent {
  id:string;
  name: string;
  description: string;
  systemInstruction: string;
  initialMessage: string;
  icon: React.FC;
  questions: Record<DesignStep, string>;
}

export interface Conversation {
  messages: Message[];
  images: Image[];
  currentStep: number;
  designBrief: Partial<Record<DesignStep, string>>;
  isAwaitingCollaborationChoice: boolean;
}

export type Conversations = Record<string, Conversation>;

export interface ImagePart {
  inlineData: {
      mimeType: string;
      data: string;
  };
}