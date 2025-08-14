import express from 'express';
import cors from 'cors';
import config from './config/env';
import { setupRoutes } from './routers/index';
import errorHandler from './middleware/errorHandler';
import { connectToDatabase } from './config/db';
import { logger } from './utils/logger';

const app = express();
const PORT = config.PORT || 3000;

// Middleware
app.use(cors());
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