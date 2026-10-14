# Design: Internship Report Generation System

## Executive Summary

The Internship Report Generation System is a feature extension for the Hawassa MESOB Public Service Information System that automatically generates comprehensive, academically-formatted internship reports for student users. The system extracts data from existing application processing, queue management, and maintenance activities, combines it with user-provided contextual information, and produces professionally formatted documents in PDF and DOCX formats following standard academic report structures.

---

## Architecture Overview

### System Context

The Internship Report Generation System integrates into the existing MESOB architecture as a new service module:

```
┌─────────────────────────────────────────────────────────────┐
│                     MESOB Frontend (React)                  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────┐  │
│  │   Citizen    │  │   Manager    │  │ Institution Mgr  │  │
│  │  Dashboard   │  │  Dashboard   │  │   Dashboard      │  │
│  └──────┬───────┘  └──────┬───────┘  └────────┬─────────┘  │
│         │                 │                    │             │
│         └─────────────────┼────────────────────┘             │
│                           │                                  │
└───────────────────────────┼──────────────────────────────────┘
                            │
                            │ HTTPS/REST
                            │
┌───────────────────────────┼──────────────────────────────────┐
│                MESOB Backend (Node.js/Express)               │
│  ┌─────────────┼───────────────────────────────────────┐    │
│  │ Existing Routes: /auth, /applications, /queues, etc │    │
│  └──────────────────────────────────────────────────────┘    │
│  ┌────────────────────────────────────────────────────┐     │
│  │  NEW: /reports                                     │     │
│  │  ┌──────────────┐  ┌──────────────────────────┐   │     │
│  │  │ Report       │  │ Report Generation        │   │     │
│  │  │ Controller   │──│ Service                  │   │     │
│  │  └──────────────┘  └──────┬───────────────────┘   │     │
│  │                           │                        │     │
│  │  ┌────────────────────────┴───────────────────┐   │     │
│  │  │  Document Renderer Service                 │   │     │
│  │  │  ┌──────────┐ ┌──────────┐ ┌───────────┐  │   │     │
│  │  │  │PDF Gen   │ │DOCX Gen  │ │Template   │  │   │     │
│  │  │  │(PDFKit)  │ │(docx lib)│ │Engine     │  │   │     │
│  │  │  └──────────┘ └──────────┘ └───────────┘  │   │     │
│  │  └────────────────────────────────────────────┘   │     │
│  └────────────────────────────────────────────────────┘     │
│                           │                                  │
│  ┌────────────────────────┼──────────────────────────┐      │
│  │  Data Access Layer     │                          │      │
│  │  ┌─────────────────────┴─────────────────────┐   │      │
│  │  │ reportDraftRepository                     │   │      │
│  │  │ applicationRepository (existing)          │   │      │
│  │  │ queueRepository (existing)                │   │      │
│  │  │ maintenanceRepository (existing)          │   │      │
│  │  └───────────────────────────────────────────┘   │      │
│  └───────────────────────────┬──────────────────────┘      │
└────────────────────────────────┼────────────────────────────┘
                                 │
                                 │ PostgreSQL Protocol
                                 │
┌────────────────────────────────┼────────────────────────────┐
│            Supabase PostgreSQL Database                      │
│  ┌────────────────────────────────────────────────────┐     │
│  │ Existing Tables:                                   │     │
│  │  - users, institutions, services                   │     │
│  │  - applications, queue_entries                     │     │
│  │  - maintenance_reports, maintenance_tasks          │     │
│  └────────────────────────────────────────────────────┘     │
│  ┌────────────────────────────────────────────────────┐     │
│  │ NEW: report_drafts                                 │     │
│  │  - id, user_id, title, data (JSONB), status       │     │
│  │  - created_at, updated_at                          │     │
│  └────────────────────────────────────────────────────┘     │
│  ┌────────────────────────────────────────────────────┐     │
│  │ NEW: report_metadata                               │     │
│  │  - id, user_id, institution_id, period_start       │     │
│  │  - period_end, exported_at, format                 │     │
│  └────────────────────────────────────────────────────┘     │
└──────────────────────────────────────────────────────────────┘
```

### Key Architectural Decisions

**1. Service Layer Pattern**
- Report generation logic resides in a dedicated `ReportGenerationService`
- Separates business logic from HTTP handling
- Enables unit testing without HTTP mocking

**2. Repository Pattern**
- Data access abstracted through repository interfaces
- Repositories query existing tables (applications, queue_entries, maintenance_tasks)
- New `ReportDraftRepository` manages draft persistence

**3. Document Rendering Abstraction**
- `DocumentRendererService` provides format-agnostic rendering interface
- PDF and DOCX renderers implement common `IDocumentRenderer` interface
- Template engine generates chapter content from data models

**4. Stateless Generation**
- Report generation is a pure function of input data + database state
- No server-side session state required
- Supports horizontal scaling

---

## Data Model

### New Database Tables

#### table: report_drafts

Stores in-progress reports for multi-session editing.

```sql
CREATE TABLE report_drafts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  status VARCHAR(50) DEFAULT 'DRAFT' NOT NULL, -- DRAFT, COMPLETED
  
  -- Report configuration and content (stored as JSONB)
  data JSONB NOT NULL DEFAULT '{}'::jsonb,
  /* data structure:
    {
      "internshipPeriod": {
        "startDate": "2026-01-15",
        "endDate": "2026-06-15"
      },
      "supervisor": {
        "name": "Dr. Abebe Kebede",
        "title": "MESOB Manager",
        "email": "abebe@mesobcenter.et",
        "phone": "+251911123456"
      },
      "institutionId": "uuid-of-institution",
      "customContent": {
        "learningOutcomes": ["outcome1", "outcome2"],
        "challenges": ["challenge1"],
        "recommendations": ["recommendation1"]
      }
    }
  */
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  
  -- Indexes
  CONSTRAINT unique_user_draft_title UNIQUE(user_id, title)
);

CREATE INDEX idx_report_drafts_user_id ON report_drafts(user_id);
CREATE INDEX idx_report_drafts_status ON report_drafts(status);
CREATE INDEX idx_report_drafts_updated_at ON report_drafts(updated_at DESC);
```

#### table: report_metadata

Tracks generated and exported reports for management dashboards.

```sql
CREATE TABLE report_metadata (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  institution_id UUID NOT NULL REFERENCES institutions(id) ON DELETE CASCADE,
  
  -- Report period
  period_start TIMESTAMPTZ NOT NULL,
  period_end TIMESTAMPTZ NOT NULL,
  
  -- Export information
  exported_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  format VARCHAR(10) NOT NULL, -- PDF, DOCX
  file_size INTEGER, -- bytes
  
  -- Statistics snapshot (for quick dashboard queries)
  statistics JSONB DEFAULT '{}'::jsonb,
  /* statistics structure:
    {
      "totalApplications": 45,
      "totalQueueTickets": 32,
      "totalMaintenanceTasks": 8,
      "serviceBreakdown": {
        "service-uuid-1": 20,
        "service-uuid-2": 15
      }
    }
  */
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  
  -- Metadata
  metadata JSONB DEFAULT '{}'::jsonb
);

CREATE INDEX idx_report_metadata_user_id ON report_metadata(user_id);
CREATE INDEX idx_report_metadata_institution_id ON report_metadata(institution_id);
CREATE INDEX idx_report_metadata_exported_at ON report_metadata(exported_at DESC);
CREATE INDEX idx_report_metadata_period ON report_metadata(period_start, period_end);
```

