# Implementation Plan: Internship Report Generation System

## Overview

This implementation plan breaks down the Internship Report Generation System into discrete coding tasks. The system enables students to automatically generate comprehensive, professionally-formatted internship reports by extracting their activity data from the MESOB system and combining it with user-provided contextual information. The output includes PDF and DOCX exports following academic report structures.

The implementation follows a progressive approach: database schema → backend services → API endpoints → frontend components → integration and testing.

## Tasks

- [ ] 1. Set up database schema and migrations
  - [ ] 1.1 Create database migration for report_drafts and report_metadata tables
    - Create migration file `backend/database/migrations/005_add_internship_reports.sql`
    - Define `report_drafts` table with fields: id, user_id, title, status, data (JSONB), created_at, updated_at
    - Define `report_metadata` table with fields: id, user_id, institution_id, period_start, period_end, exported_at, format, file_size, statistics (JSONB), created_at
    - Add indexes for performance: idx_report_drafts_user_id, idx_report_drafts_status, idx_report_metadata_user_id, idx_report_metadata_institution_id, idx_report_metadata_period
    - Add foreign key constraints and RLS policies
    - _Requirements: 11.1, 11.2, 12.1, 13.1_

  - [ ]* 1.2 Write unit tests for database schema constraints
    - Test foreign key constraints prevent orphaned records
    - Test unique constraint on user_id + title in report_drafts
    - Test JSONB field validation
    - _Requirements: 11.2_

- [ ] 2. Implement data repositories for activity querying
  - [ ] 2.1 Create ReportDraftRepository for draft CRUD operations
    - Create `backend/src/repositories/reportDraftRepository.js`
    - Implement saveDraft(userId, title, data) method
    - Implement getDraft(userId, draftId) method
    - Implement listDrafts(userId, status) method
    - Implement updateDraftStatus(draftId, status) method
    - _Requirements: 11.1, 11.2, 11.3, 11.4, 11.5_

  - [ ] 2.2 Create ReportMetadataRepository for tracking exports
    - Create `backend/src/repositories/reportMetadataRepository.js`
    - Implement saveMetadata(userId, institutionId, reportConfig, format, statistics) method
    - Implement getMetadataByPeriod(period, institutionId) method
    - Implement getMetadataByUser(userId) method
    - _Requirements: 12.1, 12.2, 12.3, 13.1_

  - [ ] 2.3 Extend existing repositories with date-range activity queries
    - Modify `backend/src/repositories/applicationRepository.js` to add findByUserAndDateRange(userId, startDate, endDate, institutionId) method
    - Modify `backend/src/repositories/queueRepository.js` to add findByUserAndDateRange method
    - Create `backend/src/repositories/maintenanceRepository.js` if not exists and add findByUserAndDateRange method
    - _Requirements: 3.1, 3.2, 3.3_

  - [ ]* 2.4 Write unit tests for repository methods
    - Test draft save and load round-trip
    - Test date-range filtering accuracy
    - Test institution-scoped queries
    - _Requirements: 3.1, 3.2, 3.3, 11.4_

