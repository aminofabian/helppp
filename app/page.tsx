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
    <div className="w-full md:container md:px-6 mx-auto max-w-7xl">
      <div className="grid grid-cols-1 gap-2 md:gap-4 lg:grid-cols-4 lg:gap-6">
        <div className="h-fit rounded-none md:rounded-lg border-x-0 md:border border-green-50/20 floating hidden md:block order-last lg:sticky lg:top-20">
          <RightNavHome />
        </div>
        
        <div className="h-fit rounded-none md:rounded-lg lg:col-span-2 order-2 space-y-2 md:space-y-4">
          <CreatePostCard />
          <Suspense fallback={<SuspenseCard />}>
            <ShowItems />
          </Suspense>
        </div>
        
        <div className="h-fit rounded-none md:rounded-lg sticky top-0 md:top-20 shadow-lg border-x-0 md:border border-green-50/20 p-3 md:p-4 lg:p-5 order-first lg:order-none bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm">
          <HomeNavRightWrapper />
        </div>
      </div>
    </div>
  );
}
