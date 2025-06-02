import type { Metadata } from "next";
import localFont from "next/font/local";
import { AccountProvider } from "@/context/AccountContext";
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
  title: "zkVerify Starter App",
  description: "zkVerify - Proof Verification.",
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
            {children}
          </AccountProvider>
        </body>
      </html>
  );
}
