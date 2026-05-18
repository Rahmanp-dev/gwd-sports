import { body, param, query } from 'express-validator';

export const validateCreateStudentProfile = [
  body('sports')
    .optional()
    .isArray()
    .withMessage('Sports must be an array'),
  body('sports.*')
    .optional()
    .isString()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Each sport must be between 2 and 50 characters'),
  body('level')
    .optional()
    .isIn(['beginner', 'intermediate', 'advanced', 'U12', 'U14', 'U16', 'U19', 'U23'])
    .withMessage('Level must be beginner, intermediate, advanced, or U12-U23'),
  body('medicalInfo.allergies')
    .optional()
    .isArray()
    .withMessage('Allergies must be an array'),
  body('medicalInfo.medications')
    .optional()
    .isArray()
    .withMessage('Medications must be an array'),
  body('medicalInfo.emergencyContact.name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Emergency contact name must be between 2 and 50 characters'),
  body('medicalInfo.emergencyContact.phone')
    .optional()
    .matches(/^[+]?[\d\s\-\(\)]{10,}$/)
    .withMessage('Emergency contact phone must be valid'),
  body('medicalInfo.emergencyContact.relation')
    .optional()
    .trim()
    .isLength({ min: 2, max: 30 })
    .withMessage('Emergency contact relation must be between 2 and 30 characters')
];

export const validateJoinAcademy = [
  body('academyId')
    .isMongoId()
    .withMessage('Invalid academy ID')
];

export const validateRequestKit = [
  body('kitName')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Kit name must be between 2 and 100 characters')
];

export const validatePayFees = [
  body('amount')
    .isFloat({ min: 0.01 })
    .withMessage('Amount must be a positive number'),
  body('period')
    .isIn(['monthly', 'quarterly', 'yearly'])
    .withMessage('Period must be monthly, quarterly, or yearly'),
  body('transactionId')
    .optional()
    .trim()
    .isLength({ min: 5, max: 100 })
    .withMessage('Transaction ID must be between 5 and 100 characters')
];

export const validateStudentAttendanceQuery = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  query('fromDate')
    .optional()
    .isISO8601()
    .withMessage('From date must be a valid date'),
  query('toDate')
    .optional()
    .isISO8601()
    .withMessage('To date must be a valid date')
];

export const validatePerformanceQuery = [
  query('sport')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Sport filter must be between 2 and 50 characters'),
  query('category')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Category filter must be between 2 and 50 characters')
];

export const validateStudentId = [
  param('id')
    .isMongoId()
    .withMessage('Invalid student ID')
];

// Student management validations
export const validateUpdateStudent = [
  param('id')
    .isMongoId()
    .withMessage('Invalid student ID'),
  body('level')
    .optional()
    .isIn(['beginner', 'intermediate', 'advanced', 'U12', 'U14', 'U16', 'U19', 'U23'])
    .withMessage('Level must be beginner, intermediate, advanced, or U12-U23'),
  body('sports')
    .optional()
    .isArray()
    .withMessage('Sports must be an array'),
  body('sports.*')
    .optional()
    .isString()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Each sport must be between 2 and 50 characters'),
  body('trainers')
    .optional()
    .isArray()
    .withMessage('trainers must be an array of ObjectIds'),
  body('academyId')
    .optional()
    .isMongoId()
    .withMessage('Invalid academy ID'),
  body('medicalInfo.allergies')
    .optional()
    .isArray()
    .withMessage('Allergies must be an array'),
  body('medicalInfo.medications')
    .optional()
    .isArray()
    .withMessage('Medications must be an array'),
  body('medicalInfo.emergencyContact.name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Emergency contact name must be between 2 and 50 characters'),
  body('medicalInfo.emergencyContact.phone')
    .optional()
    .matches(/^[+]?[\d\s\-\(\)]{10,}$/)
    .withMessage('Emergency contact phone must be valid'),
  body('medicalInfo.emergencyContact.relation')
    .optional()
    .trim()
    .isLength({ min: 2, max: 30 })
    .withMessage('Emergency contact relation must be between 2 and 30 characters')
];

export const validateUpdateKitStatus = [
  param('studentId')
    .isMongoId()
    .withMessage('Invalid student ID'),
  param('kitId')
    .isMongoId()
    .withMessage('Invalid kit ID'),
  body('status')
    .isIn(['delivered', 'requested', 'processing'])
    .withMessage('Status must be delivered, requested, or processing'),
  body('cost')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Cost must be a positive number')
];

export const validateStudentQuery = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  query('academyId')
    .optional()
    .isMongoId()
    .withMessage('Invalid academy ID'),
  query('trainerId')
    .optional()
    .isMongoId()
    .withMessage('Invalid trainer ID'),
  query('level')
    .optional()
    .isIn(['beginner', 'intermediate', 'advanced', 'U12', 'U14', 'U16', 'U19', 'U23'])
    .withMessage('Level must be beginner, intermediate, advanced, or U12-U23'),
  query('search')
    .optional()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Search term must be between 1 and 100 characters'),
  query('sortBy')
    .optional()
    .isIn(['enrollmentDate', 'level', 'totalFeesPaid', 'createdAt'])
    .withMessage('Invalid sort field'),
  query('sortOrder')
    .optional()
    .isIn(['asc', 'desc'])
    .withMessage('Sort order must be asc or desc')
];

// Academy management validations for admin
export const validateAcademyQuery = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  query('location')
    .optional()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Location filter must be between 1 and 100 characters'),
  query('sport')
    .optional()
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('Sport filter must be between 1 and 50 characters'),
  query('search')
    .optional()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Search term must be between 1 and 100 characters'),
  query('sortBy')
    .optional()
    .isIn(['name', 'location', 'capacity', 'createdAt'])
    .withMessage('Invalid sort field'),
  query('sortOrder')
    .optional()
    .isIn(['asc', 'desc'])
    .withMessage('Sort order must be asc or desc')
];

// Trainer management validations for admin
export const validateTrainerQuery = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  query('academyId')
    .optional()
    .isMongoId()
    .withMessage('Invalid academy ID'),
  query('sport')
    .optional()
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('Sport filter must be between 1 and 50 characters'),
  query('search')
    .optional()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Search term must be between 1 and 100 characters'),
  query('sortBy')
    .optional()
    .isIn(['joinedDate', 'rating.average', 'studentCount', 'createdAt'])
    .withMessage('Invalid sort field'),
  query('sortOrder')
    .optional()
    .isIn(['asc', 'desc'])
    .withMessage('Sort order must be asc or desc')
];

export const validateTrainerId = [
  param('id')
    .isMongoId()
    .withMessage('Invalid trainer ID')
];