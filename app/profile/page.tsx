import { Metadata } from 'next';
import ProfileClient from './ProfileClient';

export const metadata: Metadata = {
  title: 'Player Profile — UNCANNY',
  description: 'View your session history, streak, and perception statistics in UNCANNY.',
  alternates: {
    canonical: '/profile',
  },
};

export default function ProfilePage() {
  return <ProfileClient />;
}
