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
      const trainerId = req.query.trainerId || req.body.trainerId;
      const {
        page = 1,
        limit = 10,
        level,
        search
      } = req.query;

      const pageNum = parseInt(page as string);
      const limitNum = parseInt(limit as string);
      const skip = (pageNum - 1) * limitNum;

      // Step 1: Find the raw trainer profile to read the mapped student user IDs
      const trainerProfile = await TrainerProfile.findOne({ userId: trainerId });

      if (!trainerProfile) {
        return res.status(404).json({
          success: false,
          message: 'Trainer profile not found'
        });
      }

      // Safe deep parsing to extract structural BSON ObjectIds from the array
      const studentUserIds = (trainerProfile.students || []).map((id: any) => {
        try {
          return new mongoose.Types.ObjectId(id._id ? id._id.toString() : id.toString());
        } catch (e) {
          return null;
        }
      }).filter(Boolean);

      if (studentUserIds.length === 0) {
        return res.json({
          success: true,
          data: {
            students: [],
            pagination: {
              currentPage: pageNum,
              totalPages: 0,
              totalStudents: 0,
              hasNextPage: false,
              hasPrevPage: false
            }
          }
        });
      }

      // Step 2: Build the query targeting the core User directory first
      const matchStage: any = {
        _id: { $in: studentUserIds }
      };

      if (search) {
        matchStage.$or = [
          { name: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } }
        ];
      }

      // Step 3: Chain Left-Joins using dynamic database collection mapping references
      const aggregatePipeline: any[] = [
        { $match: matchStage },
        {
          $lookup: {
            from: StudentProfile.collection.name,
            localField: '_id',
            foreignField: 'userId',
            as: 'profile'
          }
        },
        {
          $unwind: {
            path: '$profile',
            preserveNullAndEmptyArrays: true
          }
        }
      ];

      if (level) {
        aggregatePipeline.push({
          $match: { 'profile.level': level }
        });
      }

      // Project stage updated to include deep arrays (attendance, performance)
      aggregatePipeline.push({
        $project: {
          _id: { $ifNull: ['$profile._id', '$_id'] },
          userId: '$_id',
          level: { $ifNull: ['$profile.level', 'unassigned'] },
          sports: { $ifNull: ['$profile.sports', '$sports'] },
          enrollmentDate: { $ifNull: ['$profile.enrollmentDate', '$createdAt'] },
          totalFeesPaid: { $ifNull: ['$profile.totalFeesPaid', 0] },
          outstandingFees: { $ifNull: ['$profile.outstandingFees', 0] },
          isActive: { $ifNull: ['$profile.isActive', true] },
          academyId: { $ifNull: ['$profile.academyId', null] },
          
          // Deep Array Hydration
          attendance: { $ifNull: ['$profile.attendance', []] },
          performance: { $ifNull: ['$profile.performance', []] },
          
          user: {
            _id: '$_id',
            name: '$name',
            email: '$email',
            phone: '$phone',
            sports: '$sports',
            isActive: '$isActive'
          }
        }
      });

      aggregatePipeline.push(
        { $sort: { enrollmentDate: -1 } },
        { $skip: skip },
        { $limit: limitNum }
      );

      // Construct a mirroring count pipeline matching filtering criteria
      const countPipeline: any[] = [
        { $match: matchStage },
        {
          $lookup: {
            from: StudentProfile.collection.name,
            localField: '_id',
            foreignField: 'userId',
            as: 'profile'
          }
        },
        {
          $unwind: {
            path: '$profile',
            preserveNullAndEmptyArrays: true
          }
        }
      ];

      if (level) {
        countPipeline.push({
          $match: { 'profile.level': level }
        });
      }
      countPipeline.push({ $count: 'total' });

      // Run database operations concurrently
      const [students, countResult] = await Promise.all([
        User.aggregate(aggregatePipeline),
        User.aggregate(countPipeline)
      ]);

      const total = countResult[0]?.total ?? 0;
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
      // const trainerId = req.user!._id as mongoose.Types.ObjectId;
      const { studentId, trainerId } = req.body;

      if (!mongoose.Types.ObjectId.isValid(studentId)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid student ID'
        });
      }

      if (!mongoose.Types.ObjectId.isValid(trainerId)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid trainer ID'
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
      if (!studentProfile) {
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

  // Remove student from trainer 
  static async removeStudentFromTrainer(req: AuthRequest, res: Response) {
    try {
      const { studentId, trainerId } = req.body;

      if (!mongoose.Types.ObjectId.isValid(studentId)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid student ID'
        });
      }

      if (!mongoose.Types.ObjectId.isValid(trainerId)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid trainer ID'
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
      if (!studentProfile) {
        return res.status(404).json({
          success: false,
          message: 'Student not found'
        });
      }

      // Check if student is actually assigned to this trainer
      const isAssigned = studentProfile.trainers?.some(t => t.toString() === trainerId.toString());
      if (!isAssigned) {
        return res.status(400).json({
          success: false,
          message: 'Student is not assigned to this trainer'
        });
      }

      // Remove trainer from student's trainers array
      if (studentProfile.trainers) {
        studentProfile.trainers = studentProfile.trainers.filter(
          t => t.toString() !== trainerId.toString()
        );
        await studentProfile.save();
      }

      // Remove student from trainer's students array
      if (trainerProfile.students.includes(studentId)) {
        trainerProfile.students = trainerProfile.students.filter(
          s => s.toString() !== studentId.toString()
        );
        await trainerProfile.save();
      }

      logger.info(`Student unassigned from trainer by admin/system: ${req.user!.email}`);

      res.json({
        success: true,
        message: 'Student removed from trainer successfully'
      });
    } catch (error) {
      logger.error('Remove student from trainer error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  // Edit performance record
  static async editPerformanceRecord(req: AuthRequest, res: Response) {
    try {
      const { studentId, performanceId } = req.params;
      const { sport, category, score, maxScore, remarks } = req.body;

      const student = await StudentProfile.findOne({ userId: studentId });
      if (!student) {
        return res.status(404).json({ success: false, message: 'Student not found' });
      }

      const performanceRecord = student.performance.id(performanceId);
      if (!performanceRecord) {
        return res.status(404).json({ success: false, message: 'Performance record not found' });
      }

      // Ensure trainer is authorized to edit it (either they created it or they are assigned)
      if (sport) performanceRecord.sport = sport;
      if (category) performanceRecord.category = category;
      if (score !== undefined) performanceRecord.score = score;
      if (maxScore !== undefined) performanceRecord.maxScore = maxScore;
      if (remarks !== undefined) performanceRecord.remarks = remarks;

      await student.save();

      res.json({
        success: true,
        message: 'Performance record updated successfully',
        data: { performance: performanceRecord }
      });
    } catch (error) {
      logger.error('Edit performance record error:', error);
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  }

  // Delete performance record
  static async deletePerformanceRecord(req: AuthRequest, res: Response) {
    try {
      const { studentId, performanceId } = req.params;

      const student = await StudentProfile.findOne({ userId: studentId });
      if (!student) {
        return res.status(404).json({ success: false, message: 'Student not found' });
      }

      student.performance.pull(performanceId);
      await student.save();

      res.json({
        success: true,
        message: 'Performance record deleted successfully'
      });
    } catch (error) {
      logger.error('Delete performance record error:', error);
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  }
}