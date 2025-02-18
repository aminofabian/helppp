'use client';

import { Activity } from 'lucide-react';
import { useEffect, useState } from 'react';

interface DonationCountProps {
  initialCount: number;
  userId: string;
}

export default function DonationCount({ initialCount, userId }: DonationCountProps) {
  const [count, setCount] = useState(initialCount);

  useEffect(() => {
    // Update the count when initialCount prop changes
    setCount(initialCount);
  }, [initialCount]);

  useEffect(() => {
    // Function to fetch updated count
    const fetchUpdatedCount = async () => {
      try {
        const response = await fetch(`/api/user-stats?userId=${userId}`);
        if (response.ok) {
          const data = await response.json();
          const newCount = data.calculatedDonationCount ?? data.donationCount;
          // Only update if we have a valid non-zero value
          if (newCount > 0 && newCount !== count) {
            setCount(newCount);
          }
        }
      } catch (error) {
        console.error('Error fetching updated count:', error);
      }
    };

    // Poll for updates every 30 seconds to match parent
    const interval = setInterval(fetchUpdatedCount, 30000);

    // Clean up interval on unmount
    return () => clearInterval(interval);
  }, [userId, count]);

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