import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { Brief, Brand, LandingPage, SeoPlan, Message, Asset, PageSection, Theme, Project } from '@/types';
import { useProjects } from '@/hooks/useProjects';
import { loadApiKey, saveApiKey, loadTheme, saveTheme } from '@/services/storage';
import { createGeminiProvider } from '@/services/gemini';
import type { AiProvider } from '@/services/ai';
import { friendlyAiError } from '@/services/ai';
import { runLaunchPipeline, initialPipeline } from '@/services/launchKit';
import { runStudioTurn } from '@/services/studio';
import { uid } from '@/lib/id';
import { Sidebar } from '@/components/Sidebar';
import { SettingsModal } from '@/components/SettingsModal';
import { BriefForm } from '@/components/BriefForm';
import { PipelinePanel } from '@/components/PipelinePanel';
import { BrandPanel } from '@/components/BrandPanel';
import { PagePanel } from '@/components/PagePanel';
import { SeoPanel } from '@/components/SeoPanel';
import { AssetsPanel } from '@/components/AssetsPanel';
import { StudioChat } from '@/components/StudioChat';
import { Button, Badge, Modal } from '@/components/ui';
import { MenuIcon, StudioMark, RefreshIcon, SparkIcon } from '@/components/icons';
import { agents } from '@/config/agents';

type Tab = 'brief' | 'brand' | 'page' | 'seo' | 'studio' | 'assets';
const tabs: { id: Tab; label: string }[] = [
  { id: 'brief', label: 'Brief' },
  { id: 'brand', label: 'Brand' },
  { id: 'page', label: 'Page' },
  { id: 'seo', label: 'SEO' },
  { id: 'studio', label: 'Studio' },
  { id: 'assets', label: 'Assets' },
];

const envKey = (import.meta.env.VITE_GEMINI_API_KEY as string | undefined) ?? '';

