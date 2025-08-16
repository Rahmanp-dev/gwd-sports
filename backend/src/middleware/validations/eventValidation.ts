import { body, param, query } from 'express-validator';

export const validateCreateEvent = [
  body('name')
    .trim()
    .isLength({ min: 3, max: 100 })
    .withMessage('Event name must be between 3 and 100 characters'),
  body('description')
    .trim()
    .isLength({ min: 10, max: 2000 })
    .withMessage('Description must be between 10 and 2000 characters'),
  body('sport')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Sport must be between 2 and 50 characters'),
  body('startDate')
    .isISO8601()
    .withMessage('Start date must be a valid date')
    .custom((value) => {
      if (new Date(value) <= new Date()) {
        throw new Error('Start date must be in the future');
      }
      return true;
    }),
  body('endDate')
    .optional()
    .isISO8601()
    .withMessage('End date must be a valid date')
    .custom((value, { req }) => {
      if (value && new Date(value) <= new Date(req.body.startDate)) {
        throw new Error('End date must be after start date');
      }
      return true;
    }),
  body('location')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Location must be between 2 and 100 characters'),
  body('venue')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Venue must be between 2 and 100 characters'),
  body('maxParticipants')
    .optional()
    .isInt({ min: 1, max: 10000 })
    .withMessage('Max participants must be between 1 and 10000'),
  body('links')
    .optional()
    .isArray()
    .withMessage('Links must be an array'),
  body('links.*')
    .optional()
    .isURL()
    .withMessage('Each link must be a valid URL'),
  body('images')
    .optional()
    .isArray()
    .withMessage('Images must be an array'),
  body('registrationDeadline')
    .optional()
    .isISO8601()
    .withMessage('Registration deadline must be a valid date'),
  body('entryFee')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Entry fee cannot be negative'),
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
  body('status')
    .optional()
    .isIn(['draft', 'published', 'ongoing', 'completed', 'cancelled'])
    .withMessage('Invalid status'),
  body('isPublic')
    .optional()
    .isBoolean()
    .withMessage('isPublic must be boolean'),
  body('registrationOpen')
    .optional()
    .isBoolean()
    .withMessage('registrationOpen must be boolean'),
  body('tags')
    .optional()
    .isArray()
    .withMessage('Tags must be an array'),
  body('requirements')
    .optional()
    .isLength({ max: 1000 })
    .withMessage('Requirements cannot exceed 1000 characters'),
  body('prizes')
    .optional()
    .isArray()
    .withMessage('Prizes must be an array')
];

export const validateUpdateEvent = [
  param('id')
    .isMongoId()
    .withMessage('Invalid event ID'),
  ...validateCreateEvent.map(validator => validator.optional())
];

export const validateEventId = [
  param('id')
    .isMongoId()
    .withMessage('Invalid event ID')
];

export const validateEventPagination = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  query('sport')
    .optional()
    .trim()
    .isLength({ min: 1 })
    .withMessage('Sport filter cannot be empty'),
  query('status')
    .optional()
    .isIn(['draft', 'published', 'ongoing', 'completed', 'cancelled'])
    .withMessage('Invalid status filter'),
  query('startDate')
    .optional()
    .isISO8601()
    .withMessage('Start date filter must be valid'),
  query('endDate')
    .optional()
    .isISO8601()
    .withMessage('End date filter must be valid')
];