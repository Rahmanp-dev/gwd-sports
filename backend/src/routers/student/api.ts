import { Router } from 'express';
import { StudentController } from '../../controllers/student';
import { authMiddleware, roleMiddleware } from '../../middleware/auth';
import { 
  validateCreateStudentProfile, 
  validateJoinAcademy, 
  validateRequestKit, 
  validatePayFees,
  validateStudentAttendanceQuery,
  validatePerformanceQuery 
} from '../../middleware/validations/studentvalidation';

const router = Router();

// All student routes require authentication
router.use(authMiddleware);

// Student profile management
router.post('/profile', roleMiddleware(['user', 'student', 'admin']), validateCreateStudentProfile, StudentController.createStudentProfile);
router.get('/profile', roleMiddleware(['student', 'admin']), StudentController.getStudentProfile);

// Academy operations
router.post('/join-academy', roleMiddleware(['student', 'admin']), validateJoinAcademy, StudentController.joinAcademy);

// Attendance
router.get('/attendance', roleMiddleware(['student', 'admin']), validateStudentAttendanceQuery, StudentController.getAttendance);

// Performance
router.get('/performance', roleMiddleware(['student', 'admin']), validatePerformanceQuery, StudentController.getPerformance);

// Kit management
router.post('/request-kit', roleMiddleware(['student', 'admin']), validateRequestKit, StudentController.requestKit);
router.get('/kits', roleMiddleware(['student', 'admin']), StudentController.getKits);

// Fee management
router.post('/pay-fees', roleMiddleware(['student', 'admin']), validatePayFees, StudentController.payFees);

export default router;