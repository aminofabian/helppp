import React from 'react'
import ProfileHeader from '../_profileComponents/profileheader'
import { getKindeServerSession } from '@kinde-oss/kinde-auth-nextjs/server'
import { notFound, redirect } from 'next/navigation';
import prisma from '@/app/lib/db';
import HomeNavRight from '@/app/_components/HomeNavRight';
import { Verified } from 'lucide-react';
import { Button } from '@/components/ui/button';

async function getData(id: string) {
  const data = await prisma.user.findUnique({
    where: {
      id: id
    },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      userName: true,
      imageUrl: true,
      points: true,
      donations: {
        select: {
          id: true,
          amount: true,
          Request: {
            select: {
              id: true,
              User: {
                select:{
                  id: true,
                  userName: true, 
                }
              }
            }
          }
        }
      }
    }
  })
  if(!data) {
    return notFound();
  }
  return data;
}

export default async function UserProfile({ params }: { params: { id: string } }) {
  const data = await getData(params.id);
  const { getUser } = getKindeServerSession();
  const user = await getUser();
  
  if (!user) {
    return redirect('/api/auth/login');
  }
  
  return (
    <div className="grid grid-cols-1 gap-2 lg:grid-cols-4 lg:gap-8 my-5">
    <div className="h-fit rounded-lg bg-gray-200">
    <HomeNavRight />
    </div>
    <div className="h-fit rounded-lg bg-gray-200 lg:col-span-2  flex justify-center order-last md:order-2">
    <ProfileHeader
    userName={data?.userName || ''}
    firstName={data?.firstName || ''}
    lastName={data?.lastName || ''}
    email={data?.email || ''}
    imageUrl={data?.imageUrl || ''}
    points={data?.points || []}
    />
    </div>
    
    <div className="h-fit rounded-lg bg-gray-200 flex flex-col items-center justify-center w-full gap-y-5 order-2 md:order-last">
    <div className="items-center divide-x rounded dark:bg-violet-600 dark:text-gray-100 border border-secondary w-full flex justify-center mx-3">
    vERIFIED <button type="button" className="px-2 py-2"> <Verified className='text-primary' /> 
    </button>
    <span className='mr-2'>LEVEL</span>  <button type="button" title="levels" className=" bg-primary text-secondary rounded-full h-6 w-6 text-center text-xs">
    3
    </button>
    </div>
    <Button>
    2000 Points
    </Button>
    <div className='flex flex-col border border-secondary w-full justify-center my-5 gap-y-2 rounded-md items-center align-baseline mx-3'>
    <p>Total Donated: 2000/= </p>
    <p>Total Requested: 3000/=</p>
    <p>Requests Made: 20 </p>
    <p>Donations Made: 15</p>
    </div>
    </div>
    </div>
  )
}
