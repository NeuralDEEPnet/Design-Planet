import React from 'react';
import type { Agent } from '../types';
import { PlanetSelector } from './PlanetSelector';
import { GalleryIcon } from './icons/GalleryIcon';
import { CloseIcon } from './icons/CloseIcon';

interface HeaderProps {
    agents: Agent[];
    currentAgent: Agent;
    onSelectAgent: (agentId: string) => void;
    currentView: 'agent' | 'gallery';
    onToggleView: () => void;
    savedImageCount: number;
}

export const Header: React.FC<HeaderProps> = ({ agents, currentAgent, onSelectAgent, currentView, onToggleView, savedImageCount }) => {
  return (
    <header className="bg-brand-primary/80 backdrop-blur-sm p-4 border-b border-brand-secondary/50 shadow-lg sticky top-0 z-10 flex items-center justify-between">
      <h1 className="text-xl md:text-2xl font-bold text-brand-accent tracking-widest uppercase font-display">
        {currentView === 'agent' ? currentAgent.name : 'Saved Designs'}
      </h1>
      <div className="flex items-center gap-4">
        {currentView === 'agent' && (
          <PlanetSelector
            agents={agents}
            currentAgentId={currentAgent.id}
            onSelectAgent={onSelectAgent}
          />
        )}
        <button
          onClick={onToggleView}
          aria-label={currentView === 'agent' ? 'Open saved gallery' : 'Close gallery'}
          className="relative p-2 rounded-full text-brand-text-secondary hover:text-brand-accent hover:bg-brand-secondary transition-colors duration-200"
        >
          {currentView === 'agent' ? <GalleryIcon /> : <CloseIcon />}
          {savedImageCount > 0 && currentView === 'agent' && (
            <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-brand-accent text-xs font-bold text-white">
              {savedImageCount}
            </span>
          )}
        </button>
      </div>
    </header>
  );
};