import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ModeToggle } from '@/components/ThemeToggle';
import { Button } from '@/components/ui/button';
import { RegisterLink, LoginLink, LogoutLink } from "@kinde-oss/kinde-auth-nextjs/components";
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import UserDropDown  from "./UserDropDown";
import MenuBar from './MenuBar';

async function Navbar() {
  const { getUser } = getKindeServerSession();
  const user = await getUser();
  return (
    <nav className='container h-[10dvh] flex justify-between items-center border-b'>
    
    <Link href='/' >
    
    <Image
    src="/logo.svg"
    alt="Logo"
    width={100}
    height={100}
    
    className=' rounded-full p-2
    text-slate-500
    shadow-[-5px_-5px_10pxr_rgba(255,_255,_255,_0.8),_5px_5px_10px_rgba(0,_0,_0,_0.25)]
    transition-all
    dark:shadow-[-1px_-1px_15px_rgba(255,_255,_255,_0.6),_1px_1px_5px_rgba(0,_0,_0,_0.3),inset_-2px_-2px_5px_rgba(255,_255,_255,_1),inset_2px_2px_4px_rgba(0,_0,_0,_0.3)]
    hover:text-primary
    '
    />
    </Link>
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