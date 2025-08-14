import { MongoClient } from 'mongodb';
import config from './env';
import { logger } from '../utils/logger';

const uri = config.DB_URI;
let client: MongoClient | undefined;

export const connectToDatabase = async () => {
    try {
        if (!client) {
            logger.info(`Connecting to MongoDB at ${uri.replace(/\/\/([^:]+):([^@]+)@/, '//***:***@')}`);
            client = new MongoClient(uri);
            await client.connect();
            logger.info(`Successfully connected to MongoDB: ${config.DB_NAME}`);
        }
        return client.db(config.DB_NAME);
    } catch (error) {
        logger.error(`Failed to connect to MongoDB: ${error instanceof Error ? error.message : String(error)}`);
        throw error;
    }
};

export const closeDatabaseConnection = async () => {
    try {
        if (client) {
            await client.close();
            client = undefined;
            logger.info('MongoDB connection closed');
        }
    } catch (error) {
        logger.error(`Error closing MongoDB connection: ${error instanceof Error ? error.message : String(error)}`);
        throw error;
    }
};