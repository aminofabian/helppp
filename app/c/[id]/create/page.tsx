import { Card } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator';
import Image from 'next/image'
import Link from 'next/link';
import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { TextIcon, VideoIcon } from '@radix-ui/react-icons';
import { HandCoins } from 'lucide-react';




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
  
  return (
    <div className="my-5">
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-3 lg:gap-8">
    <div className="h-32 rounded-lg bg-gray-200 lg:col-span-2">
    <h1 className='font-semibold mx-5 my-5'> c/ <Link href={`/c/${params.id}`} className='text-primary'>{params.id}</Link> </h1>
    
    <Tabs defaultValue="Request" className="w-full px-5">
    <TabsList className='grid w-full grid-cols-3'>
    <TabsTrigger value='Request'>
    <TextIcon className='mr-2' />  Request
    
    Request
    </TabsTrigger>
    
    <TabsTrigger value='image'>    
    <VideoIcon className='mr-2' />  Image & Video
    </TabsTrigger>
    
    <TabsTrigger value='requestAmount'>
    <HandCoins className='mr-2' />
    
    Request Amount
    </TabsTrigger>
    
    
    </TabsList>
    
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
    