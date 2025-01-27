"use client"
import React from 'react';

interface SliderProps {
  contributed: number;
  total: number;
}

export default function Slider({ contributed, total }: SliderProps) {
  const percentage = (contributed / total) * 100;
  
  return (
    <div>
      <fieldset className="flex flex-nowrap items-center w-full space-x-2 dark:text-gray-100 rounded-md">
        <label htmlFor="slider" className="text-sm">
        </label>
        <input 
          readOnly 
          id="slider" 
          type="range" 
          value={percentage} 
          max="100"
          className="w-full h-1 rounded-md bg-primary cursor-pointer accent-primary text-sm" 
        />
        <label htmlFor="slider" className="text-xs">
          <p className='xs'>{percentage.toFixed(1)}%</p>
        </label>
      </fieldset>
    </div>
  );
}
