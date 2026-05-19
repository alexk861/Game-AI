"use client";

import { useState } from "react";
import { Check, X, Copy, ExternalLink, RefreshCw } from "lucide-react";

interface Candidate {
  id: string;
  title: string;
  body: string;
  platform: string;
  tone: string;
  target_audience: string;
  hook: string;
  status: "draft" | "approved" | "rejected";
}

interface CandidateListProps {
  candidates: Candidate[];
}

export default function CandidateList({ candidates: initialCandidates }: CandidateListProps) {
  const [candidates, setCandidates] = useState<Candidate[]>(initialCandidates);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleUpdateStatus = async (id: string, status: "approved" | "rejected") => {
    setUpdatingId(id);
    try {
      const res = await fetch("/api/nano-banana/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status }),
      });
      
      if (res.ok) {
        setCandidates(prev => 
          prev.map(c => c.id === id ? { ...c, status } : c)
        );
      }
    } catch (error) {
      console.error("Failed to update status:", error);
    } finally {
      setUpdatingId(null);
    }
  };

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  if (candidates.length === 0) return null;

  return (
    <div className="space-y-6 mt-8">
      <h3 className="text-xl font-semibold text-white flex items-center gap-2">
        Generated Options
      </h3>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {candidates.map((candidate) => (
          <div 
            key={candidate.id} 
            className={`
              flex flex-col bg-slate-800 rounded-xl overflow-hidden border transition-all duration-300
              ${candidate.status === 'approved' ? 'border-green-500/50 shadow-[0_0_15px_rgba(34,197,94,0.15)]' : 
                candidate.status === 'rejected' ? 'border-red-500/30 opacity-75 grayscale-[50%]' : 
                'border-slate-700 hover:border-yellow-500/50'}
            `}
          >
            {/* Header */}
            <div className="p-4 border-b border-slate-700/50 bg-slate-900/50">
              <div className="flex justify-between items-start mb-2">
                <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-slate-700 text-slate-300">
                  {candidate.platform}
                </span>
                <span className="px-2.5 py-1 text-xs font-medium rounded-full bg-blue-500/10 text-blue-400">
                  {candidate.tone}
                </span>
              </div>
              <h4 className="font-medium text-white line-clamp-2">{candidate.title}</h4>
            </div>

            {/* Content */}
            <div className="p-4 flex-grow flex flex-col gap-3 text-sm">
              <div className="bg-slate-900/50 p-3 rounded-lg border border-slate-700/50">
                <span className="text-yellow-500 font-bold block mb-1">Hook:</span>
                <p className="text-slate-300 italic">{candidate.hook}</p>
              </div>
              
              <div className="flex-grow">
                <p className="text-slate-200 whitespace-pre-wrap">{candidate.body}</p>
              </div>
              
              <div className="text-xs text-slate-500 mt-2">
                Target: {candidate.target_audience}
              </div>
            </div>

            {/* Actions */}
            <div className="p-4 border-t border-slate-700/50 bg-slate-900/50 flex items-center justify-between gap-2">
              <button
                onClick={() => handleCopy(candidate.id, candidate.body)}
                className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
                title="Copy to clipboard"
              >
                {copiedId === candidate.id ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
              </button>

              {candidate.status === 'draft' ? (
                <div className="flex gap-2">
                  <button
                    onClick={() => handleUpdateStatus(candidate.id, "rejected")}
                    disabled={updatingId === candidate.id}
                    className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-red-400 hover:text-red-300 hover:bg-red-400/10 rounded-lg transition-colors"
                  >
                    {updatingId === candidate.id ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <X className="w-3.5 h-3.5" />}
                    Reject
                  </button>
                  <button
                    onClick={() => handleUpdateStatus(candidate.id, "approved")}
                    disabled={updatingId === candidate.id}
                    className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-green-400 bg-green-400/10 hover:bg-green-400/20 rounded-lg transition-colors"
                  >
                    {updatingId === candidate.id ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                    Approve
                  </button>
                </div>
              ) : (
                <span className={`text-xs font-bold px-3 py-1 rounded-full ${
                  candidate.status === 'approved' ? 'text-green-400 bg-green-400/10' : 'text-red-400 bg-red-400/10'
                }`}>
                  {candidate.status.toUpperCase()}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
