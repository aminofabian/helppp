'use client';

import React from 'react';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Trophy, Heart } from 'lucide-react';

interface PrayerWarrior {
  id: string;
  name: string;
  prayersAnswered: number;
  avatar?: string;
}

// This would normally come from your database
const mockWarriors: PrayerWarrior[] = [
  { id: '1', name: 'Sarah Johnson', prayersAnswered: 156, avatar: 'https://avatar.vercel.sh/sarah' },
  { id: '2', name: 'Michael Chen', prayersAnswered: 143, avatar: 'https://avatar.vercel.sh/michael' },
  { id: '3', name: 'Emma Davis', prayersAnswered: 128, avatar: 'https://avatar.vercel.sh/emma' },
  { id: '4', name: 'James Wilson', prayersAnswered: 112, avatar: 'https://avatar.vercel.sh/james' },
  { id: '5', name: 'Maria Garcia', prayersAnswered: 98, avatar: 'https://avatar.vercel.sh/maria' },
];

export default function PrayerLeaderboard() {
  return (
    <Card className="p-6">
      <div className="space-y-6">
        <div className="flex items-center gap-2">
          <Trophy className="h-5 w-5 text-primary" />
          <h3 className="text-lg font-semibold">Prayer Warriors</h3>
        </div>

        <div className="space-y-4">
          {mockWarriors.map((warrior, index) => (
            <div
              key={warrior.id}
              className="flex items-center gap-4 p-3 rounded-lg bg-secondary/50 hover:bg-secondary/70 transition-colors"
            >
              <div className="flex-shrink-0 w-8 text-center font-semibold">
                #{index + 1}
              </div>
              
              <Avatar className="h-10 w-10">
                <AvatarImage src={warrior.avatar} />
                <AvatarFallback>{warrior.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
              </Avatar>

              <div className="flex-grow">
                <div className="font-medium">{warrior.name}</div>
                <div className="text-sm text-muted-foreground flex items-center gap-1">
                  <Heart className="h-3 w-3" />
                  {warrior.prayersAnswered} prayers answered
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
} 