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
    <div className="container px-4 sm:px-6 py-2 sm:py-3 mx-auto max-w-7xl">
      <div className="grid grid-cols-1 gap-3 sm:gap-4 lg:grid-cols-4 lg:gap-6">
        <div className="h-fit rounded-lg border border-green-50/20 floating hidden md:block order-last lg:sticky lg:top-20">
          <RightNavHome />
        </div>
        
        <div className="h-fit rounded-lg lg:col-span-2 order-2 space-y-3 sm:space-y-4">
          <CreatePostCard />
          <Suspense fallback={<SuspenseCard />}>
            <ShowItems />
          </Suspense>
        </div>
        
        <div className="h-fit rounded-lg sticky top-20 shadow-lg border border-green-50/20 p-3 sm:p-4 lg:p-5 order-first lg:order-none">
          <HomeNavRightWrapper />
        </div>
      </div>
    </div>
  );
}