### Data Flow for Report Generation

```
1. User Input Collection
   ┌─────────────────────────────────────┐
   │  Frontend Form                      │
   │  - Internship dates                 │
   │  - Supervisor info                  │
   │  - Institution assignment           │
   │  - Custom learning outcomes         │
   │  - Challenges & recommendations     │
   └──────────────┬──────────────────────┘
                  │
                  │ POST /api/reports/generate
                  ↓
2. Data Aggregation
   ┌─────────────────────────────────────┐
   │  ReportGenerationService            │
   │  ┌───────────────────────────────┐  │
   │  │ Query applications WHERE      │  │
   │  │   assigned_to = user_id AND   │  │
   │  │   created_at BETWEEN dates    │  │
   │  └───────────────────────────────┘  │
   │  ┌───────────────────────────────┐  │
   │  │ Query queue_entries WHERE     │  │
   │  │   assigned_to = user_id AND   │  │
   │  │   created_at BETWEEN dates    │  │
   │  └───────────────────────────────┘  │
   │  ┌───────────────────────────────┐  │
   │  │ Query maintenance_tasks WHERE │  │
   │  │   assigned_to = user_id AND   │  │
   │  │   created_at BETWEEN dates    │  │
   │  └───────────────────────────────┘  │
   │  ┌───────────────────────────────┐  │
   │  │ Aggregate statistics          │  │
   │  │   - Count by status           │  │
   │  │   - Group by service          │  │
   │  │   - Calculate percentages     │  │
   │  └───────────────────────────────┘  │
   └──────────────┬──────────────────────┘
                  │
                  │ ReportData object
                  ↓
3. Document Generation
   ┌─────────────────────────────────────┐
   │  DocumentRendererService            │
   │  ┌───────────────────────────────┐  │
   │  │ Generate Cover Page           │  │
   │  │ Generate Table of Contents    │  │
   │  │ Generate Chapter 1: Intro     │  │
   │  │ Generate Chapter 2: Org       │  │
   │  │ Generate Chapter 3: Activities│  │
   │  │ Generate Chapter 4: Learning  │  │
   │  │ Generate Chapter 5: Challenges│  │
   │  │ Generate Chapter 6: Conclusion│  │
   │  │ Generate Chapter 7: Recomm.   │  │
   │  │ Apply formatting & styles     │  │
   │  │ Generate page numbers         │  │
   │  └───────────────────────────────┘  │
   └──────────────┬──────────────────────┘
                  │
                  │ Document Buffer (PDF/DOCX bytes)
                  ↓
4. Response & Metadata Storage
   ┌─────────────────────────────────────┐
   │  - Save report_metadata record      │
   │  - Return file stream to client     │
   │  - Set download headers             │
   └─────────────────────────────────────┘
```

---

## Component Design

### 1. Frontend Components

#### Component: ReportGenerationWizard

Top-level container component managing the multi-step report generation process.

**Location:** `frontend/src/pages/reports/ReportGenerationWizard.jsx`

**Props:**
```javascript
// No props - route component
```

**State:**
```javascript
{
  currentStep: number,           // 1-4 (Info, Content, Preview, Export)
  formData: {
    internshipPeriod: {
      startDate: string,         // ISO date
      endDate: string            // ISO date
    },
    supervisor: {
      name: string,
      title: string,
      email: string,
      phone: string
    },
    institutionId: string,       // UUID
    customContent: {
      learningOutcomes: string[], // Rich text
      challenges: string[],       // Rich text
      recommendations: string[]   // Rich text
    }
  },
  validation: {
    errors: object,              // Field-level errors
    isValid: boolean
  },
  activities: object | null,     // Loaded from API
  previewDocument: object | null, // Generated document structure
  isLoading: boolean,
  draftId: string | null         // If editing existing draft
}
```

**Key Methods:**
```javascript
handleStepChange(newStep: number): void
handleFieldChange(field: string, value: any): void
validateForm(): boolean
handleSaveDraft(): Promise<void>
handleLoadDraft(draftId: string): Promise<void>
handleGeneratePreview(): Promise<void>
handleExport(format: 'PDF' | 'DOCX'): Promise<void>
```

**Lifecycle:**
1. `useEffect()` on mount: Check for draft ID in URL params, load if present
2. `useEffect()` on mount: Load user profile to pre-populate fields
3. `useEffect()` on `institutionId` change: Load activities for date range validation
4. Auto-save to draft every 30 seconds if form is dirty

---

#### Component: InternshipInfoForm

Step 1: Collects basic internship information.

**Location:** `frontend/src/components/reports/InternshipInfoForm.jsx`

**Props:**
```javascript
{
  formData: {
    internshipPeriod: { startDate: string, endDate: string },
    supervisor: object,
    institutionId: string
  },
  institutions: array,           // Available institutions
  validation: object,
  onChange: (field: string, value: any) => void
}
```

**Validation Rules:**
- Start date must be before end date
- Both dates required
- Supervisor name, title required (email, phone optional)
- Institution selection required
- Dates must not be in future
- Internship duration must be at least 1 week

---

#### Component: CustomContentForm

Step 2: Collects custom learning outcomes, challenges, recommendations.

**Location:** `frontend/src/components/reports/CustomContentForm.jsx`

**Props:**
```javascript
{
  customContent: {
    learningOutcomes: string[],
    challenges: string[],
    recommendations: string[]
  },
  onChange: (field: string, value: any) => void
}
```

**Features:**
- Rich text editor for each entry (bold, italic, lists)
- Add/remove multiple entries
- Optional fields (can leave empty for templates)
- Character count display (recommend 100-500 chars per entry)

---

#### Component: ReportPreview

Step 3: Displays formatted preview of generated report.

**Location:** `frontend/src/components/reports/ReportPreview.jsx`

**Props:**
```javascript
{
  document: {
    coverPage: object,
    tableOfContents: array,
    chapters: array
  },
  onBack: () => void,
  onExport: (format: string) => void
}
```

**Rendering:**
- CSS-styled HTML preview matching export formatting
- Scrollable with sticky chapter navigation sidebar
- Page breaks indicated visually
- Chapter links jump to sections

---

#### Component: ReportExportPanel

Step 4: Export controls and download triggers.

**Location:** `frontend/src/components/reports/ReportExportPanel.jsx`

**Props:**
```javascript
{
  onExport: (format: 'PDF' | 'DOCX') => Promise<void>,
  isExporting: boolean,
  exportProgress: number | null  // 0-100 if available
}
```

**Features:**
- PDF export button
- DOCX export button
- Export progress indicator
- Error display
- Success confirmation with "Download again" option

---

### 2. Backend Components

#### Module: reportController.js

HTTP request handlers for report endpoints.

**Location:** `backend/src/controllers/reportController.js`

**Endpoints:**

