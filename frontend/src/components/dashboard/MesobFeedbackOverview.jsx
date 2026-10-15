import { useState, useEffect, useCallback } from 'react';
import api from '../../utils/api';

/**
 * MesobFeedbackOverview Component
 * For MESOB Managers to view feedback across all institutions
 */
export default function MesobFeedbackOverview() {
  const [feedback, setFeedback] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Filters
  const [institutionFilter, setInstitutionFilter] = useState('');
  const [ratingFilter, setRatingFilter] = useState('');
  const [sourceFilter, setSourceFilter] = useState('');

  const ratingMeanings = {
    1: 'Poor',
    2: 'Good',
    3: 'Very Good',
    4: 'Excellent',
    5: 'Fantastic'
  };

  const fetchFeedback = useCallback(async () => {
    try {
      setLoading(true);
      setError('');

      const params = new URLSearchParams();
      if (institutionFilter) params.append('institution_id', institutionFilter);
      if (ratingFilter) params.append('rating', ratingFilter);
      if (sourceFilter) params.append('source', sourceFilter);

      const url = `/feedback${params.toString() ? `?${params.toString()}` : ''}`;
      const response = await api.get(url);

      if (response.success) {
        setFeedback(response.data || []);
      } else {
        setError(response.message || 'Failed to fetch feedback');
      }
    } catch (err) {
      console.error('Error fetching feedback:', err);
      setError(err.response?.data?.message || 'Failed to fetch feedback');
    } finally {
      setLoading(false);
    }
  }, [institutionFilter, ratingFilter, sourceFilter]);

  const fetchStats = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (institutionFilter) params.append('institution_id', institutionFilter);

      const url = `/feedback/stats${params.toString() ? `?${params.toString()}` : ''}`;
      const response = await api.get(url);
      
      if (response.success && response.data && response.data.distribution) {
        setStats(response.data);
      } else {
        // Set default structure if backend returns incomplete data
        setStats({
          total: 0,
          average: 0,
          ratingCounts: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
          distribution: {
            poor: 0,
            good: 0,
            veryGood: 0,
            excellent: 0,
            fantastic: 0
          },
          bySource: {
            WEBSITE: 0,
            TELEGRAM: 0
          }
        });
      }
    } catch (err) {
      console.error('Error fetching stats:', err);
      // Set default structure on error to prevent crashes
      setStats({
        total: 0,
        average: 0,
        ratingCounts: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
        distribution: {
          poor: 0,
          good: 0,
          veryGood: 0,
          excellent: 0,
          fantastic: 0
        },
        bySource: {
          WEBSITE: 0,
          TELEGRAM: 0
        }
      });
    }
  }, [institutionFilter]);

  useEffect(() => {
    // Fetch data when filters change - this is the correct pattern for data fetching
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchFeedback();
     
    fetchStats();
  }, [fetchFeedback, fetchStats]);

  function formatDate(dateString) {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  if (loading && !stats) {
    return (
      <div className="text-center py-12">
        <div className="inline-block w-10 h-10 border-3 border-[#314ea1] border-t-transparent rounded-full animate-spin"></div>
        <p className="mt-4 text-slate-600 text-sm font-medium">Loading feedback overview...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h2 className="text-xl font-bold text-slate-900 tracking-tight mb-1">Service Feedback Overview</h2>
        <p className="text-sm text-slate-500 font-normal">Monitor citizen satisfaction across all institutions</p>
      </div>

      {/* Overall Statistics */}
      {stats && stats.distribution && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-5">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Total Feedback</p>
              <p className="text-3xl font-extrabold text-slate-900">{stats.total || 0}</p>
            </div>
            <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-5">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Average Rating</p>
              <div className="flex items-baseline gap-2">
                <p className="text-3xl font-extrabold text-amber-600">{stats.average || 0}</p>
                <span className="text-amber-500 text-2xl">★</span>
              </div>
            </div>
            <div className="bg-emerald-50/60 rounded-2xl border border-emerald-200/70 p-5 shadow-xs">
              <p className="text-xs font-semibold text-emerald-800 uppercase tracking-wider mb-1">Excellent+</p>
              <p className="text-3xl font-extrabold text-emerald-700">
                {(stats.distribution.excellent || 0) + (stats.distribution.fantastic || 0)}
              </p>
              <p className="text-xs font-medium text-emerald-700 mt-1">
                {stats.total > 0 ? Math.round((((stats.distribution.excellent || 0) + (stats.distribution.fantastic || 0)) / stats.total) * 100) : 0}%
              </p>
            </div>
            <div className="bg-blue-50/60 rounded-2xl border border-blue-200/70 p-5 shadow-xs">
              <p className="text-xs font-semibold text-[#1e3a8a] uppercase tracking-wider mb-1">Good/Very Good</p>
              <p className="text-3xl font-extrabold text-[#314ea1]">
                {(stats.distribution.good || 0) + (stats.distribution.veryGood || 0)}
              </p>
              <p className="text-xs font-medium text-[#314ea1] mt-1">
                {stats.total > 0 ? Math.round((((stats.distribution.good || 0) + (stats.distribution.veryGood || 0)) / stats.total) * 100) : 0}%
              </p>
            </div>
            <div className="bg-rose-50/60 rounded-2xl border border-rose-200/70 p-5 shadow-xs">
              <p className="text-xs font-semibold text-rose-800 uppercase tracking-wider mb-1">Poor</p>
              <p className="text-3xl font-extrabold text-rose-700">{stats.distribution.poor || 0}</p>
              <p className="text-xs font-medium text-rose-700 mt-1">
                {stats.total > 0 ? Math.round(((stats.distribution.poor || 0) / stats.total) * 100) : 0}%
              </p>
            </div>
          </div>

          {/* Rating Distribution Chart */}
          {stats.total > 0 && (
            <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-6">
              <h3 className="font-bold text-slate-900 mb-4">Rating Distribution</h3>
              <div className="space-y-3">
                {[
                  { rating: 5, label: 'Fantastic', color: 'bg-emerald-500' },
                  { rating: 4, label: 'Excellent', color: 'bg-[#314ea1]' },
                  { rating: 3, label: 'Very Good', color: 'bg-amber-500' },
                  { rating: 2, label: 'Good', color: 'bg-orange-500' },
                  { rating: 1, label: 'Poor', color: 'bg-rose-500' }
                ].map(({ rating, label, color }) => {
                  const count = stats.ratingCounts[rating] || 0;
                  const percentage = stats.total > 0 ? (count / stats.total) * 100 : 0;
                  return (
                    <div key={rating} className="flex items-center gap-3">
                      <div className="w-40 flex items-center gap-2">
                        <span className="text-sm font-semibold text-slate-700">{rating} ★ {label}</span>
                      </div>
                      <div className="flex-1 h-9 bg-slate-100 rounded-xl overflow-hidden relative">
                        <div
                          className={`h-full transition-all duration-300 ${color}`}
                          style={{ width: `${percentage}%` }}
                        />
                        <div className="absolute inset-0 flex items-center justify-center">
                          <span className="text-xs font-bold text-slate-800 drop-shadow-xs">
                            {count} ({Math.round(percentage)}%)
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </>
      )}

      {/* Filters */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-5">
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Filter by Institution</label>
            <select
              value={institutionFilter}
              onChange={(e) => setInstitutionFilter(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-[#314ea1]/20 focus:border-[#314ea1] outline-none transition text-sm bg-white"
            >
              <option value="">All Institutions</option>
              {/* TODO: Load institutions dynamically */}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Filter by Rating</label>
            <select
              value={ratingFilter}
              onChange={(e) => setRatingFilter(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-[#314ea1]/20 focus:border-[#314ea1] outline-none transition text-sm bg-white"
            >
              <option value="">All Ratings</option>
              <option value="5">⭐⭐⭐⭐⭐ Fantastic (5)</option>
              <option value="4">⭐⭐⭐⭐ Excellent (4)</option>
              <option value="3">⭐⭐⭐ Very Good (3)</option>
              <option value="2">⭐⭐ Good (2)</option>
              <option value="1">⭐ Poor (1)</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Filter by Source</label>
            <select
              value={sourceFilter}
              onChange={(e) => setSourceFilter(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-[#314ea1]/20 focus:border-[#314ea1] outline-none transition text-sm bg-white"
            >
              <option value="">All Sources</option>
              <option value="WEBSITE">Website</option>
              <option value="TELEGRAM">Telegram</option>
            </select>
          </div>
          <div className="flex items-end">
            <button
              onClick={() => {
                setInstitutionFilter('');
                setRatingFilter('');
                setSourceFilter('');
              }}
              className="w-full px-4 py-2.5 border border-slate-300 text-slate-700 text-sm font-semibold rounded-xl hover:bg-slate-50 transition"
            >
              Clear Filters
            </button>
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-sm font-medium text-rose-700">
          {error}
        </div>
      )}

      {/* Feedback List */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="font-bold text-slate-900">All Feedback</h3>
          <span className="text-xs font-semibold px-2.5 py-1 bg-blue-50 text-[#1e3a8a] border border-blue-200 rounded-full">{feedback.length} total</span>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block w-8 h-8 border-3 border-[#314ea1] border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : feedback.length === 0 ? (
          <div className="text-center py-12">
            <svg className="w-16 h-16 mx-auto mb-3 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            <p className="font-semibold text-slate-600">No feedback available</p>
            <p className="text-xs text-slate-400 mt-1">Feedback will appear here once citizens rate services</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {feedback.map((item) => (
              <div key={item.id} className="p-6 hover:bg-slate-50/70 transition">
                <div className="flex items-start justify-between gap-4 mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-bold text-slate-900">
                        {item.services?.title_en || 'Unknown Service'}
                      </h4>
                      <span className="px-2.5 py-0.5 bg-blue-50 text-[#1e3a8a] text-xs font-semibold rounded-full border border-blue-200">
                        {item.institutions?.name_en || 'Unknown Institution'}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-xs font-medium text-slate-500">
                      <span>{formatDate(item.created_at)}</span>
                      <span>•</span>
                      <span className="capitalize">{item.source.toLowerCase()}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center gap-1 text-amber-500 text-lg mb-1">
                      {[1, 2, 3, 4, 5].map(star => (
                        <span key={star}>{star <= item.rating ? '★' : '☆'}</span>
                      ))}
                    </div>
                    <div className="text-xs font-semibold text-slate-700">
                      {item.rating}/5 — {ratingMeanings[item.rating]}
                    </div>
                  </div>
                </div>

                {item.comment && (
                  <div className="mt-3 p-3.5 bg-slate-50 rounded-xl border border-slate-100">
                    <p className="text-sm text-slate-700 italic">"{item.comment}"</p>
                  </div>
                )}

                {item.applications?.application_number && (
                  <div className="mt-3 text-xs font-medium text-slate-400">
                    Application: {item.applications.application_number}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
