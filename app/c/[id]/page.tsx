'use client';
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
        if (response.status === 403) {
          toast.error(result.message, {
            description: "Level up to join more communities!",
            action: {
              label: "View Levels",
              onClick: () => router.push('/levels')
            }
          });
          return;
        }
        throw new Error(result.message || 'Failed to join community');
      }

      // Refresh the community data after joining
      const communityResponse = await fetch(`/api/community/${params.id}?page=${searchParams.page}`);
      const communityResult = await communityResponse.json();
      setData(communityResult.data);
      setCount(communityResult.count);
      
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
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-3 lg:gap-8 my-5 
                    dark:bg-gradient-to-b dark:from-gray-900 dark:to-gray-950
                    min-h-screen transition-all duration-300">
      <div className="container h-fit rounded-lg lg:col-span-2 my-5">
        {/* Search and Filter Section */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6 
                      bg-white/50 dark:bg-gray-900/30 
                      backdrop-blur-md p-4 rounded-xl
                      shadow-lg dark:shadow-[0_4px_20px_rgba(0,0,0,0.2)]
                      border border-gray-200/50 dark:border-gray-800/30
                      transition-all duration-300">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 
                             text-gray-400 dark:text-gray-500 h-4 w-4
                             transition-colors duration-300" />
            <Input
              placeholder="Search requests..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-white/70 dark:bg-gray-800/50
                        border-gray-200 dark:border-gray-700/50
                        focus:border-primary/50 dark:focus:border-gray-600
                        placeholder-gray-400 dark:placeholder-gray-500
                        text-gray-800 dark:text-gray-200
                        transition-all duration-300"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-gray-400 dark:text-gray-500
                             transition-colors duration-300" />
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[140px] bg-white/70 dark:bg-gray-800/50
                                      border-gray-200 dark:border-gray-700/50
                                      text-gray-800 dark:text-gray-200
                                      transition-all duration-300">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent className="bg-white dark:bg-gray-800 
                                      border-gray-200 dark:border-gray-700">
                <SelectItem value="all">All Requests</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Create Post Section */}
        {!isLoading && data?.isMember && (
          <div className='container my-5 transform hover:scale-[1.01] transition-all duration-300'>
            <CreatePostCard />
          </div>
        )}

        {/* Loading State */}
        {isLoading ? (
          <div className="flex items-center justify-center h-40 
                         bg-white/50 dark:bg-gray-900/30 
                         backdrop-blur-md rounded-xl
                         shadow-lg dark:shadow-[0_4px_20px_rgba(0,0,0,0.2)]
                         border border-gray-200/50 dark:border-gray-800/30
                         transition-all duration-300">
            <div className="animate-spin rounded-full h-8 w-8 
                          border-2 border-primary border-t-transparent
                          dark:border-blue-500 dark:border-t-transparent"></div>
          </div>
        ) : filteredRequests?.length === 0 ? (
          <div className="text-center py-10 
                         bg-white/50 dark:bg-gray-900/30 
                         backdrop-blur-md rounded-xl
                         shadow-lg dark:shadow-[0_4px_20px_rgba(0,0,0,0.2)]
                         border border-gray-200/50 dark:border-gray-800/30
                         transition-all duration-300">
            <HelpCircle className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500" />
            <h3 className="mt-2 text-sm font-semibold text-gray-900 dark:text-gray-100">
              No requests found
            </h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              {searchTerm || statusFilter !== 'all' 
                ? 'Try adjusting your search or filter settings'
                : 'Be the first to create a request in this community'}
            </p>
            {data?.isMember && (
              <Button 
                variant="outline" 
                className="mt-4 bg-white/70 dark:bg-gray-800/50
                          border-gray-200 dark:border-gray-700/50
                          hover:bg-gray-100 dark:hover:bg-gray-700/70
                          text-gray-800 dark:text-gray-200
                          transition-all duration-300"
                asChild
              >
                <Link href={`/c/${data.name}/create`}>Create a Request</Link>
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {filteredRequests?.map((request) => (
              <div key={request.id} 
                   className="transform hover:translate-y-[-2px] hover:scale-[1.01] 
                            transition-all duration-300">
                <RequestCard
                  textContent={request.textContent}
                  funded={request.funded}
                  contributors={request.contributors}
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

      {/* Community Info Sidebar */}
      <div className="container h-fit rounded-lg my-5">
        <div className="flex flex-col max-w-lg p-6 space-y-6 overflow-hidden 
                      bg-white/50 dark:bg-gray-900/30 
                      backdrop-blur-md rounded-xl
                      shadow-lg dark:shadow-[0_4px_20px_rgba(0,0,0,0.2)]
                      border border-gray-200/50 dark:border-gray-800/30
                      transition-all duration-300">
          <Card className="bg-transparent border-0 shadow-none">
            <CardTitle className="text-md md:text-lg py-4 ml-5 flex-shrink-0 flex-wrap
                                text-gray-800 dark:text-gray-100">
              About <span className="text-primary dark:text-blue-400 
                                   hover:text-primary/80 dark:hover:text-blue-300 
                                   cursor-pointer transition-colors duration-300">
                {params.id}
              </span> Community
            </CardTitle>
            <div className="grid grid-cols-3 gap-4 p-4 text-center">
              <div className="bg-white/70 dark:bg-gray-800/50 p-3 rounded-lg
                            shadow-sm hover:shadow-md transition-all duration-300">
                <p className="text-2xl font-bold bg-gradient-to-r from-primary to-secondary 
                             dark:from-blue-400 dark:to-blue-600
                             bg-clip-text text-transparent">
                  {data?.memberCount || 0}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">Members</p>
              </div>
              <div className="bg-white/70 dark:bg-gray-800/50 p-3 rounded-lg
                            shadow-sm hover:shadow-md transition-all duration-300">
                <p className="text-2xl font-bold bg-gradient-to-r from-primary to-secondary 
                             dark:from-blue-400 dark:to-blue-600
                             bg-clip-text text-transparent">
                  {count || 0}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">Requests</p>
              </div>
              <div className="bg-white/70 dark:bg-gray-800/50 p-3 rounded-lg
                            shadow-sm hover:shadow-md transition-all duration-300">
                <p className="text-2xl font-bold bg-gradient-to-r from-primary to-secondary 
                             dark:from-blue-400 dark:to-blue-600
                             bg-clip-text text-transparent">
                  {data?.totalDonations || 0}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">Total Donations</p>
              </div>
            </div>
          </Card>

          <div className="flex space-x-4">
            <img alt="" 
                 src={`https://avatar.vercel.sh/${data?.name}`} 
                 className="object-cover w-12 h-12 rounded-full 
                           ring-2 ring-primary/20 dark:ring-gray-700
                           shadow-md dark:shadow-[0_2px_8px_rgba(0,0,0,0.3)]
                           transition-all duration-300" />
            <div className="flex flex-col space-y-1">
              <a rel="noopener noreferrer" 
                 href={`/c/${data?.name}`} 
                 className="text-sm font-semibold text-gray-800 dark:text-gray-100
                           hover:text-primary dark:hover:text-blue-400
                           transition-colors duration-300">
                c/{data?.name}
              </a>
              <span className="text-xs flex gap-x-2 text-primary dark:text-blue-400
                             hover:scale-105 transition-transform duration-300">
                <LinkBreak2Icon /> Created by: {data?.User?.userName}
              </span>
              <div className="text-xs text-gray-600 dark:text-gray-400 mt-2">
                <p className="font-semibold">Members:</p>
                <div className="flex flex-wrap gap-1 mt-1">
                  {data?.members?.map((username) => (
                    <span key={username} 
                          className="px-2 py-1 bg-white/70 dark:bg-gray-800/50
                                   text-gray-800 dark:text-gray-200
                                   rounded-full text-xs
                                   shadow-sm hover:shadow-md
                                   transition-all duration-300">
                      {username}
                    </span>
                  ))}
                </div>
              </div>
              <Separator className="my-4 bg-gray-200 dark:bg-gray-700/50" />
              {isLoading || isAuthLoading ? (
                <Button disabled className="bg-gray-100 dark:bg-gray-800">
                  Loading...
                </Button>
              ) : !kindeUser ? (
                <Button asChild className="bg-primary hover:bg-primary/90 
                                         dark:bg-blue-600 dark:hover:bg-blue-700
                                         text-white
                                         transition-all duration-300">
                  <Link href="/api/auth/login">Login to Join</Link>
                </Button>
              ) : data?.isMember ? (
                <Button asChild 
                        className="bg-primary hover:bg-primary/90 
                                 dark:bg-blue-600 dark:hover:bg-blue-700
                                 text-white flex items-center gap-2
                                 transition-all duration-300">
                  <Link href={`/c/${data?.name}/create`}>
                    Create a Request
                  </Link>
                </Button>
              ) : (
                <Button 
                  onClick={handleJoinCommunity} 
                  disabled={isJoining}
                  className="bg-primary hover:bg-primary/90 
                           dark:bg-blue-600 dark:hover:bg-blue-700
                           text-white flex items-center gap-2
                           transition-all duration-300"
                >
                  <UserIcon className="w-4 h-4" />
                  {isJoining ? 'Joining...' : 'Join Community'}
                </Button>
              )}
            </div>
          </div>

          <div>
            <img src="/poster.png" 
                 alt="" 
                 className="object-cover w-full mb-4 h-[20dv] sm:h-96 
                           rounded-xl shadow-lg 
                           dark:shadow-[0_4px_20px_rgba(0,0,0,0.3)]
                           transform hover:scale-[1.02]
                           transition-all duration-300" />
            <h2 className="mb-1 text-xl font-semibold 
                          text-gray-800 dark:text-gray-100">
              {params.id}
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {data?.description}
            </p>
            {kindeUser?.id && data?.userId === kindeUser.id && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="default" 
                          className="w-full my-5 bg-primary/90 hover:bg-primary 
                                   dark:bg-blue-600 dark:hover:bg-blue-700
                                   text-white shadow-md hover:shadow-lg
                                   transition-all duration-300">
                    Edit Community Description
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-[35dvh] overflow-visible mb-5
                                              bg-white dark:bg-gray-800
                                              border-gray-200 dark:border-gray-700">
                  <CommunityDescriptionForm 
                    description={data?.description} 
                    communityName={params.id} 
                  />
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}