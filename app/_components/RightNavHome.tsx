'use client'
import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import Link from 'next/link';
import { Heart, Users, Trophy, HandHeart } from 'lucide-react';

interface Community {
  id: string;
  name: string;
  memberCount?: number;
}

interface TopHelper {
  id: string;
  userName: string;
  level: number;
  totalDonated: number;
  donationCount: number;
  imageUrl: string | null;
}

export default function RightNavHome() {
  const [communities, setCommunities] = useState<Community[]>([]);
  const [topHelpers, setTopHelpers] = useState<TopHelper[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [communitiesRes, helpersRes] = await Promise.all([
          fetch('/api/communities'),
          fetch('/api/top-helpers')
        ]);
        
        if (!communitiesRes.ok || !helpersRes.ok) {
          throw new Error('Failed to fetch data');
        }
        
        const communitiesData = await communitiesRes.json();
        const helpersData = await helpersRes.json();
        
        setCommunities(communitiesData.communities);
        setTopHelpers(helpersData);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  return (
    <div className="max-w-md mx-auto">
      <Card className="overflow-hidden bg-white/95 backdrop-blur-sm 
                      dark:bg-gray-900/40 dark:backdrop-blur-md
                      shadow-lg hover:shadow-xl transition-all duration-300
                      dark:shadow-[0_4px_20px_rgba(0,0,0,0.2)]
                      dark:border-gray-800/50
                      rounded-lg my-5">
        <div className="p-6 space-y-6">
          <div className="space-y-4">
            <img
              src="/poster.png"
              alt="Valentine's Day Surprise"
              className="w-full h-64 object-cover rounded-lg 
                       shadow-md hover:shadow-lg transition-all duration-300
                       dark:shadow-[0_4px_12px_rgba(0,0,0,0.3)]
                       transform hover:scale-[1.02]"
            />
            <div className="space-y-2">
              <h2 className="text-xl font-bold text-primary dark:text-blue-400">Surprise saint Valentin 😍</h2>
              <span className="block text-sm text-gray-500 dark:text-gray-400">by concluding-tort</span>
              <p className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed">
                Maintaining proper oral and dental hygiene in young children is of utmost importance, especially for those who use...
              </p>
              <Button className="w-full bg-primary hover:bg-primary/90 text-white
                                dark:bg-blue-600 dark:hover:bg-blue-700
                                transition-all duration-300 
                                shadow-md hover:shadow-lg
                                dark:shadow-[0_2px_8px_rgba(37,99,235,0.3)]">
                <Heart className="w-4 h-4 mr-2" />
                <span className="text-xs uppercase">Click Here to Help</span>
              </Button>
            </div>
          </div>
          
          <div className="space-y-4">
            <h2 className="text-lg font-bold text-primary dark:text-blue-400 uppercase flex items-center">
              <Trophy className="w-5 h-5 mr-2" />
              Top Helpers
            </h2>
            {isLoading ? (
              <div className="text-center text-gray-500 dark:text-gray-400">Loading top helpers...</div>
            ) : (
              <div className="space-y-3">
                {topHelpers.map((helper, index) => (
                  <div 
                    key={helper.id}
                    className="flex items-center gap-3 p-3 
                              bg-gradient-to-r from-primary/5 to-primary/10 
                              dark:from-blue-600/10 dark:to-blue-600/5
                              rounded-lg transition-all duration-300
                              hover:shadow-md hover:scale-[1.02]"
                  >
                    <div className="relative flex-shrink-0">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                        {helper.imageUrl ? (
                          <img 
                            src={helper.imageUrl} 
                            alt={helper.userName}
                            className="w-full h-full rounded-full object-cover"
                          />
                        ) : (
                          <span className="text-lg font-bold text-primary">
                            {helper.userName[0].toUpperCase()}
                          </span>
                        )}
                      </div>
                      <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full 
                                    bg-primary flex items-center justify-center">
                        <div className="absolute inset-0.5 rounded-full 
                                      bg-white dark:bg-gray-900 
                                      flex items-center justify-center">
                          <span className="text-[10px] font-bold text-primary">
                            L{helper.level}
                          </span>
                        </div>
                      </div>
                      <div className="absolute -top-1 -left-1 w-5 h-5 rounded-full 
                                    bg-amber-500 flex items-center justify-center
                                    text-[10px] font-bold text-white">
                        #{index + 1}
                      </div>
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <Link 
                        href={`/user/${helper.id}`}
                        className="text-sm font-semibold text-gray-900 dark:text-gray-100
                                 hover:text-primary dark:hover:text-blue-400
                                 transition-colors"
                      >
                        {helper.userName}
                      </Link>
                      <div className="flex items-center gap-3 mt-1 text-xs text-gray-500 dark:text-gray-400">
                        <span className="flex items-center">
                          <HandHeart className="w-3 h-3 mr-1 text-emerald-500" />
                          KES {helper.totalDonated.toLocaleString()}
                        </span>
                        <span className="flex items-center">
                          <Users className="w-3 h-3 mr-1 text-blue-500" />
                          {helper.donationCount} helped
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-4">
            <h2 className="text-lg font-bold text-primary dark:text-blue-400 uppercase flex items-center">
              <Users className="w-5 h-5 mr-2" />
              Communities You Can Join
            </h2>
            {isLoading ? (
              <div className="text-center text-gray-500 dark:text-gray-400">Loading communities...</div>
            ) : (
              <ul className="space-y-2">
                {communities.map((community) => (
                  <li key={community.id} className="rounded-md overflow-hidden 
                                                  shadow-sm hover:shadow-md transition-all duration-300
                                                  dark:shadow-[0_2px_6px_rgba(0,0,0,0.2)]">
                    <Link 
                      href={`/c/${community.name.toLowerCase().replace(/ /g, '_')}`} 
                      className="block w-full p-3 
                                bg-primary/10 hover:bg-primary/20 
                                dark:bg-blue-600/10 dark:hover:bg-blue-600/20
                                text-primary dark:text-blue-400
                                transition-all duration-300
                                backdrop-blur-sm"
                    >
                      <span className="font-semibold">c/</span>{community.name}
                      {community.memberCount && (
                        <span className="text-sm text-gray-500 dark:text-gray-400 ml-2">
                          ({community.memberCount} members)
                        </span>
                      )}
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
}