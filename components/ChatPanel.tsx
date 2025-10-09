import React, { useState, useRef, useEffect } from 'react';
import type { Message, DesignStep } from '../types';
import { Author } from '../types';
import { UserIcon } from './icons/UserIcon';
import { AgentIcon } from './icons/AgentIcon';
import { SendIcon } from './icons/SendIcon';
import { SpinnerIcon } from './icons/SpinnerIcon';
import { PaperclipIcon } from './icons/PaperclipIcon';

interface ChatPanelProps {
  messages: Message[];
  isLoading: boolean;
  onSendMessage: (prompt: string) => void;
  onSendInspiration: (base64DataUrl: string) => void;
  currentStep: DesignStep;
  currentAgentId: string;
  isAwaitingCollaborationChoice: boolean;
  onProceedToGeneration: () => void;
  onStartCollaboration: () => void;
}

export const ChatPanel: React.FC<ChatPanelProps> = ({ 
  messages, isLoading, onSendMessage, onSendInspiration, currentStep, currentAgentId,
  isAwaitingCollaborationChoice, onProceedToGeneration, onStartCollaboration 
}) => {
  const [prompt, setPrompt] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(scrollToBottom, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim() || isLoading) return;
    onSendMessage(prompt);
    setPrompt('');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e as unknown as React.FormEvent);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64DataUrl = event.target?.result as string;
      if (base64DataUrl) {
        onSendInspiration(base64DataUrl);
      }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };
  
  const isCreativeAgent = currentAgentId !== 'image-segmentation';
  const isInspirationStep = isCreativeAgent && currentStep === 'inspiration';

  const getPlaceholderText = () => {
    if (currentAgentId === 'image-segmentation') {
      return "Describe your edit (e.g., 'remove the background')...";
    }
    if (isInspirationStep) {
      return "Describe inspiration, paste a URL, or upload an image...";
    }
    return "Describe your design...";
  };

  return (
    <div className="bg-brand-secondary/50 backdrop-blur-sm border-t border-brand-secondary p-4 w-full max-h-[40vh] flex flex-col">
      <div className="flex-1 overflow-y-auto mb-4 pr-2">
        <div className="space-y-4">
          {messages.map((msg, index) => (
            <div key={index} className={`flex items-start gap-3 max-w-xl ${msg.author === Author.USER ? 'justify-end ml-auto' : 'justify-start'}`}>
              {msg.author === Author.AGENT && (
                <div className="w-8 h-8 flex-shrink-0 bg-brand-accent rounded-full flex items-center justify-center shadow-lg">
                  <AgentIcon />
                </div>
              )}
              <div className={`px-4 py-2 rounded-lg shadow-md ${msg.author === Author.USER ? 'bg-brand-accent text-white rounded-br-none' : 'bg-brand-primary text-brand-text-secondary rounded-bl-none'}`}>
                {msg.imageUrl && (
                  <img src={msg.imageUrl} alt="User inspiration" className="max-w-xs w-full object-contain rounded-lg mb-2 border border-brand-secondary" />
                )}
                {msg.text && <p className="text-sm whitespace-pre-wrap">{msg.text}</p>}
              </div>
               {msg.author === Author.USER && (
                <div className="w-8 h-8 flex-shrink-0 bg-brand-light rounded-full flex items-center justify-center border border-brand-accent/50 shadow-lg">
                  <UserIcon />
                </div>
              )}
            </div>
          ))}
          {isLoading && !isAwaitingCollaborationChoice && (
             <div className="flex items-start gap-3 justify-start max-w-xl">
                <div className="w-8 h-8 flex-shrink-0 bg-brand-accent rounded-full flex items-center justify-center shadow-lg">
                  <AgentIcon />
                </div>
                <div className="max-w-xs md:max-w-md px-4 py-3 rounded-lg bg-brand-primary text-brand-text-secondary rounded-bl-none shadow-md">
                  <SpinnerIcon />
                </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>
      {isAwaitingCollaborationChoice ? (
        <div className="flex items-center justify-center gap-4 py-2">
          <button
            onClick={onProceedToGeneration}
            className="px-4 py-2 text-sm font-semibold text-white bg-brand-accent rounded-lg shadow-md hover:bg-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-300 transition-all duration-200"
          >
            Generate Image
          </button>
          <button
            onClick={onStartCollaboration}
            className="px-4 py-2 text-sm font-semibold text-brand-text-primary bg-brand-secondary rounded-lg shadow-md hover:bg-slate-600 focus:outline-none focus:ring-2 focus:ring-slate-500 transition-all duration-200"
          >
            Consult Agent
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="relative">
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={getPlaceholderText()}
            className="w-full bg-brand-primary rounded-lg p-3 pr-24 text-sm text-brand-text-primary focus:ring-2 focus:ring-brand-accent focus:outline-none resize-none shadow-inner"
            rows={2}
            disabled={isLoading}
          />
          {isInspirationStep && (
            <>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept="image/png, image/jpeg, image/webp"
                className="hidden"
                disabled={isLoading}
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isLoading}
                aria-label="Upload inspiration image"
                className="absolute right-12 top-1/2 -translate-y-1/2 p-2 rounded-full text-brand-text-secondary disabled:text-brand-secondary/50 disabled:cursor-not-allowed hover:text-brand-accent focus:outline-none transition-colors duration-200"
              >
                <PaperclipIcon />
              </button>
            </>
          )}
          <button
            type="submit"
            disabled={isLoading || !prompt.trim()}
            aria-label="Send message"
            className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-brand-accent text-white disabled:bg-brand-secondary disabled:cursor-not-allowed hover:bg-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-300 transition-all duration-200"
          >
            <SendIcon />
          </button>
        </form>
      )}
    </div>
  );
};