```javascript
/**
 * POST /api/reports/drafts
 * Save or update a report draft
 * Auth: CITIZEN only
 * Body: { title, data }
 * Returns: { draftId, savedAt }
 */
async function saveDraft(req, res) {
  const { title, data } = req.body;
  const userId = req.user.id;
  
  try {
    const draft = await reportService.saveDraft(userId, title, data);
    res.json({ success: true, draft });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

/**
 * GET /api/reports/drafts
 * List all drafts for current user
 * Auth: CITIZEN only
 * Query: ?status=DRAFT|COMPLETED
 * Returns: Array of { id, title, updatedAt, status }
 */
async function listDrafts(req, res) {
  const userId = req.user.id;
  const { status } = req.query;
  
  try {
    const drafts = await reportService.listDrafts(userId, status);
    res.json({ drafts });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

/**
 * GET /api/reports/drafts/:draftId
 * Load a specific draft
 * Auth: CITIZEN only (own drafts)
 * Returns: Full draft object with data
 */
async function getDraft(req, res) {
  const userId = req.user.id;
  const { draftId } = req.params;
  
  try {
    const draft = await reportService.getDraft(userId, draftId);
    if (!draft) {
      return res.status(404).json({ error: 'Draft not found' });
    }
    res.json({ draft });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

/**
 * POST /api/reports/generate
 * Generate report preview (no export)
 * Auth: CITIZEN only
 * Body: { internshipPeriod, supervisor, institutionId, customContent }
 * Returns: { document: { coverPage, chapters, tableOfContents } }
 */
async function generateReport(req, res) {
  const userId = req.user.id;
  const reportConfig = req.body;
  
  try {
    // Validate configuration
    const validation = reportService.validateReportConfig(reportConfig);
    if (!validation.isValid) {
      return res.status(400).json({ errors: validation.errors });
    }
    
    // Generate document structure
    const document = await reportService.generateReportDocument(
      userId,
      reportConfig
    );
    
    res.json({ document });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

/**
 * POST /api/reports/export
 * Export report to PDF or DOCX
 * Auth: CITIZEN only
 * Body: { format: 'PDF' | 'DOCX', reportConfig }
 * Returns: File stream (application/pdf or application/vnd.openxmlformats)
 */
async function exportReport(req, res) {
  const userId = req.user.id;
  const { format, reportConfig } = req.body;
  
  try {
    // Generate document
    const document = await reportService.generateReportDocument(
      userId,
      reportConfig
    );
    
    // Render to requested format
    let buffer, mimeType, extension;
    if (format === 'PDF') {
      buffer = await documentRenderer.renderPDF(document);
      mimeType = 'application/pdf';
      extension = 'pdf';
    } else if (format === 'DOCX') {
      buffer = await documentRenderer.renderDOCX(document);
      mimeType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
      extension = 'docx';
    } else {
      return res.status(400).json({ error: 'Invalid format' });
    }
    
    // Save metadata
    await reportService.saveReportMetadata(userId, reportConfig, format);
    
    // Generate filename
    const user = await userService.getUserById(userId);
    const filename = generateFilename(user, reportConfig, extension);
    
    // Send file
    res.setHeader('Content-Type', mimeType);
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(buffer);
    
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

/**
 * GET /api/reports/activities
 * Get activity summary for date range (for validation)
 * Auth: CITIZEN only
 * Query: ?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD&institutionId=UUID
 * Returns: { hasActivities: boolean, summary: object }
 */
async function getActivitiesSummary(req, res) {
  const userId = req.user.id;
  const { startDate, endDate, institutionId } = req.query;
  
  try {
    const summary = await reportService.getActivitiesSummary(
      userId,
      startDate,
      endDate,
      institutionId
    );
    res.json(summary);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

/**
 * GET /api/reports/metadata
 * Get report generation statistics for managers
 * Auth: MESOB_MANAGER, INSTITUTION_MANAGER
 * Query: ?period=MONTH|QUARTER|YEAR&institutionId=UUID (optional)
 * Returns: { reports: array, statistics: object }
 */
async function getReportMetadata(req, res) {
  const user = req.user;
  const { period, institutionId } = req.query;
  
  try {
    // Authorization check
    if (user.role === 'INSTITUTION_MANAGER') {
      // Can only view own institution
      if (institutionId && institutionId !== user.institution_id) {
        return res.status(403).json({ error: 'Access denied' });
      }
      institutionId = user.institution_id;
    }
    // MESOB_MANAGER can view all or filter by institution
    
    const metadata = await reportService.getReportMetadata(period, institutionId);
    res.json(metadata);
    
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
```

---

#### Module: reportService.js

Business logic for report generation.

**Location:** `backend/src/services/reportService.js`

**Key Methods:**

