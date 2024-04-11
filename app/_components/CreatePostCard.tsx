import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input';
import { Link1Icon } from '@radix-ui/react-icons';
import { ImageDown } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import React from 'react'

export default function CreatePostCard() {
  return (
    <Card className='flex items-center border-primary'>
    <Image src="/fitrii.png"
    alt="Fitrii Logo"
    width={20}
    height={25}
    className='m-3' 
    />
    <div className='flex w-full'>
    <Link href='/c/eldoret/create' className='w-full mr-5'>
    <Input placeholder='Create a Help Request' className='border-secondary text-primary' readOnly />  
    </Link>
    <div className='mr-1 flex flex-row'>
    <Button variant='outline' size='icon' className=' border-secondary' asChild>
    <Link href='/c/eldoret/create' className='l mr-2'>
    <ImageDown className='h-4 w-4 text-primary' />
    </Link>
    </Button>
    
    <Button variant='outline' size='icon' className=' border-secondary' asChild>
    <Link href='/c/eldoret/create' className=' mr-5'>
    <Link1Icon className='h-4 w-4 text-primary' />
    </Link>
    </Button>
    </div>
    </div>
    </Card>
    )
  }
  