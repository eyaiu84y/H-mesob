import express from 'express';
import helmet from 'helmet';
import { config, validateConfig } from './config/environment.js';
import { corsMiddleware } from './middleware/corsConfig.js';
import { requestLogger } from './middleware/requestLogger.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';
import apiRoutes from './routes/index.js';

// Validate environment variables
try {
  validateConfig();
} catch (error) {
  console.error('❌ Configuration Error:', error.message);
  process.exit(1);
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

// ─── Root Endpoint ─────────────────────────────────────────
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Hawassa MESOB Backend API',
    version: '1.0.0',
    documentation: '/api/health',
    timestamp: new Date().toISOString()
  });
});

// ─── API Routes ────────────────────────────────────────────
app.use('/api', apiRoutes);

// ─── 404 Handler ───────────────────────────────────────────
app.use(notFoundHandler);

// ─── Error Handler ─────────────────────────────────────────
app.use(errorHandler);

// ─── Start Server ──────────────────────────────────────────
const PORT = config.port;

if (!process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log('\n╔════════════════════════════════════════════════════════╗');
    console.log('║     🚀 Hawassa MESOB Backend Server Started          ║');
    console.log('╚════════════════════════════════════════════════════════╝\n');
    console.log(`📍 Server running on: http://localhost:${PORT}`);
    console.log(`🌍 Environment: ${config.nodeEnv}`);
    console.log(`🔗 Frontend URL: ${config.frontendUrl}`);
    console.log(`📊 Health Check: http://localhost:${PORT}/api/health`);
    console.log(`\n✅ Server is ready to accept requests\n`);
  });
}

// ─── Graceful Shutdown ─────────────────────────────────────
process.on('SIGTERM', () => {
  console.log('\n⚠️  SIGTERM signal received: closing HTTP server');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('\n⚠️  SIGINT signal received: closing HTTP server');
  process.exit(0);
});

export default app;

