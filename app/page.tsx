import CreatePostCard from "./_components/CreatePostCard";
import HomeNavRightWrapper from "./_components/HomeNavRightWrapper";
import { Suspense } from "react";
import RightNavHome from "./_components/RightNavHome";


import dynamic from 'next/dynamic';
import SuspenseCard from "./_components/SuspenseCard";

// Dynamically import ShowItems
const ShowItems = dynamic(() => import("./_components/ShowItems").then(mod => mod.ShowItems), {
  ssr: false,
});

export default function Home({ searchParams }: { searchParams: { page: string } }) {
  return (
    <div className="container my-3">
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-4 lg:gap-8">
    
    <div className="h-fit rounded-lg border border-green-50 floating hidden md:block order-last">
    <RightNavHome />
    </div>
    
    <div className="h-fit rounded-lg lg:col-span-2 order-2">
    <CreatePostCard />
    <Suspense fallback={<SuspenseCard />}>
    <ShowItems />
    </Suspense>
    </div>
    
    <div className="h-fit rounded-lg sticky shadow-lg border-green-50 p-5">
    <HomeNavRightWrapper />
    </div>
    
    </div>
    </div>
  );
}
