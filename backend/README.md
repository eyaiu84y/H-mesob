# Hawassa MESOB Backend API

Backend server for the Hawassa MESOB Public Service Information System.

## 🛠️ Technology Stack

- **Runtime:** Node.js (v18+)
- **Framework:** Express.js
- **Database:** Supabase PostgreSQL
- **Storage:** Supabase Storage
- **Future:** Telegram Bot Integration

## 📁 Project Structure

```
backend/
├── src/
│   ├── config/             # Configuration files
│   │   ├── supabase.js    # Supabase client setup
│   │   └── environment.js # Environment variables
│   ├── controllers/        # Request handlers
│   │   └── healthController.js
│   ├── middleware/         # Express middleware
│   │   ├── corsConfig.js
│   │   ├── errorHandler.js
│   │   └── requestLogger.js
│   ├── routes/            # API route definitions
│   │   ├── index.js
│   │   └── healthRoutes.js
│   ├── services/          # Business logic (future)
│   ├── validators/        # Request validation (future)
│   ├── utils/             # Utility functions (future)
│   ├── integrations/      # External integrations
│   │   └── telegram/      # Telegram bot (future)
│   └── server.js          # Main server file
├── .env                   # Environment variables (create from .env.example)
├── .env.example           # Environment variables template
├── .gitignore            # Git ignore rules
├── package.json          # Dependencies and scripts
└── README.md             # This file
```

## 🚀 Getting Started

### Prerequisites

- Node.js v18 or higher
- npm or yarn
- Supabase account and project

### Installation

1. **Install dependencies:**
   ```bash
   cd backend
   npm install
   ```

2. **Configure environment variables:**
   ```bash
   # Copy the example file
   cp .env.example .env
   
   # Edit .env and add your Supabase credentials
   ```

3. **Required environment variables in `.env`:**
   ```env
   PORT=5000
   NODE_ENV=development
   SUPABASE_URL=your_supabase_project_url
   SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
   FRONTEND_URL=http://localhost:5173
   ```

### Running the Server

**Development mode (with auto-restart):**
```bash
npm run dev
```

**Production mode:**
```bash
npm start
```

The server will start on `http://localhost:5000` (or the PORT specified in .env)

## 🔍 API Endpoints

### Health Check

**GET** `/api/health`

Returns server status and service health information.

**Response:**
```json
{
  "success": true,
  "status": "healthy",
  "message": "Hawassa MESOB Backend is running",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "uptime": 123.456,
  "responseTime": "15ms",
  "environment": "development",
  "version": "1.0.0",
  "services": {
    "api": {
      "status": "operational",
      "message": "API server is running"
    },
    "database": {
      "status": "operational",
      "message": "Supabase connection successful",
      "provider": "Supabase PostgreSQL"
    }
  }
}
```

## 🔒 Security

- **Helmet.js** for security headers
- **CORS** configured for frontend origin only
- **Service Role Key** kept server-side (never exposed to frontend)
- **Request validation** and sanitization (to be implemented)
- **Rate limiting** (to be implemented)

## 🧪 Testing the Server

### Using curl:
```bash
# Test health endpoint
curl http://localhost:5000/api/health
```

### Using browser:
Navigate to: `http://localhost:5000/api/health`

## 📝 Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `PORT` | Server port | No (default: 5000) |
| `NODE_ENV` | Environment mode | No (default: development) |
| `SUPABASE_URL` | Supabase project URL | Yes |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key | Yes |
| `FRONTEND_URL` | Frontend application URL | No (default: http://localhost:5173) |
| `TELEGRAM_BOT_TOKEN` | Telegram bot token | No (future use) |
| `TELEGRAM_CHAT_ID` | Telegram chat ID | No (future use) |

## 🚧 Future Implementation

The following features will be implemented in later phases:

- [ ] Authentication & Authorization (JWT)
- [ ] User Management
- [ ] Institution Management
- [ ] Service Catalogue
- [ ] Application Submission
- [ ] Queue Management
- [ ] Maintenance Workflow
- [ ] Announcements & Notifications
- [ ] Telegram Bot Integration
- [ ] File Upload/Download (Supabase Storage)
- [ ] Analytics & Reporting
- [ ] Email Notifications

## 📦 Dependencies

### Production
- `express` - Web framework
- `@supabase/supabase-js` - Supabase client
- `cors` - CORS middleware
- `dotenv` - Environment variable management
- `morgan` - HTTP request logger
- `helmet` - Security headers

### Development
- `nodemon` - Auto-restart on file changes

## 🤝 Integration with Frontend

The backend is configured to work with the existing React frontend:

- **Default Frontend URL:** `http://localhost:5173`
- **CORS:** Configured to accept requests from frontend
- **API Base URL:** Frontend should use `http://localhost:5000/api`

Update your frontend API client to point to this backend.

## 📞 Support

For issues or questions about the backend, contact the Hawassa MESOB development team.

## 📄 License

ISC License - Hawassa MESOB Team

---

**Note:** This is the initial backend foundation. Authentication, database schemas, and business logic will be implemented in subsequent phases.
