import { Metadata } from 'next';
import NanoBananaClient from './NanoBananaClient';

export const metadata: Metadata = {
  title: 'Nano Banana — Content Generator',
  robots: {
    index: false,
    follow: false,
  },
};

export default function NanoBananaPage() {
  return <NanoBananaClient />;
}
