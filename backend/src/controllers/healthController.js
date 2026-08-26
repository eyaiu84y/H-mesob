import { checkSupabaseConnection } from '../config/supabase.js';
import { config } from '../config/environment.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import {
  testDatabaseConnection,
  getDatabaseStats,
  verifyDatabaseSchema
} from '../services/databaseService.js';

/**
 * Health check controller
 * GET /api/health
 */
export const getHealth = asyncHandler(async (req, res) => {
  const startTime = Date.now();

  // Check Supabase connection
  const connectionTest = await testDatabaseConnection();

  // Get database stats if connected
  let dbStats = null;
  let schemaVerification = null;

  if (connectionTest.connected && connectionTest.schemaExists) {
    try {
      [dbStats, schemaVerification] = await Promise.all([
        getDatabaseStats(),
        verifyDatabaseSchema()
      ]);
    } catch (error) {
      console.error('Error fetching database stats:', error);
    }
  }

  const healthStatus = {
    success: true,
    status: connectionTest.connected ? 'healthy' : 'degraded',
    message: 'Hawassa MESOB Backend is running',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    responseTime: `${Date.now() - startTime}ms`,
    environment: config.nodeEnv,
    version: '1.0.0',
    services: {
      api: {
        status: 'operational',
        message: 'API server is running'
      },
      database: {
        status: connectionTest.connected ? 'operational' : 'degraded',
        message: connectionTest.message,
        provider: 'Supabase PostgreSQL',
        connected: connectionTest.connected,
        schemaExists: connectionTest.schemaExists
      }
    }
  };

  // Add database statistics if available
  if (dbStats) {
    healthStatus.services.database.stats = {
      tables: dbStats.tableCount,
      institutions: dbStats.institutionCount
    };
  }

  // Add schema verification if available
  if (schemaVerification) {
    healthStatus.services.database.schema = {
      verified: schemaVerification.passed,
      tablesPresent: schemaVerification.tables.allPresent,
      institutionsCorrect: schemaVerification.institutions.correct
    };
  }

  // If Supabase is not connected, return 503 Service Unavailable
  if (!connectionTest.connected) {
    healthStatus.status = 'degraded';
    return res.status(503).json(healthStatus);
  }

  // If schema doesn't exist, return 503 with warning
  if (!connectionTest.schemaExists) {
    healthStatus.status = 'degraded';
    healthStatus.services.database.status = 'degraded';
    healthStatus.services.database.warning = 'Database schema not found. Please run migrations.';
    return res.status(503).json(healthStatus);
  }

  res.status(200).json(healthStatus);
});

export default { getHealth };
