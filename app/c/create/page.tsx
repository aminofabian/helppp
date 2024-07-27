import { getKindeServerSession } from '@kinde-oss/kinde-auth-nextjs/server';
import { redirect } from 'next/navigation';
import prisma from '@/app/lib/db';
import CreateCommunityForm from '@/app/_components/CheckLevel';

async function getUserLevel(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { level: true },
  });
  
  return user?.level ?? 1;
}

export default async function CreateCommunityPage() {
  const { getUser } = getKindeServerSession();
  const user = await getUser();
  
  if (!user) {
    return redirect('/api/auth/login');
  }
  
  const userLevel = await getUserLevel(user.id);
  
  if (userLevel < 5) {
    return redirect('/community-denied');
  }
  
  return <CreateCommunityForm />;
}