import JSZip from 'jszip';
import type { Project, PageSection, Brand, SeoPlan, Asset } from '@/types';
import { dataUrlToPart, slugify } from '@/lib/id';

const esc = (value: string | undefined | null): string =>
  String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

const safeHref = (href: string | undefined): string => {
  const value = (href ?? '').trim();
  if (!value) return '#';
  if (/^(https?:|mailto:|#|\/)/i.test(value)) return value;
  return '#';
};

const fontStack = (name: string): string => `'${name.replace(/'/g, '')}', system-ui, sans-serif`;

const fontsLink = (brand: Brand): string => {
  const families = Array.from(new Set([brand.fonts.heading, brand.fonts.body]))
    .map((f) => `family=${encodeURIComponent(f).replace(/%20/g, '+')}:wght@400;600;700`)
    .join('&');
  return `<link rel="preconnect" href="https://fonts.googleapis.com"><link href="https://fonts.googleapis.com/css2?${families}&display=swap" rel="stylesheet">`;
};

const findAsset = (project: Project, id?: string): Asset | undefined => project.assets.find((a) => a.id === id);

const renderItems = (items: SectionItem[] | undefined, cls: string): string =>
  (items ?? [])
    .map((item) => `<div class="${cls}"><h3>${esc(item.title)}</h3><p>${esc(item.text)}</p></div>`)
    .join('');

type SectionItem = NonNullable<PageSection['items']>[number];

function renderSection(section: PageSection, project: Project, heroImg?: Asset, logoImg?: Asset): string {
  const cta = section.ctaLabel
    ? `<a class="btn" href="${esc(safeHref(section.ctaHref))}">${esc(section.ctaLabel)}</a>`
    : '';
  switch (section.type) {
    case 'hero':
      return `<section class="hero" id="${esc(section.id)}">
  <div class="hero-copy">
    ${logoImg ? `<img class="logo" src="${logoImg.url}" alt="${esc(project.brief.name)} logo" width="72" height="72">` : ''}
    <h1>${esc(section.heading)}</h1>
    ${section.subheading ? `<p class="lead">${esc(section.subheading)}</p>` : ''}
    ${section.body ? `<p>${esc(section.body)}</p>` : ''}
    ${cta}
  </div>
  ${heroImg ? `<img class="hero-img" src="${heroImg.url}" alt="${esc(project.brand?.heroPrompt ?? section.heading)}">` : ''}
</section>`;
    case 'features':
      return `<section id="${esc(section.id)}"><h2>${esc(section.heading)}</h2>${section.subheading ? `<p class="lead">${esc(section.subheading)}</p>` : ''}<div class="grid">${renderItems(section.items, 'card')}</div></section>`;
    case 'how':
      return `<section id="${esc(section.id)}"><h2>${esc(section.heading)}</h2>${section.subheading ? `<p class="lead">${esc(section.subheading)}</p>` : ''}<ol class="steps">${(section.items ?? []).map((i) => `<li><h3>${esc(i.title)}</h3><p>${esc(i.text)}</p></li>`).join('')}</ol></section>`;
    case 'proof':
      return `<section id="${esc(section.id)}"><h2>${esc(section.heading)}</h2>${section.subheading ? `<p class="lead">${esc(section.subheading)}</p>` : ''}<div class="grid">${(section.items ?? []).map((i) => `<blockquote class="card"><p>“${esc(i.text)}”</p><cite>${esc(i.title)}</cite></blockquote>`).join('')}</div></section>`;
    case 'faq':
      return `<section id="${esc(section.id)}"><h2>${esc(section.heading)}</h2>${(section.items ?? []).map((i) => `<details><summary>${esc(i.title)}</summary><p>${esc(i.text)}</p></details>`).join('')}</section>`;
    case 'cta':
      return `<section class="cta" id="${esc(section.id)}"><h2>${esc(section.heading)}</h2>${section.body ? `<p class="lead">${esc(section.body)}</p>` : ''}${cta}</section>`;
    default:
      return '';
  }
}

function jsonLd(project: Project, seo: SeoPlan, brand: Brand | undefined, heroImg?: Asset): string {
  const main: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': seo.schemaType,
    name: project.brief.name,
    description: seo.metaDescription,
    url: seo.canonicalUrl,
  };
  if (brand?.tagline) main.slogan = brand.tagline;
  if (heroImg) main.image = heroImg.url;
  if (seo.schemaType === 'SoftwareApplication') {
    main.applicationCategory = 'BusinessApplication';
    main.operatingSystem = 'Web';
  }
  const graph: unknown[] = [main];
  if (seo.faq.length > 0) {
    graph.push({
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: seo.faq.map((f) => ({
        '@type': 'Question',
        name: f.question,
        acceptedAnswer: { '@type': 'Answer', text: f.answer },
      })),
    });
  }
  // Escape "</" so the JSON can never close the script tag early.
  return graph.map((g) => `<script type="application/ld+json">${JSON.stringify(g).replace(/<\//g, '<\\/')}</script>`).join('\n');
}

function css(brand: Brand): string {
  const p = brand.palette;
  return `
:root{--primary:${p.primary};--secondary:${p.secondary};--accent:${p.accent};--bg:${p.background};--surface:${p.surface};--text:${p.text}}
*{box-sizing:border-box}html{scroll-behavior:smooth}
body{margin:0;background:var(--bg);color:var(--text);font-family:${fontStack(brand.fonts.body)};line-height:1.6}
h1,h2,h3{font-family:${fontStack(brand.fonts.heading)};line-height:1.15;margin:0 0 .5em}
h1{font-size:clamp(2rem,5vw,3.5rem)}h2{font-size:clamp(1.5rem,3.2vw,2.25rem)}h3{font-size:1.1rem}
main{max-width:1100px;margin:0 auto;padding:0 20px}
section{padding:64px 0;border-bottom:1px solid color-mix(in srgb,var(--text) 10%,transparent)}
section:last-of-type{border-bottom:0}
.lead{font-size:1.15rem;opacity:.85;max-width:60ch}
.hero{display:grid;grid-template-columns:1.1fr 1fr;gap:40px;align-items:center;padding-top:80px}
.hero-img{width:100%;height:auto;border-radius:20px;box-shadow:0 30px 60px -20px color-mix(in srgb,var(--primary) 45%,transparent)}
.logo{border-radius:16px;margin-bottom:20px;display:block}
.btn{display:inline-block;margin-top:20px;padding:14px 28px;border-radius:999px;background:var(--primary);color:#fff;text-decoration:none;font-weight:600;transition:transform .15s}
.btn:hover{transform:translateY(-2px);background:var(--accent)}
.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:20px;margin-top:28px}
.card{background:var(--surface);padding:24px;border-radius:16px;border:1px solid color-mix(in srgb,var(--text) 8%,transparent)}
.card p{margin:0;opacity:.85}
blockquote.card{margin:0}blockquote cite{display:block;margin-top:12px;font-style:normal;font-weight:600;color:var(--secondary)}
.steps{counter-reset:step;list-style:none;padding:0;margin:28px 0 0;display:grid;gap:20px;grid-template-columns:repeat(auto-fit,minmax(220px,1fr))}
.steps li{counter-increment:step;background:var(--surface);padding:24px;border-radius:16px;position:relative}
.steps li::before{content:counter(step);position:absolute;top:-14px;left:20px;background:var(--accent);color:#fff;width:28px;height:28px;border-radius:50%;display:grid;place-items:center;font-weight:700;font-size:.9rem}
details{background:var(--surface);border-radius:12px;padding:16px 20px;margin-top:12px}
summary{cursor:pointer;font-weight:600}details p{margin:10px 0 0;opacity:.85}
.cta{text-align:center;background:linear-gradient(135deg,color-mix(in srgb,var(--primary) 18%,var(--bg)),color-mix(in srgb,var(--accent) 18%,var(--bg)));border-radius:24px;padding:72px 24px;margin:48px 0}
.cta .lead{margin-inline:auto}
footer{text-align:center;padding:32px 20px;opacity:.6;font-size:.9rem}
@media (max-width:760px){.hero{grid-template-columns:1fr;padding-top:48px}}`;
}

/**
 * Renders a standalone, SEO-complete landing page as a single HTML document.
 * Images are inlined as data URLs so the file works from anywhere.
 */
export function renderLandingHtml(project: Project): string {
  const { brief, brand, page, seo } = project;
  if (!brand || !page || !seo) {
    throw new Error('A brand, page and SEO plan are required to render the landing page.');
  }
  const heroImg = findAsset(project, brand.heroAssetId);
  const logoImg = findAsset(project, brand.logoAssetId);
  const sections = page.sections.map((s) => renderSection(s, project, heroImg, logoImg)).join('\n');
  const year = new Date().getFullYear();

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${esc(seo.title)}</title>
<meta name="description" content="${esc(seo.metaDescription)}">
<meta name="keywords" content="${esc([seo.primaryKeyword, ...seo.secondaryKeywords].join(', '))}">
<link rel="canonical" href="${esc(seo.canonicalUrl)}">
<meta property="og:type" content="website">
<meta property="og:title" content="${esc(seo.ogTitle)}">
<meta property="og:description" content="${esc(seo.ogDescription)}">
<meta property="og:url" content="${esc(seo.canonicalUrl)}">
${heroImg ? `<meta property="og:image" content="${heroImg.url}">` : ''}
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${esc(seo.ogTitle)}">
<meta name="twitter:description" content="${esc(seo.ogDescription)}">
<meta name="theme-color" content="${esc(brand.palette.primary)}">
${logoImg ? `<link rel="icon" href="${logoImg.url}">` : ''}
${fontsLink(brand)}
${jsonLd(project, seo, brand, heroImg)}
<style>${css(brand)}</style>
</head>
<body>
<main>
${sections}
</main>
<footer>© ${year} ${esc(brief.name)}. ${esc(brand.tagline)}</footer>
</body>
</html>`;
}

/** Markdown summary of the SEO plan for hand-off to writers or a CMS. */
export function renderSeoPlanMarkdown(project: Project): string {
  const seo = project.seo;
  if (!seo) return '# SEO plan\n\nNo SEO plan generated yet.\n';
  const lines = [
    `# SEO plan for ${project.brief.name}`,
    '',
    `**Primary keyword:** ${seo.primaryKeyword}`,
    `**Secondary keywords:** ${seo.secondaryKeywords.join(', ')}`,
    '',
    '## On-page',
    '',
    `- Title: ${seo.title}`,
    `- Meta description: ${seo.metaDescription}`,
    `- H1: ${seo.h1}`,
    `- Slug: /${seo.slug}`,
    `- Canonical: ${seo.canonicalUrl}`,
    `- Schema type: ${seo.schemaType}`,
    '',
    '## FAQ',
    '',
    ...seo.faq.flatMap((f) => [`**${f.question}**`, '', f.answer, '']),
    '## Content ideas',
    '',
    ...seo.contentIdeas.map((c) => `- ${c}`),
    '',
  ];
  return lines.join('\n');
}

