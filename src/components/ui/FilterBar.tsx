'use client';

import React from 'react';

interface FilterBarProps {
  options: string[];
  selected: string;
  onSelect: (option: string) => void;
}

export function FilterBar({ options, selected, onSelect }: FilterBarProps) {
  return (
    <div className="mb-6 overflow-x-auto">
      <div className="flex gap-2 pb-2 w-full">
        {options.map((option) => (
          <button
            key={option}
            onClick={() => onSelect(option)}
            className={`text-xs font-medium px-4 py-2 rounded-lg transition-all whitespace-nowrap flex-1 ${
              selected === option
                ? 'text-black'
                : 'text-gray-400 hover:text-white'
            }`}
            style={selected === option 
              ? { background: 'linear-gradient(to right, #fbbf24, #d97706)', boxShadow: '0 4px 14px rgba(251,191,36,0.2)' }
              : { background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }
            }
          >
            {option}
          </button>
        ))}
      </div>
    </div>
  );
}