- [ ] 3. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 4. Implement report generation service layer
  - [ ] 4.1 Create ReportService with validation logic
    - Create `backend/src/services/reportService.js`
    - Implement validateReportConfig(config) method with all validation rules
    - Implement getActivitiesSummary(userId, startDate, endDate, institutionId) method
    - Implement queryUserActivities(userId, startDate, endDate, institutionId) method
    - Implement aggregateStatistics(applications, queueEntries, maintenanceTasks) helper methods
    - _Requirements: 2.2, 2.3, 3.1, 3.2, 3.3, 3.4, 3.5_

  - [ ]* 4.2 Write property test for date range validation (Property 2)
    - **Property 2: Date range validation**
    - **Validates: Requirements 2.2**
    - Test that validation returns error if and only if end date is not after start date
    - Use property-based testing with various date combinations

  - [ ] 4.3 Implement report document generation methods
    - Add generateReportDocument(userId, reportConfig) method to ReportService
    - Implement generateCoverPage(user, institution, config) helper
    - Implement generateTableOfContents() helper
    - Implement generateIntroductionChapter(config) helper
    - Implement generateOrganizationChapter(institution) helper
    - Implement generateActivitiesChapter(activities, institution) helper
    - Implement generateLearningOutcomesChapter(customOutcomes, activities) helper
    - Implement generateChallengesChapter(customChallenges) helper
    - Implement generateConclusionChapter(activities) helper
    - Implement generateRecommendationsChapter(customRecommendations) helper
    - _Requirements: 4.1, 4.2, 4.3, 5.1, 5.2, 5.3, 5.4, 6.1, 6.2, 6.3, 7.1, 7.3, 7.4, 8.2, 8.3, 8.4_

  - [ ]* 4.4 Write property test for required report structure (Property 6)
    - **Property 6: Required report structure completeness**
    - **Validates: Requirements 4.1, 4.2, 4.3**
    - Test that generated report contains all required structural elements
    - Verify cover page, table of contents, and exactly seven chapters in correct order

  - [ ]* 4.5 Write property test for organization chapter content (Property 8)
    - **Property 8: Organization chapter required content**
    - **Validates: Requirements 5.1, 5.2, 5.3, 5.4**
    - Test that organization chapter includes mission, vision, structure, 12 institutions, and service descriptions

  - [ ]* 4.6 Write property test for user content preservation (Property 10)
    - **Property 10: User content preservation**
    - **Validates: Requirements 7.3, 8.2, 8.3**
    - Test that custom learning outcomes, challenges, and recommendations are preserved without modification

  - [ ]* 4.7 Write property test for template fallback generation (Property 11)
    - **Property 11: Template fallback generation**
    - **Validates: Requirements 7.4, 8.4**
    - Test that template content is generated when custom content is not provided

  - [ ] 4.8 Implement draft save and load methods
    - Add saveDraft(userId, title, data) method to ReportService
    - Add getDraft(userId, draftId) method to ReportService
    - Add listDrafts(userId, status) method to ReportService
    - _Requirements: 11.1, 11.2, 11.3, 11.4_

  - [ ]* 4.9 Write property test for draft round-trip (Property 16)
    - **Property 16: Draft save and load round-trip**
    - **Validates: Requirements 11.2, 11.4**
    - Test that saved draft data is identical when loaded back

  - [ ] 4.10 Implement report metadata tracking
    - Add saveReportMetadata(userId, reportConfig, format) method to ReportService
    - Add getReportMetadata(period, institutionId) method for manager dashboards
    - _Requirements: 12.1, 12.2, 12.3, 13.1, 13.2_

- [ ] 5. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 6. Implement document rendering service
  - [ ] 6.1 Install required PDF and DOCX generation libraries
    - Add `pdfkit` dependency to package.json
    - Add `docx` dependency to package.json
    - Run npm install to add dependencies
    - _Requirements: 9.1, 9.2, 9.3_

  - [ ] 6.2 Create DocumentRendererService with PDF generation
    - Create `backend/src/services/documentRenderer.js`
    - Implement renderPDF(document) method using PDFKit
    - Implement renderCoverPagePDF(doc, coverPage) helper
    - Implement renderTableOfContentsPDF(doc, toc) helper
    - Implement renderChapterPDF(doc, chapter, pageNumber) helper
    - Implement renderTablePDF(doc, table) helper for statistics tables
    - Implement addPageNumberPDF(doc, pageNumber) helper
    - _Requirements: 4.4, 4.5, 9.1, 9.2_

  - [ ]* 6.3 Write property test for page numbering (Property 7)
    - **Property 7: Page numbering correctness**
    - **Validates: Requirements 4.4**
    - Test that page numbers start at 2, are sequential, and appear on all pages except cover

  - [ ] 6.4 Implement DOCX generation methods
    - Add renderDOCX(document) method to DocumentRendererService using docx library
    - Implement generateCoverPageDOCX(coverPage) helper
    - Implement generateTableOfContentsDOCX(toc) helper
    - Implement generateChapterDOCX(chapter) helper
    - _Requirements: 9.1, 9.3_

  - [ ]* 6.5 Write property test for export format fidelity (Property 12)
    - **Property 12: Export format fidelity**
    - **Validates: Requirements 9.2, 9.3**
    - Test that exported files preserve all structural elements and formatting

  - [ ] 6.6 Implement filename generation utility
    - Create generateFilename(user, reportConfig, extension) function
    - Follow pattern: LastName_FirstName_Internship_Report_YYYY_MM_DD.ext
    - _Requirements: 9.4_

  - [ ]* 6.7 Write property test for filename pattern (Property 13)
    - **Property 13: Export filename pattern compliance**
    - **Validates: Requirements 9.4**
    - Test that generated filenames match the required pattern

