import { Router } from 'express';
import * as userController from '../../controllers/user';
import { validateRequest } from '../../middleware/validateRequest';
import { authMiddleware } from '../../middleware/auth';

const router = Router();

// Public routes
router.post('/login', userController.login);
router.post('/register', userController.register);

// Protected routes - require authentication
router.use(authMiddleware);
router.get('/profile', userController.getProfile);
router.put('/profile', userController.updateProfile);
router.post('/logout', userController.logout);

export default router;