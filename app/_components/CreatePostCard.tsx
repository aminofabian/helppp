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

// List of fake communities with associated colors
const fakeCommunities = [
  { name: "Kenya Helpers Association", color: "bg-red-200 hover:bg-red-300" },
  { name: "Nairobi Tech Hub", color: "bg-blue-200 hover:bg-blue-300" },
  { name: "Mombasa Beach Cleaners", color: "bg-green-200 hover:bg-green-300" },
  { name: "Kisumu Youth Empowerment", color: "bg-yellow-200 hover:bg-yellow-300" },
  { name: "Eldoret Runners Club", color: "bg-purple-200 hover:bg-purple-300" },
  { name: "Nakuru Environmental Group", color: "bg-teal-200 hover:bg-teal-300" },
  { name: "Thika Entrepreneurs Network", color: "bg-pink-200 hover:bg-pink-300" },
  { name: "Malindi Marine Conservation", color: "bg-indigo-200 hover:bg-indigo-300" },
  { name: "Kakamega Forest Friends", color: "bg-orange-200 hover:bg-orange-300" },
  { name: "Machakos Farmers Cooperative", color: "bg-cyan-200 hover:bg-cyan-300" }
];

export default function CreatePostCard() {
  return (
    <Card className='flex items-center border-primary bg-gradient-to-r from-blue-50 to-purple-50 p-2'>
    <Image src="/fitrii.png"
    alt="Fitrii Logo"
    width={30}
    height={35}
    className="m-3"
    />
    <div className='flex w-full'>
    <DropdownMenu>
    <DropdownMenuTrigger asChild>
    <Button variant="outline" className="w-full mr-5 justify-between bg-white hover:bg-gray-100 text-gray-800 font-semibold py-2 px-4 border border-gray-400 rounded shadow">
    Create a Help Request
    <ChevronDownIcon className="ml-2 h-4 w-4" />
    </Button>
    </DropdownMenuTrigger>
    <DropdownMenuContent className="w-64 p-2 bg-white rounded-lg shadow-lg">
    {fakeCommunities.map((community, index) => (
      <DropdownMenuItem key={index} className={`my-1 rounded-md ${community.color}`}>
      <Link href={`/c/${community.name.toLowerCase().replace(/ /g, '_')}/create`} className='w-full p-2 text-gray-800 font-medium'>
      {community.name}
      </Link>
      </DropdownMenuItem>
    ))}
    </DropdownMenuContent>
    </DropdownMenu>
    <div className='mr-1 flex flex-row'>
    <Button variant='outline' size='icon' className='border-secondary mr-2 hover:bg-gray-100' asChild>
    <Link href='/c/kenya_helpers_association/create'>
    <ImageDown className='h-4 w-4 text-primary' />
    </Link>
    </Button>
    </div>
    </div>
    </Card>
  )
}