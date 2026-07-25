"use client";
import { useState, useEffect } from "react";
import { Loader2, Plus, Trash2, Save, Upload, X } from "lucide-react";
import { IMAGE_BASE_URL } from "@/utils/constants";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CATEGORY_DEFINITIONS } from "@/lib/performance/taxonomy";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import {
  getSystemSettings,
  updateSystemSettings,
  uploadHeroImages,
  uploadLogo,
} from "@/services/settingsService";
import type { SystemSettings } from "@/services/settingsService";

export const SettingsManagement = () => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [settings, setSettings] = useState<SystemSettings>({
    performanceMetrics: [],
    defaultFeeAmount: 0,
    currency: "INR",
    heroMode: "video",
    heroImages: [],
    logoUrl: "",
    logoAlignment: "top_left",
    logoIsCircular: false,
    logoScale: 100,
  });
  const [newMetric, setNewMetric] = useState("");
  const [uploadingImages, setUploadingImages] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        setIsLoading(true);
        const data = await getSystemSettings();
        if (data) {
          setSettings(data);
        }
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to load settings.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };
    fetchSettings();
  }, []); // Remove toast from dependencies to prevent infinite loop

  const handleAddMetric = () => {
    if (!newMetric.trim()) return;
    const metric = newMetric.trim().toLowerCase();

    if (settings.performanceMetrics.includes(metric)) {
      toast({ title: "Metric already exists", variant: "destructive" });
      return;
    }

    setSettings({
      ...settings,
      performanceMetrics: [...settings.performanceMetrics, metric],
    });
    setNewMetric("");
  };

  const handleRemoveMetric = (metricToRemove: string) => {
    setSettings({
      ...settings,
      performanceMetrics: settings.performanceMetrics.filter(
        (m) => m !== metricToRemove,
      ),
    });
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      await updateSystemSettings({
        performanceMetrics: settings.performanceMetrics,
        defaultFeeAmount: Number(settings.defaultFeeAmount) || 0,
        currency: settings.currency || "INR",
        heroMode: settings.heroMode,
        heroImages: settings.heroImages,
        logoUrl: settings.logoUrl,
        logoAlignment: settings.logoAlignment,
        logoIsCircular: settings.logoIsCircular,
        logoScale: settings.logoScale,
        themeColor: settings.themeColor,
      });
      toast({
        title: "Success",
        description: "Settings updated successfully.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save settings.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-900">System Settings</h2>
        <p className="text-slate-500">
          Manage global configurations for the portal.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Your assessment vocabulary</CardTitle>
          <CardDescription>
            Extra metric names your coaches can pick when evaluating a student —
            alongside the suggestions already built into each area of the game.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/*
            These used to BE the categories, and this card was labelled
            "Performance Metrics". Phase 5 fixed the underlying problem — a
            technical drill and a match-play assessment were being averaged
            together — by making the four areas fixed in code. This list now
            means something narrower, and saying so is the point: an owner who
            adds "match play" here expecting it to become a category would be
            quietly wrong.
          */}
          <div className="mb-5 rounded-lg border border-slate-200 bg-slate-50 p-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              The four areas are fixed
            </p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {Object.values(CATEGORY_DEFINITIONS).map((definition) => (
                <span
                  key={definition.key}
                  className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-600"
                  title={definition.description}
                >
                  {definition.label}
                </span>
              ))}
            </div>
            <p className="mt-2 text-[11px] leading-relaxed text-slate-500">
              Every score belongs to one of these, and scores are only ever
              averaged within an area. They are the same at every academy so a
              student's record still means something after a transfer — which is
              why they cannot be edited here.
            </p>
          </div>

          <div className="flex gap-2 max-w-md mb-6">
            <Input
              placeholder="e.g. first touch, work rate..."
              value={newMetric}
              onChange={(e) => setNewMetric(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAddMetric()}
            />
            <Button onClick={handleAddMetric}>
              <Plus className="w-4 h-4 mr-2" /> Add
            </Button>
          </div>

          <div className="flex flex-wrap gap-2">
            {settings.performanceMetrics.length === 0 ? (
              <span className="text-sm text-slate-500 italic">
                None added — coaches will see the built-in suggestions for each
                area, and can type anything else they need.
              </span>
            ) : (
              settings.performanceMetrics.map((metric, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-2 bg-slate-100 px-3 py-1.5 rounded-full text-sm font-medium text-slate-800"
                >
                  <span className="capitalize">{metric}</span>
                  <button
                    onClick={() => handleRemoveMetric(metric)}
                    className="text-red-500 hover:text-red-700 ml-1 focus:outline-none"
                    title="Remove metric"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Fees Configuration</CardTitle>
          <CardDescription>
            Set the default fee amount applicable across the portal.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 max-w-md">
          <div className="space-y-2">
            <label className="text-sm font-medium">
              Default Fee Amount ({settings.currency})
            </label>
            <Input
              type="number"
              value={settings.defaultFeeAmount}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  defaultFeeAmount: Number(e.target.value),
                })
              }
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Landing Page Customization</CardTitle>
          <CardDescription>
            Configure the hero section of the landing page.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2 max-w-md">
            <label className="text-sm font-medium">Hero Background Mode</label>
            <Select
              value={settings.heroMode || "video"}
              onValueChange={(val: "video" | "carousel") =>
                setSettings({ ...settings, heroMode: val })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select mode" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="video">Default Video</SelectItem>
                <SelectItem value="carousel">Image Carousel</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {settings.heroMode === "carousel" && (
            <div className="space-y-4">
              <label className="text-sm font-medium">Carousel Images</label>

              <div className="flex flex-wrap gap-4">
                {settings.heroImages?.map((url, idx) => (
                  <div
                    key={idx}
                    className="relative group w-32 h-32 rounded-md overflow-hidden border"
                  >
                    <img
                      src={
                        url.startsWith("http") ? url : `${IMAGE_BASE_URL}${url}`
                      }
                      alt={`Hero ${idx}`}
                      className="w-full h-full object-cover"
                    />
                    <button
                      onClick={() => {
                        const newImages = [...(settings.heroImages || [])];
                        newImages.splice(idx, 1);
                        setSettings({ ...settings, heroImages: newImages });
                      }}
                      className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}

                <label className="flex flex-col items-center justify-center w-32 h-32 border-2 border-dashed rounded-md cursor-pointer hover:bg-slate-50 transition-colors">
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    {uploadingImages ? (
                      <Loader2 className="w-6 h-6 text-slate-400 animate-spin" />
                    ) : (
                      <>
                        <Upload className="w-6 h-6 text-slate-400 mb-2" />
                        <span className="text-xs text-slate-500">Upload</span>
                      </>
                    )}
                  </div>
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    className="hidden"
                    disabled={uploadingImages}
                    onChange={async (e) => {
                      if (!e.target.files || e.target.files.length === 0)
                        return;
                      try {
                        setUploadingImages(true);
                        const files = Array.from(e.target.files);
                        const urls = await uploadHeroImages(files);
                        setSettings({
                          ...settings,
                          heroImages: [...(settings.heroImages || []), ...urls],
                        });
                        toast({ title: "Images uploaded successfully" });
                      } catch (err) {
                        toast({
                          title: "Failed to upload images",
                          variant: "destructive",
                        });
                      } finally {
                        setUploadingImages(false);
                      }
                    }}
                  />
                </label>
              </div>
              <p className="text-xs text-slate-500">
                Upload high-quality images (1920x1080 recommended). Max 5MB per
                image.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Logo Customization</CardTitle>
          <CardDescription>
            Configure the brand logo and its placement.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2 max-w-md">
            <label className="text-sm font-medium">
              Logo Alignment (Hero Section)
            </label>
            <Select
              value={settings.logoAlignment || "top_left"}
              onValueChange={(val: "top_left" | "middle") =>
                setSettings({ ...settings, logoAlignment: val })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select alignment" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="top_left">Top Left</SelectItem>
                <SelectItem value="middle">Middle</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="circular-logo"
              checked={settings.logoIsCircular || false}
              onChange={(e) =>
                setSettings({ ...settings, logoIsCircular: e.target.checked })
              }
              className="w-4 h-4 cursor-pointer"
            />
            <label
              htmlFor="circular-logo"
              className="text-sm font-medium cursor-pointer"
            >
              Make Logo Circular
            </label>
          </div>

          <div className="space-y-2 max-w-md">
            <label className="text-sm font-medium flex justify-between">
              <span>Logo Size Scale</span>
              <span>{settings.logoScale || 100}%</span>
            </label>
            <input
              type="range"
              min="50"
              max="300"
              value={settings.logoScale || 100}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  logoScale: parseInt(e.target.value),
                })
              }
              className="w-full cursor-pointer"
            />
          </div>

          <div className="space-y-4">
            <label className="text-sm font-medium">Brand Logo</label>
            <div className="flex flex-wrap gap-4">
              {settings.logoUrl && (
                <div className="relative group w-32 h-32 rounded-md overflow-hidden border bg-black/5 flex items-center justify-center">
                  <img
                    src={
                      settings.logoUrl.startsWith("http")
                        ? settings.logoUrl
                        : `${IMAGE_BASE_URL}${settings.logoUrl}`
                    }
                    alt="Brand Logo"
                    className="max-w-full max-h-full object-contain p-2"
                  />
                  <button
                    onClick={() => {
                      setSettings({ ...settings, logoUrl: "" });
                    }}
                    className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}

              <label className="flex flex-col items-center justify-center w-32 h-32 border-2 border-dashed rounded-md cursor-pointer hover:bg-slate-50 transition-colors">
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  {uploadingLogo ? (
                    <Loader2 className="w-6 h-6 text-slate-400 animate-spin" />
                  ) : (
                    <>
                      <Upload className="w-6 h-6 text-slate-400 mb-2" />
                      <span className="text-xs text-slate-500">Upload Logo</span>
                    </>
                  )}
                </div>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  disabled={uploadingLogo}
                  onChange={async (e) => {
                    if (!e.target.files || e.target.files.length === 0) return;
                    try {
                      setUploadingLogo(true);
                      const file = e.target.files[0];
                      const url = await uploadLogo(file);
                      setSettings({
                        ...settings,
                        logoUrl: url,
                      });
                      toast({ title: "Logo uploaded successfully" });
                    } catch (err) {
                      toast({
                        title: "Failed to upload logo",
                        variant: "destructive",
                      });
                    } finally {
                      setUploadingLogo(false);
                    }
                  }}
                />
              </label>
            </div>
            <p className="text-xs text-slate-500">
              Upload a PNG or SVG with transparent background.
            </p>
          </div>
          
          {/* Theme Color Picker */}
          <div className="space-y-2 max-w-md pt-4 border-t">
            <label className="text-sm font-medium block">
              Primary Theme Color
            </label>
            <div className="flex items-center gap-4">
              <input
                type="color"
                value={settings.themeColor || "#3b82f6"}
                onChange={(e) =>
                  setSettings({ ...settings, themeColor: e.target.value })
                }
                className="w-12 h-12 p-1 rounded-md cursor-pointer border"
              />
              <Input
                type="text"
                value={settings.themeColor || "#3b82f6"}
                onChange={(e) =>
                  setSettings({ ...settings, themeColor: e.target.value })
                }
                className="w-32 font-mono uppercase"
                placeholder="#000000"
              />
            </div>
            <p className="text-xs text-slate-500">
              Used for buttons, accents, and the main branding color on your landing page.
            </p>
          </div>
        </CardContent>
        <CardFooter className="border-t pt-4">
          <Button
            onClick={handleSave}
            disabled={isSaving}
            className="w-full sm:w-auto"
          >
            {isSaving ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Save className="w-4 h-4 mr-2" />
            )}
            Save Settings
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};
