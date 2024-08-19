import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card'
import { ImageDown } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import React from 'react';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ChevronDownIcon } from '@radix-ui/react-icons'

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
    <Card className='flex items-center border-primary bg-gradient-to-r from-background to-secondary p-2'>
    <Image src="/fitrii.png"
    alt="Fitrii Logo"
    width={30}
    height={35}
    className="m-3"
    />
    <div className='flex w-full'>
    <DropdownMenu>
    <DropdownMenuTrigger asChild>
    <Button variant="outline" className="w-full mr-5 justify-between bg-background hover:bg-secondary text-foreground font-semibold py-2 px-4 border border-input rounded shadow">
    Create a Help Request
    <ChevronDownIcon className="ml-2 h-4 w-4" />
    </Button>
    </DropdownMenuTrigger>
    <DropdownMenuContent className="w-64 p-2 bg-popover rounded-lg shadow-lg">
    {fakeCommunities.map((community, index) => (
      <DropdownMenuItem key={index} className='my-1 rounded-md hover:bg-accent'>
      <Link href={`/c/${community.toLowerCase().replace(/ /g, '_')}/create`} className='w-full p-2 text-popover-foreground font-medium'>
      {community}
      </Link>
      </DropdownMenuItem>
    ))}
    </DropdownMenuContent>
    </DropdownMenu>
    <div className='mr-1 flex flex-row'>
    <Button variant='outline' size='icon' className='border-secondary mr-2 hover:bg-secondary' asChild>
    <Link href='/c/kenya_helpers_association/create'>
    <ImageDown className='h-4 w-4 text-primary' />
    </Link>
    </Button>
    </div>
    </div>
    </Card>
  )
}