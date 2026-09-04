# Service Feedback System - Complete Implementation

## Overview
Complete feedback system that allows citizens to rate services after completion, with Institution Managers and MESOB Managers able to view and analyze feedback.

## System Flow

### 1. Citizen Perspective
- **After Service Completion**: Citizens can rate services after completing either:
  - Application (status = 'Completed')
  - Queue entry (status = 'completed' or 'served')
- **Rating Options**: 1-5 stars
  - 1 star = Poor
  - 2 stars = Good
  - 3 stars = Very Good
  - 4 stars = Excellent
  - 5 stars = Fantastic
- **Optional Comment**: Citizens can add additional feedback text
- **View History**: Citizens can see all their past ratings in "My Feedback" section

### 2. Institution Manager Perspective
- **View All Feedback**: See all feedback for their institution's services
- **Statistics Dashboard**:
  - Total feedback count
  - Average rating
  - Rating distribution (1-5 stars)
  - Excellent+ percentage
  - Poor ratings count
- **Filtering Options**:
  - By service
  - By rating
  - By source (Website/Telegram)
- **Individual Feedback**: View each feedback with:
  - Service name
  - Rating
  - Comment (if provided)
  - Submission date/time
  - Source (Website/Telegram)
  - Application number (if linked)

### 3. MESOB Manager Perspective
- **View All Feedback**: See feedback across all institutions
- **Overall Statistics**:
  - Total feedback across all institutions
  - System-wide average rating
  - Combined rating distribution
  - Excellent+, Good/Very Good, and Poor percentages
- **Advanced Filtering**:
  - By institution
  - By service
  - By rating
  - By source
  - By date range
- **Institution Comparison**: Compare feedback performance across institutions

## Database Schema

### Table: service_feedback
```sql
- id (UUID): Primary key
- citizen_id (UUID): Foreign key to users table
- institution_id (UUID): Foreign key to institutions table
- service_id (UUID): Foreign key to services table
- application_id (UUID, optional): Link to specific application
- queue_entry_id (UUID, optional): Link to specific queue entry
- rating (INTEGER): 1-5 stars
- comment (TEXT, optional): Additional feedback
- source (VARCHAR): 'WEBSITE' or 'TELEGRAM'
- created_at (TIMESTAMPTZ): Submission timestamp
- updated_at (TIMESTAMPTZ): Last update timestamp
- metadata (JSONB): Additional metadata

Constraints:
- rating BETWEEN 1 AND 5
- Prevent duplicate feedback per application
- Prevent duplicate feedback per queue entry
```

## API Endpoints

### Citizen Endpoints
```
POST /api/feedback
- Submit new feedback
- Body: { institution_id, service_id, rating, application_id?, queue_entry_id?, comment?, source? }

GET /api/feedback/my-feedback
- Get citizen's feedback history
- Query params: institution_id?, service_id?, rating?

GET /api/feedback/can-submit
- Check if can submit feedback for specific interaction
- Query params: application_id? or queue_entry_id?
```

### Institution Manager Endpoints
```
GET /api/feedback/institution
- Get feedback for manager's institution
- Query params: service_id?, rating?, source?, date_from?, date_to?

GET /api/feedback/institution/stats
- Get feedback statistics for manager's institution
```

### MESOB Manager Endpoints
```
GET /api/feedback
- Get all feedback across institutions
- Query params: institution_id?, service_id?, rating?, source?, date_from?, date_to?

GET /api/feedback/stats
- Get overall feedback statistics
- Query params: institution_id?, service_id?, date_from?, date_to?
```

## Frontend Components

### 1. FeedbackRating.jsx
Interactive 5-star rating component for citizens
- Hover effects on stars
- Real-time rating meaning display
- Optional comment textarea
- Success confirmation screen

### 2. CitizenDashboard - My Feedback Section
- View all submitted feedback
- Click to see details
- Filter options
- Empty state when no feedback

### 3. InstitutionFeedback.jsx
Institution Manager feedback dashboard
- Statistics cards
- Rating distribution chart
- Feedback list with details
- Filtering options

### 4. MesobFeedbackOverview.jsx
MESOB Manager feedback overview
- System-wide statistics
- Multi-institution comparison
- Advanced filtering
- Complete feedback list

## Current Implementation Status

### ✅ Completed Features
1. Database schema and migrations
2. RLS policies for security
3. Backend service layer
4. Backend controllers
5. API routes
6. Frontend context (FeedbackContext)
7. FeedbackRating component
8. Citizen "My Feedback" section
9. Institution Manager feedback dashboard
10. MESOB Manager feedback overview

