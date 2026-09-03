# 📚 HAWASSA MESOB API - COMPLETE ENDPOINT REFERENCE

**Version:** 1.0.0  
**Base URL:** `http://localhost:5000/api`  
**Authentication:** JWT Bearer Token  
**Date:** August 24, 2026

---

## 🔐 Authentication Flow

### Login Process
```javascript
// 1. POST /api/auth/login
Request: {
  email: "citizen@mesobcenter.et",
  password: "citizen123"
}

Response: {
  success: true,
  message: "Login successful",
  data: {
    user: {
      id: "uuid-here",
      email: "citizen@mesobcenter.et",
      full_name: "Citizen User",
      role: "CITIZEN",
      status: "ACTIVE",
      institution_id: null,
      created_at: "2026-08-24T10:00:00.000Z",
      last_login_at: "2026-08-24T12:30:00.000Z"
    },
    accessToken: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    refreshToken: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    expiresIn: "24h"
  }
}

// 2. Store token
localStorage.setItem('token', accessToken);

// 3. Include in all requests
Headers: {
  'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
}
```

---

## 📍 ENDPOINT CATALOG (37 Endpoints)

### 1. HEALTH & SYSTEM (1 endpoint)

#### GET /api/health
**Purpose:** Check server and database health  
**Access:** Public  
**Authentication:** None required

**Request:**
```http
GET /api/health
```

**Response:**
```json
{
  "success": true,
  "status": "healthy",
  "timestamp": "2026-08-24T12:30:00.000Z",
  "database": "connected",
  "uptime": "2h 15m 30s"
}
```

---

### 2. AUTHENTICATION (5 endpoints)

#### POST /api/auth/login
**Purpose:** User login  
**Access:** Public  
**Authentication:** None required

**Request:**
```json
{
  "email": "citizen@mesobcenter.et",
  "password": "citizen123"
}
```

**Response:** (See Authentication Flow above)

**Error Responses:**
```json
// Invalid credentials
{
  "success": false,
  "message": "Invalid email or password."
}

// Account suspended
{
  "success": false,
  "message": "Your account has been suspended. Please contact support."
}

// Account locked
{
  "success": false,
  "message": "Account is temporarily locked due to too many failed login attempts. Please try again in 30 minutes."
}
```

#### POST /api/auth/register
**Purpose:** Register new user account  
**Access:** Public  
**Authentication:** None required

**Request:**
```json
{
  "email": "newuser@example.com",
  "password": "SecurePassword123!",
  "firstName": "John",
  "lastName": "Doe",
  "phone": "0912345678",
  "role": "CITIZEN",
  "institutionId": null
}
```

**Response:**
```json
{
  "success": true,
  "message": "Registration successful",
  "data": {
    "user": {
      "id": "uuid",
      "email": "newuser@example.com",
      "full_name": "John Doe",
      "role": "CITIZEN",
      "status": "ACTIVE"
    },
    "accessToken": "jwt_token...",
    "refreshToken": "refresh_token..."
  }
}
```

#### GET /api/auth/me
**Purpose:** Get current user profile  
**Access:** Private  
**Authentication:** Required

**Request:**
```http
GET /api/auth/me
Authorization: Bearer {token}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "email": "citizen@mesobcenter.et",
      "full_name": "Citizen User",
      "phone": "0912345678",
      "role": "CITIZEN",
      "status": "ACTIVE",
      "institution_id": null,
      "created_at": "2026-08-24T10:00:00.000Z",
      "last_login_at": "2026-08-24T12:30:00.000Z"
    }
  }
}
```

#### POST /api/auth/logout
**Purpose:** Logout and invalidate session  
**Access:** Private  
**Authentication:** Required

**Request:**
```http
POST /api/auth/logout
Authorization: Bearer {token}
```

**Response:**
```json
{
  "success": true,
  "message": "Logout successful"
}
```

#### POST /api/auth/verify-token
**Purpose:** Verify if JWT token is valid  
**Access:** Private  
**Authentication:** Required

