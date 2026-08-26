import morgan from 'morgan';
import { config } from '../config/environment.js';

/**
 * Request logging middleware using morgan
 */

// Custom token for response time in ms
morgan.token('response-time-ms', (req, res) => {
  if (!req._startAt || !res._startAt) {
    return '0';
  }
  const ms = (res._startAt[0] - req._startAt[0]) * 1e3 +
    (res._startAt[1] - req._startAt[1]) * 1e-6;
  return ms.toFixed(2);
});

// Development format - detailed logging
const devFormat = ':method :url :status :response-time-ms ms - :res[content-length]';

// Production format - concise logging
const prodFormat = ':remote-addr - :method :url :status :response-time-ms ms';

// Choose format based on environment
const format = config.nodeEnv === 'development' ? devFormat : prodFormat;

// Create and export the logger
export const requestLogger = morgan(format, {
  skip: (req) => {
    // Skip logging for health check endpoint in production
    return config.nodeEnv === 'production' && req.path === '/api/health';
  }
});

export default requestLogger;
