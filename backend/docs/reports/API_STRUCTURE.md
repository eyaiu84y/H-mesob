# 🌐 API Structure

## Current Endpoints

### Root
```
GET /
├── Returns: Welcome message with API info
└── Status: 200 OK
```

### Health Check
```
GET /api/health
├── Returns: Server and service health status
├── Status: 200 OK (healthy) | 503 Service Unavailable (degraded)
└── Response includes:
    ├── Server status
    ├── API service status
    ├── Database connection status
    ├── Uptime
    └── Response time
```

## Future Endpoints (Planned)

### Authentication
```
POST   /api/auth/register        - Register new user
POST   /api/auth/login           - User login
POST   /api/auth/logout          - User logout
POST   /api/auth/refresh         - Refresh access token
GET    /api/auth/me              - Get current user
POST   /api/auth/forgot-password - Request password reset
POST   /api/auth/reset-password  - Reset password
```

### Users
```
GET    /api/users                - List all users (admin)
GET    /api/users/:id            - Get user by ID
PUT    /api/users/:id            - Update user
DELETE /api/users/:id            - Delete user (admin)
PATCH  /api/users/:id/status     - Toggle user status
GET    /api/users/:id/profile    - Get user profile
PUT    /api/users/:id/profile    - Update user profile
```

### Institutions
```
GET    /api/institutions         - List all institutions
GET    /api/institutions/:id     - Get institution by ID
POST   /api/institutions         - Create institution (admin)
PUT    /api/institutions/:id     - Update institution (admin)
DELETE /api/institutions/:id     - Delete institution (admin)
PATCH  /api/institutions/:id/status - Toggle institution status
GET    /api/institutions/:id/services - Get institution services
```

### Services
```
GET    /api/services             - List all services
GET    /api/services/:id         - Get service by ID
POST   /api/services             - Create service (admin)
PUT    /api/services/:id         - Update service (admin)
DELETE /api/services/:id         - Delete service (admin)
GET    /api/services/search      - Search services
```

### Applications
```
GET    /api/applications         - List applications
GET    /api/applications/:id     - Get application by ID
POST   /api/applications         - Submit new application
PUT    /api/applications/:id     - Update application
DELETE /api/applications/:id     - Delete application
PATCH  /api/applications/:id/status - Update application status
GET    /api/applications/:id/documents - Get application documents
POST   /api/applications/:id/documents - Upload document
```

### Queue
```
GET    /api/queue                - Get queue items
GET    /api/queue/:id            - Get queue item by ID
POST   /api/queue                - Add to queue
PATCH  /api/queue/:id/assign     - Assign queue item
PATCH  /api/queue/:id/complete   - Complete queue item
GET    /api/queue/stats          - Get queue statistics
```

### Maintenance
```
GET    /api/maintenance          - List maintenance requests
GET    /api/maintenance/:id      - Get maintenance request
POST   /api/maintenance          - Create maintenance request
PUT    /api/maintenance/:id      - Update maintenance request
PATCH  /api/maintenance/:id/status - Update status
GET    /api/maintenance/stats    - Get maintenance statistics
```

### Announcements
```
GET    /api/announcements        - List announcements
GET    /api/announcements/:id    - Get announcement by ID
POST   /api/announcements        - Create announcement (admin)
PUT    /api/announcements/:id    - Update announcement (admin)
DELETE /api/announcements/:id    - Delete announcement (admin)
PATCH  /api/announcements/:id/read - Mark as read
```

### Notifications
```
GET    /api/notifications        - Get user notifications
GET    /api/notifications/:id    - Get notification by ID
PATCH  /api/notifications/:id/read - Mark as read
PATCH  /api/notifications/read-all - Mark all as read
DELETE /api/notifications/:id    - Delete notification
```

### Reports & Analytics
```
GET    /api/reports/overview     - System overview
GET    /api/reports/users        - User reports
GET    /api/reports/applications - Application reports
GET    /api/reports/queue        - Queue reports
GET    /api/reports/maintenance  - Maintenance reports
GET    /api/analytics/dashboard  - Dashboard analytics
```

### File Upload/Storage
```
POST   /api/upload               - Upload file
GET    /api/files/:id            - Download file
DELETE /api/files/:id            - Delete file
```

## Request/Response Format

### Standard Success Response
```json
{
  "success": true,
  "data": { ... },
  "message": "Operation successful"
}
```

### Standard Error Response
```json
{
  "success": false,
  "error": {
    "message": "Error description",
    "code": "ERROR_CODE"
  }
}
```

### Paginated Response
```json
{
  "success": true,
  "data": [ ... ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "totalPages": 8
  }
}
```

## HTTP Status Codes

| Code | Meaning | Usage |
|------|---------|-------|
| 200 | OK | Successful GET, PUT, PATCH |
| 201 | Created | Successful POST |
| 204 | No Content | Successful DELETE |
| 400 | Bad Request | Invalid request data |
| 401 | Unauthorized | Missing or invalid auth token |
| 403 | Forbidden | Insufficient permissions |
| 404 | Not Found | Resource doesn't exist |
| 409 | Conflict | Resource already exists |
| 422 | Unprocessable Entity | Validation error |
| 500 | Internal Server Error | Server error |
| 503 | Service Unavailable | Service temporarily down |

## Authentication

All protected endpoints require a JWT token in the Authorization header:

```
Authorization: Bearer <jwt_token>
```

## Rate Limiting (Planned)

- General API: 100 requests/minute
- Authentication: 10 requests/minute
- File upload: 20 requests/hour

## CORS

Allowed origins:
- http://localhost:5173 (development)
- http://localhost:3000 (alternative)
- Production frontend URL (to be configured)

Allowed methods:
- GET, POST, PUT, PATCH, DELETE, OPTIONS

## Versioning

Current version: v1.0.0
API prefix: `/api`

Future versions will use: `/api/v2`, `/api/v3`, etc.

---

**Note:** This is the planned API structure. Endpoints will be implemented incrementally in future phases.
