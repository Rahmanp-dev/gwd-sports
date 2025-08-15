import { Router } from 'express';
import { AdminUserController } from '../../controllers/admin';
import { authMiddleware, adminMiddleware } from '../../middleware/auth';
import { 
  validateCreateUser, 
  validateUpdateUser, 
  validateUserId,
  validatePagination 
} from '../../middleware/validation';

const router = Router();

// All admin routes require authentication and admin role
router.use(authMiddleware, adminMiddleware);

// User management routes
router.get('/users', validatePagination, AdminUserController.getAllUsers);
router.get('/users/stats', AdminUserController.getUserStats);
router.get('/users/:id', validateUserId, AdminUserController.getUserById);
router.post('/users', validateCreateUser, AdminUserController.createUser);
router.put('/users/:id', validateUpdateUser, AdminUserController.updateUser);
router.delete('/users/:id', validateUserId, AdminUserController.deleteUser);
router.patch('/users/:id/toggle-status', validateUserId, AdminUserController.toggleUserStatus);

export default router;