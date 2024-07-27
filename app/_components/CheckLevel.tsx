'use client'

import { SubmitButton } from '@/app/_components/SubmitButtons';
import { createCommunity } from '@/app/actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/components/ui/use-toast';
import Link from 'next/link';
import React, { useEffect } from 'react'
import { useFormState } from 'react-dom';

const initialState = {
  message: "",
  status: ""
}

export default function CreateCommunityForm() {
  const [state, formAction] = useFormState(createCommunity, initialState);
  
  const { toast } = useToast();
  
  useEffect(() => {
    if (state.status === 'error') {
      toast({
        title: 'error',
        description: state.message,
        variant: 'destructive'
      })
    }
  }, [state, toast])

  return (
    <div className='container mx-auto flex flex-col items-center gap-4 my-5 justify-center'>
      <form className='container justify-center' action={formAction}>
        <h1 className='text-3xl font-semibold tracking-tight mt-5'>Create Community</h1>
        <Separator className='my-4' />
        
        <h2 className='text-lg'>Create Your Own Community Of Helpers</h2>
        <p className='text-muted-foreground text-center text-balance'>
          Ready to rally your own crew of helpers? Dive in and craft your community! Connect, share, and grow together in a space that's all yours. Whether it's lending a hand or swapping skills, let's make it happen. Start building your crew now! <br /> <br />
          
          <span className='bg-green-50 px-5 rounded text-green-400 text-sm'>Note: Your community will be private until you decide to make it public. And Community Name Once Created Cannot be Changed or Deleted </span>
        </p>
        <fieldset className="w-full space-y-1 dark:text-gray-800">
          <Label htmlFor="url" className="block text-sm font-medium my-5">Community Name</Label>
          <div className="flex">
            <span className="flex items-center px-3 pointer-events-none sm:text-sm dark:bg-gray-800 dark:text-gray-300">c/</span>
            <Input type="text" name="name" required minLength={3} maxLength={30}  id="url" className="flex flex-1 border sm:text-sm focus:ring-inset dark:border-gray-300 dark:text-gray-800 dark:bg-gray-800 focus:dark:primary" />
          </div>
          
          {state.status === 'error'? <p className='text-orange-500 text-xs flex gap-x-2 mt-5 baseline bg-orange-100 rounded-2xl pl-5 ml-10 my-5'>{state.message} </p> : <p className='text-green-500 text-xs flex gap-x-2 mt-5 baseline bg-green-100 rounded-2xl pl-5'>{state.message} </p>}
        </fieldset>
        <div className='flex gap-x-5 mt-10 md:w-[40%] w-full ml-auto'>
          <Button className='w-full' variant='secondary' asChild><Link href='/' type='button' className='dark:bg-slate-800 hover:scale-105'>Cancel</Link></Button>
          <SubmitButton ButtonName='Create Community' />    
        </div>
      </form>    
    </div>
  )
}