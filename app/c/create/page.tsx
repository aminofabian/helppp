import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import Link from 'next/link';
import React from 'react'

function CreateCommunityPage() {
  return (
    <div className='container mx-auto flex flex-col items-center gap-4'>
    <form className='container'>
    <h1 className='text-3xl font-semibold tracking-tight mt-5'>Create Community</h1>
    <Separator className='my-4' />
    
    <h2 className='text-lg'>Create Your Own Community Of Helpers</h2>
    <p className='text-muted-foreground'>Ready to rally your own crew of helpers? Dive in and craft your community! Connect, share, and grow together in a space that's all yours. Whether it's lending a hand or swapping skills, let's make it happen. Start building your crew now! <br /> <br />
    
    <span className='bg-green-50 px-5 rounded text-green-400 text-sm'>Note: Your community will be private until you decide to make it public. And Community Name Once Created Cannot be Changed or Deleted </span>
    </p>
    
    <fieldset className="w-full space-y-1 dark:text-gray-800">
    <Label htmlFor="url" className="block text-sm font-medium my-5">Community Name</Label>
    <div className="flex">
    <span className="flex items-center px-3 pointer-events-none sm:text-sm dark:bg-gray-800 dark:text-gray-300">c/</span>
    <Input type="text" name="name" required minLength={3} maxLength={21}  id="url" placeholder="Kenya Helper's Association" className="flex flex-1 border sm:text-sm focus:ring-inset dark:border-gray-300 dark:text-gray-800 dark:bg-gray-800 focus:dark:primary" />
    </div>
    </fieldset>
    
    
    <div className='flex gap-x-5 mt-10 w-full'>
    <Button className='w-full' variant='secondary' asChild><Link href='/' type='button' className='dark:bg-slate-800 hover:scale-105'>Cancel</Link></Button>
    <Button className='w-full' variant='default'>Create Community</Button>
    
    </div>
    
    </form>    
    </div>
    )
  }
  
  export default CreateCommunityPage;