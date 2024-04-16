import React from 'react';
import Image from "next/image";
import Navbar from "@/app/_components/Navbar";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { getKindeServerSession } from '@kinde-oss/kinde-auth-nextjs/server';

export default async function HomeNavRight() {
  const { getUser } = getKindeServerSession();
  const user = await getUser();
  
  
  
  return (
    <div>
    <Card>
    
    <div className="max-w-xs p-6 rounded-md shadow-md dark:bg-gray-50 dark:text-gray-900">
    {!user ? (
      <img src="https://source.unsplash.com/random/300x300/?1" alt="" className="object-cover object-center w-full rounded-md h-24 dark:bg-gray-500" />
    ) : (
      <div>
      <h1 className='mx-3 text-bold text-xs font-bold text-primary'>Hello {user.given_name}</h1>
      <button type="button" className="relative pr-8 pl-3 py-4 ml-2 overflow-hidden font-semibold rounded border border-secondary text-xl w-full text-primary hover:scale-105"> {((85*1000)/100 - ((2*200)/1000))} <span className='text-xs'>KES</span>
      <span className="absolute top-0 right-0 px-5 py-1 text-xs tracking-tight text-center uppercase whitespace-no-wrap origin-bottom-left transform rotate-45 -translate-y-full translate-x-1/3 bg-secondary text-green-800 flrx-shrink">withdraw</span>
      </button>
      </div>
    )
  }
  
  
  <div className="mt-6 mb-2">
  <Image src="/logo.svg" alt="Fitrii Logo"
  sizes="100dvw"
  style={{
    width: '300',
    height: 'auto',
  }}
  width={60}
  height={40}
  
  />
  <h2 className="text-xl font-semibold tracking-wide">Invest in Humanity </h2>
  
  <div className="flex flex-col">
  </div>
  </div>
  <p className="dark:text-gray-800">Spreading Kindness, One Act at a Time: Join Us in Making a Difference Today!.</p>
  <Separator className='my-5' /> 
  <div className='flex flex-col justify-center flex-shrink gap-y-5'>
  <Button asChild>
  <Link href='/c/eldoret/create'>
  Create a Help Request
  </Link>
  </Button>
  
  
  <Button variant='outline' asChild>
  <Link href='/c/create'>
  Create You Own Help Community
  </Link>
  </Button>
  </div>
  </div>
  
  
  {/* <div className="p-6 sm:p-12 dark:bg-gray-50 dark:text-gray-800">
  <div className="flex flex-col space-y-4 md:space-y-0 md:space-x-6 md:flex-row">
  <Image src="/logo.svg" alt="Fitrii Logo"
  sizes="100dvw"
  style={{
    width: '300',
    height: 'auto',
  }}
  width={40}
  height={40}
  
  className="self-center flex-shrink-0 w-24 h-24 border rounded-full md:justify-self-start dark:bg-gray-500 dark:border-gray-300 p-2" />
  <div className="flex flex-col">
  <h4 className="text-lg font-semibold text-center md:text-left">Home</h4>
  </div>
  </div>
  <div className="flex justify-center pt-4 space-x-4 align-center">
  
  </div>
</div> */}

{/* <div className="flex flex-row justify-center baseline">
<Image
src={'/logo.svg'}
alt="Image"
sizes="100dvw"
style={{
  width: '300',
  height: 'auto',
}}
width={40}
height={40}

className="w-[35%] h-[50%]rounded-lg"
/>
<h1 className="text-2xl font-semibold">
Home
</h1>
</div> */}
</Card>

</div>
)
}
