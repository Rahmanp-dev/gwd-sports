import apiService from "./apiService";

export interface SystemSettings {
  _id?: string;
  performanceMetrics: string[];
  defaultFeeAmount: number;
  currency: string;
}

export const getSystemSettings = async (): Promise<SystemSettings> => {
  const response = await apiService.get("/admin/settings");
  return (response as any).data;
};

export const updateSystemSettings = async (
  settings: Partial<SystemSettings>,
): Promise<SystemSettings> => {
  const response = await apiService.put("/admin/settings", settings);
  return (response as any).data;
};
