'use server';

import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import { getRequest } from '../actions';

// Export types
export type CommentWithRelations = {
  id: string;
  text: string;
  createdAt: Date;
  userId: string;
  requestId: string;
  User: {
    userName: string;
    email: string;
    imageUrl: string | null;
  } | null;
  _count: {
    reactions: number;
  };
};

export type RequestData = {
  id: string;
  title: string;
  textContent: any;
  imageString: string | null;
  amount: number;
  funded: number;
  contributors: number;
  createdAt: Date;
  updatedAt: Date;
  deadline: Date;
  pointsUsed: number;
  status: string | null;
  userId: string;
  communityName: string | null;
  User: {
    id: string;
    userName: string;
    email: string;
    imageUrl: string | null;
  } | null;
  Community: {
    name: string;
    description: string | null;
    createdAt: Date;
  } | null;
  Comment: CommentWithRelations[];
  Vote: Array<{
    voteType: string;
  }>;
  donations: Array<{
    id: string;
    amount: number;
    createdAt: Date;
    status: string;
    userId: string;
  }>;
};

// Client Components
import { ClientFundingProgress } from './FundingProgress';
import { ClientComments } from './Comments';
import { ClientRequestContent } from './RequestContent';

// Calculate derived data
function calculateDerivedData(data: any): RequestData {
  return {
    ...data,
    funded: data.donations.reduce((sum: number, d: { amount: number }) => sum + d.amount, 0),
    contributors: new Set(data.donations.map((d: { userId: string }) => d.userId)).size
  };
}

async function fetchRequestData(id: string) {
  const data = await getRequest(id);
  if (!data) return null;
  return calculateDerivedData(data);
}

export default async function RequestPage({params}: {params: {id: string}}) {
  const data = await fetchRequestData(params.id);
  
  if (!data) {
    notFound();
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <Suspense fallback={<div>Loading...</div>}>
        <ClientRequestContent request={data} />
        <ClientFundingProgress initialData={data} />
        <ClientComments data={data} requestId={params.id} />
      </Suspense>
    </div>
  );
}
