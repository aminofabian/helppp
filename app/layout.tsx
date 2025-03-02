import type { Metadata } from "next";
import { Plus_Jakarta_Sans, Dancing_Script } from "next/font/google";
import "./globals.css";
import Navbar from "@/app/_components/Navbar";
import { ThemeProvider } from "@/components/ThemeProvider";
import { Toaster } from "@/components/ui/toaster"
import MenuBar from "./_components/MenuBar";
import PushNotificationManager from './_components/PushNotificationManager';

const jakarta = Plus_Jakarta_Sans({ 
  subsets: ["latin"],
  display: 'swap',
  variable: '--font-jakarta',
  weight: ['400', '500', '600', '700'],
  adjustFontFallback: true,
});

const dancingScript = Dancing_Script({
  subsets: ["latin"],
  display: 'swap',
  variable: '--font-handwriting',
});

export const metadata: Metadata = {
  title: "Fitrii™ || Building a World of Mutual Support",
  description: "Fitrii is a global network fostering reciprocal kindness. Give help, get help - join our movement to create a world where compassion is the norm and community support is just a tap away.",
  keywords: ["Fitrii", "Humanitarin", "community support", "mutual aid", "kindness network", "social impact", "help exchange", "compassion movement"],
  authors: [{ name: "Fitrii Team" }],
  verification: {
    google: "MWk5_1aM0dp4fM0fJv3DU4dkqbHPZnbkrWD_4fC4dNA",
  }
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning={true}>
      <body className={`flex min-h-screen flex-col ${jakarta.variable} ${dancingScript.variable} antialiased text-[14px] leading-relaxed`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <Navbar />
          <div className='container mx-auto px-4'>
            {children}
          </div>
          <Toaster />
          <PushNotificationManager />
        </ThemeProvider>
        <MenuBar className='sticky bottom-0 flex w-full justify-evenly border-t bg-card p-3 sm:hidden'/>
      </body>
    </html>
  );
}
