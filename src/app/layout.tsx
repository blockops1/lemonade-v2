import type { Metadata } from "next";
import localFont from "next/font/local";
import { Analytics } from '@vercel/analytics/react';
import { AccountProvider } from "@/context/AccountContext";
import "./globals.css";
import { Inter } from 'next/font/google';

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});

const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: "Lemonade Stand Game - A zkVerify Experience",
  description: "Run your own virtual lemonade stand in this fun web3 game! Connect your zkVerify wallet, manage resources, and compete to make the most profit in 7 days.",
  openGraph: {
    title: "Lemonade Stand Game - A zkVerify Experience",
    description: "Run your own virtual lemonade stand in this fun web3 game! Connect your zkVerify wallet, manage resources, and compete to make the most profit in 7 days.",
    type: "website",
    url: "https://lemonade-game.vercel.app",
    siteName: "Lemonade Stand Game",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Lemonade Stand Game Preview",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Lemonade Stand Game - A zkVerify Experience",
    description: "Run your own virtual lemonade stand in this fun web3 game! Connect your zkVerify wallet, manage resources, and compete to make the most profit in 7 days.",
    images: ["/og-image.png"],
    creator: "@zkVerify",
  },
  metadataBase: new URL(process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'),
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="icon" href="/favicon-16x16.png" sizes="16x16" type="image/png" />
        <link rel="icon" href="/favicon-32x32.png" sizes="32x32" type="image/png" />
        <link rel="icon" href="/favicon-48x48.png" sizes="48x48" type="image/png" />
        <link rel="apple-touch-icon" href="/favicon-192x192.png" />
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable} ${inter.className}`}>
        <AccountProvider>
          {children}
          <Analytics />
        </AccountProvider>
      </body>
    </html>
  );
}