```javascript
class ReportService {
  constructor(reportDraftRepo, applicationRepo, queueRepo, maintenanceRepo) {
    this.reportDraftRepo = reportDraftRepo;
    this.applicationRepo = applicationRepo;
    this.queueRepo = queueRepo;
    this.maintenanceRepo = maintenanceRepo;
  }
  
  /**
   * Validate report configuration
   */
  validateReportConfig(config) {
    const errors = {};
    
    // Validate dates
    if (!config.internshipPeriod?.startDate) {
      errors.startDate = 'Start date is required';
    }
    if (!config.internshipPeriod?.endDate) {
      errors.endDate = 'End date is required';
    }
    if (config.internshipPeriod) {
      const start = new Date(config.internshipPeriod.startDate);
      const end = new Date(config.internshipPeriod.endDate);
      if (end <= start) {
        errors.endDate = 'End date must be after start date';
      }
    }
    
    // Validate supervisor
    if (!config.supervisor?.name) {
      errors.supervisorName = 'Supervisor name is required';
    }
    if (!config.supervisor?.title) {
      errors.supervisorTitle = 'Supervisor title is required';
    }
    
    // Validate institution
    if (!config.institutionId) {
      errors.institutionId = 'Institution is required';
    }
    
    return {
      isValid: Object.keys(errors).length === 0,
      errors
    };
  }
  
  /**
   * Get activities summary for date range
   */
  async getActivitiesSummary(userId, startDate, endDate, institutionId) {
    const applications = await this.applicationRepo.findByUserAndDateRange(
      userId,
      startDate,
      endDate,
      institutionId
    );
    
    const queueEntries = await this.queueRepo.findByUserAndDateRange(
      userId,
      startDate,
      endDate,
      institutionId
    );
    
    const maintenanceTasks = await this.maintenanceRepo.findByUserAndDateRange(
      userId,
      startDate,
      endDate,
      institutionId
    );
    
    const hasActivities = applications.length > 0 || 
                          queueEntries.length > 0 || 
                          maintenanceTasks.length > 0;
    
    return {
      hasActivities,
      summary: {
        applications: applications.length,
        queueTickets: queueEntries.length,
        maintenanceTasks: maintenanceTasks.length
      }
    };
  }
  
  /**
   * Generate complete report document structure
   */
  async generateReportDocument(userId, reportConfig) {
    // 1. Load user profile
    const user = await userService.getUserById(userId);
    
    // 2. Load institution details
    const institution = await institutionService.getById(
      reportConfig.institutionId
    );
    
    // 3. Query activities
    const activities = await this.queryUserActivities(
      userId,
      reportConfig.internshipPeriod.startDate,
      reportConfig.internshipPeriod.endDate,
      reportConfig.institutionId
    );
    
    // 4. Generate document structure
    const document = {
      coverPage: this.generateCoverPage(user, institution, reportConfig),
      tableOfContents: this.generateTableOfContents(),
      chapters: [
        this.generateIntroductionChapter(reportConfig),
        this.generateOrganizationChapter(institution),
        this.generateActivitiesChapter(activities, institution),
        this.generateLearningOutcomesChapter(
          reportConfig.customContent?.learningOutcomes,
          activities
        ),
        this.generateChallengesChapter(
          reportConfig.customContent?.challenges
        ),
        this.generateConclusionChapter(activities),
        this.generateRecommendationsChapter(
          reportConfig.customContent?.recommendations
        )
      ],
      metadata: {
        generatedAt: new Date().toISOString(),
        userId,
        institutionId: reportConfig.institutionId
      }
    };
    
    return document;
  }
  
  /**
   * Query all user activities in date range
   */
  async queryUserActivities(userId, startDate, endDate, institutionId) {
    const applications = await this.applicationRepo.findByUserAndDateRange(
      userId,
      startDate,
      endDate,
      institutionId
    );
    
    const queueEntries = await this.queueRepo.findByUserAndDateRange(
      userId,
      startDate,
      endDate,
      institutionId
    );
    
    const maintenanceTasks = await this.maintenanceRepo.findByUserAndDateRange(
      userId,
      startDate,
      endDate,
      institutionId
    );
    
    // Aggregate statistics
    const statistics = this.aggregateStatistics(
      applications,
      queueEntries,
      maintenanceTasks
    );
    
    return {
      applications,
      queueEntries,
      maintenanceTasks,
      statistics
    };
  }
  
  /**
   * Aggregate activity statistics
   */
  aggregateStatistics(applications, queueEntries, maintenanceTasks) {
    return {
      totalApplications: applications.length,
      applicationsByStatus: this.groupByStatus(applications),
      applicationsByService: this.groupByService(applications),
      
      totalQueueTickets: queueEntries.length,
      queueTicketsByStatus: this.groupByStatus(queueEntries),
      averageQueueTime: this.calculateAverageTime(queueEntries),
      
      totalMaintenanceTasks: maintenanceTasks.length,
      tasksByPriority: this.groupByPriority(maintenanceTasks),
      tasksCompleted: maintenanceTasks.filter(t => t.status === 'COMPLETED').length
    };
  }
  
  /**
   * Generate cover page content
   */
  generateCoverPage(user, institution, config) {
    return {
      title: 'Internship Report',
      subtitle: `${institution.name_en}`,
      studentName: user.full_name,
      studentEmail: user.email,
      internshipPeriod: {
        start: config.internshipPeriod.startDate,
        end: config.internshipPeriod.endDate
      },
      supervisor: config.supervisor,
      submissionDate: new Date().toISOString()
    };
  }
  
  /**
   * Generate table of contents
   */
  generateTableOfContents() {
    return [
      { chapter: 1, title: 'Introduction', page: 2 },
      { chapter: 2, title: 'Organization Background', page: 3 },
      { chapter: 3, title: 'Activities and Responsibilities', page: 5 },
      { chapter: 4, title: 'Learning Outcomes', page: 8 },
      { chapter: 5, title: 'Challenges Faced', page: 10 },
      { chapter: 6, title: 'Conclusion', page: 11 },
      { chapter: 7, title: 'Recommendations', page: 12 }
    ];
  }
  
  /**
   * Generate Introduction chapter
   */
  generateIntroductionChapter(config) {
    return {
      number: 1,
      title: 'Introduction',
      sections: [
        {
          title: 'Purpose of Internship',
          content: `This internship at ${config.institutionName} was undertaken to gain practical experience in public service delivery, digital systems management, and citizen-centered service design.`
        },
        {
          title: 'Internship Period',
          content: `The internship was conducted from ${config.internshipPeriod.startDate} to ${config.internshipPeriod.endDate}.`
        },
        {
          title: 'Report Structure',
          content: 'This report is organized into seven chapters covering the organization background, activities performed, learning outcomes achieved, challenges encountered, and recommendations for improvement.'
        }
      ]
    };
  }
  
  /**
   * Generate Organization Background chapter
   */
  generateOrganizationChapter(institution) {
    return {
      number: 2,
      title: 'Organization Background',
      sections: [
        {
          title: 'About MESOB',
          content: `The Hawassa MESOB (Multi-Service Center) is a government initiative designed to streamline public service delivery by bringing together 12 government institutions under one roof.`
        },
        {
          title: 'Mission and Vision',
          content: 'MESOB aims to provide efficient, transparent, and citizen-friendly services by leveraging digital technologies and unified service delivery models.'
        },
        {
          title: 'Organizational Structure',
          content: 'MESOB operates with a hierarchical structure including system administrators, MESOB managers, institution managers, service employees, and ICT support staff.'
        },
        {
          title: 'Institutions Served',
          content: 'MESOB serves 12 government institutions including banking services (Sidama Bank, Commercial Bank of Ethiopia, Awash Bank, Dashen Bank), postal services, telecommunications, revenue authority, and other public services.'
        },
        {
          title: `${institution.name_en} Services`,
          content: `The ${institution.name_en} provides services including ${institution.description || 'various public services'}. During the internship, work focused on supporting the delivery of these services through the MESOB digital platform.`
        }
      ]
    };
  }
  
  /**
   * Generate Activities chapter
   */
  generateActivitiesChapter(activities, institution) {
    const { statistics } = activities;
    
    return {
      number: 3,
      title: 'Activities and Responsibilities',
      sections: [
        {
          title: 'Activity Summary',
          content: `During the internship period, a total of ${statistics.totalApplications} applications were processed, ${statistics.totalQueueTickets} queue tickets were managed, and ${statistics.totalMaintenanceTasks} technical tasks were handled.`,
          table: {
            headers: ['Activity Type', 'Count', 'Percentage'],
            rows: [
              ['Applications Processed', statistics.totalApplications, this.calculatePercentage(statistics.totalApplications, activities)],
              ['Queue Tickets Managed', statistics.totalQueueTickets, this.calculatePercentage(statistics.totalQueueTickets, activities)],
              ['Maintenance Tasks', statistics.totalMaintenanceTasks, this.calculatePercentage(statistics.totalMaintenanceTasks, activities)]
            ]
          }
        },
        {
          title: 'Application Processing',
          content: `Processed ${statistics.totalApplications} citizen applications across various services offered by ${institution.name_en}.`,
          subsections: [
            {
              title: 'Applications by Status',
              content: this.formatStatusBreakdown(statistics.applicationsByStatus)
            },
            {
              title: 'Applications by Service',
              content: this.formatServiceBreakdown(statistics.applicationsByService)
            }
          ]
        },
        {
          title: 'Queue Management',
          content: `Managed ${statistics.totalQueueTickets} queue tickets with an average service time of ${statistics.averageQueueTime} minutes.`,
          chart: {
            type: 'bar',
            data: statistics.queueTicketsByStatus
          }
        },
        {
          title: 'Technical Support',
          content: `Assisted with ${statistics.totalMaintenanceTasks} maintenance and technical support tasks, with ${statistics.tasksCompleted} successfully completed.`
        }
      ]
    };
  }
  
  /**
   * Generate Learning Outcomes chapter
   */
  generateLearningOutcomesChapter(customOutcomes, activities) {
    const sections = [];
    
    // Use custom outcomes if provided
    if (customOutcomes && customOutcomes.length > 0) {
      customOutcomes.forEach((outcome, index) => {
        sections.push({
          title: `Learning Outcome ${index + 1}`,
          content: outcome
        });
      });
    } else {
      // Generate template outcomes based on activities
      sections.push({
        title: 'Customer Service Skills',
        content: 'Developed strong customer service skills through direct interaction with citizens seeking government services.'
      });
      
      if (activities.statistics.totalApplications > 0) {
        sections.push({
          title: 'Application Processing',
          content: 'Gained experience in reviewing and processing service applications, ensuring compliance with requirements and regulations.'
        });
      }
      
      if (activities.statistics.totalQueueTickets > 0) {
        sections.push({
          title: 'Queue Management',
          content: 'Learned efficient queue management techniques to minimize citizen wait times and improve service delivery.'
        });
      }
      
      sections.push({
        title: 'Digital Systems',
        content: 'Acquired practical knowledge of digital government systems and their role in modernizing public service delivery.'
      });
    }
    
    return {
      number: 4,
      title: 'Learning Outcomes',
      sections
    };
  }
  
  /**
   * Generate Challenges chapter
   */
  generateChallengesChapter(customChallenges) {
    const sections = [];
    
    if (customChallenges && customChallenges.length > 0) {
      customChallenges.forEach((challenge, index) => {
        sections.push({
          title: `Challenge ${index + 1}`,
          content: challenge
        });
      });
    } else {
      sections.push({
        title: 'System Adaptation',
        content: 'Initial learning curve in understanding the MESOB digital system and various institution-specific processes.'
      });
      sections.push({
        title: 'Volume Management',
        content: 'Managing high volumes of citizen requests during peak hours while maintaining service quality.'
      });
    }
    
    return {
      number: 5,
      title: 'Challenges Faced',
      sections
    };
  }
  
  /**
   * Generate Conclusion chapter
   */
  generateConclusionChapter(activities) {
    return {
      number: 6,
      title: 'Conclusion',
      sections: [
        {
          content: `The internship at MESOB provided valuable hands-on experience in public service delivery and digital government systems. Through processing ${activities.statistics.totalApplications} applications and managing ${activities.statistics.totalQueueTickets} queue tickets, practical skills in citizen services, system operations, and professional communication were developed.`
        },
        {
          content: 'This experience has provided insight into the challenges and opportunities in modernizing government services and the critical role of digital systems in improving service accessibility and efficiency.'
        }
      ]
    };
  }
  
  /**
   * Generate Recommendations chapter
   */
  generateRecommendationsChapter(customRecommendations) {
    const sections = [];
    
    if (customRecommendations && customRecommendations.length > 0) {
      customRecommendations.forEach((rec, index) => {
        sections.push({
          title: `Recommendation ${index + 1}`,
          content: rec
        });
      });
    } else {
      sections.push({
        title: 'System Enhancement',
        content: 'Continue investing in digital system improvements to further reduce processing times and enhance user experience.'
      });
      sections.push({
        title: 'Staff Training',
        content: 'Provide regular training for staff on new system features and customer service best practices.'
      });
    }
    
    return {
      number: 7,
      title: 'Recommendations',
      sections
    };
  }
  
  // ... Additional helper methods for statistics, formatting, etc.
}
```

