'use client';

import React from 'react';
import { ThumbsUp, ThumbsDown } from 'lucide-react';

interface SwipeButtonsProps {
  onSwipeLeft: () => void;
  onSwipeRight: () => void;
  disabled?: boolean;
}

export function SwipeButtons({ onSwipeLeft, onSwipeRight, disabled }: SwipeButtonsProps) {
  return (
    <div className="flex justify-center gap-6 mt-8">
      <button 
        onClick={onSwipeLeft}
        disabled={disabled}
        className="w-16 h-16 bg-red-400 hover:bg-red-300 border-4 border-red-600 flex items-center justify-center transition-all active:scale-95 disabled:opacity-50"
        style={{boxShadow: '4px 4px 0 rgba(0,0,0,0.2)'}}
      >
        <ThumbsDown className="w-8 h-8 text-white" />
      </button>
      <button 
        onClick={onSwipeRight}
        disabled={disabled}
        className="w-16 h-16 bg-green-400 hover:bg-green-300 border-4 border-green-600 flex items-center justify-center transition-all active:scale-95 disabled:opacity-50"
        style={{boxShadow: '4px 4px 0 rgba(0,0,0,0.2)'}}
      >
        <ThumbsUp className="w-8 h-8 text-white" />
      </button>
    </div>
  );
}
