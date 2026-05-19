import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import config from './config/env';
import { setupRoutes } from './routers/index';
import errorHandler from './middleware/errorHandler';
import { connectToDatabase } from './config/db';
import { logger } from './utils/logger';

const app = express();
const PORT = config.PORT || 3000;

// Trust the reverse proxy (required for Railway load balancer so rate limiter tracks real client IPs)
app.set('trust proxy', 1);

// CORS Configuration
const getAllowedOrigins = () => {
  if (config.NODE_ENV === 'production') {
    const origins = [
      'https://mastergrade-production.up.railway.app',
      'https://gwd-spm-production.up.railway.app',
      'https://gwdspm.up.railway.app',
    ];
    // Allow custom CORS_ORIGIN from env
    if (process.env.CORS_ORIGIN) {
      origins.push(...process.env.CORS_ORIGIN.split(',').map(o => o.trim()));
    }
    return origins;
  }
  return ['http://localhost:5173', 'http://127.0.0.1:5173', 'http://localhost:3000'];
};

const corsOptions = {
  origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
    const allowed = getAllowedOrigins();
    // Allow requests with no origin (mobile apps, curl, etc.)
    if (!origin) return callback(null, true);
    // Check exact match or any *.railway.app subdomain in production
    if (allowed.includes(origin) || /\.railway\.app$/.test(origin)) {
      return callback(null, true);
    }
    callback(null, false);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposedHeaders: ['Set-Cookie'],
  optionsSuccessStatus: 200
};

// Middleware
app.use(cors(corsOptions));
// Handle preflight requests
app.options('*', cors(corsOptions));
// Security middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Connect to the database and start server
const startServer = async () => {
    try {
        await connectToDatabase();
        
        // Setup routes
        setupRoutes(app);

        // Error handling middleware
        app.use(errorHandler);
        
        // Start the server
        app.listen(PORT, () => {
            logger.info(`Server is running on http://localhost:${PORT}`);
        });
    } catch (error) {
        logger.error(`Failed to start server: ${error instanceof Error ? error.message : String(error)}`);
        process.exit(1);
    }
};

startServer();