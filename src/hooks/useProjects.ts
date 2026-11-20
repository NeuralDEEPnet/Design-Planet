import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { Project, Brief } from '@/types';
import { loadProjects, saveProjects } from '@/services/storage';
import { sampleProject } from '@/sample/sampleProject';
import { initialPipeline } from '@/services/launchKit';
import { uid } from '@/lib/id';

export type ProjectPatch = Partial<Project> | ((p: Project) => Partial<Project>);

export function useProjects() {
  const [projects, setProjects] = useState<Project[]>(() => [sampleProject, ...loadProjects()]);
  const [activeId, setActiveId] = useState<string | null>(() => {
    const stored = loadProjects();
    return stored[0]?.id ?? null;
  });
  const [persistence, setPersistence] = useState<'full' | 'trimmed' | 'failed'>('full');
  const first = useRef(true);

  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    setPersistence(saveProjects(projects));
  }, [projects]);

  const active = useMemo(() => projects.find((p) => p.id === activeId) ?? null, [projects, activeId]);

  const update = useCallback((id: string, patch: ProjectPatch) => {
    setProjects((prev) =>
      prev.map((p) => {
        if (p.id !== id) return p;
        const next = typeof patch === 'function' ? patch(p) : patch;
        return { ...p, ...next, updatedAt: Date.now() };
      }),
    );
  }, []);

  const create = useCallback((brief: Brief): Project => {
    const project: Project = {
      id: uid(),
      createdAt: Date.now(),
      updatedAt: Date.now(),
      brief,
      assets: [],
      conversations: {},
      pipeline: initialPipeline(),
    };
    setProjects((prev) => [prev[0], project, ...prev.slice(1)]);
    setActiveId(project.id);
    return project;
  }, []);

  const clone = useCallback((source: Project): Project => {
    const project: Project = { ...structuredClone(source), id: uid(), isSample: false, createdAt: Date.now(), updatedAt: Date.now(), conversations: {} };
    setProjects((prev) => [prev[0], project, ...prev.slice(1)]);
    setActiveId(project.id);
    return project;
  }, []);

  const remove = useCallback((id: string) => {
    setProjects((prev) => prev.filter((p) => p.id !== id));
    setActiveId((cur) => (cur === id ? null : cur));
  }, []);

  return { projects, active, activeId, select: setActiveId, update, create, clone, remove, persistence };
}