- [ ] 7. Implement report controller endpoints
  - [ ] 7.1 Create ReportController with draft endpoints
    - Create `backend/src/controllers/reportController.js`
    - Implement saveDraft(req, res) endpoint handler
    - Implement listDrafts(req, res) endpoint handler
    - Implement getDraft(req, res) endpoint handler with authorization check
    - Add proper error handling and validation
    - _Requirements: 11.1, 11.2, 11.3, 11.4_

  - [ ] 7.2 Implement report generation and preview endpoints
    - Add getActivitiesSummary(req, res) endpoint for form validation
    - Add generateReport(req, res) endpoint for preview generation
    - Add proper validation using ReportService.validateReportConfig
    - _Requirements: 2.5, 10.1, 10.2_

  - [ ] 7.3 Implement export endpoint
    - Add exportReport(req, res) endpoint
    - Support both PDF and DOCX format parameter
    - Set proper Content-Type and Content-Disposition headers
    - Save metadata after successful export
    - Implement error handling with data preservation
    - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5_

  - [ ]* 7.4 Write property test for export error data preservation (Property 14)
    - **Property 14: Export error data preservation**
    - **Validates: Requirements 9.5**
    - Test that user form data remains unchanged when export fails

  - [ ] 7.5 Implement manager dashboard metadata endpoints
    - Add getReportMetadata(req, res) endpoint with role-based filtering
    - Implement authorization for MESOB_MANAGER and INSTITUTION_MANAGER roles
    - Filter by institutionId for INSTITUTION_MANAGER users
    - _Requirements: 12.1, 12.2, 12.3, 12.4, 13.1, 13.2, 13.3_

  - [ ]* 7.6 Write property test for manager filtered visibility (Property 18)
    - **Property 18: Manager dashboard filtered visibility**
    - **Validates: Requirements 13.1**
    - Test that institution managers only see students from their institution

  - [ ]* 7.7 Write property test for institution-scoped statistics (Property 20)
    - **Property 20: Institution-scoped activity statistics**
    - **Validates: Requirements 13.3**
    - Test that activity statistics are filtered by institution for managers

- [ ] 8. Create API routes and middleware
  - [ ] 8.1 Create report routes configuration
    - Create `backend/src/routes/reportRoutes.js`
    - Define POST /api/reports/drafts route
    - Define GET /api/reports/drafts route
    - Define GET /api/reports/drafts/:draftId route
    - Define POST /api/reports/generate route
    - Define POST /api/reports/export route
    - Define GET /api/reports/activities route
    - Define GET /api/reports/metadata route
    - Add authentication middleware to all routes
    - Add role-based authorization middleware (CITIZEN for generation, managers for metadata)
    - _Requirements: 1.1, 9.1, 10.1, 11.1, 12.1_

  - [ ] 8.2 Register report routes in main server
    - Import reportRoutes in `backend/src/server.js`
    - Register routes with app.use('/api/reports', reportRoutes)
    - _Requirements: 1.1_

  - [ ]* 8.3 Write integration tests for API endpoints
    - Test authentication requirements
    - Test role-based authorization
    - Test request/response validation
    - Test error handling

- [ ] 9. Checkpoint - Ensure backend tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 10. Implement frontend report generation wizard
  - [ ] 10.1 Create ReportGenerationWizard page component
    - Create `frontend/src/pages/reports/ReportGenerationWizard.jsx`
    - Implement multi-step state management (4 steps: Info, Content, Preview, Export)
    - Implement form state for internshipPeriod, supervisor, institutionId, customContent
    - Implement validation state tracking
    - Add useEffect hook to load draft from URL params if present
    - Add useEffect hook to pre-populate user information
    - Add auto-save to draft every 30 seconds
    - _Requirements: 1.2, 10.4, 11.1, 11.3, 11.4_

  - [ ]* 10.2 Write unit tests for wizard state management
    - Test step navigation
    - Test form data updates
    - Test validation state
    - Test auto-save functionality

  - [ ] 10.3 Create InternshipInfoForm component (Step 1)
    - Create `frontend/src/components/reports/InternshipInfoForm.jsx`
    - Implement date range input fields with validation
    - Implement supervisor information fields (name, title, email, phone)
    - Implement institution selection dropdown
    - Display validation errors inline
    - Call activities summary API to validate date range has data
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_

  - [ ]* 10.4 Write property test for form completion detection (Property 3)
    - **Property 3: Form completion detection**
    - **Validates: Requirements 2.5**
    - Test that Generate Report button is enabled if and only if all required fields are valid

  - [ ] 10.5 Create CustomContentForm component (Step 2)
    - Create `frontend/src/components/reports/CustomContentForm.jsx`
    - Implement rich text editor for learning outcomes (using react-quill)
    - Implement rich text editor for challenges
    - Implement rich text editor for recommendations
    - Add add/remove entry buttons for multiple entries
    - Add character count display
    - _Requirements: 7.1, 7.2, 8.1_

  - [ ] 10.6 Create ReportPreview component (Step 3)
    - Create `frontend/src/components/reports/ReportPreview.jsx`
    - Render document structure as styled HTML
    - Implement scrollable preview with sticky chapter navigation
    - Add visual page break indicators
    - Implement chapter link navigation
    - Add "Back to Edit" button
    - _Requirements: 10.1, 10.2, 10.3, 10.4_

  - [ ]* 10.7 Write property test for preview rendering accuracy (Property 15)
    - **Property 15: Preview rendering accuracy**
    - **Validates: Requirements 10.2**
    - Test that preview content matches exported document structure

  - [ ] 10.8 Create ReportExportPanel component (Step 4)
    - Create `frontend/src/components/reports/ReportExportPanel.jsx`
    - Add PDF export button
    - Add DOCX export button
    - Implement export progress indicator
    - Display success confirmation with download again option
    - Display error messages with retry capability
    - _Requirements: 9.1, 9.4, 9.5, 10.5_

