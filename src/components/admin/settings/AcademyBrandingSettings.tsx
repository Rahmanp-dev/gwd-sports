"use client";
import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useAppSelector } from "@/store";
import { academyService, Academy } from "@/services/academyService";
import { toastUtils } from "@/utils/toast";

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Loader2, Save, Upload, X, Palette, Image as ImageIcon, Type } from "lucide-react";
import { IMAGE_BASE_URL } from "@/utils/constants";
import { uploadLogo } from "@/services/settingsService";

const brandingSchema = z.object({
  primaryColor: z.string().regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, {
    message: "Must be a valid hex color code (e.g. #3b82f6)",
  }),
  logoUrl: z.string().optional(),
  tagline: z.string().max(100, "Tagline must be less than 100 characters").optional(),
  monthlyFee: z.coerce.number().min(0, "Fee cannot be negative"),
  quarterlyFee: z.coerce.number().min(0, "Fee cannot be negative"),
  halfYearlyFee: z.coerce.number().min(0, "Fee cannot be negative"),
  yearlyFee: z.coerce.number().min(0, "Fee cannot be negative"),
});

type BrandingFormValues = z.infer<typeof brandingSchema>;

export const AcademyBrandingSettings: React.FC = () => {
  const { user } = useAppSelector((state) => state.auth);
  const [academy, setAcademy] = useState<Academy | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const form = useForm<BrandingFormValues>({
    resolver: zodResolver(brandingSchema),
    defaultValues: {
      primaryColor: "#3b82f6",
      logoUrl: "",
      tagline: "",
      monthlyFee: 0,
      quarterlyFee: 0,
      halfYearlyFee: 0,
      yearlyFee: 0,
    },
  });

  useEffect(() => {
    const fetchAcademy = async () => {
      if (!user?.academyId) {
        setIsLoading(false);
        return;
      }
      try {
        const response = await academyService.getAcademyById(user.academyId);
        if (response?.data?.academy) {
          const acad = response.data.academy;
          setAcademy(acad);
          form.reset({
            primaryColor: acad.theme?.primaryColor || "#3b82f6",
            logoUrl: acad.theme?.logoUrl || "",
            tagline: acad.theme?.tagline || "",
            monthlyFee: acad.fees?.monthly || 0,
            quarterlyFee: acad.fees?.quarterly || 0,
            halfYearlyFee: acad.fees?.halfYearly || 0,
            yearlyFee: acad.fees?.yearly || 0,
          });
        }
      } catch (error) {
        toastUtils.error("Error", "Failed to load academy branding settings");
      } finally {
        setIsLoading(false);
      }
    };
    fetchAcademy();
  }, [user?.academyId, form]);

  const onSubmit = async (data: BrandingFormValues) => {
    if (!academy?._id) return;
    
    setIsSaving(true);
    try {
      await academyService.updateAcademy(academy._id, {
        "theme.primaryColor": data.primaryColor,
        "theme.logoUrl": data.logoUrl,
        "theme.tagline": data.tagline,
        "fees.monthly": data.monthlyFee,
        "fees.quarterly": data.quarterlyFee,
        "fees.halfYearly": data.halfYearlyFee,
        "fees.yearly": data.yearlyFee,
      } as any);
      
      toastUtils.success("Success", "Branding settings updated successfully");
    } catch (error) {
      toastUtils.error("Error", "Failed to update branding settings");
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    try {
      setIsUploading(true);
      const file = e.target.files[0];
      const url = await uploadLogo(file);
      form.setValue("logoUrl", url);
      toastUtils.success("Success", "Logo uploaded successfully");
    } catch (err) {
      toastUtils.error("Error", "Failed to upload logo");
    } finally {
      setIsUploading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!academy) {
    return (
      <Card className="border-slate-200 shadow-sm">
        <CardContent className="p-8 text-center text-slate-500">
          No academy found or you don't have permission to edit branding.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h2 className="text-2xl font-bold text-slate-900 font-display">Academy Settings & Branding</h2>
        <p className="text-slate-500 mt-1">
          Customize your fees and how your academy looks to your students.
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <Card className="border-slate-200 shadow-sm overflow-hidden">
            <CardHeader className="bg-slate-50 border-b border-slate-100">
              <CardTitle className="text-lg flex items-center gap-2 text-slate-900">
                <ImageIcon className="w-5 h-5 text-slate-500" />
                Logo & Identity
              </CardTitle>
              <CardDescription>
                Upload your academy's logo and define your primary brand color.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6 space-y-8">
              
              {/* Logo Upload */}
              <div className="space-y-4">
                <FormLabel className="text-slate-900 font-semibold text-sm">Brand Logo</FormLabel>
                <div className="flex flex-wrap items-end gap-6">
                  {form.watch("logoUrl") ? (
                    <div className="relative group w-32 h-32 rounded-xl border border-slate-200 bg-white shadow-sm flex items-center justify-center overflow-hidden">
                      <img
                        src={
                          form.watch("logoUrl")!.startsWith("http")
                            ? form.watch("logoUrl")
                            : `${IMAGE_BASE_URL}${form.watch("logoUrl")}`
                        }
                        alt="Academy Logo"
                        className="max-w-full max-h-full object-contain p-2"
                      />
                      <button
                        type="button"
                        onClick={() => form.setValue("logoUrl", "")}
                        className="absolute top-2 right-2 bg-red-500 text-white p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-sm hover:bg-red-600"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <div className="w-32 h-32 rounded-xl border-2 border-dashed border-slate-200 bg-slate-50 flex flex-col items-center justify-center text-slate-400">
                      <ImageIcon className="w-8 h-8 mb-2 opacity-50" />
                      <span className="text-xs font-medium">No Logo</span>
                    </div>
                  )}

                  <label className="flex flex-col items-center justify-center h-11 px-4 border border-slate-200 rounded-xl cursor-pointer hover:bg-slate-50 transition-colors bg-white shadow-sm">
                    <div className="flex items-center gap-2">
                      {isUploading ? (
                        <>
                          <Loader2 className="w-4 h-4 text-slate-600 animate-spin" />
                          <span className="text-sm font-medium text-slate-700">Uploading...</span>
                        </>
                      ) : (
                        <>
                          <Upload className="w-4 h-4 text-slate-600" />
                          <span className="text-sm font-medium text-slate-700">Upload Image</span>
                        </>
                      )}
                    </div>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      disabled={isUploading}
                      onChange={handleLogoUpload}
                    />
                  </label>
                </div>
                <p className="text-xs text-slate-500 font-medium">
                  Upload a PNG or SVG with a transparent background. Max size 2MB.
                </p>
              </div>

              {/* Primary Color Picker */}
              <FormField
                control={form.control}
                name="primaryColor"
                render={({ field }) => (
                  <FormItem className="max-w-md">
                    <FormLabel className="text-slate-900 font-semibold text-sm flex items-center gap-2">
                      <Palette className="w-4 h-4 text-slate-500" />
                      Primary Brand Color
                    </FormLabel>
                    <FormControl>
                      <div className="flex items-center gap-4 mt-2">
                        <div className="relative rounded-xl overflow-hidden shadow-sm border border-slate-200 w-12 h-12 flex-shrink-0">
                          <input
                            type="color"
                            {...field}
                            className="absolute -top-2 -left-2 w-16 h-16 cursor-pointer border-0 p-0"
                          />
                        </div>
                        <Input
                          {...field}
                          className="h-11 font-mono uppercase bg-white border-slate-200"
                          placeholder="#3B82F6"
                        />
                      </div>
                    </FormControl>
                    <FormDescription className="text-slate-500">
                      Used for buttons, accents, and highlights on your academy's landing page.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Tagline */}
              <FormField
                control={form.control}
                name="tagline"
                render={({ field }) => (
                  <FormItem className="max-w-md">
                    <FormLabel className="text-slate-900 font-semibold text-sm flex items-center gap-2">
                      <Type className="w-4 h-4 text-slate-500" />
                      Academy Tagline
                    </FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        className="h-11 bg-white border-slate-200"
                        placeholder="e.g. Empowering the Next Generation of Athletes"
                      />
                    </FormControl>
                    <FormDescription className="text-slate-500">
                      A short, catchy phrase displayed under your academy name.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

            </CardContent>
          </Card>

          <Card className="border-slate-200 shadow-sm overflow-hidden">
            <CardHeader className="bg-slate-50 border-b border-slate-100">
              <CardTitle className="text-lg flex items-center gap-2 text-slate-900">
                Fee Structure
              </CardTitle>
              <CardDescription>
                Define the standard fees that students will pay based on their selected period.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Monthly Fee */}
                <FormField
                  control={form.control}
                  name="monthlyFee"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-slate-900 font-semibold text-sm">Monthly Fee (₹)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          {...field}
                          className="bg-white border-slate-200"
                          placeholder="e.g. 1000"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Quarterly Fee */}
                <FormField
                  control={form.control}
                  name="quarterlyFee"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-slate-900 font-semibold text-sm">Quarterly Fee (₹)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          {...field}
                          className="bg-white border-slate-200"
                          placeholder="e.g. 2800"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Half-Yearly Fee */}
                <FormField
                  control={form.control}
                  name="halfYearlyFee"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-slate-900 font-semibold text-sm">Half-Yearly Fee (₹)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          {...field}
                          className="bg-white border-slate-200"
                          placeholder="e.g. 5500"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Yearly Fee */}
                <FormField
                  control={form.control}
                  name="yearlyFee"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-slate-900 font-semibold text-sm">Yearly Fee (₹)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          {...field}
                          className="bg-white border-slate-200"
                          placeholder="e.g. 10000"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
            <CardFooter className="bg-slate-50 border-t border-slate-100 px-6 py-4 flex justify-end">
              <Button
                type="submit"
                disabled={isSaving}
                className="bg-blue-600 hover:bg-blue-700 text-white shadow-sm font-semibold h-10 px-6 rounded-xl"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Save Changes
                  </>
                )}
              </Button>
            </CardFooter>
          </Card>
        </form>
      </Form>
    </div>
  );
};
