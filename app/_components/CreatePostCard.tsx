'use client'
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ImageDown, Plus, Users, TrendingUp, Award, ChevronDown, UserPlus2 } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface Community {
  id: string;
  name: string;
  description: string | null;
  totalDonations: number;
  successfulRequests: number;
  _count: {
    memberships: number;
    requests: number;
  };
  User: {
    userName: string | null;
  } | null;
  isMember?: boolean;
}

export default function CreatePostCard() {
  const [communities, setCommunities] = useState<Community[]>([]);
  const [joinedCommunities, setJoinedCommunities] = useState<Community[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchCommunities() {
      try {
        const response = await fetch('/api/communities/list');
        const data = await response.json();
        setCommunities(data);
        // Filter joined communities
        setJoinedCommunities(data.filter((community: Community) => community.isMember));
      } catch (error) {
        console.error('Error fetching communities:', error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchCommunities();
  }, []);

  if (!isLoading && joinedCommunities.length === 0) {
    return (
      <Card className="overflow-hidden bg-gradient-to-r from-primary/5 via-primary/10 to-primary/5 dark:from-primary/10 dark:via-primary/20 dark:to-primary/10 shadow-lg border-0">
        <div className="p-6 sm:p-8 text-center space-y-6">
          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center mx-auto transform transition-transform duration-300 hover:scale-105">
            <UserPlus2 className="h-8 w-8 sm:h-10 sm:w-10 text-primary" />
          </div>
          
          <div className="space-y-3 sm:space-y-4">
            <h3 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-gray-100">
              Join Communities to Create Requests
            </h3>
            <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300 max-w-md mx-auto">
              To create a help request, you'll need to join a community first. Communities help organize requests and connect you with people who can help.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row justify-center gap-4 px-4 sm:px-0 max-w-md mx-auto">
            <Sheet>
              <SheetTrigger asChild>
                <Button 
                  variant="default"
                  className="w-full sm:w-auto bg-primary hover:bg-primary/90 text-white rounded-full transition-all duration-300 ease-in-out shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
                >
                  <Users className="h-4 w-4 mr-2" />
                  <span className="whitespace-nowrap">Browse Communities</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-full sm:w-[400px]">
                <SheetHeader>
                  <SheetTitle>Communities</SheetTitle>
                </SheetHeader>
                <ScrollArea className="h-[calc(100vh-8rem)] mt-4">
                  <div className="space-y-4 pr-4">
                    {communities.map((community) => (
                      <Link 
                        key={community.id} 
                        href={`/c/${community.name}`}
                        className="block"
                      >
                        <div className="group hover:bg-secondary p-3 sm:p-4 rounded-lg transition-all duration-200">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center text-white font-semibold">
                                {community.name.substring(0, 2).toUpperCase()}
                              </div>
                              <div className="min-w-0">
                                <h3 className="font-semibold group-hover:text-primary transition-colors truncate">
                                  {community.name.replace(/_/g, ' ')}
                                </h3>
                                <p className="text-xs sm:text-sm text-muted-foreground line-clamp-1">
                                  {community.description || 'No description available'}
                                </p>
                              </div>
                            </div>
                            <div className="flex flex-col items-end space-y-1 sm:space-y-2 text-xs sm:text-sm text-muted-foreground ml-2">
                              <div className="flex items-center space-x-1">
                                <Users className="w-3 h-3 sm:w-4 sm:h-4" />
                                <span>{community._count.memberships}</span>
                              </div>
                              <div className="flex items-center space-x-1">
                                <TrendingUp className="w-3 h-3 sm:w-4 sm:h-4" />
                                <span>{community._count.requests}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                </ScrollArea>
              </SheetContent>
            </Sheet>
            
            <Button 
              variant="outline"
              className="w-full sm:w-auto rounded-full border-primary/20 hover:border-primary/40 hover:bg-primary/5 transition-all duration-300 ease-in-out transform hover:-translate-y-0.5"
              asChild
            >
              <Link href="/c/create">
                <Plus className="h-4 w-4 mr-2" />
                <span className="whitespace-nowrap">Create Community</span>
              </Link>
            </Button>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden bg-gradient-to-r from-primary/5 via-primary/10 to-primary/5 dark:from-primary/10 dark:via-primary/20 dark:to-primary/10 shadow-lg border-0">
      <div className="p-4 sm:p-5 space-y-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center transform transition-transform duration-300 hover:scale-105">
              <Users className="h-6 w-6 text-primary" />
            </div>
            <h2 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-gray-100">
              Create a Help Request
            </h2>
          </div>

          <div className="flex items-center gap-3">
            <Sheet>
              <SheetTrigger asChild>
                <Button 
                  id="communities-sheet-trigger"
                  variant="outline" 
                  size="icon" 
                  className="border-primary/20 hover:border-primary/40 hover:bg-primary/5 text-primary rounded-full transition-all duration-300 ease-in-out transform hover:-translate-y-0.5 shadow-sm hover:shadow"
                >
                  <Users className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-full sm:w-[400px]">
                <SheetHeader>
                  <SheetTitle>Communities</SheetTitle>
                </SheetHeader>
                <ScrollArea className="h-[calc(100vh-8rem)] mt-4">
                  <div className="space-y-4 pr-4">
                    {isLoading ? (
                      <div className="space-y-4">
                        {[...Array(5)].map((_, i) => (
                          <div key={i} className="flex items-center space-x-4">
                            <Skeleton className="h-12 w-12 rounded-full" />
                            <div className="space-y-2 flex-grow">
                              <Skeleton className="h-4 w-[200px]" />
                              <Skeleton className="h-4 w-[150px]" />
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      communities.map((community) => (
                        <Link 
                          key={community.id} 
                          href={`/c/${community.name}`}
                          className="block"
                        >
                          <div className="group hover:bg-secondary p-3 sm:p-4 rounded-lg transition-all duration-200">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-3 min-w-0">
                                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center text-white font-semibold flex-shrink-0">
                                  {community.name.substring(0, 2).toUpperCase()}
                                </div>
                                <div className="min-w-0">
                                  <h3 className="font-semibold group-hover:text-primary transition-colors truncate">
                                    {community.name.replace(/_/g, ' ')}
                                  </h3>
                                  <p className="text-xs sm:text-sm text-muted-foreground line-clamp-1">
                                    {community.description || 'No description available'}
                                  </p>
                                </div>
                              </div>
                              <div className="flex flex-col items-end space-y-1 sm:space-y-2 text-xs sm:text-sm text-muted-foreground ml-2">
                                <div className="flex items-center space-x-1">
                                  <Users className="w-3 h-3 sm:w-4 sm:h-4" />
                                  <span>{community._count.memberships}</span>
                                </div>
                                <div className="flex items-center space-x-1">
                                  <TrendingUp className="w-3 h-3 sm:w-4 sm:h-4" />
                                  <span>{community._count.requests}</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </Link>
                      ))
                    )}
                  </div>
                </ScrollArea>
              </SheetContent>
            </Sheet>

            <Button 
              variant="default"
              size="icon" 
              className="bg-primary hover:bg-primary/90 text-white rounded-full transition-all duration-300 ease-in-out transform hover:-translate-y-0.5 shadow-md hover:shadow-lg"
              asChild
            >
              <Link href="/create-community">
                <Plus className="h-5 w-5" />
              </Link>
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {isLoading ? (
            <>
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-32">
                  <Skeleton className="h-full w-full rounded-3xl" />
                </div>
              ))}
            </>
          ) : joinedCommunities.length > 0 ? (
            joinedCommunities.map((community) => (
              <Button
                key={community.id}
                asChild
                variant="outline"
                className="relative h-12 px-3 py-2 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 rounded-lg shadow-sm hover:shadow transition-all duration-300 group"
              >
                <Link
                  href={`/c/${community.name}/create`}
                  className="flex items-center w-full"
                >
                  <div className="w-6 h-6 rounded-md bg-primary/10 flex items-center justify-center text-primary font-medium text-sm flex-shrink-0">
                    {community.name.substring(0, 2).toUpperCase()}
                  </div>
                  
                  <div className="ml-2 flex-1 min-w-0">
                    <div className="flex items-center gap-1">
                      <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                        {community.name.replace(/_/g, ' ')}
                      </h3>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                        <Users className="w-3 h-3" />
                        <span>{community._count.memberships}</span>
                      </div>
                      <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                        <TrendingUp className="w-3 h-3" />
                        <span>{community._count.requests}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex-shrink-0 ml-2">
                    <Plus className="w-4 h-4 text-primary" />
                  </div>
                </Link>
              </Button>
            ))
          ) : (
            <div className="col-span-full text-center text-gray-500 dark:text-gray-400 py-8">
              No communities joined yet. Join a community to create help requests.
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}