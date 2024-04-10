'use client'

import { Button } from "@/components/ui/button"
import { AlertCircle, HandHeart, Loader2 } from "lucide-react";
import { useFormStatus } from "react-dom"

export default function SubmitButton({ ButtonName }: { ButtonName: string }) {
  {
    const { pending } = useFormStatus();
    return (
      <>  {pending ? <Button className='w-full dark:text-slate-50 dark:bg-slate-800 hover:scale-105' disabled>Give Us a Sec, We Sort You Out... 🤞 <div className="w-6 h-6 border-4 border-dashed rounded-full animate-spin dark:border-violet-600"></div>
      </Button> : <Button className='w-full dark:text-slate-50 dark:bg-slate-800 hover:scale-105' type='submit'>{ButtonName}</Button>
    }
    </>
    )
  }
}

export function LOVE() {
  const { pending } = useFormStatus();
  
  return (
    pending ? (
      <Button variant='outline' size='icon' disabled>
      <Loader2 className="h-4 w-4 animate-spin"/>
      </Button>
      ) : (
        <Button size='icon' variant='outline' type='submit'>
        <HandHeart />
        </Button>
        )
        );
      }
      
      
      export function SUSPISION() {
        const { pending } = useFormStatus();
        
        return (
          pending ? (
            <Button variant='outline' size='icon' disabled>
            <Loader2 className="h-4 w-4 animate-spin"/>
            </Button>
            ) : (
              <Button size='icon' variant='outline' type='submit' >
              <AlertCircle color='red'/>
              </Button>
              )
              );
            }
            
            
            
            