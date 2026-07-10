import { Metadata } from 'next';
import LeaderboardClient from './LeaderboardClient';

export const metadata: Metadata = {
  title: 'Global Leaderboard — UNCANNY',
  description: 'Check out the daily global rankings and collective perception failure rates in UNCANNY.',
  alternates: {
    canonical: '/leaderboard',
  },
};

export default function LeaderboardPage() {
  return <LeaderboardClient />;
}
