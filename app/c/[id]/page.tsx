'use client';
import prisma from '@/app/lib/db';
import { Button } from '@/components/ui/button';
import { Card, CardTitle } from '@/components/ui/card';
import { getKindeServerSession } from '@kinde-oss/kinde-auth-nextjs/server';
import React from 'react';
import CommunityDescriptionForm from '../_CommunityComponents/CommunityDescriptionForm';
import { LinkBreak2Icon } from '@radix-ui/react-icons';
import Pagination from '@/app/_components/Pagination';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import Link from 'next/link';
import { Separator } from '@/components/ui/separator';
import CreatePostCard from '@/app/_components/CreatePostCard';
import { RequestCard } from '@/app/_components/RequestCard';

async function getData(name: string, searchParam: string) {
  const [count, data] = await prisma.$transaction([
    prisma.request.count({
      where: {
        communityName: name,
      },
    }),
    prisma.community.findUnique({
      where: {
        name: name,
      },
      select: {
        name: true,
        createdAt: true,
        updatedAt: true,
        description: true,
        userId: true,
        User: true,
        requests: {
          take: 10,
          skip: searchParam ? (Number(searchParam) - 1) * 10 : 0,
          select: {
            title: true,
            amount: true,
            createdAt: true,
            updatedAt: true,
            deadline: true,
            pointsUsed: true,
            imageString: true,
            Comment: {
              select: {
                id: true,
                text: true,
                createdAt: true,
              },
            },
            id: true,
            textContent: true,
            Vote: {
              select: {
                userId: true,
                voteType: true,
              },
            },
            User: {
              select: {
                userName: true,
                id: true,
              },
            },
          },
        },
      },
    }),
  ]);
  return { data, count };
}

interface CreatedAtProps {
  data: {
    createdAt: Date | string;
  };
}

export default async function ShowItems({ params, searchParams }: { searchParams: { page: string }; params: { id: string } }) {
  const { data, count } = await getData(params.id, searchParams.page);
  const { getUser } = getKindeServerSession();
  const user = await getUser();
  
  let displayTime: string;
  
  function updateDisplayTime() {
    const createdAtDate = data?.createdAt ? new Date(data.createdAt) : null;
    if (!createdAtDate) return;
    
    const currentDate = new Date();
    const timeDifferenceInMilliseconds = currentDate.getTime() - createdAtDate.getTime();
    const timeDifferenceInDays = Math.floor(timeDifferenceInMilliseconds / (1000 * 60 * 60 * 24));
    
    if (timeDifferenceInDays > 365) {
      const years = Math.floor(timeDifferenceInDays / 365);
      displayTime = `${years} years ago`;
    } else {
      displayTime = `${timeDifferenceInDays} days ago`;
    }
  }
  updateDisplayTime();
  
  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-3 lg:gap-8 my-5 dark:bg-slate-800">
    <div className="container h-fit rounded-lg lg:col-span-2 my-5">
    {/* The Post Section */}
    <div className='container my-5'>
    <CreatePostCard />
    </div>
    {data?.requests?.map((request) => (
      <div className='container my-2' key={request.id}>
      <RequestCard
      textContent={request.textContent}
      userId={request.User?.id as string}
      key={request.id}
      id={request.id}
      communityName={data.name}
      title={request.title}
      amount={request.amount}
      jsonContent={request.textContent}
      imageString={request.imageString as string}
      createdAt={request.createdAt}
      updatedAt={request.updatedAt}
      commentCount={request.Comment?.length}
      deadline={request.deadline}
      userName={request.User?.userName as string}
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
      </div>
    ))}
    <Pagination totalPages={Math.ceil(count / 10)} />
    </div>
    <div className="container h-fit rounded-lg bg-secondary my-5 dark:bg-slate-800">
    <div className="flex flex-col max-w-lg p-6 space-y-6 overflow-hidden rounded-lg shadow-md dark:bg-gray-800 dark:text-gray-50 my-4">
    <Card>
    <CardTitle className='text-md md:text-lg py-4 ml-5 flex-shrink-0 flex-wrap'>
    About <span className='text-primary hover:text-[#10340f] cursor-pointer'>{params.id}</span> Community
    </CardTitle>
    </Card>
    <div className="flex space-x-4">
    <img alt="" src={`https://avatar.vercel.sh/${data?.name}`} className="object-cover w-12 h-12 rounded-full shadow dark:bg-gray-500" />
    <div className="flex flex-col space-y-1">
    <a rel="noopener noreferrer" href={`/c/${data?.name}`} className="text-sm font-semibold">c/{data?.name}</a>
    <span className="text-xs dark:text-gray-600 flex gap-x-2 text-primary hover:scale-105 cursor-pointer">
    <LinkBreak2Icon /> Created by: {data?.User?.firstName} {data?.User?.lastName}
    </span>
    <Separator className="my-4" />
    <Button asChild><Link href={user?.id ? `/c/${data?.name}/create` : "/api/auth/login"} className='mr-5 mt-5'>Create a Request</Link></Button>
    </div>
    </div>
    <div>
    <img src="/poster.png" alt="" className="object-cover w-full mb-4 h-[20dv] sm:h-96 dark:bg-secondary rounded-xl" />
    <h2 className="mb-1 text-xl font-semibold">{params.id}</h2>
    <p className="text-sm dark:text-gray-600">{data?.description}</p>
    {user?.id === data?.userId ? (
      <DropdownMenu>
      <DropdownMenuTrigger asChild>
      <Button variant="default" className='w-full my-5'>Edit Community Description</Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-[35dvh] overflow-visible mb-5">
      <CommunityDescriptionForm description={data?.description} communityName={params.id} />
      </DropdownMenuContent>
      </DropdownMenu>
    ) : (
      <Button className='text-sm font-semibold text-slate-50 px-5 mt-5 relative top-0 right-[-90px]'>Join Community</Button>
    )}
    </div>
    <div className="flex flex-wrap justify-between">
    <div className="space-x-2">
    <button aria-label="Share this post" type="button" className="p-2 text-center">
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" className="w-4 h-4 fill-current dark:text-violet-600">
    <path d="M404,344a75.9,75.9,0,0,0-60.208,29.7L179.869,280.664a75.693,75.693,0,0,0,0-49.328L343.792,138.3a75.937,75.937,0,1,0-13.776-28.976L163.3,203.946a76,76,0,1,0,0,104.108l166.717,94.623A75.991,75.991,0,1,0,404,344Zm0-296a44,44,0,1,1-44,44A44.049,44.049,0,0,1,404,48ZM108,300a44,44,0,1,1,44-44A44.049,44.049,0,0,1,108,300ZM404,464a44,44,0,1,1,44-44A44.049,44.049,0,0,1,404,464Z"></path>
    </svg>
    </button>
    </div>
    <button aria-label="Bookmark this post" type="button" className="p-2">
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" fill="none" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 dark:text-violet-600">
    <path stroke="none" d="M0 0h24v24H0z"></path>
    <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path>
    </svg>
    </button>
    </div>
    </div>
    </div>
    </div>
  );
}