export interface KitFile {
  path: string;
  content: string | Uint8Array;
}

/** Lists every file that belongs in the launch kit, without zipping. Useful for tests. */
export function listKitFiles(project: Project): KitFile[] {
  const files: KitFile[] = [];
  files.push({ path: 'index.html', content: renderLandingHtml(project) });
  files.push({ path: 'seo-plan.md', content: renderSeoPlanMarkdown(project) });
  files.push({
    path: 'brand.json',
    content: JSON.stringify({ name: project.brief.name, brief: { ...project.brief, inspirationImage: undefined }, brand: project.brand, seo: project.seo }, null, 2),
  });
  for (const asset of project.assets) {
    const part = dataUrlToPart(asset.url);
    if (!part) continue;
    const ext = part.mimeType.includes('svg') ? 'svg' : part.mimeType.includes('jpeg') ? 'jpg' : part.mimeType.includes('webp') ? 'webp' : 'png';
    const bytes = Uint8Array.from(atob(part.data), (c) => c.charCodeAt(0));
    files.push({ path: `assets/${asset.kind}-${asset.id.slice(0, 8)}.${ext}`, content: bytes });
  }
  return files;
}

export async function buildKitZip(project: Project): Promise<Blob> {
  const zip = new JSZip();
  for (const file of listKitFiles(project)) zip.file(file.path, file.content);
  return zip.generateAsync({ type: 'blob' });
}

export const kitFileName = (project: Project): string => `${slugify(project.brief.name)}-launch-kit.zip`;

export function downloadBlob(blob: Blob, fileName: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
