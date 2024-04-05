'use client'

import React, { useEffect } from 'react'
import { Separator } from "@/components/ui/separator"
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { updateUsername } from '@/app/actions'
import SubmitButton from '@/app/_components/SubmitButtons'
import { useFormState } from 'react-dom';
import { useToast } from "@/components/ui/use-toast"
import { CheckIcon, ExclamationTriangleIcon } from '@radix-ui/react-icons'


const initialState = {
  message: "",
  status: ""
}
export default function SettingsForm({ username }: { username: string | null | undefined }) {
  const [state, formAction] = useFormState(updateUsername, initialState);
  const { toast } = useToast()
  
  
  useEffect(() => {
    if (state?.status === 'green') {
      toast({
        title: "Successful",
        description: "You've Successfully Changed Your Username",
      })
    } else if (state?.status === 'error') {
      toast({
        title: "Sorry, We Couldn't Change Your Username",
        description: 'It Appears Someone Else Has Already Used That Username, Please Choose a Different Username and Try Again',
        variant: 'destructive',
      })
    }
    
  }, [state, toast])
  return (
    <form action={formAction}>
    <h1 className='text-3xl font-semibold tracking-tight mt-5'>Settings</h1>
    <Separator className='my-4' />
    
    <Label className='text-lg'>Change Your Username</Label>
    <p className='text-muted-foreground'>If you don't like the auto-assigned username, you're welcome to change it here</p>
    <Input defaultValue={username ?? undefined} name='username' minLength={5} maxLength={21} required className='mt-3 min-{2} hover:scale-105 ' />
    {state?.status === 'green' ? <p className='text-primary text-xs flex gap-x-2 mt-5 baseline bg-green-100 rounded-2xl pl-5'>{state?.message} <CheckIcon width={20} height={20} /></p> : 
    <p className='text-orange-500 text-xs flex gap-x-2 mt-5 baseline bg-orange-100 rounded-2xl pl-5'>
    {state?.message} </p>}
    <div className='flex gap-x-5 mt-10 w-full'>
    <Button className='w-full' variant='secondary' asChild><Link href='/' type='button' className='dark:bg-slate-800 hover:scale-105'>Cancel</Link></Button>
    <SubmitButton />
    </div>
    
    </form>
    )
  }
  