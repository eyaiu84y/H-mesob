import { useState, useEffect, useCallback } from 'react';
import api from '../../utils/api';

/**
 * InstitutionFeedback Component
 * For Institution Managers to view feedback for their institution
 */
export default function InstitutionFeedback() {
  const [feedback, setFeedback] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Filters
  const [serviceFilter, setServiceFilter] = useState('');
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
      if (serviceFilter) params.append('service_id', serviceFilter);
      if (ratingFilter) params.append('rating', ratingFilter);
      if (sourceFilter) params.append('source', sourceFilter);

      const url = `/feedback/institution${params.toString() ? `?${params.toString()}` : ''}`;
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
  }, [serviceFilter, ratingFilter, sourceFilter]);

  const fetchStats = useCallback(async () => {
    try {
      const response = await api.get('/feedback/institution/stats');
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
        }
      });
    }
  }, []);

  useEffect(() => {
    // Fetch data when filters change - this is the correct pattern for data fetching
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
        <div className="inline-block w-12 h-12 border-4 border-[#314ea1] border-t-transparent rounded-full animate-spin"></div>
        <p className="mt-4 text-slate-500 font-medium">Loading feedback...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Statistics Cards */}
      {stats && stats.distribution && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="stat-card">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">Total Feedback</p>
            <p className="text-3xl font-bold text-slate-900">{stats.total || 0}</p>
          </div>
          <div className="stat-card">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">Average Rating</p>
            <div className="flex items-baseline gap-2">
              <p className="text-3xl font-bold text-[#f4b51a]">{stats.average || 0}</p>
              <span className="text-[#f4b51a] text-2xl">★</span>
            </div>
          </div>
          <div className="stat-card">
            <p className="text-xs font-semibold uppercase tracking-wider text-emerald-700 mb-1">Excellent & Fantastic</p>
            <p className="text-3xl font-bold text-emerald-700">
              {(stats.distribution.excellent || 0) + (stats.distribution.fantastic || 0)}
            </p>
            <p className="text-xs text-slate-500 mt-1">
              {stats.total > 0 ? Math.round((((stats.distribution.excellent || 0) + (stats.distribution.fantastic || 0)) / stats.total) * 100) : 0}% of total
            </p>
          </div>
          <div className="stat-card">
            <p className="text-xs font-semibold uppercase tracking-wider text-rose-700 mb-1">Poor Ratings</p>
            <p className="text-3xl font-bold text-rose-700">{stats.distribution.poor || 0}</p>
            <p className="text-xs text-slate-500 mt-1">
              {stats.total > 0 ? Math.round(((stats.distribution.poor || 0) / stats.total) * 100) : 0}% of total
            </p>
          </div>
        </div>
      )}

      {/* Rating Distribution */}
      {stats && stats.total > 0 && (
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-6">
          <h3 className="font-bold text-slate-900 text-base mb-4">Rating Distribution</h3>
          <div className="space-y-3">
            {[5, 4, 3, 2, 1].map(rating => {
              const count = stats.ratingCounts[rating] || 0;
              const percentage = stats.total > 0 ? (count / stats.total) * 100 : 0;
              return (
                <div key={rating} className="flex items-center gap-3">
                  <div className="w-32 flex items-center gap-1.5">
                    <span className="text-sm font-semibold text-slate-700">{rating} Star{rating > 1 ? 's' : ''}</span>
                    <span className="text-[#f4b51a]">★</span>
                  </div>
                  <div className="flex-1 h-7 bg-slate-100 rounded-lg overflow-hidden">
                    <div
                      className={`h-full transition-all ${
                        rating === 5 ? 'bg-emerald-600' :
                        rating === 4 ? 'bg-[#314ea1]' :
                        rating === 3 ? 'bg-amber-500' :
                        rating === 2 ? 'bg-orange-500' :
                        'bg-rose-500'
                      }`}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                  <span className="w-20 text-xs font-semibold text-slate-600 text-right">
                    {count} ({Math.round(percentage)}%)
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-5">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">Filter by Rating</label>
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
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">Filter by Source</label>
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
                setServiceFilter('');
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
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-sm text-rose-700">
          {error}
        </div>
      )}

      {/* Feedback List */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <h3 className="font-semibold text-slate-900">Service Feedback</h3>
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-100 text-slate-700">{feedback.length} feedback{feedback.length !== 1 ? 's' : ''}</span>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block w-8 h-8 border-4 border-[#314ea1] border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : feedback.length === 0 ? (
          <div className="text-center py-12">
            <svg className="w-16 h-16 mx-auto mb-3 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            <p className="font-medium text-slate-700">No feedback available</p>
            <p className="text-sm text-slate-400 mt-1">Feedback will appear here once citizens rate your services</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {feedback.map((item) => (
              <div key={item.id} className="p-6 hover:bg-slate-50/70 transition">
                <div className="flex items-start justify-between gap-4 mb-3">
                  <div className="flex-1">
                    <h4 className="font-bold text-slate-900 text-base mb-1">
                      {item.services?.title_en || 'Unknown Service'}
                    </h4>
                    <div className="flex items-center gap-2.5 text-xs text-slate-500">
                      <span>{formatDate(item.created_at)}</span>
                      <span>•</span>
                      <span className="capitalize px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-medium">{item.source.toLowerCase()}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center gap-1 text-[#f4b51a] text-lg mb-1">
                      {[1, 2, 3, 4, 5].map(star => (
                        <span key={star}>{star <= item.rating ? '⭐' : '☆'}</span>
                      ))}
                    </div>
                    <div className="text-xs font-semibold text-slate-700">
                      {item.rating}/5 — {ratingMeanings[item.rating]}
                    </div>
                  </div>
                </div>

                {item.comment && (
                  <div className="mt-3 p-3.5 bg-slate-50/80 border border-slate-100 rounded-xl">
                    <p className="text-sm text-slate-700 italic">"{item.comment}"</p>
                  </div>
                )}

                {item.applications?.application_number && (
                  <div className="mt-3 text-xs text-slate-500">
                    Application: <span className="font-semibold text-slate-700">{item.applications.application_number}</span>
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
