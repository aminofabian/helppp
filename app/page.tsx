import Image from "next/image";
import Navbar from "@/app/_components/Navbar";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import CreatePostCard from "./_components/CreatePostCard";
import HomeNavRight from "./_components/HomeNavRight";
import  { ShowItems } from "./_components/RequestDisplay";
import { Suspense } from "react";
import SuspenseCard from "./_components/SuspenseCard";



export default function Home({
  searchParams,
}: {
  searchParams: { page: string };
}) {  return (
  <div className=" container my-10">  
  <div className="grid grid-cols-1 gap-4 lg:grid-cols-4 lg:gap-8">
  <div className="h-screen rounded-lg border border-primary floating hidden md:block order-last">
  <Card className=" my-5 mx-3 px-3">
  
  <div className="flex flex-col max-w-md p-6 dark:bg-gray-50 dark:text-gray-800">
  <img src="https://source.unsplash.com/200x200/?portrait?3" alt="" className="flex-shrink-0 object-cover h-32 rounded-sm sm:h-64 dark:bg-gray-500 aspect-square" />
  <div>
  <h2 className="text-xl font-semibold">Surprise saint Valentin 😍</h2>
  <span className="block pb-2 text-sm dark:text-gray-600">by concluding-tort</span>
  <p>Maintaining proper oral and dental hygiene in young children is of utmost importance, especially for those who use</p>
  <Button> Click Here to Help</Button>
  </div>
  </div>
  
  
  <h1 className='text-lg font-bold my-2'>  Communities You Can Join</h1>
  <div className="flex justify-center">
  <ul className=" mb-5 space-y-3 text-sm">
  <li><span>c/</span><Link href='/c/eldoret' className="text-primary">eldoret</Link></li>
  <li><span>c/</span><Link href='/c/eldoret_helper&#39;s_association' className="text-primary">eldoret_helper's_association</Link></li>
  <li><span>c/</span><Link href='/c/kenya_helper&#39;s_association' className="text-primary">kenya_helper's_association</Link></li>
  <li><span>c/</span><Link href='/c/kenya_helper&#39;s_association' className="text-primary">kisumu_helper's_association</Link></li>
  <li><span>c/</span><Link href='/c/kenya_helper&#39;s_association' className="text-primary">nairobi_helper's_association</Link></li>
  
  
  </ul>
  
  </div>
  </Card>
  </div>
  <div className="h-fit rounded-lg lg:col-span-2 order-2">
  <CreatePostCard />
  
  <Suspense fallback={
    <SuspenseCard />
  } key={searchParams.page}>
  <ShowItems searchParams={searchParams} />
  </Suspense>
  
  </div>
  <div className="h-fit rounded-lg sticky">
  <HomeNavRight />
  
  </div>
  </div>
  </div>
);
}
