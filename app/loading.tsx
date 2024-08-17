import { Skeleton } from '@/components/ui/skeleton'
import React from 'react'

function Loading() {
  return (
    <>
    <div className="container grid grid-cols-1 gap-4 lg:grid-cols-3 lg:gap-8 my-5 mx-auto">
    <div className="h-fit rounded lg:col-span-3 my-5">
    <Skeleton className="h-[400px] rounded-lg my-5" />
    <Skeleton className=" h-[400px] rounded-lg my-5" />
    <Skeleton className=" h-[400px] rounded-lg my-5" />
    </div>
    </div>
    
    
    </>
  )
}

export default Loading;