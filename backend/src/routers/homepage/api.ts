import { Router } from "express";
import { HomepageController } from "../../controllers/homepage";
import { authMiddleware, adminMiddleware } from "../../middleware/auth";

const router = Router();

// Public route
router.get("/events", HomepageController.getLandingPageEvents);

// Admin routes
router.use(authMiddleware, adminMiddleware);
router.get("/admin/events", HomepageController.getAdminLandingPageEvents);
router.post("/admin/events", HomepageController.addEventCard);
router.put("/admin/events/:id", HomepageController.updateEventCard);
router.delete("/admin/events/:id", HomepageController.deleteEventCard);
router.put("/admin/events/bulk/reorder", HomepageController.bulkUpdateOrders);

export default router;