import React from 'react';

export const SegmentationIcon: React.FC = () => (
    <svg 
        xmlns="http://www.w3.org/2000/svg" 
        viewBox="0 0 200 200"
        className="w-32 h-32 text-brand-secondary"
    >
        <defs>
            <linearGradient id="segGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#818cf8" />
                <stop offset="100%" stopColor="#4f46e5" />
            </linearGradient>
            <clipPath id="clip-triangle">
              <path d="M30 130 L100 30 L170 130 Z" />
            </clipPath>
        </defs>
        <circle cx="100" cy="100" r="70" fill="url(#segGradient)" />
        <circle cx="100" cy="100" r="70" fill="#f59e0b" clipPath="url(#clip-triangle)" opacity="0.75" />
        <path d="M30 130 L100 30 L170 130 Z" fill="none" stroke="#f1f5f9" strokeWidth="5" />
    </svg>
);