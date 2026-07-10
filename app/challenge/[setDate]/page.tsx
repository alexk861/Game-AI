import { Metadata } from 'next';
import Home from '../../game/GameClientPage';

interface Props {
  params: Promise<{ setDate: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { setDate } = await params;
  return {
    title: 'UNCANNY — Can you beat this set?',
    description: 'A friend challenged you to play the same Real or AI image set.',
    openGraph: {
      title: 'Can you tell real from AI?',
      description: 'Play the same UNCANNY set and compare your score.',
      images: [
        {
          url: '/og-preview.png',
          width: 1200,
          height: 630,
          alt: 'UNCANNY Social Preview Card',
        }
      ],
      type: 'website',
      url: `https://www.uncanny.info/challenge/${setDate}`,
    },
    twitter: {
      card: 'summary_large_image',
      title: 'Can you tell real from AI?',
      description: 'Play the same UNCANNY set and compare your score.',
      images: ['/og-preview.png'],
    },
    alternates: {
      canonical: `/challenge/${setDate}`,
    },
  };
}

export const dynamicParams = false;

export async function generateStaticParams() {
  // Return a single dummy parameter to satisfy the Next.js static export compiler.
  return [{ setDate: 'today' }];
}

export default async function ChallengePage({ params }: Props) {
  const { setDate } = await params;
  return <Home challengeDate={setDate} />;
}
