import { useState } from 'react';
import { useFeedback } from '../../context/FeedbackContext';
import { useApp } from '../../context/AppContext';

/**
 * FeedbackRating Component
 * 5-star rating UI for customer service feedback
 */
export default function FeedbackRating({ 
  institutionId, 
  serviceId, 
  institutionName, 
  serviceName,
  applicationId = null,
  queueEntryId = null,
  onSuccess = null,
  onCancel = null
}) {
  const { t, lang } = useApp();
  const { submitFeedback, getRatingMeaning } = useFeedback();
  const [selectedRating, setSelectedRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [submittedRating, setSubmittedRating] = useState(0);
  const [error, setError] = useState('');

  // Validate that required IDs are present
  const hasValidIds = institutionId && serviceId;

  const ratings = [
    { value: 1, label: t.poor || 'Poor' },
    { value: 2, label: t.good || 'Good' },
    { value: 3, label: t.very_good || 'Very Good' },
    { value: 4, label: t.excellent || 'Excellent' },
    { value: 5, label: t.fantastic || 'Fantastic' }
  ];

  function getRatingLabel(val) {
    switch (val) {
      case 1: return t.poor || 'Poor';
      case 2: return t.good || 'Good';
      case 3: return t.very_good || 'Very Good';
      case 4: return t.excellent || 'Excellent';
      case 5: return t.fantastic || 'Fantastic';
      default: return getRatingMeaning(val);
    }
  }

  // If IDs are not valid, show error state
  if (!hasValidIds) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-center">
        <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-red-900 mb-2">{t.cannot_submit_feedback || 'Cannot Submit Feedback'}</h3>
        <p className="text-sm text-red-700 mb-4">
          {t.cannot_submit_feedback_desc || 'This application is missing required service or institution information. Feedback can only be submitted for applications with valid service details.'}
        </p>
        {onCancel && (
          <button
            onClick={onCancel}
            className="px-6 py-2.5 text-sm font-medium text-red-700 bg-red-100 hover:bg-red-200 rounded-xl transition cursor-pointer"
          >
            {t.close || 'Close'}
          </button>
        )}
      </div>
    );
  }

  const handleSubmit = async () => {
    // Debug: Log received props
    console.log("=== FEEDBACK PROPS ===");
    console.log("institutionId:", institutionId);
    console.log("serviceId:", serviceId);
    console.log("institutionName:", institutionName);
    console.log("serviceName:", serviceName);
    console.log("applicationId:", applicationId);
    console.log("=====================");

    // Validate IDs before proceeding
    if (!institutionId || !serviceId) {
      console.error("=== MISSING IDS ===");
      console.error("institutionId:", institutionId);
      console.error("serviceId:", serviceId);
      console.error("institutionName:", institutionName);
      console.error("serviceName:", serviceName);
      console.error("===================");
      setError(`Missing required IDs: Institution=${institutionId || "NULL"}, Service=${serviceId || "NULL"}`);
      return;
    }

    if (selectedRating === 0) {
      setError(lang === 'am' ? 'እባክዎ ደረጃ ይምረጡ' : 'Please select a rating');
      return;
    }

    setIsSubmitting(true);
    setError('');

    const feedbackData = {
      institution_id: institutionId,
      service_id: serviceId,
      rating: selectedRating,
      comment: comment.trim() || null,
      application_id: applicationId,
      queue_entry_id: queueEntryId,
      source: 'WEBSITE'
    };

    const result = await submitFeedback(feedbackData);

    setIsSubmitting(false);

    if (result.success) {
      setIsSuccess(true);
      setSubmittedRating(selectedRating);
      if (onSuccess) {
        setTimeout(() => onSuccess(), 2000);
      }
    } else {
      setError(result.message || (lang === 'am' ? 'አስተያየት ማስገባት አልተሳካም' : 'Failed to submit feedback'));
    }
  };

  if (isSuccess) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-8 text-center">
        <div className="w-16 h-16 bg-emerald-50 text-emerald-600 border border-emerald-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h3 className="text-xl font-bold text-slate-900 mb-2">{t.feedback_thank_you || 'Thank You!'}</h3>
        <p className="text-slate-600 mb-4 text-sm">
          {lang === 'am' 
            ? <>አገልግሎታችንን <strong>{submittedRating}/5 ኮከብ</strong> ገምግመዋል። አስተያየትዎ የመንግስት አገልግሎቶችን ለማሻሻል ያግዛል!</>
            : <>You rated our service <strong>{submittedRating}/5 Stars</strong>. Your feedback helps us improve government services!</>
          }
        </p>
        <div className="flex gap-2 justify-center text-[#f4b51a] text-2xl mb-5">
          {[1, 2, 3, 4, 5].map(star => (
            <span key={star}>
              {star <= submittedRating ? '⭐' : '☆'}
            </span>
          ))}
        </div>
        <button
          onClick={onCancel || (() => setIsSuccess(false))}
          className="px-6 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-[#314ea1] to-[#1e3a8a] hover:from-[#253d82] hover:to-[#172554] rounded-xl shadow-xs transition cursor-pointer"
        >
          {t.close || 'Close'}
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs p-6">
      <h3 className="text-lg font-bold text-slate-900 mb-1">{t.rate_your_experience || 'Rate Your Experience'}</h3>
      <p className="text-sm font-semibold text-[#1e3a8a] mb-0.5">{serviceName}</p>
      <p className="text-xs text-slate-500 mb-6">{institutionName}</p>

      {/* Rating Question */}
      <div className="mb-6">
        <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wide mb-3">
          {t.feedback_satisfied_question || 'How satisfied are you with this service?'}
        </label>

        {/* Star Rating */}
        <div className="flex items-center gap-2 mb-4">
          {[1, 2, 3, 4, 5].map(star => (
            <button
              key={star}
              onClick={() => setSelectedRating(star)}
              onMouseEnter={() => setHoveredRating(star)}
              onMouseLeave={() => setHoveredRating(0)}
              disabled={isSubmitting}
              className="text-4xl transition-all transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-[#314ea1]/20 rounded disabled:opacity-50 cursor-pointer"
            >
              {star <= (hoveredRating || selectedRating) ? (
                <span className="text-[#f4b51a]">⭐</span>
              ) : (
                <span className="text-slate-300">☆</span>
              )}
            </button>
          ))}
        </div>

        {/* Rating Labels */}
        {(selectedRating > 0 || hoveredRating > 0) && (
          <div className="text-center">
            <span className="inline-block px-4 py-2 bg-amber-50 text-amber-900 border border-amber-200/80 rounded-xl font-bold text-sm shadow-2xs">
              ⭐ {hoveredRating || selectedRating}/5 — {getRatingLabel(hoveredRating || selectedRating)}
            </span>
          </div>
        )}

        {/* All Rating Meanings */}
        <div className="mt-4 grid grid-cols-5 gap-2 text-xs text-center text-slate-500">
          {ratings.map(({ value, label }) => (
            <div key={value} className={selectedRating === value ? 'font-bold text-[#314ea1]' : ''}>
              <div>{value}★</div>
              <div>{label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Optional Comment */}
      <div className="mb-6">
        <label htmlFor="feedback-comment" className="block text-xs font-semibold text-slate-700 uppercase tracking-wide mb-2">
          {t.additional_comments || 'Additional Comments (Optional)'}
        </label>
        <textarea
          id="feedback-comment"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          disabled={isSubmitting}
          rows={3}
          className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-[#314ea1]/20 focus:border-[#314ea1] outline-none transition text-sm disabled:bg-slate-50 disabled:cursor-not-allowed"
          placeholder={t.write_feedback_placeholder || 'Tell us more about your experience (optional)'}
        />
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-xl text-sm text-rose-700">
          {error}
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex gap-3">
        <button
          onClick={handleSubmit}
          disabled={isSubmitting || selectedRating === 0}
          className="flex-1 px-6 py-3 bg-gradient-to-r from-[#314ea1] to-[#1e3a8a] hover:from-[#253d82] hover:to-[#172554] text-white text-sm font-semibold rounded-xl shadow-xs transition disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
        >
          {isSubmitting ? (t.submitting || 'Submitting...') : (t.submit_rating || 'Submit Rating')}
        </button>
        {onCancel && (
          <button
            onClick={onCancel}
            disabled={isSubmitting}
            className="px-6 py-3 bg-slate-100 text-slate-700 text-sm font-medium rounded-xl hover:bg-slate-200 transition disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            {t.cancel || 'Cancel'}
          </button>
        )}
      </div>

      {/* Info Note */}
      <p className="mt-4 text-xs text-gray-500 text-center">
        {t.feedback_anonymous_note || 'Your feedback is anonymous and helps improve our services'}
      </p>
    </div>
  );
}