- [ ] 11. Implement dashboard integration
  - [ ] 11.1 Add Generate Report button to citizen dashboard
    - Modify citizen dashboard component to add "Generate Internship Report" button
    - Check user role is CITIZEN and has activity data before showing button
    - Navigate to ReportGenerationWizard on button click
    - _Requirements: 1.1, 1.2_

  - [ ]* 11.2 Write property test for dashboard button visibility (Property 1)
    - **Property 1: Dashboard button visibility based on role and activities**
    - **Validates: Requirements 1.1**
    - Test that button is present if and only if user has CITIZEN role and non-zero activities

  - [ ] 11.3 Add insufficient data warning message
    - Display informative message when user has no activity data
    - Show required minimum data (dates, activities)
    - _Requirements: 1.3_

  - [ ] 11.4 Create manager dashboard report metadata section
    - Add "Internship Reports" section to MESOB Manager dashboard
    - Add "Internship Reports" section to Institution Manager dashboard
    - Display total reports by period
    - Display reports grouped by institution (MESOB Manager only)
    - Display student list with report metadata (name, dates, institution)
    - Implement click handler to show aggregated statistics
    - _Requirements: 12.1, 12.2, 12.3, 12.4, 13.1, 13.2, 13.3_

- [ ] 12. Create report routes and navigation
  - [ ] 12.1 Add report routes to React Router configuration
    - Add route for /reports/generate
    - Add route for /reports/drafts (list view)
    - Add route for /reports/drafts/:draftId (edit view)
    - _Requirements: 1.2, 11.3_

  - [ ] 12.2 Create drafts list page
    - Create component to display saved drafts
    - Show draft title, status, last updated date
    - Add click handler to load draft into wizard
    - Add delete draft functionality
    - _Requirements: 11.3_

- [ ] 13. Checkpoint - Ensure frontend integration works
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 14. Add styling and responsive design
  - [ ] 14.1 Style report generation wizard
    - Apply consistent styling to all wizard steps
    - Add step progress indicator
    - Implement responsive layout for mobile and tablet
    - Add loading spinners for async operations
    - _Requirements: 1.2, 2.1_

  - [ ] 14.2 Style report preview component
    - Apply print-like styling to preview
    - Match academic report formatting (fonts, spacing, headings)
    - Implement responsive preview navigation
    - _Requirements: 10.2_

  - [ ] 14.3 Style manager dashboard sections
    - Style report metadata tables
    - Add filtering and sorting controls
    - Implement responsive design for dashboards
    - _Requirements: 12.1, 13.1_

- [ ] 15. Implement accessibility features
  - [ ] 15.1 Add keyboard navigation support
    - Ensure all form fields are keyboard accessible
    - Add keyboard shortcuts for wizard navigation
    - Implement focus management between steps
    - _Requirements: Accessibility - keyboard navigable_

  - [ ] 15.2 Add screen reader support
    - Add ARIA labels to all interactive elements
    - Implement proper heading hierarchy
    - Add live region announcements for validation errors
    - Add descriptive ARIA labels to export buttons
    - _Requirements: Accessibility - screen reader support_

  - [ ]* 15.3 Write accessibility tests
    - Test keyboard navigation paths
    - Test ARIA label presence
    - Test screen reader announcements
    - _Requirements: Accessibility requirements_

