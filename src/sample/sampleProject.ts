import type { Project } from '@/types';

const svgUrl = (svg: string): string => `data:image/svg+xml;base64,${btoa(svg)}`;

const logoSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256"><rect width="256" height="256" rx="56" fill="#0f172a"/><circle cx="128" cy="128" r="70" fill="none" stroke="#22d3ee" stroke-width="18" stroke-dasharray="330 110" stroke-linecap="round" transform="rotate(120 128 128)"/><circle cx="128" cy="128" r="26" fill="#f59e0b"/><circle cx="186" cy="70" r="14" fill="#a78bfa"/></svg>`;

const heroSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1280 720"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#0f172a"/><stop offset="1" stop-color="#164e63"/></linearGradient><radialGradient id="s" cx="0.7" cy="0.3" r="0.6"><stop offset="0" stop-color="#22d3ee" stop-opacity="0.9"/><stop offset="1" stop-color="#22d3ee" stop-opacity="0"/></radialGradient></defs><rect width="1280" height="720" fill="url(#g)"/><circle cx="900" cy="220" r="320" fill="url(#s)"/><g stroke="#f59e0b" stroke-width="6" fill="none" stroke-linecap="round"><path d="M120 560 C 300 420, 420 640, 600 480 S 900 360, 1160 420"/><path d="M160 620 C 340 500, 460 700, 640 560 S 940 440, 1180 500" opacity="0.5"/></g><g fill="#a78bfa"><circle cx="600" cy="480" r="16"/><circle cx="1160" cy="420" r="12"/><circle cx="120" cy="560" r="10"/></g><g fill="#e2e8f0" opacity="0.9"><rect x="140" y="140" width="360" height="22" rx="11"/><rect x="140" y="184" width="280" height="22" rx="11" opacity="0.6"/><rect x="140" y="228" width="320" height="22" rx="11" opacity="0.4"/></g></svg>`;

const conceptSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 600"><rect width="800" height="600" fill="#1e293b"/><rect x="60" y="60" width="680" height="480" rx="24" fill="#0f172a" stroke="#22d3ee" stroke-width="4"/><rect x="100" y="110" width="260" height="30" rx="15" fill="#e2e8f0"/><rect x="100" y="160" width="400" height="18" rx="9" fill="#94a3b8"/><rect x="100" y="230" width="180" height="56" rx="28" fill="#f59e0b"/><rect x="420" y="110" width="280" height="200" rx="18" fill="#164e63"/><circle cx="560" cy="210" r="50" fill="#a78bfa"/><rect x="100" y="340" width="600" height="150" rx="18" fill="#1e293b"/><rect x="130" y="370" width="160" height="90" rx="12" fill="#334155"/><rect x="320" y="370" width="160" height="90" rx="12" fill="#334155"/><rect x="510" y="370" width="160" height="90" rx="12" fill="#334155"/></svg>`;

const now = Date.now();

export const SAMPLE_PROJECT_ID = 'sample-tidal';

