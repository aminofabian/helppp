'use client';
import prisma from '@/app/lib/db';
import { Button } from '@/components/ui/button';
import { Card, CardTitle } from '@/components/ui/card';
import React, { useState, useEffect } from 'react';
import CommunityDescriptionForm from '../_CommunityComponents/CommunityDescriptionForm';
import { UserIcon } from 'lucide-react';
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
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { LinkBreak2Icon } from '@radix-ui/react-icons';
import { useKindeBrowserClient } from "@kinde-oss/kinde-auth-nextjs";

interface CommunityData {
  id: string;
  name: string;
  description: string | null;
  userId: string | null;
  creatorId: string | null;
  User: { firstName: string; lastName: string; userName: string } | null;
  memberCount: number;
  isMember: boolean;
  totalDonations: number;
  requests: any[];
  members: string[];
}

type VoteType = {
  voteType: "LOVE" | "SUSPISION";
};

export default function ShowItems({ params, searchParams }: { searchParams: { page: string }; params: { id: string } }) {
  const router = useRouter();
  const { user: kindeUser, isLoading: isAuthLoading } = useKindeBrowserClient();
  const [isJoining, setIsJoining] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [data, setData] = useState<CommunityData | null>(null);
  const [count, setCount] = useState(0);

  useEffect(() => {
    async function fetchData() {
      setIsLoading(true);
      try {
        const response = await fetch(`/api/community/${params.id}?page=${searchParams.page}`);
        const result = await response.json();
        setData(result.data);
        setCount(result.count);
      } catch (error) {
        console.error('Failed to fetch data:', error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchData();
  }, [params.id, searchParams.page]);

  const handleJoinCommunity = async () => {
    if (!kindeUser) {
      router.push('/api/auth/login');
      return;
    }
    
    if (data?.isMember) {
      toast.error('Already a member of this community');
      return;
    }
    
    setIsJoining(true);
    try {
      const response = await fetch('/api/community/join', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          communityName: params.id,
        }),
      });
      
      const result = await response.json();
      
      if (result.message === 'Already a member') {
        setData(data => data ? {
          ...data,
          isMember: true,
          memberCount: data.memberCount + 1
        } : null);
        toast.info('You are already a member of this community');
        return;
      }
      
      if (!response.ok) {
        throw new Error(result.message || 'Failed to join community');
      }
      
      setData(data => data ? {
        ...data,
        isMember: true,
        memberCount: data.memberCount + 1
      } : null);
      
      toast.success('Successfully joined community!');
    } catch (error) {
      console.error('Join error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to join community');
    } finally {
      setIsJoining(false);
    }
  };
  
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
              userId={request.User?.id}
              id={request.id}
              communityName={data.name}
              title={request.title}
              amount={request.amount}
              jsonContent={request.textContent}
              imageString={request.imageString}
              createdAt={request.createdAt}
              updatedAt={request.updatedAt}
              commentCount={request.Comment?.length}
              deadline={request.deadline}
              userName={request.User?.userName}
              pointsUsed={request.pointsUsed}
              voteCount1={request.Vote?.filter((v: VoteType) => v.voteType === "LOVE").length || 0}
              voteCount2={request.Vote?.filter((v: VoteType) => v.voteType === "SUSPISION").length || 0}
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
            <div className="grid grid-cols-3 gap-4 p-4 text-center">
              <div>
                <p className="text-2xl font-bold">{data?.memberCount || 0}</p>
                <p className="text-sm text-muted-foreground">Members</p>
              </div>
              <div>
                <p className="text-2xl font-bold">{count || 0}</p>
                <p className="text-sm text-muted-foreground">Requests</p>
              </div>
              <div>
                <p className="text-2xl font-bold">{data?.totalDonations || 0}</p>
                <p className="text-sm text-muted-foreground">Total Donations</p>
              </div>
            </div>
          </Card>
          <div className="flex space-x-4">
            <img alt="" src={`https://avatar.vercel.sh/${data?.name}`} className="object-cover w-12 h-12 rounded-full shadow dark:bg-gray-500" />
            <div className="flex flex-col space-y-1">
              <a rel="noopener noreferrer" href={`/c/${data?.name}`} className="text-sm font-semibold">c/{data?.name}</a>
              <span className="text-xs dark:text-gray-600 flex gap-x-2 text-primary hover:scale-105">
                <LinkBreak2Icon /> Created by: {data?.User?.userName}
              </span>
              <div className="text-xs text-muted-foreground mt-2">
                <p className="font-semibold">Members:</p>
                <div className="flex flex-wrap gap-1 mt-1">
                  {data?.members?.map((username) => (
                    <span key={username} className="px-2 py-1 bg-secondary rounded-full text-xs">
                      {username}
                    </span>
                  ))}
                </div>
              </div>
              <Separator className="my-4" />
              {isLoading || isAuthLoading ? (
                <Button disabled>Loading...</Button>
              ) : !kindeUser ? (
                <Button asChild>
                  <Link href="/api/auth/login">Login to Join</Link>
                </Button>
              ) : data?.isMember ? (
                <Button asChild>
                  <Link href={`/c/${data?.name}/create`}>Create a Request</Link>
                </Button>
              ) : (
                <Button 
                  onClick={handleJoinCommunity} 
                  disabled={isJoining}
                  className="flex items-center gap-2"
                >
                  <UserIcon className="w-4 h-4" />
                  {isJoining ? 'Joining...' : 'Join Community'}
                </Button>
              )}
            </div>
          </div>
          <div>
            <img src="/poster.png" alt="" className="object-cover w-full mb-4 h-[20dv] sm:h-96 dark:bg-secondary rounded-xl" />
            <h2 className="mb-1 text-xl font-semibold">{params.id}</h2>
            <p className="text-sm dark:text-gray-600">{data?.description}</p>
            {kindeUser?.id && data?.userId === kindeUser.id && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="default" className='w-full my-5'>Edit Community Description</Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-[35dvh] overflow-visible mb-5">
                  <CommunityDescriptionForm description={data?.description} communityName={params.id} />
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}