import { Response } from 'express';
import { AuthRequest } from '../../middleware/auth';
import StudentProfile, { IStudentProfile } from '../../schemas/studentSchema';
import Academy from '../../schemas/academySchema';
import User from '../../schemas/userSchema';
import { logger } from '../../utils/logger';
import { validationResult } from 'express-validator';
import mongoose from 'mongoose';

export class StudentController {
  // Create student profile (when user registers as student)
  static async createStudentProfile(req: AuthRequest, res: Response) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const userId = req.user!._id;

      // Check if student profile already exists
      const existingProfile = await StudentProfile.findOne({ userId });
      if (existingProfile) {
        return res.status(409).json({
          success: false,
          message: 'Student profile already exists'
        });
      }

      const studentData = {
        userId,
        ...req.body
      };

      const studentProfile = new StudentProfile(studentData);
      await studentProfile.save();

      // Update user role to student
      await User.findByIdAndUpdate(userId, { role: 'student' });

      logger.info(`Student profile created for user: ${req.user!.email}`);

      res.status(201).json({
        success: true,
        message: 'Student profile created successfully',
        data: { studentProfile }
      });
    } catch (error) {
      logger.error('Create student profile error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  // Join academy
  static async joinAcademy(req: AuthRequest, res: Response) {
    try {
      const { academyId } = req.body;
      const userId = req.user!._id as mongoose.Types.ObjectId;

      if (!mongoose.Types.ObjectId.isValid(academyId)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid academy ID'
        });
      }

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

      // Get or create student profile
      let studentProfile = await StudentProfile.findOne({ userId });
      if (!studentProfile) {
        studentProfile = new StudentProfile({ userId });
      }

      // Check if already enrolled in this academy
      if (studentProfile.academyId?.toString() === academyId) {
        return res.status(400).json({
          success: false,
          message: 'Already enrolled in this academy'
        });
      }

      // Update student profile
      studentProfile.academyId = academyId;
      studentProfile.enrollmentDate = new Date();
      await studentProfile.save();

      // Add student to academy
      if (!academy.students.includes(userId)) {
        academy.students.push(userId);
        await academy.save();
      }

      logger.info(`Student ${req.user!.email} joined academy: ${academy.name}`);

      res.json({
        success: true,
        message: 'Successfully joined academy',
        data: { academy: { _id: academy._id, name: academy.name } }
      });
    } catch (error) {
      logger.error('Join academy error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  // Get student profile
  static async getStudentProfile(req: AuthRequest, res: Response) {
    try {
      const userId = req.user!._id;

      const studentProfile = await StudentProfile.findOne({ userId })
        .populate('academyId', 'name location sports')
        .populate('trainerId', 'name email')
        .populate('attendance.markedBy', 'name')
        .populate('performance.evaluatedBy', 'name');

      if (!studentProfile) {
        return res.status(404).json({
          success: false,
          message: 'Student profile not found'
        });
      }

      res.json({
        success: true,
        data: { studentProfile }
      });
    } catch (error) {
      logger.error('Get student profile error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  // Update student profile
  static async updateStudent(req: AuthRequest, res: Response) {
    try {
      const userId = req.user!._id;
      const updates = req.body;

      if (!mongoose.Types.ObjectId.isValid(userId)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid student ID'
        });
      }

      const student = await StudentProfile.findOne({ userId });

      if (!student) {
        return res.status(404).json({
          success: false,
          message: 'Student not found'
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

        // Ensure football is always included
        if (!updates.sports.includes('football')) {
          return res.status(400).json({
            success: false,
            message: 'Football is mandatory and cannot be removed'
          });
        }

        student.sports = updates.sports;
      }

      // Validate and process level update
      if (updates.level !== undefined) {
        const validLevels = ['beginner', 'intermediate', 'advanced'];
        if (!validLevels.includes(updates.level)) {
          return res.status(400).json({
            success: false,
            message: 'Invalid skill level. Must be beginner, intermediate, or advanced'
          });
        }
        student.level = updates.level;
      }

      // Validate and process medicalInfo update
      if (updates.medicalInfo !== undefined) {
        // Update emergency contact
        if (updates.medicalInfo.emergencyContact) {
          if (!student.medicalInfo) {
            student.medicalInfo = { 
              emergencyContact: { name: '', phone: '', relation: '' },
              allergies: [],
              medications: []
            };
          }
          
          if (updates.medicalInfo.emergencyContact.name !== undefined) {
            student.medicalInfo.emergencyContact.name = updates.medicalInfo.emergencyContact.name;
          }
          if (updates.medicalInfo.emergencyContact.phone !== undefined) {
            student.medicalInfo.emergencyContact.phone = updates.medicalInfo.emergencyContact.phone;
          }
          if (updates.medicalInfo.emergencyContact.relation !== undefined) {
            student.medicalInfo.emergencyContact.relation = updates.medicalInfo.emergencyContact.relation;
          }
        }

        // Update allergies
        if (updates.medicalInfo.allergies !== undefined) {
          if (!Array.isArray(updates.medicalInfo.allergies)) {
            return res.status(400).json({
              success: false,
              message: 'Allergies must be an array'
            });
          }
          if (!student.medicalInfo) {
            student.medicalInfo = { 
              emergencyContact: { name: '', phone: '', relation: '' },
              allergies: [],
              medications: []
            };
          }
          student.medicalInfo.allergies = updates.medicalInfo.allergies;
        }

        // Update medications
        if (updates.medicalInfo.medications !== undefined) {
          if (!Array.isArray(updates.medicalInfo.medications)) {
            return res.status(400).json({
              success: false,
              message: 'Medications must be an array'
            });
          }
          if (!student.medicalInfo) {
            student.medicalInfo = { 
              emergencyContact: { name: '', phone: '', relation: '' },
              allergies: [],
              medications: []
            };
          }
          student.medicalInfo.medications = updates.medicalInfo.medications;
        }
      }

      await student.save();

      logger.info(`Student profile updated by student ${req.user!.email}`);

      res.json({
        success: true,
        message: 'Student profile updated successfully',
        data: { student }
      });
    } catch (error) {
      logger.error('Update student error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  // Get attendance
  static async getAttendance(req: AuthRequest, res: Response) {
    try {
      const userId = req.user!._id;
      const { 
        page = 1, 
        limit = 10,
        fromDate,
        toDate 
      } = req.query;

      const pageNum = parseInt(page as string);
      const limitNum = parseInt(limit as string);

      const studentProfile = await StudentProfile.findOne({ userId });
      if (!studentProfile) {
        return res.status(404).json({
          success: false,
          message: 'Student profile not found'
        });
      }

      let attendanceFilter: any = {};
      if (fromDate || toDate) {
        attendanceFilter.date = {};
        if (fromDate) attendanceFilter.date.$gte = new Date(fromDate as string);
        if (toDate) attendanceFilter.date.$lte = new Date(toDate as string);
      }

      // Filter attendance records
      let filteredAttendance = studentProfile.attendance;
      if (Object.keys(attendanceFilter).length > 0) {
        filteredAttendance = studentProfile.attendance.filter(record => {
          if (attendanceFilter.date) {
            const recordDate = new Date(record.date);
            if (attendanceFilter.date.$gte && recordDate < attendanceFilter.date.$gte) return false;
            if (attendanceFilter.date.$lte && recordDate > attendanceFilter.date.$lte) return false;
          }
          return true;
        });
      }

      // Calculate pagination
      const total = filteredAttendance.length;
      const skip = (pageNum - 1) * limitNum;
      const paginatedAttendance = filteredAttendance
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .slice(skip, skip + limitNum);

      // Calculate stats
      const totalPresent = filteredAttendance.filter(record => record.present).length;
      const attendancePercentage = total > 0 ? Math.round((totalPresent / total) * 100) : 0;

      res.json({
        success: true,
        data: {
          attendance: paginatedAttendance,
          stats: {
            totalRecords: total,
            totalPresent,
            totalAbsent: total - totalPresent,
            attendancePercentage
          },
          pagination: {
            currentPage: pageNum,
            totalPages: Math.ceil(total / limitNum),
            hasNextPage: skip + limitNum < total,
            hasPrevPage: pageNum > 1
          }
        }
      });
    } catch (error) {
      logger.error('Get attendance error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  // Get performance records
  static async getPerformance(req: AuthRequest, res: Response) {
    try {
      const userId = req.user!._id;
      const { sport, category } = req.query;

      const studentProfile = await StudentProfile.findOne({ userId })
        .populate('performance.evaluatedBy', 'name');

      if (!studentProfile) {
        return res.status(404).json({
          success: false,
          message: 'Student profile not found'
        });
      }

      let performance = studentProfile.performance;

      // Filter by sport if provided
      if (sport) {
        performance = performance.filter(record => 
          record.sport.toLowerCase() === (sport as string).toLowerCase()
        );
      }

      // Filter by category if provided
      if (category) {
        performance = performance.filter(record => 
          record.category.toLowerCase() === (category as string).toLowerCase()
        );
      }

      // Sort by evaluation date (newest first)
      performance = performance.sort((a, b) => 
        new Date(b.evaluatedAt).getTime() - new Date(a.evaluatedAt).getTime()
      );

      res.json({
        success: true,
        data: { performance }
      });
    } catch (error) {
      logger.error('Get performance error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  // Request kit
  static async requestKit(req: AuthRequest, res: Response) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const userId = req.user!._id;
      const { kitName } = req.body;

      const studentProfile = await StudentProfile.findOne({ userId });
      if (!studentProfile) {
        return res.status(404).json({
          success: false,
          message: 'Student profile not found'
        });
      }

      // Check if kit already requested
      const existingKit = studentProfile.kits.find(kit => 
        kit.kitName.toLowerCase() === kitName.toLowerCase() && 
        kit.status !== 'delivered'
      );

      if (existingKit) {
        return res.status(400).json({
          success: false,
          message: 'Kit already requested or being processed'
        });
      }

      // Add kit request
      studentProfile.kits.push({
        kitName,
        status: 'requested',
        requestedAt: new Date()
      });

      await studentProfile.save();

      logger.info(`Kit requested: ${kitName} by student ${req.user!.email}`);

      res.json({
        success: true,
        message: 'Kit requested successfully'
      });
    } catch (error) {
      logger.error('Request kit error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  // Get kits
  static async getKits(req: AuthRequest, res: Response) {
    try {
      const userId = req.user!._id;

      const studentProfile = await StudentProfile.findOne({ userId });
      if (!studentProfile) {
        return res.status(404).json({
          success: false,
          message: 'Student profile not found'
        });
      }

      res.json({
        success: true,
        data: { kits: studentProfile.kits }
      });
    } catch (error) {
      logger.error('Get kits error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  // Pay fees
  static async payFees(req: AuthRequest, res: Response) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const userId = req.user!._id;
      const { amount, period, transactionId } = req.body;

      const studentProfile = await StudentProfile.findOne({ userId });
      if (!studentProfile) {
        return res.status(404).json({
          success: false,
          message: 'Student profile not found'
        });
      }

      // Add fee payment
      studentProfile.feePayments.push({
        amount,
        paymentDate: new Date(),
        period,
        status: 'paid',
        transactionId
      });

      studentProfile.totalFeesPaid += amount;
      if (studentProfile.outstandingFees >= amount) {
        studentProfile.outstandingFees -= amount;
      } else {
        studentProfile.outstandingFees = 0;
      }

      await studentProfile.save();

      logger.info(`Fee paid: ${amount} by student ${req.user!.email}`);

      res.json({
        success: true,
        message: 'Fee payment recorded successfully',
        data: {
          totalPaid: studentProfile.totalFeesPaid,
          outstanding: studentProfile.outstandingFees
        }
      });
    } catch (error) {
      logger.error('Pay fees error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }
}