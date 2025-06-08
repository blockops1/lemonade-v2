import type { AppProps } from 'next/app';
import { AccountProvider } from '@/context/AccountContext';
import { Analytics } from '@vercel/analytics/react';
import * as Sentry from '@sentry/nextjs';
import localFont from 'next/font/local';
import { Inter } from 'next/font/google';
import '../app/globals.css';

const geistSans = localFont({
  src: "../app/fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});

const geistMono = localFont({
  src: "../app/fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

const inter = Inter({ subsets: ['latin'] });

export default function App({ Component, pageProps }: AppProps) {
  return (
    <div className={`${geistSans.variable} ${geistMono.variable} ${inter.className}`}>
      <AccountProvider>
        <Component {...pageProps} />
        <Analytics />
      </AccountProvider>
    </div>
  );
} 