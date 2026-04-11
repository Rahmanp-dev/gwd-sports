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

// CORS Configuration
const corsOptions = {
  origin: config.NODE_ENV === 'production'
    ? ['https://mastergrade-production.up.railway.app']
    : ['http://localhost:5173', 'http://127.0.0.1:5173'],
  credentials: true, // Allow credentials (cookies, authorization headers)
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