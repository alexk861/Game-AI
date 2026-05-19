"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import type { GeneratedCandidate } from "@/lib/nano-banana/types";

interface ContentGeneratorProps {
  onGenerated: (candidates: GeneratedCandidate[]) => void;
}

export default function ContentGenerator({ onGenerated }: ContentGeneratorProps) {
  const [topic, setTopic] = useState("");
  const [details, setDetails] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!topic.trim()) return;

    setLoading(true);
    setError("");

    try {
      const adminSecret = localStorage.getItem("adminSecret");
      const res = await fetch("/api/nano-banana/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(adminSecret ? { Authorization: `Bearer ${adminSecret}` } : {}),
        },
        body: JSON.stringify({ topic, details }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to generate content");
      }

      onGenerated(data.candidates);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-slate-900 rounded-xl p-6 border border-slate-800 shadow-xl">
      <h2 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-yellow-200 mb-6 flex items-center gap-2">
        <span>🍌</span> Nano Banana Content Generator
      </h2>
      
      <form onSubmit={handleGenerate} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1">
            What&apos;s the topic? *
          </label>
          <input
            type="text"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="e.g. Announcing our new AI features"
            required
            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-yellow-500/50 focus:border-yellow-500 transition-all"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1">
            Additional Details & Context
          </label>
          <textarea
            value={details}
            onChange={(e) => setDetails(e.target.value)}
            placeholder="Any specific angles, keywords, or background information?"
            rows={4}
            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-yellow-500/50 focus:border-yellow-500 transition-all resize-none"
          />
        </div>

        {error && (
          <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading || !topic.trim()}
          className="w-full py-3 px-4 bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-400 hover:to-yellow-500 text-slate-900 font-bold rounded-lg transition-all shadow-lg hover:shadow-yellow-500/25 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Generating Magic...
            </>
          ) : (
            "Generate Content Options"
          )}
        </button>
      </form>
    </div>
  );
}
