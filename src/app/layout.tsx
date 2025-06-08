import type { Metadata } from "next";
import "./globals.css";

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
      <body>{children}</body>
    </html>
  );
}
