import apiService from "./apiService";

export interface SystemSettings {
  _id?: string;
  performanceMetrics: string[];
  defaultFeeAmount: number;
  currency: string;
  heroMode?: "video" | "carousel";
  heroImages?: string[];
  logoUrl?: string;
  logoAlignment?: "top_left" | "middle";
  logoIsCircular?: boolean;
  logoScale?: number;
  themeColor?: string;
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

export const uploadHeroImages = async (files: File[]): Promise<string[]> => {
  const formData = new FormData();
  files.forEach((file) => formData.append("images", file));

  const response = await apiService.post(
    "/admin/settings/upload-hero",
    formData,
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    },
  );
  return (response as any).data.urls;
};

export const uploadLogo = async (file: File): Promise<string> => {
  const formData = new FormData();
  formData.append("logo", file);

  const response = await apiService.post(
    "/admin/settings/upload-logo",
    formData,
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    },
  );
  return (response as any).data.url;
};
