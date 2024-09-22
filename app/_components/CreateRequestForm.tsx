'use client'
import React, { useState, ChangeEvent } from 'react';
import { Card, CardFooter, CardHeader } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import Image from 'next/image';
import Link from 'next/link';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TextIcon, VideoIcon } from '@radix-ui/react-icons';
import { ArrowBigRightDash, HandCoins, ListEnd } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { TipTapEditor } from '@/app/_components/TipTapEditor';
import { SubmitButton } from '@/app/_components/SubmitButtons';
import { JSONContent } from '@tiptap/react';
import { useToast } from "@/components/ui/use-toast";


interface CommunityGuideline {
  id: number;
  text: string;
}

interface CreateRequestFormProps {
  createRequest: (formData: FormData) => Promise<void>;
  communityGuidelines: CommunityGuideline[];
  params: {
    id: string;
  };
}

interface Interval {
  label: string;
  value: string;
  days: number;
}

export function CreateRequestForm({ createRequest, communityGuidelines, params }: CreateRequestFormProps) {
  const [selectedAmount, setSelectedAmount] = useState<number | null>(null);
  const [selectedButtonIndex, setSelectedButtonIndex] = useState<number | null>(null);
  const [editMode, setEditMode] = useState<boolean>(false);
  const [pointsUsed, setPointsUsed] = useState<number | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [json, setJson] = useState<JSONContent | null>(null);
  const [title, setTitle] = useState<string | null>(null);
  const [selectedInterval, setSelectedInterval] = useState<string | null>(null);
  const [customTime, setCustomTime] = useState<string>('');
  const [deadline, setDeadline] = useState<string>('');
  const [currentTab, setCurrentTab] = useState<number>(0);
  const [file, setFile] = useState<File | null>(null);
  
  const { toast } = useToast();
  
  const numbers: number[] = [50, 100, 150, 200, 500, 1000, 2000, 5000, 10000, 100000];
  const intervals: Interval[] = [
    { label: '1 Day', value: '1 day', days: 1 },
    { label: '2 Days', value: '2 days', days: 2 },
    { label: '3 Days', value: '3 days', days: 3 },
    { label: '1 Week', value: '1 week', days: 7 },
    { label: '2 Weeks', value: '2 weeks', days: 14 },
    { label: '3 Weeks', value: '3 weeks', days: 21 },
    { label: '1 Month', value: '1 month', days: 30 },
    { label: '2 Months', value: '2 months', days: 60 },
    { label: '3 Months', value: '3 months', days: 90 },
    { label: 'Custom Time', value: 'custom', days: 0 },
  ];
  
  const handleAmountSelect = (amount: number, index: number) => {
    setSelectedAmount(amount);
    setSelectedButtonIndex(index);
  };
  
  const handleEditClick = () => {
    setEditMode(true);
  };
  
  const handleInputChange = (event: ChangeEvent<HTMLInputElement>) => {
    setSelectedAmount(parseInt(event.target.value));
  };
  
  const handleIntervalSelect = (interval: string) => {
    setSelectedInterval(interval);
    if (interval === 'custom') {
      setCustomTime('');
      setDeadline('');
    } else {
      const selectedInterval = intervals.find((item) => item.value === interval);
      if (selectedInterval) {
        const selectedDays = selectedInterval.days;
        const deadlineDate = new Date();
        deadlineDate.setDate(deadlineDate.getDate() + selectedDays);
        setDeadline(deadlineDate.toDateString());
      } else {
        setDeadline('');
      }
    }
  };
  
  const handleCustomTimeChange = (event: ChangeEvent<HTMLInputElement>) => {
    setCustomTime(event.target.value);
    setDeadline('');
  };
  
  const handleCustomTimeSubmit = () => {
    if (customTime) {
      setSelectedInterval(`${customTime} days`);
      const deadlineDate = new Date();
      deadlineDate.setDate(deadlineDate.getDate() + parseInt(customTime));
      setDeadline(deadlineDate.toDateString());
    }
  };
  
  
  const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const formData = new FormData();
      formData.append('file', file);
      
      try {
        const response = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        });
        
        if (response.ok) {
          const data = await response.json();
          setImageUrl(data.fileUrl);
          toast({
            title: "Upload Successful",
            description: "Your image has been uploaded successfully.",
            variant: "default",
          });
        } else {
          throw new Error('Upload failed');
        }
      } catch (error) {
        console.error("Error uploading file:", error);
        toast({
          title: "Upload Error",
          description: "An error occurred while uploading your image. Please try again.",
          variant: "destructive",
        });
      }
    }
  };
  
  const createRequestFitrii = async (formData: FormData) => {
    try {
      if (imageUrl) {
        formData.append('imageUrl', imageUrl);
      }
      
      await createRequest(formData);
      
      toast({
        title: "Request Created",
        description: "Your request has been successfully created.",
        variant: "default",
      });
    } catch (error) {
      console.error("Error creating request:", error);
      
      toast({
        title: "Error",
        description: "An error occurred while creating your request. Please try again.",
        variant: "destructive",
      });
    }
  };
  
  return (    
    <div className="my-5">
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-3 lg:gap-8">
    <div className="h-fit rounded-lg bg-secondary lg:col-span-2 my-2 py-5">
    <h1 className='font-semibold mx-5 my-5'> c/ <Link href={`/c/${params.id}`} className='text-primary'>{params.id}</Link> </h1>
    
    <Tabs defaultValue="time" className="w-full px-5">
    <TabsList className='grid w-full grid-cols-4'>
    <TabsTrigger value='time'>
    <TextIcon className='mr-2' />
    <div className='flex flex-row w-full justify-between'>
    Time
    <ArrowBigRightDash className='relative top-0 r-100'/>
    </div>
    </TabsTrigger>
    
    <TabsTrigger value='requestAmount'>    
    <VideoIcon className='mr-2' />
    <div className='flex flex-row w-full justify-between'>
    Amount
    <ArrowBigRightDash className='relative top-0 r-100'/>
    </div>
    </TabsTrigger>
    
    <TabsTrigger value='image'>
    <HandCoins className='mr-2' />
    <div className='flex flex-row w-full justify-between'>
    Image
    <ArrowBigRightDash className='relative top-0 r-100'/>
    </div>
    </TabsTrigger>
    
    <TabsTrigger value='Request'>
    <div className='flex flex-row w-full justify-between'>
    Text
    <ListEnd className='relative top-0 r-100'/>
    </div>
    </TabsTrigger>
    </TabsList>
    
    <TabsContent value='Request'>
    <Card>
    <form action={createRequestFitrii}>
    <input type='hidden' name='imageUrl' value={imageUrl ?? undefined}/>
    <input type='hidden' name='communityName' value={params.id} /> 
    <input type='hidden' name='amount' value={selectedAmount ?? undefined} />
    <input type='hidden' name='jsonContent' value={JSON.stringify(json)} />
    <input type='hidden' name='pointsUsed' value={pointsUsed ?? undefined} />
    <input type='hidden' name='deadline' value={deadline ?? undefined} />
    <CardHeader>
    <Label>Title</Label>
    <Input required name='title' placeholder='Enter the Title of Your Request Here' value={title ?? ''} onChange={(e) => setTitle(e.target.value)} />
    <TipTapEditor setJson={setJson} json={json} />    
    </CardHeader>
    <CardFooter>
    <div className='ml-auto'>
    <SubmitButton ButtonName='Publish Request' />
    </div>
    </CardFooter>
    </form>
    </Card>
    </TabsContent>
    
    <TabsContent value='image'>
    <Card>
    <CardHeader>
    {imageUrl === null ? (
      <div>
      <input 
      type="file" 
      onChange={handleFileChange}
      accept="image/*" 
      />
      </div>
    ) : (
      <div className="flex justify-center">
      <Image 
      src={imageUrl}
      alt="Uploaded Image"
      width={200}
      height={120}
      style={{
        objectFit: 'cover',
        width: '100%',
        height: 'auto',
        maxHeight: '500px'
      }}
      className="rounded-lg"
      />
      </div>
    )}  
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
      className={`px-4 py-2 text-sm overflow-ellipsis ${selectedButtonIndex === index ? 'bg-primary text-[#d4e6d4]' : 'bg-secondary'} text-[#298126] rounded border-lime-200 hover:scale-105`}
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
    <div className="h-fit rounded-lg bg-secondary w-full">
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
      name='amount'
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
    
    <TabsContent value='time'>
    <Card>
    <CardHeader>
    <div>
    <h1 className='text-lg font-bold mx-auto mb-5'>For How Long Do You Want the Request to Run?</h1>
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-3 lg:gap-5">
    {intervals.map((interval, index) => (
      <button
      key={index}
      onClick={() => handleIntervalSelect(interval.value)}      className={`mr-2 px-5 py-1 text-${selectedInterval === interval.value ? 'secondary' : 'primary'} border border-slate-500 rounded-lg text-xs flex-shrink space-x-3 bg-${selectedInterval === interval.value ? 'primary' : 'secondary'}`}
      >
      {interval.label}
      </button>
    ))}
    {selectedInterval === 'custom' && (
      <div className="flex justify-center items-center w-full col-span-2 border border-primary px-3 py-2 rounded-md bg-secondary">
      <input
      type="number"
      value={customTime}
      onChange={handleCustomTimeChange}
      placeholder="Enter days"
      className="mr-5 px-4 py-1 text-primary bg-transparent border border-primary rounded text-center align-center w-full text-sm"
      />
      <button
      onClick={handleCustomTimeSubmit}
      className="px-4 py-1 text-secondary bg-primary border border-secondary rounded w-full mr-2 text-sm"
      >
      Add
      </button>
      </div>
    )}
    </div>
    <div className="h-fit rounded-lg bg-slate-50 w-full">
    <div className='container h-full flex flex-col justify-center items-center'>
    <h2 className='text-xs text-primary border font-semibold justify-center items-center my-3 px-3 rounded-md ring-1 ring-primary'>
    Deadline: {deadline}
    
    
    </h2>
    
    
    </div>
    </div>
    </div>
    
    
    
    </CardHeader> 
    </Card> 
    </TabsContent>
    
    
    
    
    </Tabs>
    
    </div>
    <div className="rounded-lg bg-secondary w-full">
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
    
  );
}
