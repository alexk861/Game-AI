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

  // Curation Overrides
  curator_blessed?: boolean;
  curator_priority?: number;
  curator_notes?: string | null;
  curator_locked?: boolean;
  anomaly_tier?: number;

  // Telemetry Metrics
  total_served_count?: number;
  total_correct_count?: number;
  total_wrong_count?: number;
  total_timeout_count?: number;
  average_decision_ms?: number;
  disagreement_score?: number;
  consensus_confidence?: number;
  suspicion_accuracy?: number;
  total_reflection_unlocks?: number;
  reflection_unlock_rate?: number;
  total_replay_clicks?: number;
  replay_interest_score?: number;
  slow_burn_score?: number;
  candidate_decay_score?: number;
  confidence_variance_score?: number;
  
  // Fingerprints
  composition_fingerprint?: string | null;
  emotional_fingerprint?: string | null;
  lighting_fingerprint?: string | null;
  perspective_fingerprint?: string | null;
  scene_fingerprint?: string | null;
  object_fingerprint?: string | null;
  texture_fingerprint?: string | null;
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

interface IntelligenceData {
  top_archive: Candidate[];
  weak_content: Candidate[];
  rare_archive: Candidate[];
  pipeline_health: {
    total_ai_backlog: number;
    total_real_backlog: number;
    total_retired: number;
  };
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
  const [metadata, setMetadata] = useState<{
    usable_real_backlog: number;
    usable_ai_backlog: number;
    scheduled_days_coverage: number;
    standard_mix_status: string;
    reflection_coverage_status: string;
  } | null>(null);
  
  const [filterSource, setFilterSource] = useState<'all' | 'real' | 'ai'>('all');
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');
  const [statusFilter, setStatusFilter] = useState<'review' | 'approved' | 'rejected' | 'auto_approved' | 'intelligence'>('review');

