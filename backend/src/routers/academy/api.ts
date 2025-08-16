import { Router } from 'express';
import { AcademyController } from '../../controllers/academy';
import { authMiddleware, adminMiddleware } from '../../middleware/auth';
import { 
  validateCreateAcademy, 
  validateUpdateAcademy, 
  validateAcademyId,
  validateAcademyPagination 
} from '../../middleware/validations/academyValidation';

const router = Router();

// Public routes
router.get('/', validateAcademyPagination, AcademyController.getAllAcademies);
router.get('/:id', validateAcademyId, AcademyController.getAcademyById);

// Admin only routes
router.use(authMiddleware, adminMiddleware);

router.post('/', validateCreateAcademy, AcademyController.createAcademy);
router.put('/:id', validateUpdateAcademy, AcademyController.updateAcademy);
router.delete('/:id', validateAcademyId, AcademyController.deleteAcademy);

export default router;