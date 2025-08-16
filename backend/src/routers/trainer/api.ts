import { Router } from 'express';
import { TrainerController } from '../../controllers/trainer';
import { authMiddleware, adminMiddleware, roleMiddleware } from '../../middleware/auth';
import { 
  validateCreateTrainerProfile, 
  validateMarkAttendance, 
  validateAddPerformance,
  validateAddStudentToTrainer,
  validateTrainerStudentsQuery,
  validateStudentAttendanceParams 
} from '../../middleware/validations/trainerValidation';

const router = Router();

// All trainer routes require authentication
router.use(authMiddleware);

// Admin only - create trainer profile
router.post('/profile', adminMiddleware, validateCreateTrainerProfile, TrainerController.createTrainerProfile);

// Trainer profile management
router.get('/profile', roleMiddleware(['trainer', 'admin']), TrainerController.getTrainerProfile);

// Student management
router.get('/students', roleMiddleware(['trainer', 'admin']), validateTrainerStudentsQuery, TrainerController.getTrainerStudents);
router.post('/add-student', roleMiddleware(['trainer', 'admin']), validateAddStudentToTrainer, TrainerController.addStudentToTrainer);

// Attendance management
router.post('/mark-attendance', roleMiddleware(['trainer', 'admin']), validateMarkAttendance, TrainerController.markAttendance);
router.get('/student/:studentId/attendance', roleMiddleware(['trainer', 'admin']), validateStudentAttendanceParams, TrainerController.getStudentAttendance);

// Performance management
router.post('/add-performance', roleMiddleware(['trainer', 'admin']), validateAddPerformance, TrainerController.addPerformanceRecord);

export default router;