**Request:**
```http
POST /api/auth/verify-token
Authorization: Bearer {token}
```

**Response:**
```json
{
  "success": true,
  "valid": true,
  "data": {
    "userId": "uuid",
    "email": "citizen@mesobcenter.et",
    "role": "CITIZEN"
  }
}
```

---

### 3. USER MANAGEMENT (5 endpoints)

#### GET /api/users
**Purpose:** List all users (filtered)  
**Access:** Admin (SUPER_ADMIN, MESOB_MANAGER, INSTITUTION_MANAGER)  
**Authentication:** Required

**Query Parameters:**
- `role` (optional): Filter by role (CITIZEN, EMPLOYEE, etc.)
- `institution_id` (optional): Filter by institution
- `status` (optional): Filter by status (ACTIVE, INACTIVE, SUSPENDED)

**Request:**
```http
GET /api/users?role=EMPLOYEE&status=ACTIVE
Authorization: Bearer {token}
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "email": "employee@mesobcenter.et",
      "full_name": "Employee User",
      "phone": "0912345678",
      "role": "EMPLOYEE",
      "status": "ACTIVE",
      "institution_id": "uuid",
      "employee_id": "EMP-001",
      "created_at": "2026-08-24T10:00:00.000Z"
    }
  ]
}
```

#### GET /api/users/:id
**Purpose:** Get single user by ID  
**Access:** Admin  
**Authentication:** Required

**Request:**
```http
GET /api/users/uuid-here
Authorization: Bearer {token}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "email": "employee@mesobcenter.et",
      "full_name": "Employee User",
      "phone": "0912345678",
      "role": "EMPLOYEE",
      "status": "ACTIVE",
      "institution_id": "uuid",
      "employee_id": "EMP-001",
      "created_at": "2026-08-24T10:00:00.000Z",
      "last_login_at": "2026-08-24T12:00:00.000Z"
    }
  }
}
```

#### POST /api/users
**Purpose:** Create new user (Admin only)  
**Access:** SUPER_ADMIN, MESOB_MANAGER, INSTITUTION_MANAGER  
**Authentication:** Required

**Request:**
```json
{
  "email": "newemployee@institution.et",
  "full_name": "New Employee",
  "phone": "0912345678",
  "role": "EMPLOYEE",
  "institution_id": "uuid",
  "employee_id": "EMP-999"
}
```

**Response:**
```json
{
  "success": true,
  "message": "User created successfully",
  "data": {
    "user": {
      "id": "uuid",
      "email": "newemployee@institution.et",
      "full_name": "New Employee",
      "role": "EMPLOYEE",
      "status": "ACTIVE"
    },
    "tempPassword": "temp123456"
  }
}
```

#### PATCH /api/users/:id
**Purpose:** Update user  
**Access:** Admin  
**Authentication:** Required

**Request:**
```json
{
  "full_name": "Updated Name",
  "phone": "0987654321",
  "status": "INACTIVE"
}
```

**Response:**
```json
{
  "success": true,
  "message": "User updated successfully",
  "data": {
    "user": {
      "id": "uuid",
      "full_name": "Updated Name",
      "phone": "0987654321",
      "status": "INACTIVE"
    }
  }
}
```

#### DELETE /api/users/:id
**Purpose:** Delete user (soft delete)  
**Access:** SUPER_ADMIN only  
**Authentication:** Required

**Request:**
```http
DELETE /api/users/uuid-here
Authorization: Bearer {token}
```

**Response:**
```json
{
  "success": true,
  "message": "User deleted successfully"
}
```

---

### 4. INSTITUTIONS (5 endpoints)

#### GET /api/institutions
**Purpose:** List all institutions  
**Access:** Public  
**Authentication:** None required

**Query Parameters:**
- `status` (optional): ACTIVE or INACTIVE

