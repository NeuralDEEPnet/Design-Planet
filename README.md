# AIrave Studio

**Brief in. Launch kit out.**

Describe a product once. A crew of AI design agents writes the brand, designs the logo and hero visual, builds a landing page and puts SEO on cruise control. Everything is editable in the browser, and everything exports as a ready-to-host kit.

AIrave Studio merges three earlier NeuralDEEPnet ideas into one product:

| Earlier idea | What it became |
| --- | --- |
| **Design Planet** (multi-agent design studio) | The crew: Design Planet, Logo Labyrinth, Illustration Nebula, UI/UX Universe, Segmentation Station. Agents consult each other and act on the project with tools. |
| **AIrave.Co UX** | The project workspace itself: one-screen brief, live landing page builder with device preview, section editor, assets, export. |
| **CruiseCotrolSEO** | Cruise Control: a sixth agent plus a deterministic SEO audit engine that scores the exported HTML and can audit any pasted page. |

## What you get from one brief

1. **Brand** – tagline, positioning, voice, accessible palette, Google Fonts pairing, logo and hero prompts.
2. **Page** – six conversion-focused sections (hero, features, how it works, social proof, FAQ, call to action) rendered live with the brand, editable field by field.
3. **SEO** – primary and secondary keywords, title and meta description with length guards, H1, slug, canonical, Open Graph, schema type, FAQ rich results, content ideas, and a 0–100 score computed on the real exported HTML.
4. **Assets** – logo and hero images from Imagen, plus anything the crew generates or edits later.
5. **Export** – a single standalone `index.html` with inlined images, JSON-LD and metadata, or a `.zip` launch kit with `index.html`, `seo-plan.md`, `brand.json` and every asset.

## The crew

| Agent | Role | Tools |
| --- | --- | --- |
| Design Planet | Creative Director | generate images, update brand, consult others |
| Logo Labyrinth | Brand identity | generate logo marks, update palette and fonts |
| Illustration Nebula | Visual storytelling | generate hero visuals and scenes |
| UI/UX Universe | Landing page | rewrite sections, generate UI concepts |
| Cruise Control | SEO autopilot | update the SEO plan and sections |
| Segmentation Station | Image editing | edit any asset with a text instruction |

Every agent sees the full project (brief, brand, page, SEO plan). When an agent calls a tool, the change lands in the other tabs immediately.

## Run it

```bash
npm install
npm run dev        # http://localhost:3000
```

Open **Settings** and paste a Gemini API key (from [aistudio.google.com](https://aistudio.google.com)). The key is stored only in your browser's localStorage and sent only to Google's Gemini API. Alternatively, copy `.env.example` to `.env.local` and set `VITE_GEMINI_API_KEY` to bake a key into the build.

Without a key you can still explore the built-in **Tidal** sample project, edit copy, audit any pasted HTML and export kits.

### Models

| Purpose | Model |
| --- | --- |
| Reasoning, copy, SEO, chat | `gemini-2.5-flash` |
| Logo and hero generation | `imagen-4.0-generate-001` |
| Image editing | `gemini-2.5-flash-image` |

## Build and test

```bash
npm run build      # type-check + production build to dist/
npm test           # vitest: audit engine, exporter, pipeline, studio orchestration
```

`dist/` is a static site. Host it anywhere.

## How it is built

- React 19, Vite 7, TypeScript, Tailwind CSS 4.
- `src/services/launchKit.ts` – the launch pipeline. Brand first, then page copy and SEO, then logo and hero in parallel. Image failures never block the kit.
- `src/services/studio.ts` – one chat turn with an agent: reply, tool calls, consultation follow-up.
- `src/services/seoAudit.ts` – pure, deterministic audit of an HTML document (title, meta, H1, keyword placement, alt text, canonical, viewport, Open Graph, JSON-LD, depth, links, FAQ).
- `src/services/exportKit.ts` – renders the standalone page and zips the kit. All user content is escaped.
- `src/services/gemini.ts` – the only file that talks to Google. Everything else depends on the `AiProvider` interface, so tests run with an in-memory fake.
- Projects persist in localStorage. When storage fills up, unsaved images are dropped first and the app tells you.

## Privacy

Briefs, generated copy and images go to Google's Gemini API under your key. Nothing else leaves the browser. The HTML audit runs entirely client-side.
