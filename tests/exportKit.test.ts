import { describe, it, expect } from 'vitest';
import { renderLandingHtml, renderSeoPlanMarkdown, listKitFiles } from '@/services/exportKit';
import { auditHtml } from '@/services/seoAudit';
import { sampleProject } from '@/sample/sampleProject';

describe('renderLandingHtml', () => {
  const html = renderLandingHtml(sampleProject);

  it('produces a page that passes its own SEO audit at 90 or above', () => {
    const audit = auditHtml(html, { keyword: sampleProject.seo!.primaryKeyword });
    const failing = audit.checks.filter((c) => c.status === 'fail');
    expect(failing).toEqual([]);
    expect(audit.score).toBeGreaterThanOrEqual(90);
  });

  it('inlines the brand palette, fonts, metadata and both images', () => {
    expect(html).toContain('--primary:#0891b2');
    expect(html).toContain('Space+Grotesk');
    expect(html).toContain('<link rel="canonical" href="https://tidal.example.com/team-focus-timer">');
    expect(html).toContain('"@type":"FAQPage"');
    expect(html.match(/data:image\/svg\+xml;base64/g)?.length).toBeGreaterThanOrEqual(2);
  });

  it('escapes user content so it cannot inject markup', () => {
    const hostile = structuredClone(sampleProject);
    hostile.page!.sections[0].heading = '<script>alert(1)</script> & "quotes"';
    hostile.seo!.title = 'Title </title><script>x()</script>';
    hostile.seo!.faq[0].answer = 'Closing </script> tag inside JSON';
    hostile.page!.sections[0].ctaHref = 'javascript:alert(1)';
    const out = renderLandingHtml(hostile);
    expect(out).not.toContain('<script>alert(1)</script>');
    expect(out).toContain('&lt;script&gt;alert(1)&lt;/script&gt; &amp; &quot;quotes&quot;');
    expect(out).not.toContain('</title><script>');
    expect(out).toContain('<\\/script>');
    expect(out).not.toContain('href="javascript:');
  });

  it('throws when the project has no kit yet', () => {
    expect(() => renderLandingHtml({ ...sampleProject, brand: undefined })).toThrow(/brand, page and SEO plan/);
  });
});

describe('kit files', () => {
  it('lists the page, plan, brand json and every asset', () => {
    const files = listKitFiles(sampleProject);
    const paths = files.map((f) => f.path);
    expect(paths).toContain('index.html');
    expect(paths).toContain('seo-plan.md');
    expect(paths).toContain('brand.json');
    expect(paths.filter((p) => p.startsWith('assets/')).length).toBe(sampleProject.assets.length);
    const brand = JSON.parse(files.find((f) => f.path === 'brand.json')!.content as string);
    expect(brand.brief.inspirationImage).toBeUndefined();
  });

  it('writes a readable SEO plan', () => {
    const md = renderSeoPlanMarkdown(sampleProject);
    expect(md).toContain('# SEO plan for Tidal');
    expect(md).toContain('**Primary keyword:** team focus timer');
    expect(md).toContain('## FAQ');
  });
});
