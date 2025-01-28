import { getKindeServerSession } from '@kinde-oss/kinde-auth-nextjs/server';
import { redirect } from 'next/navigation';

export default async function UserMePage() {
  const { getUser } = getKindeServerSession();
  const user = await getUser();
  
  if (!user) {
    redirect('/api/auth/login');
  }
  
  redirect(`/user/${user.id}`);
} 