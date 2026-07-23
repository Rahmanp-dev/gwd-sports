import { useState, useEffect } from "react";
import { Loader2, Plus, Trash2, Save, Upload, X } from "lucide-react";
import { IMAGE_BASE_URL } from "@/utils/constants";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
        <h2 className="text-2xl font-bold text-gray-900">System Settings</h2>
        <p className="text-gray-500">
          Manage global configurations for the portal.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Performance Metrics</CardTitle>
          <CardDescription>
            Define the metrics trainers will use to evaluate students. Metrics
            can take integer values.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2 max-w-md mb-6">
            <Input
              placeholder="e.g. stamina, strike..."
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
              <span className="text-sm text-gray-500 italic">
                No metrics defined.
              </span>
            ) : (
              settings.performanceMetrics.map((metric, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-2 bg-gray-100 px-3 py-1.5 rounded-full text-sm font-medium text-gray-800"
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

                <label className="flex flex-col items-center justify-center w-32 h-32 border-2 border-dashed rounded-md cursor-pointer hover:bg-gray-50 transition-colors">
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    {uploadingImages ? (
                      <Loader2 className="w-6 h-6 text-gray-400 animate-spin" />
                    ) : (
                      <>
                        <Upload className="w-6 h-6 text-gray-400 mb-2" />
                        <span className="text-xs text-gray-500">Upload</span>
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
              <p className="text-xs text-gray-500">
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

              <label className="flex flex-col items-center justify-center w-32 h-32 border-2 border-dashed rounded-md cursor-pointer hover:bg-gray-50 transition-colors">
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  {uploadingLogo ? (
                    <Loader2 className="w-6 h-6 text-gray-400 animate-spin" />
                  ) : (
                    <>
                      <Upload className="w-6 h-6 text-gray-400 mb-2" />
                      <span className="text-xs text-gray-500">Upload Logo</span>
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
            <p className="text-xs text-gray-500">
              Upload a PNG or SVG with transparent background.
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
