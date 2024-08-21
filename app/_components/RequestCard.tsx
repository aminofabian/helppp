import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { BadgeCheck, BookmarkIcon, MessageCircleIcon, Timer } from 'lucide-react';
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
import Avatar, { genConfig } from 'react-nice-avatar'


interface RequestCardProps {
  id: string;
  title: string;
  amount: number;
  jsonContent?: any; // Consider using a more specific type if possible
  imageString?: string;
  createdAt: string | Date;
  deadline: string | Date;
  userName: string;
  communityName: string;
  userId: string;
  voteCount1: number;
  voteCount2: number;
  commentCount: number;
  level: number;
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
  commentCount,
  level,
}: RequestCardProps) {
  const config = genConfig() 
  
  return (
    <Card className="w-full mx-auto space-y-4 sm:space-y-7 border border-secondary rounded-lg shadow-md relative my-5 sm:my-10 p-3 sm:p-6 transition-all duration-300 hover:shadow-lg">
    <div className='flex flex-col sm:flex-row justify-between items-start sm:items-center mb-2 sm:mb-4'>
    <h1 className='text-sm font-medium mb-2 sm:mb-0'>
    <Link href={`/c/${communityName}`} className='text-primary hover:underline uppercase text-xs'>c/{communityName.replace(/_/g, ' ')}</Link>
    </h1>
    <div className="text-sm font-extralight bg-gray-100 dark:bg-gray-800 px-3 py-1 rounded-full">
    <Counter 
    deadline={new Date(deadline)} 
    createdAt={new Date(createdAt)} 
    />
    </div>
    </div>
    
    <div className="flex items-center space-x-3 mb-4">
    <div className="relative inline-block">
    
    <Avatar style={{ width: '2.5rem', height: '2.5rem' }} {...config} />
    
    {/* <Image
      src="https://source.unsplash.com/75x75/?portrait"
      alt={`${userName}'s avatar`}
      width={48}
      height={48}
      className="rounded-full border-2 border-primary"
      /> */}
      <span className='absolute bottom-0 right-0 bg-primary text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center border-2 border-white z-10'>  {level || 1}</span>
      </div>
      
      <div className="flex flex-col">
      <Link href={`/user/${userId}`} className="text-base sm:text-sm font-light hover:text-primary">
      {userName}
      </Link>
      <div className="flex items-center text-xs sm:text-sm text-gray-500">
      <BadgeCheck className="w-4 h-4 mr-1 text-primary" />
      
      
      <DateDifference 
      createdAt={new Date(createdAt)} 
      deadline={new Date(deadline)} 
      />
      
      </div>
      </div>
      </div>
      
      <Link href={`/request/${id}`} className="block mb-2 sm:mb-4">
      <h2 className="text-md sm:text-md font-semibold mb-1 sm:mb-2 hover:text-primary transition-colors capitalize">{title}</h2>
      <p className="text-xs text-gray-600">
      Someone pitched in {amount}/= for {userName}
      </p>
      </Link>
      
      {imageString && (
        <Image
        src={imageString}
        alt="Request image"
        width={350}
        height={150}
        layout="responsive"
        className='rounded-lg border border-secondary mb-2 sm:mb-4'
        />
      )}
      
      <div className="mb-1 sm:mb-1 tracking-wide leading-7 text-xs dark:text-slate-100">
      {jsonContent && <RenderToJson data={jsonContent} />}
      </div>
      
      <div className="flex flex-wrap justify-between items-center mb-3 sm:mb-6 pb-2 sm:pb-4 border-b border-gray-200 dark:border-gray-700">
      <VoteButtons
      initialVoteCount1={voteCount1}
      initialVoteCount2={voteCount2}
      requestId={id}
      />
      
      <div className="flex space-x-2 mt-2 sm:mt-0">
      <Link href={`/request/${id}`} passHref>
      <Button size='sm' variant='secondary' className="flex items-center space-x-1">
      <MessageCircleIcon className="w-4 h-4" />
      <span>{commentCount}</span>
      </Button>
      </Link>
      
      <Button variant="secondary" size="sm">
      <BookmarkIcon className="w-4 h-4" />
      </Button>
      
      <CopyLink id={id} />
      </div>
      </div>
      
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-3 sm:mb-6">
      <div className="flex items-center mb-2 sm:mb-0">
      <span className="text-xs font-medium mr-2">12 folks chipped in</span>
      <div className="flex -space-x-2">
      <div className="flex items-center justify-center w-8 h-8 text-xs font-semibold text-white bg-primary rounded-full border-2 border-white">
      +3
      </div>
      </div>
      </div>
      <span className="text-sm font-medium bg-primary text-white px-3 py-1 rounded-full">
      Amount Requested: {amount}
      </span>
      </div>
      
      <div className="mb-3 sm:mb-6">
      <h3 className="text-base sm:text-lg font-semibold mb-2">Progress</h3>
      <div className="flex items-center justify-between mb-2">
      <span className="text-sm font-medium">KES 700 raised</span>
      <span className="text-sm font-medium">KES {amount} target</span>
      </div>
      <Slider amount={amount} />
      </div>
      
      <div className="text-center">
      <Dialog>
      <DialogTrigger asChild>
      <Button variant="default" className="w-full">Help Now</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-6xl">
      <DialogHeader>
      <DialogTitle className="text-primary mx-auto">SELECT AN AMOUNT</DialogTitle>
      <DialogDescription>
      <MpesaPay requestId={id} />
      </DialogDescription>
      </DialogHeader>
      <DialogFooter>
      <DialogClose>
      <Button type="button" variant="outline">
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
  