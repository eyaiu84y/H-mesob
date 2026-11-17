import express from 'express';
import helmet from 'helmet';
import { validateConfig } from './config/environment.js';
import { corsMiddleware } from './middleware/corsConfig.js';
import { requestLogger } from './middleware/requestLogger.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';
import apiRoutes from './routes/index.js';

// Validate environment variables
try {
  validateConfig();
} catch (error) {
  console.error('❌ Configuration Error:', error.message);
  if (!process.env.VERCEL) {
    process.exit(1);
  }
}

// Initialize Express app
const app = express();

// ─── Security Middleware ───────────────────────────────────
app.use(helmet()); // Set security headers

// ─── Request Processing ────────────────────────────────────
app.use(express.json({ limit: '10mb' })); // Parse JSON bodies
app.use(express.urlencoded({ extended: true, limit: '10mb' })); // Parse URL-encoded bodies

// ─── CORS Configuration ────────────────────────────────────
app.use(corsMiddleware);

// ─── Request Logging ───────────────────────────────────────
app.use(requestLogger);

// ─── Root & Convenience Endpoints ─────────────────────────
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Hawassa MESOB Backend API',
    version: '1.0.0',
    documentation: '/api/health',
    timestamp: new Date().toISOString()
  });
});

app.get('/health', (req, res) => {
  res.redirect('/api/health');
});

// ─── API Routes ────────────────────────────────────────────
app.use('/api', apiRoutes);

// ─── 404 Handler ───────────────────────────────────────────
app.use(notFoundHandler);

// ─── Error Handler ─────────────────────────────────────────
app.use(errorHandler);

export default app;
