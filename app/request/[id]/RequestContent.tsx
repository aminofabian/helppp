'use client';

import { Suspense } from 'react';
import { LinkBreak2Icon } from '@radix-ui/react-icons';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import RequestCard from '@/app/_components/RequestCard';
import CommentForm from '@/app/_components/CommentForm';
import CommunityDescriptionForm from '@/app/c/_CommunityComponents/CommunityDescriptionForm';
import type { RequestData } from './page';
import Slider from '@/app/_components/Slider';

// Client component for funding progress
function FundingProgress({ initialData }: { initialData: RequestData }) {
  return (
    <div className="p-6 py-12 dark:bg-violet-600 dark:text-gray-50">
      <div className="container mx-auto">
        <div className="flex flex-col lg:flex-row items-center justify-between">
          <h2 className="text-center text-4xl tracking-tighter font-bold">
            <Slider contributed={initialData.funded} total={initialData.amount} />
          </h2>
          <div className="text-sm font-medium">Funding Progress</div>
          <div className="text-sm text-gray-500">{Math.round((initialData.funded / initialData.amount) * 100)}%</div>
        </div>
        <div className="flex justify-between text-sm text-gray-500 mt-2">
          <div>Funded: ${initialData.funded}</div>
          <div>Goal: ${initialData.amount}</div>
        </div>
        <div className="text-sm text-gray-500 mt-1">
          Contributors: {initialData.contributors}
        </div>
      </div>
    </div>
  );
}

function Comments({ data, requestId }: { data: RequestData, requestId: string }) {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Comments ({data.Comment.length})</h2>
      {data.Comment.map((comment) => (
        <div key={comment.id}>
          <p>{comment.text}</p>
          <p>By: {comment.User?.userName}</p>
          <p>Created At: {new Date(comment.createdAt).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          })}</p>
        </div>
      ))}
    </div>
  );
}

export const ClientRequestContent = ({ request }: { request: RequestData }) => {
  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-3 lg:gap-8 my-5">    
      <div className="h-fit rounded-lg lg:col-span-2 mb-10">
        <div className='pl-5 mt-5'>
          <FundingProgress initialData={request} />
          <p className='text-xs'> Created By: <a href={`/u/${request.User?.userName}`}>u/{request.User?.userName}</a> </p>
        </div>
        <div className='my-10'>
          <RequestCard
            key={request.id}
            userId={request.User?.id ?? ''}
            title={request.title}
            id={request.id}
            amount={request.amount}
            funded={request.funded}
            contributors={request.contributors}
            textContent={request.textContent}
            jsonContent={request.textContent}
            imageString={request.imageString}
            createdAt={request.createdAt}
            updatedAt={request.updatedAt}
            deadline={request.deadline}
            userName={request.User?.userName ?? 'Anonymous'}
            communityName={request.communityName ?? 'Unknown'}
            pointsUsed={request.pointsUsed}
            commentCount={request.Comment.length}
            voteCount1={request.Vote.reduce((acc: number, vote) => 
              vote.voteType === "LOVE" ? acc + 1 : acc, 0)}
            voteCount2={request.Vote.reduce((acc: number, vote) => 
              vote.voteType === "SUSPISION" ? acc + 1 : acc, 0)}
          />
          <CommentForm requestId={request.id} userName={request.User?.userName ?? 'Anonymous'} />
          <Separator className='my-5 font-bold' />
          <Comments data={request} requestId={request.id} />
        </div>
      </div>
      
      {/* Right Sidebar */}
      <div className="h-32 rounded-lg bg-gray-200">
        <div className="container h-fit rounded-lg bg-secondary my-5 dark:bg-slate-800">
          <div className="flex flex-col max-w-lg p-6 space-y-6 overflow-hidden rounded-lg shadow-md dark:bg-gray-800 dark:text-gray-50 my-4">
            <Card>
              <CardTitle className='text-md md:text-lg py-4 ml-5 flex-shrink-0 flex-wrap'>
                About <span className='text-primary hover:text-[#10340f] cursor-pointer'>{request.Community?.name}</span> Community
              </CardTitle>
            </Card>
            <div className="flex space-x-4">
              <img alt="" src={`https://avatar.vercel.sh/${request.communityName}`} className="object-cover w-12 h-12 rounded-full shadow dark:bg-gray-500" />
              <div className="flex flex-col space-y-1">
                <a rel="noopener noreferrer" href={`/c/${request.communityName}`} className="text-sm font-semibold">c/{request.communityName}</a>
                <span className="text-xs dark:text-gray-600 flex gap-x-2 text-primary hover:scale-105 cursor-pointer">
                  <LinkBreak2Icon /> Created: {request.Community?.createdAt.toDateString()}
                </span>
                <Separator className="my-4" />
                <Button asChild><Link href={`/c/${request.communityName}/create`}>Create a Help Request</Link></Button>
              </div>
            </div>
            <div>
              <img src="/poster.png" alt="" className="object-cover w-full mb-4 h-[20dv] sm:h-96 dark:bg-secondary rounded-xl" />
              <h2 className="mb-1 text-xl font-semibold">{request.Community?.name}</h2>
              <p className="text-sm dark:text-gray-600">{request.Community?.description}</p>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="default" className='w-full my-5'>Edit Community Description</Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-[35dvh] overflow-visible mb-5">
                  <CommunityDescriptionForm 
                    description={request.Community?.description ?? ''} 
                    communityName={request.Community?.name ?? ''} 
                  />
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
