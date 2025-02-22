import { getKindeServerSession } from '@kinde-oss/kinde-auth-nextjs/server';
import { redirect } from 'next/navigation';
import prisma from '@/app/lib/db';
import { CreateRequestForm } from '@/app/_components/CreateRequestForm';
import { createRequest } from '@/app/actions';

async function getUserLevel(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { level: true },
  });

  return user?.level ?? 1;
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

  const userLevel = await getUserLevel(user.id);

  if (userLevel < 2) {
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
      userLevel={userLevel}
    />
  );
}
