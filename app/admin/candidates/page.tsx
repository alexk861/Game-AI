'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import Image from 'next/image';

interface Candidate {
  id: string;
  source: string;
  source_type?: string | null;
  answer?: 'ai' | 'real' | null;
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
  safety_status?: string | null;
  safety_flags?: string[] | null;
  status: string;
  created_at: string;
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

function candidateKind(candidate: Candidate): 'real' | 'ai' {
  if (candidate.answer === 'ai' || candidate.source_type === 'ai_generated') return 'ai';
  return 'real';
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
  const [aiGenLoading, setAiGenLoading] = useState(false);
  const [aiGenResult, setAiGenResult] = useState<{ message: string; generated: number; requested: number; current_backlog: number } | null>(null);
  
  const [filterSource, setFilterSource] = useState<'all' | 'real' | 'ai'>('all');
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');
  const [statusFilter, setStatusFilter] = useState<'review' | 'approved' | 'rejected' | 'auto_approved'>('review');

  const filteredAndSortedCandidates = useMemo(() => {
    let result = [...candidates];
    
    // Filter
    if (filterSource === 'real') {
      result = result.filter(c => candidateKind(c) === 'real');
    } else if (filterSource === 'ai') {
      result = result.filter(c => candidateKind(c) === 'ai');
    }

    // Sort
    result.sort((a, b) => {
      // Handle cases where created_at might be missing
      const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
      const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
      return sortOrder === 'desc' ? dateB - dateA : dateA - dateB;
    });

    return result;
  }, [candidates, filterSource, sortOrder]);

  const fetchData = useCallback(async (authSecret: string) => {
    setLoading(true);
    setError('');
    try {
      const [candidatesRes, autoApprovedRes] = await Promise.all([
        fetch(`/api/admin/candidates?status=${statusFilter}`, {
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
  }, [statusFilter]);

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
        setCounts(prev => {
          const newCounts = { ...prev };
          // Decrement current category
          if (statusFilter === 'review') newCounts.review = Math.max(0, newCounts.review - 1);
          else if (statusFilter === 'approved') newCounts.approved = Math.max(0, newCounts.approved - 1);
          else if (statusFilter === 'rejected') newCounts.rejected = Math.max(0, newCounts.rejected - 1);
          else if (statusFilter === 'auto_approved' && newCounts.auto_approved !== undefined) {
             newCounts.auto_approved = Math.max(0, newCounts.auto_approved - 1);
          }
          
          // Increment target category
          if (action === 'approve') newCounts.approved += 1;
          else if (action === 'reject') newCounts.rejected += 1;
          
          return newCounts;
        });
      } else {
        alert(`Failed to ${action} candidate`);
      }
    } catch (err) {
      alert(`Error: ${err}`);
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this candidate? It will be soft-deleted and removed from this list.')) return;
    
    setActionLoading(id);
    try {
      const res = await fetch(`/api/admin/candidates/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${secret}`
        }
      });
      
      if (res.ok) {
        // Remove from list
        setCandidates(prev => prev.filter(c => c.id !== id));
        // Update counts optimistically based on current tab
        setCounts(prev => {
          const newCounts = { ...prev };
          if (statusFilter === 'approved') newCounts.approved = Math.max(0, newCounts.approved - 1);
          else if (statusFilter === 'rejected') newCounts.rejected = Math.max(0, newCounts.rejected - 1);
          else if (statusFilter === 'auto_approved' && newCounts.auto_approved !== undefined) {
             newCounts.auto_approved = Math.max(0, newCounts.auto_approved - 1);
          }
          else newCounts.review = Math.max(0, newCounts.review - 1);
          return newCounts;
        });
      } else {
        alert('Failed to delete candidate');
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

  const handleGenerateAI = async () => {
    const confirmed = window.confirm(
      'This will generate AI images using Pollinations/Gemini and add them as candidates for review.\n\nContinue?'
    );
    if (!confirmed) return;

    setAiGenLoading(true);
    setAiGenResult(null);
    try {
      const res = await fetch('/api/admin/generate-ai-candidates', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${secret}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ count: 5 }),
      });
      const data = await res.json();
      setAiGenResult(data);
      if (data.generated > 0) {
        fetchData(secret);
      }
    } catch (err) {
      setAiGenResult({
        message: `Error: ${err}`,
        generated: 0,
        requested: 0,
        current_backlog: 0,
      });
    } finally {
      setAiGenLoading(false);
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
            <button 
              onClick={() => setStatusFilter('review')}
              className={`text-center px-3 border-r border-gray-200 hover:bg-gray-50 cursor-pointer ${statusFilter === 'review' ? 'bg-yellow-50 rounded' : ''}`}
            >
              <span className="block text-xs text-gray-500 uppercase">Review</span>
              <span className="block text-xl font-bold text-yellow-600">{counts.review}</span>
            </button>
            <button 
              onClick={() => setStatusFilter('approved')}
              className={`text-center px-3 border-r border-gray-200 hover:bg-gray-50 cursor-pointer ${statusFilter === 'approved' ? 'bg-green-50 rounded' : ''}`}
            >
              <span className="block text-xs text-gray-500 uppercase">Approved</span>
              <span className="block text-xl font-bold text-green-600">{counts.approved}</span>
            </button>
            <button 
              onClick={() => setStatusFilter('rejected')}
              className={`text-center px-3 border-r border-gray-200 hover:bg-gray-50 cursor-pointer ${statusFilter === 'rejected' ? 'bg-red-50 rounded' : ''}`}
            >
              <span className="block text-xs text-gray-500 uppercase">Rejected</span>
              <span className="block text-xl font-bold text-red-600">{counts.rejected}</span>
            </button>
            <button 
              onClick={() => setStatusFilter('auto_approved')}
              className={`text-center px-3 hover:bg-gray-50 cursor-pointer ${statusFilter === 'auto_approved' ? 'bg-amber-50 rounded' : ''}`}
            >
              <span className="block text-xs text-gray-500 uppercase">Auto</span>
              <span className="block text-xl font-bold text-amber-600">{counts.auto_approved || 0}</span>
            </button>
            <button 
              onClick={handleLogout}
              className="ml-4 text-sm text-gray-500 hover:text-gray-700 underline"
            >
              Logout
            </button>
          </div>
        </div>

        {/* Auto-fill action and Filters */}
        <div className="mb-6 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 flex-wrap">
            <button
              onClick={handleAutoFill}
              disabled={autoFillLoading}
              className="text-sm text-amber-700 bg-amber-50 border border-amber-200 px-4 py-2 rounded-md hover:bg-amber-100 disabled:opacity-50 transition-colors"
            >
              {autoFillLoading ? 'Filling...' : 'Fill missing archive days'}
            </button>
            <button
              onClick={handleGenerateAI}
              disabled={aiGenLoading}
              className="text-sm text-purple-700 bg-purple-50 border border-purple-200 px-4 py-2 rounded-md hover:bg-purple-100 disabled:opacity-50 transition-colors"
            >
              {aiGenLoading ? 'Generating...' : '🤖 Generate AI Images'}
            </button>
            {autoFillResult && (
              <span className={`text-xs ${autoFillResult.success ? 'text-green-700' : 'text-red-700'}`}>
                {autoFillResult.triggered
                  ? `Scheduled ${autoFillResult.scheduled_count} · Approved ${autoFillResult.auto_approved_count} · ${autoFillResult.days_filled} day(s)`
                  : 'No fill needed — future schedule is healthy.'}
                {autoFillResult.errors.length > 0 && ` · Errors: ${autoFillResult.errors.join(', ')}`}
              </span>
            )}
            {aiGenResult && (
              <span className={`text-xs ${aiGenResult.generated > 0 ? 'text-green-700' : 'text-orange-700'}`}>
                {aiGenResult.message} (Backlog: {aiGenResult.current_backlog})
              </span>
            )}
          </div>

          <div className="flex items-center gap-3 bg-white p-2 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center gap-2">
              <label className="text-xs font-medium text-gray-700">Source:</label>
              <select 
                value={filterSource} 
                onChange={(e) => setFilterSource(e.target.value as 'all' | 'real' | 'ai')}
                className="text-sm border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 py-1"
              >
                <option value="all">All</option>
                <option value="real">Real (Unsplash)</option>
                <option value="ai">AI Generated</option>
              </select>
            </div>
            
            <div className="h-4 w-px bg-gray-300"></div>
            
            <div className="flex items-center gap-2">
              <label className="text-xs font-medium text-gray-700">Sort by Adding Date:</label>
              <select 
                value={sortOrder} 
                onChange={(e) => setSortOrder(e.target.value as 'desc' | 'asc')}
                className="text-sm border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 py-1"
              >
                <option value="desc">Newest First</option>
                <option value="asc">Oldest First</option>
              </select>
            </div>
          </div>
        </div>

        {filteredAndSortedCandidates.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm p-12 text-center text-gray-500">
            No candidates matching the criteria.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredAndSortedCandidates.map(candidate => (
              <div key={candidate.id} className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-200 flex flex-col">
                <div className="relative h-48 w-full bg-gray-200">
                  <Image
                    src={candidate.image_thumb_url}
                    alt={candidate.suggested_context}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  />
                  <div className="absolute top-2 right-2 bg-black/60 text-white text-xs px-2 py-1 rounded backdrop-blur-sm z-10">
                    {candidate.difficulty_suggestion}
                  </div>
                  <button
                    onClick={() => handleDelete(candidate.id)}
                    disabled={actionLoading === candidate.id}
                    className="absolute top-2 left-2 bg-red-600/80 text-white p-1.5 rounded hover:bg-red-700 backdrop-blur-sm transition-colors z-10 disabled:opacity-50"
                    title="Soft Delete"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M3 6h18"></path>
                      <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path>
                      <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path>
                    </svg>
                  </button>
                </div>
                
                <div className="p-4 flex-grow flex flex-col">
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex gap-2">
                      <span className={`inline-block text-xs px-2 py-1 rounded-full font-medium ${
                        candidateKind(candidate) === 'real'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-purple-100 text-purple-800'
                      }`}>
                        {candidateKind(candidate) === 'real' ? 'REAL' : 'AI'}
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
                  
                  <p className="text-xs text-gray-500 mb-2">
                    {candidateKind(candidate) === 'real'
                      ? `Photo by ${candidate.photographer_name || 'Unknown'}`
                      : `Generated candidate${candidate.source ? ` / ${candidate.source}` : ''}`}
                  </p>

                  {candidateKind(candidate) === 'ai' && (
                    <div className="mb-3 rounded border border-purple-100 bg-purple-50 p-2 text-xs text-purple-900">
                      <div className="font-medium">Safety: {candidate.safety_status || 'unknown'}</div>
                      {candidate.safety_flags && candidate.safety_flags.length > 0 && (
                        <div className="mt-1 text-purple-700">{candidate.safety_flags.join(', ')}</div>
                      )}
                    </div>
                  )}
                  
                  {candidate.created_at && (
                    <p className="text-xs text-gray-400 mb-4">
                      Added: {new Date(candidate.created_at).toLocaleDateString()}
                    </p>
                  )}
                  
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
                    {statusFilter !== 'rejected' && (
                      <button
                        onClick={() => handleAction(candidate.id, 'reject')}
                        disabled={actionLoading === candidate.id}
                        className="py-2 px-4 rounded-md text-sm font-medium text-red-700 bg-red-50 hover:bg-red-100 disabled:opacity-50 transition-colors col-span-1"
                        style={{ gridColumn: statusFilter === 'approved' || statusFilter === 'auto_approved' ? '1 / -1' : undefined }}
                      >
                        Reject
                      </button>
                    )}
                    {(statusFilter !== 'approved' && statusFilter !== 'auto_approved') && (
                      <button
                        onClick={() => handleAction(candidate.id, 'approve')}
                        disabled={actionLoading === candidate.id}
                        className="py-2 px-4 rounded-md text-sm font-medium text-white bg-green-600 hover:bg-green-700 disabled:opacity-50 transition-colors col-span-1"
                        style={{ gridColumn: statusFilter === 'rejected' ? '1 / -1' : undefined }}
                      >
                        {actionLoading === candidate.id ? '...' : 'Approve'}
                      </button>
                    )}
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
