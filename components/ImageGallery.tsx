import React from 'react';
import type { Image, Agent } from '../types';
import { ImageIcon } from './icons/ImageIcon';
import { BookmarkIcon } from './icons/BookmarkIcon';
import { GalleryIcon } from './icons/GalleryIcon';
import { EditIcon } from './icons/EditIcon';

interface ImageGalleryProps {
  images: Image[];
  isLoading: boolean;
  galleryType: 'agent' | 'saved';
  agent?: Agent;
  onSaveImage?: (image: Image) => void;
  savedImageIds?: Set<string>;
  onStartEditing?: (image: Image) => void;
}

export const ImageGallery: React.FC<ImageGalleryProps> = ({ images, agent, isLoading, galleryType, onSaveImage, savedImageIds, onStartEditing }) => {
  const AgentIcon = agent?.icon;
  const hasContent = images.length > 0 || (isLoading && galleryType === 'agent');

  return (
    <div className="flex-1 overflow-y-auto p-4 md:p-8">
      {!hasContent ? (
        <div className="flex flex-col items-center justify-center h-full text-brand-text-secondary">
          {galleryType === 'agent' && AgentIcon && (
            <>
              <div className="animate-pulse">
                <AgentIcon />
              </div>
              <p className="mt-6 text-lg text-center font-medium text-brand-text-primary">Welcome to {agent?.name}</p>
              <p className="text-sm text-center max-w-md">{agent?.description}</p>
            </>
          )}
          {galleryType === 'saved' && (
            <>
              <GalleryIcon size="large" />
              <p className="mt-6 text-lg text-center font-medium text-brand-text-primary">Your Saved Gallery</p>
              <p className="text-sm text-center max-w-md">You haven't saved any designs yet. Save an image by clicking the bookmark icon.</p>
            </>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {isLoading && galleryType === 'agent' && (
            <div className="relative aspect-square overflow-hidden rounded-lg shadow-lg bg-brand-secondary flex items-center justify-center">
              <div className="animate-pulse flex flex-col items-center gap-2 text-brand-text-secondary/60">
                <ImageIcon />
                <span className="text-xs font-semibold tracking-wider">GENERATING</span>
              </div>
            </div>
          )}
          {images.map((image) => {
            const isSaved = savedImageIds?.has(image.id);
            return (
              <div key={image.id} className="group relative aspect-square overflow-hidden rounded-lg shadow-lg bg-brand-secondary transform hover:-translate-y-1 transition-all duration-300">
                <img src={image.url} alt={image.prompt} className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent flex items-end p-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <p className="text-xs text-brand-light font-sans font-normal">{image.prompt}</p>
                </div>
                <div className="absolute top-2 right-2 flex flex-col gap-2">
                  {onSaveImage && (
                    <button 
                      onClick={() => onSaveImage(image)}
                      aria-label={isSaved ? 'Unsave image' : 'Save image'}
                      className="p-2 bg-black/40 rounded-full text-white backdrop-blur-sm opacity-0 group-hover:opacity-100 hover:bg-brand-accent focus:opacity-100 transition-all duration-300"
                    >
                      <BookmarkIcon filled={isSaved} />
                    </button>
                  )}
                   {onStartEditing && (
                    <button 
                      onClick={() => onStartEditing(image)}
                      aria-label='Edit image'
                      className="p-2 bg-black/40 rounded-full text-white backdrop-blur-sm opacity-0 group-hover:opacity-100 hover:bg-brand-accent focus:opacity-100 transition-all duration-300"
                    >
                      <EditIcon />
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  );
};