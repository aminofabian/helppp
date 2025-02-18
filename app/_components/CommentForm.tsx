'use client';

import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import React, { useRef, useState } from 'react'
import { SubmitButton } from './SubmitButtons'
import { Input } from '@/components/ui/input'
import { createComment } from '../actions'
import EmojiPicker from 'emoji-picker-react'
import { Button } from '@/components/ui/button'
import { Smile, Bold, Italic, Eye, EyeOff } from 'lucide-react'
import { toast } from 'sonner'

interface iAppProps {
  requestId: string;
  userName: string;
}

const MAX_CHARS = 1000;

function CommentForm({ requestId, userName }: iAppProps) {
  const ref = useRef<HTMLFormElement>(null);
  const [comment, setComment] = useState('');
  const [showEmoji, setShowEmoji] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleEmojiClick = (emojiData: any) => {
    setComment(prev => prev + emojiData.emoji);
    setShowEmoji(false);
  };

  const formatText = (type: 'bold' | 'italic') => {
    const formats = {
      bold: '**',
      italic: '_'
    };
    setComment(prev => `${prev}${formats[type]}${formats[type]}`);
  };

  const renderPreview = (text: string) => {
    return text
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/_(.*?)_/g, '<em>$1</em>');
  };

  return (
    <div className="mt-5">
      <form className='space-y-4' action={async (formData) => {
        if (comment.trim().length === 0) {
          toast.error('Please enter a comment');
          return;
        }

        try {
          setIsLoading(true);
          const data = {
            requestId,
            comment
          };
          
          await createComment(data);
          setComment('');
          ref.current?.reset();
          toast.success('Comment posted successfully!');
        } catch (error) {
          console.error('Comment submission error:', error);
          toast.error('Failed to post comment. Please try again.');
        } finally {
          setIsLoading(false);
        }
      }} ref={ref}>
        <div className="space-y-2">
          <Label className='ml-5'> Share Your Thoughts </Label>
          <Input type='hidden' name='requestId' value={requestId} />
          
          <div className="relative">
            <Textarea
              placeholder={`What advice do you have for ${userName}?`}
              className='w-full min-h-[100px]'
              name='comment'
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              maxLength={MAX_CHARS}
              disabled={isLoading}
            />
            <div className="absolute bottom-2 right-2 text-sm text-gray-400">
              {comment.length}/{MAX_CHARS}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative">
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => setShowEmoji(!showEmoji)}
              >
                <Smile className="h-4 w-4" />
              </Button>
              {showEmoji && (
                <div className="absolute z-50 top-full mt-1">
                  <EmojiPicker onEmojiClick={handleEmojiClick} />
                </div>
              )}
            </div>
            
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={() => formatText('bold')}
            >
              <Bold className="h-4 w-4" />
            </Button>
            
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={() => formatText('italic')}
            >
              <Italic className="h-4 w-4" />
            </Button>

            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={() => setShowPreview(!showPreview)}
            >
              {showPreview ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </Button>
          </div>

          {showPreview && comment && (
            <div 
              className="p-4 border rounded-md mt-2"
              dangerouslySetInnerHTML={{ __html: renderPreview(comment) }}
            />
          )}
        </div>

        <SubmitButton ButtonName='Submit Comment' isLoading={isLoading}/>
      </form>
    </div>
  )
}

export default CommentForm