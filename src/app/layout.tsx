import type { Metadata } from "next";
import { Geist, Geist_Mono, Archivo, DM_Sans, Manrope, Roboto, Inter } from "next/font/google";
import "./globals.css";
import RootClientShell from "@/components/providers/RootClientShell";
import ErrorHandler from "@/components/ErrorHandler";

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
  description: "Grow your business with confidence. FahamPesa is a powerful cloud and offline point of sale software that helps you manage sales, inventory, purchases, expenses, customers, and real time reports and business insights from one platform. Built for retailers, wholesalers, pharmacies, restaurants, and growing businesses.",
  keywords: "POS software, point of sale, inventory management, small business, Kenya, offline app, business tools",
  authors: [{ name: "FahamPesa Team" }],
  openGraph: {
    title: "FahamPesa - Lightweight Sales & Inventory App",
    description: "Grow your business with confidence. FahamPesa is a powerful cloud and offline point of sale software that helps you manage sales, inventory, purchases, expenses, customers, and real time reports and business insights from one platform. Built for retailers, wholesalers, pharmacies, restaurants, and growing businesses.",
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
        <RootClientShell>{children}</RootClientShell>
      </body>
    </html>
  );
}
