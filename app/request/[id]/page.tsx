import CommentForm from '@/app/_components/CommentForm';
import { RequestCard } from '@/app/_components/RequestCard';
import Slider from '@/app/_components/Slider';
import CommunityDescriptionForm from '@/app/c/_CommunityComponents/CommunityDescriptionForm';
import prisma from '@/app/lib/db';
import { Button } from '@/components/ui/button';
import { Card, CardTitle } from '@/components/ui/card';
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Separator } from '@/components/ui/separator';
import { LinkBreak2Icon } from '@radix-ui/react-icons';
import { Star, Verified } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';


async function getData(id: string){
  const data = await prisma.request.findUnique({
    where: {
      id: id,
    },
    select: {
      createdAt: true,
      updatedAt: true,
      id: true,
      deadline: true,
      textContent: true,
      imageString: true,
      amount: true,
      pointsUsed: true,
      Vote: true,
      title: true,
      communityName: true,
      donations: true,
      Comment: {
        orderBy: {
          createdAt: 'desc',
          
        },
        select: {
          id: true,
          createdAt: true,
          text: true,
          User: {
            select: {
              userName: true,
              email: true,
              imageUrl: true, 
            } 
          }
        }
      },
      Community: {
        select: {
          name: true,
          createdAt: true,
          description: true,
          creatorId: true,
          
        }
        
      },
      User: {
        select: {
          id:true,
          userName: true,
          firstName: true,
          lastName: true,
          points: true,
          requests: true,
          email: true,
          level:true,
          
        }
      }
      
    }
    
  })
  if(!data) {
    return notFound();
  }

  // Calculate total funded amount and unique contributors
  const funded = data.donations.reduce((sum, donation) => sum + (donation.amount || 0), 0);
  const contributors = new Set(data.donations.map(donation => donation.userId)).size;

  return {
    ...data,
    funded,
    contributors
  };
}

