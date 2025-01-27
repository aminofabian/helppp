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
      <Card className="overflow-hidden bg-white dark:bg-gray-800 shadow-lg rounded-lg my-5">
        <div className="p-6 space-y-6">
          <div className="space-y-4">
            <img
              src="/poster.png"
              alt="Valentine's Day Surprise"
              className="w-full h-64 object-cover rounded-lg shadow-md"
            />
            <div className="space-y-2">
              <h2 className="text-xl font-bold text-primary">Surprise saint Valentin 😍</h2>
              <span className="block text-sm text-gray-500 dark:text-gray-400">by concluding-tort</span>
              <p className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed">
                Maintaining proper oral and dental hygiene in young children is of utmost importance, especially for those who use...
              </p>
              <Button className="w-full bg-primary hover:bg-primary-dark text-white">
                <Heart className="w-4 h-4 mr-2" />
                <span className="text-xs uppercase">Click Here to Help</span>
              </Button>
            </div>
          </div>
          
          <div className="space-y-4">
            <h2 className="text-lg font-bold text-primary uppercase flex items-center">
              <Users className="w-5 h-5 mr-2" />
              Communities You Can Join
            </h2>
            {isLoading ? (
              <div className="text-center text-gray-500">Loading communities...</div>
            ) : (
              <ul className="space-y-2">
                {communities.map((community) => (
                  <li key={community.id} className="rounded-md overflow-hidden">
                    <Link 
                      href={`/c/${community.name.toLowerCase().replace(/ /g, '_')}`} 
                      className="block w-full p-3 bg-primary/10 hover:bg-primary/20 text-primary transition-colors duration-200"
                    >
                      <span className="font-semibold">c/</span>{community.name}
                      {community.memberCount && (
                        <span className="text-sm text-gray-500 ml-2">
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