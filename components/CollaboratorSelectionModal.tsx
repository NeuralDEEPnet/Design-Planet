import React from 'react';
import type { Agent } from '../types';
import { PlanetSelector } from './PlanetSelector';

interface CollaboratorSelectionModalProps {
  agents: Agent[];
  onSelect: (agentId: string) => void;
  onClose: () => void;
}

export const CollaboratorSelectionModal: React.FC<CollaboratorSelectionModalProps> = ({ agents, onSelect, onClose }) => {
  return (
    <div 
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50"
      onClick={onClose}
    >
      <div 
        className="bg-brand-secondary rounded-2xl shadow-2xl p-6 border border-brand-secondary/50 max-w-sm w-full mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="text-center">
            <h2 className="text-lg font-bold text-brand-text-primary font-display tracking-wide">Consult an Agent</h2>
            <p className="text-sm text-brand-text-secondary mt-1 mb-4">Select a specialist to provide feedback on the design brief.</p>
        </div>
        <div className="flex justify-center">
          <PlanetSelector
            agents={agents}
            currentAgentId={''} // No agent is "currently" selected in this context
            onSelectAgent={(agentId) => {
              onSelect(agentId);
              onClose();
            }}
          />
        </div>
      </div>
    </div>
  );
};