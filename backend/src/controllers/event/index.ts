import { Response } from 'express';
import { AuthRequest } from '../../middleware/auth';
import Event, { IEvent } from '../../schemas/eventSchema';
import User from '../../schemas/userSchema';
import Academy from '../../schemas/academySchema';
import { logger } from '../../utils/logger';
import { validationResult } from 'express-validator';
import mongoose, { Types } from 'mongoose';

export class EventController {
  // Create new event (Admin only)
  static async createEvent(req: AuthRequest, res: Response) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const eventData = {
        ...req.body,
        createdBy: req.user!._id
      };

      const event = new Event(eventData);
      await event.save();

      // Populate creator info
      await event.populate('createdBy', 'name email');

      logger.info(`Event created: ${event.name} by ${req.user!.email}`);

      res.status(201).json({
        success: true,
        message: 'Event created successfully',
        data: { event }
      });
    } catch (error) {
      logger.error('Create event error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  // Get all events with filtering and pagination
  static async getAllEvents(req: AuthRequest, res: Response) {
    try {
      const {
        page = 1,
        limit = 10,
        sport,
        status,
        isPublic,
        registrationOpen,
        search,
        startDate,
        endDate,
        location,
        sortBy = 'startDate',
        sortOrder = 'asc'
      } = req.query;

      const pageNum = parseInt(page as string);
      const limitNum = parseInt(limit as string);
      const skip = (pageNum - 1) * limitNum;

      // Build filter query
      const filter: any = { isActive: true };
      
      if (sport) filter.sport = sport;
      if (status) filter.status = status;
      if (isPublic !== undefined) filter.isPublic = isPublic === 'true';
      if (registrationOpen !== undefined) filter.registrationOpen = registrationOpen === 'true';
      if (location) filter.location = { $regex: location, $options: 'i' };
      
      if (search) {
        filter.$or = [
          { name: { $regex: search, $options: 'i' } },
          { description: { $regex: search, $options: 'i' } },
          { venue: { $regex: search, $options: 'i' } },
          { tags: { $in: [new RegExp(search as string, 'i')] } }
        ];
      }

      // Date filtering
      if (startDate || endDate) {
        filter.startDate = {};
        if (startDate) filter.startDate.$gte = new Date(startDate as string);
        if (endDate) filter.startDate.$lte = new Date(endDate as string);
      }

      // Build sort query
      const sort: any = {};
      sort[sortBy as string] = sortOrder === 'desc' ? -1 : 1;

      // Execute query with pagination
      const [events, total] = await Promise.all([
        Event.find(filter)
          .populate('createdBy', 'name email')
          .populate('participants', 'name email')
          .sort(sort)
          .skip(skip)
          .limit(limitNum)
          .lean(),
        Event.countDocuments(filter)
      ]);

      const totalPages = Math.ceil(total / limitNum);

      res.json({
        success: true,
        data: {
          events,
          pagination: {
            currentPage: pageNum,
            totalPages,
            totalEvents: total,
            hasNextPage: pageNum < totalPages,
            hasPrevPage: pageNum > 1
          }
        }
      });
    } catch (error) {
      logger.error('Get all events error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  // Get event by ID
  static async getEventById(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;

      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid event ID'
        });
      }

      const event = await Event.findById(id)
        .populate('createdBy', 'name email phone')
        .populate('participants', 'name email phone role');
        
      if (!event || !event.isActive) {
        return res.status(404).json({
          success: false,
          message: 'Event not found'
        });
      }

      res.json({
        success: true,
        data: { event }
      });
    } catch (error) {
      logger.error('Get event by ID error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  // Update event (Admin only)
  static async updateEvent(req: AuthRequest, res: Response) {
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
          message: 'Invalid event ID'
        });
      }

      // Remove fields that shouldn't be updated directly
      delete updates.createdBy;
      delete updates.participants;

      const event = await Event.findByIdAndUpdate(
        id,
        updates,
        { new: true, runValidators: true }
      ).populate('createdBy', 'name email');

      if (!event || !event.isActive) {
        return res.status(404).json({
          success: false,
          message: 'Event not found'
        });
      }

      logger.info(`Event updated: ${event.name} by ${req.user!.email}`);

      res.json({
        success: true,
        message: 'Event updated successfully',
        data: { event }
      });
    } catch (error) {
      logger.error('Update event error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  // Delete event (Admin only)
  static async deleteEvent(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;

      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid event ID'
        });
      }

      const event = await Event.findById(id);
      if (!event || !event.isActive) {
        return res.status(404).json({
          success: false,
          message: 'Event not found'
        });
      }

      // Soft delete
      event.isActive = false;
      await event.save();

      logger.info(`Event deleted: ${event.name} by ${req.user!.email}`);

      res.json({
        success: true,
        message: 'Event deleted successfully'
      });
    } catch (error) {
      logger.error('Delete event error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  // Join event (Any authenticated user)
  static async joinEvent(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;
      const userId = req.user!._id as Types.ObjectId;

      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid event ID'
        });
      }

      const event = await Event.findById(id);
      if (!event || !event.isActive) {
        return res.status(404).json({
          success: false,
          message: 'Event not found'
        });
      }

      // Check if registration is open
      if (!event.registrationOpen) {
        return res.status(400).json({
          success: false,
          message: 'Registration is closed for this event'
        });
      }

      // Check if event is published
      if (event.status !== 'published') {
        return res.status(400).json({
          success: false,
          message: 'Event is not open for registration'
        });
      }

      // Check registration deadline
      if (event.registrationDeadline && new Date() > event.registrationDeadline) {
        return res.status(400).json({
          success: false,
          message: 'Registration deadline has passed'
        });
      }

      // Check if user is already registered
      if (event.participants.includes(userId)) {
        return res.status(400).json({
          success: false,
          message: 'You are already registered for this event'
        });
      }

      // Check maximum participants
      if (event.maxParticipants && event.participants.length >= event.maxParticipants) {
        return res.status(400).json({
          success: false,
          message: 'Event is full'
        });
      }

      // Add user to participants
      event.participants.push(userId);
      await event.save();

      // Populate updated event data
      await event.populate('participants', 'name email');

      logger.info(`User ${req.user!.email} joined event: ${event.name}`);

      res.json({
        success: true,
        message: 'Successfully joined the event',
        data: { 
          event: {
            _id: event._id,
            name: event.name,
            participantCount: event.participants.length
          }
        }
      });
    } catch (error) {
      logger.error('Join event error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  // Leave event (Any authenticated user)
  static async leaveEvent(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;
      const userId = req.user!._id as Types.ObjectId;

      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid event ID'
        });
      }

      const event = await Event.findById(id);
      if (!event || !event.isActive) {
        return res.status(404).json({
          success: false,
          message: 'Event not found'
        });
      }

      // Check if user is registered
      if (!event.participants.includes(userId)) {
        return res.status(400).json({
          success: false,
          message: 'You are not registered for this event'
        });
      }

      // Check if event has already started
      if (new Date() >= event.startDate) {
        return res.status(400).json({
          success: false,
          message: 'Cannot leave event after it has started'
        });
      }

      // Remove user from participants
      event.participants = event.participants.filter(
        participantId => !participantId.equals(userId)
      );
      await event.save();

      logger.info(`User ${req.user!.email} left event: ${event.name}`);

      res.json({
        success: true,
        message: 'Successfully left the event'
      });
    } catch (error) {
      logger.error('Leave event error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  // Get user's events
  static async getUserEvents(req: AuthRequest, res: Response) {
    try {
      const userId = req.user!._id;
      const { 
        page = 1, 
        limit = 10, 
        status,
        upcoming = 'false'
      } = req.query;

      const pageNum = parseInt(page as string);
      const limitNum = parseInt(limit as string);
      const skip = (pageNum - 1) * limitNum;

      const filter: any = { 
        participants: userId,
        isActive: true
      };

      if (status) filter.status = status;
      if (upcoming === 'true') {
        filter.startDate = { $gte: new Date() };
      }

      const [events, total] = await Promise.all([
        Event.find(filter)
          .populate('createdBy', 'name email')
          .sort({ startDate: 1 })
          .skip(skip)
          .limit(limitNum)
          .lean(),
        Event.countDocuments(filter)
      ]);

      const totalPages = Math.ceil(total / limitNum);

      res.json({
        success: true,
        data: {
          events,
          pagination: {
            currentPage: pageNum,
            totalPages,
            totalEvents: total,
            hasNextPage: pageNum < totalPages,
            hasPrevPage: pageNum > 1
          }
        }
      });
    } catch (error) {
      logger.error('Get user events error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  // Get event statistics (Admin only)
  static async getEventStats(req: AuthRequest, res: Response) {
    try {
      const stats = await Event.aggregate([
        { $match: { isActive: true } },
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 },
            totalParticipants: { $sum: { $size: '$participants' } }
          }
        }
      ]);

      const sportStats = await Event.aggregate([
        { $match: { isActive: true } },
        {
          $group: {
            _id: '$sport',
            count: { $sum: 1 },
            totalParticipants: { $sum: { $size: '$participants' } }
          }
        },
        { $sort: { count: -1 } }
      ]);

      const totalEvents = await Event.countDocuments({ isActive: true });
      const upcomingEvents = await Event.countDocuments({ 
        isActive: true, 
        startDate: { $gte: new Date() },
        status: 'published'
      });
      const ongoingEvents = await Event.countDocuments({ 
        isActive: true, 
        status: 'ongoing' 
      });

      res.json({
        success: true,
        data: {
          totalEvents,
          upcomingEvents,
          ongoingEvents,
          eventsByStatus: stats,
          eventsBySport: sportStats
        }
      });
    } catch (error) {
      logger.error('Get event stats error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }
}