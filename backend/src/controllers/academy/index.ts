import { Response } from 'express';
import { AuthRequest } from '../../middleware/auth';
import Academy, { IAcademy } from '../../schemas/academySchema';
import { logger } from '../../utils/logger';
import { validationResult } from 'express-validator';
import mongoose from 'mongoose';

export class AcademyController {
  // Create academy (Admin only)
  static async createAcademy(req: AuthRequest, res: Response) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const academyData = {
        ...req.body,
        createdBy: req.user!._id
      };

      const academy = new Academy(academyData);
      await academy.save();

      logger.info(`Academy created: ${academy.name} by ${req.user!.email}`);

      res.status(201).json({
        success: true,
        message: 'Academy created successfully',
        data: { academy }
      });
    } catch (error) {
      logger.error('Create academy error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  // Get all academies
  static async getAllAcademies(req: AuthRequest, res: Response) {
    try {
      const {
        page = 1,
        limit = 10,
        location,
        sport,
        search,
        sortBy = 'name',
        sortOrder = 'asc'
      } = req.query;

      const pageNum = parseInt(page as string);
      const limitNum = parseInt(limit as string);
      const skip = (pageNum - 1) * limitNum;

      const filter: any = { isActive: true };
      
      if (location) filter.location = { $regex: location, $options: 'i' };
      if (sport) filter.sports = { $in: [sport] };
      if (search) {
        filter.$or = [
          { name: { $regex: search, $options: 'i' } },
          { description: { $regex: search, $options: 'i' } },
          { location: { $regex: search, $options: 'i' } }
        ];
      }

      const sort: any = {};
      sort[sortBy as string] = sortOrder === 'desc' ? -1 : 1;

      const [academies, total] = await Promise.all([
        Academy.find(filter)
          .populate('createdBy', 'name email')
          .populate('trainers', 'name email')
          .populate('students', 'name email')
          .sort(sort)
          .skip(skip)
          .limit(limitNum)
          .lean(),
        Academy.countDocuments(filter)
      ]);

      const totalPages = Math.ceil(total / limitNum);

      res.json({
        success: true,
        data: {
          academies,
          pagination: {
            currentPage: pageNum,
            totalPages,
            totalAcademies: total,
            hasNextPage: pageNum < totalPages,
            hasPrevPage: pageNum > 1
          }
        }
      });
    } catch (error) {
      logger.error('Get all academies error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  // Get academy by ID
  static async getAcademyById(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;

      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid academy ID'
        });
      }

      const academy = await Academy.findById(id)
        .populate('createdBy', 'name email')
        .populate('trainers', 'name email phone')
        .populate('students', 'name email phone');

      if (!academy || !academy.isActive) {
        return res.status(404).json({
          success: false,
          message: 'Academy not found'
        });
      }

      res.json({
        success: true,
        data: { academy }
      });
    } catch (error) {
      logger.error('Get academy by ID error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  // Update academy (Admin only)
  static async updateAcademy(req: AuthRequest, res: Response) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const { id } = req.params;
      const updates = req.body;

      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid academy ID'
        });
      }

      delete updates.createdBy;

      const academy = await Academy.findByIdAndUpdate(
        id,
        updates,
        { new: true, runValidators: true }
      ).populate('createdBy', 'name email');

      if (!academy || !academy.isActive) {
        return res.status(404).json({
          success: false,
          message: 'Academy not found'
        });
      }

      logger.info(`Academy updated: ${academy.name} by ${req.user!.email}`);

      res.json({
        success: true,
        message: 'Academy updated successfully',
        data: { academy }
      });
    } catch (error) {
      logger.error('Update academy error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  // Delete academy (Admin only)
  static async deleteAcademy(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;

      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid academy ID'
        });
      }

      const academy = await Academy.findById(id);
      if (!academy || !academy.isActive) {
        return res.status(404).json({
          success: false,
          message: 'Academy not found'
        });
      }

      // Soft delete
      academy.isActive = false;
      await academy.save();

      logger.info(`Academy deleted: ${academy.name} by ${req.user!.email}`);

      res.json({
        success: true,
        message: 'Academy deleted successfully'
      });
    } catch (error) {
      logger.error('Delete academy error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }
}