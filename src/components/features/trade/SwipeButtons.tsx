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
        className="w-16 h-16 rounded-2xl flex items-center justify-center transition-all active:scale-95 disabled:opacity-50"
        style={{ background: 'linear-gradient(to bottom right, #ef4444, #dc2626)', boxShadow: '0 4px 14px rgba(239,68,68,0.3)' }}
      >
        <ThumbsDown className="w-7 h-7 text-white" />
      </button>
      <button 
        onClick={onSwipeRight}
        disabled={disabled}
        className="w-16 h-16 rounded-2xl flex items-center justify-center transition-all active:scale-95 disabled:opacity-50"
        style={{ background: 'linear-gradient(to bottom right, #22c55e, #16a34a)', boxShadow: '0 4px 14px rgba(34,197,94,0.3)' }}
      >
        <ThumbsUp className="w-7 h-7 text-white" />
      </button>
    </div>
  );
}
