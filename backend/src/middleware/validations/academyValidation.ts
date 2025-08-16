import { body, param, query } from 'express-validator';

export const validateCreateAcademy = [
  body('name')
    .trim()
    .isLength({ min: 3, max: 100 })
    .withMessage('Academy name must be between 3 and 100 characters'),
  body('description')
    .trim()
    .isLength({ min: 10, max: 1000 })
    .withMessage('Description must be between 10 and 1000 characters'),
  body('location')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Location must be between 2 and 100 characters'),
  body('address')
    .trim()
    .isLength({ min: 10, max: 200 })
    .withMessage('Address must be between 10 and 200 characters'),
  body('sports')
    .isArray({ min: 1 })
    .withMessage('Sports must be an array with at least one sport'),
  body('sports.*')
    .isString()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Each sport must be between 2 and 50 characters'),
  body('fees.monthly')
    .isFloat({ min: 0 })
    .withMessage('Monthly fee must be a positive number'),
  body('fees.quarterly')
    .isFloat({ min: 0 })
    .withMessage('Quarterly fee must be a positive number'),
  body('fees.yearly')
    .isFloat({ min: 0 })
    .withMessage('Yearly fee must be a positive number'),
  body('contactInfo.name')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Contact name must be between 2 and 50 characters'),
  body('contactInfo.phone')
    .matches(/^[+]?[\d\s\-\(\)]{10,}$/)
    .withMessage('Contact phone must be valid'),
  body('contactInfo.email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Contact email must be valid'),
  body('facilities')
    .optional()
    .isArray()
    .withMessage('Facilities must be an array'),
  body('facilities.*')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Each facility must be between 2 and 100 characters'),
  body('timings.opening')
    .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .withMessage('Opening time must be in HH:MM format'),
  body('timings.closing')
    .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .withMessage('Closing time must be in HH:MM format'),
  body('timings.workingDays')
    .isArray({ min: 1 })
    .withMessage('Working days must be an array with at least one day'),
  body('timings.workingDays.*')
    .isIn(['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'])
    .withMessage('Invalid working day'),
  body('capacity')
    .isInt({ min: 1 })
    .withMessage('Capacity must be at least 1'),
  body('images')
    .optional()
    .isArray()
    .withMessage('Images must be an array'),
  body('images.*')
    .optional()
    .isURL()
    .withMessage('Each image must be a valid URL')
];

export const validateUpdateAcademy = [
  param('id')
    .isMongoId()
    .withMessage('Invalid academy ID'),
  ...validateCreateAcademy.map(validator => validator.optional())
];

export const validateAcademyId = [
  param('id')
    .isMongoId()
    .withMessage('Invalid academy ID')
];

export const validateAcademyPagination = [
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
    .withMessage('Search term must be between 1 and 100 characters')
];