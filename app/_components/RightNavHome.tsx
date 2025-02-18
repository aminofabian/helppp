'use client'
import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import Link from 'next/link';
import { Heart, Users } from 'lucide-react';

interface Community {
  id: string;
  name: string;
  memberCount?: number;
}

export default function RightNavHome() {
  const [communities, setCommunities] = useState<Community[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchCommunities = async () => {
      try {
        const response = await fetch('/api/communities');
        if (!response.ok) throw new Error('Failed to fetch communities');
        const data = await response.json();
        setCommunities(data.communities);
      } catch (error) {
        console.error('Error fetching communities:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCommunities();
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