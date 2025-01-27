'use client';

import { Button } from '@/components/ui/button'
import { useToast } from '@/components/ui/use-toast';
import { Share, ShareIcon } from 'lucide-react'
import React from 'react'

interface CopyLinkProps {
  id: string;
  className?: string;
}

export default function CopyLink({ id, className }: CopyLinkProps) {
  const {toast} = useToast()
  async function copyToClipboard() {
    await navigator.clipboard.writeText(`${location.origin}/request/${id}`)
    toast({
      title: 'Copied!',
      description: 'Link copied to clipboard',
      duration: 5000,
    })
  }
  
  return (
    <div className='flex'>
      <Button 
        onClick={copyToClipboard}
        variant="secondary"
        size="sm"
        className={`bg-green-100 hover:bg-green-200 text-green-700 ${className || ''}`}
      >
        <ShareIcon className="w-4 h-4" />
      </Button>
    </div>
  )
}
