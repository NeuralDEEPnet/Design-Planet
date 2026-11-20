import { describe, it, expect } from 'vitest';
import { auditHtml, topFixes } from '@/services/seoAudit';

const good = `<!DOCTYPE html><html lang="en"><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width">
<title>Tidal: Team Focus Timer for Remote Deep Work</title>
<meta name="description" content="Tidal is the team focus timer that turns individual deep work into shared quiet hours. Fewer interruptions, faster shipping.">
<link rel="canonical" href="https://tidal.example.com/team-focus-timer">
<meta property="og:title" content="Tidal"><meta property="og:description" content="Deep work"><meta property="og:image" content="https://x/y.png">
<script type="application/ld+json">{"@type":"SoftwareApplication","name":"Tidal"}</script>
</head><body><main>
<h1>The team focus timer for remote teams</h1>
<p>${'team focus timer keeps everyone in sync. '.repeat(80)}</p>
<h2>Features</h2><h2>Frequently asked questions</h2>
<img src="a.png" alt="Hero"><a href="/signup">Sign up</a>
</main></body></html>`;

describe('auditHtml', () => {
  it('scores a well-formed page highly and passes the core checks', () => {
    const audit = auditHtml(good, { keyword: 'team focus timer' });
    expect(audit.score).toBeGreaterThanOrEqual(95);
    const byId = Object.fromEntries(audit.checks.map((c) => [c.id, c.status]));
    expect(byId.title).toBe('pass');
    expect(byId.description).toBe('pass');
    expect(byId.h1).toBe('pass');
    expect(byId.keyword).toBe('pass');
    expect(byId.schema).toBe('pass');
    expect(byId.og).toBe('pass');
    expect(byId.alt).toBe('pass');
    expect(audit.wordCount).toBeGreaterThan(300);
  });

  it('flags an empty page with failures and a low score', () => {
    const audit = auditHtml('<html><body><p>hi</p></body></html>', { keyword: 'anything' });
    expect(audit.score).toBeLessThan(25);
    const fails = audit.checks.filter((c) => c.status === 'fail').map((c) => c.id);
    expect(fails).toEqual(expect.arrayContaining(['title', 'description', 'h1', 'viewport', 'schema', 'keyword']));
  });

  it('warns on title length and multiple H1s', () => {
    const html = `<html><head><title>Short</title></head><body><h1>A</h1><h1>B</h1></body></html>`;
    const audit = auditHtml(html);
    const byId = Object.fromEntries(audit.checks.map((c) => [c.id, c]));
    expect(byId.title.status).toBe('warn');
    expect(byId.h1.status).toBe('warn');
    expect(byId.h1.detail).toContain('2 H1');
  });

  it('treats invalid JSON-LD as a warning, not a pass', () => {
    const html = `<html><head><script type="application/ld+json">{not json</script></head><body></body></html>`;
    const schema = auditHtml(html).checks.find((c) => c.id === 'schema');
    expect(schema?.status).toBe('warn');
  });

  it('is deterministic', () => {
    expect(auditHtml(good)).toEqual(auditHtml(good));
  });

  it('ranks failures ahead of warnings in topFixes', () => {
    const audit = auditHtml('<html><head><title>Short</title></head><body><h1>x</h1></body></html>');
    const fixes = topFixes(audit, 3);
    expect(fixes.length).toBe(3);
    expect(fixes[0].status).toBe('fail');
  });
});
