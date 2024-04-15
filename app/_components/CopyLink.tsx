'use client';

import { Button } from '@/components/ui/button'
import { useToast } from '@/components/ui/use-toast';
import { Share } from 'lucide-react'
import React from 'react'

export default function CopyLink({ id }: { id: string }) {
  const {toast} = useToast()
  async function copyToClipboard() {
    await navigator.clipboard.writeText(`${location.origin}/request/${id}`)
    toast({
      title: 'Copied!',
      description: 'Link copied to clipboard',
      duration: 2000,
    })
  }
  
  
  return (
    <div className='flex'>
    <Button variant='outline' size='icon'
    onClick={copyToClipboard}
    >
    <Share className='h-5 w-5 text-primary text-muted-foreground hover:text-primary cursor-pointer' />
    </Button>
    <p className='text-muted-foreground hover: hover:text-primary text-xs ml-1'>Share</p>
    </div>
  )
}
