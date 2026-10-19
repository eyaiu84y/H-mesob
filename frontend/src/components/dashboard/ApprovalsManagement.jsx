import { useState, useEffect, useMemo, useCallback } from 'react';
import api from '../../utils/api';
import { useNotifications } from '../../context/NotificationContext';

export default function ApprovalsManagement({
  isManagerView = false,
  initialRequestId = null,
  onClearInitialRequest = null
}) {
  const { refreshNotifications } = useNotifications();

  const [approvals, setApprovals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters
  const [statusFilter, setStatusFilter] = useState('PENDING_APPROVAL'); // 'PENDING_APPROVAL' | 'APPROVED' | 'REJECTED' | 'ALL'
  const [typeFilter, setTypeFilter] = useState('ALL'); // 'ALL' | 'INSTITUTION' | 'USER'
  const [searchQuery, setSearchQuery] = useState('');

  // Modals state
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [decisionModalOpen, setDecisionModalOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [decisionAction, setDecisionAction] = useState(null); // 'APPROVE' | 'REJECT'
  const [confirmStep, setConfirmStep] = useState(null); // null | 'APPROVE' | 'REJECT_INPUT' | 'REJECT_CONFIRM'
  const [submittingDecision, setSubmittingDecision] = useState(false);

  // Logo inspection state
  const [logoStatus, setLogoStatus] = useState('loading'); // 'loading' | 'valid' | 'missing' | 'error'
  const [enlargeLogoOpen, setEnlargeLogoOpen] = useState(false);

  const [historyModalOpen, setHistoryModalOpen] = useState(false);

  // Resubmit modal for Admin
  const [resubmitModalOpen, setResubmitModalOpen] = useState(false);
  const [resubmitData, setResubmitData] = useState({});
  const [resubmitNotes, setResubmitNotes] = useState('');
  const [submittingResubmit, setSubmittingResubmit] = useState(false);

  // Fetch approvals from backend
  const fetchApprovals = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.get('/approvals');
      const isSuccess = res?.success ?? res?.data?.success;
      const dataPayload = res?.data ?? res?.data?.data;

      if (isSuccess && Array.isArray(dataPayload)) {
        setApprovals(dataPayload);
      } else {
        setApprovals([]);
      }
    } catch (err) {
      console.error('Failed to load approvals:', err);
      setError(err.response?.data?.message || err.message || 'Failed to load approvals.');
      setApprovals([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchApprovals();
  }, [fetchApprovals]);

  // Open review inspection modal (without executing any decision)
  const openReviewModal = useCallback((item) => {
    setSelectedRequest(item);
    setDecisionAction(null);
    setRejectionReason('');
    setConfirmStep(null);
    const logoUrl = item.logoUrl || item.details?.logoUrl;
    if (item.entityType === 'INSTITUTION') {
      if (!logoUrl || !String(logoUrl).trim() || logoUrl === 'null') {
        setLogoStatus('missing');
      } else {
        setLogoStatus('loading');
      }
    }
    setDecisionModalOpen(true);
  }, []);

  // Handle initialRequestId (e.g. from notification click)
  useEffect(() => {
    if (initialRequestId && approvals.length > 0) {
      const match = approvals.find(
        (a) => a.id === initialRequestId || a.entityId === initialRequestId
      );
      if (match) {
        if (statusFilter !== 'ALL' && match.status !== statusFilter) {
          setStatusFilter(match.status);
        }
        openReviewModal(match);
        if (onClearInitialRequest) {
          onClearInitialRequest();
        }
      }
    }
  }, [initialRequestId, approvals, onClearInitialRequest, openReviewModal, statusFilter]);

  // Counts
  const counts = useMemo(() => {
    return {
      all: approvals.length,
      pending: approvals.filter(a => a.status === 'PENDING_APPROVAL').length,
      approved: approvals.filter(a => a.status === 'APPROVED').length,
      rejected: approvals.filter(a => a.status === 'REJECTED').length
    };
  }, [approvals]);

  // Filtered approvals
  const filteredApprovals = useMemo(() => {
    return approvals.filter(item => {
      // Status filter
      if (statusFilter !== 'ALL' && item.status !== statusFilter) return false;
      // Type filter
      if (typeFilter !== 'ALL' && item.entityType !== typeFilter) return false;
      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const nameMatch = (item.entityName || '').toLowerCase().includes(q);
        const codeMatch = (item.code || '').toLowerCase().includes(q);
        const emailMatch = (item.details?.email || '').toLowerCase().includes(q);
        const roleMatch = (item.requestedRole || '').toLowerCase().includes(q);
        return nameMatch || codeMatch || emailMatch || roleMatch;
      }
      return true;
    });
  }, [approvals, statusFilter, typeFilter, searchQuery]);

  // Handle Review Decision (Mesob Manager)
  const handleDecisionSubmit = async (overrideAction) => {
    const action = overrideAction || decisionAction;
    if (!selectedRequest || !action) return;

    if (action === 'REJECT' && !rejectionReason.trim()) {
      alert('Please enter a mandatory rejection reason explaining what needs correction.');
      return;
    }

    try {
      setSubmittingDecision(true);
      const res = await api.patch(
        `/approvals/${selectedRequest.entityType}/${selectedRequest.entityId}/decision`,
        {
          decision: action === 'APPROVE' ? 'APPROVED' : 'REJECTED',
          reason: rejectionReason.trim() || undefined
        }
      );

      const isSuccess = res?.success ?? res?.data?.success;
      if (isSuccess) {
        setDecisionModalOpen(false);
        setSelectedRequest(null);
        setRejectionReason('');
        setDecisionAction(null);
        setConfirmStep(null);
        await fetchApprovals();
        await refreshNotifications();
      } else {
        alert(res?.message || 'Failed to record decision.');
      }
    } catch (err) {
      console.error('Decision error:', err);
      alert(err.response?.data?.message || err.message || 'Failed to submit decision.');
    } finally {
      setSubmittingDecision(false);
    }
  };

  // Handle Resubmit (Super Admin)
  const handleResubmit = async () => {
    if (!selectedRequest) return;
    try {
      setSubmittingResubmit(true);
      const type = selectedRequest.entityType.toLowerCase();
      const endpoint = `/approvals/${type}/${selectedRequest.entityId}/resubmit`;

      const res = await api.post(endpoint, {
        ...resubmitData,
        resubmitNotes: resubmitNotes.trim()
      });

      const isSuccess = res?.success ?? res?.data?.success;
      if (isSuccess) {
        setResubmitModalOpen(false);
        setSelectedRequest(null);
        setResubmitData({});
        setResubmitNotes('');
        await fetchApprovals();
        await refreshNotifications();
      } else {
        alert(res?.message || 'Failed to resubmit request.');
      }
    } catch (err) {
      console.error('Resubmit error:', err);
      alert(err.response?.data?.message || err.message || 'Failed to resubmit.');
    } finally {
      setSubmittingResubmit(false);
    }
  };

  const openResubmitModal = (item) => {
    setSelectedRequest(item);
    setResubmitData({
      name: item.entityName,
      nameAm: item.nameAm,
      phone: item.details?.phone || '',
      email: item.details?.email || '',
      description: item.details?.description || '',
      address: item.details?.address || '',
      fullName: item.entityName,
      employeeId: item.details?.employeeId || ''
    });
    setResubmitNotes('');
    setResubmitModalOpen(true);
  };

  const formatDateTime = (iso) => {
    if (!iso) return '-';
    try {
      const d = new Date(iso);
      return `${d.toLocaleDateString()} at ${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    } catch {
      return iso;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header and KPI cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Total Submissions</p>
          <p className="text-2xl font-bold text-slate-900">{counts.all}</p>
          <p className="text-xs text-slate-500 mt-1">Institutions & user accounts</p>
        </div>

        <div className="bg-white rounded-2xl border border-amber-200/90 p-5 shadow-xs bg-gradient-to-br from-amber-50/40 to-white">
          <p className="text-xs font-semibold text-amber-800 uppercase tracking-wider mb-1">Pending Review</p>
          <p className="text-2xl font-bold text-amber-600">{counts.pending}</p>
          <p className="text-xs text-amber-700 mt-1 font-medium">Awaiting Mesob decision</p>
        </div>

        <div className="bg-white rounded-2xl border border-emerald-200/90 p-5 shadow-xs bg-gradient-to-br from-emerald-50/40 to-white">
          <p className="text-xs font-semibold text-emerald-800 uppercase tracking-wider mb-1">Approved & Active</p>
          <p className="text-2xl font-bold text-emerald-600">{counts.approved}</p>
          <p className="text-xs text-emerald-700 mt-1 font-medium">Successfully activated</p>
        </div>

        <div className="bg-white rounded-2xl border border-rose-200/90 p-5 shadow-xs bg-gradient-to-br from-rose-50/40 to-white">
          <p className="text-xs font-semibold text-rose-800 uppercase tracking-wider mb-1">Rejected</p>
          <p className="text-2xl font-bold text-rose-600">{counts.rejected}</p>
          <p className="text-xs text-rose-700 mt-1 font-medium">Corrections required</p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Status Tabs */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-100/80 rounded-xl text-xs font-semibold w-full md:w-auto overflow-x-auto">
          <button
            onClick={() => setStatusFilter('PENDING_APPROVAL')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              statusFilter === 'PENDING_APPROVAL'
                ? 'bg-white text-amber-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Pending ({counts.pending})
          </button>
          <button
            onClick={() => setStatusFilter('APPROVED')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              statusFilter === 'APPROVED'
                ? 'bg-white text-emerald-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Approved ({counts.approved})
          </button>
          <button
            onClick={() => setStatusFilter('REJECTED')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              statusFilter === 'REJECTED'
                ? 'bg-white text-rose-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Rejected ({counts.rejected})
          </button>
          <button
            onClick={() => setStatusFilter('ALL')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              statusFilter === 'ALL'
                ? 'bg-white text-[#314ea1] shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            All ({counts.all})
          </button>
        </div>

        {/* Search & Type filter */}
        <div className="flex items-center gap-3 w-full md:w-auto">
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-3 py-2 text-xs font-semibold rounded-xl border border-slate-300 bg-white text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-[#314ea1]/20"
          >
            <option value="ALL">All Entities</option>
            <option value="INSTITUTION">Institutions</option>
            <option value="USER">User Accounts</option>
          </select>

          <div className="relative flex-1 md:w-64">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name, code, or email..."
              className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-300 bg-white text-slate-800 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-[#314ea1]/20"
            />
            <svg
              className="absolute left-3 top-2.5 w-3.5 h-3.5 text-slate-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>

          <button
            onClick={fetchApprovals}
            title="Refresh list"
            className="p-2 rounded-xl text-slate-600 hover:bg-slate-100 transition-colors border border-slate-200"
          >
            <svg className={`w-4 h-4 ${loading ? 'animate-spin text-[#314ea1]' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
        </div>
      </div>

      {/* Approvals Table */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
        {loading && approvals.length === 0 ? (
          <div className="p-12 text-center text-slate-400">
            <div className="w-8 h-8 border-3 border-[#314ea1] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-sm font-semibold text-slate-600">Loading approval queue...</p>
          </div>
        ) : error ? (
          <div className="p-8 text-center text-rose-600">
            <p className="text-sm font-semibold">{error}</p>
            <button onClick={fetchApprovals} className="mt-2 text-xs font-bold underline">Try again</button>
          </div>
        ) : filteredApprovals.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p className="text-sm font-bold text-slate-800">No requests in this view</p>
            <p className="text-xs text-slate-500 mt-1">
              {statusFilter === 'PENDING_APPROVAL'
                ? 'All pending approval requests have been processed.'
                : 'No submissions matched your search and filter criteria.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/70 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  <th className="py-3.5 px-4">Entity</th>
                  <th className="py-3.5 px-4">Identifier / Role</th>
                  <th className="py-3.5 px-4">Submitted By</th>
                  <th className="py-3.5 px-4">Submission Date</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {filteredApprovals.map((item) => {
                  const isPending = item.status === 'PENDING_APPROVAL';
                  const isApproved = item.status === 'APPROVED';
                  const isRejected = item.status === 'REJECTED';

                  return (
                    <tr key={`${item.entityType}-${item.entityId}`} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <span
                            className={`px-2 py-0.5 rounded-md text-[10px] font-bold shrink-0 ${
                              item.entityType === 'INSTITUTION'
                                ? 'bg-blue-100 text-[#314ea1]'
                                : 'bg-purple-100 text-purple-800'
                            }`}
                          >
                            {item.entityType === 'INSTITUTION' ? 'INSTITUTION' : 'USER'}
                          </span>
                          <div>
                            <p className="font-bold text-slate-900">{item.entityName}</p>
                            {item.nameAm && (
                              <p className="text-[11px] text-slate-400">{item.nameAm}</p>
                            )}
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        {item.entityType === 'INSTITUTION' ? (
                          <span className="font-mono text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded text-[11px]">
                            {item.code}
                          </span>
                        ) : (
                          <div>
                            <span className="font-semibold text-slate-800">{item.requestedRole}</span>
                            <p className="text-[11px] text-slate-500 truncate max-w-[180px]">{item.details?.email}</p>
                          </div>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-slate-700">
                        <p className="font-medium text-slate-900">{item.submittingAdmin?.name}</p>
                        <p className="text-[11px] text-slate-500">{item.submittingAdmin?.email}</p>
                      </td>

                      <td className="py-3.5 px-4 text-slate-600 whitespace-nowrap">
                        {formatDateTime(item.submittedAt)}
                      </td>

                      <td className="py-3.5 px-4">
                        {isPending && (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                            Pending Review
                          </span>
                        )}
                        {isApproved && (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                            Approved
                          </span>
                        )}
                        {isRejected && (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                            Rejected
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {/* MESOB_MANAGER Decision button */}
                          {isManagerView && isPending ? (
                            <button
                              onClick={() => openReviewModal(item)}
                              className="px-3 py-1.5 bg-gradient-to-r from-[#314ea1] to-[#1e3a8a] text-white font-semibold text-xs rounded-lg hover:from-[#253d82] hover:to-[#172554] transition shadow-xs"
                            >
                              Inspect & Review
                            </button>
                          ) : (
                            <button
                              onClick={() => openReviewModal(item)}
                              className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-lg transition"
                            >
                              View Details
                            </button>
                          )}

                          {/* Rejection reason button */}
                          {isRejected && (
                            <button
                              onClick={() => {
                                setSelectedRequest(item);
                                setHistoryModalOpen(true);
                              }}
                              className="px-2.5 py-1.5 bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100 font-semibold text-xs rounded-lg transition"
                            >
                              Reason
                            </button>
                          )}

                          {/* Resubmit button for Super Admin */}
                          {!isManagerView && isRejected && (
                            <button
                              onClick={() => openResubmitModal(item)}
                              className="px-3 py-1.5 bg-amber-50 text-amber-800 border border-amber-300 hover:bg-amber-100 font-semibold text-xs rounded-lg transition"
                            >
                              Resubmit
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ───────────────────────────────────────────────────────────── */}
      {/* COMPLETE REVIEW & DECISION MODAL (MESOB Manager / Admin) */}
      {/* ───────────────────────────────────────────────────────────── */}
      {decisionModalOpen && selectedRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl my-8 overflow-hidden animate-in fade-in zoom-in-95 duration-150 flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between shrink-0 bg-slate-50/50">
              <div className="flex items-center gap-2.5">
                <span
                  className={`px-2.5 py-0.5 rounded-md text-xs font-bold ${
                    selectedRequest.entityType === 'INSTITUTION'
                      ? 'bg-blue-100 text-[#314ea1]'
                      : 'bg-purple-100 text-purple-800'
                  }`}
                >
                  {selectedRequest.entityType}
                </span>
                <div>
                  <h3 className="font-bold text-slate-900 text-base leading-snug">
                    {selectedRequest.entityName}
                    {selectedRequest.nameAm && (
                      <span className="font-normal text-slate-500 text-sm ml-2">({selectedRequest.nameAm})</span>
                    )}
                  </h3>
                  <p className="text-[11px] text-slate-400">Request ID: {selectedRequest.id}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {selectedRequest.status === 'PENDING_APPROVAL' && (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                    Pending Review
                  </span>
                )}
                {selectedRequest.status === 'APPROVED' && (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    Approved & Active
                  </span>
                )}
                {selectedRequest.status === 'REJECTED' && (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200">
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                    Rejected
                  </span>
                )}
                <button
                  onClick={() => setDecisionModalOpen(false)}
                  className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition"
                  title="Close inspection"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Modal Body (Scrollable) */}
            <div className="p-6 overflow-y-auto space-y-5 text-xs flex-1">
              {/* Prior Rejection Alert if rejected */}
              {selectedRequest.status === 'REJECTED' && (
                <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 space-y-1.5">
                  <p className="font-bold text-rose-800 text-xs flex items-center gap-1.5">
                    <span>✕</span> Rejection Reason:
                  </p>
                  <p className="text-rose-900 leading-relaxed font-medium">
                    {selectedRequest.rejectionReason || 'No detailed reason provided.'}
                  </p>
                  {selectedRequest.reviewedBy && (
                    <p className="text-[10px] text-rose-600 pt-1 border-t border-rose-200/60">
                      Reviewed by {selectedRequest.reviewedBy.name} on {formatDateTime(selectedRequest.reviewedAt)}
                    </p>
                  )}
                </div>
              )}

              {/* Approval Info Alert if approved */}
              {selectedRequest.status === 'APPROVED' && selectedRequest.reviewedBy && (
                <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 space-y-0.5">
                  <p className="font-bold flex items-center gap-1.5">
                    <span>✓</span> Approved & Activated
                  </p>
                  <p className="text-[11px] text-emerald-700">
                    Approved by {selectedRequest.reviewedBy.name} on {formatDateTime(selectedRequest.reviewedAt)}
                  </p>
                </div>
              )}

              {/* ───────────────────────────────────────────────────────────── */}
              {/* INSTITUTION DETAILS & LOGO VERIFICATION */}
              {/* ───────────────────────────────────────────────────────────── */}
              {selectedRequest.entityType === 'INSTITUTION' && (
                <>
                  {/* Logo Inspection Card (Mandatory verification) */}
                  <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold uppercase tracking-wider text-slate-700">Institution Logo Inspection</span>
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-rose-100 text-rose-700">Mandatory</span>
                      </div>
                      {logoStatus === 'valid' && (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                          ✓ Logo Verified & Accessible
                        </span>
                      )}
                    </div>

                    <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 pt-1">
                      {/* Logo Preview Container */}
                      <div className="relative shrink-0">
                        {selectedRequest.logoUrl || selectedRequest.details?.logoUrl ? (
                          <div className="relative group">
                            <img
                              src={selectedRequest.logoUrl || selectedRequest.details?.logoUrl}
                              alt={`${selectedRequest.entityName} logo`}
                              onLoad={() => setLogoStatus('valid')}
                              onError={() => setLogoStatus('error')}
                              className="w-24 h-24 object-contain rounded-xl border border-slate-200 bg-white p-2 shadow-xs cursor-pointer hover:border-[#314ea1] transition-all"
                              onClick={() => setEnlargeLogoOpen(true)}
                            />
                            <button
                              type="button"
                              onClick={() => setEnlargeLogoOpen(true)}
                              className="absolute bottom-1 right-1 p-1 bg-black/60 hover:bg-black/80 text-white rounded-md text-[10px] shadow-xs"
                              title="Enlarge logo for inspection"
                            >
                              🔍
                            </button>
                          </div>
                        ) : (
                          <div className="w-24 h-24 rounded-xl border-2 border-dashed border-rose-300 bg-rose-50/50 flex flex-col items-center justify-center text-rose-500 text-center p-2">
                            <svg className="w-6 h-6 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                            <span className="text-[10px] font-bold">No Logo</span>
                          </div>
                        )}
                      </div>

                      {/* Status Warning / Info */}
                      <div className="flex-1 text-xs space-y-2 w-full">
                        {logoStatus === 'missing' && (
                          <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 space-y-1">
                            <p className="font-bold flex items-center gap-1.5 text-amber-800">
                              ⚠️ Mandatory Logo Missing
                            </p>
                            <p className="text-[11px] leading-relaxed text-amber-700">
                              No institution logo was provided with this submission. Hawassa MESOB policy requires a verified logo. Approval is blocked until a valid logo is supplied. You may reject this request to request corrections.
                            </p>
                          </div>
                        )}

                        {logoStatus === 'error' && (
                          <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-900 space-y-1">
                            <p className="font-bold flex items-center gap-1.5 text-rose-800">
                              ⚠️ Broken / Inaccessible Logo File
                            </p>
                            <p className="text-[11px] leading-relaxed text-rose-700">
                              The logo at the provided URL failed to load or is invalid. Approval cannot proceed with an unverified or broken logo. Please inspect the source or reject to request a proper upload.
                            </p>
                          </div>
                        )}

                        {logoStatus === 'valid' && (
                          <div className="space-y-1.5">
                            <p className="text-slate-600">
                              The logo is loaded and verified for <span className="font-semibold text-slate-800">{selectedRequest.entityName}</span>.
                            </p>
                            <button
                              type="button"
                              onClick={() => setEnlargeLogoOpen(true)}
                              className="text-xs text-[#314ea1] hover:underline font-semibold inline-flex items-center gap-1"
                            >
                              🔍 Inspect full size & storage reference →
                            </button>
                          </div>
                        )}

                        {(selectedRequest.logoUrl || selectedRequest.details?.logoUrl) && (
                          <p className="text-[10px] text-slate-400 font-mono truncate max-w-md">
                            Reference: {selectedRequest.logoUrl || selectedRequest.details?.logoUrl}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Core Fields Grid */}
                  <div className="p-4 rounded-xl bg-white border border-slate-200 space-y-3">
                    <p className="text-xs font-bold uppercase tracking-wider text-slate-700">Institution Information</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                      <div>
                        <span className="text-slate-400 font-medium">Institution Name (EN):</span>
                        <p className="font-bold text-slate-900 text-sm mt-0.5">{selectedRequest.entityName}</p>
                      </div>
                      <div>
                        <span className="text-slate-400 font-medium">Institution Name (AM):</span>
                        <p className="font-bold text-slate-900 text-sm mt-0.5">{selectedRequest.nameAm || selectedRequest.details?.nameAm || 'N/A'}</p>
                      </div>
                      <div>
                        <span className="text-slate-400 font-medium">Institution Code:</span>
                        <p className="font-mono font-bold text-slate-800 mt-0.5 bg-slate-100 inline-block px-2 py-0.5 rounded">{selectedRequest.code}</p>
                      </div>
                      <div>
                        <span className="text-slate-400 font-medium">Type / Category:</span>
                        <p className="font-semibold text-slate-800 mt-0.5">Government Public Service Center</p>
                      </div>
                      <div>
                        <span className="text-slate-400 font-medium">Contact Email:</span>
                        <p className="font-medium text-slate-800 mt-0.5">{selectedRequest.details?.email || 'N/A'}</p>
                      </div>
                      <div>
                        <span className="text-slate-400 font-medium">Contact Phone:</span>
                        <p className="font-medium text-slate-800 mt-0.5">{selectedRequest.details?.phone || 'N/A'}</p>
                      </div>
                      <div>
                        <span className="text-slate-400 font-medium">Physical Address:</span>
                        <p className="font-medium text-slate-800 mt-0.5">{selectedRequest.details?.address || 'N/A'}</p>
                      </div>
                      <div>
                        <span className="text-slate-400 font-medium">Official Website:</span>
                        <p className="font-medium text-slate-800 mt-0.5">
                          {selectedRequest.details?.websiteUrl || selectedRequest.websiteUrl ? (
                            <a
                              href={selectedRequest.details?.websiteUrl || selectedRequest.websiteUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-[#314ea1] hover:underline font-semibold inline-flex items-center gap-1"
                            >
                              {selectedRequest.details?.websiteUrl || selectedRequest.websiteUrl} ↗
                            </a>
                          ) : (
                            'N/A'
                          )}
                        </p>
                      </div>
                    </div>

                    {/* Description */}
                    <div className="pt-2 border-t border-slate-100">
                      <span className="text-slate-400 font-medium">Description & Purpose:</span>
                      <p className="font-normal text-slate-700 mt-1 leading-relaxed whitespace-pre-wrap bg-slate-50 p-3 rounded-lg border border-slate-200/60">
                        {selectedRequest.details?.description || 'No description submitted.'}
                      </p>
                    </div>
                  </div>
                </>
              )}

              {/* ───────────────────────────────────────────────────────────── */}
              {/* USER ACCOUNT DETAILS */}
              {/* ───────────────────────────────────────────────────────────── */}
              {selectedRequest.entityType === 'USER' && (
                <div className="p-4 rounded-xl bg-white border border-slate-200 space-y-3">
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-700">User Account Information</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                    <div>
                      <span className="text-slate-400 font-medium">Full Name:</span>
                      <p className="font-bold text-slate-900 text-sm mt-0.5">{selectedRequest.entityName}</p>
                    </div>
                    <div>
                      <span className="text-slate-400 font-medium">Requested Role:</span>
                      <p className="mt-0.5">
                        <span className="px-2 py-0.5 rounded font-bold bg-purple-100 text-purple-800 text-xs">
                          {selectedRequest.requestedRole}
                        </span>
                      </p>
                    </div>
                    <div>
                      <span className="text-slate-400 font-medium">Email Address:</span>
                      <p className="font-medium text-slate-800 mt-0.5">{selectedRequest.details?.email}</p>
                    </div>
                    <div>
                      <span className="text-slate-400 font-medium">Phone Number:</span>
                      <p className="font-medium text-slate-800 mt-0.5">{selectedRequest.details?.phone || 'N/A'}</p>
                    </div>
                    <div>
                      <span className="text-slate-400 font-medium">Assigned Institution:</span>
                      <p className="font-semibold text-slate-800 mt-0.5">{selectedRequest.institutionName || 'None'}</p>
                    </div>
                    <div>
                      <span className="text-slate-400 font-medium">Employee / Staff ID:</span>
                      <p className="font-mono font-medium text-slate-800 mt-0.5">{selectedRequest.details?.employeeId || 'N/A'}</p>
                    </div>
                    <div>
                      <span className="text-slate-400 font-medium">National ID:</span>
                      <p className="font-mono font-medium text-slate-800 mt-0.5">{selectedRequest.details?.nationalId || 'N/A'}</p>
                    </div>
                  </div>

                  <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl text-[11px] text-slate-600 flex items-center gap-2">
                    <span>🔒</span>
                    <span><strong>Security Notice:</strong> Passwords, password hashes, and authentication secrets are strictly protected and never displayed on this review screen.</span>
                  </div>
                </div>
              )}

              {/* Submission Metadata */}
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-slate-600">
                <div>
                  <span className="font-semibold text-slate-700">Submitting Administrator:</span>{' '}
                  <span className="text-slate-900">{selectedRequest.submittingAdmin?.name}</span> ({selectedRequest.submittingAdmin?.email})
                </div>
                <div>
                  <span className="font-semibold text-slate-700">Submitted At:</span>{' '}
                  <span className="text-slate-900">{formatDateTime(selectedRequest.submittedAt)}</span>
                </div>
              </div>

              {/* Audit History Timeline */}
              {selectedRequest.history?.length > 0 && (
                <div className="p-4 rounded-xl bg-white border border-slate-200 space-y-3">
                  <p className="font-bold text-slate-800 text-xs">Decision & Audit History</p>
                  <div className="space-y-3 relative border-l-2 border-slate-200 ml-2 pl-4">
                    {selectedRequest.history.map((h, i) => (
                      <div key={i} className="relative">
                        <span className="absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full bg-[#314ea1] ring-4 ring-white" />
                        <p className="text-xs font-bold text-slate-800">
                          {h.action} <span className="font-normal text-slate-500 text-[11px]">by {h.by_name || 'Admin'}</span>
                        </p>
                        <p className="text-[10px] text-slate-400">{formatDateTime(h.timestamp)}</p>
                        {h.reason && <p className="text-xs text-rose-700 mt-0.5">Reason: {h.reason}</p>}
                        {h.notes && <p className="text-xs text-slate-600 mt-0.5">{h.notes}</p>}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* ───────────────────────────────────────────────────────────── */}
              {/* EXPLICIT DECISION ACTIONS (MESOB Manager & Pending Approval) */}
              {/* ───────────────────────────────────────────────────────────── */}
              {isManagerView && selectedRequest.status === 'PENDING_APPROVAL' && (
                <div className="pt-2 space-y-3 border-t border-slate-200">
                  {/* Step 1: Decision Choice Buttons */}
                  {confirmStep === null && (
                    <div className="space-y-3">
                      <p className="text-xs font-bold text-slate-700 uppercase tracking-wider">Manager Decision Action:</p>
                      <div className="grid grid-cols-2 gap-3">
                        <button
                          type="button"
                          disabled={selectedRequest.entityType === 'INSTITUTION' && (logoStatus === 'missing' || logoStatus === 'error')}
                          onClick={() => setConfirmStep('APPROVE')}
                          className="p-3 rounded-xl border border-emerald-500 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold text-xs text-center transition disabled:opacity-40 disabled:cursor-not-allowed shadow-xs"
                        >
                          ✓ Approve & Activate
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setDecisionAction('REJECT');
                            setConfirmStep('REJECT_INPUT');
                          }}
                          className="p-3 rounded-xl border border-rose-500 bg-rose-50 hover:bg-rose-100 text-rose-800 font-bold text-xs text-center transition shadow-xs"
                        >
                          ✕ Reject with Reason
                        </button>
                      </div>

                      {selectedRequest.entityType === 'INSTITUTION' && (logoStatus === 'missing' || logoStatus === 'error') && (
                        <p className="text-[11px] text-rose-600 font-medium text-center">
                          * Cannot approve: A verified, accessible logo is mandatory before approving an institution.
                        </p>
                      )}
                    </div>
                  )}

                  {/* Step 2: Approval Confirmation */}
                  {confirmStep === 'APPROVE' && (
                    <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 space-y-3 animate-in fade-in duration-150">
                      <p className="font-bold text-emerald-900 text-xs flex items-center gap-1.5">
                        <span>⚠️</span> Explicit Approval Confirmation:
                      </p>
                      <p className="text-emerald-800 leading-relaxed text-xs">
                        Are you sure you want to approve and activate <strong className="text-emerald-950 font-bold">{selectedRequest.entityName}</strong>? This action will activate the {selectedRequest.entityType.toLowerCase()} across Hawassa MESOB and send an official notification to the submitting Super Admin.
                      </p>
                      <div className="flex justify-end gap-2 pt-2">
                        <button
                          type="button"
                          onClick={() => setConfirmStep(null)}
                          className="px-4 py-2 border border-slate-300 bg-white text-slate-700 font-semibold text-xs rounded-xl hover:bg-slate-50 transition"
                        >
                          Cancel / Back to Review
                        </button>
                        <button
                          type="button"
                          disabled={submittingDecision}
                          onClick={() => handleDecisionSubmit('APPROVE')}
                          className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs rounded-xl shadow-xs transition disabled:opacity-50"
                        >
                          {submittingDecision ? 'Activating...' : 'Yes, Confirm Approval & Activate'}
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Step 3: Rejection Reason Input */}
                  {confirmStep === 'REJECT_INPUT' && (
                    <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 space-y-3 animate-in fade-in duration-150">
                      <label className="block text-xs font-bold text-rose-800">
                        Mandatory Rejection Reason <span className="text-rose-600">*</span>:
                      </label>
                      <textarea
                        rows="3"
                        value={rejectionReason}
                        onChange={(e) => setRejectionReason(e.target.value)}
                        placeholder="Clearly explain the missing requirements, policy non-compliance, logo update, or corrections needed for the Super Admin..."
                        className="w-full p-3 text-xs rounded-xl border border-rose-300 focus:outline-hidden focus:ring-2 focus:ring-rose-500/30 text-slate-800 bg-white"
                      />
                      <div className="flex justify-end gap-2 pt-1">
                        <button
                          type="button"
                          onClick={() => {
                            setConfirmStep(null);
                            setDecisionAction(null);
                          }}
                          className="px-4 py-2 border border-slate-300 bg-white text-slate-700 font-semibold text-xs rounded-xl hover:bg-slate-50 transition"
                        >
                          Cancel / Back to Review
                        </button>
                        <button
                          type="button"
                          disabled={!rejectionReason.trim()}
                          onClick={() => setConfirmStep('REJECT_CONFIRM')}
                          className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs rounded-xl shadow-xs transition disabled:opacity-40"
                        >
                          Proceed to Confirmation →
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Step 4: Rejection Confirmation */}
                  {confirmStep === 'REJECT_CONFIRM' && (
                    <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 space-y-3 animate-in fade-in duration-150">
                      <p className="font-bold text-rose-900 text-xs flex items-center gap-1.5">
                        <span>⚠️</span> Explicit Rejection Confirmation:
                      </p>
                      <p className="text-rose-800 leading-relaxed text-xs">
                        Are you sure you want to reject <strong className="text-rose-950 font-bold">{selectedRequest.entityName}</strong>? The entity will remain unapproved, and the submitting Super Admin will receive your rejection reason:
                      </p>
                      <p className="p-2.5 rounded-lg bg-white border border-rose-200 text-rose-900 italic text-xs">
                        &quot;{rejectionReason}&quot;
                      </p>
                      <div className="flex justify-end gap-2 pt-2">
                        <button
                          type="button"
                          onClick={() => setConfirmStep('REJECT_INPUT')}
                          className="px-4 py-2 border border-slate-300 bg-white text-slate-700 font-semibold text-xs rounded-xl hover:bg-slate-50 transition"
                        >
                          Back to Edit Reason
                        </button>
                        <button
                          type="button"
                          disabled={submittingDecision}
                          onClick={() => handleDecisionSubmit('REJECT')}
                          className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs rounded-xl shadow-xs transition disabled:opacity-50"
                        >
                          {submittingDecision ? 'Rejecting...' : 'Yes, Confirm Rejection'}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Modal Bottom Bar */}
            <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-100 flex items-center justify-between shrink-0">
              <span className="text-[11px] text-slate-400">
                Hawassa MESOB Central Governance & Approval Verification
              </span>
              <div className="flex items-center gap-2">
                {!isManagerView && selectedRequest.status === 'REJECTED' && (
                  <button
                    type="button"
                    onClick={() => {
                      setDecisionModalOpen(false);
                      openResubmitModal(selectedRequest);
                    }}
                    className="px-4 py-2 bg-amber-50 text-amber-800 border border-amber-300 hover:bg-amber-100 font-semibold text-xs rounded-xl transition"
                  >
                    Resubmit Request
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setDecisionModalOpen(false)}
                  className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 font-semibold text-xs rounded-xl transition"
                >
                  Close Inspection
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ───────────────────────────────────────────────────────────── */}
      {/* ENLARGED LOGO LIGHTBOX MODAL */}
      {/* ───────────────────────────────────────────────────────────── */}
      {enlargeLogoOpen && selectedRequest && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-lg w-full p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h4 className="font-bold text-slate-900 text-sm">{selectedRequest.entityName}</h4>
                <p className="text-xs text-slate-500">Official Institution Logo Inspection</p>
              </div>
              <button
                onClick={() => setEnlargeLogoOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                ✕
              </button>
            </div>

            <div className="flex items-center justify-center p-6 bg-slate-50 rounded-xl border border-slate-200">
              <img
                src={selectedRequest.logoUrl || selectedRequest.details?.logoUrl}
                alt={`${selectedRequest.entityName} logo enlarged`}
                className="max-h-72 max-w-full object-contain drop-shadow-md"
              />
            </div>

            <div className="space-y-1 text-xs">
              <span className="font-semibold text-slate-700">Storage Reference / URL:</span>
              <p className="font-mono text-[11px] text-slate-600 p-2 bg-slate-100 rounded-lg break-all select-all">
                {selectedRequest.logoUrl || selectedRequest.details?.logoUrl}
              </p>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setEnlargeLogoOpen(false)}
                className="px-4 py-2 bg-[#314ea1] hover:bg-[#1e3a8a] text-white font-semibold text-xs rounded-xl transition"
              >
                Done Inspecting
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ───────────────────────────────────────────────────────────── */}
      {/* DETAILS & AUDIT HISTORY MODAL */}
      {/* ───────────────────────────────────────────────────────────── */}
      {historyModalOpen && selectedRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-xl p-6 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="font-bold text-slate-900 text-base">{selectedRequest.entityName}</h3>
                <p className="text-xs text-slate-500">Approval Request Details & History</p>
              </div>
              <button
                onClick={() => setHistoryModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                ✕
              </button>
            </div>

            <div className="my-4 max-h-[400px] overflow-y-auto space-y-4 pr-1">
              {/* Rejection Alert if rejected */}
              {selectedRequest.status === 'REJECTED' && (
                <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-xs">
                  <p className="font-bold text-rose-800 mb-1">Rejection Reason:</p>
                  <p className="text-rose-900 leading-relaxed font-medium">
                    {selectedRequest.rejectionReason || 'No detailed reason provided.'}
                  </p>
                  <p className="text-[10px] text-rose-600 mt-2">
                    Reviewed by {selectedRequest.reviewedBy?.name} on {formatDateTime(selectedRequest.reviewedAt)}
                  </p>
                </div>
              )}

              {/* General Details */}
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5 text-xs">
                <p className="font-bold text-slate-800 uppercase tracking-wider text-[10px] mb-2">Request Metadata</p>
                <div className="flex justify-between">
                  <span className="text-slate-500">Status:</span>
                  <span className="font-bold">{selectedRequest.status}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Submitting Admin:</span>
                  <span className="text-slate-800">{selectedRequest.submittingAdmin?.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Submitted At:</span>
                  <span className="text-slate-800">{formatDateTime(selectedRequest.submittedAt)}</span>
                </div>
                {selectedRequest.reviewedBy && (
                  <div className="flex justify-between">
                    <span className="text-slate-500">Reviewed By:</span>
                    <span className="text-slate-800">{selectedRequest.reviewedBy.name}</span>
                  </div>
                )}
              </div>

              {/* Audit History Timeline */}
              <div>
                <p className="font-bold text-slate-800 text-xs mb-3">Decision History</p>
                {selectedRequest.history?.length > 0 ? (
                  <div className="space-y-3 relative border-l-2 border-slate-200 ml-2 pl-4">
                    {selectedRequest.history.map((h, i) => (
                      <div key={i} className="relative">
                        <span className="absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full bg-[#314ea1] ring-4 ring-white" />
                        <p className="text-xs font-bold text-slate-800">
                          {h.action} <span className="font-normal text-slate-500 text-[11px]">by {h.by_name || 'Admin'}</span>
                        </p>
                        <p className="text-[10px] text-slate-400">{formatDateTime(h.timestamp)}</p>
                        {h.reason && <p className="text-xs text-rose-700 mt-0.5">Reason: {h.reason}</p>}
                        {h.notes && <p className="text-xs text-slate-600 mt-0.5">{h.notes}</p>}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-400">No previous review cycles recorded.</p>
                )}
              </div>
            </div>

            <div className="flex justify-end pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setHistoryModalOpen(false)}
                className="px-4 py-2 bg-slate-100 text-slate-700 font-semibold text-xs rounded-xl hover:bg-slate-200 transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ───────────────────────────────────────────────────────────── */}
      {/* RESUBMIT MODAL (Super Admin) */}
      {/* ───────────────────────────────────────────────────────────── */}
      {resubmitModalOpen && selectedRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-xl p-6 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="font-bold text-slate-900 text-base">Resubmit Request for Approval</h3>
                <p className="text-xs text-slate-500">Correct deficiencies and resubmit to Mesob Manager</p>
              </div>
              <button
                onClick={() => setResubmitModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                ✕
              </button>
            </div>

            {/* Prior Rejection Reason Reminder */}
            <div className="my-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs">
              <p className="font-bold text-rose-800 mb-0.5">Prior Rejection Reason:</p>
              <p className="text-rose-900">{selectedRequest.rejectionReason || 'Requirements not fulfilled.'}</p>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Name</label>
                <input
                  type="text"
                  value={resubmitData.name || resubmitData.fullName || ''}
                  onChange={(e) => setResubmitData(prev => ({ ...prev, name: e.target.value, fullName: e.target.value }))}
                  className="w-full p-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-[#314ea1]/20"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Phone</label>
                <input
                  type="text"
                  value={resubmitData.phone || ''}
                  onChange={(e) => setResubmitData(prev => ({ ...prev, phone: e.target.value }))}
                  className="w-full p-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-[#314ea1]/20"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Resubmission Explanation Notes</label>
                <textarea
                  rows="2"
                  value={resubmitNotes}
                  onChange={(e) => setResubmitNotes(e.target.value)}
                  placeholder="Explain what was updated or attached to address the manager's review comments..."
                  className="w-full p-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-[#314ea1]/20"
                />
              </div>
            </div>

            <div className="mt-5 flex justify-end gap-3 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setResubmitModalOpen(false)}
                className="px-4 py-2 border border-slate-300 text-slate-700 font-semibold text-xs rounded-xl hover:bg-slate-50 transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleResubmit}
                disabled={submittingResubmit}
                className="px-5 py-2 bg-[#314ea1] hover:bg-[#1e3a8a] text-white font-semibold text-xs rounded-xl shadow-xs transition disabled:opacity-50"
              >
                {submittingResubmit ? 'Submitting...' : 'Submit to Mesob Manager'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
