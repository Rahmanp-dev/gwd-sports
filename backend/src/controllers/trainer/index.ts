import { Response } from 'express';
import { AuthRequest } from '../../middleware/auth';
import TrainerProfile, { ITrainerProfile } from '../../schemas/trainerSchema';
import StudentProfile from '../../schemas/studentSchema';
import User from '../../schemas/userSchema';
import { logger } from '../../utils/logger';
import { validationResult } from 'express-validator';
import mongoose from 'mongoose';

export class TrainerController {
  // Create trainer profile (Admin only)
  static async createTrainerProfile(req: AuthRequest, res: Response) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const { userId } = req.body;

      // Check if trainer profile already exists
      const existingProfile = await TrainerProfile.findOne({ userId });
      if (existingProfile) {
        return res.status(409).json({
          success: false,
          message: 'Trainer profile already exists'
        });
      }

      const trainerData = {
        ...req.body,
        joinedDate: new Date()
      };

      const trainerProfile = new TrainerProfile(trainerData);
      await trainerProfile.save();

      // Update user role to trainer
      await User.findByIdAndUpdate(userId, { role: 'trainer' });

      logger.info(`Trainer profile created by admin ${req.user!.email}`);

      res.status(201).json({
        success: true,
        message: 'Trainer profile created successfully',
        data: { trainerProfile }
      });
    } catch (error) {
      logger.error('Create trainer profile error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  // Get trainer profile
  static async getTrainerProfile(req: AuthRequest, res: Response) {
    try {
      const userId = req.user!._id;

      const trainerProfile = await TrainerProfile.findOne({ userId })
        .populate('academyId', 'name location')
        .populate('students', 'name email phone');

      if (!trainerProfile) {
        return res.status(404).json({
          success: false,
          message: 'Trainer profile not found'
        });
      }

      res.json({
        success: true,
        data: { trainerProfile }
      });
    } catch (error) {
      logger.error('Get trainer profile error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  // Update trainer
  static async updateTrainerProfile(req: AuthRequest, res: Response) {
    try {
      const userId = req.user!._id;
      const updates = req.body;

      if (!mongoose.Types.ObjectId.isValid(userId)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid trainer ID'
        });
      }

      const trainer = await TrainerProfile.findOne({ userId });

      if (!trainer) {
        return res.status(404).json({
          success: false,
          message: 'Trainer profile not found'
        });
      }

      // Validate and process sports update
      if (updates.sports !== undefined) {
        if (!Array.isArray(updates.sports)) {
          return res.status(400).json({
            success: false,
            message: 'Sports must be an array'
          });
        }

        // Ensure football is always included (convert to lowercase for comparison)
        const hasFootball = updates.sports.some((sport: string) => sport.toLowerCase() === 'football');
        if (!hasFootball) {
          return res.status(400).json({
            success: false,
            message: 'Football is mandatory and cannot be removed'
          });
        }

        trainer.sports = updates.sports.map((sport: string) => sport.toLowerCase());
      }

      // Update specializations
      if (updates.specializations !== undefined) {
        if (!Array.isArray(updates.specializations)) {
          return res.status(400).json({
            success: false,
            message: 'Specializations must be an array'
          });
        }
        trainer.specializations = updates.specializations;
      }

      // Update qualifications
      if (updates.qualifications !== undefined) {
        if (!Array.isArray(updates.qualifications)) {
          return res.status(400).json({
            success: false,
            message: 'Qualifications must be an array'
          });
        }
        trainer.qualifications = updates.qualifications.map((q: any) => ({
          certification: q.certification,
          issuedBy: q.issuedBy,
          issuedDate: new Date(q.issuedDate),
          expiryDate: q.expiryDate ? new Date(q.expiryDate) : undefined,
          certificateUrl: q.certificateUrl || undefined
        }));
      }

      // Update experience
      if (updates.experience !== undefined) {
        if (!Array.isArray(updates.experience)) {
          return res.status(400).json({
            success: false,
            message: 'Experience must be an array'
          });
        }
        trainer.experience = updates.experience.map((e: any) => ({
          organization: e.organization,
          position: e.position,
          startDate: new Date(e.startDate),
          endDate: e.endDate ? new Date(e.endDate) : undefined,
          description: e.description
        }));
      }

      // Update availability
      if (updates.availability !== undefined) {
        if (typeof updates.availability !== 'object') {
          return res.status(400).json({
            success: false,
            message: 'Availability must be an object'
          });
        }

        if (updates.availability.days !== undefined) {
          if (!Array.isArray(updates.availability.days)) {
            return res.status(400).json({
              success: false,
              message: 'Availability days must be an array'
            });
          }
          trainer.availability.days = updates.availability.days;
        }

        if (updates.availability.timeSlots !== undefined) {
          if (!Array.isArray(updates.availability.timeSlots)) {
            return res.status(400).json({
              success: false,
              message: 'Availability timeSlots must be an array'
            });
          }
          trainer.availability.timeSlots = updates.availability.timeSlots;
        }
      }

      await trainer.save();

      logger.info(`Trainer profile updated by trainer ${req.user!.email}`);

      res.json({
        success: true,
        message: 'Trainer profile updated successfully',
        data: { trainerProfile: trainer }
      });
    } catch (error) {
      logger.error('Update trainer error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  // Get trainer students
  static async getTrainerStudents(req: AuthRequest, res: Response) {
    try {
      const trainerId = req.user!._id;
      const {
        page = 1,
        limit = 10,
        level,
        search
      } = req.query;

      const pageNum = parseInt(page as string);
      const limitNum = parseInt(limit as string);
      const skip = (pageNum - 1) * limitNum;

      const filter: any = { trainers: trainerId, isActive: true };
      if (level) filter.level = level;

      let aggregatePipeline: any[] = [
        { $match: filter },
        {
          $lookup: {
            from: 'users',
            localField: 'userId',
            foreignField: '_id',
            as: 'user'
          }
        },
        { $unwind: '$user' }
      ];

      if (search) {
        aggregatePipeline.push({
          $match: {
            $or: [
              { 'user.name': { $regex: search, $options: 'i' } },
              { 'user.email': { $regex: search, $options: 'i' } }
            ]
          }
        });
      }

      aggregatePipeline.push(
        { $sort: { enrollmentDate: -1 } },
        { $skip: skip },
        { $limit: limitNum }
      );

      const [students, total] = await Promise.all([
        StudentProfile.aggregate(aggregatePipeline),
        StudentProfile.countDocuments(filter)
      ]);

      const totalPages = Math.ceil(total / limitNum);

      res.json({
        success: true,
        data: {
          students,
          pagination: {
            currentPage: pageNum,
            totalPages,
            totalStudents: total,
            hasNextPage: pageNum < totalPages,
            hasPrevPage: pageNum > 1
          }
        }
      });
    } catch (error) {
      logger.error('Get trainer students error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  // Mark attendance
  static async markAttendance(req: AuthRequest, res: Response) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const trainerId = req.user!._id as mongoose.Types.ObjectId;
      const { studentId, date, present, remarks } = req.body;

      if (!mongoose.Types.ObjectId.isValid(studentId)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid student ID'
        });
      }

      const student = await StudentProfile.findOne({ 
        userId: studentId, 
        trainerId, 
        isActive: true 
      });

      if (!student) {
        return res.status(404).json({
          success: false,
          message: 'Student not found or not assigned to you'
        });
      }

      // Check if attendance already marked for this date
      const attendanceDate = new Date(date);
      const existingAttendance = student.attendance.find(record => 
        record.date.toDateString() === attendanceDate.toDateString()
      );

      if (existingAttendance) {
        // Update existing attendance
        existingAttendance.present = present;
        existingAttendance.markedBy = trainerId;
        if (remarks) existingAttendance.remarks = remarks;
      } else {
        // Add new attendance record
        student.attendance.push({
          date: attendanceDate,
          present,
          markedBy: trainerId,
          remarks
        });
      }

      await student.save();

      logger.info(`Attendance marked by trainer ${req.user!.email}`);

      res.json({
        success: true,
        message: 'Attendance marked successfully'
      });
    } catch (error) {
      logger.error('Mark attendance error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  // Add performance record
  static async addPerformanceRecord(req: AuthRequest, res: Response) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const trainerId = req.user!._id as mongoose.Types.ObjectId;
      const { studentId, sport, score, maxScore, remarks, category } = req.body;

      if (!mongoose.Types.ObjectId.isValid(studentId)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid student ID'
        });
      }

      const student = await StudentProfile.findOne({ 
        userId: studentId, 
        trainerId, 
        isActive: true 
      });

      if (!student) {
        return res.status(404).json({
          success: false,
          message: 'Student not found or not assigned to you'
        });
      }

      student.performance.push({
        sport,
        score,
        maxScore,
        remarks,
        category,
        evaluatedBy: trainerId,
        evaluatedAt: new Date()
      });

      await student.save();

      logger.info(`Performance record added by trainer ${req.user!.email}`);

      res.json({
        success: true,
        message: 'Performance record added successfully'
      });
    } catch (error) {
      logger.error('Add performance record error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  // Get student attendance (by trainer)
  static async getStudentAttendance(req: AuthRequest, res: Response) {
    try {
      const trainerId = req.user!._id;
      const { studentId } = req.params;
      const { fromDate, toDate } = req.query;

      if (!mongoose.Types.ObjectId.isValid(studentId)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid student ID'
        });
      }

      const student = await StudentProfile.findOne({ 
        userId: studentId, 
        trainerId, 
        isActive: true 
      }).populate('userId', 'name email');

      if (!student) {
        return res.status(404).json({
          success: false,
          message: 'Student not found or not assigned to you'
        });
      }

      let attendance = student.attendance;

      // Filter by date range if provided
      if (fromDate || toDate) {
        attendance = attendance.filter(record => {
          const recordDate = new Date(record.date);
          if (fromDate && recordDate < new Date(fromDate as string)) return false;
          if (toDate && recordDate > new Date(toDate as string)) return false;
          return true;
        });
      }

      // Sort by date (newest first)
      attendance = attendance.sort((a, b) => 
        new Date(b.date).getTime() - new Date(a.date).getTime()
      );

      // Calculate stats
      const totalRecords = attendance.length;
      const totalPresent = attendance.filter(record => record.present).length;
      const attendancePercentage = totalRecords > 0 ? Math.round((totalPresent / totalRecords) * 100) : 0;

      res.json({
        success: true,
        data: {
          student: student.userId,
          attendance,
          stats: {
            totalRecords,
            totalPresent,
            totalAbsent: totalRecords - totalPresent,
            attendancePercentage
          }
        }
      });
    } catch (error) {
      logger.error('Get student attendance error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  // Add student to trainer
  static async addStudentToTrainer(req: AuthRequest, res: Response) {
    try {
      const trainerId = req.user!._id as mongoose.Types.ObjectId;
      const { studentId } = req.body;

      if (!mongoose.Types.ObjectId.isValid(studentId)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid student ID'
        });
      }

      // Get trainer profile
      const trainerProfile = await TrainerProfile.findOne({ userId: trainerId });
      if (!trainerProfile) {
        return res.status(404).json({
          success: false,
          message: 'Trainer profile not found'
        });
      }

      // Get student profile
      const studentProfile = await StudentProfile.findOne({ userId: studentId });
      if (!studentProfile || !studentProfile.isActive) {
        return res.status(404).json({
          success: false,
          message: 'Student not found'
        });
      }

      // Check if student is already assigned to this trainer
      if (studentProfile.trainers?.some(t => t.toString() === trainerId.toString())) {
        return res.status(400).json({
          success: false,
          message: 'Student is already assigned to you'
        });
      }

      // Update student's trainer
      if (!studentProfile.trainers) studentProfile.trainers = [];
      studentProfile.trainers.push(trainerId);
      await studentProfile.save();

      // Add student to trainer's student list
      if (!trainerProfile.students.includes(studentId)) {
        trainerProfile.students.push(studentId);
        await trainerProfile.save();
      }

      logger.info(`Student assigned to trainer ${req.user!.email}`);

      res.json({
        success: true,
        message: 'Student assigned successfully'
      });
    } catch (error) {
      logger.error('Add student to trainer error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }
}