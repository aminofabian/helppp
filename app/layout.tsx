import type { Metadata } from "next";
import { Jost } from "next/font/google";
import "./globals.css";
import Navbar from "@/app/_components/Navbar";
import { ThemeProvider } from "@/components/ThemeProvider";
import { Toaster } from "@/components/ui/toaster"
import MenuBar from "./_components/MenuBar";


const inter = Jost ({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Create Next App",
  description: "Generated by create next app",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning={true}>
    <body className={`flex min-h-screen flex-col ${inter.className}`} >
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
    </ThemeProvider>
    <MenuBar className='sticky bottom-0 flex w-full justify-evenly border-t bg-card p-3 sm:hidden'/>
    </body>
    </html>
  );
}
