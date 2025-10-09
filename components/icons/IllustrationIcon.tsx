import React from 'react';

export const IllustrationIcon: React.FC = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 200 200"
    className="w-32 h-32 text-brand-secondary"
  >
    <defs>
        <filter id="illustGlow">
            <feGaussianBlur stdDeviation="3.5" result="coloredBlur" />
        </filter>
        <radialGradient id="illustGradient" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#f472b6" />
            <stop offset="100%" stopColor="#be185d" />
        </radialGradient>
    </defs>
    <g filter="url(#illustGlow)">
        <path d="M50 150 C 20 100, 100 20, 150 50 S 180 100, 150 150 Z" fill="url(#illustGradient)" />
        <path d="M60 140 C 40 100, 100 40, 140 60 S 160 100, 140 140 Z" fill="#be185d" opacity="0.5" />
    </g>
  </svg>
);
