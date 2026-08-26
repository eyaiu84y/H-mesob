# 🚀 Quick Start Guide

## Step 1: Configure Environment

Edit the `.env` file and add your Supabase credentials:

```bash
# Get these from your Supabase project settings
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

**Where to find these:**
1. Go to https://supabase.com/dashboard
2. Select your project
3. Go to **Settings** → **API**
4. Copy **Project URL** → paste as `SUPABASE_URL`
5. Copy **service_role** key (under "Project API keys") → paste as `SUPABASE_SERVICE_ROLE_KEY`

⚠️ **IMPORTANT:** Never commit the `.env` file or expose the service_role key to the frontend!

## Step 2: Start the Server

```bash
npm start
```

Or for development with auto-restart:
```bash
npm run dev
```

## Step 3: Test the Health Check

Open your browser and visit:
```
http://localhost:5000/api/health
```

Or use curl:
```bash
curl http://localhost:5000/api/health
```

## Expected Response

If everything is configured correctly, you should see:

```json
{
  "success": true,
  "status": "healthy",
  "message": "Hawassa MESOB Backend is running",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "uptime": 5.123,
  "responseTime": "12ms",
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

## Troubleshooting

### Error: "Missing Supabase configuration"
- Make sure you've edited `.env` with your actual Supabase credentials
- Check that the `.env` file is in the `backend/` directory
- Verify your Supabase URL and service_role key are correct

### Database status shows "degraded"
- Verify your Supabase project is active
- Check your internet connection
- Confirm the service_role key has the correct permissions

### Port already in use
- Change the `PORT` in `.env` to a different port (e.g., 5001)
- Or stop the process using port 5000

## Next Steps

Once the health check passes:
1. ✅ Backend foundation is working
2. ⏳ Database schemas will be created in the next phase
3. ⏳ Authentication endpoints will be added
4. ⏳ Business logic will be implemented

---

For detailed documentation, see [README.md](./README.md)
