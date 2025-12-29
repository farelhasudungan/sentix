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
            className={`pixel-font text-[10px] px-3 py-2 border-2 transition-all whitespace-nowrap flex-1 ${
              selected === option
                ? 'bg-yellow-400 text-yellow-900 border-yellow-600 shadow-[2px_2px_0_rgba(0,0,0,0.2)] transform translate-y-px'
                : 'bg-purple-100 text-purple-600 border-purple-300 hover:bg-purple-200'
            }`}
          >
            {option}
          </button>
        ))}
      </div>
    </div>
  );
}
