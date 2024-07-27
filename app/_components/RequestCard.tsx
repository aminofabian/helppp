import React from 'react';

import Image from 'next/image';
import { BadgeCheck, Bookmark, HandHeart, MessageCircleHeart, Repeat2, HeartOff, TimerIcon, TimerOffIcon, Timer, Bell, AlertCircle } from 'lucide-react';
import Slider from './Slider';
import Counter from './Counter';
import { Button } from '@/components/ui/button';
import prisma from '../lib/db';


import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogClose,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

import MpesaPay from './MpesaPay';
import DateDifference from './DateDifference';
import Link from 'next/link';
import CopyLink from './CopyLink';
import { handleVote } from '../actions';
import { LOVE, SUSPISION } from './SubmitButtons';
import RenderToJson from './RenderToJson';
import { Card } from '@/components/ui/card';
import { getKindeServerSession } from '@kinde-oss/kinde-auth-nextjs/server';


export async function getLevelData(userId: string) {
  const user = await prisma.user.findFirst({
    where: { id: userId },
    select: {
      level: true,
    },
  });
  return user;
}



export async function RequestCard({
  id,
  title,
  amount,
  textContent,
  jsonContent,
  imageString,
  createdAt,
  updatedAt,
  deadline,
  userName,
  communityName,
  pointsUsed,
  userId,
  voteCount1,
  commentCount,
  voteCount2 }: {
        id: string
    title: string
    userId: string
    amount: number
    textContent: any
    jsonContent: any
    imageString: string
    createdAt: Date
    updatedAt: Date
    deadline: Date
    userName: string
    communityName: string
    pointsUsed: number
    voteCount1: number
    voteCount2: number
    commentCount: number
  })
  
  
  {
    const { getUser } = getKindeServerSession();
    
    const kindeUser = await getUser();
    
    
    let userLevel;
    const userData = await getLevelData(userId);
    userLevel = userData?.level;
    
    return (
      <div>
      <Card className="w-full mx-auto space-y-7 border border-secondary rounded-md relative pr-3 my-10 py-5 px-2" >
      <div className='flex flex-col justify-center w-full flex-warp h-20' key={id}>
      <h1 className='hidden sm:block font-normal mx-5 my-2 text-sm w-fit'> c/ <Link href={`/c/${communityName}`} className='text-primary'>{communityName}</Link> </h1>
      <div className="md:tracking md:text-sm ml-auto absolute top-3 right-3 px-5 py-2 rounded-md mx-2">
      <Counter deadline={deadline} createdAt={createdAt} />
      </div>
      </div>
      <div className="space-y-1 dark:bg-gray-800 dark:text-gray-50 pr-3">
      <div className="space-y-1">
      <div className="flex flex-col items-start justify-between w-full md:flex-row md:items-center dark:text-gray-400">
      
      <div className="flex items-center md:space-x-2">
      <div className="flex items-stretch">
      <Image
      src="https://source.unsplash.com/75x75/?portrait"
      alt={'my image'}
      width={40}
      height={40}
      className="border rounded-full dark:bg-gray-500 dark:border-gray-700 self-baseline"
      /><span className='relative border border-secondary rounded-full text-xs text-white bg-primary top-4 right-4 h-4 w-4 self-center text-center'>{userLevel}</span>
      </div>
      <div className="text-sm flex hover:text-primary cursor-pointer">
      <a href={`/user/${userId}`}>
      {userName}
      </a>
      <span className="inline-flex items-center justify-center rounded-full bg-purple-100 py-0.5 text-purple-700 dark:bg-slate-800 dark:text-slate-50 dark:border-slate-50">
      
      <BadgeCheck className="pr-2" />
      {/* <p className="whitespace-nowrap text-sm">Level 3</p> */}
      </span>
      <a href={`/request/${id}`}>
      <DateDifference createdAt={createdAt} deadline={deadline} />
      </a>
      </div>
      </div>
      <p className="flex-shrink-0 mt-3 text-sm md:mt-0">
      <span className="whitespace-nowrap rounded-full bg-purple-100 px-2.5 py-0.5 text-sm text-purple-700 dark:bg-slate-800 dark:text-slate-50 border dark:border-purple-700">
      Amount Requested: {amount}
      </span>
      </p>
      </div>
      </div>
      <div className="dark:text-gray-100">
      
      <div className="mx-auto sm:px-3 dark:bg-gray-100 dark:text-gray-800">
      <div className="flex flex-col w-full mx-auto overflow-hidden rounded">
      
      <div className="p-3 m-2 mx-auto mt-1 sm:px-3 sm:mx-5 lg:rounded-md dark:bg-gray-50">
      <div className="space-y-2">
      <a rel="noopener noreferrer" href="#" className=" text-lg font-semibold sm:text-xl">{title}</a>
      <p className="text-xs dark:text-gray-600 text-primary"> {kindeUser?.family_name} pitched in   <a rel="noopener noreferrer" href="#" className="text-xs hover:underline">{amount}/= for { userName}</a>
      </p>
      </div>
      <div className="dark:text-gray-800">
      <div className='tracking-normal mt-2'>    {jsonContent && <RenderToJson data={jsonContent} />}
      </div>
      {imageString && (
        
        <Image
        src={imageString}
        alt="Picture of the author"
        sizes="100vw"
        width={0}
        height={0}
        style={{
          width: '100%',
          height: 'auto',
        }}
        className='rounded-xl border border-secondary'
        />
      )}
      </div>
      </div>
      </div>
      </div>
      
      {/* <h1 className='text-lg font-bold my-3'>{title}</h1>
        
        {jsonContent && <RenderToJson data={jsonContent} />}
        
        {imageString && (
        <Image
        src={imageString}
        alt="Post Image"
        width={600}
        height={300}
        className="w-full h-[60vh] cover rounded-xl"
        />
        )} */}
        
        {/* <RenderToJson data={jsonContent} />  */}
        
        
        </div>
        
        {/* {imageString ? (
          <Image
          src={imageString}
          alt="Post Image"
          width={600}
          height={300}
          className="w-full h-full"
          />
          ) : (
          <RenderToJson data={jsonContent} />
          )} */}
          
          {/* {imageString ? (
            <div>
            <Image
            src={imageString}
            alt="Post Image"
            width={600}
            height={300}
            className="w-full h-full"
            />
            {<RenderToJson data={jsonContent} />}
            </div>
            ) : (
            <div>
            {textContent && <RenderToJson data={textContent} />}
            </div>
            )} */}
            
            
            </div>
            <div>
            <div className="flex flex-wrap pb-2 border-b border-primary dark:border-gray-400 gap-2 text-baseline">
            <div className="flex gap-2">
            <div
            className="px-2 py-1 rounded-sm"
            >
            <div className="flex gap-2 whitespace-nowrap rounded-full pb-0.5 text-xs text-lime-700">
            <form action={handleVote}>
            <input className="hidden" name='voteDirection' value='LOVE' readOnly />
            {id && (
              <input className="hidden" name='requestId' value={id} readOnly/>
            )}
            <LOVE />
            </form>
            
            {voteCount1}
            
            </div>
            
            </div>            <a
            rel="noopener noreferrer"
            href={`/request/${id}`}
            className="px-3 py-1 rounded-sm hover:underline"
            >
            
            <div className="flex whitespace-nowrap rounded-full pb-0.5 text-xs text-lime-700 hover:text-primary">
            <Button size='icon' variant='outline' asChild>
            <MessageCircleHeart />
            </Button>
            {commentCount} messages
            </div>
            
            </a>
            </div>
            <div className="flex gap-2">
            
            <a
            rel="noopener noreferrer"
            href={`/request/${id}`}
            className="px-2 py-2 rounded-sm hover:underline "
            >
            <div className="flex gap-2 whitespace-nowrap rounded-full pb-0.5 text-xs text-lime-700 hover:text-primary">
            <Button size='icon' variant='outline'>
            <Bookmark />
            </Button>
            <p className='xs'>1</p>
            
            </div>
            </a>
            
            <div
            className="px-2 py-1 rounded-sm"
            >
            <div className="flex gap-2 whitespace-nowrap rounded-full pb-0.5 text-xs text-lime-700">
            <form action={handleVote}>
            <input className="hidden" name='voteDirection' value='SUSPISION' readOnly />
            <input className="hidden" name='requestId' value={id} readOnly/>
            
            <SUSPISION />
            </form>
            {voteCount2}
            </div>
            </div>
            
            <a
            rel="noopener noreferrer"
            href="#"
            className="px-2 py-2 rounded-sm hover:underline"
            >
            <div className="flex gap-1 whitespace-nowrap rounded-full pb-0.5 text-xs text-lime-700 hover:text-primary">
            <CopyLink id={id} />
            </div>
            
            </a>
            
            </div>
            </div>
            <div className="space-y-1 flex flex-col items-center justify-between w-full md:flex-row md:items-center">
            <span className="whitespace-nowrap rounded-full bg-purple-100 px-3.5 py-0.5 text-xs text-purple-700 dark:bg-slate-800 dark:text-slate-50 mt-2">
            12 folks chipped in
            <div className="flex flex-col items-center justify-center">
            <div className="flex flex-row -space-x-4">
            <Image
            alt=""
            className="w-10 h-10 border rounded-full"
            src="https://source.unsplash.com/40x40/?portrait?1"
            width={40}
            height={40}
            />
            <Image
            alt=""
            className="w-10 h-10 border rounded-full "
            src="https://source.unsplash.com/40x40/?portrait?2"
            width={40}
            height={40}
            />
            <Image
            alt=""
            className="w-10 h-10 border rounded-full"
            src="https://source.unsplash.com/40x40/?portrait?3"
            width={40}
            height={40}
            />
            <Image
            alt=""
            className="w-10 h-10 border rounded-full "
            src="https://source.unsplash.com/40x40/?portrait?4"
            width={40}
            height={40}
            />
            <div className="flex items-center justify-center w-12 h-12 font-semibold border rounded-full">
            +3
            </div>
            </div>
            </div>
            </span>
            {/* <div className="text-sm md:ml-5">
              <div className="whitespace-nowrap rounded-full bg-green-100 px-2.5 py-0.5 text-green-700 text-sm flex space-x-2 items-baseline">
              <Bell className='h-3 w-3 mr-1 self-baseline'/>  {request.createdAt.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
              </div>
              </div> */}
              <div className="p-6 py-2">
              <div className="container mx-auto">
              <div className="flex flex-col lg:flex-row items-center justify-between">
              <h2 className="text-center text-xs tracki">
              KES 700 raised of
              <br className="font-semibold" /> KES {amount} target
              </h2>
              <div className="space-x-2 text-center py-2 lg:py-0">
              <div>
              <Slider amount={amount} />
              </div>
              </div>
              </div>
              </div>
              </div>
              </div>
              <div className='mt-5 h-px absolute bottom-5 right-5'>
              <Dialog>
              <DialogTrigger asChild>
              <Button variant="default">Click Here to Help</Button>
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
              cancel
              </Button>
              </DialogClose>
              {/* <Button type="submit" className="ml-auto">
                Send { } to {userName}
                </Button> */}
                </DialogFooter>
                </DialogContent>
                </Dialog>
                </div>
                </div>
                </Card>
                
                </div>
              )
            }
            
            
            