---

#### Module: documentRenderer.js

Renders document structure to PDF and DOCX formats.

**Location:** `backend/src/services/documentRenderer.js`

```javascript
const PDFDocument = require('pdfkit');
const { Document, Packer, Paragraph, TextRun, HeadingLevel, TableOfContents } = require('docx');

class DocumentRendererService {
  /**
   * Render document to PDF using PDFKit
   */
  async renderPDF(document) {
    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({
        size: 'A4',
        margins: {
          top: 72,
          bottom: 72,
          left: 72,
          right: 72
        }
      });
      
      const buffers = [];
      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', () => {
        const pdfBuffer = Buffer.concat(buffers);
        resolve(pdfBuffer);
      });
      doc.on('error', reject);
      
      // Render cover page
      this.renderCoverPagePDF(doc, document.coverPage);
      doc.addPage();
      
      // Render table of contents
      this.renderTableOfContentsPDF(doc, document.tableOfContents);
      doc.addPage();
      
      // Render chapters
      let pageNumber = 2; // Start after cover page
      document.chapters.forEach((chapter, index) => {
        if (index > 0) {
          doc.addPage();
        }
        this.renderChapterPDF(doc, chapter, pageNumber);
        pageNumber += this.estimateChapterPages(chapter);
      });
      
      // Finalize PDF
      doc.end();
    });
  }
  
  /**
   * Render cover page in PDF
   */
  renderCoverPagePDF(doc, coverPage) {
    // Title
    doc.fontSize(24)
       .font('Helvetica-Bold')
       .text(coverPage.title, { align: 'center' });
    
    doc.moveDown(2);
    
    // Subtitle
    doc.fontSize(16)
       .font('Helvetica')
       .text(coverPage.subtitle, { align: 'center' });
    
    doc.moveDown(4);
    
    // Student information
    doc.fontSize(12)
       .font('Helvetica-Bold')
       .text('Prepared by:');
    doc.font('Helvetica')
       .text(coverPage.studentName);
    doc.text(coverPage.studentEmail);
    
    doc.moveDown(2);
    
    // Internship period
    doc.font('Helvetica-Bold')
       .text('Internship Period:');
    doc.font('Helvetica')
       .text(`${coverPage.internshipPeriod.start} to ${coverPage.internshipPeriod.end}`);
    
    doc.moveDown(2);
    
    // Supervisor information
    doc.font('Helvetica-Bold')
       .text('Supervised by:');
    doc.font('Helvetica')
       .text(coverPage.supervisor.name);
    doc.text(coverPage.supervisor.title);
    doc.text(coverPage.supervisor.email);
    
    doc.moveDown(4);
    
    // Submission date
    doc.fontSize(10)
       .text(`Submitted: ${new Date(coverPage.submissionDate).toLocaleDateString()}`, {
         align: 'center'
       });
  }
  
  /**
   * Render table of contents in PDF
   */
  renderTableOfContentsPDF(doc, toc) {
    doc.fontSize(18)
       .font('Helvetica-Bold')
       .text('Table of Contents', { align: 'center' });
    
    doc.moveDown(2);
    
    doc.fontSize(12);
    toc.forEach(item => {
      doc.font('Helvetica')
         .text(`Chapter ${item.chapter}: ${item.title}`, { continued: true });
      doc.font('Helvetica')
         .text(` ..... ${item.page}`, { align: 'right' });
      doc.moveDown(0.5);
    });
  }
  
  /**
   * Render chapter in PDF
   */
  renderChapterPDF(doc, chapter, startPage) {
    // Chapter title
    doc.fontSize(18)
       .font('Helvetica-Bold')
       .text(`Chapter ${chapter.number}: ${chapter.title}`);
    
    doc.moveDown(1);
    
    // Render sections
    chapter.sections.forEach(section => {
      if (section.title) {
        doc.fontSize(14)
           .font('Helvetica-Bold')
           .text(section.title);
        doc.moveDown(0.5);
      }
      
      doc.fontSize(12)
         .font('Helvetica')
         .text(section.content, { align: 'justify' });
      
      doc.moveDown(1);
      
      // Render table if present
      if (section.table) {
        this.renderTablePDF(doc, section.table);
      }
      
      // Render subsections if present
      if (section.subsections) {
        section.subsections.forEach(subsection => {
          doc.fontSize(12)
             .font('Helvetica-Bold')
             .text(subsection.title);
          doc.fontSize(11)
             .font('Helvetica')
             .text(subsection.content);
          doc.moveDown(0.5);
        });
      }
    });
    
    // Page number footer
    this.addPageNumberPDF(doc, startPage);
  }
  
  /**
   * Render table in PDF
   */
  renderTablePDF(doc, table) {
    // Simple table rendering
    const tableTop = doc.y;
    const colWidth = 150;
    
    // Headers
    doc.font('Helvetica-Bold');
    table.headers.forEach((header, i) => {
      doc.text(header, 72 + (i * colWidth), tableTop, { width: colWidth });
    });
    
    doc.moveDown(1);
    
    // Rows
    doc.font('Helvetica');
    table.rows.forEach(row => {
      const rowTop = doc.y;
      row.forEach((cell, i) => {
        doc.text(String(cell), 72 + (i * colWidth), rowTop, { width: colWidth });
      });
      doc.moveDown(0.5);
    });
    
    doc.moveDown(1);
  }
  
  /**
   * Add page number to PDF
   */
  addPageNumberPDF(doc, pageNumber) {
    doc.fontSize(10)
       .font('Helvetica')
       .text(`Page ${pageNumber}`, 72, doc.page.height - 50, {
         align: 'center',
         width: doc.page.width - 144
       });
  }
  
  /**
   * Render document to DOCX using docx library
   */
  async renderDOCX(document) {
    const sections = [];
    
    // Cover page section
    sections.push({
      properties: {},
      children: this.generateCoverPageDOCX(document.coverPage)
    });
    
    // Table of contents
    sections.push({
      properties: { pageNumberStart: 2 },
      children: this.generateTableOfContentsDOCX(document.tableOfContents)
    });
    
    // Chapters
    document.chapters.forEach(chapter => {
      sections.push({
        properties: {},
        children: this.generateChapterDOCX(chapter)
      });
    });
    
    const doc = new Document({
      sections
    });
    
    const buffer = await Packer.toBuffer(doc);
    return buffer;
  }
  
  /**
   * Generate cover page for DOCX
   */
  generateCoverPageDOCX(coverPage) {
    return [
      new Paragraph({
        text: coverPage.title,
        heading: HeadingLevel.TITLE,
        alignment: 'center'
      }),
      new Paragraph({
        text: coverPage.subtitle,
        heading: HeadingLevel.HEADING_2,
        alignment: 'center'
      }),
      new Paragraph({ text: '' }), // Spacing
      new Paragraph({ text: '' }),
      new Paragraph({
        children: [
          new TextRun({ text: 'Prepared by:', bold: true })
        ]
      }),
      new Paragraph({ text: coverPage.studentName }),
      new Paragraph({ text: coverPage.studentEmail }),
      new Paragraph({ text: '' }),
      new Paragraph({
        children: [
          new TextRun({ text: 'Internship Period:', bold: true })
        ]
      }),
      new Paragraph({
        text: `${coverPage.internshipPeriod.start} to ${coverPage.internshipPeriod.end}`
      }),
      new Paragraph({ text: '' }),
      new Paragraph({
        children: [
          new TextRun({ text: 'Supervised by:', bold: true })
        ]
      }),
      new Paragraph({ text: coverPage.supervisor.name }),
      new Paragraph({ text: coverPage.supervisor.title }),
      new Paragraph({ text: coverPage.supervisor.email })
    ];
  }
  
  /**
   * Generate table of contents for DOCX
   */
  generateTableOfContentsDOCX(toc) {
    const paragraphs = [
      new Paragraph({
        text: 'Table of Contents',
        heading: HeadingLevel.HEADING_1,
        alignment: 'center'
      }),
      new Paragraph({ text: '' })
    ];
    
    toc.forEach(item => {
      paragraphs.push(
        new Paragraph({
          text: `Chapter ${item.chapter}: ${item.title} ..... ${item.page}`
        })
      );
    });
    
    return paragraphs;
  }
  
  /**
   * Generate chapter for DOCX
   */
  generateChapterDOCX(chapter) {
    const paragraphs = [
      new Paragraph({
        text: `Chapter ${chapter.number}: ${chapter.title}`,
        heading: HeadingLevel.HEADING_1
      }),
      new Paragraph({ text: '' })
    ];
    
    chapter.sections.forEach(section => {
      if (section.title) {
        paragraphs.push(
          new Paragraph({
            text: section.title,
            heading: HeadingLevel.HEADING_2
          })
        );
      }
      
      paragraphs.push(
        new Paragraph({
          text: section.content,
          alignment: 'justify'
        })
      );
      
      paragraphs.push(new Paragraph({ text: '' })); // Spacing
    });
    
    return paragraphs;
  }
  
  /**
   * Estimate number of pages for a chapter
   */
  estimateChapterPages(chapter) {
    let lines = 0;
    chapter.sections.forEach(section => {
      lines += Math.ceil(section.content.length / 80); // ~80 chars per line
      if (section.title) lines += 2;
      if (section.table) lines += section.table.rows.length + 3;
    });
    return Math.ceil(lines / 40); // ~40 lines per page
  }
}

module.exports = DocumentRendererService;
```

