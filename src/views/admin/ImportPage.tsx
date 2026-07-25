"use client";

import React from "react";
import { OnboardingCenter } from "@/components/admin/import/OnboardingCenter";

/**
 * The standalone URL for bulk onboarding.
 *
 * The screen itself lives in `components/admin/import/OnboardingCenter` because
 * it is also mounted inside the admin dashboard's Import tab. This page is the
 * shareable link — an owner sent "go here and upload your register" should land
 * on the wizard, not on a dashboard they have to navigate.
 */
export const ImportPage: React.FC = () => (
  <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
    <OnboardingCenter />
  </div>
);

export default ImportPage;
