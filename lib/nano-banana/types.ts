export interface GeneratedCandidate {
  id: string;
  title: string;
  body: string;
  platform: string;
  tone: string;
  target_audience: string;
  hook: string;
  status: "draft" | "approved" | "rejected";
  // Add these for the mock generation in page.tsx
  prompt?: string;
  text?: string;
  createdAt?: string;
}
