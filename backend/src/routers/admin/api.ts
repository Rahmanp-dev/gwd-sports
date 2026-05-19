import { Router } from 'express';
import { AdminUserController, AdminStudentController, AdminTrainerController, AdminDashboardController } from '../../controllers/admin';
import { EventController } from '../../controllers/event';
import { TrainerController } from '../../controllers/trainer';
import { getSettings, updateSettings } from '../../controllers/admin/settingsController';
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
import {
  validateUpdateStudent,
  validateUpdateKitStatus,
  validateStudentQuery,
  validateStudentId,
  validateAcademyQuery,
  validateTrainerQuery,
  validateTrainerId
} from '../../middleware/validations/studentvalidation';
// trainer middlewares
import {
  validateCreateTrainerProfile
} from '../../middleware/validations/trainerValidation';

const router = Router();

router.get('/settings', getSettings);

// All admin routes require authentication and admin role
router.use(authMiddleware, adminMiddleware);

// ========================
// DASHBOARD ROUTE
// ========================
router.get('/dashboard', AdminDashboardController.getDashboardStats);
router.get('/finance-analytics', AdminDashboardController.getFinanceAnalytics);

// ========================
// SETTINGS ROUTES
// ========================
router.put('/settings', updateSettings);

// ========================
// EVENT MANAGEMENT ROUTES
// ========================
// Handle all the event management in Events API via Admin Token not here in Admin APIs

// ========================
// USER MANAGEMENT ROUTES
// ========================
router.get('/users', validatePagination, AdminUserController.getAllUsers);
router.get('/users/stats', AdminUserController.getUserStats);
router.get('/users/:id', validateUserId, AdminUserController.getUserById);
router.post('/users', validateCreateUser, AdminUserController.createUser);
router.put('/users/:id', validateUpdateUser, AdminUserController.updateUser);
router.delete('/users/:id', validateUserId, AdminUserController.deleteUser);
router.patch('/users/:id/toggle-status', validateUserId, AdminUserController.toggleUserStatus);

// ========================
// STUDENT MANAGEMENT ROUTES
// ========================
router.get('/students', validateStudentQuery, AdminStudentController.getAllStudents);
router.get('/students/leaderboard', AdminStudentController.getLeaderboard);
router.get('/students/stats', AdminStudentController.getStudentStats);
router.get('/students/:id', validateStudentId, AdminStudentController.getStudentById);
router.put('/students/:id', validateUpdateStudent, AdminStudentController.updateStudent);
router.get('/get-kits', AdminStudentController.getAllKits);
router.put('/students/:studentId/kits/:kitId', validateUpdateKitStatus, AdminStudentController.updateKitStatus);

// ========================
// TRAINER MANAGEMENT ROUTES
// ========================
router.post('/trainers', validateCreateTrainerProfile, TrainerController.createTrainerProfile);
router.get('/trainers', validateTrainerQuery, AdminTrainerController.getAllTrainers);
router.get('/trainers/:id', validateTrainerId, AdminTrainerController.getTrainerById);
router.get('/trainers/stats', AdminTrainerController.getTrainerStats);
router.put('/trainers/:id', validateTrainerId, AdminTrainerController.updateTrainer);
router.delete('/trainers/:id', validateTrainerId, AdminTrainerController.deleteTrainer);

export default router;