- [ ] 16. Add comprehensive error handling and user feedback
  - [ ] 16.1 Implement backend error handling
    - Add try-catch blocks in all controller methods
    - Return structured error responses with appropriate HTTP status codes
    - Log errors for debugging
    - _Requirements: 9.5_

  - [ ] 16.2 Implement frontend error handling
    - Add error boundaries for React components
    - Display user-friendly error messages
    - Preserve form data on errors
    - Add retry mechanisms for failed API calls
    - _Requirements: 9.5_

  - [ ] 16.3 Add loading states and progress indicators
    - Show loading spinner during report generation
    - Show progress indicator during export
    - Disable buttons during async operations
    - _Requirements: Performance requirements_

- [ ] 17. Final checkpoint and integration testing
  - [ ] 17.1 Run end-to-end integration tests
    - Test complete report generation flow from wizard to export
    - Test draft save and load workflow
    - Test manager dashboard data display
    - Verify all validation rules work correctly
    - _Requirements: All requirements_

  - [ ]* 17.2 Write integration tests for complete workflows
    - Test citizen generates report end-to-end
    - Test draft workflow (save, load, complete)
    - Test manager views metadata
    - Test institution-scoped access control

  - [ ] 17.3 Verify performance requirements
    - Test report generation completes within 10 seconds for 1000 activities
    - Test PDF export completes within 15 seconds for 50 pages
    - Test preview rendering displays within 3 seconds
    - _Requirements: Performance requirements_

  - [ ] 17.4 Verify data integrity
    - Confirm activity statistics match database queries exactly
    - Confirm report generation does not modify source data
    - Confirm failed exports do not corrupt drafts
    - _Requirements: Data Integrity requirements_

- [ ] 18. Documentation and deployment preparation
  - [ ] 18.1 Update API documentation
    - Document all new endpoints in API_ENDPOINT_REFERENCE.md
    - Include request/response examples
    - Document authentication and authorization requirements
    - _Requirements: All requirements_

  - [ ] 18.2 Create user guide documentation
    - Write guide for students on generating reports
    - Write guide for managers on viewing report metadata
    - Include screenshots and examples
    - _Requirements: Usability requirements_

  - [ ] 18.3 Add environment variables and configuration
    - Document required environment variables
    - Add configuration for report settings (max pages, timeout, etc.)
    - Update deployment documentation
    - _Requirements: Deployment considerations_

## Notes

- Tasks marked with `*` are optional test-related sub-tasks and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation throughout implementation
- Property tests validate universal correctness properties defined in the design
- Unit tests validate specific examples and edge cases
- The implementation uses JavaScript/Node.js for backend and React for frontend
- All PDF/DOCX generation uses standard libraries (pdfkit, docx)
- Database uses PostgreSQL with JSONB for flexible data storage
- Authentication and authorization leverage existing MESOB system infrastructure

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1"] },
    { "id": 1, "tasks": ["1.2", "2.1", "2.2", "2.3"] },
    { "id": 2, "tasks": ["2.4", "4.1", "6.1"] },
    { "id": 3, "tasks": ["4.2", "4.3", "4.8", "4.10", "6.2"] },
    { "id": 4, "tasks": ["4.4", "4.5", "4.6", "4.7", "4.9", "6.3", "6.4", "6.6"] },
    { "id": 5, "tasks": ["6.5", "6.7", "7.1", "7.2", "7.3", "7.5"] },
    { "id": 6, "tasks": ["7.4", "7.6", "7.7", "8.1"] },
    { "id": 7, "tasks": ["8.2", "8.3"] },
    { "id": 8, "tasks": ["10.1", "10.3", "10.5"] },
    { "id": 9, "tasks": ["10.2", "10.4", "10.6", "10.8"] },
    { "id": 10, "tasks": ["10.7", "11.1", "11.3", "12.1"] },
    { "id": 11, "tasks": ["11.2", "11.4", "12.2"] },
    { "id": 12, "tasks": ["14.1", "14.2", "14.3"] },
    { "id": 13, "tasks": ["15.1", "15.2"] },
    { "id": 14, "tasks": ["15.3", "16.1", "16.2", "16.3"] },
    { "id": 15, "tasks": ["17.1"] },
    { "id": 16, "tasks": ["17.2", "17.3", "17.4"] },
    { "id": 17, "tasks": ["18.1", "18.2", "18.3"] }
  ]
}
```
