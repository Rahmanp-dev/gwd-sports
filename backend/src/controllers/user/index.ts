import { Response } from 'express';
import { AuthRequest } from '../../middleware/auth';
import User, { IUser } from '../../schemas/userSchema';
import studentSchema from '../../schemas/studentSchema';
import trainerSchema from '../../schemas/trainerSchema';
import { Types } from 'mongoose';
import { generateTokens, verifyRefreshToken } from '../../utils/jwt';
import { logger } from '../../utils/logger';
import { validationResult } from 'express-validator';

export class UserController {
  // Register new user
  static async register(req: AuthRequest, res: Response) {
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
        role: role || 'user',
        sports: sports || []
      });

      await user.save();

      // Generate tokens
      const tokens = generateTokens({
        userId: (user._id as Types.ObjectId).toString(),
        email: user.email,
        role: user.role
      });

      // Add refresh token to user
      await user.addRefreshToken(tokens.refreshToken);

      logger.info(`New user registered: ${email}`);

      res.status(201).json({
        success: true,
        message: 'User registered successfully',
        data: {
          user,
          ...tokens
        }
      });
    } catch (error) {
      logger.error('Registration error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  // Login user
  static async login(req: AuthRequest, res: Response) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const { email, password } = req.body;

      // Find user with password
      const user = await User.findOne({ email }).select('+password +refreshTokens');
      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'Invalid credentials'
        });
      }

      if (!user.isActive) {
        return res.status(401).json({
          success: false,
          message: 'Account is deactivated'
        });
      }

      // Check password
      const isPasswordValid = await user.comparePassword(password);
      if (!isPasswordValid) {
        return res.status(401).json({
          success: false,
          message: 'Invalid credentials'
        });
      }

      // Generate tokens
      const tokens = generateTokens({
        userId: (user._id as Types.ObjectId).toString(),
        email: user.email,
        role: user.role
      });

      // Add refresh token and update last login
      await user.addRefreshToken(tokens.refreshToken);
      user.lastLogin = new Date();
      await user.save();

      logger.info(`User logged in: ${email}`);

      res.json({
        success: true,
        message: 'Login successful',
        data: {
          user: user.toJSON(),
          ...tokens
        }
      });
    } catch (error) {
      logger.error('Login error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  // Get if the User exists by that Email
  static async getUserByEmail(req: AuthRequest, res: Response) {
    try {
      const { email } = req.body;

      if (!email) {
        return res.status(400).json({
          success: false,
          message: "Email is required",
        });
      }

      const user = await User.findOne({ email: email.toLowerCase() });

      if (!user) {
        return res.status(200).json({
          success: true,
          message: 'User not found'
        });
      }

      // Check if the user role is student or trainer
      if(user.role === 'student'){
        // Check if the user has a student profile
        const studentProfile = await studentSchema.findOne({ userId: user._id });
        // If not there then proceed with creating profile
        if (!studentProfile) {
          return res.status(404).json({
            success: true,
            message: 'Student profile not found'
          });
        } 
        // If there, then inform that user has student profile already
        return res.status(200).json({
          success: true,
          message: 'User has a student profile',
          data: { user }
        });
      } else if(user.role === 'trainer'){
        // check if the user has a trainer profile 
        const trainerProfile = await trainerSchema.findOne({ userId: user._id });
        // If not there then proceed with creating profile
        if (!trainerProfile) {
          return res.status(404).json({
            success: true,
            message: 'Trainer profile not found'
          });
        }else{
          // If there, then inform that user has trainer profile already
          return res.status(200).json({
            success: true,
            message: 'User has a trainer profile',
            data: { user }
          });
        }
      } else if(user.role === 'admin'){
        return res.status(500).json({
          success: false,
          message: 'Invalid user role for this operation',
        });
      }

      // User doesn't have any student or trainer profile
      res.json({
        success: true,
        message: 'User has a no other profile',
        data: { user }
      });
    } catch (error) {
      logger.error('Get User by email error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  // Refresh access token
  static async refreshToken(req: AuthRequest, res: Response) {
    try {
      const { refreshToken } = req.body;

      if (!refreshToken) {
        return res.status(400).json({
          success: false,
          message: 'Refresh token is required'
        });
      }

      // Verify refresh token
      const decoded = verifyRefreshToken(refreshToken);
      
      // Find user and check if refresh token exists
      const user = await User.findById(decoded.userId).select('+refreshTokens');
      if (!user || !user.refreshTokens?.includes(refreshToken)) {
        return res.status(401).json({
          success: false,
          message: 'Invalid refresh token'
        });
      }

      if (!user.isActive) {
        return res.status(401).json({
          success: false,
          message: 'Account is deactivated'
        });
      }

      // Generate new tokens
      const tokens = generateTokens({
        userId: (user._id as Types.ObjectId).toString(),
        email: user.email,
        role: user.role
      });

      // Replace old refresh token with new one
      await user.removeRefreshToken(refreshToken);
      await user.addRefreshToken(tokens.refreshToken);

      res.json({
        success: true,
        message: 'Token refreshed successfully',
        data: tokens
      });
    } catch (error) {
      logger.error('Refresh token error:', error);
      res.status(401).json({
        success: false,
        message: 'Invalid refresh token'
      });
    }
  }

  // Logout user
  static async logout(req: AuthRequest, res: Response) {
    try {
      const { refreshToken } = req.body;
      const user = req.user!;

      if (refreshToken) {
        await user.removeRefreshToken(refreshToken);
      }

      res.json({
        success: true,
        message: 'Logged out successfully'
      });
    } catch (error) {
      logger.error('Logout error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  // Get current user profile
  static async getProfile(req: AuthRequest, res: Response) {
    try {
      const user = req.user!;
      
      res.json({
        success: true,
        data: { user }
      });
    } catch (error) {
      logger.error('Get profile error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  // Update user profile
  static async updateProfile(req: AuthRequest, res: Response) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const user = req.user!;
      const updates = req.body;

      // Remove sensitive fields from updates
      delete updates.password;
      delete updates.role;
      delete updates.refreshTokens;

      // Update user
      Object.assign(user, updates);
      await user.save();

      res.json({
        success: true,
        message: 'Profile updated successfully',
        data: { user }
      });
    } catch (error) {
      logger.error('Update profile error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  // Change password
  static async changePassword(req: AuthRequest, res: Response) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const { currentPassword, newPassword } = req.body;
      const user = await User.findById(req.user!._id).select('+password');

      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      // Verify current password
      const isCurrentPasswordValid = await user.comparePassword(currentPassword);
      if (!isCurrentPasswordValid) {
        return res.status(400).json({
          success: false,
          message: 'Current password is incorrect'
        });
      }

      // Update password
      user.password = newPassword;
      await user.save();

      res.json({
        success: true,
        message: 'Password changed successfully'
      });
    } catch (error) {
      logger.error('Change password error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  // Deactivate account
  static async deactivateAccount(req: AuthRequest, res: Response) {
    try {
      const user = req.user!;
      user.isActive = false;
      await user.save();

      res.json({
        success: true,
        message: 'Account deactivated successfully'
      });
    } catch (error) {
      logger.error('Deactivate account error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }
}