export default function App() {
  const { projects, active, activeId, select, update, create, clone, remove, persistence } = useProjects();
  const [apiKey, setApiKey] = useState<string>(() => loadApiKey() || envKey);
  const [theme, setTheme] = useState<Theme>(loadTheme);
  const [tab, setTab] = useState<Tab>('brief');
  const [view, setView] = useState<'project' | 'new'>(activeId ? 'project' : 'new');
  const [showSettings, setShowSettings] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [launching, setLaunching] = useState(false);
  const [launchError, setLaunchError] = useState<string | null>(null);
  const [agentId, setAgentId] = useState(agents[0].id);
  const [chatBusy, setChatBusy] = useState(false);
  const [pendingImage, setPendingImage] = useState<string | undefined>();
  const [draft, setDraft] = useState<string | undefined>();
  const [confirmDelete, setConfirmDelete] = useState<Project | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const activeRef = useRef(active);
  activeRef.current = active;

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    saveTheme(theme);
  }, [theme]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 4000);
    return () => clearTimeout(t);
  }, [toast]);

  useEffect(() => {
    if (persistence !== 'full') setToast(persistence === 'trimmed' ? 'Browser storage is full: unsaved images were dropped from the saved copy. Download your kit to keep everything.' : 'Could not save to browser storage.');
  }, [persistence]);

  const ai: AiProvider | null = useMemo(() => {
    try {
      return apiKey ? createGeminiProvider(apiKey) : null;
    } catch {
      return null;
    }
  }, [apiKey]);
  const hasKey = Boolean(ai);

  const patch = useCallback(
    (fn: (p: Project) => Partial<Project>) => {
      const current = activeRef.current;
      if (current) update(current.id, fn);
    },
    [update],
  );

  const setBrand = useCallback((brand: Brand) => patch(() => ({ brand })), [patch]);
  /** Keeps the SEO H1 in sync when the hero heading is edited on the Page tab. */
  const setPage = useCallback(
    (page: LandingPage) =>
      patch((p) => {
        const hero = page.sections.find((s) => s.type === 'hero');
        const seo = p.seo && hero && hero.heading !== p.seo.h1 ? { ...p.seo, h1: hero.heading } : p.seo;
        return { page, seo };
      }),
    [patch],
  );

  /** Keeps the exported H1 and hero heading in sync when the SEO H1 changes. */
  const setSeoSynced = useCallback(
    (seo: SeoPlan) =>
      patch((p) => {
        const page = p.page && p.seo && seo.h1 !== p.seo.h1 ? { sections: p.page.sections.map((s) => (s.type === 'hero' ? { ...s, heading: seo.h1 } : s)) } : p.page;
        return { seo, page };
      }),
    [patch],
  );

  const launch = useCallback(
    async (projectId: string, brief: Brief) => {
      if (!ai) {
        setShowSettings(true);
        return;
      }
      setLaunching(true);
      setLaunchError(null);
      update(projectId, { brief, pipeline: initialPipeline() });
      setTab('brand');
      try {
        await runLaunchPipeline(brief, ai, {
          onStep: (pipeline) => update(projectId, { pipeline }),
          onBrand: (brand) => update(projectId, (p) => ({ brand: { ...brand, logoAssetId: brand.logoAssetId ?? p.brand?.logoAssetId, heroAssetId: brand.heroAssetId ?? p.brand?.heroAssetId } })),
          onPage: (page) => update(projectId, (p) => ({ page: p.seo ? { sections: page.sections.map((s) => (s.type === 'hero' ? { ...s, heading: p.seo!.h1 } : s)) } : page })),
          onSeo: (seo) => update(projectId, (p) => ({ seo, page: p.page ? { sections: p.page.sections.map((s) => (s.type === 'hero' ? { ...s, heading: seo.h1 } : s)) } : p.page })),
          onAsset: (asset) => update(projectId, (p) => ({ assets: [asset, ...p.assets] })),
        });
      } catch (error) {
        setLaunchError(friendlyAiError(error));
      } finally {
        setLaunching(false);
      }
    },
    [ai, update],
  );

  const onNewBrief = (brief: Brief) => {
    const project = create(brief);
    setView('project');
    setTab('brief');
    if (ai) void launch(project.id, brief);
  };

  const askAgent = (id: string, prompt: string) => {
    setAgentId(id);
    setDraft(prompt);
    setTab('studio');
  };

  const addMessage = (projectId: string, id: string, message: Message) =>
    update(projectId, (p) => ({ conversations: { ...p.conversations, [id]: [...(p.conversations[id] ?? []), message] } }));

  const sendChat = async (text: string) => {
    const project = activeRef.current;
    if (!project || !ai) return;
    const agent = agents.find((a) => a.id === agentId) ?? agents[0];
    const image = pendingImage;
    setPendingImage(undefined);
    setDraft(undefined);
    const history = project.conversations[agentId] ?? [];
    addMessage(project.id, agentId, { id: uid(), author: 'user', text, imageUrl: image, createdAt: Date.now() });
    setChatBusy(true);
    try {
      await runStudioTurn({
        ai,
        agent,
        project,
        history,
        prompt: text,
        imageDataUrl: image,
        emit: (m) => addMessage(project.id, agentId, m),
        effects: {
          addAsset: (asset: Asset) => update(project.id, (p) => ({ assets: [asset, ...p.assets] })),
          patchBrand: (b) => update(project.id, (p) => ({ brand: p.brand ? { ...p.brand, ...b } : undefined })),
          patchSection: (type: PageSection['type'], s) =>
            update(project.id, (p) => ({
              page: p.page ? { sections: p.page.sections.map((x) => (x.type === type ? { ...x, ...s } : x)) } : p.page,
              seo: p.seo && type === 'hero' && typeof s.heading === 'string' ? { ...p.seo, h1: s.heading } : p.seo,
            })),
          patchSeo: (s) => update(project.id, (p) => ({ seo: p.seo ? { ...p.seo, ...s } : p.seo })),
        },
      });
    } catch (error) {
      addMessage(project.id, agentId, { id: uid(), author: 'agent', text: friendlyAiError(error), createdAt: Date.now() });
    } finally {
      setChatBusy(false);
    }
  };

  const editAsset = (asset: Asset) => {
    setAgentId('segmentation-station');
    setPendingImage(asset.url);
    setDraft('');
    setTab('studio');
  };

  const kitReady = Boolean(active?.brand && active?.page && active?.seo);
  const pipelineVisible = active && (launching || launchError || active.pipeline.some((s) => s.status === 'running' || s.status === 'failed'));

  return (
    <div className="h-full flex bg-bg text-fg">
      <Sidebar
        projects={projects}
        activeId={view === 'project' ? activeId : null}
        onSelect={(id) => { select(id); setView('project'); setTab(projects.find((p) => p.id === id)?.brand ? 'brand' : 'brief'); setLaunchError(null); }}
        onNew={() => { setView('new'); setSidebarOpen(false); }}
        onDelete={(id) => setConfirmDelete(projects.find((p) => p.id === id) ?? null)}
        onSettings={() => setShowSettings(true)}
        theme={theme}
        onToggleTheme={() => setTheme((t) => (t === 'dark' ? 'light' : 'dark'))}
        hasKey={hasKey}
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />
      <main className="flex-1 flex flex-col min-w-0">
        <header className="h-14 shrink-0 border-b border-line bg-surface/80 backdrop-blur flex items-center gap-3 px-4">
          <button className="md:hidden p-2 -ml-2 text-muted" onClick={() => setSidebarOpen(true)} aria-label="Open projects">
            <MenuIcon className="w-5 h-5" />
          </button>
          {view === 'project' && active ? (
            <>
              <h1 className="font-display text-sm tracking-widest uppercase text-accent truncate">{active.brief.name}</h1>
              {active.isSample && <Badge tone="accent">Sample · edits are not saved</Badge>}
              {kitReady && !active.isSample && <Badge tone="good">Kit ready</Badge>}
              <nav className="ml-auto flex items-center gap-1 overflow-x-auto" aria-label="Project sections">
                {tabs.map((t) => (
                  <button key={t.id} onClick={() => setTab(t.id)} className={`px-3 py-1.5 rounded-lg text-sm whitespace-nowrap ${tab === t.id ? 'bg-accent/15 text-accent font-semibold' : 'text-muted hover:text-fg hover:bg-surface2'}`} aria-current={tab === t.id ? 'page' : undefined}>
                    {t.label}
                  </button>
                ))}
              </nav>
            </>
          ) : (
            <h1 className="font-display text-sm tracking-widest uppercase text-accent">New project</h1>
          )}
        </header>

        <div className="flex-1 overflow-y-auto p-4 md:p-6">
          {view === 'new' || !active ? (
            <div className="max-w-3xl mx-auto">
              <div className="flex items-start gap-4 mb-6">
                <StudioMark className="w-14 h-14 shrink-0" />
                <div>
                  <h2 className="text-2xl font-bold text-fg">Brief in. Launch kit out.</h2>
                  <p className="text-sm text-muted mt-1 max-w-xl">
                    Describe the product once. The crew writes the brand, designs the logo and hero, builds a landing page and puts SEO on cruise control. Everything is editable, and everything exports.
                  </p>
                  {!hasKey && (
                    <p className="text-xs text-amber-400 mt-2">
                      No Gemini key yet. You can explore the sample project in the sidebar, or <button className="underline" onClick={() => setShowSettings(true)}>add a key</button> to launch your own.
                    </p>
                  )}
                </div>
              </div>
              <BriefForm submitLabel="Launch" hasKey={hasKey} onSubmit={onNewBrief} onNeedKey={() => setShowSettings(true)} busy={launching} />
            </div>
          ) : (
            <div className="space-y-4 h-full flex flex-col">
              {pipelineVisible && <PipelinePanel steps={active.pipeline} error={launchError} onRetry={() => launch(active.id, active.brief)} />}
              <div className="flex-1 min-h-0">
                {tab === 'brief' && (
                  <div className="space-y-4">
                    {active.isSample && (
                      <div className="max-w-3xl mx-auto flex items-center justify-between gap-3 bg-surface border border-line rounded-xl p-4">
                        <p className="text-sm text-muted">This is the built-in sample. Clone it to keep edits and chat with the crew about it.</p>
                        <Button variant="primary" onClick={() => { clone(active); setToast('Cloned the sample into your projects.'); }}>Clone sample</Button>
                      </div>
                    )}
                    <BriefForm
                      key={active.id}
                      initial={active.brief}
                      submitLabel={kitReady ? 'Relaunch kit' : 'Launch'}
                      hasKey={hasKey}
                      busy={launching}
                      onNeedKey={() => setShowSettings(true)}
                      onSubmit={(brief) => {
                        update(active.id, { brief });
                        if (hasKey) void launch(active.id, brief);
                        else setToast('Brief saved.');
                      }}
                    />
                  </div>
                )}
                {tab === 'brand' && <BrandPanel project={active} onChange={setBrand} onAskAgent={askAgent} />}
                {tab === 'page' && <PagePanel project={active} onChange={setPage} onAskAgent={askAgent} />}
                {tab === 'seo' && <SeoPanel project={active} onChange={setSeoSynced} onAskAgent={askAgent} />}
                {tab === 'studio' && (
                  <StudioChat
                    project={active}
                    agentId={agentId}
                    onSelectAgent={(id) => { setAgentId(id); setDraft(undefined); }}
                    messages={active.conversations[agentId] ?? []}
                    busy={chatBusy}
                    hasKey={hasKey}
                    pendingImage={pendingImage}
                    onClearPendingImage={() => setPendingImage(undefined)}
                    onAttachImage={setPendingImage}
                    onSend={sendChat}
                    onNeedKey={() => setShowSettings(true)}
                    draft={draft}
                  />
                )}
                {tab === 'assets' && (
                  <AssetsPanel
                    project={active}
                    onToggleSave={(asset) => update(active.id, (p) => ({ assets: p.assets.map((a) => (a.id === asset.id ? { ...a, saved: !a.saved } : a)) }))}
                    onEdit={editAsset}
                    onUseAs={(asset, role) => update(active.id, (p) => ({ brand: p.brand ? { ...p.brand, [role === 'logo' ? 'logoAssetId' : 'heroAssetId']: asset.id } : p.brand, assets: p.assets.map((a) => (a.id === asset.id ? { ...a, saved: true } : a)) }))}
                    onDelete={(asset) => update(active.id, (p) => ({ assets: p.assets.filter((a) => a.id !== asset.id) }))}
                  />
                )}
              </div>
              {tab !== 'brief' && !active.brand && !launching && (
                <div className="flex justify-center">
                  <Button variant="primary" onClick={() => (hasKey ? launch(active.id, active.brief) : setShowSettings(true))}>
                    <SparkIcon className="w-4 h-4" /> {hasKey ? 'Launch this brief' : 'Add a key to launch'}
                  </Button>
                </div>
              )}
              {tab === 'brand' && kitReady && !launching && !active.isSample && (
                <div className="flex justify-end">
                  <Button size="sm" variant="ghost" onClick={() => launch(active.id, active.brief)}><RefreshIcon className="w-4 h-4" /> Regenerate whole kit</Button>
                </div>
              )}
            </div>
          )}
        </div>
      </main>

      {showSettings && <SettingsModal apiKey={apiKey} onSave={(k) => { setApiKey(k); saveApiKey(k); }} onClose={() => setShowSettings(false)} />}
      {confirmDelete && (
        <Modal
          title="Delete project"
          onClose={() => setConfirmDelete(null)}
          footer={
            <>
              <Button variant="ghost" onClick={() => setConfirmDelete(null)}>Cancel</Button>
              <Button variant="danger" onClick={() => { remove(confirmDelete.id); setConfirmDelete(null); setView('new'); }}>Delete</Button>
            </>
          }
        >
          <p className="text-sm">Delete <strong>{confirmDelete.brief.name}</strong> and its {confirmDelete.assets.length} assets? This cannot be undone. Download the kit first if you want to keep it.</p>
        </Modal>
      )}
      {toast && (
        <div role="status" className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 bg-surface border border-line rounded-xl px-4 py-2.5 text-sm shadow-xl max-w-md">
          {toast}
        </div>
      )}
    </div>
  );
}
