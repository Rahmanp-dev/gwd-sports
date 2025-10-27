import { Router } from 'express';
import { UserController } from '../../controllers/user';
import { authMiddleware } from '../../middleware/auth';
import { 
  validateRegister, 
  validateLogin, 
  validateUpdateProfile, 
  validateChangePassword 
} from '../../middleware/validation';

const router = Router();

// Public routes
router.post('/register', validateRegister, UserController.register);
router.post('/login', validateLogin, UserController.login);
router.post('/refresh-token', UserController.refreshToken);

// TODO: can u use rolemiddleware here?
router.get('/:email', UserController.getUserByEmail);

// Protected routes
router.use(authMiddleware);

router.get('/profile', UserController.getProfile);
router.put('/profile', validateUpdateProfile, UserController.updateProfile);
router.put('/change-password', validateChangePassword, UserController.changePassword);
router.post('/logout', UserController.logout);
router.put('/deactivate', UserController.deactivateAccount);

export default router;