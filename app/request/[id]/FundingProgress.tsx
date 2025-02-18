'use client';

import { Verified } from 'lucide-react';
import useSWR from 'swr';
import Slider from '@/app/_components/Slider';
import type { RequestData } from './page';

interface FundingProgressProps {
  initialData: RequestData;
}

export const ClientFundingProgress = ({ initialData }: FundingProgressProps) => {
  const { data } = useSWR<RequestData>(
    `/api/request/${initialData.id}`,
    async (url) => {
      const res = await fetch(url);
      if (!res.ok) throw new Error('Failed to fetch request data');
      return res.json();
    },
    {
      refreshInterval: 5000,
      fallbackData: initialData,
      revalidateOnFocus: true,
      revalidateOnReconnect: true
    }
  );

  const amount = data?.amount || 0;
  const funded = data?.funded || 0;
  const progress = Math.floor((funded / (amount || 1)) * 100);
  const communityName = data?.communityName || 'Unknown Community';

  return (
    <div className="p-6 py-12 dark:bg-violet-600 dark:text-gray-50">
      <div className="container mx-auto">
        <div className="flex flex-col lg:flex-row items-center justify-between">
          <h2 className="text-center text-4xl tracking-tighter font-bold">
            {progress}% of <span className='text-4xl text-primary'><span className='text-xl mr'>KES</span>{amount}</span>
            <br className="sm:hidden" /> Covered
            <Slider contributed={funded} total={amount || 1} />
          </h2>
          <div className="space-x-2 text-center py-2 lg:py-0">
            <span><p className='text-xs'> Created By: <a href={`/u/${data?.User?.userName}`}>u/{data?.User?.userName || 'Anonymous'}</a></p></span>
            <span className="font-bold text-lg">
              <a href={`/c/${communityName}`}>{communityName.toUpperCase()}</a>
            </span>
          </div>
          <div rel="noreferrer noopener" className="px-5 mt-4 lg:mt-0 py-3 rounded-md border block dark:bg-gray-900 dark:text-gray-50 dark:border-gray-600 mx-3">
            <div className="inline-flex items-center divide-x rounded dark:bg-violet-600 dark:text-gray-100 dark:divide-gray-300">
              <button type="button" className="px-2 py-2">
                <Verified className='text-primary' /> 
              </button>
              <button type="button" title="levels" className=" bg-primary text-secondary rounded-full h-6 w-6 text-center text-xs">
                {data?.User?.level || 0}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