**Request:**
```http
GET /api/institutions?status=ACTIVE
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "name_en": "Commercial Bank of Ethiopia",
      "name_am": "የኢትዮጵያ ንግድ ባንክ",
      "code": "CBE",
      "description": "Leading commercial bank in Ethiopia",
      "logo_url": "https://example.com/logo.png",
      "website_url": "https://combanketh.et",
      "phone": "+251911234567",
      "email": "info@combanketh.et",
      "address": "Main Street, Addis Ababa",
      "status": "ACTIVE",
      "created_at": "2026-01-01T00:00:00.000Z",
      "updated_at": "2026-08-24T10:00:00.000Z"
    }
  ]
}
```

#### GET /api/institutions/:id
**Purpose:** Get single institution with counts  
**Access:** Public  
**Authentication:** None required

**Request:**
```http
GET /api/institutions/uuid-here
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "name_en": "Commercial Bank of Ethiopia",
    "name_am": "የኢትዮጵያ ንግድ ባንክ",
    "code": "CBE",
    "description": "Leading commercial bank in Ethiopia",
    "logo_url": "https://example.com/logo.png",
    "website_url": "https://combanketh.et",
    "phone": "+251911234567",
    "email": "info@combanketh.et",
    "address": "Main Street, Addis Ababa",
    "status": "ACTIVE",
    "services_count": 15,
    "users_count": 23,
    "created_at": "2026-01-01T00:00:00.000Z",
    "updated_at": "2026-08-24T10:00:00.000Z"
  }
}
```

#### POST /api/institutions
**Purpose:** Create new institution  
**Access:** SUPER_ADMIN, MESOB_MANAGER  
**Authentication:** Required

**Request:**
```json
{
  "name_en": "New Institution",
  "name_am": "አዲስ ተቋም",
  "code": "NIN",
  "description": "Institution description",
  "logo_url": "https://example.com/logo.png",
  "website_url": "https://institution.et",
  "phone": "+251911234567",
  "email": "info@institution.et",
  "address": "Address here"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Institution created successfully",
  "data": {
    "institution": {
      "id": "uuid",
      "name_en": "New Institution",
      "code": "NIN",
      "status": "ACTIVE"
    }
  }
}
```

#### PATCH /api/institutions/:id
**Purpose:** Update institution  
**Access:** Admin  
**Authentication:** Required

#### DELETE /api/institutions/:id
**Purpose:** Delete institution  
**Access:** SUPER_ADMIN  
**Authentication:** Required

---

### 5. SERVICES (5 endpoints)

#### GET /api/services
**Purpose:** List all services  
**Access:** Public  
**Authentication:** None required

**Query Parameters:**
- `institution_id` (optional): Filter by institution
- `status` (optional): ACTIVE or INACTIVE

**Request:**
```http
GET /api/services?institution_id=uuid&status=ACTIVE
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "institution_id": "uuid",
      "name_en": "Account Opening",
      "name_am": "ሂሳብ መክፈቻ",
      "description_en": "Open a new bank account",
      "description_am": "አዲስ የባንክ ሂሳብ ይክፈቱ",
      "processing_time": "25 minutes",
      "fee": "None",
      "status": "ACTIVE",
      "created_at": "2026-01-01T00:00:00.000Z"
    }
  ]
}
```

#### GET /api/services/:id
**Purpose:** Get service with requirements  
**Access:** Public  
**Authentication:** None required

**Response:**
```json
{
  "success": true,
  "data": {
    "service": {
      "id": "uuid",
      "name_en": "Account Opening",
      "processing_time": "25 minutes",
      "fee": "None"
    },
    "requirements": [
      {
        "id": "uuid",
        "requirement_en": "Valid Identification",
        "requirement_am": "ትክክለኛ መታወቂያ",
        "is_mandatory": true
      }
    ]
  }
}
```

#### POST /api/services
**Purpose:** Create new service  
**Access:** Admin  
**Authentication:** Required

#### PATCH /api/services/:id
**Purpose:** Update service  
**Access:** Admin  
**Authentication:** Required

#### DELETE /api/services/:id
**Purpose:** Delete service  
**Access:** Admin  
**Authentication:** Required

---

### 6. SEARCH (1 endpoint)

