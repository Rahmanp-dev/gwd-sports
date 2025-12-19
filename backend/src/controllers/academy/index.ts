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

      const filter: any = { };
      
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

  // Get academy members (students and trainers)
  static async getAcademyMembers(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;

      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid academy ID'
        });
      }

      const academy = await Academy.findById(id)
        .populate('trainers', 'name email phone sports')
        .populate('students', 'name email phone sports');

      if (!academy || !academy.isActive) {
        return res.status(404).json({
          success: false,
          message: 'Academy not found'
        });
      }

      res.json({
        success: true,
        data: {
          trainers: academy.trainers,
          students: academy.students
        }
      });
    } catch (error) {
      logger.error('Get academy members error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  // Add student to academy (Admin only)
  static async addStudentToAcademy(req: AuthRequest, res: Response) {
    try {
      const { academyId, studentId } = req.body;

      if (!mongoose.Types.ObjectId.isValid(academyId) || !mongoose.Types.ObjectId.isValid(studentId)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid academy or student ID'
        });
      }

      // Import schemas
      const User = (await import('../../schemas/userSchema')).default;
      const StudentProfile = (await import('../../schemas/studentSchema')).default;

      // Check if academy exists
      const academy = await Academy.findById(academyId);
      if (!academy || !academy.isActive) {
        return res.status(404).json({
          success: false,
          message: 'Academy not found'
        });
      }

      // Check academy capacity
      if (academy.students.length >= academy.capacity) {
        return res.status(400).json({
          success: false,
          message: 'Academy is at full capacity'
        });
      }

      // Check if user exists and is a student
      const user = await User.findById(studentId);
      if (!user || user.role !== 'student') {
        return res.status(404).json({
          success: false,
          message: 'Student not found'
        });
      }

      // Check if student is already in academy
      if (academy.students.includes(studentId)) {
        return res.status(400).json({
          success: false,
          message: 'Student is already in this academy'
        });
      }

      // Get or create student profile
      let studentProfile = await StudentProfile.findOne({ userId: studentId });
      if (!studentProfile) {
        studentProfile = new StudentProfile({
          userId: studentId,
          academyId: academyId,
          enrollmentDate: new Date()
        });
      } else {
        // Update existing profile
        studentProfile.academyId = academyId;
        if (!studentProfile.enrollmentDate) {
          studentProfile.enrollmentDate = new Date();
        }
      }

      await studentProfile.save();

      // Add student to academy
      academy.students.push(studentId);
      await academy.save();

      logger.info(`Student ${user.email} added to academy ${academy.name} by ${req.user!.email}`);

      res.json({
        success: true,
        message: 'Student added to academy successfully',
        data: {
          student: user,
          academy: { _id: academy._id, name: academy.name }
        }
      });
    } catch (error) {
      logger.error('Add student to academy error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  // Remove student from academy (Admin only)
  static async removeStudentFromAcademy(req: AuthRequest, res: Response) {
    try {
      const { academyId, studentId } = req.body;

      if (!mongoose.Types.ObjectId.isValid(academyId) || !mongoose.Types.ObjectId.isValid(studentId)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid academy or student ID'
        });
      }

      const StudentProfile = (await import('../../schemas/studentSchema')).default;

      const academy = await Academy.findById(academyId);
      if (!academy || !academy.isActive) {
        return res.status(404).json({
          success: false,
          message: 'Academy not found'
        });
      }

      // Remove student from academy
      academy.students = academy.students.filter(
        (sid: mongoose.Types.ObjectId) => sid.toString() !== studentId
      );
      await academy.save();

      // Update student profile
      await StudentProfile.findOneAndUpdate(
        { userId: studentId },
        { $unset: { academyId: 1 } }
      );

      logger.info(`Student removed from academy ${academy.name} by ${req.user!.email}`);

      res.json({
        success: true,
        message: 'Student removed from academy successfully'
      });
    } catch (error) {
      logger.error('Remove student from academy error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  // Add trainer to academy (Admin only)
  static async addTrainerToAcademy(req: AuthRequest, res: Response) {
    try {
      const { academyId, trainerId } = req.body;

      if (!mongoose.Types.ObjectId.isValid(academyId) || !mongoose.Types.ObjectId.isValid(trainerId)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid academy or trainer ID'
        });
      }

      const User = (await import('../../schemas/userSchema')).default;
      const TrainerProfile = (await import('../../schemas/trainerSchema')).default;

      const academy = await Academy.findById(academyId);
      if (!academy || !academy.isActive) {
        return res.status(404).json({
          success: false,
          message: 'Academy not found'
        });
      }

      // Check if user exists and is a trainer
      const user = await User.findById(trainerId);
      if (!user || user.role !== 'trainer') {
        return res.status(404).json({
          success: false,
          message: 'Trainer not found'
        });
      }

      // Check if trainer is already in academy
      if (academy.trainers.includes(trainerId)) {
        return res.status(400).json({
          success: false,
          message: 'Trainer is already in this academy'
        });
      }

      // Get or create trainer profile
      let trainerProfile = await TrainerProfile.findOne({ userId: trainerId });
      if (!trainerProfile) {
        trainerProfile = new TrainerProfile({
          userId: trainerId,
          academyId: academyId,
          joinedDate: new Date(),
          sports: user.sports || []
        });
      } else {
        trainerProfile.academyId = academyId;
        if (!trainerProfile.joinedDate) {
          trainerProfile.joinedDate = new Date();
        }
      }

      await trainerProfile.save();

      // Add trainer to academy
      academy.trainers.push(trainerId);
      await academy.save();

      logger.info(`Trainer ${user.email} added to academy ${academy.name} by ${req.user!.email}`);

      res.json({
        success: true,
        message: 'Trainer added to academy successfully',
        data: {
          trainer: user,
          academy: { _id: academy._id, name: academy.name }
        }
      });
    } catch (error) {
      logger.error('Add trainer to academy error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  // Remove trainer from academy (Admin only)
  static async removeTrainerFromAcademy(req: AuthRequest, res: Response) {
    try {
      const { academyId, trainerId } = req.body;

      if (!mongoose.Types.ObjectId.isValid(academyId) || !mongoose.Types.ObjectId.isValid(trainerId)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid academy or trainer ID'
        });
      }

      const TrainerProfile = (await import('../../schemas/trainerSchema')).default;

      const academy = await Academy.findById(academyId);
      if (!academy || !academy.isActive) {
        return res.status(404).json({
          success: false,
          message: 'Academy not found'
        });
      }

      // Remove trainer from academy
      academy.trainers = academy.trainers.filter(
        (tid: mongoose.Types.ObjectId) => tid.toString() !== trainerId
      );
      await academy.save();

      // Update trainer profile
      await TrainerProfile.findOneAndUpdate(
        { userId: trainerId },
        { $unset: { academyId: 1 } }
      );

      logger.info(`Trainer removed from academy ${academy.name} by ${req.user!.email}`);

      res.json({
        success: true,
        message: 'Trainer removed from academy successfully'
      });
    } catch (error) {
      logger.error('Remove trainer from academy error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }
}