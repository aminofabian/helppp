import prisma from '@/app/lib/db';
import { Button } from '@/components/ui/button';
import { Card, CardTitle } from '@/components/ui/card'
import { getKindeServerSession } from '@kinde-oss/kinde-auth-nextjs/server';
import React from 'react';
import CommunityDescriptionForm from '../_CommunityComponents/CommunityDescriptionForm';
import { LinkBreak2Icon } from '@radix-ui/react-icons';
import Pagination from '@/app/_components/Pagination';


import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"




async function getData(name: string, searchParam: string) {
  const [count, data] = await prisma.$transaction([
    prisma.request.count({
      where: {
        communityName: name,
      },
      
    }),
    prisma.community.findUnique({
      where: {
        name: name,
      }, select: {
        name: true,
        createdAt: true,
        updatedAt: true,
        description: true,
        userId: true,
        requests: {
          take: 10,
          skip: searchParam ? (Number(searchParam) - 1) * 10 : 0,
          select: {
            title: true,
            amount: true,
            createdAt: true,
            updatedAt: true,
            deadline: true,
            pointsUsed: true,
            imageString: true,
            Comment: {
              select: {
                id: true,
                text: true,
                createdAt: true,
                
              }
              
            },
            id: true,
            textContent: true,
            Vote: {
              select: {
                userId: true,
                voteType: true,
              },
            },
            User: {
              select: {
                userName: true
                
                
              }
              
              
            }
            
            
          }
          
          
        }
      }
    }),
  ]);
  return {data, count};
  
} 
import { DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import Link from 'next/link';
import { Separator } from '@/components/ui/separator';
import CreatePostCard from '@/app/_components/CreatePostCard';
import { TreesIcon } from 'lucide-react';
import { RequestCard } from '@/app/_components/RequestCard';

interface CreatedAtProps {
  data: {
    createdAt: Date | string;
  };
}


export default async function ShowItems({ params, searchParams }: { searchParams: { page: string }; params: {id: string} }) {
  const {data, count} = await getData(params.id, searchParams.page);
  const { getUser } = getKindeServerSession();
  const user = await getUser();
  
  let displayTime;
  
  function updateDisplayTime() {
    const createdAtDate = data?.createdAt ? new Date(data.createdAt) : null;
    if (!createdAtDate) return; // Exit early if createdAt is undefined
    
    const currentDate = new Date();
    const timeDifferenceInMilliseconds = currentDate.getTime() - createdAtDate.getTime();
    const timeDifferenceInDays = Math.floor(timeDifferenceInMilliseconds / (1000 * 60 * 60 * 24));
    
    if (timeDifferenceInDays > 365) {
      const years = Math.floor(timeDifferenceInDays / 365);
      displayTime = `${years} years ago`;
    } else {
      displayTime = `${timeDifferenceInDays} days ago`;
    }
    
    // Update the display element with the new time
    // Replace 'displayElement' with the actual element you want to update
  }
  updateDisplayTime();
  
  
  
  
  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-3 lg:gap-8 my-5 dark:bg-slate-800">
    <div className="container h-fit rounded-lg lg:col-span-2 my-5">
    {/* The Post Section */}
    <div className='container my-5'>
    <CreatePostCard />
    </div>
    
    {data?.requests?.map((request) => (
      <div  className='container my-2'>
        <RequestCard
      textContent={request.textContent}
      key={request.id}
      id={request.id}
      communityName={data.name}
      title={request.title}
      amount={request.amount}
      jsonContent={request.textContent}
      imageString={request.imageString as string}
      createdAt={request.createdAt}
      updatedAt={request.updatedAt}
      commentCount={request.Comment?.length}
      deadline={request.deadline}
      userName={request.User?.userName as string}
      pointsUsed={request.pointsUsed}
      voteCount1={request.Vote.reduce((acc: number, vote: any) => {
        if (vote.voteType === "LOVE") return acc + 1;
        return acc;
      }, 0)}
      
      voteCount2={request.Vote.reduce((acc: number, vote: any) => {
        if (vote.voteType === "SUSPISION") return acc + 1;
        return acc;
      }, 0)}
      />
      
      </div>
      
    ))}
    
    <Pagination totalPages={Math.ceil(count / 10)} />    
    
    </div>
    <div className="container h-fit rounded-lg bg-secondary my-5 dark:bg-slate-800">
    
    
    <div className="flex flex-col max-w-lg p-6 space-y-6 overflow-hidden rounded-lg shadow-md dark:bg-gray-800 dark:text-gray-50 my-4">
    
    <Card>
    <CardTitle className='text-md md:text-lg py-4 ml-5 flex-shrink-0 flex-wrap'>About <span className='text-primary hover:text-[#10340f] cursor-pointer'>{params.id}</span> Community</CardTitle>
    </Card>
    
    <div className="flex space-x-4">
    <img alt="" src={`https://avatar.vercel.sh/${data?.name}`} className="object-cover w-12 h-12 rounded-full shadow dark:bg-gray-500" />
    <div className="flex flex-col space-y-1">
    <a rel="noopener noreferrer" href={`/c/${data?.name}`} className="text-sm font-semibold">c/{ data?.name}</a>
    <span className="text-xs dark:text-gray-600 flex gap-x-2 text-primary hover:scale-105 cursor-pointer">
    <LinkBreak2Icon /> Created: {displayTime}
    
    {/* {new Date(data?.createdAt as Date).toLocaleDateString('en-us', {
      weekday: 'long',
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    }
  )} */}
  </span>
  <Separator className="my-4" />
  
  <Button asChild><Link href={user?.id ? `/c/${data?.name}/create` : "/api/auth/login"} className='mr-5 mt-5'>Create a Request</Link></Button>
  </div>
  </div>
  <div>
  <img src="https://source.unsplash.com/random/100x100/?5" alt="" className="object-cover w-full mb-4 h-[20dv] sm:h-96 dark:bg-secondary rounded-xl" />
  <h2 className="mb-1 text-xl font-semibold">{params.id}</h2>
  <p className="text-sm dark:text-gray-600">{ data?.description}</p>
  {user?.id === data?.userId ? (
    <DropdownMenu>
    <DropdownMenuTrigger asChild>
    <Button variant="default" className='w-full my-5'>Edit Community Description</Button>
    </DropdownMenuTrigger>
    <DropdownMenuContent className="w-[35dvh] overflow-visible mb-5">
    <CommunityDescriptionForm description={data?.description} communityName={params.id} />
    </DropdownMenuContent>
    </DropdownMenu>
  ): <Button className = 'text-sm font-semibold text-slate-50 px-5 mt-5 relative top-0 right-[-90px]'>Join Community</Button>}
  
  
  {/* {user?.id === data?.userId? <Button className='text-sm font-semibold text-slate-50 px-5'>Edit Description</Button> : <Button className='text-sm font-semibold text-slate-50 px-5'>Join Community</Button>} */}
  </div>
  <div className="flex flex-wrap justify-between">
  <div className="space-x-2">
  <button aria-label="Share this post" type="button" className="p-2 text-center">
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" className="w-4 h-4 fill-current dark:text-violet-600">
  <path d="M404,344a75.9,75.9,0,0,0-60.208,29.7L179.869,280.664a75.693,75.693,0,0,0,0-49.328L343.792,138.3a75.937,75.937,0,1,0-13.776-28.976L163.3,203.946a76,76,0,1,0,0,104.108l166.717,94.623A75.991,75.991,0,1,0,404,344Zm0-296a44,44,0,1,1-44,44A44.049,44.049,0,0,1,404,48ZM108,300a44,44,0,1,1,44-44A44.049,44.049,0,0,1,108,300ZM404,464a44,44,0,1,1,44-44A44.049,44.049,0,0,1,404,464Z"></path>
  </svg>
  </button>
  <button aria-label="Bookmark this post" type="button" className="p-2">
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" className="w-4 h-4 fill-current dark:text-violet-600">
  <path d="M424,496H388.75L256.008,381.19,123.467,496H88V16H424ZM120,48V456.667l135.992-117.8L392,456.5V48Z"></path>
  </svg>
  </button>
  </div>
  <div className="flex space-x-2 text-sm dark:text-gray-600">
  <button type="button" className="flex items-center p-1 space-x-1.5">
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" aria-label="Number of comments" className="w-4 h-4 fill-current dark:text-violet-600">
  <path d="M448.205,392.507c30.519-27.2,47.8-63.455,47.8-101.078,0-39.984-18.718-77.378-52.707-105.3C410.218,158.963,366.432,144,320,144s-90.218,14.963-123.293,42.131C162.718,214.051,144,251.445,144,291.429s18.718,77.378,52.707,105.3c33.075,27.168,76.861,42.13,123.293,42.13,6.187,0,12.412-.273,18.585-.816l10.546,9.141A199.849,199.849,0,0,0,480,496h16V461.943l-4.686-4.685A199.17,199.17,0,0,1,448.205,392.507ZM370.089,423l-21.161-18.341-7.056.865A180.275,180.275,0,0,1,320,406.857c-79.4,0-144-51.781-144-115.428S240.6,176,320,176s144,51.781,144,115.429c0,31.71-15.82,61.314-44.546,83.358l-9.215,7.071,4.252,12.035a231.287,231.287,0,0,0,37.882,67.817A167.839,167.839,0,0,1,370.089,423Z"></path>
  <path d="M60.185,317.476a220.491,220.491,0,0,0,34.808-63.023l4.22-11.975-9.207-7.066C62.918,214.626,48,186.728,48,156.857,48,96.833,109.009,48,184,48c55.168,0,102.767,26.43,124.077,64.3,3.957-.192,7.931-.3,11.923-.3q12.027,0,23.834,1.167c-8.235-21.335-22.537-40.811-42.2-56.961C270.072,30.279,228.3,16,184,16S97.928,30.279,66.364,56.206C33.886,82.885,16,118.63,16,156.857c0,35.8,16.352,70.295,45.25,96.243a188.4,188.4,0,0,1-40.563,60.729L16,318.515V352H32a190.643,190.643,0,0,0,85.231-20.125,157.3,157.3,0,0,1-5.071-33.645A158.729,158.729,0,0,1,60.185,317.476Z"></path>
  </svg>
  <span>30</span>
  </button>
  <button type="button" className="flex items-center p-1 space-x-1.5">
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" aria-label="Number of likes" className="w-4 h-4 fill-current dark:text-violet-600">
  <path d="M126.638,202.672H51.986a24.692,24.692,0,0,0-24.242,19.434,487.088,487.088,0,0,0-1.466,206.535l1.5,7.189a24.94,24.94,0,0,0,24.318,19.78h74.547a24.866,24.866,0,0,0,24.837-24.838V227.509A24.865,24.865,0,0,0,126.638,202.672ZM119.475,423.61H57.916l-.309-1.487a455.085,455.085,0,0,1,.158-187.451h61.71Z"></path>
  <path d="M494.459,277.284l-22.09-58.906a24.315,24.315,0,0,0-22.662-15.706H332V173.137l9.573-21.2A88.117,88.117,0,0,0,296.772,35.025a24.3,24.3,0,0,0-31.767,12.1L184.693,222.937V248h23.731L290.7,67.882a56.141,56.141,0,0,1,21.711,70.885l-10.991,24.341L300,169.692v48.98l16,16H444.3L464,287.2v9.272L396.012,415.962H271.07l-86.377-50.67v37.1L256.7,444.633a24.222,24.222,0,0,0,12.25,3.329h131.6a24.246,24.246,0,0,0,21.035-12.234L492.835,310.5A24.26,24.26,0,0,0,496,298.531V285.783A24.144,24.144,0,0,0,494.459,277.284Z"></path>
  </svg>
  <span>283</span>
  </button>
  </div>
  </div>
  </div>
  
  </div>
  </div>
)
}
