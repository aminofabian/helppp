"use client"


import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { HeartIcon, AlertTriangleIcon } from 'lucide-react';

interface VoteButtonsProps {
  initialVoteCount1: number;
  initialVoteCount2: number;
  requestId: string;
}

export function VoteButtons({ initialVoteCount1, initialVoteCount2, requestId }: VoteButtonsProps) {
  const [voteCount1, setVoteCount1] = useState(initialVoteCount1);
  const [voteCount2, setVoteCount2] = useState(initialVoteCount2);
  const [isLoading, setIsLoading] = useState(false);
  
  const handleVote = async (voteType: 'LOVE' | 'SUSPISION') => {
    setIsLoading(true);
    
    // Optimistic update
    if (voteType === 'LOVE') {
      setVoteCount1(prev => prev + 1);
    } else {
      setVoteCount2(prev => prev + 1);
    }
    
    try {
      const response = await fetch('/api/vote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requestId, voteDirection: voteType }),
      });
      
      if (!response.ok) throw new Error('Vote failed');
      
      const data = await response.json();
      setVoteCount1(data.voteCount1);
      setVoteCount2(data.voteCount2);
    } catch (error) {
      console.error('Error voting:', error);
      // Revert optimistic update on error
      if (voteType === 'LOVE') {
        setVoteCount1(prev => prev - 1);
      } else {
        setVoteCount2(prev => prev - 1);
      }
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <div className="flex space-x-2">
    <Button
    onClick={() => handleVote('LOVE')}
    disabled={isLoading}
    variant="secondary"
    size="sm"
    className="flex items-center space-x-1 bg-red-100 hover:bg-red-200 text-red-700 hover:animate-pulse"
    >
    <HeartIcon className="w-4 h-4" />
    <span>{voteCount1}</span>
    </Button>
    <Button
    onClick={() => handleVote('SUSPISION')}
    disabled={isLoading}
    variant="secondary"
    size="sm"
    className="flex items-center space-x-1 bg-yellow-100 hover:bg-yellow-200 text-yellow-700 hover:animate-pulse"
    >
    <AlertTriangleIcon className="w-4 h-4" />
    <span>{voteCount2}</span>
    </Button>
    </div>
  );
}