#### GET /api/search
**Purpose:** Multi-entity search  
**Access:** Public  
**Authentication:** None required

**Query Parameters:**
- `q` (required): Search query (min 2 characters)

**Request:**
```http
GET /api/search?q=bank
```

**Response:**
```json
{
  "success": true,
  "data": {
    "institutions": [
      {
        "id": "uuid",
        "name_en": "Commercial Bank of Ethiopia",
        "name_am": "የኢትዮጵያ ንግድ ባንክ",
        "code": "CBE"
      }
    ],
    "services": [
      {
        "id": "uuid",
        "name_en": "Mobile Banking",
        "institution_name": "Commercial Bank of Ethiopia",
        "processing_time": "5 minutes",
        "fee": "None"
      }
    ],
    "requirements": []
  }
}
```

---

### 7. QUEUE MANAGEMENT (6 endpoints)

#### POST /api/queues/join
**Purpose:** Citizen joins queue  
**Access:** CITIZEN only  
**Authentication:** Required

**Request:**
```json
{
  "service_id": "uuid",
  "institution_id": "uuid",
  "priority": "NORMAL",
  "notes": "Optional notes"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Successfully joined queue",
  "data": {
    "queue_entry": {
      "id": "uuid",
      "queue_number": "CBE-001",
      "citizen_id": "uuid",
      "service_id": "uuid",
      "institution_id": "uuid",
      "status": "PENDING",
      "priority": "NORMAL",
      "position": 5,
      "estimated_wait_minutes": 25,
      "created_at": "2026-08-24T12:30:00.000Z"
    }
  }
}
```

#### GET /api/queues
**Purpose:** List queues (role-filtered)  
**Access:** Private (authenticated)  
**Authentication:** Required

**Query Parameters:**
- `status` (optional): PENDING, IN_PROGRESS, COMPLETED, CANCELLED
- `institution_id` (optional): Filter by institution

**Request:**
```http
GET /api/queues?status=PENDING&institution_id=uuid
Authorization: Bearer {token}
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "queue_number": "CBE-001",
      "citizen_name": "John Doe",
      "service_name": "Account Opening",
      "status": "PENDING",
      "priority": "NORMAL",
      "created_at": "2026-08-24T12:30:00.000Z"
    }
  ]
}
```

#### GET /api/queues/:id
**Purpose:** Get queue details  
**Access:** Private  
**Authentication:** Required

#### POST /api/queues/call-next
**Purpose:** Employee calls next person  
**Access:** EMPLOYEE, INSTITUTION_MANAGER  
**Authentication:** Required

**Request:**
```json
{
  "institution_id": "uuid",
  "service_id": "uuid"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Next person called",
  "data": {
    "queue_entry": {
      "id": "uuid",
      "queue_number": "CBE-001",
      "citizen_name": "John Doe",
      "status": "IN_PROGRESS",
      "called_at": "2026-08-24T13:00:00.000Z"
    }
  }
}
```

#### PATCH /api/queues/:id/status
**Purpose:** Update queue status  
**Access:** EMPLOYEE, INSTITUTION_MANAGER  
**Authentication:** Required

**Request:**
```json
{
  "status": "COMPLETED",
  "notes": "Service completed successfully"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Queue status updated",
  "data": {
    "queue": {
      "id": "uuid",
      "status": "COMPLETED",
      "completed_at": "2026-08-24T13:15:00.000Z"
    }
  }
}
```

#### GET /api/queues/:id/status
**Purpose:** Get queue status (public)  
**Access:** Public (optional auth)  
**Authentication:** Optional

**Response:**
```json
{
  "success": true,
  "data": {
    "queue_number": "CBE-001",
    "status": "PENDING",
    "position": 5,
    "estimated_wait_minutes": 25,
    "current_serving": "CBE-000"
  }
}
```

---

### 8. APPLICATION TRACKING (5 endpoints)

#### POST /api/applications
**Purpose:** Submit new application  
**Access:** CITIZEN  
**Authentication:** Required

