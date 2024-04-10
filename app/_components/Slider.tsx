import React from 'react';

export default function Slider({ amount }: { amount: number }) {
  const percentage = (700 / amount) * 100;
  
  return (
    <div>
    <fieldset className="flex flex-nowrap items-center w-full space-x-2 dark:text-gray-100 rounded-md">
    <label htmlFor="slider" className="text-sm">
    </label>
    <input readOnly id="slider" type="range" value={percentage} className="w-full h-2 rounded-md bg-primary cursor-pointer accent-primary text-sm" />
    <label htmlFor="slider" className="text-xs">
    <p className='xs'> {percentage.toFixed(2)}% </p>
    </label>
    </fieldset>
    </div>
    );
  }
  