  // Intelligence state
  const [intelligenceData, setIntelligenceData] = useState<IntelligenceData | null>(null);
  const [editingCandidate, setEditingCandidate] = useState<Candidate | null>(null);
  const [patchLoading, setPatchLoading] = useState(false);

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
      if (statusFilter === 'intelligence') {
        const res = await fetch(`/api/admin/intelligence`, {
          headers: { 'Authorization': `Bearer ${authSecret}` }
        });
        if (res.ok) {
          const data = await res.json();
          setIntelligenceData(data);
          setIsAuthenticated(true);
        } else {
          setIsAuthenticated(false);
          setError('Invalid secret or unauthorized.');
          localStorage.removeItem('adminSecret');
        }
      } else {
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
          setMetadata(data.metadata || null);
          setIsAuthenticated(true);
        } else {
          setIsAuthenticated(false);
          setError('Invalid secret or unauthorized.');
          localStorage.removeItem('adminSecret');
        }
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
    setIntelligenceData(null);
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
        setCandidates(prev => prev.filter(c => c.id !== id));
        setCounts(prev => {
          const newCounts = { ...prev };
          if (statusFilter === 'review') newCounts.review = Math.max(0, newCounts.review - 1);
          else if (statusFilter === 'approved') newCounts.approved = Math.max(0, newCounts.approved - 1);
          else if (statusFilter === 'rejected') newCounts.rejected = Math.max(0, newCounts.rejected - 1);
          else if (statusFilter === 'auto_approved' && newCounts.auto_approved !== undefined) {
             newCounts.auto_approved = Math.max(0, newCounts.auto_approved - 1);
          }
          
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
        setCandidates(prev => prev.filter(c => c.id !== id));
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
    const countStr = window.prompt(
      'How many AI candidates would you like to generate? (Standard target: 20)',
      '20'
    );
    if (countStr === null) return;
    const count = parseInt(countStr, 10);
    if (isNaN(count) || count <= 0) {
      alert('Please enter a valid positive number');
      return;
    }

    setAiGenLoading(true);
    setAiGenResult(null);
    try {
      const res = await fetch('/api/admin/generate-ai-candidates', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${secret}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ count }),
      });
      const data = await res.json();
      if (!res.ok || data.error) {
        setAiGenResult({
          message: data.message || data.error || `HTTP ${res.status}`,
          generated: 0,
          requested: 0,
          current_backlog: 0,
        });
      } else {
        setAiGenResult(data);
        if (data.generated > 0) {
          fetchData(secret);
        }
      }
    } catch (err) {
      setAiGenResult({
        message: `Network error: ${err instanceof Error ? err.message : String(err)}`,
        generated: 0,
        requested: 0,
        current_backlog: 0,
      });
    } finally {
      setAiGenLoading(false);
    }
  };

  // Curator intelligence PATCH handler
  const handlePatchCandidate = async (payload: {
    candidateId: string;
    curator_blessed?: boolean;
    curator_locked?: boolean;
    anomaly_tier?: number;
    curator_priority?: number;
    curator_notes?: string;
    status?: string;
  }) => {
    setPatchLoading(true);
    try {
      const res = await fetch('/api/admin/candidates', {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${secret}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        setEditingCandidate(null);
        fetchData(secret);
      } else {
        const errorData = await res.json();
        alert(`Error updating: ${errorData.error || 'Unknown error'}`);
      }
    } catch (err) {
      alert(`Network error: ${err}`);
    } finally {
      setPatchLoading(false);
    }
  };

  const renderIntelligenceCard = (c: Candidate, columnType: 'top' | 'weak' | 'rare') => {
    const isBlessed = c.curator_blessed;
    const isLocked = c.curator_locked;
    const tier = c.anomaly_tier || 0;

    return (
      <div key={c.id} className="bg-slate-805 border border-slate-700/80 rounded-xl overflow-hidden flex flex-col p-4 hover:border-indigo-500/50 hover:bg-slate-800 transition-all duration-200 relative">
        <div className="flex gap-4">
          <div className="relative w-16 h-16 bg-slate-700 rounded-lg overflow-hidden flex-shrink-0 border border-slate-700">
            <Image
              src={c.image_thumb_url}
              alt=""
              fill
              className="object-cover"
              sizes="64px"
            />
          </div>
          
          <div className="flex-grow min-w-0">
            <div className="flex justify-between items-start">
              <span className={`text-[9px] px-2 py-0.5 rounded font-mono uppercase tracking-wider font-semibold ${
                candidateKind(c) === 'real' ? 'bg-blue-900/40 text-blue-300 border border-blue-800/50' : 'bg-purple-900/40 text-purple-300 border border-purple-800/50'
              }`}>
                {candidateKind(c) === 'real' ? 'Real' : 'AI'}
              </span>
              
              <div className="flex gap-1.5">
                {isBlessed && (
                  <span className="text-xs text-yellow-400" title="Curator Blessed">🌟</span>
                )}
                {isLocked && (
                  <span className="text-xs text-cyan-400" title="Curator Locked">🔒</span>
                )}
                {tier > 0 && (
                  <span className="text-[9px] bg-red-950/40 text-red-300 border border-red-800/50 px-2 py-0.5 rounded font-mono font-semibold" title={`Anomaly Tier ${tier}`}>
                    T{tier}
                  </span>
                )}
              </div>
            </div>

            <h4 className="text-sm font-semibold text-slate-100 mt-2 line-clamp-2" title={c.suggested_context}>
              {c.suggested_context}
            </h4>
          </div>
        </div>

        {/* Telemetry Grid */}
        <div className="mt-4 grid grid-cols-3 gap-2 bg-slate-950/50 p-2.5 rounded-lg text-xs font-mono border border-slate-800/80">
          <div>
            <span className="text-slate-500 block text-[9px] uppercase tracking-wider">Served</span>
            <span className="font-bold text-slate-200">{c.total_served_count || 0}</span>
          </div>
          <div>
            <span className="text-slate-500 block text-[9px] uppercase tracking-wider">Disagr%</span>
            <span className="font-bold text-yellow-500">
              {c.disagreement_score ? `${(Number(c.disagreement_score) * 100).toFixed(0)}%` : '0%'}
            </span>
          </div>
          <div>
            <span className="text-slate-500 block text-[9px] uppercase tracking-wider">SlowBurn</span>
            <span className="font-bold text-purple-400">
              {c.slow_burn_score ? `${(Number(c.slow_burn_score) * 100).toFixed(0)}%` : '0%'}
            </span>
          </div>
        </div>

        {/* Style Fingerprints if any */}
        {(c.composition_fingerprint || c.lighting_fingerprint) && (
          <div className="mt-3 flex flex-wrap gap-1">
            {c.composition_fingerprint && (
              <span className="text-[9px] bg-slate-700/30 text-slate-400 border border-slate-700/50 px-2 py-0.5 rounded capitalize">
                📐 {c.composition_fingerprint}
              </span>
            )}
            {c.lighting_fingerprint && (
              <span className="text-[9px] bg-slate-700/30 text-slate-400 border border-slate-700/50 px-2 py-0.5 rounded capitalize">
                💡 {c.lighting_fingerprint}
              </span>
            )}
          </div>
        )}

        {/* Decay statistics for Weak Content */}
        {columnType === 'weak' && (
          <div className="mt-3 bg-red-950/20 border border-red-900/30 p-2.5 rounded-lg text-xs flex items-center justify-between text-red-300">
            <span>Decay: <strong className="font-bold text-red-400">{c.candidate_decay_score ? `${(Number(c.candidate_decay_score) * 100).toFixed(0)}%` : '0%'}</strong></span>
            <span>Consensus: <strong className="font-bold text-red-400">{c.consensus_confidence ? `${(Number(c.consensus_confidence) * 100).toFixed(0)}%` : '0%'}</strong></span>
          </div>
        )}

        {/* Curator notes snippet */}
        {c.curator_notes && (
          <p className="mt-3 text-[11px] italic text-slate-400 bg-slate-900/30 p-2 border border-slate-800 rounded-lg line-clamp-2">
            📝 {c.curator_notes}
          </p>
        )}

        {/* Actions bar */}
        <div className="mt-4 flex justify-between gap-2 border-t border-slate-700/50 pt-3">
          <button
            onClick={() => setEditingCandidate(c)}
            className="py-1.5 px-3 bg-slate-700 hover:bg-slate-650 text-slate-200 rounded-lg text-xs transition-colors font-medium flex items-center gap-1.5 cursor-pointer"
          >
            <span>⚙️</span> Edit Curation
          </button>

          {columnType === 'weak' && (
            <button
              onClick={async () => {
                if (window.confirm('Retire this weak candidate immediately? (Status will be set to deleted)')) {
                  handlePatchCandidate({ candidateId: c.id, status: 'deleted' });
                }
              }}
              className="py-1.5 px-3 bg-red-900/30 hover:bg-red-800/40 text-red-300 border border-red-800/50 rounded-lg text-xs transition-colors font-semibold flex items-center gap-1 cursor-pointer"
            >
              <span>🗑️</span> Retire
            </button>
          )}
        </div>
      </div>
    );
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
              className={`text-center px-3 border-r border-gray-200 hover:bg-gray-50 cursor-pointer ${statusFilter === 'review' ? 'bg-yellow-50 rounded font-medium' : ''}`}
            >
              <span className="block text-xs text-gray-500 uppercase">Review</span>
              <span className="block text-xl font-bold text-yellow-600">{counts.review}</span>
            </button>
            <button 
              onClick={() => setStatusFilter('approved')}
              className={`text-center px-3 border-r border-gray-200 hover:bg-gray-50 cursor-pointer ${statusFilter === 'approved' ? 'bg-green-50 rounded font-medium' : ''}`}
            >
              <span className="block text-xs text-gray-500 uppercase">Approved</span>
              <span className="block text-xl font-bold text-green-600">{counts.approved}</span>
            </button>
            <button 
              onClick={() => setStatusFilter('rejected')}
              className={`text-center px-3 border-r border-gray-200 hover:bg-gray-50 cursor-pointer ${statusFilter === 'rejected' ? 'bg-red-50 rounded font-medium' : ''}`}
            >
              <span className="block text-xs text-gray-500 uppercase">Rejected</span>
              <span className="block text-xl font-bold text-red-600">{counts.rejected}</span>
            </button>
            <button 
              onClick={() => setStatusFilter('auto_approved')}
              className={`text-center px-3 border-r border-gray-200 hover:bg-gray-50 cursor-pointer ${statusFilter === 'auto_approved' ? 'bg-amber-50 rounded font-medium' : ''}`}
            >
              <span className="block text-xs text-gray-500 uppercase">Auto</span>
              <span className="block text-xl font-bold text-amber-600">{counts.auto_approved || 0}</span>
            </button>
            <button 
              onClick={() => setStatusFilter('intelligence')}
              className={`text-center px-3 hover:bg-gray-50 cursor-pointer ${statusFilter === 'intelligence' ? 'bg-purple-50 rounded font-medium' : ''}`}
            >
              <span className="block text-xs text-gray-500 uppercase">🧠 Intelligence</span>
              <span className="block text-xl font-bold text-purple-600">Stats</span>
            </button>
            <button 
              onClick={handleLogout}
              className="ml-4 text-sm text-gray-500 hover:text-gray-700 underline"
            >
              Logout
            </button>
          </div>
        </div>

        {/* Beautiful Glassmorphic Telemetry Stats Bar */}
        {metadata && statusFilter !== 'intelligence' && (
          <div className="mb-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 transition-all hover:shadow-md">
              <span className="block text-xs text-gray-500 font-medium uppercase tracking-wider">Usable Real Backlog</span>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-3xl font-extrabold text-blue-600">{metadata.usable_real_backlog}</span>
                <span className="text-xs text-gray-400">/ 40 target</span>
              </div>
              <div className="mt-2 h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-blue-500 rounded-full transition-all duration-500" 
                  style={{ width: `${Math.min(100, (metadata.usable_real_backlog / 40) * 100)}%` }}
                ></div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 transition-all hover:shadow-md">
              <span className="block text-xs text-gray-500 font-medium uppercase tracking-wider">Usable AI Backlog</span>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-3xl font-extrabold text-purple-600">{metadata.usable_ai_backlog}</span>
                <span className="text-xs text-gray-400">/ 20 target</span>
              </div>
              <div className="mt-2 h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-purple-500 rounded-full transition-all duration-500" 
                  style={{ width: `${Math.min(100, (metadata.usable_ai_backlog / 20) * 100)}%` }}
                ></div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 transition-all hover:shadow-md">
              <span className="block text-xs text-gray-500 font-medium uppercase tracking-wider">Schedule Coverage</span>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-3xl font-extrabold text-indigo-600">{metadata.scheduled_days_coverage}</span>
                <span className="text-xs text-gray-400">days fully filled</span>
              </div>
              <div className="mt-2 h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-indigo-500 rounded-full transition-all duration-500" 
                  style={{ width: `${Math.min(100, (metadata.scheduled_days_coverage / 3) * 100)}%` }}
                ></div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 transition-all hover:shadow-md flex flex-col justify-between">
              <div>
                <span className="block text-xs text-gray-500 font-medium uppercase tracking-wider">Standard Mix (3R + 2A)</span>
                <div className="mt-2">
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold ${
                    metadata.standard_mix_status === 'Healthy' 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-red-100 text-red-800'
                  }`}>
                    <span className={`h-2 w-2 rounded-full mr-2 ${
                      metadata.standard_mix_status === 'Healthy' ? 'bg-green-500' : 'bg-red-500'
                    }`}></span>
                    {metadata.standard_mix_status}
                  </span>
                </div>
              </div>
              <span className="text-[10px] text-gray-400 mt-2 block">Informational status flag</span>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 transition-all hover:shadow-md flex flex-col justify-between">
              <div>
                <span className="block text-xs text-gray-500 font-medium uppercase tracking-wider">Reflection Coverage</span>
                <div className="mt-2">
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold ${
                    metadata.reflection_coverage_status === 'Healthy' 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-red-100 text-red-800'
                  }`}>
                    <span className={`h-2 w-2 rounded-full mr-2 ${
                      metadata.reflection_coverage_status === 'Healthy' ? 'bg-green-500' : 'bg-red-500'
                    }`}></span>
                    {metadata.reflection_coverage_status}
                  </span>
                </div>
              </div>
              <span className="text-[10px] text-gray-400 mt-2 block">Informational status flag</span>
            </div>
          </div>
        )}

        {/* Intelligence Tab view */}
        {statusFilter === 'intelligence' && intelligenceData ? (
          <div className="space-y-8 animate-fade-in">
            {/* Pipeline Health stats bar */}
            <div className="bg-slate-900 border border-slate-800 text-white rounded-2xl p-6 shadow-xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>
              <div className="absolute bottom-0 left-0 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl pointer-events-none"></div>

              <h2 className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-indigo-300 flex items-center gap-2 mb-6">
                <span>🧠</span> Human Perception & Disagreement Pipeline Health
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative z-10">
                <div className="bg-slate-800/40 rounded-xl p-5 border border-slate-700/40 backdrop-blur-sm transition-all hover:bg-slate-800/60">
                  <span className="text-xs text-slate-400 uppercase font-semibold tracking-wider block">Total AI Backlog</span>
                  <div className="text-4xl font-extrabold text-purple-400 mt-2">
                    {intelligenceData.pipeline_health.total_ai_backlog}
                  </div>
                  <p className="text-xs text-slate-500 mt-2">
                    AI-generated candidates ingested and persistent in the system backlog.
                  </p>
                </div>
                
                <div className="bg-slate-800/40 rounded-xl p-5 border border-slate-700/40 backdrop-blur-sm transition-all hover:bg-slate-800/60">
                  <span className="text-xs text-slate-400 uppercase font-semibold tracking-wider block">Total Real Backlog</span>
                  <div className="text-4xl font-extrabold text-blue-400 mt-2">
                    {intelligenceData.pipeline_health.total_real_backlog}
                  </div>
                  <p className="text-xs text-slate-500 mt-2">
                    Real candidates cataloged to enforce high standard visual variance.
                  </p>
                </div>
                
                <div className="bg-slate-800/40 rounded-xl p-5 border border-slate-700/40 backdrop-blur-sm transition-all hover:bg-slate-800/60">
                  <span className="text-xs text-slate-400 uppercase font-semibold tracking-wider block">Total Retired Content</span>
                  <div className="text-4xl font-extrabold text-red-400 mt-2">
                    {intelligenceData.pipeline_health.total_retired}
                  </div>
                  <p className="text-xs text-slate-500 mt-2">
                    Visual sludge and highly predictable candidates soft-retired from daily loops.
                  </p>
                </div>
              </div>
            </div>

            {/* Three Columns grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Column 1: Top Archive Material */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col h-[75vh]">
                <div className="flex justify-between items-center mb-5 pb-3 border-b border-slate-800">
                  <div>
                    <h3 className="font-bold text-lg text-yellow-400 flex items-center gap-2">
                      <span>🌟</span> Top Archive Material
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">Peak Ambiguity & High Slow-Burn</p>
                  </div>
                  <span className="bg-yellow-400/20 text-yellow-300 text-xs px-2.5 py-1 rounded-full font-mono font-bold">
                    {intelligenceData.top_archive.length}
                  </span>
                </div>
                <div className="flex-1 overflow-y-auto space-y-4 pr-1 scrollbar-thin scrollbar-thumb-slate-800 scrollbar-track-transparent">
                  {intelligenceData.top_archive.length === 0 ? (
                    <p className="text-xs text-slate-500 text-center py-12">No top archive items present yet.</p>
                  ) : (
                    intelligenceData.top_archive.map(c => renderIntelligenceCard(c, 'top'))
                  )}
                </div>
              </div>

              {/* Column 2: Weak Content */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col h-[75vh]">
                <div className="flex justify-between items-center mb-5 pb-3 border-b border-slate-800">
                  <div>
                    <h3 className="font-bold text-lg text-red-400 flex items-center gap-2">
                      <span>⚠️</span> Obvious / Weak Content
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">High Decay, Predictable Sludge</p>
                  </div>
                  <span className="bg-red-400/20 text-red-300 text-xs px-2.5 py-1 rounded-full font-mono font-bold">
                    {intelligenceData.weak_content.length}
                  </span>
                </div>
                <div className="flex-1 overflow-y-auto space-y-4 pr-1 scrollbar-thin scrollbar-thumb-slate-800 scrollbar-track-transparent">
                  {intelligenceData.weak_content.length === 0 ? (
                    <p className="text-xs text-slate-500 text-center py-12">No weak candidates flagged.</p>
                  ) : (
                    intelligenceData.weak_content.map(c => renderIntelligenceCard(c, 'weak'))
                  )}
                </div>
              </div>

              {/* Column 3: Rare Archive */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col h-[75vh]">
                <div className="flex justify-between items-center mb-5 pb-3 border-b border-slate-800">
                  <div>
                    <h3 className="font-bold text-lg text-cyan-400 flex items-center gap-2">
                      <span>💎</span> Rare Archive
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">Locked & High Anomaly Levels</p>
                  </div>
                  <span className="bg-cyan-400/20 text-cyan-300 text-xs px-2.5 py-1 rounded-full font-mono font-bold">
                    {intelligenceData.rare_archive.length}
                  </span>
                </div>
                <div className="flex-1 overflow-y-auto space-y-4 pr-1 scrollbar-thin scrollbar-thumb-slate-800 scrollbar-track-transparent">
                  {intelligenceData.rare_archive.length === 0 ? (
                    <p className="text-xs text-slate-500 text-center py-12">No rare anomalies mapped.</p>
                  ) : (
                    intelligenceData.rare_archive.map(c => renderIntelligenceCard(c, 'rare'))
                  )}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <>
            {/* Auto-fill action and Filters */}
            <div className="mb-6 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 flex-wrap">
                <button
                  onClick={handleAutoFill}
                  disabled={autoFillLoading}
                  className="text-sm text-amber-700 bg-amber-50 border border-amber-200 px-4 py-2 rounded-md hover:bg-amber-100 disabled:opacity-50 transition-colors cursor-pointer"
                >
                  {autoFillLoading ? 'Filling...' : 'Fill missing archive days'}
                </button>
                <button
                  onClick={handleGenerateAI}
                  disabled={aiGenLoading}
                  className="text-sm text-purple-700 bg-purple-50 border border-purple-200 px-4 py-2 rounded-md hover:bg-purple-100 disabled:opacity-50 transition-colors cursor-pointer"
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
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 animate-fade-in">
                {filteredAndSortedCandidates.map(candidate => (
                  <div key={candidate.id} className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-200 flex flex-col hover:shadow-md transition-shadow">
                    <div className="relative h-48 w-full bg-gray-200">
                      <Image
                        src={candidate.image_thumb_url}
                        alt={candidate.suggested_context}
                        fill
                        className="object-cover"
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                      />
                      <div className="absolute top-2 right-2 bg-black/60 text-white text-xs px-2 py-1 rounded backdrop-blur-sm z-10 font-medium">
                        {candidate.difficulty_suggestion}
                      </div>
                      <button
                        onClick={() => handleDelete(candidate.id)}
                        disabled={actionLoading === candidate.id}
                        className="absolute top-2 left-2 bg-red-600/80 text-white p-1.5 rounded hover:bg-red-700 backdrop-blur-sm transition-colors z-10 disabled:opacity-50 cursor-pointer"
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
                      
                      <div className="grid grid-cols-2 gap-2 mb-4 text-xs bg-gray-50 p-2 rounded border border-gray-100">
                        <div>
                          <span className="text-gray-500 block">Candidate Score</span>
                          <span className="font-medium text-gray-900">{candidate.candidate_score}/10</span>
                        </div>
                        <div>
                          <span className="text-gray-500 block">Suspicious Score</span>
                          <span className="font-medium text-gray-900">{candidate.suspicious_score}/10</span>
                        </div>
                      </div>

                      {/* Quick details edit action for regular candidate lists */}
                      <button
                        onClick={() => setEditingCandidate(candidate)}
                        className="mb-4 w-full py-1.5 border border-gray-300 hover:bg-gray-50 text-gray-700 rounded-md text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
                      >
                        <span>⚙️</span> Edit Curation & Telemetry
                      </button>
                      
                      <div className="mt-auto grid grid-cols-2 gap-2 pt-2 border-t border-gray-100">
                        {statusFilter !== 'rejected' && (
                          <button
                            onClick={() => handleAction(candidate.id, 'reject')}
                            disabled={actionLoading === candidate.id}
                            className="py-2 px-4 rounded-md text-sm font-medium text-red-700 bg-red-50 hover:bg-red-100 disabled:opacity-50 transition-colors col-span-1 cursor-pointer"
                            style={{ gridColumn: statusFilter === 'approved' || statusFilter === 'auto_approved' ? '1 / -1' : undefined }}
                          >
                            Reject
                          </button>
                        )}
                        {(statusFilter !== 'approved' && statusFilter !== 'auto_approved') && (
                          <button
                            onClick={() => handleAction(candidate.id, 'approve')}
                            disabled={actionLoading === candidate.id}
                            className="py-2 px-4 rounded-md text-sm font-medium text-white bg-green-600 hover:bg-green-700 disabled:opacity-50 transition-colors col-span-1 cursor-pointer"
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
          </>
        )}
      </div>

      {/* Editing Dialog Modal */}
      {editingCandidate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md transition-all duration-300">
          <div className="bg-slate-900 border border-slate-800 text-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden flex flex-col max-h-[90vh] animate-scale-up">
            {/* Modal Header */}
            <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-950/40">
              <h3 className="text-lg font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-indigo-300 flex items-center gap-2">
                <span>⚙️</span> Curator Intelligence Editor
              </h3>
              <button
                onClick={() => setEditingCandidate(null)}
                className="text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-6">
              {/* Candidate Info Summary */}
              <div className="flex gap-4 bg-slate-950/40 p-4 rounded-xl border border-slate-800/80">
                <div className="relative w-20 h-20 bg-slate-700 rounded-lg overflow-hidden flex-shrink-0 border border-slate-850">
                  <Image
                    src={editingCandidate.image_thumb_url}
                    alt=""
                    fill
                    className="object-cover"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold text-sm line-clamp-2 text-slate-100">{editingCandidate.suggested_context}</h4>
                  <p className="text-xs text-slate-400 mt-1 capitalize font-medium">
                    Category: {editingCandidate.category} · {editingCandidate.source} ({editingCandidate.answer})
                  </p>
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    <span className="text-[10px] bg-slate-800 border border-slate-700 px-2 py-0.5 rounded font-mono font-medium text-slate-300">
                      Serves: {editingCandidate.total_served_count || 0}
                    </span>
                    <span className="text-[10px] bg-yellow-950/40 text-yellow-300 border border-yellow-800/50 px-2 py-0.5 rounded font-mono font-semibold">
                      Burn: {editingCandidate.slow_burn_score ? `${(Number(editingCandidate.slow_burn_score) * 100).toFixed(0)}%` : '0%'}
                    </span>
                    <span className="text-[10px] bg-red-950/40 text-red-300 border border-red-800/50 px-2 py-0.5 rounded font-mono font-semibold">
                      Decay: {editingCandidate.candidate_decay_score ? `${(Number(editingCandidate.candidate_decay_score) * 100).toFixed(0)}%` : '0%'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Curation Options Form */}
              <div className="space-y-4">
                <div className="flex items-center justify-between bg-slate-850/60 p-3.5 rounded-xl border border-slate-800">
                  <div>
                    <label className="text-sm font-semibold flex items-center gap-1.5 text-slate-200">
                      <span>🌟</span> Curator Blessed
                    </label>
                    <span className="text-[11px] text-slate-400 block mt-0.5">Promotes this candidate to high ambiguity categories</span>
                  </div>
                  <input
                    type="checkbox"
                    defaultChecked={editingCandidate.curator_blessed}
                    id="curator_blessed_input"
                    className="w-5 h-5 accent-indigo-500 rounded bg-slate-800 border-slate-700 cursor-pointer"
                  />
                </div>

                <div className="flex items-center justify-between bg-slate-850/60 p-3.5 rounded-xl border border-slate-800">
                  <div>
                    <label className="text-sm font-semibold flex items-center gap-1.5 text-slate-200">
                      <span>🔒</span> Curator Locked
                    </label>
                    <span className="text-[11px] text-slate-400 block mt-0.5">Exempts candidate from automated decay retirement</span>
                  </div>
                  <input
                    type="checkbox"
                    defaultChecked={editingCandidate.curator_locked}
                    id="curator_locked_input"
                    className="w-5 h-5 accent-indigo-500 rounded bg-slate-800 border-slate-700 cursor-pointer"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-2 flex items-center gap-1.5 text-slate-200">
                    <span>🛑</span> Anomaly Tier
                  </label>
                  <select
                    id="anomaly_tier_input"
                    defaultValue={editingCandidate.anomaly_tier || 0}
                    className="w-full bg-slate-850 border border-slate-800 rounded-xl py-2 px-3 text-sm focus:outline-none focus:border-indigo-500 text-slate-200"
                  >
                    <option value="0">0: Standard Daily Set Slot</option>
                    <option value="1">1: Mild Anomaly</option>
                    <option value="2">2: Severe Anomaly (Prioritized Slot 11)</option>
                    <option value="3">3: Rare Psychological Event (Protected & Fully Exempt)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-2 text-slate-200">
                    Curator Priority Weight
                  </label>
                  <input
                    type="number"
                    id="curator_priority_input"
                    defaultValue={editingCandidate.curator_priority || 0}
                    className="w-full bg-slate-850 border border-slate-800 rounded-xl py-2 px-3 text-sm focus:outline-none focus:border-indigo-500 font-mono text-slate-200"
                    placeholder="e.g. 10 to prioritize, -10 to deprioritize"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-2 text-slate-200">
                    Curator Notes
                  </label>
                  <textarea
                    id="curator_notes_input"
                    defaultValue={editingCandidate.curator_notes || ''}
                    rows={3}
                    className="w-full bg-slate-850 border border-slate-800 rounded-xl py-2 px-3 text-sm focus:outline-none focus:border-indigo-500 text-slate-205 text-slate-200"
                    placeholder="Write psychological uncertainty triggers or visual cues..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-2 text-slate-200">
                    Pipeline Status Override
                  </label>
                  <select
                    id="status_input"
                    defaultValue={editingCandidate.status}
                    className="w-full bg-slate-850 border border-slate-800 rounded-xl py-2 px-3 text-sm focus:outline-none focus:border-indigo-500 text-slate-200"
                  >
                    <option value="review">Review</option>
                    <option value="approved">Approved</option>
                    <option value="auto_approved">Auto Approved</option>
                    <option value="rejected">Rejected</option>
                    <option value="deleted">Retired (Deleted)</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-6 border-t border-slate-800 bg-slate-950 flex justify-end gap-3">
              <button
                onClick={() => setEditingCandidate(null)}
                className="py-2 px-4 bg-slate-800 hover:bg-slate-700 rounded-xl text-sm transition-colors text-slate-300 font-medium cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  const bInput = document.getElementById('curator_blessed_input') as HTMLInputElement;
                  const lInput = document.getElementById('curator_locked_input') as HTMLInputElement;
                  const tInput = document.getElementById('anomaly_tier_input') as HTMLSelectElement;
                  const pInput = document.getElementById('curator_priority_input') as HTMLInputElement;
                  const nInput = document.getElementById('curator_notes_input') as HTMLTextAreaElement;
                  const sInput = document.getElementById('status_input') as HTMLSelectElement;

                  handlePatchCandidate({
                    candidateId: editingCandidate.id,
                    curator_blessed: bInput?.checked,
                    curator_locked: lInput?.checked,
                    anomaly_tier: parseInt(tInput?.value, 10) || 0,
                    curator_priority: parseInt(pInput?.value, 10) || 0,
                    curator_notes: nInput?.value || '',
                    status: sInput?.value || editingCandidate.status
                  });
                }}
                disabled={patchLoading}
                className="py-2 px-5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white rounded-xl text-sm transition-all shadow-md font-semibold disabled:opacity-50 cursor-pointer"
              >
                {patchLoading ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
