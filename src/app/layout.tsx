import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import { LanguageProvider } from '@/contexts/LanguageContext';

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "AutoFood - Delivery Management System",
  description: "Smart delivery management system with AI-powered routing and comprehensive admin dashboard.",
  keywords: ["AutoFood", "Delivery", "Management", "AI Routing", "Next.js", "React"],
  authors: [{ name: "AutoFood Team" }],
  openGraph: {
    title: "AutoFood - Delivery Management System",
    description: "Smart delivery management system with AI-powered routing and comprehensive admin dashboard.",
    url: "https://autofood.vercel.app/",
    siteName: "AutoFood",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "AutoFood - Delivery Management System",
    description: "Smart delivery management system with AI-powered routing and comprehensive admin dashboard.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        <LanguageProvider>
          {children}
          <Toaster />
        </LanguageProvider>
      </body>
    </html>
  );
}
