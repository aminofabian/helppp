import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ModeToggle } from '@/components/ThemeToggle';
import { Button } from '@/components/ui/button';

function Navbar() {
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
    <Button variant='ghost'>Sign Up</Button>
    <Button className='dark:text-secondary'>Log In</Button>
    <div>
    <ModeToggle />
    </div>
    
    </div>
    </nav>
    )
  }
  
  export default Navbar