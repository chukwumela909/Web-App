import type { Metadata } from "next";
import { Geist, Geist_Mono, Archivo, DM_Sans, Manrope, Roboto, Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";
import { StaffProvider } from "@/contexts/StaffContext";
import { AdminAccessProvider } from "@/contexts/AdminAccessContext";
import { OnboardingProvider } from "@/components/onboarding/OnboardingProvider";
import ErrorHandler from "@/components/ErrorHandler";
import ChatwootWidget from "@/components/ChatwootWidget";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const archivo = Archivo({
  variable: "--font-archivo",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

const roboto = Roboto({
  variable: "--font-roboto",
  subsets: ["latin"],
  weight: ["300", "400", "700"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "FahamPesa - Lightweight Sales & Inventory App for Small Business",
  description: "A native Android app designed for small business owners in Kenya. Track inventory, record sales, and manage your business with sunlight-optimized design and offline-first functionality.",
  keywords: "sales app, inventory management, small business, Kenya, offline app, business tools",
  authors: [{ name: "FahamPesa Team" }],
  openGraph: {
    title: "FahamPesa - Lightweight Sales & Inventory App",
    description: "Track inventory, record sales, and manage your business with our sunlight-optimized mobile app.",
    type: "website",
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
        className={`${geistSans.variable} ${geistMono.variable} ${archivo.variable} ${dmSans.variable} ${manrope.variable} ${roboto.variable} ${inter.variable} antialiased`} 
        suppressHydrationWarning={true}
      >
        <ErrorHandler />
        <ChatwootWidget />
        <AuthProvider>
          <StaffProvider>
            <AdminAccessProvider>
              <OnboardingProvider>
                {children}
              </OnboardingProvider>
            </AdminAccessProvider>
          </StaffProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
