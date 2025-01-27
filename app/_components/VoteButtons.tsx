"use client"

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { HeartIcon, AlertTriangleIcon } from 'lucide-react';
import { motion } from 'framer-motion';

interface VoteButtonsProps {
  initialVoteCount1: number;
  initialVoteCount2: number;
  requestId: string;
}

export function VoteButtons({ initialVoteCount1, initialVoteCount2, requestId }: VoteButtonsProps) {
  const [voteCount1, setVoteCount1] = useState(initialVoteCount1);
  const [voteCount2, setVoteCount2] = useState(initialVoteCount2);
  const [isLoading, setIsLoading] = useState(false);
  const [activeVote, setActiveVote] = useState<'LOVE' | 'SUSPISION' | null>(null);
  
  const handleVote = async (voteType: 'LOVE' | 'SUSPISION') => {
    setIsLoading(true);
    setActiveVote(voteType);
    
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
      setActiveVote(null);
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <div className="flex space-x-4">
      <motion.div
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.92 }}
        className="relative"
      >
        <div className={`
          absolute inset-0 rounded-full
          ${activeVote === 'LOVE' ? 'animate-pulse bg-red-400/20' : ''}
        `} />
        <Button
          onClick={() => handleVote('LOVE')}
          disabled={isLoading}
          variant="secondary"
          size="sm"
          className={`
            relative flex items-center gap-2.5 px-5 py-2.5 rounded-full
            backdrop-blur-sm backdrop-saturate-150
            ${activeVote === 'LOVE'
              ? 'bg-gradient-to-r from-red-500 to-rose-400 text-white hover:from-red-600 hover:to-rose-500'
              : 'bg-white/80 hover:bg-white/90 text-red-500 hover:text-red-600 dark:bg-white/10 dark:hover:bg-white/20 dark:text-red-400'
            }
            transition-all duration-300
            border border-red-100 dark:border-red-900/30
            shadow-[0_0_15px_rgba(239,68,68,0.1)] hover:shadow-[0_0_20px_rgba(239,68,68,0.2)]
            ${isLoading ? 'opacity-70 cursor-not-allowed' : ''}
          `}
        >
          <motion.div
            animate={activeVote === 'LOVE' ? {
              scale: [1, 1.2, 1],
              rotate: [0, -10, 10, 0],
            } : {}}
            transition={{ duration: 0.5 }}
          >
            <HeartIcon className="w-4 h-4" />
          </motion.div>
          <span className="font-medium tracking-wide">{voteCount1}</span>
        </Button>
      </motion.div>

      <motion.div
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.92 }}
        className="relative"
      >
        <div className={`
          absolute inset-0 rounded-full
          ${activeVote === 'SUSPISION' ? 'animate-pulse bg-amber-400/20' : ''}
        `} />
        <Button
          onClick={() => handleVote('SUSPISION')}
          disabled={isLoading}
          variant="secondary"
          size="sm"
          className={`
            relative flex items-center gap-2.5 px-5 py-2.5 rounded-full
            backdrop-blur-sm backdrop-saturate-150
            ${activeVote === 'SUSPISION'
              ? 'bg-gradient-to-r from-amber-500 to-orange-400 text-white hover:from-amber-600 hover:to-orange-500'
              : 'bg-white/80 hover:bg-white/90 text-amber-600 hover:text-amber-700 dark:bg-white/10 dark:hover:bg-white/20 dark:text-amber-400'
            }
            transition-all duration-300
            border border-amber-100 dark:border-amber-900/30
            shadow-[0_0_15px_rgba(245,158,11,0.1)] hover:shadow-[0_0_20px_rgba(245,158,11,0.2)]
            ${isLoading ? 'opacity-70 cursor-not-allowed' : ''}
          `}
        >
          <motion.div
            animate={activeVote === 'SUSPISION' ? {
              scale: [1, 1.2, 1],
              rotate: [0, -10, 10, 0],
            } : {}}
            transition={{ duration: 0.5 }}
          >
            <AlertTriangleIcon className="w-4 h-4" />
          </motion.div>
          <span className="font-medium tracking-wide">{voteCount2}</span>
        </Button>
      </motion.div>
    </div>
  );
}
