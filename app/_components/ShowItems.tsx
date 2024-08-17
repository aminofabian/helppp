'use client';

import React, { useState, useEffect } from 'react';
import { useInView } from 'react-intersection-observer';
import { RequestCard } from './RequestCard';
import Loading from '../loading';

export function ShowItems() {
  const [items, setItems] = useState<any[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { ref, inView } = useInView();
  
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
      console.log('Loading page:', page);
      const response = await fetch(`/api/getData?page=${page}`);
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      const { data, count } = await response.json();
      console.log('Received data:', data);
      setItems(prevItems => [...prevItems, ...data]);
      setPage(prevPage => prevPage + 1);
      setHasMore(items.length + data.length < count);
    } catch (error) {
      console.error("Error loading more items:", error);
      setError(`Failed to load items: ${(error as Error).message}`);
    } finally {
      setIsLoading(false);
    }
  };
  
  if (error) {
    return <div>Error: {error}</div>;
  }
  
  return (
    <div>
    {items.length === 0 && isLoading ? (
      <div><Loading /></div>
    ) : (
      items.map((request: any) => (
        <RequestCard
        key={request.id}
        id={request.id}
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
        />
      ))
    )}
    {hasMore && <div ref={ref}>{isLoading ? <Loading /> : 'Scroll for more'}</div>}
    </div>
  );
}