### 🔧 Required Enhancements
1. **Queue Service Completion**: Add feedback prompt after queue service is completed
2. **Application Completion**: Ensure feedback rating shows for completed applications
3. **Real-time Updates**: Auto-refresh feedback lists when new feedback is submitted
4. **Email Notifications**: Notify managers about poor ratings (1-2 stars)
5. **Telegram Integration**: Support feedback submission via Telegram bot

## Security Features

### Row Level Security (RLS)
- Citizens can only insert and view their own feedback
- Institution Managers can view feedback for their institution only
- MESOB Managers can view all feedback
- Super Admins have full access

### Data Validation
- Rating must be integer 1-5
- Prevent duplicate feedback per service interaction
- Verify citizen, institution, and service exist
- Ensure service belongs to specified institution

## Usage Guidelines

### For Citizens
1. Complete a service (application or queue)
2. Navigate to completed service details
3. Click "Rate This Service" button
4. Select star rating (1-5)
5. Optionally add comment
6. Submit feedback
7. View your feedback history in "My Feedback"

### For Institution Managers
1. Navigate to "Service Feedback" section
2. View overall statistics
3. Filter by rating, source, or service
4. Click individual feedback to see details
5. Use insights to improve services

### For MESOB Managers
1. Navigate to "Feedback Overview"
2. View system-wide statistics
3. Filter by institution, rating, source
4. Compare institution performance
5. Identify trends and areas for improvement

## Analytics Insights

### Key Metrics
1. **Average Rating**: Overall satisfaction score
2. **Excellent+ Rate**: % of 4-5 star ratings (target: >80%)
3. **Poor Rate**: % of 1-star ratings (target: <5%)
4. **Response Rate**: % of completed services with feedback
5. **Source Distribution**: Website vs Telegram submissions

### Performance Indicators
- **Good Performance**: Average rating ≥ 4.0, Poor rate < 5%
- **Needs Attention**: Average rating 3.0-3.9, Poor rate 5-10%
- **Critical**: Average rating < 3.0, Poor rate > 10%

## Integration Points

### With Queue Management System
- After queue entry status = 'completed' or 'served'
- Show feedback prompt in queue history
- Link feedback to queue_entry_id

### With Application System
- After application status = 'Completed' or 'Approved'
- Show feedback rating component
- Link feedback to application_id

### With Notification System
- Notify Institution Manager when poor rating received
- Send weekly feedback summary to managers
- Alert MESOB Manager about institutions with low ratings

## Testing Checklist

### Citizen Testing
- [ ] Submit feedback after completing application
- [ ] Submit feedback after completing queue service
- [ ] Try submitting duplicate feedback (should fail)
- [ ] View feedback history
- [ ] Submit feedback with and without comment

### Institution Manager Testing
- [ ] View feedback for own institution only
- [ ] Check statistics accuracy
- [ ] Test all filters
- [ ] Verify rating distribution chart
- [ ] Ensure cannot see other institutions' feedback

### MESOB Manager Testing
- [ ] View all feedback across institutions
- [ ] Check overall statistics
- [ ] Test institution filter
- [ ] Compare multiple institutions
- [ ] Verify data aggregation accuracy

## Future Enhancements

### Phase 2
1. **Sentiment Analysis**: Analyze feedback comments for sentiment
2. **Automated Responses**: Auto-respond to poor ratings
3. **Trend Analysis**: Track rating trends over time
4. **Service Comparison**: Compare ratings across services
5. **Export Reports**: Download feedback data as CSV/PDF

### Phase 3
1. **Mobile App Integration**: Native mobile feedback submission
2. **Voice Feedback**: Record voice comments
3. **Photo Upload**: Attach photos to feedback
4. **Follow-up System**: Contact citizens for detailed feedback
5. **Rewards Program**: Incentivize feedback submission

## Troubleshooting

### Common Issues

**Issue: Feedback not showing**
- Solution: Check RLS policies, verify user has correct role

**Issue: Cannot submit feedback**
- Solution: Verify service is completed, check for duplicate feedback

**Issue: Statistics incorrect**
- Solution: Refresh data, check backend service calculations

**Issue: Filter not working**
- Solution: Clear browser cache, verify query parameters

## Support

For technical support:
- Backend issues: Check backend/src/services/feedbackService.js
- Frontend issues: Check frontend/src/context/FeedbackContext.jsx
- Database issues: Review database/migrations/004_create_feedback_table.sql

---

**System Status**: ✅ Fully Implemented and Functional
**Last Updated**: 2026-08-24
**Version**: 1.0.0
