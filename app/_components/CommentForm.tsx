'use client';

import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import React, { useRef } from 'react'
import { SubmitButton } from './SubmitButtons'
import { Input } from '@/components/ui/input'
import { createComment } from '../actions'


interface iAppProps {
  requestId: string;
  userName: string;
  
}
function CommentForm({ requestId, userName }: iAppProps) {
  const ref = useRef<HTMLFormElement>(null);
  return (
    <form className='mt-5' action={async (formData) => {
      await createComment(formData);
      ref.current?.reset();
      
    }} ref={ref}>
    <Label className='ml-5 my-5'> Share Your Thoughts </Label>
    <Input type='hidden' name='requestId' value={requestId}></Input>
    <Textarea
        placeholder={`what advice do you have for ${userName} ?`}
    className='w-full my-2'
    name='comment'
    
    />
    <SubmitButton ButtonName='Submit Comment'/>
    
    </form>
  )
}

export default CommentForm