'use client'
import React, { useState, ChangeEvent, useEffect } from 'react';
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
import { Progress } from "@/components/ui/progress";
import { calculateRequestAmount, calculateMaxRequestAmount } from '@/app/lib/requestCalculator';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";


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
  userLevel: number;
  totalReceivedDonations: number;
  remainingLimit: number;
  levelLimit: number;
  hasRunningRequest: boolean;
  totalDonated: number;
  totalReceived: number;
}

interface Interval {
  label: string;
  value: string;
  days: number;
}

const LEVEL_LIMITS = {
  1: 0,
  2: 1000,
  3: 3000,
  4: 5000,
  5: 10000,
  6: 20000,
  7: 50000,
  8: 100000,
  9: 1000000,
  10: 100000000,
} as const;

export function CreateRequestForm({ 
  createRequest, 
  communityGuidelines, 
  params, 
  userLevel, 
  totalReceivedDonations, 
  remainingLimit, 
  levelLimit,
  hasRunningRequest,
  totalDonated,
  totalReceived
}: CreateRequestFormProps) {
  const [selectedAmount, setSelectedAmount] = useState<number | null>(null);
  const [selectedButtonIndex, setSelectedButtonIndex] = useState<number | null>(null);
  const [editMode, setEditMode] = useState<boolean>(false);
  const [pointsUsed, setPointsUsed] = useState<number | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [json, setJson] = useState<JSONContent | null>(null);
  const [title, setTitle] = useState<string>('');
  const [selectedInterval, setSelectedInterval] = useState<string | null>(null);
  const [customTime, setCustomTime] = useState<string>('');
  const [deadline, setDeadline] = useState<string>('');
  const [currentTab, setCurrentTab] = useState<string>("request");
  const [file, setFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [showLevelError, setShowLevelError] = useState(false);
  const [showLevelRestrictionDialog, setShowLevelRestrictionDialog] = useState(false);
  const [showActiveRequestDialog, setShowActiveRequestDialog] = useState(false);
  
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
  
  // Ensure userLevel is a number and within valid range
  const validUserLevel = typeof userLevel === 'number' && userLevel >= 1 && userLevel <= 10 ? userLevel : 1;
  
  // Calculate the maximum request amount based on net contributions
  console.log('Calculation Debug:', {
    totalDonated,
    totalReceived,
    netAmount: totalDonated - totalReceived,
    requestAmount: calculateRequestAmount(totalDonated || 0, totalReceived || 0),
    maxRequestAmount: calculateMaxRequestAmount(totalDonated || 0, totalReceived || 0)
  });

  const maxRequestAmount = calculateMaxRequestAmount(totalDonated || 0, totalReceived || 0);
  
  // Filter available amounts based on max request amount
  const availableAmounts = numbers.filter(amount => amount <= maxRequestAmount);
  
  console.log('Form Debug:', {
    validUserLevel,
    maxRequestAmount,
    numbers,
    availableAmounts,
  });

  const handleAmountSelect = (amount: number, index: number) => {
    if (validUserLevel === 1) {
      toast({
        title: "Level 1 Restriction",
        description: "You need to reach Level 2 to post help requests.",
        variant: "destructive",
      });
      setShowLevelError(true);
      return;
    }

    if (amount > maxRequestAmount) {
      toast({
        title: "Amount Limit Exceeded",
        description: `You can only request up to ${maxRequestAmount.toLocaleString()} (115% of your request amount)`,
        variant: "destructive",
      });
      setShowLevelError(true);
      return;
    }

    setSelectedAmount(amount);
    setSelectedButtonIndex(index);
    setShowLevelError(false);
    setEditMode(false);
  };
  
  const handleEditClick = () => {
    setEditMode(true);
  };
  
  const handleInputChange = (event: ChangeEvent<HTMLInputElement>) => {
    const amount = parseInt(event.target.value);

    if (validUserLevel === 1) {
      toast({
        title: "Level 1 Restriction",
        description: "You need to reach Level 2 to post help requests.",
        variant: "destructive",
      });
      setShowLevelError(true);
      return;
    }

    if (isNaN(amount) || amount <= 0) {
      setSelectedAmount(null);
      return;
    }

    if (amount > maxRequestAmount) {
      toast({
        title: "Amount Limit Exceeded",
        description: `You can only request up to ${maxRequestAmount.toLocaleString()} (115% of your request amount)`,
        variant: "destructive",
      });
      setShowLevelError(true);
      return;
    }

    setSelectedAmount(amount);
    setShowLevelError(false);
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

  const handleTabChange = (value: string) => {
    if (value === 'time' && !title.trim()) {
      toast({
        title: "Title Required",
        description: "Please enter a title for your request before proceeding.",
        variant: "destructive",
      });
      return;
    }
    setCurrentTab(value);
  };

  const handleNextClick = () => {
    if (!title.trim()) {
      toast({
        title: "Title Required",
        description: "Please enter a title for your request before proceeding.",
        variant: "destructive",
      });
      return;
    }
    if (!json) {
      toast({
        title: "Details Required",
        description: "Please add some details to your request before proceeding.",
        variant: "destructive",
      });
      return;
    }
    setCurrentTab("time");
  };

  // Show appropriate dialog when component mounts
  useEffect(() => {
    if (validUserLevel === 1) {
      setShowLevelRestrictionDialog(true);
    } else if (hasRunningRequest) {
      setShowActiveRequestDialog(true);
    }
  }, [validUserLevel, hasRunningRequest]);

  return (    
    <div className="my-4 sm:my-8 max-w-7xl mx-auto px-2 sm:px-4">
      <Dialog open={showLevelRestrictionDialog} onOpenChange={setShowLevelRestrictionDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Level 1 Restriction</DialogTitle>
            <DialogDescription>
              <div className="mt-4 space-y-4">
                <div className="flex items-center gap-3 text-orange-600">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  <p className="font-medium">You need to reach Level 2 to post help requests.</p>
                </div>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Continue helping others to level up! Contributing to the community will help you gain access to more features.
                </p>
                <div className="flex justify-between items-center pt-4">
                  <Link
                    href="/access-denied"
                    className="text-sm text-primary hover:text-primary/80 transition-colors"
                  >
                    Learn more about access levels
                  </Link>
                  <Link
                    href="/"
                    className="px-4 py-2 bg-primary text-white rounded-xl hover:bg-primary/90 transition-colors text-sm"
                  >
                    Back to Home
                  </Link>
                </div>
              </div>
            </DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>

      <Dialog open={showActiveRequestDialog} onOpenChange={setShowActiveRequestDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Active Request Found</DialogTitle>
            <DialogDescription>
              <div className="mt-4 space-y-4">
                <div className="flex items-center gap-3 text-orange-600">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  <p className="font-medium">You already have an active request.</p>
                </div>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Please wait for your current request to be completed before creating a new one. This helps ensure fair distribution of help within the community.
                </p>
                <div className="flex justify-between items-center pt-4">
                  <Link
                    href="/access-denied"
                    className="text-sm text-primary hover:text-primary/80 transition-colors"
                  >
                    Learn more about request limits
                  </Link>
                  <Link
                    href="/"
                    className="px-4 py-2 bg-primary text-white rounded-xl hover:bg-primary/90 transition-colors text-sm"
                  >
                    Back to Home
                  </Link>
                </div>
              </div>
            </DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>

      {validUserLevel > 1 && !hasRunningRequest ? (
        <>
          <div className="mb-8 space-y-4">
            <Dialog>
              <DialogTrigger asChild>
                <div className="p-4 bg-blue-50 border border-blue-100 rounded-xl text-blue-800 cursor-pointer hover:bg-blue-100 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
                      </svg>
                      <h3 className="font-semibold">Request Amount Limit</h3>
                    </div>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="mt-2">
                    <p className="text-sm font-medium text-blue-800 dark:text-blue-300">
                      Request Amount (111%): KES {calculateRequestAmount(totalDonated || 0, totalReceived || 0).toLocaleString()}
                    </p>
                  </div>
                </div>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Request Amount Details</DialogTitle>
                  <DialogDescription>
                    <div className="mt-4 space-y-3">
                      <div className="flex justify-between text-sm">
                        <span>Total Donated:</span>
                        <span className="font-medium">KES {(totalDonated || 0).toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Total Received:</span>
                        <span className="font-medium">KES {(totalReceived || 0).toLocaleString()}</span>
                      </div>
                      <Separator className="my-2" />
                      <div className="flex justify-between text-sm">
                        <span>Net Amount:</span>
                        <span className="font-medium">KES {((totalDonated || 0) - (totalReceived || 0)).toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between text-sm text-primary">
                        <span>Request Amount (111%):</span>
                        <span className="font-medium">KES {calculateRequestAmount(totalDonated || 0, totalReceived || 0).toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between text-sm text-primary">
                        <span>Maximum Allowed (115%):</span>
                        <span className="font-medium">KES {maxRequestAmount.toLocaleString()}</span>
                      </div>
                      <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                        <p className="text-xs text-blue-800">
                          Your request amount is calculated as 111% of your net contributions (total donated minus total received).
                          The maximum allowed amount is 115% of your request amount.
                        </p>
                      </div>
                    </div>
                  </DialogDescription>
                </DialogHeader>
              </DialogContent>
            </Dialog>

            <Dialog>
              <DialogTrigger asChild>
                <div className="p-4 bg-green-50 border border-green-100 rounded-xl text-green-800 cursor-pointer hover:bg-green-100 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M4 4a2 2 0 00-2 2v4a2 2 0 002 2V6h10a2 2 0 00-2-2H4zm2 6a2 2 0 012-2h8a2 2 0 012 2v4a2 2 0 01-2 2H8a2 2 0 01-2-2v-4zm6 4a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                      </svg>
                      <h3 className="font-semibold">Total Received Donations</h3>
                    </div>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="mt-2">
                    <p className="text-sm">You have received {totalReceivedDonations.toLocaleString()} in total donations</p>
                  </div>
                </div>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Donation History</DialogTitle>
                  <DialogDescription>
                    <div className="mt-4 space-y-3">
                      <div className="flex justify-between text-sm">
                        <span>Total Received:</span>
                        <span className="font-medium">KES {totalReceivedDonations.toLocaleString()}</span>
                      </div>
                      <div className="mt-4 p-3 bg-green-50 rounded-lg">
                        <p className="text-xs text-green-800">
                          This represents the total amount of donations you have received from the community.
                          These donations contribute to your overall platform activity and help determine your request limits.
                        </p>
                      </div>
                    </div>
                  </DialogDescription>
                </DialogHeader>
              </DialogContent>
            </Dialog>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:gap-8 lg:grid-cols-3">
            <div className="h-fit rounded-2xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl lg:col-span-2 p-4 sm:p-8 shadow-lg border border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-3 mb-4 sm:mb-8">
                <div className="h-10 w-1 bg-primary rounded-full" />
                <h1 className='text-xl font-semibold'> 
                  Creating Request in <Link href={`/c/${params.id}`} className='text-primary hover:text-primary/80 transition-colors'>
                    {params.id}
                  </Link>
                </h1>
              </div>
              
              <Tabs value={currentTab} defaultValue="request" className="w-full" onValueChange={setCurrentTab}>
                <TabsList className='grid w-full grid-cols-2 sm:grid-cols-4 p-1.5 bg-slate-100 dark:bg-slate-800/50 rounded-2xl gap-1'>
                  <TabsTrigger value='request' className="data-[state=active]:bg-white dark:data-[state=active]:bg-slate-950 data-[state=active]:text-primary data-[state=active]:shadow-md rounded-xl transition-all duration-200">
                    <div className='flex items-center gap-2 py-1'>
                      <TextIcon className='h-4 w-4' />
                      <span>Text</span>
                    </div>
                  </TabsTrigger>
                  
                  <TabsTrigger value='time' className="data-[state=active]:bg-white dark:data-[state=active]:bg-slate-950 data-[state=active]:text-primary data-[state=active]:shadow-md rounded-xl transition-all duration-200">
                    <div className='flex items-center gap-2 py-1'>
                      <VideoIcon className='h-4 w-4' />
                      <span>Time</span>
                    </div>
                  </TabsTrigger>
                  
                  <TabsTrigger value='requestAmount' className="data-[state=active]:bg-white dark:data-[state=active]:bg-slate-950 data-[state=active]:text-primary data-[state=active]:shadow-md rounded-xl transition-all duration-200">
                    <div className='flex items-center gap-2 py-1'>
                      <HandCoins className='h-4 w-4' />
                      <span>Amount</span>
                    </div>
                  </TabsTrigger>
                  
                  <TabsTrigger value='image' className="data-[state=active]:bg-white dark:data-[state=active]:bg-slate-950 data-[state=active]:text-primary data-[state=active]:shadow-md rounded-xl transition-all duration-200">
                    <div className='flex items-center gap-2 py-1'>
                      <ListEnd className='h-4 w-4' />
                      <span>Image</span>
                    </div>
                  </TabsTrigger>
                </TabsList>
                
                <div className="mt-8">
                  <TabsContent value='request'>
                    <Card className="border-none shadow-lg bg-white dark:bg-slate-900 rounded-2xl">
                      <CardHeader className="space-y-6">
                        <div className="space-y-2">
                          <Label className="text-base font-medium">Request Title</Label>
                          <Input 
                            required 
                            name='title' 
                            placeholder='Enter the Title of Your Request Here' 
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            className="h-12 text-base rounded-xl focus:ring-2 focus:ring-primary/20"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-base font-medium">Request Details</Label>
                          <div className="rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700">
                            <TipTapEditor setJson={setJson} json={json} />
                          </div>
                        </div>
                      </CardHeader>
                      <CardFooter className="pt-4">
                        <div className='ml-auto'>
                          <SubmitButton 
                            ButtonName='Next'
                            onClick={handleNextClick}
                            type="button"
                          />
                        </div>
                      </CardFooter>
                    </Card>
                  </TabsContent>
                  
                  <TabsContent value='time'>
                    <Card className="border-none shadow-lg bg-white dark:bg-slate-900 rounded-2xl">
                      <CardHeader>
                        <div className="space-y-8">
                          <div className="text-center space-y-2">
                            <h1 className='text-2xl font-semibold'>Request Duration</h1>
                            <p className="text-slate-500 dark:text-slate-400">How long should your request remain active?</p>
                          </div>
                          <div className="grid grid-cols-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2 sm:gap-3">
                            {intervals.map((interval, index) => (
                              <button
                                key={index}
                                onClick={() => handleIntervalSelect(interval.value)}
                                className={`px-2 sm:px-4 py-2.5 sm:py-3 text-sm font-medium rounded-xl transition-all duration-200 ${
                                  selectedInterval === interval.value 
                                    ? 'bg-primary/10 text-primary ring-2 ring-primary/20' 
                                    : 'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-900 dark:text-slate-100'
                                }`}
                              >
                                {interval.label}
                              </button>
                            ))}
                          </div>
                          {selectedInterval === 'custom' && (
                            <div className="flex flex-col sm:flex-row gap-3 items-center p-4 sm:p-6 rounded-xl bg-slate-100 dark:bg-slate-800">
                              <Input
                                type="number"
                                value={customTime}
                                onChange={handleCustomTimeChange}
                                placeholder="Enter days"
                                className="text-center rounded-xl w-full sm:w-auto"
                              />
                              <button
                                onClick={handleCustomTimeSubmit}
                                className="px-6 py-2.5 bg-primary text-white rounded-xl hover:bg-primary/90 transition-colors w-full sm:w-auto"
                              >
                                Set
                              </button>
                            </div>
                          )}
                          {deadline && (
                            <div className="flex justify-center">
                              <div className='inline-flex items-center gap-3 px-6 py-3 bg-primary/10 text-primary rounded-xl'>
                                <span className="font-medium">Deadline:</span>
                                <span>{deadline}</span>
                              </div>
                            </div>
                          )}
                        </div>
                      </CardHeader>
                      <CardFooter className="pt-4">
                        <div className='ml-auto'>
                          <SubmitButton 
                            ButtonName='Next'
                            onClick={() => setCurrentTab('requestAmount')}
                            type="button"
                          />
                        </div>
                      </CardFooter>
                    </Card>
                  </TabsContent>
                  
                  <TabsContent value='requestAmount'>
                    <Card className="border-none shadow-lg bg-white dark:bg-slate-900 rounded-2xl">
                      <CardHeader>
                        <div className="space-y-8">
                          <div className="text-center space-y-2">
                            <h2 className='text-2xl font-semibold'>Request Amount</h2>
                            <p className="text-slate-500 dark:text-slate-400">Choose how much help you need</p>
                          </div>
                          <div className="grid grid-cols-2 xs:grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2 sm:gap-3">
                            {availableAmounts.length > 0 ? (
                              availableAmounts.map((number, index) => (
                                <button
                                  key={index}
                                  type="button"
                                  onClick={() => handleAmountSelect(number, index)}
                                  className={`px-3 sm:px-4 py-2.5 sm:py-3 text-sm font-medium rounded-xl transition-all duration-200 ${
                                    selectedButtonIndex === index 
                                      ? 'bg-primary/10 text-primary ring-2 ring-primary/20' 
                                      : 'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-900 dark:text-slate-100'
                                  }`}
                                >
                                  {number.toLocaleString()}
                                </button>
                              ))
                            ) : (
                              <div className="col-span-full text-center space-y-2 text-slate-500 dark:text-slate-400 py-4">
                                <p>No amounts available for your current level</p>
                                {maxRequestAmount === 0 && (
                                  <p className="text-sm text-orange-600">
                                    You have reached your level limit with active requests. 
                                    Wait for your current requests to be funded or closed before creating new ones.
                                  </p>
                                )}
                              </div>
                            )}
                            {validUserLevel > 1 && (
                              <button
                                type="button"
                                onClick={handleEditClick}
                                className="px-4 py-3 bg-orange-500/10 text-orange-600 rounded-xl hover:bg-orange-500/20 transition-colors font-medium"
                              >
                                Custom
                              </button>
                            )}
                          </div>
                          {showLevelError && (
                            <div className="text-center text-red-500 text-sm">
                              Please select an amount within your level's limit.
                            </div>
                          )}
                          <div className="flex justify-center">
                            {editMode ? (
                              <div className="bg-slate-100 dark:bg-slate-800 p-6 rounded-xl">
                                <Input
                                  type="number"
                                  className="max-w-[200px] text-center rounded-xl"
                                  value={selectedAmount ?? ''}
                                  onChange={handleInputChange}
                                  name='amount'
                                  placeholder="Enter amount"
                                />
                              </div>
                            ) : (
                              selectedAmount !== null && (
                                <div className="text-center space-y-3 bg-slate-100 dark:bg-slate-800 px-8 py-6 rounded-xl">
                                  <div className="text-3xl font-bold text-primary">
                                    {selectedAmount.toLocaleString()}/=
                                  </div>
                                  <div className="text-sm text-slate-500 dark:text-slate-400 font-medium">
                                    ({Math.floor(selectedAmount / 40)} points)
                                  </div>
                                </div>
                              )
                            )}
                          </div>
                        </div>
                      </CardHeader>
                      <CardFooter className="pt-4">
                        <div className='ml-auto'>
                          <SubmitButton 
                            ButtonName='Next'
                            onClick={() => setCurrentTab('image')}
                            type="button"
                          />
                        </div>
                      </CardFooter>
                    </Card>
                  </TabsContent>
                  
                  <TabsContent value='image'>
                    <Card className="border-none shadow-lg bg-white dark:bg-slate-900 rounded-2xl">
                      <form action={createRequestFitrii}>
                        <input type='hidden' name='imageUrl' value={imageUrl ?? undefined}/>
                        <input type='hidden' name='communityName' value={params.id} /> 
                        <input type='hidden' name='amount' value={selectedAmount ?? undefined} />
                        <input type='hidden' name='jsonContent' value={JSON.stringify(json)} />
                        <input type='hidden' name='pointsUsed' value={pointsUsed ?? undefined} />
                        <input type='hidden' name='deadline' value={deadline ?? undefined} />
                        <input type='hidden' name='title' value={title} />
                        <CardHeader>
                          <div className="space-y-8">
                            <div className="text-center space-y-2">
                              <h2 className='text-2xl font-semibold'>Request Image</h2>
                              <p className="text-slate-500 dark:text-slate-400">Add an image to support your request</p>
                            </div>
                            <div className="bg-slate-100 dark:bg-slate-800 p-4 sm:p-8 rounded-2xl">
                              {imageUrl === null ? (
                                <div className="space-y-4 sm:space-y-6">
                                  <div className="flex justify-center">
                                    <label className="group flex flex-col items-center gap-3 sm:gap-4 cursor-pointer">
                                      <div className="p-4 sm:p-6 rounded-2xl bg-primary/10 group-hover:bg-primary/20 transition-colors">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 sm:h-12 w-8 sm:w-12 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                        </svg>
                                      </div>
                                      <div className="text-center">
                                        <span className="text-base font-medium text-primary">Click to upload image</span>
                                        <p className="text-sm text-slate-500 dark:text-slate-400">PNG, JPG up to 10MB</p>
                                      </div>
                                      <input 
                                        type="file" 
                                        onChange={handleFileChange}
                                        accept="image/*" 
                                        className="hidden"
                                      />
                                    </label>
                                  </div>
                                  {uploadProgress > 0 && (
                                    <div className="space-y-3 max-w-md mx-auto">
                                      <div className="h-1 w-full bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                                        <div 
                                          className="h-full bg-primary transition-all duration-300 rounded-full"
                                          style={{ width: `${uploadProgress}%` }}
                                        />
                                      </div>
                                      <p className="text-sm text-slate-500 dark:text-slate-400 text-center font-medium">
                                        {Math.round(uploadProgress)}% uploaded
                                      </p>
                                    </div>
                                  )}
                                </div>
                              ) : (
                                <div className="space-y-4">
                                  <div className="relative group rounded-2xl overflow-hidden">
                                    <Image 
                                      src={imageUrl}
                                      alt="Uploaded Image"
                                      width={400}
                                      height={300}
                                      className="w-full h-[200px] sm:h-[300px] md:h-[400px] object-cover"
                                    />
                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                      <button
                                        type="button"
                                        onClick={() => setImageUrl(null)}
                                        className="p-2 bg-red-500 text-white rounded-xl hover:bg-red-600 transition-colors"
                                      >
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                        </svg>
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        </CardHeader>
                        <CardFooter className="flex justify-end pt-6">
                          <SubmitButton ButtonName='Publish Request' />
                        </CardFooter>
                      </form>
                    </Card>
                  </TabsContent>
                </div>
              </Tabs>
            </div>
            
            <div className="rounded-2xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl p-4 sm:p-8 shadow-lg border border-slate-100 dark:border-slate-800 h-fit">
              <div className='flex items-center gap-3 sm:gap-4 mb-6 sm:mb-8'>
                <div className="relative w-12 sm:w-16 h-12 sm:h-16 rounded-2xl overflow-hidden shadow-lg">
                  <Image
                    src={'/help.png'}
                    fill
                    alt={'help'}
                    className="object-cover"
                  />
                </div>
                <div>
                  <h2 className='text-2xl font-semibold'>Guidelines</h2>
                  <p className="text-slate-500 dark:text-slate-400 text-sm">Follow these rules when posting</p>
                </div>
              </div>
              
              <div className="space-y-4">
                {communityGuidelines.map((item) => (
                  <div key={item.id} className="p-5 bg-slate-100 dark:bg-slate-800 rounded-xl">
                    <div className='text-sm space-y-1'>
                      <div className="flex items-center gap-2 text-primary font-medium mb-2">
                        <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/10">
                          {item.id}
                        </span>
                        Guideline {item.id}
                      </div>
                      <p className="text-slate-600 dark:text-slate-300">{item.text}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      ) : (
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center space-y-4">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-orange-100 text-orange-600">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <h2 className="text-2xl font-semibold">Access Restricted</h2>
            <p className="text-slate-600 dark:text-slate-400 max-w-md">
              {validUserLevel === 1 
                ? "You need to reach Level 2 to create help requests. Keep contributing to the community!" 
                : "You have an active request. Please wait for it to complete before creating a new one."}
            </p>
            <Link
              href="/"
              className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-xl hover:bg-primary/90 transition-colors"
            >
              Return to Home
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
