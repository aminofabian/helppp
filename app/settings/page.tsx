import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import prisma from "../lib/db";
import { redirect } from "next/navigation";
import SettingsForm from "./_components/SettingsForm";



async function getData(userId: string) {
  const data = await prisma.user.findUnique({
    where: {
      id: userId
    }, select: {
      userName: true,
    }
  });
  return data;
  
}
async function SettingsPage() {
  const { getUser } = getKindeServerSession();
  const user = await getUser();
  if (!user) {
    return redirect('/api/auth/login');
  }
  const data = await getData(user.id);
  return (
    <div className="Container mx-auto flex flex-col items-center gap-4">
    <SettingsForm username={data?.userName} />
    </div>
    )
  }
  
  export default SettingsPage;