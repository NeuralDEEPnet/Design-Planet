import { useState } from 'react';
import type { Project, Asset, Brand } from '@/types';
import { Badge, Button, EmptyState } from './ui';
import { BookmarkIcon, EditIcon, DownloadIcon, IllustrationIcon } from './icons';

interface Props {
  project: Project;
  onToggleSave: (asset: Asset) => void;
  onEdit: (asset: Asset) => void;
  onUseAs: (asset: Asset, role: 'logo' | 'hero') => void;
  onDelete: (asset: Asset) => void;
}

export const AssetsPanel: React.FC<Props> = ({ project, onToggleSave, onEdit, onUseAs, onDelete }) => {
  const [filter, setFilter] = useState<'all' | 'saved'>('all');
  const brand: Brand | undefined = project.brand;
  const assets = project.assets.filter((a) => filter === 'all' || a.saved);

  if (project.assets.length === 0) {
    return <EmptyState icon={<IllustrationIcon className="w-20 h-20" />} title="No assets yet" text="Launch the brief, or ask any agent in the Studio to generate a logo, hero or illustration." />;
  }

  return (
    <div>
      <div className="flex items-center gap-2 mb-4">
        <Button size="sm" variant={filter === 'all' ? 'primary' : 'secondary'} onClick={() => setFilter('all')}>All ({project.assets.length})</Button>
        <Button size="sm" variant={filter === 'saved' ? 'primary' : 'secondary'} onClick={() => setFilter('saved')}>Saved ({project.assets.filter((a) => a.saved).length})</Button>
        <span className="text-xs text-muted ml-auto">Saved assets survive a browser refresh; unsaved ones are dropped first when storage is full.</span>
      </div>
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {assets.map((asset) => {
          const isLogo = brand?.logoAssetId === asset.id;
          const isHero = brand?.heroAssetId === asset.id;
          return (
            <figure key={asset.id} className="group bg-surface border border-line rounded-xl overflow-hidden flex flex-col">
              <div className="relative aspect-square bg-surface2">
                <img src={asset.url} alt={asset.prompt} className="w-full h-full object-contain" />
                <div className="absolute top-2 left-2 flex gap-1">
                  <Badge tone="neutral">{asset.kind}</Badge>
                  {isLogo && <Badge tone="accent">in use: logo</Badge>}
                  {isHero && <Badge tone="accent">in use: hero</Badge>}
                </div>
                <div className="absolute top-2 right-2 flex flex-col gap-1.5 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition">
                  <button onClick={() => onToggleSave(asset)} aria-label={asset.saved ? 'Unsave' : 'Save'} className={`p-2 rounded-full backdrop-blur bg-black/50 text-white hover:bg-accent ${asset.saved ? 'bg-accent' : ''}`}>
                    <BookmarkIcon className="w-4 h-4" />
                  </button>
                  <button onClick={() => onEdit(asset)} aria-label="Edit in Segmentation Station" className="p-2 rounded-full backdrop-blur bg-black/50 text-white hover:bg-accent">
                    <EditIcon className="w-4 h-4" />
                  </button>
                  <a href={asset.url} download={`${asset.kind}-${asset.id.slice(0, 8)}.png`} aria-label="Download" className="p-2 rounded-full backdrop-blur bg-black/50 text-white hover:bg-accent">
                    <DownloadIcon className="w-4 h-4" />
                  </a>
                </div>
              </div>
              <figcaption className="p-3 text-xs text-muted flex-1 flex flex-col gap-2">
                <p className="line-clamp-2" title={asset.prompt}>{asset.prompt}</p>
                <div className="mt-auto flex flex-wrap gap-1.5">
                  {brand && !isLogo && <Button size="sm" onClick={() => onUseAs(asset, 'logo')}>Use as logo</Button>}
                  {brand && !isHero && <Button size="sm" onClick={() => onUseAs(asset, 'hero')}>Use as hero</Button>}
                  {!isLogo && !isHero && <Button size="sm" variant="ghost" onClick={() => onDelete(asset)}>Delete</Button>}
                </div>
              </figcaption>
            </figure>
          );
        })}
      </div>
    </div>
  );
};
