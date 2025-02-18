'use client';

import { MessageSquare, ThumbsUp, Share2 } from 'lucide-react';
import Image from 'next/image';
import useSWR from 'swr';
import { useToast } from '@/components/ui/use-toast';
import type { RequestData } from './page';

export const ClientComments = ({ data, requestId }: { data: RequestData, requestId: string }) => {
  const { toast } = useToast();
  const { data: commentData, mutate } = useSWR<RequestData>(
    `/api/request/${requestId}`,
    async (url) => {
      const res = await fetch(url);
      if (!res.ok) throw new Error('Failed to fetch comment data');
      return res.json();
    },
    {
      fallbackData: data,
      revalidateOnFocus: true
    }
  );

  const handleLike = async (commentId: string) => {
    try {
      const response = await fetch(`/api/comments/${commentId}/like`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (!response.ok) {
        if (response.status === 401) {
          toast({
            title: "Authentication Required",
            description: "Please sign in to like comments.",
            variant: "destructive",
          });
          return;
        }
        throw new Error('Failed to like comment');
      }

      await response.json();
      
      // Trigger revalidation
      mutate();
      
      toast({
        title: "Success",
        description: "Your reaction has been recorded.",
      });
    } catch (error) {
      console.error('Like error:', error);
      toast({
        title: "Error",
        description: "Failed to like comment. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleShare = async (commentId: string) => {
    try {
      const url = `${window.location.origin}/request/${requestId}#comment-${commentId}`;
      await navigator.clipboard.writeText(url);
      
      toast({
        title: "Link copied",
        description: "Comment link has been copied to clipboard.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to copy link. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className='flex flex-col gap-y-4'>
      {data.Comment.length === 0 ? (
        <div className="text-center p-8 text-gray-500">
          <MessageSquare className="w-12 h-12 mx-auto mb-3 text-gray-400" />
          <p className="text-lg font-semibold">No comments yet</p>
          <p className="text-sm">Be the first to share your thoughts!</p>
        </div>
      ) : (
        <>
          <h3 className="text-lg font-semibold mb-4">
            Comments ({data.Comment.length})
          </h3>
          {data.Comment.map((comment) => (
            <div 
              key={comment.id}
              id={`comment-${comment.id}`}
              className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 transition-all duration-200 hover:shadow-md"
            >
              <div className='flex flex-col w-full space-y-3'>
                <div className='flex items-start gap-x-3'>
                  <div className="flex-shrink-0">
                    <Image 
                      src={comment.User?.imageUrl ?? '/fitrii.png'}
                      width={40}
                      height={40}
                      alt={`${comment.User?.userName || 'Anonymous'}'s avatar`}
                      className='rounded-full object-cover border-2 border-primary/20'
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <div>
                        <a 
                          href={`/u/${comment.User?.userName}`}
                          className="text-sm font-medium text-gray-900 dark:text-gray-100 hover:text-primary transition-colors"
                        >
                          {comment.User?.userName || 'Anonymous'}
                        </a>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {new Date(comment.createdAt).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                      </div>
                    </div>
                    <div className="mt-2 text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap break-words">
                      {comment.text}
                    </div>
                    <div className="mt-3 flex items-center gap-x-4">
                      <button 
                        onClick={() => handleLike(comment.id)}
                        className="inline-flex items-center gap-1 text-xs text-gray-500 hover:text-primary transition-colors"
                      >
                        <ThumbsUp className="w-4 h-4" />
                        <span>{comment._count?.reactions || 0}</span>
                      </button>
                      <button 
                        onClick={() => handleShare(comment.id)}
                        className="inline-flex items-center gap-1 text-xs text-gray-500 hover:text-primary transition-colors"
                      >
                        <Share2 className="w-4 h-4" />
                        Share
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </>
      )}
    </div>
  );
};
