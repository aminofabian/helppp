import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ModeToggle } from '@/components/ThemeToggle';
import { Button } from '@/components/ui/button';
import { RegisterLink, LoginLink } from "@kinde-oss/kinde-auth-nextjs/components";
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import UserDropDown from "./UserDropDown";
import { MagnifyingGlassIcon, HamburgerMenuIcon } from '@radix-ui/react-icons';
import Logo from './Logo';
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet";

async function Navbar() {
  const { getUser } = getKindeServerSession();
  const user = await getUser();
  
  return (
    <nav className='sticky top-0 z-50 backdrop-blur-md bg-white/70 dark:bg-gray-900/70 border-b border-gray-200/50 dark:border-gray-800/50
                  shadow-lg dark:shadow-[0_2px_10px_rgba(0,0,0,0.3)] transition-all duration-300'>
      <div className='container mx-auto h-[10dvh] flex justify-between items-center'>
        {/* Logo with enhanced hover effects */}
        <Logo width={48} height={48} />
        
        {/* Enhanced Search Bar */}
        <div className="relative w-1/3 hidden md:block group">
          <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none
                         transition-all duration-300 group-focus-within:text-primary">
            <MagnifyingGlassIcon className="w-5 h-5 text-gray-400 transition-all duration-300
                                          group-focus-within:text-primary dark:text-gray-500
                                          dark:group-focus-within:text-blue-400" />
          </div>
          <input
            type="text"
            placeholder="Search..."
            className="w-full py-2.5 pl-10 pr-4 text-sm text-gray-700
                      bg-white/50 backdrop-blur-sm border border-gray-200/50
                      rounded-full outline-none
                      focus:border-primary/50 focus:ring-2 focus:ring-primary/20
                      dark:bg-gray-800/30 dark:text-gray-200 dark:border-gray-700/50
                      dark:focus:border-blue-500/50 dark:focus:ring-blue-500/20
                      dark:placeholder-gray-500
                      transition-all duration-300 ease-in-out
                      shadow-sm hover:shadow-md focus:shadow-lg
                      transform hover:scale-[1.01] focus:scale-[1.02]
                      dark:shadow-[inset_0_1px_3px_rgba(0,0,0,0.3)]
                      dark:hover:shadow-[inset_0_1px_3px_rgba(0,0,0,0.3),0_0_10px_rgba(59,130,246,0.2)]"
          />
        </div>
        
        {/* Desktop Navigation with enhanced buttons */}
        <div className='hidden md:flex gap-6 items-center'>
          {user ? (
            <UserDropDown userImage={user.picture || '/user.svg'} />
          ) : (
            <div className='flex items-center gap-4'>
              <RegisterLink>
                <Button variant='ghost'
                        className="rounded-full px-6 hover:bg-gray-100/80
                                   dark:hover:bg-gray-800/50 dark:hover:text-blue-400
                                   transition-all duration-300">
                  Sign Up
                </Button>
              </RegisterLink>
              <LoginLink>
                <Button className='rounded-full px-6 bg-gradient-to-r from-primary to-primary/80
                              hover:from-primary/90 hover:to-primary/70
                              dark:from-blue-600 dark:to-blue-700
                              dark:hover:from-blue-500 dark:hover:to-blue-600
                              text-white shadow-md hover:shadow-lg
                              transition-all duration-300'>
                  Log In
                </Button>
              </LoginLink>
            </div>
          )}
          <div className='border-l h-8 border-gray-200 dark:border-gray-700/50 mx-2'></div>
          <ModeToggle />
        </div>
    
        {/* Enhanced Mobile Navigation */}
        <div className='md:hidden flex items-center gap-4'>
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon"
                      className="rounded-full hover:bg-gray-100/80
                                dark:hover:bg-gray-800/50 transition-all duration-300">
                <HamburgerMenuIcon className="h-6 w-6 dark:text-gray-300" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right"
                          className="w-[300px] sm:w-[400px] bg-white/80 backdrop-blur-lg
                                    dark:bg-gray-900/90 dark:backdrop-blur-lg border-gray-200/50
                                    dark:border-gray-800/50 shadow-2xl">
              <div className="flex flex-col gap-6 pt-10">
                {/* Mobile Logo */}
                <div className="flex justify-center">
                  <Logo width={56} height={56} />
                </div>
                {/* Mobile Search with enhanced styling */}
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 flex items-center pl-3">
                    <MagnifyingGlassIcon className="w-5 h-5 text-gray-400 dark:text-gray-500" />
                  </div>
                  <input
                    type="text"
                    placeholder="Search..."
                    className="w-full py-2.5 pl-10 pr-4 text-sm
                              bg-white/50 backdrop-blur-sm border border-gray-200/50
                              rounded-full outline-none
                              focus:border-primary/50 focus:ring-2 focus:ring-primary/20
                              dark:bg-gray-800/30 dark:text-gray-200 dark:border-gray-700/50
                              dark:focus:border-blue-500/50 dark:focus:ring-blue-500/20
                              dark:placeholder-gray-500 transition-all duration-300"
                  />
                </div>
    
                {/* Mobile Auth Buttons with enhanced styling */}
                {!user ? (
                  <div className="flex flex-col gap-3">
                    <RegisterLink>
                      <Button className="w-full rounded-full bg-gray-50 hover:bg-gray-100/80
                                      dark:bg-gray-800/50 dark:text-gray-200 dark:hover:bg-gray-700/50
                                      transition-all duration-300"
                              variant="outline">
                        Sign Up
                      </Button>
                    </RegisterLink>
                    <LoginLink>
                      <Button className="w-full rounded-full bg-gradient-to-r from-primary to-primary/80
                                      hover:from-primary/90 hover:to-primary/70
                                      dark:from-blue-600 dark:to-blue-700
                                      dark:hover:from-blue-500 dark:hover:to-blue-600
                                      text-white shadow-md hover:shadow-lg
                                      transition-all duration-300">
                        Log In
                      </Button>
                    </LoginLink>
                  </div>
                ) : (
                  <div className="flex flex-col gap-4">
                    <UserDropDown userImage={user.picture || '/user.svg'} />
                  </div>
                )}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;