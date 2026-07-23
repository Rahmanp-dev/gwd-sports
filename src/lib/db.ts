import mongoose from 'mongoose';
import config from './env';
import { logger } from './logger';

// Pre-register all models to ensure populate() never throws MissingSchemaError
import '@/lib/models/User';
import '@/lib/models/Academy';
import '@/lib/models/Trainer';
import '@/lib/models/Student';
import '@/lib/models/FeePayment';
import '@/lib/models/Event';

declare global {
  var mongoose: { conn: any; promise: any };
}

let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

export const connectToDatabase = async () => {
    if (cached.conn) {
        return cached.conn;
    }

    if (!cached.promise) {
        const uri = config.DB_URI;
        logger.info(`Connecting to MongoDB at ${uri.replace(/\/\/([^:]+):([^@]+)@/, '//***:***@')}`);
        
        cached.promise = mongoose.connect(uri, {
            dbName: config.DB_NAME,
        }).then((mongoose) => {
            logger.info(`Successfully connected to MongoDB: ${config.DB_NAME}`);
            return mongoose;
        }).catch(error => {
            logger.error(`Failed to connect to MongoDB: ${error instanceof Error ? error.message : String(error)}`);
            throw error;
        });
    }
    
    cached.conn = await cached.promise;
    return cached.conn;
};

export const closeDatabaseConnection = async () => {
    try {
        if (cached.conn) {
            await mongoose.connection.close();
            logger.info('MongoDB connection closed');
            cached.conn = null;
            cached.promise = null;
        }
    } catch (error) {
        logger.error(`Error closing MongoDB connection: ${error instanceof Error ? error.message : String(error)}`);
        throw error;
    }
};