**Request:**
```json
{
  "service_id": "uuid",
  "institution_id": "uuid",
  "details": {
    "full_name": "John Doe",
    "phone": "0912345678",
    "additional_info": "..."
  },
  "documents": [
    {
      "name": "National ID",
      "file_url": "https://storage.example.com/doc1.pdf"
    }
  ]
}
```

**Response:**
```json
{
  "success": true,
  "message": "Application submitted successfully",
  "data": {
    "application": {
      "id": "uuid",
      "application_number": "APP-2026-001234",
      "service_name": "Account Opening",
      "institution_name": "Commercial Bank of Ethiopia",
      "status": "SUBMITTED",
      "submitted_at": "2026-08-24T12:30:00.000Z"
    }
  }
}
```

#### GET /api/applications
**Purpose:** List applications (filtered by role)  
**Access:** Private  
**Authentication:** Required

**Query Parameters:**
- `status` (optional)
- `citizen_id` (optional)
- `institution_id` (optional)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "application_number": "APP-2026-001234",
      "citizen_name": "John Doe",
      "service_name": "Account Opening",
      "institution_name": "Commercial Bank of Ethiopia",
      "status": "SUBMITTED",
      "submitted_at": "2026-08-24T12:30:00.000Z"
    }
  ]
}
```

#### GET /api/applications/:id
**Purpose:** Get application details  
**Access:** Private  
**Authentication:** Required

**Response:**
```json
{
  "success": true,
  "data": {
    "application": {
      "id": "uuid",
      "application_number": "APP-2026-001234",
      "citizen_name": "John Doe",
      "service_name": "Account Opening",
      "status": "UNDER_REVIEW",
      "details": {},
      "submitted_at": "2026-08-24T12:30:00.000Z",
      "updated_at": "2026-08-24T13:00:00.000Z"
    },
    "documents": [
      {
        "name": "National ID",
        "file_url": "https://storage.example.com/doc1.pdf",
        "uploaded_at": "2026-08-24T12:30:00.000Z"
      }
    ],
    "history": [
      {
        "status": "SUBMITTED",
        "changed_at": "2026-08-24T12:30:00.000Z",
        "changed_by": "System"
      },
      {
        "status": "UNDER_REVIEW",
        "changed_at": "2026-08-24T13:00:00.000Z",
        "changed_by": "Employee Name"
      }
    ]
  }
}
```

#### PATCH /api/applications/:id/status
**Purpose:** Update application status  
**Access:** EMPLOYEE, INSTITUTION_MANAGER  
**Authentication:** Required

**Request:**
```json
{
  "status": "APPROVED",
  "notes": "Application approved. Please collect your documents."
}
```

**Response:**
```json
{
  "success": true,
  "message": "Application status updated",
  "data": {
    "application": {
      "id": "uuid",
      "status": "APPROVED",
      "updated_at": "2026-08-24T14:00:00.000Z"
    }
  }
}
```

#### PATCH /api/applications/:id/assign
**Purpose:** Assign application to employee  
**Access:** INSTITUTION_MANAGER  
**Authentication:** Required

**Request:**
```json
{
  "employee_id": "uuid"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Application assigned successfully",
  "data": {
    "application": {
      "id": "uuid",
      "assigned_to": "uuid",
      "assigned_to_name": "Employee Name"
    }
  }
}
```

---

### 9. MAINTENANCE (6 endpoints)

#### POST /api/maintenance/reports
**Purpose:** Create maintenance report  
**Access:** EMPLOYEE, ICT_STAFF, INSTITUTION_MANAGER  
**Authentication:** Required

**Request:**
```json
{
  "title": "Printer not working",
  "description": "The printer in room 203 is not responding",
  "priority": "HIGH",
  "institution_id": "uuid",
  "location": "Room 203",
  "attachments": []
}
```

**Response:**
```json
{
  "success": true,
  "message": "Maintenance report created",
  "data": {
    "report": {
      "id": "uuid",
      "report_number": "MR-2026-00123",
      "title": "Printer not working",
      "status": "REPORTED",
      "priority": "HIGH",
      "created_at": "2026-08-24T12:30:00.000Z"
    }
  }
}
```

#### GET /api/maintenance/reports
**Purpose:** List maintenance reports  
**Access:** Private  
**Authentication:** Required

**Query Parameters:**
- `status` (optional)
- `institution_id` (optional)
- `reported_by` (optional)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "report_number": "MR-2026-00123",
      "title": "Printer not working",
      "status": "ASSIGNED",
      "priority": "HIGH",
      "reported_by_name": "Employee Name",
      "created_at": "2026-08-24T12:30:00.000Z"
    }
  ]
}
```

