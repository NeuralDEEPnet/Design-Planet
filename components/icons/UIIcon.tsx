import React from 'react';

export const UIIcon: React.FC = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 200 200"
    className="w-32 h-32 text-brand-secondary"
  >
    <defs>
        <radialGradient id="uiGradient" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#67e8f9" />
            <stop offset="100%" stopColor="#0891b2" />
        </radialGradient>
    </defs>
    <rect x="30" y="50" width="140" height="100" rx="10" stroke="#67e8f9" strokeWidth="5" fill="url(#uiGradient)" />
    <line x1="30" y1="75" x2="170" y2="75" stroke="#0e7490" strokeWidth="5" />
    <rect x="45" y="90" width="50" height="40" rx="5" fill="#0e7490" opacity="0.5"/>
    <rect x="105" y="90" width="50" height="20" rx="5" fill="#0e7490" opacity="0.5"/>
  </svg>
);
