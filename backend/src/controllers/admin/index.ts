import mongoose from 'mongoose';
import { Response } from 'express';
import { AuthRequest } from '../../middleware/auth';
import User from '../../schemas/userSchema';
import { logger } from '../../utils/logger';
import StudentProfile from '../../schemas/studentSchema';
import TrainerProfile from '../../schemas/trainerSchema';
import Academy from '../../schemas/academySchema';
import { FeePayment } from '../../schemas/feePaymentSchema';
import { validationResult } from 'express-validator';

export class AdminUserController {
  // Get all users with pagination and filtering
  static async getAllUsers(req: AuthRequest, res: Response) {
    try {
      const {
        page = 1,
        limit = 10,
        role,
        isActive,
        search,
        sortBy = 'createdAt',
        sortOrder = 'desc'
      } = req.query;

      const pageNum = parseInt(page as string);
      const limitNum = parseInt(limit as string);
      const skip = (pageNum - 1) * limitNum;

      // Build filter query
      const filter: any = {};
      
      if (role) filter.role = role;
      if (isActive !== undefined) filter.isActive = isActive === 'true';
      if (search) {
        filter.$or = [
          { name: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } },
          { phone: { $regex: search, $options: 'i' } }
        ];
      }

      // Build sort query
      const sort: any = {};
      sort[sortBy as string] = sortOrder === 'desc' ? -1 : 1;

      // Execute query with pagination
      const [users, total] = await Promise.all([
        User.find(filter)
          .sort(sort)
          .skip(skip)
          .limit(limitNum)
          .lean(),
        User.countDocuments(filter)
      ]);

      const totalPages = Math.ceil(total / limitNum);

      res.json({
        success: true,
        data: {
          users,
          pagination: {
            currentPage: pageNum,
            totalPages,
            totalUsers: total,
            hasNextPage: pageNum < totalPages,
            hasPrevPage: pageNum > 1
          }
        }
      });
    } catch (error) {
      logger.error('Get all users error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  // Get user by ID
  static async getUserById(req: AuthRequest, res: Response) {
    try {
      const id = req.params.id as string;

      const user = await User.findById(id);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      res.json({
        success: true,
        data: { user }
      });
    } catch (error) {
      logger.error('Get user by ID error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  // Create user (admin only)
  static async createUser(req: AuthRequest, res: Response) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const { name, email, password, phone, role, sports } = req.body;

      // Check if user already exists
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(409).json({
          success: false,
          message: 'User with this email already exists'
        });
      }

      // Create user
      const user = new User({
        name,
        email,
        password,
        phone,
        role,
        sports: sports || []
      });

      await user.save();

      logger.info(`Admin ${req.user!.email} created user: ${email}`);

      res.status(201).json({
        success: true,
        message: 'User created successfully',
        data: { user }
      });
    } catch (error) {
      logger.error('Create user error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  // Update user (admin only)
  static async updateUser(req: AuthRequest, res: Response) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const id = req.params.id as string;
      const updates = req.body;

      // Remove sensitive fields from updates
      delete updates.password;
      delete updates.refreshTokens;

      const user = await User.findByIdAndUpdate(
        id,
        updates,
        { new: true, runValidators: true }
      );

      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      logger.info(`Admin ${req.user!.email} updated user: ${user.email}`);

      res.json({
        success: true,
        message: 'User updated successfully',
        data: { user }
      });
    } catch (error) {
      logger.error('Update user error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  // Delete user (admin only)
  static async deleteUser(req: AuthRequest, res: Response) {
    try {
      const id = req.params.id as string;

      // Prevent admin from deleting themselves
      // @ts-ignore
      if (req.user!._id.toString() === id) {
        return res.status(400).json({
          success: false,
          message: 'Cannot delete your own account'
        });
      }

      const user = await User.findByIdAndDelete(id);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      logger.info(`Admin ${req.user!.email} deleted user: ${user.email}`);

      res.json({
        success: true,
        message: 'User deleted successfully'
      });
    } catch (error) {
      logger.error('Delete user error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  // Toggle user active status
  static async toggleUserStatus(req: AuthRequest, res: Response) {
    try {
      const id = req.params.id as string;

      const user = await User.findById(id);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      // Prevent admin from deactivating themselves
      // @ts-ignore
      if ((req.user as IUser)._id.toString() === id && user.isActive) {
        return res.status(400).json({
          success: false,
          message: 'Cannot deactivate your own account'
        });
      }

      user.isActive = !user.isActive;
      await user.save();

      logger.info(`Admin ${req.user!.email} ${user.isActive ? 'activated' : 'deactivated'} user: ${user.email}`);

      res.json({
        success: true,
        message: `User ${user.isActive ? 'activated' : 'deactivated'} successfully`,
        data: { user }
      });
    } catch (error) {
      logger.error('Toggle user status error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  // Get user statistics
  static async getUserStats(req: AuthRequest, res: Response) {
    try {
      const stats = await User.aggregate([
        {
          $group: {
            _id: '$role',
            count: { $sum: 1 },
            active: {
              $sum: { $cond: [{ $eq: ['$isActive', true] }, 1, 0] }
            },
            inactive: {
              $sum: { $cond: [{ $eq: ['$isActive', false] }, 1, 0] }
            }
          }
        }
      ]);

      const totalUsers = await User.countDocuments();
      const activeUsers = await User.countDocuments({ isActive: true });
      const newUsersThisMonth = await User.countDocuments({
        createdAt: { $gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1) }
      });

      res.json({
        success: true,
        data: {
          totalUsers,
          activeUsers,
          inactiveUsers: totalUsers - activeUsers,
          newUsersThisMonth,
          usersByRole: stats
        }
      });
    } catch (error) {
      logger.error('Get user stats error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }
}

export class AdminStudentController {
  // Get all students
  static async getAllStudents(req: AuthRequest, res: Response) {
    try {
      const {
        page = 1,
        limit = 10,
        academyId,
        trainerId,
        level,
        isActive,
        search,
        sortBy = 'enrollmentDate',
        sortOrder = 'desc'
      } = req.query;

      const pageNum = parseInt(page as string);
      const limitNum = parseInt(limit as string);
      const skip = (pageNum - 1) * limitNum;

      const filter: any = {};
      
      if (isActive !== undefined) filter.isActive = isActive === 'true';
      if (academyId) filter.academyId = academyId;
      if (trainerId) filter.trainers = trainerId;
      if (level) filter.level = level;

      const sort: any = {};
      sort[sortBy as string] = sortOrder === 'desc' ? -1 : 1;

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
        { $unwind: '$user' },
        {
          $lookup: {
            from: 'academies',
            localField: 'academyId',
            foreignField: '_id',
            as: 'academy'
          }
        },
        {
          $lookup: {
            from: 'users',
            localField: 'trainers',
            foreignField: '_id',
            as: 'trainer'
          }
        }
      ];

      // Add search filter if provided
      if (search) {
        aggregatePipeline.push({
          $match: {
            $or: [
              { 'user.name': { $regex: search, $options: 'i' } },
              { 'user.email': { $regex: search, $options: 'i' } },
              { 'user.phone': { $regex: search, $options: 'i' } }
            ]
          }
        });
      }

      // Add sorting and pagination
      aggregatePipeline.push(
        { $sort: sort },
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
      logger.error('Get all students error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  // Get student by ID
  static async getStudentById(req: AuthRequest, res: Response) {
    try {
      const id = req.params.id as string;

      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid student ID'
        });
      }

      const student = await StudentProfile.findById(id)
        .populate('userId', 'name email phone')
        .populate('academyId', 'name location')
        .populate('trainers', 'name email')
        .populate('attendance.markedBy', 'name')
        .populate('performance.evaluatedBy', 'name');

      if (!student || !student.isActive) {
        return res.status(404).json({
          success: false,
          message: 'Student not found'
        });
      }

      res.json({
        success: true,
        data: { student }
      });
    } catch (error) {
      logger.error('Get student by ID error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  // Update student profile
  static async updateStudent(req: AuthRequest, res: Response) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const id = req.params.id as string;
      const updates = req.body;

      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid student ID'
        });
      }

      // Remove protected fields
      delete updates.userId;
      delete updates.feePayments;
      delete updates.attendance;
      delete updates.performance;

      const student = await StudentProfile.findByIdAndUpdate(
        id,
        updates,
        { new: true, runValidators: true }
      ).populate('userId', 'name email');

      if (!student || !student.isActive) {
        return res.status(404).json({
          success: false,
          message: 'Student not found'
        });
      }

      logger.info(`Student updated by admin ${req.user!.email}`);

      res.json({
        success: true,
        message: 'Student updated successfully',
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

  // Get all kits
  static async getAllKits(req: AuthRequest, res: Response) {
    try{
      const kits = await StudentProfile.aggregate([
        { $unwind: '$kits' },
        { $lookup: {
            from: 'users',
            localField: 'userId',
            foreignField: '_id',
            as: 'studentUser'
          }
        },
        { $unwind: '$studentUser' },
        { $project: {
            studentProfileId: '$_id',
            studentId: '$studentUser._id',
            studentName: '$studentUser.name',
            studentEmail: '$studentUser.email',
            kitId: '$kits._id',
            kitName: '$kits.kitName',
            kitStatus: '$kits.status',
            kitCost: '$kits.cost',
            requestedAt: '$kits.requestedAt',
            deliveredAt: '$kits.deliveredAt',
          }
        }
      ]);
      res.json({
        success: true,
        data: { kits }
      });
    }catch (error) {
      logger.error('Get all kits error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  // Update kit status
  static async updateKitStatus(req: AuthRequest, res: Response) {
    try {
      const studentId = req.params.studentId as string;
      const kitId = req.params.kitId as string;
      const { status, cost } = req.body;

      if (!mongoose.Types.ObjectId.isValid(studentId)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid student ID'
        });
      }

      const student = await StudentProfile.findById(studentId);
      if (!student) {
        return res.status(404).json({
          success: false,
          message: 'Student not found'
        });
      }

      const kit = student.kits.id(kitId);
      if (!kit) {
        return res.status(404).json({
          success: false,
          message: 'Kit not found'
        });
      }

      if(kit.status === "rejected"){
        return res.status(400).json({
          success: false,
          message: 'Cannot update a rejected kit'
        });
      }

      if(kit.status === "delivered"){
        return res.status(400).json({
          success: false,
          message: 'Kit already delivered'
        });
      }

      kit.status = status;
      if (cost !== undefined) kit.cost = cost;
      if (status === 'delivered') kit.deliveredAt = new Date();

      await student.save();

      logger.info(`Kit status updated by admin ${req.user!.email}`);

      res.json({
        success: true,
        message: 'Kit status updated successfully',
        data: { kit }
      });
    } catch (error) {
      logger.error('Update kit status error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  // Get student statistics
  static async getStudentStats(req: AuthRequest, res: Response) {
    try {
      const stats = await StudentProfile.aggregate([
        { $match: { isActive: true } },
        {
          $group: {
            _id: '$level',
            count: { $sum: 1 },
            averageFeesPaid: { $avg: '$totalFeesPaid' }
          }
        }
      ]);

      const totalStudents = await StudentProfile.countDocuments({ isActive: true });
      const enrolledStudents = await StudentProfile.countDocuments({ 
        isActive: true, 
        academyId: { $ne: null } 
      });

      res.json({
        success: true,
        data: {
          totalStudents,
          enrolledStudents,
          unenrolledStudents: totalStudents - enrolledStudents,
          studentsByLevel: stats
        }
      });
    } catch (error) {
      logger.error('Get student stats error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  // Get performance leaderboard
  static async getLeaderboard(req: AuthRequest, res: Response) {
    try {
      const topPerformers = await StudentProfile.aggregate([
        { $match: { isActive: true } },
        { $unwind: '$performance' },
        { $group: { 
            _id: '$_id', 
            userId: { $first: '$userId' },
            academyId: { $first: '$academyId' },
            level: { $first: '$level' },
            sports: { $first: '$sports' },
            avgScore: { $avg: '$performance.score' },
            totalEvals: { $sum: 1 }
          }
        },
        { $sort: { avgScore: -1 } },
        { $limit: 10 },
        { $lookup: { from: 'users', localField: 'userId', foreignField: '_id', as: 'user' } },
        { $unwind: '$user' },
        { $lookup: { from: 'academies', localField: 'academyId', foreignField: '_id', as: 'academy' } },
        {
          $project: {
            _id: 1,
            studentName: '$user.name',
            academyName: { $arrayElemAt: ['$academy.name', 0] },
            level: 1,
            sports: 1,
            avgScore: { $round: ['$avgScore', 1] },
            totalEvals: 1
          }
        }
      ]);

      res.json({
        success: true,
        data: { topPerformers }
      });
    } catch (error) {
      logger.error('Get leaderboard error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }
}

export class AdminTrainerController {
  // Get all trainers
  static async getAllTrainers(req: AuthRequest, res: Response) {
    try {
      const {
        page = 1,
        limit = 10,
        academyId,
        sport,
        isActive,
        search,
        sortBy = 'joinedDate',
        sortOrder = 'desc'
      } = req.query;

      const pageNum = parseInt(page as string);
      const limitNum = parseInt(limit as string);
      const skip = (pageNum - 1) * limitNum;

      const filter: any = {};
      
      if (academyId) filter.academyId = academyId;
      if (sport) filter.sports = { $in: [sport] };
      if (isActive !== undefined) filter.isActive = isActive === 'true';

      const sort: any = {};
      sort[sortBy as string] = sortOrder === 'desc' ? -1 : 1;

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
        { $unwind: '$user' },
        {
          $lookup: {
            from: 'academies',
            localField: 'academyId',
            foreignField: '_id',
            as: 'academy'
          }
        },
        {
          $addFields: {
            studentCount: { $size: '$students' }
          }
        }
      ];

      // Add search filter if provided
      if (search) {
        aggregatePipeline.push({
          $match: {
            $or: [
              { 'user.name': { $regex: search, $options: 'i' } },
              { 'user.email': { $regex: search, $options: 'i' } },
              { sports: { $regex: search, $options: 'i' } },
              { specializations: { $regex: search, $options: 'i' } }
            ]
          }
        });
      }

      // Add sorting and pagination
      aggregatePipeline.push(
        { $sort: sort },
        { $skip: skip },
        { $limit: limitNum }
      );

      const [trainers, total] = await Promise.all([
        TrainerProfile.aggregate(aggregatePipeline),
        TrainerProfile.countDocuments(filter)
      ]);

      const totalPages = Math.ceil(total / limitNum);

      res.json({
        success: true,
        data: {
          trainers,
          pagination: {
            currentPage: pageNum,
            totalPages,
            totalTrainers: total,
            hasNextPage: pageNum < totalPages,
            hasPrevPage: pageNum > 1
          }
        }
      });
    } catch (error) {
      logger.error('Get all trainers error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  // Get trainer by ID
  static async getTrainerById(req: AuthRequest, res: Response) {
    try {
      const id = req.params.id as string;

      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid trainer ID'
        });
      }

      const trainer = await TrainerProfile.findOne({ userId: id })
        .populate('userId', 'name email phone')
        .populate('academyId', 'name location')
        .populate('students', 'name email phone');

      if (!trainer) {
        return res.status(404).json({
          success: false,
          message: 'Trainer not found'
        });
      }

      res.json({
        success: true,
        data: { trainer }
      });
    } catch (error) {
      logger.error('Get trainer by ID error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  // Update trainer
  static async updateTrainer(req: AuthRequest, res: Response) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const id = req.params.id as string;
      const updates = req.body;

      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid trainer ID'
        });
      }

      // Remove protected fields
      delete updates.userId;
      delete updates.students;
      delete updates.rating;

      const trainer = await TrainerProfile.findByIdAndUpdate(
        id,
        updates,
        { new: true, runValidators: true }
      ).populate('userId', 'name email');

      if (!trainer || !trainer.isActive) {
        return res.status(404).json({
          success: false,
          message: 'Trainer not found'
        });
      }

      logger.info(`Trainer updated by admin ${req.user!.email}`);

      res.json({
        success: true,
        message: 'Trainer updated successfully',
        data: { trainer }
      });
    } catch (error) {
      logger.error('Update trainer error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  // Delete trainer (soft delete)
  static async deleteTrainer(req: AuthRequest, res: Response) {
    try {
      const id = req.params.id as string;

      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid trainer ID'
        });
      }

      const trainer = await TrainerProfile.findById(id);
      if (!trainer || !trainer.isActive) {
        return res.status(404).json({
          success: false,
          message: 'Trainer not found'
        });
      }

      // Soft delete
      trainer.isActive = false;
      await trainer.save();

      // Remove trainer from students
      await StudentProfile.updateMany(
        { trainers: trainer.userId },
        { $pull: { trainers: trainer.userId } }
      );

      // Remove trainer from academy
      if (trainer.academyId) {
        await Academy.findByIdAndUpdate(
          trainer.academyId,
          { $pull: { trainers: trainer.userId } }
        );
      }

      logger.info(`Trainer deleted by admin ${req.user!.email}`);

      res.json({
        success: true,
        message: 'Trainer deleted successfully'
      });
    } catch (error) {
      logger.error('Delete trainer error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  // Get trainer statistics
  static async getTrainerStats(req: AuthRequest, res: Response) {
    try {
      const stats = await TrainerProfile.aggregate([
        { $match: { isActive: true } },
        {
          $group: {
            _id: null,
            totalTrainers: { $sum: 1 },
            averageRating: { $avg: '$rating.average' },
            totalStudents: { $sum: { $size: '$students' } },
            averageStudentsPerTrainer: { $avg: { $size: '$students' } }
          }
        }
      ]);

      const sportStats = await TrainerProfile.aggregate([
        { $match: { isActive: true } },
        { $unwind: '$sports' },
        {
          $group: {
            _id: '$sports',
            count: { $sum: 1 }
          }
        },
        { $sort: { count: -1 } }
      ]);

      const academyStats = await TrainerProfile.aggregate([
        { $match: { isActive: true, academyId: { $ne: null } } },
        {
          $group: {
            _id: '$academyId',
            trainerCount: { $sum: 1 }
          }
        },
        {
          $lookup: {
            from: 'academies',
            localField: '_id',
            foreignField: '_id',
            as: 'academy'
          }
        },
        { $unwind: '$academy' },
        {
          $project: {
            academyName: '$academy.name',
            trainerCount: 1
          }
        },
        { $sort: { trainerCount: -1 } }
      ]);

      res.json({
        success: true,
        data: {
          overview: stats[0] || {
            totalTrainers: 0,
            averageRating: 0,
            totalStudents: 0,
            averageStudentsPerTrainer: 0
          },
          sportDistribution: sportStats,
          academyDistribution: academyStats
        }
      });
    } catch (error) {
      logger.error('Get trainer stats error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }
}

export class AdminDashboardController {
  static async getDashboardStats(req: AuthRequest, res: Response) {
    try {
      const now = new Date();
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

      // ── 1. Student Counts ──
      const [totalStudents, activeStudents, enrolledStudents] = await Promise.all([
        StudentProfile.countDocuments(),
        StudentProfile.countDocuments({ isActive: true }),
        StudentProfile.countDocuments({ isActive: true, academyId: { $ne: null } }),
      ]);

      const lastMonthStudents = await StudentProfile.countDocuments({
        createdAt: { $lte: endOfLastMonth },
        isActive: true,
      });
      const studentGrowth = lastMonthStudents > 0
        ? Math.round(((activeStudents - lastMonthStudents) / lastMonthStudents) * 100)
        : 0;

      // ── 2. Attendance Rate (Last 30 Days) ──
      const attendanceAgg = await StudentProfile.aggregate([
        { $match: { isActive: true } },
        { $unwind: '$attendance' },
        { $match: { 'attendance.date': { $gte: thirtyDaysAgo } } },
        {
          $group: {
            _id: null,
            totalRecords: { $sum: 1 },
            presentCount: {
              $sum: { $cond: [{ $eq: ['$attendance.present', true] }, 1, 0] },
            },
          },
        },
      ]);
      const attendanceRate = attendanceAgg.length > 0 && attendanceAgg[0].totalRecords > 0
        ? Math.round((attendanceAgg[0].presentCount / attendanceAgg[0].totalRecords) * 100)
        : 0;

      // ── 3. Financial Snapshot ──
      const revenueThisMonth = await FeePayment.aggregate([
        { $match: { status: 'success', createdAt: { $gte: startOfMonth } } },
        { $group: { _id: null, total: { $sum: '$amount' } } },
      ]);
      const revenueLastMonth = await FeePayment.aggregate([
        { $match: { status: 'success', createdAt: { $gte: startOfLastMonth, $lte: endOfLastMonth } } },
        { $group: { _id: null, total: { $sum: '$amount' } } },
      ]);
      const monthlyRevenue = revenueThisMonth[0]?.total || 0;
      const lastMonthRevenue = revenueLastMonth[0]?.total || 0;
      const revenueGrowth = lastMonthRevenue > 0
        ? Math.round(((monthlyRevenue - lastMonthRevenue) / lastMonthRevenue) * 100)
        : 0;

      const totalRevenue = await FeePayment.aggregate([
        { $match: { status: 'success' } },
        { $group: { _id: null, total: { $sum: '$amount' } } },
      ]);

      const pendingFees = await FeePayment.aggregate([
        { $match: { status: 'pending' } },
        { $group: { _id: null, total: { $sum: '$amount' }, count: { $sum: 1 } } },
      ]);

      const feeOverdueCount = await StudentProfile.countDocuments({
        isActive: true,
        outstandingFees: { $gt: 0 },
      });

      const totalOutstanding = await StudentProfile.aggregate([
        { $match: { isActive: true, outstandingFees: { $gt: 0 } } },
        { $group: { _id: null, total: { $sum: '$outstandingFees' } } },
      ]);

      // ── 4. Trainer Overview ──
      const [totalTrainers, activeTrainers] = await Promise.all([
        TrainerProfile.countDocuments(),
        TrainerProfile.countDocuments({ isActive: true }),
      ]);

      const trainerLoadAgg = await TrainerProfile.aggregate([
        { $match: { isActive: true } },
        {
          $project: {
            userId: 1,
            studentCount: { $size: '$students' },
            sports: 1,
            academyId: 1,
          },
        },
        { $lookup: { from: 'users', localField: 'userId', foreignField: '_id', as: 'user' } },
        { $unwind: '$user' },
        { $lookup: { from: 'academies', localField: 'academyId', foreignField: '_id', as: 'academy' } },
        {
          $project: {
            name: '$user.name',
            email: '$user.email',
            studentCount: 1,
            sports: 1,
            academyName: { $arrayElemAt: ['$academy.name', 0] },
          },
        },
        { $sort: { studentCount: -1 } },
        { $limit: 10 },
      ]);

      const trainerSportDist = await TrainerProfile.aggregate([
        { $match: { isActive: true } },
        { $unwind: '$sports' },
        { $group: { _id: '$sports', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]);

      // ── 5. Academy Overview ──
      const [totalAcademies, activeAcademies] = await Promise.all([
        Academy.countDocuments(),
        Academy.countDocuments({ isActive: true }),
      ]);

      // ── 6. Drop-off Detection (absent 7+ days) ──
      const dropOffStudents = await StudentProfile.aggregate([
        { $match: { isActive: true } },
        {
          $addFields: {
            lastAttendance: { $max: '$attendance.date' },
          },
        },
        {
          $match: {
            $or: [
              { lastAttendance: { $lt: sevenDaysAgo } },
              { lastAttendance: null },
              { attendance: { $size: 0 } },
            ],
          },
        },
        { $lookup: { from: 'users', localField: 'userId', foreignField: '_id', as: 'user' } },
        { $unwind: '$user' },
        { $lookup: { from: 'academies', localField: 'academyId', foreignField: '_id', as: 'academy' } },
        {
          $project: {
            studentName: '$user.name',
            email: '$user.email',
            phone: '$user.phone',
            academyName: { $arrayElemAt: ['$academy.name', 0] },
            lastAttendance: 1,
            level: 1,
            daysSinceLastAttendance: {
              $cond: {
                if: { $eq: ['$lastAttendance', null] },
                then: 999,
                else: {
                  $divide: [
                    { $subtract: [now, '$lastAttendance'] },
                    86400000,
                  ],
                },
              },
            },
          },
        },
        { $sort: { daysSinceLastAttendance: -1 } },
        { $limit: 15 },
      ]);

      // ── 7. Recent Activity ──
      const recentStudents = await StudentProfile.find({ isActive: true })
        .sort({ createdAt: -1 })
        .limit(5)
        .populate('userId', 'name email')
        .lean();

      const recentPayments = await FeePayment.find({ status: 'success' })
        .sort({ createdAt: -1 })
        .limit(5)
        .lean();

      // ── 8. Students by Level ──
      const studentsByLevel = await StudentProfile.aggregate([
        { $match: { isActive: true } },
        { $group: { _id: '$level', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]);

      // ── 9. Monthly Attendance Trend (last 6 months) ──
      const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);
      const attendanceTrend = await StudentProfile.aggregate([
        { $unwind: '$attendance' },
        { $match: { 'attendance.date': { $gte: sixMonthsAgo } } },
        {
          $group: {
            _id: {
              year: { $year: '$attendance.date' },
              month: { $month: '$attendance.date' },
            },
            totalRecords: { $sum: 1 },
            presentCount: {
              $sum: { $cond: [{ $eq: ['$attendance.present', true] }, 1, 0] },
            },
          },
        },
        { $sort: { '_id.year': 1, '_id.month': 1 } },
      ]);

      res.json({
        success: true,
        data: {
          students: {
            total: totalStudents,
            active: activeStudents,
            enrolled: enrolledStudents,
            unenrolled: activeStudents - enrolledStudents,
            growth: studentGrowth,
            byLevel: studentsByLevel,
          },
          attendance: {
            rate: attendanceRate,
            trend: attendanceTrend.map((t: any) => ({
              month: `${t._id.year}-${String(t._id.month).padStart(2, '0')}`,
              rate: t.totalRecords > 0 ? Math.round((t.presentCount / t.totalRecords) * 100) : 0,
              totalRecords: t.totalRecords,
              presentCount: t.presentCount,
            })),
          },
          finance: {
            monthlyRevenue,
            lastMonthRevenue,
            revenueGrowth,
            totalRevenue: totalRevenue[0]?.total || 0,
            pendingAmount: pendingFees[0]?.total || 0,
            pendingCount: pendingFees[0]?.count || 0,
            feeOverdueCount,
            totalOutstanding: totalOutstanding[0]?.total || 0,
          },
          trainers: {
            total: totalTrainers,
            active: activeTrainers,
            topTrainers: trainerLoadAgg,
            sportDistribution: trainerSportDist,
          },
          academies: {
            total: totalAcademies,
            active: activeAcademies,
          },
          dropOff: {
            count: dropOffStudents.length,
            students: dropOffStudents,
          },
          recentActivity: {
            newStudents: recentStudents.map((s: any) => ({
              id: s._id,
              name: s.userId?.name,
              email: s.userId?.email,
              level: s.level,
              joinedAt: s.createdAt,
            })),
            recentPayments: recentPayments.map((p: any) => ({
              id: p._id,
              amount: p.amount,
              status: p.status,
              date: p.createdAt,
              receipt: p.receipt,
            })),
          },
        },
      });
    } catch (error) {
      logger.error('Dashboard stats error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
      });
    }
  }

  /**
   * GET /admin/finance-analytics
   * Deep financial analytics for the Fees Management dashboard
   */
  static async getFinanceAnalytics(req: AuthRequest, res: Response) {
    try {
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);
      const startOfQuarter = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1);
      const startOfLastQuarter = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3 - 3, 1);
      const endOfLastQuarter = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 0);
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      const twelveMonthsAgo = new Date(now.getFullYear() - 1, now.getMonth(), 1);

      // ── 1. Lifetime & Period Totals ──
      const [lifetimeAgg, monthAgg, lastMonthAgg, quarterAgg, lastQuarterAgg] = await Promise.all([
        FeePayment.aggregate([
          { $match: { status: 'success' } },
          { $group: { _id: null, total: { $sum: '$amount' }, count: { $sum: 1 } } },
        ]),
        FeePayment.aggregate([
          { $match: { status: 'success', createdAt: { $gte: startOfMonth } } },
          { $group: { _id: null, total: { $sum: '$amount' }, count: { $sum: 1 } } },
        ]),
        FeePayment.aggregate([
          { $match: { status: 'success', createdAt: { $gte: startOfLastMonth, $lte: endOfLastMonth } } },
          { $group: { _id: null, total: { $sum: '$amount' }, count: { $sum: 1 } } },
        ]),
        FeePayment.aggregate([
          { $match: { status: 'success', createdAt: { $gte: startOfQuarter } } },
          { $group: { _id: null, total: { $sum: '$amount' }, count: { $sum: 1 } } },
        ]),
        FeePayment.aggregate([
          { $match: { status: 'success', createdAt: { $gte: startOfLastQuarter, $lte: endOfLastQuarter } } },
          { $group: { _id: null, total: { $sum: '$amount' }, count: { $sum: 1 } } },
        ]),
      ]);

      const lifetimeRevenue = lifetimeAgg[0]?.total || 0;
      const lifetimeCount = lifetimeAgg[0]?.count || 0;
      const monthlyRevenue = monthAgg[0]?.total || 0;
      const lastMonthRevenue = lastMonthAgg[0]?.total || 0;
      const quarterRevenue = quarterAgg[0]?.total || 0;
      const lastQuarterRevenue = lastQuarterAgg[0]?.total || 0;

      const monthGrowth = lastMonthRevenue > 0
        ? Math.round(((monthlyRevenue - lastMonthRevenue) / lastMonthRevenue) * 100)
        : monthlyRevenue > 0 ? 100 : 0;
      const quarterGrowth = lastQuarterRevenue > 0
        ? Math.round(((quarterRevenue - lastQuarterRevenue) / lastQuarterRevenue) * 100)
        : quarterRevenue > 0 ? 100 : 0;

      // ── 2. Payment Status Breakdown (All-Time) ──
      const statusBreakdown = await FeePayment.aggregate([
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 },
            total: { $sum: '$amount' },
          },
        },
      ]);

      const statusMap: Record<string, { count: number; total: number }> = {};
      statusBreakdown.forEach((s: any) => {
        statusMap[s._id] = { count: s.count, total: s.total };
      });
      const totalTransactions = (statusMap.success?.count || 0) + (statusMap.pending?.count || 0) + (statusMap.failed?.count || 0);
      const collectionRate = totalTransactions > 0
        ? Math.round(((statusMap.success?.count || 0) / totalTransactions) * 1000) / 10
        : 0;

      // ── 3. Monthly Revenue Trend (Last 12 Months) ──
      const monthlyTrend = await FeePayment.aggregate([
        { $match: { status: 'success', createdAt: { $gte: twelveMonthsAgo } } },
        {
          $group: {
            _id: {
              year: { $year: '$createdAt' },
              month: { $month: '$createdAt' },
            },
            revenue: { $sum: '$amount' },
            count: { $sum: 1 },
          },
        },
        { $sort: { '_id.year': 1, '_id.month': 1 } },
      ]);

      // Fill in missing months with 0
      const trendData: { month: string; label: string; revenue: number; count: number }[] = [];
      for (let i = 11; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const y = d.getFullYear();
        const m = d.getMonth() + 1;
        const found = monthlyTrend.find((t: any) => t._id.year === y && t._id.month === m);
        trendData.push({
          month: `${y}-${String(m).padStart(2, '0')}`,
          label: d.toLocaleString('en-US', { month: 'short' }),
          revenue: found ? found.revenue : 0,
          count: found ? found.count : 0,
        });
      }

      // ── 4. Daily Revenue (Last 30 Days) ──
      const dailyRevenue = await FeePayment.aggregate([
        { $match: { status: 'success', createdAt: { $gte: thirtyDaysAgo } } },
        {
          $group: {
            _id: {
              year: { $year: '$createdAt' },
              month: { $month: '$createdAt' },
              day: { $dayOfMonth: '$createdAt' },
            },
            revenue: { $sum: '$amount' },
            count: { $sum: 1 },
          },
        },
        { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } },
      ]);

      const dailyData: { date: string; revenue: number; count: number }[] = [];
      for (let i = 29; i >= 0; i--) {
        const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
        const y = d.getFullYear();
        const m = d.getMonth() + 1;
        const day = d.getDate();
        const found = dailyRevenue.find((t: any) => t._id.year === y && t._id.month === m && t._id.day === day);
        dailyData.push({
          date: `${String(m).padStart(2, '0')}/${String(day).padStart(2, '0')}`,
          revenue: found ? found.revenue : 0,
          count: found ? found.count : 0,
        });
      }

      // ── 5. Academy-wise Revenue ──
      const academyRevenue = await FeePayment.aggregate([
        { $match: { status: 'success', studentId: { $ne: null } } },
        { $lookup: { from: 'studentprofiles', localField: 'studentId', foreignField: 'userId', as: 'student' } },
        { $unwind: { path: '$student', preserveNullAndEmptyArrays: true } },
        { $lookup: { from: 'academies', localField: 'student.academyId', foreignField: '_id', as: 'academy' } },
        {
          $group: {
            _id: { $arrayElemAt: ['$academy.name', 0] },
            revenue: { $sum: '$amount' },
            count: { $sum: 1 },
          },
        },
        { $sort: { revenue: -1 } },
        { $limit: 10 },
      ]);

      // ── 6. Top Paying Students ──
      const topPayers = await FeePayment.aggregate([
        { $match: { status: 'success', studentId: { $ne: null } } },
        {
          $group: {
            _id: '$studentId',
            totalPaid: { $sum: '$amount' },
            txnCount: { $sum: 1 },
            lastPayment: { $max: '$createdAt' },
          },
        },
        { $sort: { totalPaid: -1 } },
        { $limit: 10 },
        { $lookup: { from: 'users', localField: '_id', foreignField: '_id', as: 'user' } },
        { $unwind: '$user' },
        {
          $project: {
            name: '$user.name',
            email: '$user.email',
            phone: '$user.phone',
            totalPaid: 1,
            txnCount: 1,
            lastPayment: 1,
          },
        },
      ]);

      // ── 7. Overdue / Defaulters ──
      const defaulters = await StudentProfile.find({ outstandingFees: { $gt: 0 }, isActive: true })
        .populate('userId', 'name email phone')
        .populate('academyId', 'name')
        .sort({ outstandingFees: -1 })
        .limit(15)
        .lean();

      const totalOutstandingAgg = await StudentProfile.aggregate([
        { $match: { isActive: true, outstandingFees: { $gt: 0 } } },
        { $group: { _id: null, total: { $sum: '$outstandingFees' }, count: { $sum: 1 } } },
      ]);

      // ── 8. Avg Transaction Value ──
      const avgTxn = lifetimeCount > 0 ? Math.round(lifetimeRevenue / lifetimeCount) : 0;

      // ── 9. Recent Transactions (last 10) ──
      const recentTransactions = await FeePayment.find()
        .sort({ createdAt: -1 })
        .limit(10)
        .populate({ path: 'studentId', select: 'name email', model: 'User' })
        .lean();

      res.json({
        success: true,
        data: {
          summary: {
            lifetimeRevenue,
            lifetimeCount,
            monthlyRevenue,
            lastMonthRevenue,
            monthGrowth,
            quarterRevenue,
            lastQuarterRevenue,
            quarterGrowth,
            avgTransactionValue: avgTxn,
            collectionRate,
            totalOutstanding: totalOutstandingAgg[0]?.total || 0,
            defaulterCount: totalOutstandingAgg[0]?.count || 0,
          },
          statusBreakdown: {
            success: statusMap.success || { count: 0, total: 0 },
            pending: statusMap.pending || { count: 0, total: 0 },
            failed: statusMap.failed || { count: 0, total: 0 },
            totalTransactions,
          },
          monthlyTrend: trendData,
          dailyTrend: dailyData,
          academyRevenue: academyRevenue.map((a: any) => ({
            name: a._id || 'Unassigned',
            revenue: a.revenue,
            count: a.count,
          })),
          topPayers: topPayers.map((p: any) => ({
            id: p._id,
            name: p.name,
            email: p.email,
            phone: p.phone,
            totalPaid: p.totalPaid,
            txnCount: p.txnCount,
            lastPayment: p.lastPayment,
          })),
          defaulters: defaulters.map((d: any) => ({
            id: d._id,
            name: d.userId?.name,
            email: d.userId?.email,
            phone: d.userId?.phone,
            academy: (d.academyId as any)?.name || 'Unassigned',
            outstanding: d.outstandingFees,
            level: d.level,
          })),
          recentTransactions: recentTransactions.map((t: any) => ({
            id: t._id,
            orderId: t.orderId,
            paymentId: t.paymentId,
            amount: t.amount,
            status: t.status,
            receipt: t.receipt,
            studentName: t.studentId?.name || null,
            studentEmail: t.studentId?.email || null,
            createdAt: t.createdAt,
          })),
        },
      });
    } catch (error) {
      logger.error('Finance analytics error:', error);
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  }
}