#### GET /api/maintenance/reports/:id
**Purpose:** Get report details  
**Access:** Private  
**Authentication:** Required

#### POST /api/maintenance/reports/:id/assign
**Purpose:** Assign report to ICT staff  
**Access:** INSTITUTION_MANAGER  
**Authentication:** Required

**Request:**
```json
{
  "ict_staff_id": "uuid",
  "notes": "Please handle this urgently"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Task assigned to ICT staff",
  "data": {
    "task": {
      "id": "uuid",
      "report_id": "uuid",
      "assigned_to": "uuid",
      "assigned_to_name": "ICT Staff Name",
      "status": "ASSIGNED"
    }
  }
}
```

#### GET /api/maintenance/my-tasks
**Purpose:** Get ICT staff's tasks  
**Access:** ICT_STAFF  
**Authentication:** Required

**Query Parameters:**
- `status` (optional)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "report_number": "MR-2026-00123",
      "title": "Printer not working",
      "status": "IN_PROGRESS",
      "priority": "HIGH",
      "assigned_at": "2026-08-24T13:00:00.000Z"
    }
  ]
}
```

#### PATCH /api/maintenance/tasks/:id/status
**Purpose:** Update task status  
**Access:** ICT_STAFF  
**Authentication:** Required

**Request:**
```json
{
  "status": "RESOLVED",
  "notes": "Replaced printer cartridge",
  "resolution": "Printer is now working. Replaced empty cartridge with new one."
}
```

**Response:**
```json
{
  "success": true,
  "message": "Task status updated",
  "data": {
    "task": {
      "id": "uuid",
      "status": "RESOLVED",
      "resolved_at": "2026-08-24T14:00:00.000Z"
    }
  }
}
```

---

### 10. ANNOUNCEMENTS (4 endpoints)

#### GET /api/announcements
**Purpose:** List announcements  
**Access:** Public (with optional auth for filtering)  
**Authentication:** Optional

**Query Parameters:**
- `scope` (optional): SYSTEM, INSTITUTION, ROLE, PUBLIC
- `institution_id` (optional)
- `is_active` (optional): true/false

**Request:**
```http
GET /api/announcements?scope=SYSTEM&is_active=true
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "title": "System Maintenance Scheduled",
      "body": "System maintenance is scheduled for Saturday...",
      "scope": "SYSTEM",
      "institution_id": null,
      "target_role": null,
      "is_active": true,
      "published_at": "2026-08-24T10:00:00.000Z",
      "created_by_name": "System Admin"
    }
  ]
}
```

#### GET /api/announcements/:id
**Purpose:** Get announcement details  
**Access:** Public  
**Authentication:** Optional

#### POST /api/announcements
**Purpose:** Create announcement  
**Access:** SUPER_ADMIN, MESOB_MANAGER, INSTITUTION_MANAGER  
**Authentication:** Required

**Request:**
```json
{
  "title": "New Service Available",
  "body": "We are pleased to announce...",
  "scope": "INSTITUTION",
  "institution_id": "uuid",
  "target_role": null,
  "scheduled_at": "2026-08-25T09:00:00.000Z"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Announcement created",
  "data": {
    "announcement": {
      "id": "uuid",
      "title": "New Service Available",
      "scope": "INSTITUTION",
      "is_active": false,
      "created_at": "2026-08-24T12:30:00.000Z"
    }
  }
}
```

#### POST /api/announcements/:id/publish
**Purpose:** Publish announcement  
**Access:** Admin  
**Authentication:** Required

#### PATCH /api/announcements/:id
**Purpose:** Update announcement  
**Access:** Admin  
**Authentication:** Required

---

### 11. NOTIFICATIONS (4 endpoints)

#### GET /api/notifications
**Purpose:** Get user's notifications  
**Access:** Private  
**Authentication:** Required

**Query Parameters:**
- `is_read` (optional): true/false
- `type` (optional): APPLICATION_UPDATE, QUEUE_ASSIGNMENT, etc.
- `limit` (optional): Number of results

**Request:**
```http
GET /api/notifications?is_read=false&limit=20
Authorization: Bearer {token}
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "type": "QUEUE_ASSIGNMENT",
      "title": "Your turn in queue",
      "message": "Queue number CBE-001 is now being called",
      "is_read": false,
      "related_entity_type": "queue",
      "related_entity_id": "uuid",
      "created_at": "2026-08-24T13:00:00.000Z"
    }
  ]
}
```

#### GET /api/notifications/unread-count
**Purpose:** Get unread notification count  
**Access:** Private  
**Authentication:** Required

**Response:**
```json
{
  "success": true,
  "data": {
    "count": 5
  }
}
```

#### PATCH /api/notifications/:id/read
**Purpose:** Mark notification as read  
**Access:** Private  
**Authentication:** Required

**Response:**
```json
{
  "success": true,
  "message": "Notification marked as read"
}
```

#### PATCH /api/notifications/read-all
**Purpose:** Mark all as read  
**Access:** Private  
**Authentication:** Required

**Response:**
```json
{
  "success": true,
  "message": "All notifications marked as read"
}
```

---

### 12. DASHBOARDS (1 endpoint)

#### GET /api/dashboards/me
**Purpose:** Get role-specific dashboard data  
**Access:** Private  
**Authentication:** Required

**Response (varies by role):**

**For CITIZEN:**
```json
{
  "success": true,
  "data": {
    "stats": {
      "active_applications": 2,
      "completed_applications": 5,
      "active_queues": 1
    },
    "recent_applications": [],
    "active_queues": [],
    "recent_notifications": []
  }
}
```

**For EMPLOYEE:**
```json
{
  "success": true,
  "data": {
    "stats": {
      "my_queue_count": 5,
      "processed_today": 12,
      "pending_applications": 8
    },
    "current_queue": [],
    "pending_applications": []
  }
}
```

---

## 🔒 RBAC Matrix

| Endpoint | SUPER_ADMIN | MESOB_MANAGER | INSTITUTION_MANAGER | EMPLOYEE | ICT_STAFF | CITIZEN |
|----------|-------------|---------------|---------------------|----------|-----------|---------|
| POST /auth/login | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| GET /users | ✅ | ✅ | ✅ (own inst) | ❌ | ❌ | ❌ |
| POST /users | ✅ | ✅ | ✅ (emp/ict only) | ❌ | ❌ | ❌ |
| DELETE /users | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| POST /institutions | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| POST /queues/join | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |
| POST /queues/call-next | ❌ | ❌ | ✅ | ✅ | ❌ | ❌ |
| POST /applications | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |
| PATCH /applications/:id/status | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |
| POST /maintenance/reports | ❌ | ❌ | ✅ | ✅ | ✅ | ❌ |
| GET /maintenance/my-tasks | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ |
| POST /announcements | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |

---

## 📝 Error Response Format

All errors follow this format:

```json
{
  "success": false,
  "message": "Error description here",
  "errors": [] // Optional validation errors
}
```

**Common HTTP Status Codes:**
- `200` - Success
- `201` - Created
- `400` - Bad Request (validation error)
- `401` - Unauthorized (no token or invalid token)
- `403` - Forbidden (no permission)
- `404` - Not Found
- `500` - Server Error

---

**Document Version:** 1.0.0  
**Last Updated:** August 24, 2026  
**Status:** Complete - Ready for Integration