export const sampleProject: Project = {
  id: SAMPLE_PROJECT_ID,
  isSample: true,
  createdAt: now - 86_400_000,
  updatedAt: now - 3_600_000,
  brief: {
    name: 'Tidal',
    description: 'A focus timer that syncs a remote team\'s deep-work blocks so nobody gets interrupted and everybody knows when to reach out.',
    audience: 'Remote product teams of 5 to 50 people, mostly engineers and designers who hate meeting creep.',
    style: 'Calm, oceanic, precise. Linear and Arc as references. Deep navy with electric cyan, one warm accent.',
    qualities: 'trustworthy, calm, modern, a little playful',
    scope: 'launch ready',
    websiteUrl: 'https://tidal.example.com',
  },
  brand: {
    tagline: 'Deep work, in sync.',
    positioning: 'Tidal is the shared focus timer for remote teams. It turns individual deep-work blocks into team-wide quiet hours, so interruptions stop and shipping speeds up.',
    voice: ['calm', 'precise', 'warm', 'direct'],
    palette: { primary: '#0891b2', secondary: '#7c3aed', accent: '#f59e0b', background: '#0b1326', surface: '#13203a', text: '#e2e8f0' },
    fonts: { heading: 'Space Grotesk', body: 'Inter' },
    logoPrompt: 'A minimal circular logo mark of a tide ring, cyan arc with a small amber centre dot, flat vector, deep navy background.',
    heroPrompt: 'Abstract calm ocean tide lines flowing across a deep navy gradient with a glowing cyan sun, geometric and precise, no people.',
    logoAssetId: 'sample-logo',
    heroAssetId: 'sample-hero',
  },
  page: {
    sections: [
      {
        id: 'hero-sample',
        type: 'hero',
        heading: 'Deep work, in sync with your whole team',
        subheading: 'Tidal turns everyone\'s focus blocks into shared quiet hours. Fewer interruptions, faster shipping, calmer days.',
        ctaLabel: 'Start a free team',
        ctaHref: '#cta',
      },
      {
        id: 'features-sample',
        type: 'features',
        heading: 'Focus that the whole team can see',
        subheading: 'Four things Tidal does that a solo timer never could.',
        items: [
          { title: 'Team tides', text: 'See when teammates are heads-down and when they surface, without asking.' },
          { title: 'Quiet hours that stick', text: 'Tidal silences Slack, Teams and calendar invites during a block, automatically.' },
          { title: 'Ask-later queue', text: 'Questions wait in a queue and land the moment someone comes up for air.' },
          { title: 'Weekly focus report', text: 'One number per person, one per team. No surveillance, just rhythm.' },
        ],
      },
      {
        id: 'how-sample',
        type: 'how',
        heading: 'How Tidal works',
        items: [
          { title: 'Set your tide', text: 'Pick the blocks you want protected. Tidal suggests ones that overlap with your team.' },
          { title: 'Go deep', text: 'Start a block. Notifications pause and your status updates everywhere.' },
          { title: 'Surface together', text: 'Blocks end, the queue opens, and the team syncs in minutes instead of hours.' },
        ],
      },
      {
        id: 'proof-sample',
        type: 'proof',
        heading: 'Teams that ship in rhythm',
        items: [
          { title: 'Priya, Engineering Lead (sample)', text: 'Our afternoon interruptions dropped by half in the first week. The ask-later queue is the feature I did not know I needed.' },
          { title: 'Mateo, Product Designer (sample)', text: 'I finally get three uninterrupted hours a day, and nobody thinks I am ignoring them.' },
          { title: 'Sam, Founder (sample)', text: 'Tidal replaced two status meetings. The team feels calmer and we ship more.' },
        ],
      },
      {
        id: 'faq-sample',
        type: 'faq',
        heading: 'Frequently asked questions',
        items: [
          { title: 'Does Tidal track what I am working on?', text: 'No. Tidal only knows that a block is active, never what you do inside it.' },
          { title: 'Which tools does it silence?', text: 'Slack, Microsoft Teams, Google Calendar and Outlook today, with more on the roadmap.' },
          { title: 'Can I use it alone?', text: 'Yes. Solo mode is free forever. Team sync starts on the Team plan.' },
          { title: 'What happens in an emergency?', text: 'Anyone can break through a block with an urgent ping, and the team sees it was urgent.' },
        ],
      },
      {
        id: 'cta',
        type: 'cta',
        heading: 'Give your team its focus back',
        body: 'Free for solo use. Team plans from a few dollars per seat. Set up in two minutes.',
        ctaLabel: 'Start a free team',
        ctaHref: 'https://tidal.example.com/signup',
      },
    ],
  },
  seo: {
    primaryKeyword: 'team focus timer',
    secondaryKeywords: ['deep work app for remote teams', 'shared quiet hours', 'reduce slack interruptions', 'focus time for engineers', 'pomodoro for teams', 'async team productivity'],
    title: 'Tidal: Team Focus Timer for Remote Deep Work',
    metaDescription: 'Tidal is the team focus timer that turns individual deep work into shared quiet hours. Fewer interruptions, faster shipping. Free for solo use.',
    slug: 'team-focus-timer',
    h1: 'Deep work, in sync with your whole team',
    canonicalUrl: 'https://tidal.example.com/team-focus-timer',
    ogTitle: 'Tidal: deep work, in sync',
    ogDescription: 'The team focus timer that turns focus blocks into shared quiet hours.',
    schemaType: 'SoftwareApplication',
    faq: [
      { question: 'What is a team focus timer?', answer: 'A team focus timer coordinates deep-work blocks across a group so that quiet hours overlap and interruptions drop for everyone at once.' },
      { question: 'Does Tidal work with Slack?', answer: 'Yes. Tidal sets your Slack status and pauses notifications during a focus block, then releases queued messages when the block ends.' },
      { question: 'Is Tidal free?', answer: 'Solo mode is free forever. Team sync, the ask-later queue and reports are on the Team plan.' },
      { question: 'How is this different from a Pomodoro app?', answer: 'Pomodoro apps time one person. Tidal syncs a team, silences tools and queues questions, so focus is protected socially as well as individually.' },
    ],
    contentIdeas: [
      'The real cost of a Slack interruption: a calculator for engineering teams',
      'Quiet hours playbook: how five remote teams run deep-work blocks',
      'Pomodoro vs team focus timers: what changes when the whole team syncs',
      'Async-first standups that replace the morning meeting',
    ],
  },
  assets: [
    { id: 'sample-logo', url: svgUrl(logoSvg), prompt: 'Tide ring logo mark, cyan arc with amber centre, flat vector (sample)', kind: 'logo', createdAt: now - 80_000_000, saved: true },
    { id: 'sample-hero', url: svgUrl(heroSvg), prompt: 'Calm tide lines over a navy gradient with a cyan glow (sample)', kind: 'hero', createdAt: now - 79_000_000, saved: true },
    { id: 'sample-concept', url: svgUrl(conceptSvg), prompt: 'Dashboard concept: team tides timeline with ask-later queue (sample)', kind: 'concept', createdAt: now - 70_000_000, saved: false },
  ],
  conversations: {},
  pipeline: [
    { id: 'brand', label: 'Brand strategy', status: 'done', detail: 'Deep work, in sync.' },
    { id: 'page', label: 'Landing page copy', status: 'done', detail: '6 sections' },
    { id: 'seo', label: 'SEO cruise control', status: 'done', detail: 'team focus timer' },
    { id: 'logo', label: 'Logo concept', status: 'done' },
    { id: 'hero', label: 'Hero visual', status: 'done' },
  ],
};
