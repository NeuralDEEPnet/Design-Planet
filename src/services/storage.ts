import type { Project, Theme } from '@/types';

const PROJECTS_KEY = 'airave.projects.v1';
const API_KEY_KEY = 'airave.geminiKey';
const THEME_KEY = 'airave.theme';

const safeGet = (key: string): string | null => {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
};

const safeSet = (key: string, value: string): boolean => {
  try {
    localStorage.setItem(key, value);
    return true;
  } catch {
    return false;
  }
};

export function loadProjects(): Project[] {
  const raw = safeGet(PROJECTS_KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as Project[]) : [];
  } catch {
    return [];
  }
}

/**
 * Persists projects. Image data URLs can exceed the localStorage quota, so on failure
 * unsaved assets are dropped first, then all assets, and the result says what happened.
 */
export function saveProjects(projects: Project[]): 'full' | 'trimmed' | 'failed' {
  const persisted = projects.filter((p) => !p.isSample);
  if (safeSet(PROJECTS_KEY, JSON.stringify(persisted))) return 'full';
  const trimmed = persisted.map((p) => ({ ...p, assets: p.assets.filter((a) => a.saved) }));
  if (safeSet(PROJECTS_KEY, JSON.stringify(trimmed))) return 'trimmed';
  const bare = persisted.map((p) => ({ ...p, assets: [] }));
  return safeSet(PROJECTS_KEY, JSON.stringify(bare)) ? 'trimmed' : 'failed';
}

export const loadApiKey = (): string => safeGet(API_KEY_KEY) ?? '';
export const saveApiKey = (key: string): void => {
  if (key) safeSet(API_KEY_KEY, key);
  else {
    try {
      localStorage.removeItem(API_KEY_KEY);
    } catch {
      /* ignore */
    }
  }
};

export const loadTheme = (): Theme => (safeGet(THEME_KEY) === 'light' ? 'light' : 'dark');
export const saveTheme = (theme: Theme): void => {
  safeSet(THEME_KEY, theme);
};