---

## API Specification

### Endpoints

#### POST /api/reports/drafts
Save or update a report draft.

**Authentication:** Required (CITIZEN only)

**Request Body:**
```json
{
  "title": "My Internship Report 2026",
  "data": {
    "internshipPeriod": {
      "startDate": "2026-01-15",
      "endDate": "2026-06-15"
    },
    "supervisor": {
      "name": "Dr. Abebe Kebede",
      "title": "MESOB Manager",
      "email": "abebe@mesobcenter.et",
      "phone": "+251911123456"
    },
    "institutionId": "uuid-of-institution",
    "customContent": {
      "learningOutcomes": [
        "Developed customer service skills...",
        "Learned application processing..."
      ],
      "challenges": [
        "Initial system learning curve..."
      ],
      "recommendations": [
        "Enhance system documentation..."
      ]
    }
  }
}
```

**Response:** 200 OK
```json
{
  "success": true,
  "draft": {
    "id": "draft-uuid",
    "title": "My Internship Report 2026",
    "status": "DRAFT",
    "updatedAt": "2026-08-28T10:30:00Z"
  }
}
```

---

#### GET /api/reports/drafts
List all drafts for the current user.

**Authentication:** Required (CITIZEN only)

**Query Parameters:**
- `status` (optional): Filter by status (DRAFT | COMPLETED)

**Response:** 200 OK
```json
{
  "drafts": [
    {
      "id": "draft-uuid-1",
      "title": "My Internship Report 2026",
      "status": "DRAFT",
      "updatedAt": "2026-08-28T10:30:00Z"
    },
    {
      "id": "draft-uuid-2",
      "title": "Final Report",
      "status": "COMPLETED",
      "updatedAt": "2026-08-27T15:45:00Z"
    }
  ]
}
```

---

#### GET /api/reports/drafts/:draftId
Load a specific draft.

**Authentication:** Required (CITIZEN only, own drafts)

