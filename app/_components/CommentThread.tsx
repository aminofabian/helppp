'use client';

import { useState } from 'react';
import Image from 'next/image';
import { MessageSquare, MoreVertical, ThumbsUp, MessageCircle, Share2, ThumbsDown } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';

interface Comment {
  id: string;
  text: string;
  createdAt: Date;
  User: {
    userName: string;
    email: string;
    imageUrl: string | null;
  } | null;
  likes: number;
  dislikes: number;
  replies: Comment[];
  parentId: string | null;
}

interface CommentThreadProps {
  comment: Comment;
  requestId: string;
  onReply?: (commentId: string, text: string) => Promise<void>;
  onLike?: (commentId: string, isLike: boolean) => Promise<void>;
  onShare?: (commentId: string) => Promise<void>;
  depth?: number;
}

export function CommentThread({ 
  comment, 
  requestId, 
  onReply, 
  onLike, 
  onShare, 
  depth = 0 
}: CommentThreadProps) {
  const [isReplying, setIsReplying] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [liked, setLiked] = useState(false);
  const [disliked, setDisliked] = useState(false);
  const { toast } = useToast();
  const maxDepth = 3;

  const handleReply = async () => {
    if (!replyText.trim()) return;
    
    try {
      await onReply?.(comment.id, replyText);
      setReplyText('');
      setIsReplying(false);
      toast({
        title: "Reply posted",
        description: "Your reply has been added to the thread.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to post reply. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleLike = async (isLike: boolean) => {
    try {
      await onLike?.(comment.id, isLike);
      if (isLike) {
        setLiked(!liked);
        setDisliked(false);
      } else {
        setDisliked(!disliked);
        setLiked(false);
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update reaction. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleShare = async () => {
    try {
      await onShare?.(comment.id);
      await navigator.clipboard.writeText(
        `${window.location.origin}/request/${requestId}#comment-${comment.id}`
      );
      toast({
        title: "Link copied",
        description: "Comment link has been copied to clipboard.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to share comment. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <div 
      id={`comment-${comment.id}`}
      className={`relative ${depth > 0 ? 'ml-6 mt-4' : 'mt-4'}`}
    >
      {depth > 0 && (
        <div 
          className="absolute left-[-24px] top-0 bottom-0 w-px bg-gray-200 dark:bg-gray-700"
          style={{
            content: '""',
            height: '100%'
          }}
        />
      )}
      
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 transition-all duration-200 hover:shadow-md">
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
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => handleLike(true)}
                    className={`inline-flex items-center gap-1 text-xs ${
                      liked ? 'text-primary' : 'text-gray-500 hover:text-primary'
                    } transition-colors`}
                  >
                    <ThumbsUp className="w-4 h-4" />
                    <span>{comment.likes + (liked ? 1 : 0)}</span>
                  </button>
                  <button 
                    onClick={() => handleLike(false)}
                    className={`inline-flex items-center gap-1 text-xs ${
                      disliked ? 'text-red-500' : 'text-gray-500 hover:text-red-500'
                    } transition-colors`}
                  >
                    <ThumbsDown className="w-4 h-4" />
                    <span>{comment.dislikes + (disliked ? 1 : 0)}</span>
                  </button>
                </div>
                {depth < maxDepth && (
                  <button 
                    onClick={() => setIsReplying(!isReplying)}
                    className="inline-flex items-center gap-1 text-xs text-gray-500 hover:text-primary transition-colors"
                  >
                    <MessageCircle className="w-4 h-4" />
                    Reply
                  </button>
                )}
                <button 
                  onClick={handleShare}
                  className="inline-flex items-center gap-1 text-xs text-gray-500 hover:text-primary transition-colors"
                >
                  <Share2 className="w-4 h-4" />
                  Share
                </button>
              </div>
              
              {isReplying && (
                <div className="mt-4 space-y-3">
                  <Textarea
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    placeholder="Write your reply..."
                    className="min-h-[100px]"
                  />
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="outline"
                      onClick={() => setIsReplying(false)}
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleReply}
                      disabled={!replyText.trim()}
                    >
                      Reply
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {comment.replies && comment.replies.length > 0 && (
        <div className="space-y-4">
          {comment.replies.map((reply) => (
            <CommentThread
              key={reply.id}
              comment={reply}
              requestId={requestId}
              onReply={onReply}
              onLike={onLike}
              onShare={onShare}
              depth={depth + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
}
