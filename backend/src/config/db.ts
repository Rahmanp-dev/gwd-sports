import mongoose from 'mongoose';
import config from './env';
import { logger } from '../utils/logger';

export const connectToDatabase = async () => {
    try {
        const uri = config.DB_URI;
        logger.info(`Connecting to MongoDB at ${uri.replace(/\/\/([^:]+):([^@]+)@/, '//***:***@')}`);
        
        await mongoose.connect(uri, {
            dbName: config.DB_NAME,
        });
        
        logger.info(`Successfully connected to MongoDB: ${config.DB_NAME}`);
    } catch (error) {
        logger.error(`Failed to connect to MongoDB: ${error instanceof Error ? error.message : String(error)}`);
        throw error;
    }
};

export const closeDatabaseConnection = async () => {
    try {
        await mongoose.connection.close();
        logger.info('MongoDB connection closed');
    } catch (error) {
        logger.error(`Error closing MongoDB connection: ${error instanceof Error ? error.message : String(error)}`);
        throw error;
    }
};