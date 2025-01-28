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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Search, Filter } from 'lucide-react';
import { HelpCircle } from 'lucide-react';

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
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

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
          communityName: params.id
        }),
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.message || 'Failed to join community');
      }

      if (result.message === 'Already a member') {
        setData(prevData => prevData ? {
          ...prevData,
          isMember: true,
          memberCount: result.memberCount
        } : null);
        toast.info('You are already a member of this community');
        return;
      }

      // Update the data with new member count and status
      setData(prevData => prevData ? {
        ...prevData,
        isMember: true,
        memberCount: result.memberCount,
        members: [...(prevData.members || []), kindeUser.given_name || kindeUser.email?.split('@')[0] || 'Anonymous']
      } : null);
      
      toast.success('Successfully joined community!');
    } catch (error) {
      console.error('Join error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to join community');
    } finally {
      setIsJoining(false);
    }
  };
  
  // Filter requests based on search term and status
  const filteredRequests = data?.requests?.filter(request => {
    const matchesSearch = request.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         request.User?.userName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || 
                         (statusFilter === 'pending' && (!request.status || request.status === 'pending')) ||
                         (statusFilter === 'completed' && request.status === 'completed');
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-3 lg:gap-8 my-5 dark:bg-slate-800">
      <div className="container h-fit rounded-lg lg:col-span-2 my-5">
        {/* Search and Filter Section */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search requests..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-gray-400" />
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Requests</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Create Post Section - Only show if user is a member */}
        {!isLoading && data?.isMember && (
          <div className='container my-5'>
            <CreatePostCard />
          </div>
        )}

        {/* Requests Section */}
        {isLoading ? (
          <div className="flex items-center justify-center h-40">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : filteredRequests?.length === 0 ? (
          <div className="text-center py-10 bg-white dark:bg-gray-800 rounded-lg shadow">
            <HelpCircle className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-semibold text-gray-900 dark:text-gray-100">No requests found</h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              {searchTerm || statusFilter !== 'all' 
                ? 'Try adjusting your search or filter settings'
                : 'Be the first to create a request in this community'}
            </p>
            {data?.isMember && (
              <Button 
                variant="outline" 
                className="mt-4"
                asChild
              >
                <Link href={`/c/${data.name}/create`}>Create a Request</Link>
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {filteredRequests?.map((request) => (
              <div key={request.id} className="transition-all hover:translate-y-[-2px]">
                <RequestCard
                  textContent={request.textContent}
                  userId={request.User?.id}
                  id={request.id}
                  communityName={data?.name || params.id}
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
          </div>
        )}

        {/* Pagination */}
        <div className="mt-6">
          <Pagination totalPages={Math.ceil(count / 10)} />
        </div>
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