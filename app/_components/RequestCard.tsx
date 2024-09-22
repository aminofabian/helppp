
// RequestCard.tsx
import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { BadgeCheck, BookmarkIcon, Clock, MessageCircleIcon, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogClose, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import Slider from './Slider';
import Counter from './Counter';
import { DateDifference } from "./DateDifference";
import CopyLink from './CopyLink';
import RenderToJson from './RenderToJson';
import MpesaPay from './MpesaPay';
import { VoteButtons } from './VoteButtons';
import { ClientAvatar } from './ClientAvatar';



interface RequestCardProps {
  id: string;
  title: string;
  amount: number;
  jsonContent?: any;
  textContent?: any; 
  imageString?: string;
  createdAt: string | Date;
  deadline: string | Date;
  updatedAt?: Date | string;
  userName: string;
  communityName: string;
  userId: string;
  voteCount1: number;
  voteCount2: number;
  level?: number;
  commentCount?: number;
  pointsUsed?: number;
}

export function RequestCard({
  id,
  title,
  amount,
  jsonContent,
  imageString,
  createdAt,
  deadline,
  userName,
  communityName,
  userId,
  voteCount1,
  voteCount2,
  commentCount = 0,
  level = 1,
}: RequestCardProps) {
  return (
    <Card className="w-full mx-auto space-y-4 border border-primary/20 rounded-lg shadow-md relative my-5 sm:my-10 p-4 sm:p-6 transition-all duration-300 hover:shadow-lg bg-white dark:bg-gray-800">
    <div className='flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4'>
    <Link href={`/c/${communityName}`} className='text-primary hover:underline uppercase text-xs font-semibold'>
    c/{communityName.replace(/_/g, ' ')}
    </Link>
    <div className="text-xs font-medium bg-primary/10 text-primary px-3 py-1 rounded-full flex items-center mt-2 sm:mt-0">
    <Clock className="w-4 h-4 mr-1" />
    <Counter 
    deadline={new Date(deadline)} 
    createdAt={new Date(createdAt)} 
    />
    </div>
    </div>
    
    <div className="flex items-center space-x-3 mb-4">
    <div className="relative inline-block">
    <ClientAvatar className="w-12 h-12 border-2 border-primary rounded-full" />
    <span className='absolute bottom-0 right-0 bg-primary text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center border-2 border-white z-10'>{level || 1}</span>
    </div>
    
    <div className="flex flex-col">
    <Link href={`/user/${userId}`} className="text-sm font-medium hover:text-primary transition-colors">
    {userName}
    </Link>
    <div className="flex items-center text-xs text-gray-500 dark:text-gray-400">
    <BadgeCheck className="w-4 h-4 mr-1 text-primary" />
    <DateDifference 
    createdAt={new Date(createdAt)} 
    deadline={new Date(deadline)} 
    />
    </div>
    </div>
    </div>
    
    <Link href={`/request/${id}`} className="block mb-4 group">
    <h2 className="text-lg font-semibold mb-2 group-hover:text-primary transition-colors capitalize">{title}</h2>
    <p className="text-sm text-gray-600 dark:text-gray-400">
    Someone pitched in <span className="font-semibold text-primary">{amount}/=</span> for {userName}
    </p>
    </Link>
    
    {imageString && (
      <Image
      src={imageString}
      alt="Request image"
      width={350}
      height={150}
      layout="responsive"
      className='rounded-lg border border-primary/20 mb-4'
      />
    )}
    
    <div className="mb-4 tracking-wide leading-7 text-sm dark:text-gray-300">
    {jsonContent && <RenderToJson data={jsonContent} />}
    </div>
    
    <div className="flex flex-wrap justify-between items-center mb-6 pb-4 border-b border-gray-200 dark:border-gray-700">
    <VoteButtons
    initialVoteCount1={voteCount1}
    initialVoteCount2={voteCount2}
    requestId={id}
    />
    
    <div className="flex space-x-2 mt-2 sm:mt-0">
    <Link href={`/request/${id}`} passHref>
    <Button size='sm' variant='outline' className="flex items-center space-x-1 hover:bg-primary/10">
    <MessageCircleIcon className="w-4 h-4" />
    <span>{commentCount}</span>
    </Button>
    </Link>
    
    <Button variant="outline" size="sm" className="hover:bg-primary/10">
    <BookmarkIcon className="w-4 h-4" />
    </Button>
    
    <CopyLink id={id} />
    </div>
    </div>
    
    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
    <div className="flex items-center mb-2 sm:mb-0">
    <Users className="w-5 h-5 text-primary mr-2" />
    <span className="text-sm font-medium">12 folks chipped in</span>
    <div className="flex -space-x-2 ml-2">
    <div className="flex items-center justify-center w-8 h-8 text-xs font-semibold text-white bg-primary rounded-full border-2 border-white">
    +3
    </div>
    </div>
    </div>
    <span className="text-sm font-medium bg-primary text-white px-4 py-1 rounded-full">
    Amount Requested: {amount}/=
    </span>
    </div>
    
    <div className="mb-6">
    <h3 className="text-lg font-semibold mb-2 text-primary">Progress</h3>
    <div className="flex items-center justify-between mb-2">
    <span className="text-sm font-medium">KES 700 raised</span>
    <span className="text-sm font-medium">KES {amount} target</span>
    </div>
    <Slider amount={amount} />
    </div>
    
    <div className="text-center">
    <Dialog>
    <DialogTrigger asChild>
    <Button variant="default" className="w-full bg-primary hover:bg-primary-dark text-white font-semibold py-2 px-4 rounded-full transition-colors duration-300">Help Now</Button>
    </DialogTrigger>
    <DialogContent className="sm:max-w-6xl">
    <DialogHeader>
    <DialogTitle className="text-primary mx-auto text-2xl font-bold">SELECT AN AMOUNT</DialogTitle>
    <DialogDescription>
    <MpesaPay requestId={id} />
    </DialogDescription>
    </DialogHeader>
    <DialogFooter>
    <DialogClose>
    <Button type="button" variant="outline" className="hover:bg-primary/10">
    Cancel
    </Button>
    </DialogClose>
    </DialogFooter>
    </DialogContent>
    </Dialog>
    </div>
    </Card>
  );
}
