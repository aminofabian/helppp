import React from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ImageDown, Plus, ChevronDown } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const fakeCommunities = [
  "Kenya Helpers Association",
  "Nairobi Tech Hub",
  "Mombasa Beach Cleaners",
  "Kisumu Youth Empowerment",
  "Eldoret Runners Club",
  "Nakuru Environmental Group",
  "Thika Entrepreneurs Network",
  "Malindi Marine Conservation",
  "Kakamega Forest Friends",
  "Machakos Farmers Cooperative"
];

export default function CreatePostCard() {
  return (
    <Card className="overflow-hidden bg-gradient-to-r from-primary/5 to-primary/10 dark:from-primary/10 dark:to-primary/20 shadow-md">
    <div className="flex items-center p-3 space-x-4">
    <Image 
    src="/fitrii.png"
    alt="Fitrii Logo"
    width={40}
    height={40}
    className="rounded-full"
    />
    <div className='flex-grow'>
    <DropdownMenu>
    <DropdownMenuTrigger asChild>
    <Button 
    variant="outline" 
    className="w-full justify-between bg-white dark:bg-gray-800 hover:bg-primary/5 dark:hover:bg-primary/20 text-primary font-semibold py-2 px-4 border border-primary/20 rounded-full shadow transition duration-300 ease-in-out"
    >
    Create a Help Request
    <ChevronDown className="ml-2 h-4 w-4" />
    </Button>
    </DropdownMenuTrigger>
    <DropdownMenuContent className="w-64 p-2 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-primary/20">
    {fakeCommunities.map((community, index) => (
      <DropdownMenuItem key={index} className='my-1 rounded-md hover:bg-primary/10 dark:hover:bg-primary/20 transition duration-300 ease-in-out'>
      <Link href={`/c/${community.toLowerCase().replace(/ /g, '_')}/create`} className='w-full p-2 text-primary font-medium'>
      {community}
      </Link>
      </DropdownMenuItem>
    ))}
    </DropdownMenuContent>
    </DropdownMenu>
    </div>
    <div className='flex space-x-2'>
    <Button 
    variant='outline' 
    size='icon' 
    className='border-primary/20 hover:bg-primary/10 dark:hover:bg-primary/20 text-primary rounded-full transition duration-300 ease-in-out' 
    asChild
    >
    <Link href='/c/kenya_helpers_association/create'>
    <ImageDown className='h-4 w-4' />
    </Link>
    </Button>
    <Button 
    variant='default'
    size='icon' 
    className='bg-primary hover:bg-primary-dark text-white rounded-full transition duration-300 ease-in-out'
    >
    <Plus className='h-4 w-4' />
    </Button>
    </div>
    </div>
    </Card>
  );
}