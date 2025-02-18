import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ModeToggle } from '@/components/ThemeToggle';
import { Button } from '@/components/ui/button';
import { RegisterLink, LoginLink } from "@kinde-oss/kinde-auth-nextjs/components";
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import UserDropDown from "./UserDropDown";
import { MagnifyingGlassIcon, HamburgerMenuIcon } from '@radix-ui/react-icons';
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet";

async function Navbar() {
  const { getUser } = getKindeServerSession();
  const user = await getUser();
  
  return (
    <nav className='container h-[10dvh] flex justify-between items-center border-b mt-3 shadow-md rounded-badge
                    dark:bg-gray-900/50 dark:backdrop-blur-md dark:border-gray-800/50 
                    dark:shadow-[0_2px_10px_rgba(0,0,0,0.3)] transition-all duration-300'>
      {/* Logo - Always visible */}
      <Link href='/' >
        <Image
          src="/fitrii-logo.png"
          alt="Logo"
          width={150}
          height={150}
          className='rounded-full p-2 text-slate-500 
                     shadow-[-5px_-5px_10px_rgba(255,_255,_255,_0.8),_5px_5px_10px_rgba(0,_0,_0,_0.25)] 
                     transition-all duration-300 
                     dark:shadow-[0_0_15px_rgba(0,_0,_0,_0.5)] 
                     dark:hover:shadow-[0_0_20px_rgba(59,130,246,0.5)] 
                     hover:text-primary dark:grayscale-[0.2]'
        />
      </Link>
      
      {/* Search Bar - Hidden on mobile */}
      <div className="relative w-1/3 hidden md:block group">
        <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none transition-all duration-300 group-focus-within:pl-2">
          <MagnifyingGlassIcon className="w-5 h-5 text-gray-400 transition-all duration-300 group-focus-within:text-primary dark:text-gray-500 dark:group-focus-within:text-blue-400" />
        </div>
        <input
          type="text"
          placeholder="Search..."
          className="w-full py-2 pl-10 pr-4 text-sm text-gray-700 bg-white border border-gray-300 rounded-full
                    focus:outline-none focus:border-primary focus:border focus:ring-1 focus:ring-primary/50
                    dark:bg-gray-800/50 dark:backdrop-blur-sm dark:text-gray-200 dark:border-gray-700
                    dark:focus:border-blue-500 dark:focus:ring-blue-500/50 dark:placeholder-gray-500
                    transition-all duration-300 ease-in-out
                    placeholder-transparent
                    shadow-sm hover:shadow-md focus:shadow-lg
                    transform group-focus-within:scale-102
                    dark:shadow-[inset_0_1px_3px_rgba(0,0,0,0.3)]
                    dark:hover:shadow-[inset_0_1px_3px_rgba(0,0,0,0.3),0_0_10px_rgba(59,130,246,0.2)]"
        />
        <label htmlFor="search" className="absolute left-10 top-1/2 transform -translate-y-1/2 text-gray-400 text-sm pointer-events-none
                         transition-all duration-300 group-focus-within:opacity-0 group-focus-within:-translate-y-full
                         dark:text-gray-500">
          Search...
        </label>
      </div>
      
      {/* Desktop Navigation */}
      <div className='hidden md:flex gap-8 items-center'>
        {user ? (
          <UserDropDown userImage={user.picture || '/user.svg'} />
        ) : (
          <div>
            <RegisterLink><Button variant='ghost' className="dark:hover:bg-gray-800/50 dark:hover:text-blue-400">Sign Up</Button></RegisterLink>
            <LoginLink><Button className='dark:bg-blue-600 dark:text-white dark:hover:bg-blue-700 transition-colors duration-300'>Log In</Button></LoginLink>
          </div>
        )}
        <ModeToggle />
      </div>

      {/* Mobile Navigation */}
      <div className='md:hidden flex items-center gap-4'>
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="md:hidden dark:hover:bg-gray-800/50">
              <HamburgerMenuIcon className="h-6 w-6 dark:text-gray-300" />
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-[300px] sm:w-[400px] dark:bg-gray-900/95 dark:backdrop-blur-md dark:border-gray-800">
            <div className="flex flex-col gap-4 pt-10">
              {/* Mobile Search */}
              <div className="relative">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3">
                  <MagnifyingGlassIcon className="w-5 h-5 text-gray-400 dark:text-gray-500" />
                </div>
                <input
                  type="text"
                  placeholder="Search..."
                  className="w-full py-2 pl-10 pr-4 text-sm border rounded-full
                           dark:bg-gray-800/50 dark:backdrop-blur-sm dark:text-gray-200 
                           dark:border-gray-700 dark:placeholder-gray-500
                           dark:focus:border-blue-500 dark:focus:ring-blue-500/50"
                />
              </div>

              {/* Mobile Auth Buttons */}
              {!user ? (
                <div className="flex flex-col gap-2">
                  <RegisterLink>
                    <Button className="w-full dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700" variant="outline">Sign Up</Button>
                  </RegisterLink>
                  <LoginLink>
                    <Button className="w-full dark:bg-blue-600 dark:text-white dark:hover:bg-blue-700">Log In</Button>
                  </LoginLink>
                </div>
              ) : (
                <div className="flex flex-col gap-4">
                  <UserDropDown userImage={user.picture || '/user.svg'} />
                </div>
              )}
              
              <div className="flex justify-center pt-4">
                <ModeToggle />
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </nav>
  );
}

export default Navbar;