import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { BadgeCheck, BookmarkIcon, Clock, MessageCircleIcon, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogClose, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import Slider from './Slider';
import Counter from './Counter';
import CopyLink from './CopyLink';
import MpesaPay from './MpesaPay';
import { VoteButtons } from './VoteButtons';
import { ClientAvatar } from './ClientAvatar';
import RenderToJson from './RenderToJson';


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
  textContent,
  imageString,
  createdAt,
  deadline,
  updatedAt,
  userName,
  communityName,
  userId,
  voteCount1,
  voteCount2,
  level = 1,
  commentCount = 0,
  pointsUsed,
}: RequestCardProps) {
  
  
  
  return (
    <Card className="w-full max-w-xl mx-auto border border-green-50/20 rounded-lg shadow-lg hover:shadow-md transition-shadow duration-300 bg-white dark:bg-gray-800 overflow-hidden my-10">
    <div className="p-4">
    <div className="flex justify-between items-center mb-2">
    <Link href={`/c/${communityName}`} className="text-primary hover:underline text-xs font-semibold">
    c/{communityName.replace(/_/g, ' ')}
    </Link>
    <div className="text-xs font-medium bg-primary/10 text-primary px-2 py-1 rounded-full flex items-center">
    <Clock className="w-3 h-3 mr-1" />
    <Counter 
    deadline={new Date(deadline)} 
    createdAt={new Date(createdAt)} 
    />
    </div>
    </div>
    
    <Link href={`/request/${id}`} className="block group">
    <h2 className="text-base font-semibold mb-1 group-hover:text-primary transition-colors line-clamp-2">{title}</h2>
    </Link>
    
    <div className="flex items-center space-x-2 mb-2">
    <ClientAvatar className="w-6 h-6 rounded-full" />
    <Link href={`/user/${userId}`} className="text-sm hover:text-primary transition-colors">
    <p className="text-sm text-gray-600 dark:text-gray-400">
    {userName} pitched in <span className="font-semibold text-primary">{amount}/=</span> for {userName}
    </p>
    </Link>
    <BadgeCheck className="w-4 h-4 text-primary" />
    <span className="text-xs bg-primary/10 text-primary px-1 py-0.5 rounded">Lvl {level}</span>
    </div>
    
    {imageString && (
      <Image
      src={imageString}
      alt="Request image"
      width={100}
      height={50}
      layout="responsive"
      className="rounded-md mb-2"
      />
    )}
    
    {jsonContent && <RenderToJson data={jsonContent} />}
    
    <div className="flex justify-between items-center mb-2">
    <VoteButtons
    initialVoteCount1={voteCount1}
    initialVoteCount2={voteCount2}
    requestId={id}
    />
    <div className="flex space-x-2">
    <Link href={`/request/${id}`} passHref>
    <Button size="sm" variant="outline" className="flex items-center space-x-1 p-1">
    <MessageCircleIcon className="w-4 h-4" />
    <span className="text-xs">{commentCount}</span>
    </Button>
    </Link>
    <Button variant="outline" size="sm" className="p-1">
    <BookmarkIcon className="w-4 h-4" />
    </Button>
    <CopyLink id={id} />
    </div>
    </div>
    
    <div className="mb-2">
    <Slider amount={amount} />
    </div>
    
    <div className="flex justify-between items-center text-sm">
    <span className="font-medium">KES {amount} target</span>
    <div className="flex items-center">
    <Users className="w-4 h-4 text-primary mr-1" />
    <span className="text-primary font-semibold">12 contributors</span>
    </div>
    </div>
    
    {pointsUsed && (
      <div className="mt-2 text-xs text-gray-500">
      Points used: {pointsUsed}
      </div>
    )}
    </div>
    
    <Dialog>
    <DialogTrigger asChild>
    <Button variant="default" className="w-full bg-primary hover:bg-primary-dark text-white font-semibold py-2 rounded-none">Help Now</Button>
    </DialogTrigger>
    <DialogContent className="w-full">
    <DialogHeader>
    <DialogTitle>Contribute to this request</DialogTitle>
    <DialogDescription>
    Choose an amount to contribute
    </DialogDescription>
    </DialogHeader>
    <MpesaPay requestId={id} />
    <DialogFooter>
    <DialogClose asChild>
    <Button type="button" variant="outline">Cancel</Button>
    </DialogClose>
    </DialogFooter>
    </DialogContent>
    </Dialog>
    </Card>
  );
}

export default RequestCard;
