import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ModeToggle } from '@/components/ThemeToggle';
import { Button } from '@/components/ui/button';
import { RegisterLink, LoginLink, LogoutLink } from "@kinde-oss/kinde-auth-nextjs/components";
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import UserDropDown from "./UserDropDown";
import { MagnifyingGlassIcon } from '@radix-ui/react-icons';

async function Navbar() {
  const { getUser } = getKindeServerSession();
  const user = await getUser();
  
  return (
    <nav className='container h-[10dvh] flex justify-between items-center border-b mt-3 shadow-md rounded-badge'>
    <Link href='/' >
    <Image
    src="/fitrii-logo.png"
    alt="Logo"
    width={150}
    height={150}
    className='rounded-full p-2 text-slate-500 shadow-[-5px_-5px_10pxr_rgba(255,_255,_255,_0.8),_5px_5px_10px_rgba(0,_0,_0,_0.25)] transition-all dark:shadow-[-1px_-1px_15px_rgba(255,_255,_255,_0.6),_1px_1px_5px_rgba(0,_0,_0,_0.3),inset_-2px_-2px_5px_rgba(255,_255,_255,_1),inset_2px_2px_4px_rgba(0,_0,_0,_0.3)] hover:text-primary'
    />
    </Link>
    
    <div className="relative w-1/3 group">
    <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none transition-all duration-300 group-focus-within:pl-2">
    <MagnifyingGlassIcon className="w-5 h-5 text-gray-400 transition-all duration-300 group-focus-within:text-primary" />
    </div>
    <input
    type="text"
    placeholder="Search..."
    className="w-full py-2 pl-10 pr-4 text-xs text-gray-700 bg-white border border-gray-300 rounded-full
                    focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/50 focus:ring-opacity-50
                    dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600 dark:focus:border-primary
                    transition-all duration-300 ease-in-out
                    placeholder-transparent
                    shadow-sm hover:shadow-md focus:shadow-lg
                    transform group-focus-within:scale-102"
    />
    <span className="absolute left-10 top-1/2 transform -translate-y-1/2 text-gray-400 text-sm pointer-events-none
                         transition-all duration-300 group-focus-within:opacity-0 group-focus-within:-translate-y-full">
    Search...
    </span>
    </div>
    
    <div className='flex gap-8 baseline'>
    {user ? (
      <UserDropDown userImage={user.picture || '/user.svg'} />
    ) : (
      <div>
      <RegisterLink><Button variant='ghost'>Sign Up</Button></RegisterLink>
      <LoginLink><Button className='dark:text-secondary'>Log In</Button></LoginLink>
      </div>
    )}
    <div>
    <ModeToggle />
    </div>
    </div>
    </nav>
  )
}

export default Navbar