'use client';

import { Activity } from 'lucide-react';
import { useEffect, useState } from 'react';

interface DonationCountProps {
  initialCount: number;
}

export default function DonationCount({ initialCount }: DonationCountProps) {
  const [count, setCount] = useState(initialCount);

  useEffect(() => {
    // Update the count when initialCount prop changes
    setCount(initialCount);
  }, [initialCount]);

  return (
    <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
      <div className="flex items-center gap-2 mb-1">
        <Activity className="w-4 h-4 text-blue-500" />
        <span className="text-sm text-gray-600 dark:text-gray-400">Helped</span>
      </div>
      <p className="text-lg font-semibold text-blue-600 dark:text-blue-400">
        {count} people
      </p>
    </div>
  );
} 