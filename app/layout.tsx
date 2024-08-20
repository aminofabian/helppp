import type { Metadata } from "next";
import { Jost } from "next/font/google";
import "./globals.css";
import Navbar from "@/app/_components/Navbar";
import { ThemeProvider } from "@/components/ThemeProvider";
import { Toaster } from "@/components/ui/toaster"
import MenuBar from "./_components/MenuBar";


const inter = Jost ({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Fitrii - Building a World of Mutual Support",
  description: "Fitrii is a global network fostering reciprocal kindness. Give help, get help - join our movement to create a world where compassion is the norm and community support is just a tap away.",
  keywords: ["Fitrii", "Humanitarin", "community support", "mutual aid", "kindness network", "social impact", "help exchange", "compassion movement"],
  authors: [{ name: "Fitrii Team" }],
  openGraph: {
    title: "Fitrii - Cultivating a World of Reciprocal Kindness",
    description: "Join Fitrii in building a global community where the kindness you give is the kindness you can count on receiving. Together, we're making help tangible and accessible for everyone.",
    images: [{ url: "/images/fitrii-og-image.jpg" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Fitrii - Your Community-Powered Support Network",
    description: "Imagine a world where every hand reaches out to help. That's Fitrii - join us in creating a global network of givers and receivers.",
    images: ["/images/fitrii-twitter-image.jpg"],
  },
  viewport: "width=device-width, initial-scale=1",
  robots: "index, follow",
  alternates: {
    canonical: "https://www.fitrii.com",
  },
  category: "Social Impact",
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
