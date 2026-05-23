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
    const { performanceMetrics, defaultFeeAmount, currency, heroMode, heroImages, logoUrl, logoAlignment, logoIsCircular, logoScale } = req.body;
    
    let settings = await GlobalSettings.findOne();
    if (!settings) {
        settings = await GlobalSettings.create({});
    }

    if (performanceMetrics) settings.performanceMetrics = performanceMetrics;
    if (defaultFeeAmount !== undefined) settings.defaultFeeAmount = defaultFeeAmount;
    if (currency) settings.currency = currency;
    if (heroMode) settings.heroMode = heroMode;
    if (heroImages) settings.heroImages = heroImages;
    if (logoUrl !== undefined) settings.logoUrl = logoUrl;
    if (logoAlignment) settings.logoAlignment = logoAlignment;
    if (logoIsCircular !== undefined) settings.logoIsCircular = logoIsCircular;
    if (logoScale !== undefined) settings.logoScale = logoScale;

    await settings.save();

    res.status(200).json({ success: true, data: settings });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// Get public settings (no auth required) for landing page
export const getPublicSettings = async (req: Request, res: Response) => {
  try {
    const settings = await GlobalSettings.findOne().select('heroMode heroImages currency logoUrl logoAlignment logoIsCircular logoScale');
    if (!settings) {
      return res.status(200).json({
        success: true,
        data: {
          heroMode: 'video',
          heroImages: [],
          currency: 'INR'
        }
      });
    }
    res.status(200).json({ success: true, data: settings });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error" });
  }
};
