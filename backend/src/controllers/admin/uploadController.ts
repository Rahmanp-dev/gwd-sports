import { Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { logger } from '../../utils/logger';

// Ensure the directories exist
const uploadHeroDir = path.join(process.cwd(), 'uploads/hero');
if (!fs.existsSync(uploadHeroDir)) {
  fs.mkdirSync(uploadHeroDir, { recursive: true });
}

const uploadLogoDir = path.join(process.cwd(), 'uploads/logo');
if (!fs.existsSync(uploadLogoDir)) {
  fs.mkdirSync(uploadLogoDir, { recursive: true });
}

// Configure multer storage for hero
const heroStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadHeroDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'hero-' + uniqueSuffix + path.extname(file.originalname));
  }
});

// Configure multer storage for logo
const logoStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadLogoDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'logo-' + uniqueSuffix + path.extname(file.originalname));
  }
});

// File filter for images
const fileFilter = (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only JPEG, PNG, WEBP, and GIF are allowed.'));
  }
};

export const upload = multer({
  storage: heroStorage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: fileFilter
});

export const uploadLogoMulter = multer({
  storage: logoStorage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: fileFilter
});

/**
 * Handle multiple hero image uploads
 */
export const uploadHeroImages = (req: Request, res: Response) => {
  try {
    if (!req.files || !Array.isArray(req.files) || req.files.length === 0) {
      return res.status(400).json({ success: false, message: 'No files uploaded' });
    }

    // Generate URLs for the uploaded files
    const fileUrls = (req.files as Express.Multer.File[]).map(file => {
      // Assuming server runs on the same domain in production (e.g., via Railway)
      // or frontend prepends VITE_API_BASE_URL. We return the relative path.
      return `/uploads/hero/${file.filename}`;
    });

    res.status(200).json({
      success: true,
      message: 'Files uploaded successfully',
      data: { urls: fileUrls }
    });
  } catch (error) {
    logger.error('Error uploading hero images:', error);
    res.status(500).json({ success: false, message: 'Server error during file upload' });
  }
};

export const uploadLogoImage = (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded' });
    }

    const fileUrl = `/uploads/logo/${req.file.filename}`;

    res.status(200).json({
      success: true,
      message: 'Logo uploaded successfully',
      data: { url: fileUrl }
    });
  } catch (error) {
    logger.error('Error uploading logo:', error);
    res.status(500).json({ success: false, message: 'Server error during logo upload' });
  }
};
