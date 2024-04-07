'use client'
import { Card, CardFooter, CardHeader } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator';
import Image from 'next/image'
import Link from 'next/link';
import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { TextIcon, VideoIcon } from '@radix-ui/react-icons';
import { HandCoins } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { TipTapEditor } from '@/app/_components/TipTapEditor';
import SubmitButton from '@/app/_components/SubmitButtons';
import { UploadDropzone } from '@/app/_components/Uploadthing';




export default function CreateRequest({
  params,
  
}: {
  params: {id:string}
  
}

) {
  const communityGuidelines = [
    {
      id: 1,
      text: "Be clear and honest about your needs when requesting help from the community."
    },
    {
      id: 2,
      text: "Do not engage in fraudulent activities or attempt to scam others for monetary aid."
    },
    {
      id: 3,
      text: "Before seeking assistance, consider how you can contribute and support others within the community."
    },
    {
      id: 4,
      text: "Report any suspicious requests or behavior to the moderators to maintain a safe environment."
    },
    {
      id: 5,
      text: "Respect the boundaries and privacy of others in the community. Do not pressure or guilt-trip users into providing assistance."
    },
    {
      id: 6,
      text: "Engage in constructive dialogue and be open to feedback when discussing your needs or offering help."
    },
    {
      id: 7,
      text: "Avoid overposting or spamming the community with repeated requests for aid."
    },
    {
      id: 8,
      text: "Express gratitude for any assistance received, regardless of the outcome."
    },
    {
      id: 9,
      text: "Ensure that your requests comply with the rules and regulations of the platform and relevant jurisdictions."
    },
    {
      id: 10,
      text: "Take the time to read and understand the guidelines and terms of service of the platform to ensure responsible usage."
    }
  ];
  
  const numbers = [50, 100, 150, 200, 500, 1000, 2000, 5000, 10000, 100000];
  const [selectedAmount, setSelectedAmount] = useState<number | null>(null);
  const [selectedButtonIndex, setSelectedButtonIndex] = useState<number | null>(null);
  const [editMode, setEditMode] = useState(false);
  
  const handleAmountSelect = (amount: number, index: number) => {
    setSelectedAmount(amount);
    setSelectedButtonIndex(index);
  };
  
  const handleEditClick = () => {
    setEditMode(true);
  };
  
  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSelectedAmount(parseInt(event.target.value));
  };
  
  
  
  return (
    <div className="my-5">
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-3 lg:gap-8">
    <div className="h-fit rounded-lg bg-gray-200 lg:col-span-2">
    <h1 className='font-semibold mx-5 my-5'> c/ <Link href={`/c/${params.id}`} className='text-primary'>{params.id}</Link> </h1>
    
    <Tabs defaultValue="Request" className="w-full px-5">
    <TabsList className='grid w-full grid-cols-3'>
    <TabsTrigger value='Request'>
    <TextIcon className='mr-2' />  Request
    </TabsTrigger>
    
    <TabsTrigger value='image'>    
    <VideoIcon className='mr-2' />  Image
    </TabsTrigger>
    
    <TabsTrigger value='requestAmount'>
    <HandCoins className='mr-2' />
    Amount
    </TabsTrigger>
    
    
    </TabsList>
    <TabsContent value='Request'>
    <Card>
    <form>
    
    <CardHeader>
    <Label>Title</Label>
    <Input required name='title' placeholder='Enter the Title of Your Request Here' />
    <TipTapEditor />
    
    </CardHeader>
    <CardFooter>
    <div className='ml-auto'>
    <SubmitButton ButtonName='Submit Request' />
    </div>
    
    </CardFooter>
    
    
    </form>
    
    </Card>
    
    
    </TabsContent>
    <TabsContent value='image'>
    <Card>
    <CardHeader>
    <UploadDropzone
    className='ut-button:bg-primary ut-label:text-primary ut-readying:bg-primary/20 ut-button:ut-uploading:bg-primary/50 ut-button:ut-uploading:after:bg-primary'
    endpoint='imageUploader'
    onClientUploadComplete={(res) => {
      console.log(res);
    }}
    onUploadError={(error: Error) => {
      alert('Error')
      
    }} />
    </CardHeader>
    
    </Card>
    
    
    </TabsContent>
    
    <TabsContent value='requestAmount'>
    <Card>
    <CardHeader>
    
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_120px] lg:gap-8">
    <div className="h-fit rounded-lg bg-gray-200">
    <div className="grid grid-cols-3 md:grid-cols-5 gap-5 justify-between mx-5 my-5">
    {numbers.map((number, index) => (
      <button
      key={index}
      onClick={() => handleAmountSelect(number, index)}
      className={`mr-2 px-4 py-2 ${selectedButtonIndex === index ? 'bg-primary' : 'bg-gray-300'} text-white rounded border-lime-200`}
      >
      {number}
      </button>
      ))}
      <button
      onClick={handleEditClick}
      className="mr-2 w-full px-4 py-2 bg-orange-400 text-white rounded"
      >
      Edit
      </button>
      </div>
      </div>
      <div className="h-fit rounded-lg bg-slate-50 w-full">
      <div className='container h-full flex flex-col justify-center items-center'>
      <h2 className='text-xs text-primary border font-semibold justify-center items-center my-3 px-3 rounded-md ring-1 ring-primary'>
      {selectedAmount ? `${selectedAmount / 40} p` : "0"}
      </h2>
      {editMode ? (
        <input
        type="number"
        className="px-6 py-2 font-medium bg-primary text-white w-fit transition-all shadow-[3px_3px_0px_orange] hover:shadow-none hover:translate-x-[3px] hover:translate-y-[3px] rounded-md focus:border-primary"
        value={selectedAmount ?? ''}
        onChange={handleInputChange}
        />
        ) : (
          <button className="px-6 py-2 font-medium bg-primary text-white w-fit transition-all shadow-[3px_3px_0px_orange] hover:shadow-none hover:translate-x-[3px] hover:translate-y-[3px] rounded-md">
          {selectedAmount ? `${selectedAmount}/=` : "Select an amount"}
          </button>
          )}
          </div>
          </div>
          </div>
          
          
          
          
          </CardHeader>
          
          </Card>
          
          
          </TabsContent>
          
          
          </Tabs>
          
          </div>
          <div className="rounded-lg bg-gray-200">
          <Card className='flex flex-col p-4'>
          <div className='flex items-center'>
          <Image
          src={'/help.png'}
          width={100}
          height={100}
          alt={'help'}
          />
          <h1 className='text-lg text-center font-bold gap-x-2 text-balance'> Posting Your Help Request on Fitrii</h1>
          </div>
          
          <Separator className='my-5' />
          
          {communityGuidelines.map((item) => (
            <div key={item.id}>
            <div className='flex flex-col gap-y-5 mt-5 mx-5'>
            <div className='text-sm'>
            <span className='font-semibold'>{item.id}.</span>  {item.text}
            
            </div>
            <Separator />
            </div>
            </div>
            ))}
            </Card>
            </div>
            </div>
            </div>
            )
          }
          