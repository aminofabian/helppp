'use client'
import { Textarea } from "@/components/ui/textarea";
import { updateCommunityDescription } from '@/app/actions';
import { Input } from '@/components/ui/input';
import SubmitButton from '@/app/_components/SubmitButtons';
import { useFormState } from "react-dom";
import { useEffect } from "react";
import { useToast } from "@/components/ui/use-toast";
import { CheckIcon } from "@radix-ui/react-icons";


interface iAppProps {
  communityName: string;
  description: string | null | undefined;
}
const initialState = {
  message: "",
  status: ""
}
function CommunityDescriptionForm({ description, communityName }: iAppProps) {
  const [ state, formAction] = useFormState(updateCommunityDescription, initialState);
  const { toast } = useToast();
  
  useEffect(() => {
    if (state?.status === 'green') {
      toast({
        title: 'You have Successfully Updated Your Community Description', 
        description: state.message,
      })
    }
    else if (state?.status === 'error') {
      toast({
        title: 'error',
        description: state.message,
        variant: 'destructive'
      })
    }
  }, [state, toast]
  )
  return (
    <div>
    <form action={formAction}>
    <Input name='communityName' value={communityName} />
    <Textarea placeholder='Write a description' className='w-full h-40 rounded-lg border-2 border-primary focus:outline-none focus:ring-2 focus:ring-slate-400 focus:border-transparent my-5'
    maxLength={300}
    name='description'
    defaultValue={description ?? undefined}
        />
        <div className="mb-5">
    {state?.status === 'green' ? <p className='text-primary text-xs flex gap-x-2 mt-5 baseline bg-green-100 rounded-2xl pl-5'>{state?.message} <CheckIcon width={20} height={20} /></p> : 
    <p className='text-orange-500 text-xs flex gap-x-2 mt-5 baseline bg-orange-100 rounded-2xl pl-5'>
              {state?.message} </p>}
          </div>
          

    <SubmitButton ButtonName='Update Description' />
    </form>
    
    
    </div>
    )
  }
  
  export default CommunityDescriptionForm