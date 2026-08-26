import cors from 'cors';
import { config } from '../config/environment.js';

/**
 * CORS configuration for frontend communication
 */

const corsOptions = {
  origin: (origin, callback) => {
    // Allow requests from frontend or no origin (like mobile apps or curl)
    const allowedOrigins = [
      config.frontendUrl,
      'http://localhost:5173',
      'http://localhost:3000'
    ];

    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true, // Allow cookies and authentication headers
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposedHeaders: ['Content-Range', 'X-Content-Range'],
  maxAge: 86400 // Cache preflight requests for 24 hours
};

export const corsMiddleware = cors(corsOptions);

export default corsMiddleware;
