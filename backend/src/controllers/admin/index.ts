import mongoose from 'mongoose';
import { Response } from 'express';
import { AuthRequest } from '../../middleware/auth';
import User from '../../schemas/userSchema';
import { logger } from '../../utils/logger';
import StudentProfile from '../../schemas/studentSchema';
import TrainerProfile from '../../schemas/trainerSchema';
import Academy from '../../schemas/academySchema';
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
      const { id } = req.params;

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

      const { id } = req.params;
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
      const { id } = req.params;

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
      const { id } = req.params;

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
      const { id } = req.params;

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

      const { id } = req.params;
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
      const { studentId, kitId } = req.params;
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
      const { id } = req.params;

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

      const { id } = req.params;
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
      const { id } = req.params;

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