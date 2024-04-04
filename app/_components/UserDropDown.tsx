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
        <div className='flex gap-5 p-2 px-4 py-1 cursor-pointer border border-teal-500 rounded-full'>
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
          <Link href='/h/circle'>
            Create Group
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
          <LogoutLink><Button variant='default'>Logout</Button></LogoutLink>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>)
}

export default UserDropDown