export default async function Request({params}: {params: {id: string}}) {
  const data = await getData(params.id);
  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-3 lg:gap-8 my-5">    
    <div className="h-fit rounded-lg lg:col-span-2 mb-10">
    <div className='pl-5 mt-5'>
    
    <div className="p-6 py-12 dark:bg-violet-600 dark:text-gray-50">
    <div className="container mx-auto">
    <div className="flex flex-col lg:flex-row items-center justify-between">
    <h2 className="text-center text-4xl tracking-tighter font-bold"> {Math.floor(700 / data?.amount * 100)}% of <span className='text-4xl text-primary'><span className='text-xl mr'>KES</span>{data?.amount}</span>
    <br className="sm:hidden" /> Covered
    <Slider contributed={700} total={data?.amount || 1} />
    </h2>
    <div className="space-x-2 text-center py-2 lg:py-0">
    <span>    <p className='text-xs'> Created By: <a href={`/u/${data.User?.userName}`}>u/{data.User?.userName}</a> </p></span>
    <span className="font-bold text-lg" > <a href={`/c/${data.communityName}`}>{data.communityName?.toUpperCase() }</a></span>
    </div>
    <div rel="noreferrer noopener" className="px-5 mt-4 lg:mt-0 py-3 rounded-md border block dark:bg-gray-900 dark:text-gray-50 dark:border-gray-600 mx-3">
    <div className="inline-flex items-center divide-x rounded dark:bg-violet-600 dark:text-gray-100 dark:divide-gray-300">
    <button type="button" className="px-2 py-2">     <Verified className='text-primary' /> 
    </button>
    <button type="button" title="levels" className=" bg-primary text-secondary rounded-full h-6 w-6 text-center text-xs">
    {data.User?.level}
    </button>
    </div>
    
    </div>
    </div>
    </div>
    </div>
    
    
    
    <p className='text-xs'> Created By: <a href={`/u/${data.User?.userName}`}>u/{data.User?.userName}</a> </p>
    
    </div>
    <div className='my-10'>
    <RequestCard
    key={data.id}
    
    userId={data.User?.id ?? ''}
    title={data.title}
    id={data.id}
    amount={data.amount}
    funded={data.funded}
    contributors={data.contributors}
    textContent={data.textContent}
    jsonContent={data.textContent}
    imageString={data.imageString as string}
    createdAt={data.createdAt}
    updatedAt={data.updatedAt}
    deadline={data.deadline}
    userName={data.User?.userName as string}
    communityName={data.communityName as string}
    pointsUsed={data.pointsUsed}
    commentCount={data.Comment.length}
    voteCount1={data.Vote.reduce((acc: number, vote: any) => {
      if (vote.voteType === "LOVE") return acc + 1;
      return acc;
    }, 0)}
    voteCount2={data.Vote.reduce((acc: number, vote: any) => {
      if (vote.voteType === "SUSPISION") return acc + 1;
      return acc;
    }, 0)}
    />
    <CommentForm requestId={params.id} userName={data.User?.userName as string} />
    
    <Separator className='my-5 font-bold' />
    <div className='flex flex-col gap-y-7'>
    {data.Comment.map((item) => (
      <div className="flex items-center justify-between p-6 border-x-8 border-secondary sm:py-8 text-slate-500 rounded-lg border-y" >
      <div key={item.id} className='flex flex-col w-full'>
      <div className='flex gap-x-3'>
      <Image 
      src={item.User?.imageUrl ? item.User?.imageUrl : '/fitrii.png'}
      width={64}
      height={64}
      alt='user image'
      className='border p-3 rounded-full h-10 w-10'
      />
      <p className='tracking-wider'>{item.text}</p>
      </div>
      <p className='text-xs my-3 font-bold'>By <a href={`/u/${data.User?.id}`}>{item.User?.userName}</a> </p>
      <p className='ml-auto text-sm'> {item.createdAt.toDateString()} </p>
      </div>
      </div>
    )
  )}
  
  </div>
  
  
  </div>
  </div>
  
  {/* Right Sidebar Div  Start*/}
  <div className="h-32 rounded-lg bg-gray-200">
  <div className="container h-fit rounded-lg bg-secondary my-5 dark:bg-slate-800">
  
  
  <div className="flex flex-col max-w-lg p-6 space-y-6 overflow-hidden rounded-lg shadow-md dark:bg-gray-800 dark:text-gray-50 my-4">
  
  <Card>
  <CardTitle className='text-md md:text-lg py-4 ml-5 flex-shrink-0 flex-wrap'>About <span className='text-primary hover:text-[#10340f] cursor-pointer'>{data.Community?.name}</span> Community</CardTitle>
  </Card>
  
  <div className="flex space-x-4">
  <img alt="" src={`https://avatar.vercel.sh/${data?.communityName}`} className="object-cover w-12 h-12 rounded-full shadow dark:bg-gray-500" />
  <div className="flex flex-col space-y-1">
  <a rel="noopener noreferrer" href={`/c/${data?.communityName}`} className="text-sm font-semibold">c/{ data?.communityName}</a>
  <span className="text-xs dark:text-gray-600 flex gap-x-2 text-primary hover:scale-105 cursor-pointer">
  <LinkBreak2Icon /> Created: {data.Community?.createdAt.toDateString()}
  
  </span>
  <Separator className="my-4" />
  
  <Button asChild><Link href={`/c/${data?.communityName}/create`}>Create a Help Request</Link></Button>
  </div>
  </div>
  <div>
  <img src="/poster.png" alt="" className="object-cover w-full mb-4 h-[20dv] sm:h-96 dark:bg-secondary rounded-xl" />
  <h2 className="mb-1 text-xl font-semibold">{data.Community?.name}</h2>
  <p className="text-sm dark:text-gray-600">{ data.Community?.description}</p>
  <DropdownMenu>
  <DropdownMenuTrigger asChild>
  <Button variant="default" className='w-full my-5'>Edit Community Description</Button>
  </DropdownMenuTrigger>
  <DropdownMenuContent className="w-[35dvh] overflow-visible mb-5">
  <CommunityDescriptionForm description={data?.Community?.description} communityName={data?.Community?.name as string} />
  </DropdownMenuContent>
  </DropdownMenu>
  
  
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
  
  </div>
)
}
