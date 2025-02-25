'use client';

import React, { useState, useEffect } from 'react';
import { useInView } from 'react-intersection-observer';
import { RequestCard } from './RequestCard';
import Loading from '../loading';
import { motion } from 'framer-motion';
import { Separator } from "@/components/ui/separator";

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15,
      delayChildren: 0.1
    }
  }
};

const item = {
  hidden: { opacity: 0, y: 20, scale: 0.95 },
  show: { 
    opacity: 1, 
    y: 0,
    scale: 1,
    transition: {
      type: "spring",
      stiffness: 100,
      damping: 15,
      mass: 0.8
    }
  }
};

export function ShowItems() {
  const [items, setItems] = useState<any[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { ref, inView } = useInView({
    threshold: 0.1,
    triggerOnce: false
  });
  
  useEffect(() => {
    loadMore();
  }, []);
  
  useEffect(() => {
    if (inView && hasMore && !isLoading) {
      loadMore();
    }
  }, [inView, hasMore, isLoading]);
  
  const loadMore = async () => {
    if (isLoading) return;
    setIsLoading(true);
    setError(null);
    try {
      const batchSize = 10; // Number of items to load per batch
      const response = await fetch(`/api/getData?page=${page}&limit=${batchSize}`);
      if (!response.ok) {
        throw new Error('Failed to fetch requests');
      }
      const { data, count } = await response.json();
      
      if (Array.isArray(data)) {
        setItems(prevItems => [...prevItems, ...data]);
        setPage(prevPage => prevPage + 1);
        setHasMore(items.length + data.length < count);
      } else {
        throw new Error('Invalid data format received');
      }
    } catch (error) {
      console.error("Error loading more items:", error);
      setError(`Failed to load requests. Please try again later.`);
    } finally {
      setIsLoading(false);
    }
  };
  
  if (error) {
    return (
      <div className="p-6 rounded-lg bg-red-50/50 dark:bg-red-900/20 
                    backdrop-blur-sm border border-red-200 dark:border-red-800/30
                    shadow-lg dark:shadow-[0_4px_20px_rgba(0,0,0,0.2)]
                    text-red-700 dark:text-red-300">
        <p className="text-sm font-medium">Error: {error}</p>
      </div>
    );
  }
  
  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="space-y-6 relative"
    >
      {items.length === 0 && isLoading ? (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="p-8 rounded-lg bg-white/50 dark:bg-gray-900/30 
                   backdrop-blur-md shadow-lg 
                   dark:shadow-[0_4px_20px_rgba(0,0,0,0.2)]
                   border border-gray-200/50 dark:border-gray-800/30
                   transition-all duration-300"
        >
          <Loading />
        </motion.div>
      ) : (
        items.map((request: any, index: number) => (
          <motion.div
            key={request.id}
            variants={item}
            className="relative group"
            whileHover={{ scale: 1.01 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
          >
            <div className="transform transition-all duration-300
                          hover:translate-y-[-2px]">
              <RequestCard
                id={request.id}
                funded={request.funded}
                contributors={request.contributors}
                title={request.title}
                amount={request.amount}
                commentCount={request.Comment.length}
                jsonContent={request.textContent}
                imageString={request.imageString as string}
                createdAt={request.createdAt}
                level={request.User?.level as number}
                deadline={request.deadline}
                userId={request.User?.id}
                userName={request.User?.userName as string}
                communityName={request.communityName as string}
                voteCount1={request.Vote.reduce((acc: number, vote: any) => {
                  if (vote.voteType === "LOVE") return acc + 1;
                  return acc;
                }, 0)}
                voteCount2={request.Vote.reduce((acc: number, vote: any) => {
                  if (vote.voteType === "SUSPISION") return acc + 1;
                  return acc;
                }, 0)}
                pointsUsed={request.pointsUsed}
              />
            </div>
            
            {index < items.length - 1 && (
              <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 w-48 
                           opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <Separator className="h-px bg-gradient-to-r 
                                   from-transparent via-primary/30 dark:via-blue-400/30 to-transparent
                                   transition-all duration-300" />
              </div>
            )}
          </motion.div>
        ))
      )}
      
      {hasMore && (
        <motion.div 
          ref={ref}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center py-6 relative"
        >
          {isLoading ? (
            <div className="p-4 rounded-lg bg-white/50 dark:bg-gray-900/30 
                         backdrop-blur-md shadow-md
                         dark:shadow-[0_4px_20px_rgba(0,0,0,0.2)]
                         border border-gray-200/50 dark:border-gray-800/30
                         transition-all duration-300">
              <Loading />
            </div>
          ) : (
            <div className="text-sm font-medium text-gray-500 dark:text-gray-400
                         px-4 py-2 rounded-full 
                         bg-white/50 dark:bg-gray-800/30
                         backdrop-blur-sm
                         shadow-sm hover:shadow-md
                         border border-gray-200/50 dark:border-gray-700/30
                         transition-all duration-300
                         inline-block">
              Scroll for more
            </div>
          )}
        </motion.div>
      )}
    </motion.div>
  );
}