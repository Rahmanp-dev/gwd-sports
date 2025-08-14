import { Router, Express } from 'express';
import userRoutes from './user/api';
import adminRoutes from './admin/api';

export const setupRoutes = (app: Express) => {
    // Main API route
    const apiRouter = Router();
    
    // Register sub-routes
    apiRouter.use('/user', userRoutes);
    apiRouter.use('/admin', adminRoutes);
    
    // Mount the API router
    app.use('/api', apiRouter);
    
    // Home route
    app.get('/', (req, res) => {
        res.json({ message: 'API Server is running' });
    });
};