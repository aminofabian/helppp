import React from 'react';
import prisma from "../lib/db";

import Image from 'next/image';
import { BadgeCheck, Bookmark, HandHeart, MessageCircleHeart, Repeat2, HeartOff, TimerIcon, TimerOffIcon, Timer, Bell, AlertCircle } from 'lucide-react';
import Slider from './Slider';
import Counter from './Counter';
import { Button } from '@/components/ui/button';
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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import Donate from './Donate';
import MpesaPay from './MpesaPay';
import DateDifference from './DateDifference';
import Link from 'next/link';
import CopyLink from './CopyLink';
import { handleVote } from '../actions';
import { LOVE, SUSPISION } from './SubmitButtons';
import RenderToJson from './RenderToJson';
import Pagination from './Pagination';
import { RequestCard } from './RequestCard';

async function getData(searchParam: string) {
  const [count, data] = await prisma.$transaction([
    prisma.request.count(),
    prisma.request.findMany({
      take: 10,
      skip: searchParam ? (Number(searchParam) - 1) * 10 : 0,
      select: {
        title: true,
        createdAt: true,
        updatedAt: true,
        textContent: true,
        deadline: true,
        id: true,
        imageString: true,
        pointsUsed: true,
        Vote: true,
        User: {
          select: {
            userName: true,
            id: true,
          },
        },
        communityName: true,
        amount: true,
      },
      orderBy: {
        createdAt: 'desc',
      }
    })
  ]);
  
  return { data, count }
}



export async function ShowItems({ searchParams }: { searchParams: { page: string } }) {
  const { count, data } = await getData(searchParams.page);
  
  return (
    <div>
    {data.map((request: any) => (
      <RequestCard
      id={request.id}
      title={request.title}
      amount={request.amount}
      jsonContent={request.textContent}
      imageString={request.imageString as string}
      createdAt={request.createdAt}
      updatedAt={request.updatedAt}
      deadline={request.deadline}
      userName={request.User?.userName as string}
      communityName={request.communityName as string}
      pointsUsed={request.pointsUsed}
      voteCount1={request.Vote.reduce((acc: number, vote: any) => {
        if (vote.voteType === "LOVE") return acc + 1;
        return acc;
      }, 0)}
      
      voteCount2={request.Vote.reduce((acc: number, vote: any) => {
        if (vote.voteType === "SUSPISION") return acc + 1;
        return acc;
      }, 0)}
      
      
      />
      
      
      ))
      
      
      
      
    }
    
    
    
    <Pagination totalPages={Math.ceil(count / 10)} />    
    </div>
    
    
    )
    
  }