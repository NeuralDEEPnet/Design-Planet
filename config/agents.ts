import React from 'react';
import { Agent } from '../types';
import { PlanetIcon } from '../components/icons/PlanetIcon';
import { LogoIcon } from '../components/icons/LogoIcon';
import { IllustrationIcon } from '../components/icons/IllustrationIcon';
import { UIIcon } from '../components/icons/UIIcon';

const creativeDirectorInstruction = `You are a world-class Creative Director AI. You have been given a design brief with five key areas: Task, Inspiration, Audience, Quality, and Budget.
Your job is to synthesize this information into a single, highly-detailed, and masterful prompt for an AI image generation model.

**Collaboration**: You can also consult other agents for their expertise using the 'consultAgent' function. This is useful for getting a second opinion or refining complex ideas before committing to generation. For example, if designing a website logo, you might consult the 'logo-labyrinth' agent for advice on symbolism.

When you have all the information you need (either initially or after consultation), you MUST call the 'generateImage' function with the final, synthesized prompt. First, briefly explain your creative direction in one or two sentences.`;

export const agents: Agent[] = [
  {
    id: 'design-planet',
    name: 'Design Planet',
    description: 'A generalist design agent capable of a wide range of creative tasks, from simple illustrations to complex scenes.',
    systemInstruction: creativeDirectorInstruction,
    initialMessage: "Hello! I'm your general AI Design Agent. To start, please describe the main task or subject for your design.",
    icon: PlanetIcon,
    questions: {
      task: "To start, please describe the main task or subject for your design.",
      inspiration: "Great. What style are you looking for? Mention any specific artists, aesthetics, or visual themes for inspiration.",
      audience: "Understood. Who is the primary audience for this design? (e.g., children, tech professionals, general public)",
      quality: "Helpful. What are the key qualities it should have? (e.g., realistic, vibrant, minimalist, professional, playful)",
      budget: "Almost there. Finally, what's the conceptual budget? This helps me understand the scale. (e.g., 'quick sketch', 'polished marketing asset', 'masterpiece')",
    }
  },
  {
    id: 'logo-labyrinth',
    name: 'Logo Labyrinth',
    description: 'A specialist in logo design and brand identity. Describe your brand, and it will generate the perfect symbol.',
    systemInstruction: creativeDirectorInstruction,
    initialMessage: "Welcome to the Logo Labyrinth. To begin, what is the name and primary task of the brand this logo is for?",
    icon: LogoIcon,
    questions: {
      task: "What is the name and primary task of the brand this logo is for?",
      inspiration: "What other brands or styles do you draw inspiration from? (e.g., Nike's simplicity, Apple's modernism)",
      audience: "Who is your target audience or customer base?",
      quality: "What qualities should the logo embody? (e.g., 'trustworthy', 'innovative', 'playful', 'luxurious')",
      budget: "What is the conceptual scale of this logo? (e.g., 'simple icon', 'logotype with icon', 'full brand emblem')",
    }
  },
  {
    id: 'illustration-nebula',
    name: 'Illustration Nebula',
    description: 'A master illustrator for creating concept art, character designs, and detailed scenes.',
    systemInstruction: creativeDirectorInstruction,
    initialMessage: "Greetings from the Illustration Nebula. Let's begin our masterpiece. What is the central subject or story of your illustration?",
    icon: IllustrationIcon,
    questions: {
      task: "What is the central subject or story of your illustration?",
      inspiration: "Which artists or art styles inspire this piece? (e.g., 'Studio Ghibli', 'steampunk', 'Art Deco', 'cinematic concept art')",
      audience: "Who will be viewing this illustration? (e.g., 'gamers', 'art collectors', 'book readers')",
      quality: "What is the desired mood and quality? (e.g., 'epic and dramatic lighting', 'whimsical and colorful', 'dark and moody')",
      budget: "What is the intended scope? (e.g., 'character sketch', 'detailed scene with background', 'full splash art')",
    }
  },
  {
    id: 'ui-ux-universe',
    name: 'UI/UX Universe',
    description: 'A UI/UX expert that can generate mockups and design concepts for websites and mobile applications.',
    systemInstruction: creativeDirectorInstruction,
    initialMessage: "I am the architect of the UI/UX Universe. What is the primary task of the screen you want to design? (e.g., 'user login', 'product dashboard', 'settings page')",
    icon: UIIcon,
    questions: {
      task: "What is the primary task of the screen you want to design? (e.g., 'user login', 'product dashboard', 'settings page')",
      inspiration: "Are there any apps or websites whose design you admire?",
      audience: "Who are the target users for this interface?",
      quality: "What should the look and feel be? (e.g., 'clean and minimalist', 'dark mode', 'neumorphic', 'data-heavy')",
      budget: "What is the fidelity of this mockup? (e.g., 'low-fidelity wireframe', 'high-fidelity visual concept')",
    }
  }
];