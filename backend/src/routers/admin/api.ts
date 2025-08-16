import { Router } from 'express';
import { AdminUserController } from '../../controllers/admin';
import { EventController } from '../../controllers/event';
import { authMiddleware, adminMiddleware } from '../../middleware/auth';
import { 
  validateCreateUser, 
  validateUpdateUser, 
  validateUserId,
  validatePagination 
} from '../../middleware/validation';
// event middlewares
import { 
  validateCreateEvent, 
  validateUpdateEvent, 
  validateEventId,
  validateEventPagination 
} from '../../middleware/validations/eventValidation';

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

// Event management routes
router.get('/events', validateEventPagination, EventController.getAllEvents);
router.get('/events/:id', validateEventId, EventController.getEventById);
router.post('/events', validateCreateEvent, EventController.createEvent);
router.put('/events/:id', validateUpdateEvent, EventController.updateEvent);
router.delete('/events/:id', validateEventId, EventController.deleteEvent);
router.get('/events/stats', EventController.getEventStats);

export default router;