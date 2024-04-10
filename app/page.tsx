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
  <div className="h-screen rounded-lg border border-primary floating hidden md:block"></div>
  <div className="h-fit rounded-lg lg:col-span-2">
  <CreatePostCard />
  
  <Suspense fallback={
    <SuspenseCard />
  }>
  <ShowItems searchParams={searchParams} />
  </Suspense>
  
  </div>
  <div className="h-screen rounded-lg sticky">
  <HomeNavRight />
  
  </div>
  </div>
  </div>
  );
}
