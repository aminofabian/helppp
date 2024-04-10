import React from 'react';
import Image from "next/image";
import Navbar from "@/app/_components/Navbar";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function HomeNavRight() {
  return (
    <div>
    <Card>
    
    <div className="max-w-xs p-6 rounded-md shadow-md dark:bg-gray-50 dark:text-gray-900">
    <img src="https://source.unsplash.com/random/300x300/?1" alt="" className="object-cover object-center w-full rounded-md h-24 dark:bg-gray-500" />
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
    <h2 className="text-xl font-semibold tracking-wide">Welcome to Fitrii Homepage </h2>
    
    <div className="flex flex-col">
    </div>
    </div>
    <p className="dark:text-gray-800">Mauris et lorem at elit tristique dignissim et ullamcorper elit. In sed feugiat mi. Etiam ut lacinia dui.</p>
    <Separator className='my-5' /> 
    <div className='flex flex-col justify-center flex-shrink gap-y-5'>
    <Button asChild>
    <Link href='/c/eldoret/create'>
    Create a Help Request
    </Link>
    </Button>
    
    
    <Button variant='outline' asChild>
    <Link href='/c/create'>
    Start a Fundraiser
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
