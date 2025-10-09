import React from 'react';

export const LogoIcon: React.FC = () => (
    <svg 
        xmlns="http://www.w3.org/2000/svg" 
        viewBox="0 0 200 200"
        className="w-32 h-32 text-brand-secondary"
    >
        <defs>
            <linearGradient id="logoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#c084fc" />
                <stop offset="100%" stopColor="#7e22ce" />
            </linearGradient>
        </defs>
        <path d="M100 20 L180 100 L100 180 L20 100 Z" fill="url(#logoGradient)" stroke="#c084fc" strokeWidth="5" />
        <circle cx="100" cy="100" r="30" fill="none" stroke="#f1f5f9" strokeWidth="8"/>
    </svg>
);
