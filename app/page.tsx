import CreatePostCard from "./_components/CreatePostCard";
import HomeNavRight from "./_components/HomeNavRight";
import { ShowItems } from "./_components/RequestDisplay";
import { Suspense } from "react";
import SuspenseCard from "./_components/SuspenseCard";
import RightNavHome from "./_components/RightNavHome";

export default function Home({ searchParams }: { searchParams: { page: string } }) {
  return (
    <div className="container my-10">
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-4 lg:gap-8">
    
    <div className="h-fit rounded-lg border border-primary floating hidden md:block order-last">
    <RightNavHome />
    </div>
    
    <div className="h-fit rounded-lg lg:col-span-2 order-2">
    <CreatePostCard />
    <Suspense fallback={<SuspenseCard />} key={searchParams.page}>
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
