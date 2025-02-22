import { getKindeServerSession } from '@kinde-oss/kinde-auth-nextjs/server';
import { redirect } from 'next/navigation';
import prisma from '@/app/lib/db';
import { CreateRequestForm } from '@/app/_components/CreateRequestForm';
import { createRequest } from '@/app/actions';

async function getUserData(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { 
      level: true,
      requests: {
        where: {
          OR: [
            { status: null },
            { 
              NOT: {
                status: {
                  in: ['FUNDED', 'CLOSED']
                }
              }
            }
          ]
        },
        select: {
          amount: true,
          status: true,
          createdAt: true
        }
      }
    },
  });

  const userLevel = user?.level ?? 1;
  const LEVEL_LIMITS = {
    1: 0,
    2: 1000,
    3: 3000,
    4: 5000,
    5: 10000,
    6: 20000,
    7: 50000,
    8: 100000,
    9: 1000000,
    10: 100000000,
  } as const;

  // Calculate total amount of active requests
  const totalActiveRequests = user?.requests.reduce((total, request) => total + request.amount, 0) ?? 0;

  // Calculate the level limit
  const levelLimit = LEVEL_LIMITS[userLevel as keyof typeof LEVEL_LIMITS];

  // Calculate remaining available limit
  const remainingLimit = Math.max(0, levelLimit - totalActiveRequests);

  console.log('Debug User Data:', {
    userLevel,
    levelLimit,
    totalActiveRequests,
    remainingLimit,
    activeRequests: user?.requests.map(req => ({
      amount: req.amount,
      status: req.status,
      createdAt: req.createdAt
    }))
  });

  return {
    level: userLevel,
    totalReceivedDonations: 0, // We'll handle this separately
    remainingLimit,
    levelLimit
  };
}

export default async function CreateRequestPage({
  params,
}: {
  params: { id: string }
}) {
  const { getUser } = getKindeServerSession();
  const user = await getUser();

  if (!user) {
    redirect('/api/auth/login');
  }

  const userData = await getUserData(user.id);

  if (userData.level < 2) {
    return redirect('/access-denied');
  }

  const communityGuidelines = [
    { id: 1, text: "Be clear and honest about your needs when requesting help from the community." },
    { id: 2, text: "Do not engage in fraudulent activities or attempt to scam others for monetary aid." },
    { id: 3, text: "Before seeking assistance, consider how you can contribute and support others within the community." },
    { id: 4, text: "Report any suspicious requests or behavior to the moderators to maintain a safe environment." },
    { id: 5, text: "Respect the boundaries and privacy of others in the community. Do not pressure or guilt-trip users into providing assistance." },
    { id: 6, text: "Engage in constructive dialogue and be open to feedback when discussing your needs or offering help." },
    { id: 7, text: "Avoid overposting or spamming the community with repeated requests for aid." },
    { id: 8, text: "Express gratitude for any assistance received, regardless of the outcome." },
    { id: 9, text: "Ensure that your requests comply with the rules and regulations of the platform and relevant jurisdictions." },
    { id: 10, text: "Take the time to read and understand the guidelines and terms of service of the platform to ensure responsible usage." }
  ];

  return (
    <CreateRequestForm 
      createRequest={createRequest}
      communityGuidelines={communityGuidelines}
      params={params} 
      userLevel={userData.level}
      totalReceivedDonations={userData.totalReceivedDonations}
      remainingLimit={userData.remainingLimit}
      levelLimit={userData.levelLimit}
    />
  );
}
