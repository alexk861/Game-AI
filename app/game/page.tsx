import { Metadata } from 'next';
import GameClientPage from './GameClientPage';

export const metadata: Metadata = {
  title: 'Play UNCANNY — Daily Perception Game',
  description: 'Test your perception. Decide whether images are real or AI in the daily challenge.',
  alternates: {
    canonical: '/game',
  },
};

export default function GamePage() {
  return <GameClientPage />;
}
