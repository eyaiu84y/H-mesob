import app from './app.js';
import { config } from './config/environment.js';
import { startEmailWorker, stopEmailWorker } from './services/emailWorker.js';

// ─── Start Local Server ───────────────────────────────────
const PORT = config.port || 5000;

const server = app.listen(PORT, () => {
  console.log('\n╔════════════════════════════════════════════════════════╗');
  console.log('║     🚀 Hawassa MESOB Backend Server Started          ║');
  console.log('╚════════════════════════════════════════════════════════╝\n');
  console.log(`📍 Server running on: http://localhost:${PORT}`);
  console.log(`🌍 Environment: ${config.nodeEnv}`);
  console.log(`🔗 Frontend URL: ${config.frontendUrl}`);
  console.log(`📊 Health Check: http://localhost:${PORT}/api/health`);
  console.log(`\n✅ Server is ready to accept requests\n`);

  // Start asynchronous email outbox background worker
  startEmailWorker();
});

// ─── Graceful Shutdown ─────────────────────────────────────
process.on('SIGTERM', () => {
  console.log('\n⚠️  SIGTERM signal received: closing HTTP server');
  stopEmailWorker();
  server.close(() => process.exit(0));
});

process.on('SIGINT', () => {
  console.log('\n⚠️  SIGINT signal received: closing HTTP server');
  stopEmailWorker();
  server.close(() => process.exit(0));
});

export default app;
