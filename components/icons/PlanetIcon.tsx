import React from 'react';

export const PlanetIcon: React.FC = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 200 200"
    className="w-32 h-32 text-brand-secondary"
  >
    <defs>
      <radialGradient id="planetGradient" cx="30%" cy="30%" r="70%">
        <stop offset="0%" stopColor="#fde047" /> {/* yellow-300 */}
        <stop offset="100%" stopColor="#f59e0b" /> {/* amber-500 */}
      </radialGradient>
      <filter id="glow">
        <feGaussianBlur stdDeviation="3.5" result="coloredBlur" />
        <feMerge>
          <feMergeNode in="coloredBlur" />
          <feMergeNode in="SourceGraphic" />
        </feMerge>
      </filter>
    </defs>
    <g filter="url(#glow)">
      <circle cx="100" cy="100" r="60" fill="url(#planetGradient)" />
      <ellipse
        cx="100"
        cy="100"
        rx="90"
        ry="30"
        fill="none"
        stroke="#fde047"
        strokeWidth="5"
        transform="rotate(-20 100 100)"
      />
    </g>
  </svg>
);