**Response:** 200 OK
```json
{
  "draft": {
    "id": "draft-uuid",
    "title": "My Internship Report 2026",
    "status": "DRAFT",
    "data": {
      "internshipPeriod": { ... },
      "supervisor": { ... },
      "institutionId": "...",
      "customContent": { ... }
    },
    "createdAt": "2026-08-20T09:00:00Z",
    "updatedAt": "2026-08-28T10:30:00Z"
  }
}
```

---

#### POST /api/reports/generate
Generate report preview (document structure, no file export).

**Authentication:** Required (CITIZEN only)

**Request Body:**
```json
{
  "internshipPeriod": {
    "startDate": "2026-01-15",
    "endDate": "2026-06-15"
  },
  "supervisor": {
    "name": "Dr. Abebe Kebede",
    "title": "MESOB Manager",
    "email": "abebe@mesobcenter.et",
    "phone": "+251911123456"
  },
  "institutionId": "uuid-of-institution",
  "customContent": {
    "learningOutcomes": ["..."],
    "challenges": ["..."],
    "recommendations": ["..."]
  }
}
```

**Response:** 200 OK
```json
{
  "document": {
    "coverPage": {
      "title": "Internship Report",
      "subtitle": "Sidama Bank Corporation",
      "studentName": "Abebe Tadesse",
      "studentEmail": "abebe@example.com",
      "internshipPeriod": { ... },
      "supervisor": { ... },
      "submissionDate": "2026-08-28T10:30:00Z"
    },
    "tableOfContents": [
      { "chapter": 1, "title": "Introduction", "page": 2 },
      { "chapter": 2, "title": "Organization Background", "page": 3 },
      ...
    ],
    "chapters": [
      {
        "number": 1,
        "title": "Introduction",
        "sections": [...]
      },
      ...
    ],
    "metadata": {
      "generatedAt": "2026-08-28T10:30:00Z",
      "userId": "user-uuid",
      "institutionId": "inst-uuid"
    }
  }
}
```

**Error Responses:**
- 400 Bad Request: Validation errors
```json
{
  "errors": {
    "startDate": "Start date is required",
    "endDate": "End date must be after start date"
  }
}
```

---

#### POST /api/reports/export
Export report to PDF or DOCX file.

**Authentication:** Required (CITIZEN only)

**Request Body:**
```json
{
  "format": "PDF",
  "reportConfig": {
    "internshipPeriod": { ... },
    "supervisor": { ... },
    "institutionId": "...",
    "customContent": { ... }
  }
}
```

**Response:** 200 OK (file stream)
```
Content-Type: application/pdf
Content-Disposition: attachment; filename="Tadesse_Abebe_Internship_Report_2026_08_28.pdf"

<PDF binary data>
```

**Error Responses:**
- 400 Bad Request: Invalid format or configuration
- 500 Internal Server Error: Export generation failed

---

#### GET /api/reports/activities
Get activity summary for date range (for form validation).

**Authentication:** Required (CITIZEN only)

**Query Parameters:**
- `startDate` (required): ISO date string
- `endDate` (required): ISO date string
- `institutionId` (required): UUID

**Response:** 200 OK
```json
{
  "hasActivities": true,
  "summary": {
    "applications": 45,
    "queueTickets": 32,
    "maintenanceTasks": 8
  }
}
```

---

#### GET /api/reports/metadata
Get report generation statistics (for managers).

**Authentication:** Required (MESOB_MANAGER or INSTITUTION_MANAGER)

**Query Parameters:**
- `period` (required): MONTH | QUARTER | YEAR
- `institutionId` (optional): Filter by institution (MESOB_MANAGER only)

**Response:** 200 OK
```json
{
  "reports": [
    {
      "id": "metadata-uuid",
      "userId": "user-uuid",
      "userName": "Abebe Tadesse",
      "institutionId": "inst-uuid",
      "institutionName": "Sidama Bank",
      "periodStart": "2026-01-15",
      "periodEnd": "2026-06-15",
      "exportedAt": "2026-08-28T10:30:00Z",
      "format": "PDF"
    }
  ],
  "statistics": {
    "totalReports": 15,
    "byInstitution": {
      "inst-uuid-1": 5,
      "inst-uuid-2": 10
    },
    "byMonth": {
      "2026-08": 8,
      "2026-07": 7
    }
  }
}
```

---

## Error Handling

### Validation Errors

All validation errors return 400 Bad Request with structured error messages:

```json
{
  "errors": {
    "startDate": "Start date is required",
    "endDate": "End date must be after start date",
    "supervisorName": "Supervisor name is required"
  }
}
```

### Authorization Errors

- 401 Unauthorized: No authentication token provided
- 403 Forbidden: User role not authorized for endpoint
- 404 Not Found: Draft or resource not found

### Export Errors

Export failures preserve user data and return:

```json
{
  "error": "PDF generation failed: <technical details>",
  "retryable": true
}
```

Frontend should display user-friendly error message and keep form data intact for retry.

---

## Security Considerations

### Access Control

1. **Report Generation:** Only CITIZEN role users can generate reports
2. **Draft Access:** Users can only access their own drafts
3. **Activity Querying:** Users can only query their own activities
4. **Metadata Access:**
   - INSTITUTION_MANAGER: Can only view reports for their institution
   - MESOB_MANAGER: Can view all reports but not full content
   - No role can access full report content of other users without explicit permission

### Data Privacy

1. **Activity Data:** Only aggregated statistics included in reports, no citizen PII
2. **Draft Storage:** Encrypted at rest in database
3. **Export Transmission:** HTTPS required for all API calls
4. **File Downloads:** Temporary signed URLs expire after 5 minutes

### Input Validation

1. **Date Ranges:** Validated server-side to prevent SQL injection
2. **Custom Content:** Sanitized to prevent XSS attacks
3. **Institution IDs:** Validated against existing institutions
4. **File Size Limits:** PDF/DOCX exports limited to 50MB

---

## Performance Optimization

### Caching Strategy

1. **Institution Data:** Cached for 1 hour (rarely changes)
2. **Activity Queries:** No caching (must be real-time accurate)
3. **Template Content:** Cached indefinitely (static content)

### Query Optimization

1. **Activity Queries:** Use indexes on `assigned_to` and `created_at` columns
2. **Date Range Filtering:** Use database-level date filtering (not application-level)
3. **Statistics Aggregation:** Single query with GROUP BY rather than multiple queries

### Export Performance

1. **PDF Generation:** Asynchronous with progress tracking for large reports
2. **DOCX Generation:** Streamed to avoid memory issues
3. **Concurrent Exports:** Queue-based processing to prevent server overload

---

## Testing Strategy

### Unit Tests

1. **ReportService:**
   - Validation logic
   - Activity aggregation
   - Chapter generation
   - Statistics calculation

2. **DocumentRenderer:**
   - PDF generation (mock PDFKit)
   - DOCX generation (mock docx library)
   - Formatting consistency

3. **Repositories:**
   - Query construction
   - Date filtering
   - Data transformation

### Integration Tests

1. **API Endpoints:**
   - Authentication and authorization
   - Request/response validation
   - Error handling
   - File download headers

2. **Database Queries:**
   - Activity retrieval accuracy
   - Date range filtering correctness
   - Statistics aggregation accuracy

