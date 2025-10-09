import React from 'react';
import type { Agent } from '../types';

interface PlanetSelectorProps {
  agents: Agent[];
  currentAgentId: string;
  onSelectAgent: (agentId: string) => void;
}

// A smaller version of the icon for the selector
const IconWrapper: React.FC<{children: React.ReactNode, isSelected: boolean}> = ({ children, isSelected }) => {
    const className = `w-6 h-6 transition-colors duration-300 ${isSelected ? 'text-white' : 'text-brand-text-secondary group-hover:text-brand-accent'}`;
    return (
        <div className={className}>
            {children}
        </div>
    )
}

const AgentButtonIcon: React.FC<{agent: Agent, isSelected: boolean}> = ({agent, isSelected}) => {
    switch(agent.id) {
        case 'design-planet':
            return <IconWrapper isSelected={isSelected}><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" className="w-full h-full"><defs><radialGradient id="planetGradient" cx="30%" cy="30%" r="70%"><stop offset="0%" stopColor="#fde047" /><stop offset="100%" stopColor="#f59e0b" /></radialGradient></defs><g><circle cx="100" cy="100" r="60" fill="currentColor" /><ellipse cx="100" cy="100" rx="90" ry="30" fill="none" stroke="currentColor" strokeWidth="10" transform="rotate(-20 100 100)" /></g></svg></IconWrapper>
        case 'logo-labyrinth':
            return <IconWrapper isSelected={isSelected}><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" className="w-full h-full"><path d="M100 20 L180 100 L100 180 L20 100 Z" fill="currentColor"/><circle cx="100" cy="100" r="30" fill="none" stroke="#1e293b" strokeWidth="15"/></svg></IconWrapper>
        case 'illustration-nebula':
            return <IconWrapper isSelected={isSelected}><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" className="w-full h-full"><path d="M50 150 C 20 100, 100 20, 150 50 S 180 100, 150 150 Z" fill="currentColor" /></svg></IconWrapper>
        case 'ui-ux-universe':
            return <IconWrapper isSelected={isSelected}><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" className="w-full h-full"><rect x="30" y="50" width="140" height="100" rx="10" fill="currentColor" /><line x1="30" y1="75" x2="170" y2="75" stroke="#1e293b" strokeWidth="10" /></svg></IconWrapper>
        case 'image-segmentation':
            return <IconWrapper isSelected={isSelected}><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" className="w-full h-full"><path d="M30 70 L100 170 L170 70 Z" fill="currentColor" opacity="0.6"/><path d="M30 130 L100 30 L170 130 Z" fill="currentColor" /></svg></IconWrapper>
        default:
            return null;
    }
}

export const PlanetSelector: React.FC<PlanetSelectorProps> = ({ agents, currentAgentId, onSelectAgent }) => {
  return (
    <div className="flex items-center space-x-1 md:space-x-2 bg-brand-secondary/50 p-1 rounded-full">
      {agents.map((agent) => {
        const isSelected = agent.id === currentAgentId;
        
        return (
          <button
            key={agent.id}
            onClick={() => onSelectAgent(agent.id)}
            aria-label={`Select agent: ${agent.name}`}
            className={`
              relative group p-1.5 rounded-full transition-all duration-300
              ${isSelected ? 'bg-brand-accent shadow-lg' : 'hover:bg-brand-secondary'}
            `}
          >
            <AgentButtonIcon agent={agent} isSelected={isSelected} />
            <div className="
              absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-max
              bg-brand-primary text-brand-light text-xs font-bold 
              px-2 py-1 rounded-md shadow-lg
              opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none z-20
            ">
              {agent.name}
            </div>
          </button>
        );
      })}
    </div>
  );
};