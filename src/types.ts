import type React from 'react';

/** Who wrote a chat message. */
export type Author = 'user' | 'agent' | 'system';

export interface Message {
  id: string;
  author: Author;
  text: string;
  imageUrl?: string;
  /** Agent that spoke, when a consultation relays another agent's voice. */
  via?: string;
  createdAt: number;
}

/** The one intake form every project starts from. Replaces Design Planet's five chat steps. */
export interface Brief {
  name: string;
  description: string;
  audience: string;
  style: string;
  qualities: string;
  scope: 'quick concept' | 'launch ready' | 'full campaign';
  /** Optional inspiration image (data URL). */
  inspirationImage?: string;
  /** Optional existing site URL, used for SEO context only. */
  websiteUrl?: string;
}

export interface Palette {
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  surface: string;
  text: string;
}

export interface Brand {
  tagline: string;
  positioning: string;
  voice: string[];
  palette: Palette;
  fonts: { heading: string; body: string };
  logoPrompt: string;
  heroPrompt: string;
  logoAssetId?: string;
  heroAssetId?: string;
}

export type SectionType = 'hero' | 'features' | 'how' | 'proof' | 'faq' | 'cta';

export interface SectionItem {
  title: string;
  text: string;
}

export interface PageSection {
  id: string;
  type: SectionType;
  heading: string;
  subheading?: string;
  body?: string;
  items?: SectionItem[];
  ctaLabel?: string;
  ctaHref?: string;
}

export interface LandingPage {
  sections: PageSection[];
}

export interface SeoPlan {
  primaryKeyword: string;
  secondaryKeywords: string[];
  title: string;
  metaDescription: string;
  slug: string;
  h1: string;
  canonicalUrl: string;
  ogTitle: string;
  ogDescription: string;
  schemaType: 'SoftwareApplication' | 'Product' | 'Organization' | 'WebSite' | 'Service';
  faq: { question: string; answer: string }[];
  contentIdeas: string[];
}

export type CheckStatus = 'pass' | 'warn' | 'fail';

export interface SeoCheck {
  id: string;
  label: string;
  status: CheckStatus;
  detail: string;
  /** Points lost when not passing; used to weight the score. */
  weight: number;
}

export interface SeoAudit {
  score: number;
  checks: SeoCheck[];
  wordCount: number;
}

export type AssetKind = 'logo' | 'hero' | 'illustration' | 'edit' | 'concept';

export interface Asset {
  id: string;
  url: string;
  prompt: string;
  kind: AssetKind;
  createdAt: number;
  saved: boolean;
}

export type StepStatus = 'pending' | 'running' | 'done' | 'failed' | 'skipped';

export interface PipelineStep {
  id: 'brand' | 'page' | 'seo' | 'logo' | 'hero';
  label: string;
  status: StepStatus;
  detail?: string;
}

export interface Project {
  id: string;
  createdAt: number;
  updatedAt: number;
  brief: Brief;
  brand?: Brand;
  page?: LandingPage;
  seo?: SeoPlan;
  assets: Asset[];
  conversations: Record<string, Message[]>;
  pipeline: PipelineStep[];
  isSample?: boolean;
}

export interface AgentDef {
  id: string;
  name: string;
  planet: string;
  description: string;
  systemInstruction: string;
  greeting: string;
  icon: React.FC<{ className?: string }>;
  /** Tools this agent may call, by name. */
  tools: ToolName[];
}

export type ToolName = 'generateImage' | 'editImage' | 'consultAgent' | 'updateBrand' | 'updateSection' | 'updateSeo';

export interface ImagePart {
  inlineData: { mimeType: string; data: string };
}

export type Theme = 'dark' | 'light';
