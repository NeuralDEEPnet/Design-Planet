
import React from 'react';

export const SpinnerIcon: React.FC = () => (
    <div className="flex space-x-1">
        <div className="w-1.5 h-1.5 bg-brand-text-secondary rounded-full animate-bounce [animation-delay:-0.3s]"></div>
        <div className="w-1.5 h-1.5 bg-brand-text-secondary rounded-full animate-bounce [animation-delay:-0.15s]"></div>
        <div className="w-1.5 h-1.5 bg-brand-text-secondary rounded-full animate-bounce"></div>
    </div>
);
