import { Request, Response } from "express";
import { GlobalSettings } from "../../schemas/settingsSchema";

// Get single global settings document
export const getSettings = async (req: Request, res: Response) => {
  try {
    let settings = await GlobalSettings.findOne();
    if (!settings) {
        settings = await GlobalSettings.create({
        performanceMetrics: ["dribble", "running", "defending", "strike", "stamina"],
        defaultFeeAmount: 1000,
        });
    }
    res.status(200).json({ success: true, data: settings });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// Update global settings document
export const updateSettings = async (req: Request, res: Response) => {
  try {
    const { performanceMetrics, defaultFeeAmount, currency } = req.body;
    
    let settings = await GlobalSettings.findOne();
    if (!settings) {
        settings = await GlobalSettings.create({});
    }

    if (performanceMetrics) settings.performanceMetrics = performanceMetrics;
    if (defaultFeeAmount !== undefined) settings.defaultFeeAmount = defaultFeeAmount;
    if (currency) settings.currency = currency;

    await settings.save();

    res.status(200).json({ success: true, data: settings });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error" });
  }
};
