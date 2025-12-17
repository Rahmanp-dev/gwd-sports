import { Router, Express } from 'express';
import userRoutes from './user/api';
import adminRoutes from './admin/api';
import eventRoutes from './event/api';
import studentRoutes from './student/api';
import trainerRoutes from './trainer/api';
import academyRoutes from './academy/api';
import homepageRouter from "./homepage/api";
import { generalLimiter, authLimiter, adminLimiter } from '../middleware/rateLimiter';

export const setupRoutes = (app: Express) => {
  // Apply general rate limiting
  app.use('/api', generalLimiter);
  
  // Main API route
  const apiRouter = Router();
  
  // Apply specific rate limiters
  apiRouter.use('/user', authLimiter, userRoutes);
  apiRouter.use('/admin', adminLimiter, adminRoutes);
  apiRouter.use('/events', eventRoutes);
  apiRouter.use('/student', studentRoutes);
  apiRouter.use('/trainer', trainerRoutes);
  apiRouter.use('/academy', academyRoutes);
  apiRouter.use("/homepage", homepageRouter);
  
  // Mount the API router
  app.use('/api', apiRouter);
  
  // Health check route
  app.get('/health', (req, res) => {
    res.json({ 
      success: true, 
      message: 'API Server is healthy',
      timestamp: new Date().toISOString()
    });
  });
  
  // Home route
  app.get('/', (req, res) => {
    res.json({ 
      success: true, 
      message: 'MasterGrade Website API Server',
      version: '1.0.0'
    });
  });
  
  // 404 handler
  app.use('*', (req, res) => {
    res.status(404).json({
      success: false,
      message: 'Route not found'
    });
  });
};