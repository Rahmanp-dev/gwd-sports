import { Router } from 'express';
import * as adminController from '../../controllers/admin';
import { authMiddleware, adminMiddleware } from '../../middleware/auth';

const router = Router();

// All admin routes require authentication and admin privileges
router.use(authMiddleware, adminMiddleware);

// Admin routes
router.get('/dashboard', adminController.getDashboard);
router.get('/users', adminController.getUsers);
router.get('/users/:id', adminController.getUserById);
router.put('/users/:id', adminController.updateUser);
router.delete('/users/:id', adminController.deleteUser);

export default router;