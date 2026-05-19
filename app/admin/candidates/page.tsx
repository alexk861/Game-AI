'use client';

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';

interface Candidate {
  id: string;
  source: string;
  source_photo_id: string;
  image_url: string;
  image_thumb_url: string;
  photographer_name: string;
  unsplash_url: string;
  query: string;
  category: string;
  candidate_score: number;
  suspicious_score: number;
  difficulty_suggestion: string;
  suggested_context: string;
  status: string;
}

interface Counts {
  review: number;
  approved: number;
  rejected: number;
  auto_approved?: number;
}

interface AutoFillResult {
  success: boolean;
  triggered: boolean;
  scheduled_count: number;
  auto_approved_count: number;
  days_filled: number;
  skipped_low_score: number;
  skipped_duplicates: number;
  skipped_no_attribution: number;
  schedule_before: number;
  schedule_after: number;
  errors: string[];
  details: string[];
}

export default function AdminCandidatesPage() {
  const [secret, setSecret] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [counts, setCounts] = useState<Counts>({ review: 0, approved: 0, rejected: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [autoFillLoading, setAutoFillLoading] = useState(false);
  const [autoFillResult, setAutoFillResult] = useState<AutoFillResult | null>(null);

  const fetchData = useCallback(async (authSecret: string) => {
    setLoading(true);
    setError('');
    try {
      const [candidatesRes, autoApprovedRes] = await Promise.all([
        fetch('/api/admin/candidates', {
          headers: { 'Authorization': `Bearer ${authSecret}` }
        }),
        fetch('/api/admin/candidates?status=auto_approved&count_only=true', {
          headers: { 'Authorization': `Bearer ${authSecret}` }
        }).catch(() => null)
      ]);

      if (candidatesRes.ok) {
        const data = await candidatesRes.json();
        setCandidates(data.candidates || []);
        const autoCount = autoApprovedRes?.ok
          ? ((await autoApprovedRes.json()).counts?.auto_approved ?? data.counts?.auto_approved ?? 0)
          : 0;
        setCounts({ review: 0, approved: 0, rejected: 0, ...data.counts, auto_approved: autoCount });
        setIsAuthenticated(true);
      } else {
        setIsAuthenticated(false);
        setError('Invalid secret or unauthorized.');
        localStorage.removeItem('adminSecret');
      }
    } catch {
      setError('Failed to fetch candidates.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const initId = setTimeout(() => {
      const urlParams = new URLSearchParams(window.location.search);
      const urlSecret = urlParams.get('secret');
      const localSecret = localStorage.getItem('adminSecret');

      if (urlSecret) {
        setSecret(urlSecret);
        localStorage.setItem('adminSecret', urlSecret);
        fetchData(urlSecret);
      } else if (localSecret) {
        setSecret(localSecret);
        fetchData(localSecret);
      } else {
        setLoading(false);
      }
    }, 0);

    return () => clearTimeout(initId);
  }, [fetchData]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem('adminSecret', secret);
    fetchData(secret);
  };

  const handleLogout = () => {
    localStorage.removeItem('adminSecret');
    setSecret('');
    setIsAuthenticated(false);
    setCandidates([]);
  };

  const handleAction = async (id: string, action: 'approve' | 'reject') => {
    setActionLoading(id);
    try {
      const res = await fetch(`/api/admin/candidates/${id}/${action}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${secret}`
        }
      });
      
      if (res.ok) {
        // Remove from list
        setCandidates(prev => prev.filter(c => c.id !== id));
        // Update counts optimistically
        setCounts(prev => ({
          ...prev,
          review: prev.review - 1,
          [action === 'approve' ? 'approved' : 'rejected']: prev[action === 'approve' ? 'approved' : 'rejected'] + 1
        }));
      } else {
        alert(`Failed to ${action} candidate`);
      }
    } catch (err) {
      alert(`Error: ${err}`);
    } finally {
      setActionLoading(null);
    }
  };

  const handleAutoFill = async () => {
    const confirmed = window.confirm(
      'This will safely auto-approve only high-quality candidates if future content is missing.\n\nContinue?'
    );
    if (!confirmed) return;

    setAutoFillLoading(true);
    setAutoFillResult(null);
    try {
      const res = await fetch('/api/admin/auto-fill-content', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${secret}` }
      });
      const data = await res.json();
      setAutoFillResult(data);
      if (data.success) {
        fetchData(secret);
      }
    } catch (err) {
      setAutoFillResult({
        success: false, triggered: false, scheduled_count: 0,
        auto_approved_count: 0, days_filled: 0, skipped_low_score: 0,
        skipped_duplicates: 0, skipped_no_attribution: 0,
        schedule_before: 0, schedule_after: 0,
        errors: [String(err)], details: []
      });
    } finally {
      setAutoFillLoading(false);
    }
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-6 text-center">Admin Access</h1>
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label htmlFor="secret" className="block text-sm font-medium text-gray-700">Admin Secret</label>
              <input
                type="password"
                id="secret"
                value={secret}
                onChange={(e) => setSecret(e.target.value)}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                required
              />
            </div>
            {error && <p className="text-red-600 text-sm">{error}</p>}
            <button
              type="submit"
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Access Dashboard
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen overflow-y-auto bg-gray-100 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Uncanny Admin</h1>
            <p className="text-gray-600 mt-1">Review Unsplash Candidates</p>
          </div>
          
          <div className="flex items-center gap-4 bg-white p-3 rounded-lg shadow-sm">
            <div className="text-center px-3 border-r border-gray-200">
              <span className="block text-xs text-gray-500 uppercase">Review</span>
              <span className="block text-xl font-bold text-yellow-600">{counts.review}</span>
            </div>
            <div className="text-center px-3 border-r border-gray-200">
              <span className="block text-xs text-gray-500 uppercase">Approved</span>
              <span className="block text-xl font-bold text-green-600">{counts.approved}</span>
            </div>
            <div className="text-center px-3 border-r border-gray-200">
              <span className="block text-xs text-gray-500 uppercase">Rejected</span>
              <span className="block text-xl font-bold text-red-600">{counts.rejected}</span>
            </div>
            <div className="text-center px-3">
              <span className="block text-xs text-gray-500 uppercase">Auto</span>
              <span className="block text-xl font-bold text-amber-600">{counts.auto_approved || 0}</span>
            </div>
            <button 
              onClick={handleLogout}
              className="ml-4 text-sm text-gray-500 hover:text-gray-700 underline"
            >
              Logout
            </button>
          </div>
        </div>

        {/* Auto-fill action */}
        <div className="mb-6 flex flex-col sm:flex-row items-start sm:items-center gap-3">
          <button
            onClick={handleAutoFill}
            disabled={autoFillLoading}
            className="text-sm text-amber-700 bg-amber-50 border border-amber-200 px-4 py-2 rounded-md hover:bg-amber-100 disabled:opacity-50 transition-colors"
          >
            {autoFillLoading ? 'Filling...' : 'Fill missing archive days'}
          </button>
          {autoFillResult && (
            <span className={`text-xs ${autoFillResult.success ? 'text-green-700' : 'text-red-700'}`}>
              {autoFillResult.triggered
                ? `Scheduled ${autoFillResult.scheduled_count} · Approved ${autoFillResult.auto_approved_count} · ${autoFillResult.days_filled} day(s)`
                : 'No fill needed — future schedule is healthy.'}
              {autoFillResult.errors.length > 0 && ` · Errors: ${autoFillResult.errors.join(', ')}`}
            </span>
          )}
        </div>

        {candidates.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm p-12 text-center text-gray-500">
            No candidates pending review.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {candidates.map(candidate => (
              <div key={candidate.id} className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-200 flex flex-col">
                <div className="relative h-48 w-full bg-gray-200">
                  <Image
                    src={candidate.image_thumb_url}
                    alt={candidate.suggested_context}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  />
                  <div className="absolute top-2 right-2 bg-black/60 text-white text-xs px-2 py-1 rounded backdrop-blur-sm">
                    {candidate.difficulty_suggestion}
                  </div>
                </div>
                
                <div className="p-4 flex-grow flex flex-col">
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex gap-2">
                      <span className={`inline-block text-xs px-2 py-1 rounded-full font-medium ${
                        candidate.source === 'unsplash' 
                          ? 'bg-blue-100 text-blue-800' 
                          : 'bg-purple-100 text-purple-800'
                      }`}>
                        {candidate.source === 'unsplash' ? 'REAL' : 'AI'}
                      </span>
                      <span className="inline-block bg-indigo-100 text-indigo-800 text-xs px-2 py-1 rounded-full font-medium">
                        {candidate.category}
                      </span>
                    </div>
                    {candidate.unsplash_url && (
                      <a 
                        href={candidate.unsplash_url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-xs text-blue-600 hover:underline"
                      >
                        View Original
                      </a>
                    )}
                  </div>
                  
                  <h3 className="text-sm font-semibold text-gray-900 line-clamp-2 mb-2">
                    {candidate.suggested_context}
                  </h3>
                  
                  <p className="text-xs text-gray-500 mb-4">
                    Photo by {candidate.photographer_name}
                  </p>
                  
                  <div className="grid grid-cols-2 gap-2 mb-4 text-xs bg-gray-50 p-2 rounded">
                    <div>
                      <span className="text-gray-500 block">Candidate Score</span>
                      <span className="font-medium text-gray-900">{candidate.candidate_score}/10</span>
                    </div>
                    <div>
                      <span className="text-gray-500 block">Suspicious Score</span>
                      <span className="font-medium text-gray-900">{candidate.suspicious_score}/10</span>
                    </div>
                  </div>
                  
                  <div className="mt-auto grid grid-cols-2 gap-2 pt-2 border-t border-gray-100">
                    <button
                      onClick={() => handleAction(candidate.id, 'reject')}
                      disabled={actionLoading === candidate.id}
                      className="py-2 px-4 rounded-md text-sm font-medium text-red-700 bg-red-50 hover:bg-red-100 disabled:opacity-50 transition-colors"
                    >
                      Reject
                    </button>
                    <button
                      onClick={() => handleAction(candidate.id, 'approve')}
                      disabled={actionLoading === candidate.id}
                      className="py-2 px-4 rounded-md text-sm font-medium text-white bg-green-600 hover:bg-green-700 disabled:opacity-50 transition-colors"
                    >
                      {actionLoading === candidate.id ? '...' : 'Approve'}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
