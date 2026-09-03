import { useState } from 'react';
import { useFeedback } from '../../context/FeedbackContext';

/**
 * FeedbackRating Component
 * 5-star rating UI for citizen service feedback
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
  const { submitFeedback, getRatingMeaning } = useFeedback();
  const [selectedRating, setSelectedRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [submittedRating, setSubmittedRating] = useState(0);
  const [error, setError] = useState('');

  const ratings = [
    { value: 1, label: 'Poor' },
    { value: 2, label: 'Good' },
    { value: 3, label: 'Very Good' },
    { value: 4, label: 'Excellent' },
    { value: 5, label: 'Fantastic' }
  ];

  const handleSubmit = async () => {
    if (selectedRating === 0) {
      setError('Please select a rating');
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
      setError(result.message || 'Failed to submit feedback');
    }
  };

  if (isSuccess) {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 text-center">
        <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h3 className="text-xl font-semibold text-gray-900 mb-2">Thank You!</h3>
        <p className="text-gray-600 mb-4">
          You rated our service <strong>{submittedRating}/5 Stars</strong>. Your feedback helps us improve!
        </p>
        <div className="flex gap-2 justify-center text-yellow-400 text-2xl mb-4">
          {[1, 2, 3, 4, 5].map(star => (
            <span key={star}>
              {star <= submittedRating ? '⭐' : '☆'}
            </span>
          ))}
        </div>
        <button
          onClick={onCancel || (() => setIsSuccess(false))}
          className="px-6 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition"
        >
          Close
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-2">Rate Your Experience</h3>
      <p className="text-sm text-gray-600 mb-1">{serviceName}</p>
      <p className="text-xs text-gray-500 mb-6">{institutionName}</p>

      {/* Rating Question */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-3">
          How satisfied are you with this service?
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
              className="text-4xl transition-all transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-blue-400 rounded disabled:opacity-50"
            >
              {star <= (hoveredRating || selectedRating) ? (
                <span className="text-yellow-400">⭐</span>
              ) : (
                <span className="text-gray-300">☆</span>
              )}
            </button>
          ))}
        </div>

        {/* Rating Labels */}
        {(selectedRating > 0 || hoveredRating > 0) && (
          <div className="text-center">
            <span className="inline-block px-4 py-2 bg-blue-50 text-blue-700 rounded-lg font-medium text-sm">
              ⭐ {hoveredRating || selectedRating}/5 — {getRatingMeaning(hoveredRating || selectedRating)}
            </span>
          </div>
        )}

        {/* All Rating Meanings */}
        <div className="mt-4 grid grid-cols-5 gap-2 text-xs text-center text-gray-500">
          {ratings.map(({ value, label }) => (
            <div key={value} className={selectedRating === value ? 'font-semibold text-blue-600' : ''}>
              <div>{value}★</div>
              <div>{label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Optional Comment */}
      <div className="mb-6">
        <label htmlFor="feedback-comment" className="block text-sm font-medium text-gray-700 mb-2">
          Additional Comments (Optional)
        </label>
        <textarea
          id="feedback-comment"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          disabled={isSubmitting}
          rows={3}
          className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-400 outline-none transition text-sm disabled:bg-gray-50 disabled:cursor-not-allowed"
          placeholder="Tell us more about your experience (optional)"
        />
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex gap-3">
        <button
          onClick={handleSubmit}
          disabled={isSubmitting || selectedRating === 0}
          className="flex-1 px-6 py-2.5 bg-[#1e3a8a] hover:bg-[#1e40af] text-white text-sm font-semibold rounded-xl transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? 'Submitting...' : 'Submit Rating'}
        </button>
        {onCancel && (
          <button
            onClick={onCancel}
            disabled={isSubmitting}
            className="px-6 py-2.5 border border-gray-300 text-gray-700 text-sm font-medium rounded-xl hover:bg-gray-50 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
        )}
      </div>

      {/* Info Note */}
      <p className="mt-4 text-xs text-gray-500 text-center">
        Your feedback is anonymous and helps improve our services
      </p>
    </div>
  );
}
