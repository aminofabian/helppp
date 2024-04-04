import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ModeToggle } from '@/components/ThemeToggle';
import { Button } from '@/components/ui/button';
import { RegisterLink, LoginLink, LogoutLink } from "@kinde-oss/kinde-auth-nextjs/components";
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import UserDropDown  from "./UserDropDown";

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
    height={100} />
    </Link>
    <div className='flex gap-5 baseline'>
    {user ? (
      <UserDropDown userImage={user.picture} />
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