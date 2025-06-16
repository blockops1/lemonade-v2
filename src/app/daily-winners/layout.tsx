import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Top 12 Daily Lemonade Stand Winners',
  description: 'View the top 12 winners from the last 7 days',
};

export default function DailyWinnersLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
} 