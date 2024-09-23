import { getKindeServerSession } from '@kinde-oss/kinde-auth-nextjs/server';
import { redirect } from 'next/navigation';
import prisma from '@/app/lib/db';
import CreateCommunityForm from '@/app/_components/CheckLevel';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

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
  
  if (userLevel < 2) {
    return (
      <Alert>
      <AlertTitle>Access Denied</AlertTitle>
      <AlertDescription>
      Only level two members are allowed to create a help request.
      <Link href="/community-denied">
      <Button variant="link">Click here to learn more</Button>
      </Link>
      </AlertDescription>
      </Alert>
    );
  }
  
  return <CreateCommunityForm />;
}