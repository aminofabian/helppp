import React from 'react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { DropdownMenuIcon } from '@radix-ui/react-icons';
import { LogoutLink } from "@kinde-oss/kinde-auth-nextjs/components";
import { Button } from '@/components/ui/button';
import Image from 'next/image';
import Link from 'next/link';

interface iAppProps {
  userImage: string;
}

function UserDropDown({userImage}: iAppProps) {
  return (
    <DropdownMenu>
    <DropdownMenuTrigger>
    <div className='custom-div flex gap-5 p-2 px-4 py-1 cursor-pointer border border-teal-500 rounded-full visited:border-green-500 visited:rounded-full focus:outline-primary 
    items-center 
    text-slate-500
    shadow-[-5px_-5px_10px_rgba(255,_255,_255,_0.8),_5px_5px_10px_rgba(0,_0,_0,_0.25)]
    
    transition-all
    
    hover:shadow-[-1px_-1px_5px_rgba(255,_255,_255,_0.6),_1px_1px_5px_rgba(0,_0,_0,_0.3),inset_-2px_-2px_5px_rgba(255,_255,_255,_1),inset_2px_2px_4px_rgba(0,_0,_0,_0.3)]
    hover:text-primary
    '>
    <DropdownMenuIcon width="30" height="30" />
    <Image
    src={userImage ?? '/user.svg'}
    width={24}
    height={24}
    className='rounded-full'
    alt='user'
    />
    </div>
    </DropdownMenuTrigger>
    <DropdownMenuContent>
    <DropdownMenuLabel>My Account</DropdownMenuLabel>
    <DropdownMenuSeparator />
    <DropdownMenuItem>Profile</DropdownMenuItem>
    <DropdownMenuItem>Add Funds</DropdownMenuItem>
    <DropdownMenuItem>
    <Link href='/c/create'>
    Create Community
    </Link>
    </DropdownMenuItem>
    <DropdownMenuItem>
    <Link href='/create'>
    Create Post
    </Link>
    </DropdownMenuItem>
    <DropdownMenuItem>
    <Link href='/settings'>
    Settings
    </Link>
    </DropdownMenuItem>
    <DropdownMenuSeparator />
    <DropdownMenuItem>
    <LogoutLink><Button variant='default' className='dark:text-slate-50'>Logout</Button></LogoutLink>
    </DropdownMenuItem>
    </DropdownMenuContent>
    </DropdownMenu>)
  }
  
  export default UserDropDown