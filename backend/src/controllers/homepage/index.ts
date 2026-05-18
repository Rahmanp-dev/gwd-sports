import { Response } from "express";
import { AuthRequest } from "../../middleware/auth";
import LandingPageEventCard from "../../schemas/homepageSchema";
import Event from "../../schemas/eventSchema";

export class HomepageController {
  // Get all landing page event cards (Public)
  static async getLandingPageEvents(req: AuthRequest, res: Response) {
    try {
      const eventCards = await LandingPageEventCard.find({ isActive: true })
        .sort({ order: 1 })
        .populate({
          path: "eventId",
          select:
            "name description sport startDate endDate location venue maxParticipants participants registrationDeadline entryFee images status isPublic registrationOpen",
        });

      // Filter out cards where event is deleted or not published
      const validCards = eventCards.filter(
        (card: any) =>
          card.eventId &&
          card.eventId.status === "published" &&
          card.eventId.isPublic
      );

      res.status(200).json({
        success: true,
        data: validCards,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: "Failed to fetch landing page events",
        error: error.message,
      });
    }
  }

  // Get all landing page event cards (Admin)
  static async getAdminLandingPageEvents(req: AuthRequest, res: Response) {
    try {
      const eventCards = await LandingPageEventCard.find()
        .sort({ order: 1 })
        .populate({
          path: "eventId",
          select:
            "name description sport startDate endDate location venue maxParticipants participants registrationDeadline entryFee images status",
        });

      res.status(200).json({
        success: true,
        data: eventCards,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: "Failed to fetch landing page events",
        error: error.message,
      });
    }
  }

  // Add event card to landing page (Admin)
  static async addEventCard(req: AuthRequest, res: Response) {
    try {
      const { eventId, colorScheme } = req.body;

      // Check if event exists
      const event = await Event.findById(eventId);
      if (!event) {
        return res.status(404).json({
          success: false,
          message: "Event not found",
        });
      }

      // Check if event is already added
      const existingCard = await LandingPageEventCard.findOne({ eventId });
      if (existingCard) {
        return res.status(400).json({
          success: false,
          message: "Event is already added to landing page",
        });
      }

      // Get the highest order number and add 1
      const highestOrder = await LandingPageEventCard.findOne()
        .sort({ order: -1 })
        .select("order");
      const newOrder = highestOrder ? highestOrder.order + 1 : 1;

      const eventCard = await LandingPageEventCard.create({
        eventId,
        order: newOrder,
        colorScheme:
          colorScheme || "from-green-600 to-emerald-500",
      });

      const populatedCard = await LandingPageEventCard.findById(
        eventCard._id
      ).populate({
        path: "eventId",
        select:
          "name description sport startDate endDate location venue maxParticipants participants registrationDeadline entryFee images status",
      });

      res.status(201).json({
        success: true,
        message: "Event card added to landing page",
        data: populatedCard,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: "Failed to add event card",
        error: error.message,
      });
    }
  }

  // Update event card (Admin)
  static async updateEventCard(req: AuthRequest, res: Response) {
    try {
      const id = req.params.id as string;
      const { order, colorScheme, isActive } = req.body;

      const eventCard = await LandingPageEventCard.findById(id);
      if (!eventCard) {
        return res.status(404).json({
          success: false,
          message: "Event card not found",
        });
      }

      // If order is being changed, reorder other cards
      if (order && order !== eventCard.order) {
        // Validate order is a positive integer
        if (!Number.isInteger(order) || order < 1) {
          return res.status(400).json({
            success: false,
            message: "Order must be a positive integer",
          });
        }

        const totalCards = await LandingPageEventCard.countDocuments();
        if (order > totalCards) {
          return res.status(400).json({
            success: false,
            message: `Order cannot exceed ${totalCards}`,
          });
        }

        const oldOrder = eventCard.order;
        const newOrder = order;

        // Reorder logic
        if (newOrder < oldOrder) {
          // Moving up: increment orders between newOrder and oldOrder
          await LandingPageEventCard.updateMany(
            {
              order: { $gte: newOrder, $lt: oldOrder },
              _id: { $ne: id },
            },
            { $inc: { order: 1 } }
          );
        } else {
          // Moving down: decrement orders between oldOrder and newOrder
          await LandingPageEventCard.updateMany(
            {
              order: { $gt: oldOrder, $lte: newOrder },
              _id: { $ne: id },
            },
            { $inc: { order: -1 } }
          );
        }

        eventCard.order = newOrder;
      }

      if (colorScheme) eventCard.colorScheme = colorScheme;
      if (typeof isActive === "boolean") eventCard.isActive = isActive;

      await eventCard.save();

      const updatedCard = await LandingPageEventCard.findById(id).populate({
        path: "eventId",
        select:
          "name description sport startDate endDate location venue maxParticipants participants registrationDeadline entryFee images status",
      });

      res.status(200).json({
        success: true,
        message: "Event card updated successfully",
        data: updatedCard,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: "Failed to update event card",
        error: error.message,
      });
    }
  }

  // Delete event card (Admin)
  static async deleteEventCard(req: AuthRequest, res: Response) {
    try {
      const id = req.params.id as string;

      const eventCard = await LandingPageEventCard.findById(id);
      if (!eventCard) {
        return res.status(404).json({
          success: false,
          message: "Event card not found",
        });
      }

      const deletedOrder = eventCard.order;

      // Delete the card
      await LandingPageEventCard.findByIdAndDelete(id);

      // Reorder remaining cards
      await LandingPageEventCard.updateMany(
        { order: { $gt: deletedOrder } },
        { $inc: { order: -1 } }
      );

      res.status(200).json({
        success: true,
        message: "Event card deleted successfully",
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: "Failed to delete event card",
        error: error.message,
      });
    }
  }

  // Bulk update orders (Admin)
  static async bulkUpdateOrders(req: AuthRequest, res: Response) {
    try {
      const { cards } = req.body; // Array of { id, order }

      if (!Array.isArray(cards) || cards.length === 0) {
        return res.status(400).json({
          success: false,
          message: "Cards array is required",
        });
      }

      // Validate all orders are unique and sequential
      const orders = cards.map((c) => c.order).sort((a, b) => a - b);
      for (let i = 0; i < orders.length; i++) {
        if (orders[i] !== i + 1) {
          return res.status(400).json({
            success: false,
            message: "Orders must be sequential starting from 1",
          });
        }
      }

      // Update all cards
      const updatePromises = cards.map((card: any) =>
        LandingPageEventCard.findByIdAndUpdate(card.id, { order: card.order })
      );

      await Promise.all(updatePromises);

      const updatedCards = await LandingPageEventCard.find()
        .sort({ order: 1 })
        .populate({
          path: "eventId",
          select:
            "name description sport startDate endDate location venue maxParticipants participants registrationDeadline entryFee images status",
        });

      res.status(200).json({
        success: true,
        message: "Orders updated successfully",
        data: updatedCards,
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: "Failed to update orders",
        error: error.message,
      });
    }
  }
}