3. **Export Generation:**
   - PDF output validation (parse generated PDF)
   - DOCX output validation (parse generated DOCX)
   - Filename generation

---

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Dashboard button visibility based on role and activities

*For any* user with the CITIZEN role and non-zero activity records, when rendering the dashboard, the "Generate Internship Report" button SHALL be present in the output.

**Validates: Requirements 1.1**

---

### Property 2: Date range validation

*For any* pair of start date and end date inputs, the validation function SHALL return an error if and only if the end date is not strictly after the start date.

**Validates: Requirements 2.2**

---

### Property 3: Form completion detection

*For any* form state, the "Generate Report" button enabled state SHALL equal true if and only if all required fields (dates, supervisor name, supervisor title, institution ID) are non-empty and all validation rules pass.

**Validates: Requirements 2.5**

---

### Property 4: Date-filtered activity retrieval

*For any* user, date range, and institution, querying the system for activities (applications, queue entries, maintenance tasks) SHALL return exactly those records where the user was assigned AND the record's timestamp falls within the date range (inclusive) AND the record belongs to the specified institution.

**Validates: Requirements 3.1, 3.2, 3.3**

---

### Property 5: Statistics aggregation accuracy

*For any* set of activities, the aggregated statistics (totals, counts by status, counts by service type) SHALL exactly match the actual distribution of the activity data.

**Validates: Requirements 3.4**

---

### Property 6: Required report structure completeness

*For any* valid report configuration, the generated report document SHALL contain all required structural elements: cover page with all mandatory fields (title, student name, institution, dates, supervisor), table of contents, and exactly seven chapters in the specified order (Introduction, Organization Background, Activities, Learning Outcomes, Challenges, Conclusion, Recommendations).

**Validates: Requirements 4.1, 4.2, 4.3**

---

### Property 7: Page numbering correctness

*For any* multi-page generated report, page numbers SHALL start at page 2 (after cover page), SHALL be sequential, and SHALL appear on all pages except the cover page.

**Validates: Requirements 4.4**

---

### Property 8: Organization chapter required content

*For any* generated report, the Organization Background chapter SHALL include all of the following: MESOB mission statement, MESOB vision statement, organizational structure description, a list of exactly 12 government institutions, and service descriptions for the user's assigned institution.

**Validates: Requirements 5.1, 5.2, 5.3, 5.4**

---

### Property 9: Activities chapter statistics table presence

*For any* generated report where total activities exceed zero, the Activities chapter SHALL include a summary table containing activity counts and percentages for all activity types.

**Validates: Requirements 6.1, 6.5**

---

### Property 10: User content preservation

*For any* user-provided custom content (learning outcomes, challenges, recommendations), when that content is included in the report configuration, the generated report SHALL include all provided entries in the corresponding chapters without modification.

**Validates: Requirements 7.3, 8.2, 8.3**

---

### Property 11: Template fallback generation

*For any* report generation request where custom learning outcomes OR challenges OR recommendations are not provided (empty or null), the generated report SHALL include template content in those sections that is contextually appropriate based on the user's activity types.

**Validates: Requirements 7.4, 8.4**

---

### Property 12: Export format fidelity

*For any* generated report document, when exported to PDF or DOCX format, the exported file SHALL preserve all structural elements including: all text content, heading hierarchy, page numbers, table of contents structure, tables with correct data, and formatting (fonts, spacing, alignment).

**Validates: Requirements 9.2, 9.3**

---

### Property 13: Export filename pattern compliance

*For any* report export, the downloaded filename SHALL match the pattern `{LastName}_{FirstName}_Internship_Report_{YYYY}_{MM}_{DD}.{ext}` where the name is derived from the user's full name, the date is the export date, and ext is 'pdf' or 'docx'.

**Validates: Requirements 9.4**

---

### Property 14: Export error data preservation

*For any* export operation that fails, the system SHALL display an error message AND the user's form data SHALL remain unchanged and accessible for retry.

**Validates: Requirements 9.5**

---

### Property 15: Preview rendering accuracy

*For any* generated report, the preview rendering SHALL display content that, when compared to the exported document formatting, matches in all structural aspects (headings, sections, tables, text content).

**Validates: Requirements 10.2**

---

### Property 16: Draft save and load round-trip

*For any* report draft data, if the data is saved and then loaded, the loaded data SHALL be identical to the originally saved data (all fields, nested structures, and custom content preserved exactly).

**Validates: Requirements 11.2, 11.4**

---

### Property 17: Draft status transition on export

*For any* report draft, when a report based on that draft is successfully exported, the draft's status SHALL change from "DRAFT" to "COMPLETED" in the database.

**Validates: Requirements 11.5**

---

### Property 18: Manager dashboard filtered visibility

*For any* institution manager, when viewing their dashboard's internship reports section, the displayed list of students SHALL include exactly those students who generated reports with the manager's institution_id, and SHALL exclude all students from other institutions.

**Validates: Requirements 13.1**

---

### Property 19: Report metadata field completeness

*For any* displayed report metadata entry (in manager dashboards), the entry SHALL include exactly these fields and no others: student name, internship period (start and end dates), report generation date, and institution name.

**Validates: Requirements 12.4, 13.2**

---

### Property 20: Institution-scoped activity statistics

*For any* student with activities across multiple institutions, when an institution manager views that student's activity statistics, the displayed statistics SHALL include only activities performed at the manager's institution and SHALL exclude activities from all other institutions.

**Validates: Requirements 13.3**

---

## Deployment Considerations

### Environment Variables

```env
# Report Generation
REPORT_MAX_PAGES=100
REPORT_EXPORT_TIMEOUT_MS=30000
REPORT_DRAFT_AUTO_SAVE_INTERVAL_MS=30000

# PDF Generation
PDF_FONT_PATH=/usr/share/fonts/truetype/dejavu/
PDF_MAX_SIZE_MB=50

# DOCX Generation
DOCX_MAX_SIZE_MB=50
```

### Dependencies

**Backend:**
```json
{
  "pdfkit": "^0.13.0",
  "docx": "^8.0.0",
  "date-fns": "^2.30.0"
}
```

**Frontend:**
```json
{
  "react-quill": "^2.0.0",
  "file-saver": "^2.0.5"
}
```

### Database Migrations

Migration file: `004_add_internship_reports.sql`

```sql
-- Add report_drafts table
-- Add report_metadata table
-- Add indexes
-- Add foreign key constraints
```

---

## Future Enhancements

1. **Multi-language Support:** Generate reports in Amharic
2. **Custom Templates:** Allow institutions to define custom report structures
3. **Collaborative Editing:** Multiple supervisors can review and comment on drafts
4. **Version History:** Track changes to drafts over time
5. **Automated Submission:** Direct submission to university portals via API
6. **Rich Media:** Include photos of activities in reports
7. **Comparison Reports:** Compare intern performance across periods
8. **Mobile App:** Generate reports from mobile application

---

## Glossary

- **MESOB:** Multi-Service Center providing government services
- **Citizen User:** User with CITIZEN role who can generate reports
- **Draft:** Saved in-progress report configuration
- **Export:** Final PDF or DOCX file generation
- **Preview:** HTML rendering of report structure before export
- **Metadata:** Tracking information about generated reports for management

---

**Document Version:** 1.0  
**Last Updated:** August 28, 2026  
**Status:** Design Complete, Ready for Implementation
