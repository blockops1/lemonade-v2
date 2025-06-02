import type { Metadata } from "next";
import localFont from "next/font/local";
import { Analytics } from '@vercel/analytics/react';
import { AccountProvider } from "@/context/AccountContext";
import WalletInstructions from "@/components/WalletInstructions";
import "./globals.css";

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

export const metadata: Metadata = {
  title: "Lemonade Stand Game - A zkVerify Experience",
  description: "Run your own virtual lemonade stand in this fun web3 game! Connect your zkVerify wallet, manage resources, and compete to make the most profit in 7 days.",
  openGraph: {
    title: "Lemonade Stand Game - A zkVerify Experience",
    description: "Run your own virtual lemonade stand in this fun web3 game! Connect your zkVerify wallet, manage resources, and compete to make the most profit in 7 days.",
    type: "website",
    url: "https://lemonade-game.vercel.app",
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
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable}`}>
        <AccountProvider>
          <WalletInstructions />
          {children}
          <Analytics />
        </AccountProvider>
      </body>
    </html>
  );
}
