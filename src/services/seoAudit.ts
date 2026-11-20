import type { SeoAudit, SeoCheck, CheckStatus } from '@/types';

export interface AuditOptions {
  /** Primary keyword the page should rank for. */
  keyword?: string;
}

const text = (el: Element | null | undefined): string => (el?.textContent ?? '').replace(/\s+/g, ' ').trim();

const meta = (doc: Document, selector: string): string | null => {
  const el = doc.querySelector(selector);
  return el ? (el.getAttribute('content') ?? '').trim() : null;
};

const includesKeyword = (haystack: string, keyword: string): boolean =>
  keyword.length > 0 && haystack.toLowerCase().includes(keyword.toLowerCase());

const check = (id: string, label: string, weight: number, status: CheckStatus, detail: string): SeoCheck => ({
  id,
  label,
  weight,
  status,
  detail,
});

/**
 * Audits a full HTML document the way a crawler sees it.
 * Pure and deterministic: the same HTML always yields the same score.
 */
export function auditHtml(html: string, options: AuditOptions = {}): SeoAudit {
  const doc = new DOMParser().parseFromString(html, 'text/html');
  const keyword = (options.keyword ?? '').trim();
  const checks: SeoCheck[] = [];

  const title = text(doc.querySelector('title'));
  if (!title) checks.push(check('title', 'Title tag', 12, 'fail', 'No <title> found.'));
  else if (title.length < 30 || title.length > 60)
    checks.push(check('title', 'Title tag', 12, 'warn', `Title is ${title.length} characters; aim for 30 to 60.`));
  else checks.push(check('title', 'Title tag', 12, 'pass', `"${title}" (${title.length} characters).`));

  const description = meta(doc, 'meta[name="description"]');
  if (!description) checks.push(check('description', 'Meta description', 10, 'fail', 'No meta description.'));
  else if (description.length < 70 || description.length > 160)
    checks.push(check('description', 'Meta description', 10, 'warn', `${description.length} characters; aim for 70 to 160.`));
  else checks.push(check('description', 'Meta description', 10, 'pass', `${description.length} characters.`));

  const h1s = Array.from(doc.querySelectorAll('h1'));
  if (h1s.length === 0) checks.push(check('h1', 'Single H1', 10, 'fail', 'No H1 heading.'));
  else if (h1s.length > 1) checks.push(check('h1', 'Single H1', 10, 'warn', `${h1s.length} H1 headings; keep one.`));
  else checks.push(check('h1', 'Single H1', 10, 'pass', `"${text(h1s[0])}".`));

  const h2s = doc.querySelectorAll('h2').length;
  checks.push(
    h2s >= 2
      ? check('h2', 'Section headings', 5, 'pass', `${h2s} H2 headings structure the page.`)
      : check('h2', 'Section headings', 5, 'warn', `${h2s} H2 heading(s); add sections with H2s.`),
  );

  if (keyword) {
    const firstParagraph = text(doc.querySelector('main p, body p'));
    const h1Text = h1s.map(text).join(' ');
    const hits = [
      includesKeyword(title, keyword) ? 'title' : null,
      includesKeyword(description ?? '', keyword) ? 'description' : null,
      includesKeyword(h1Text, keyword) ? 'H1' : null,
      includesKeyword(firstParagraph, keyword) ? 'first paragraph' : null,
    ].filter(Boolean) as string[];
    const status: CheckStatus = hits.length >= 3 ? 'pass' : hits.length >= 1 ? 'warn' : 'fail';
    checks.push(
      check(
        'keyword',
        'Primary keyword placement',
        12,
        status,
        hits.length ? `"${keyword}" appears in: ${hits.join(', ')}.` : `"${keyword}" is missing from title, description, H1 and opening paragraph.`,
      ),
    );
  }

  const images = Array.from(doc.querySelectorAll('img'));
  const missingAlt = images.filter((img) => !(img.getAttribute('alt') ?? '').trim());
  if (images.length === 0) checks.push(check('alt', 'Image alt text', 6, 'warn', 'No images found.'));
  else if (missingAlt.length > 0)
    checks.push(check('alt', 'Image alt text', 6, 'fail', `${missingAlt.length} of ${images.length} images lack alt text.`));
  else checks.push(check('alt', 'Image alt text', 6, 'pass', `All ${images.length} images have alt text.`));

  const canonical = doc.querySelector('link[rel="canonical"]')?.getAttribute('href');
  checks.push(
    canonical
      ? check('canonical', 'Canonical URL', 5, 'pass', canonical)
      : check('canonical', 'Canonical URL', 5, 'warn', 'No canonical link; duplicates may split ranking.'),
  );

  const viewport = meta(doc, 'meta[name="viewport"]');
  checks.push(
    viewport
      ? check('viewport', 'Mobile viewport', 6, 'pass', 'Viewport meta present.')
      : check('viewport', 'Mobile viewport', 6, 'fail', 'No viewport meta; page is not mobile friendly.'),
  );

  const lang = doc.documentElement.getAttribute('lang');
  checks.push(
    lang
      ? check('lang', 'Language declared', 3, 'pass', `lang="${lang}".`)
      : check('lang', 'Language declared', 3, 'warn', 'No lang attribute on <html>.'),
  );

  const ogTitle = meta(doc, 'meta[property="og:title"]');
  const ogDesc = meta(doc, 'meta[property="og:description"]');
  const ogImage = meta(doc, 'meta[property="og:image"]');
  const ogCount = [ogTitle, ogDesc, ogImage].filter(Boolean).length;
  checks.push(
    ogCount === 3
      ? check('og', 'Social sharing tags', 6, 'pass', 'Open Graph title, description and image set.')
      : ogCount > 0
        ? check('og', 'Social sharing tags', 6, 'warn', `${ogCount} of 3 Open Graph tags set.`)
        : check('og', 'Social sharing tags', 6, 'fail', 'No Open Graph tags; links will unfurl poorly.'),
  );

  const ldScripts = Array.from(doc.querySelectorAll('script[type="application/ld+json"]'));
  let ldValid = 0;
  for (const s of ldScripts) {
    try {
      const parsed = JSON.parse(s.textContent ?? '');
      if (parsed && (parsed['@type'] || parsed['@graph'])) ldValid += 1;
    } catch {
      /* invalid JSON-LD is counted as missing */
    }
  }
  checks.push(
    ldValid > 0
      ? check('schema', 'Structured data', 8, 'pass', `${ldValid} valid JSON-LD block(s).`)
      : ldScripts.length > 0
        ? check('schema', 'Structured data', 8, 'warn', 'JSON-LD present but not valid JSON.')
        : check('schema', 'Structured data', 8, 'fail', 'No JSON-LD structured data.'),
  );

  const bodyText = text(doc.body);
  const wordCount = bodyText ? bodyText.split(/\s+/).length : 0;
  checks.push(
    wordCount >= 300
      ? check('words', 'Content depth', 8, 'pass', `${wordCount} words.`)
      : wordCount >= 120
        ? check('words', 'Content depth', 8, 'warn', `${wordCount} words; aim for 300 or more.`)
        : check('words', 'Content depth', 8, 'fail', `${wordCount} words; the page is thin.`),
  );

  const links = Array.from(doc.querySelectorAll('a[href]'));
  const emptyLinks = links.filter((a) => !text(a) && !a.querySelector('img[alt]'));
  checks.push(
    links.length === 0
      ? check('links', 'Links', 4, 'warn', 'No links on the page.')
      : emptyLinks.length > 0
        ? check('links', 'Links', 4, 'warn', `${emptyLinks.length} link(s) have no accessible text.`)
        : check('links', 'Links', 4, 'pass', `${links.length} links with text.`),
  );

  const faqHeadings = Array.from(doc.querySelectorAll('h2, h3')).filter((h) => /faq|questions/i.test(text(h)));
  checks.push(
    faqHeadings.length > 0
      ? check('faq', 'FAQ section', 5, 'pass', 'FAQ content can win rich results.')
      : check('faq', 'FAQ section', 5, 'warn', 'No FAQ section; questions capture long tail searches.'),
  );

  const total = checks.reduce((sum, c) => sum + c.weight, 0);
  const earned = checks.reduce((sum, c) => sum + (c.status === 'pass' ? c.weight : c.status === 'warn' ? c.weight / 2 : 0), 0);
  const score = total === 0 ? 0 : Math.round((earned / total) * 100);

  return { score, checks, wordCount };
}

/** Ranks the audit's open items by weight so the panel shows the biggest wins first. */
export function topFixes(audit: SeoAudit, limit = 5): SeoCheck[] {
  return audit.checks
    .filter((c) => c.status !== 'pass')
    .sort((a, b) => (b.status === 'fail' ? b.weight * 2 : b.weight) - (a.status === 'fail' ? a.weight * 2 : a.weight))
    .slice(0, limit);
}
