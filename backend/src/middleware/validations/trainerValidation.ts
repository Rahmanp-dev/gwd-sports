import { body, param, query } from 'express-validator';

export const validateCreateTrainerProfile = [
  body('userId')
    .isMongoId()
    .withMessage('Invalid user ID'),
  body('sports')
    .isArray({ min: 1 })
    .withMessage('Sports must be an array with at least one sport'),
  body('sports.*')
    .isString()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Each sport must be between 2 and 50 characters'),
  body('specializations')
    .optional()
    .isArray()
    .withMessage('Specializations must be an array'),
  body('specializations.*')
    .optional()
    .isString()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Each specialization must be between 2 and 100 characters'),
  body('qualifications')
    .optional()
    .isArray()
    .withMessage('Qualifications must be an array'),
  body('qualifications.*.certification')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Certification name must be between 2 and 100 characters'),
  body('qualifications.*.issuedBy')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Issued by must be between 2 and 100 characters'),
  body('qualifications.*.issuedDate')
    .optional()
    .isISO8601()
    .withMessage('Issued date must be a valid date'),
  body('qualifications.*.expiryDate')
    .optional()
    .isISO8601()
    .withMessage('Expiry date must be a valid date'),
  body('qualifications.*.certificateUrl')
    .optional()
    .isURL()
    .withMessage('Certificate URL must be valid'),
  body('experience')
    .optional()
    .isArray()
    .withMessage('Experience must be an array'),
  body('experience.*.organization')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Organization name must be between 2 and 100 characters'),
  body('experience.*.position')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Position must be between 2 and 100 characters'),
  body('experience.*.startDate')
    .optional()
    .isISO8601()
    .withMessage('Start date must be a valid date'),
  body('experience.*.endDate')
    .optional()
    .isISO8601()
    .withMessage('End date must be a valid date'),
  body('experience.*.description')
    .optional()
    .trim()
    .isLength({ min: 10, max: 500 })
    .withMessage('Description must be between 10 and 500 characters'),
  body('hourlyRate')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Hourly rate must be a positive number'),
  body('availability.days')
    .optional()
    .isArray()
    .withMessage('Available days must be an array'),
  body('availability.days.*')
    .optional()
    .isIn(['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'])
    .withMessage('Invalid day of the week'),
  body('availability.timeSlots')
    .optional()
    .isArray()
    .withMessage('Time slots must be an array'),
  body('availability.timeSlots.*.start')
    .optional()
    .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .withMessage('Start time must be in HH:MM format'),
  body('availability.timeSlots.*.end')
    .optional()
    .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .withMessage('End time must be in HH:MM format')
];

export const validateMarkAttendance = [
  body('studentId')
    .isMongoId()
    .withMessage('Invalid student ID'),
  body('date')
    .isISO8601()
    .withMessage('Date must be a valid date'),
  body('present')
    .isBoolean()
    .withMessage('Present must be true or false'),
  body('remarks')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Remarks cannot exceed 500 characters')
];

export const validateAddPerformance = [
  body('studentId')
    .isMongoId()
    .withMessage('Invalid student ID'),
  body('sport')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Sport must be between 2 and 50 characters'),
  body('score')
    .isFloat({ min: 0 })
    .withMessage('Score must be a positive number'),
  body('maxScore')
    .isFloat({ min: 1 })
    .withMessage('Max score must be at least 1'),
  body('remarks')
    .trim()
    .isLength({ min: 5, max: 500 })
    .withMessage('Remarks must be between 5 and 500 characters'),
  body('category')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Category must be between 2 and 50 characters')
];

export const validateAddStudentToTrainer = [
  body('studentId')
    .isMongoId()
    .withMessage('Invalid student ID')
];

export const validateTrainerStudentsQuery = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  query('level')
    .optional()
    .isIn(['beginner', 'intermediate', 'advanced', 'U12', 'U14', 'U16', 'U19', 'U23'])
    .withMessage('Level must be beginner, intermediate, advanced, or U12-U23'),
  query('search')
    .optional()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Search term must be between 1 and 100 characters')
];

export const validateStudentAttendanceParams = [
  param('studentId')
    .isMongoId()
    .withMessage('Invalid student ID'),
  query('fromDate')
    .optional()
    .isISO8601()
    .withMessage('From date must be a valid date'),
  query('toDate')
    .optional()
    .isISO8601()
    .withMessage('To date must be a valid date')
];