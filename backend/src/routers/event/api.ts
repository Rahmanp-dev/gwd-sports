import { Router } from 'express';
import { EventController } from '../../controllers/event';
import { authMiddleware, adminMiddleware } from '../../middleware/auth';
import { 
  validateCreateEvent, 
  validateUpdateEvent, 
  validateEventId,
  validateEventPagination 
} from '../../middleware/validations/eventValidation';

const router = Router();

// Public routes (no authentication required)
router.get('/', validateEventPagination, EventController.getAllEvents);
router.get('/:id', validateEventId, EventController.getEventById);

// Protected routes (authentication required)
router.use(authMiddleware);

// User routes
router.post('/:id/join', validateEventId, EventController.joinEvent);
router.delete('/:id/leave', validateEventId, EventController.leaveEvent);
router.get('/user/my-events', EventController.getUserEvents);

// Admin only routes
router.post('/', adminMiddleware, validateCreateEvent, EventController.createEvent);
router.put('/:id', adminMiddleware, validateUpdateEvent, EventController.updateEvent);
router.delete('/:id', adminMiddleware, validateEventId, EventController.deleteEvent);
router.get('/admin/stats', adminMiddleware, EventController.getEventStats);

export default router;