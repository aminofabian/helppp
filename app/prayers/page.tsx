import React from 'react';
import PrayerBox from '@/app/_components/PrayerBox';
import PrayerLeaderboard from '@/app/_components/PrayerLeaderboard';

export default function PrayersPage() {
  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-3 lg:gap-8 my-5">
      <div className="h-fit rounded-lg lg:col-span-2">
        <PrayerBox />
      </div>
      <div className="h-fit rounded-lg bg-secondary">
        <PrayerLeaderboard />
      </div>
    </div>
  );
} 