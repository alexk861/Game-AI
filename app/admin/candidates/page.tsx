import { Metadata } from 'next';
import CandidatesClient from './CandidatesClient';

export const metadata: Metadata = {
  title: 'Admin Candidates — UNCANNY',
  robots: {
    index: false,
    follow: false,
  },
};

export default function CandidatesPage() {
  return <CandidatesClient />;
}
