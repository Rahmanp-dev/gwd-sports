import { useState, useEffect } from "react";
import { Loader2, Plus, Trash2, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  });
  const [newMetric, setNewMetric] = useState("");

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
