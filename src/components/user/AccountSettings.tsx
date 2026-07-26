"use client";
import React, { useEffect, useState } from "react";
import { useAppDispatch, useAppSelector } from "@/store";
import { setUser } from "@/store/slices/authSlice";
import { userService } from "@/services/userService";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, Lock, Mail, Phone, Save, Shield, User as UserIcon } from "lucide-react";
import { toast } from "sonner";

/**
 * Account and password settings, for use inside a role dashboard.
 *
 * These controls used to exist only on /user/profile. When students and
 * coaches were redirected off that page to their real dashboards, changing a
 * name or password would have become unreachable — so the controls moved here,
 * as a tab, rather than the redirect being dropped.
 *
 * Styled against the dark dashboard chrome the portal pages use, and picks up
 * the academy's brand colour via `--brand` for its primary action, so it does
 * not look like a bolted-on panel from a different application.
 */
export const AccountSettings: React.FC = () => {
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((s) => s.auth);

  const [profile, setProfile] = useState({ name: "", phone: "" });
  const [savingProfile, setSavingProfile] = useState(false);

  const [pw, setPw] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [savingPw, setSavingPw] = useState(false);
  const [pwError, setPwError] = useState("");

  useEffect(() => {
    setProfile({ name: user?.name ?? "", phone: user?.phone ?? "" });
  }, [user?.name, user?.phone]);

  const saveProfile = async () => {
    if (!profile.name.trim()) {
      toast.error("Your name cannot be empty.");
      return;
    }
    setSavingProfile(true);
    try {
      const res = await userService.updateProfile(profile);
      if (res?.success && res.data?.user) {
        dispatch(setUser(res.data.user));
        toast.success("Profile updated.");
      } else {
        toast.error("Could not update your profile.");
      }
    } catch (e: any) {
      toast.error(e?.response?.data?.message || "Could not update your profile.");
    } finally {
      setSavingProfile(false);
    }
  };

  const savePassword = async () => {
    setPwError("");

    if (pw.newPassword.length < 8) {
      setPwError("Your new password must be at least 8 characters.");
      return;
    }
    if (pw.newPassword !== pw.confirmPassword) {
      // Checked here rather than only on the server: the server never receives
      // the confirmation field, so this is the only place it can be compared.
      setPwError("The two new passwords do not match.");
      return;
    }

    setSavingPw(true);
    try {
      const res = await userService.changePassword({
        currentPassword: pw.currentPassword,
        newPassword: pw.newPassword,
      });
      if (res?.success) {
        toast.success("Password changed.");
        setPw({ currentPassword: "", newPassword: "", confirmPassword: "" });
      } else {
        setPwError(res?.message || "Could not change your password.");
      }
    } catch (e: any) {
      setPwError(
        e?.response?.data?.message ||
          "Could not change your password. Check your current password and try again.",
      );
    } finally {
      setSavingPw(false);
    }
  };

  const brandButton = {
    background: "var(--brand)",
    color: "var(--brand-on)",
  } as React.CSSProperties;

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {/* Profile */}
      <Card className="border-gray-700 bg-gray-800">
        <CardContent className="space-y-4 p-6">
          <div className="flex items-center gap-2">
            <UserIcon className="h-4 w-4 text-gray-400" />
            <h3 className="text-base font-bold text-white">Your details</h3>
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold text-gray-400">
              Full name
            </label>
            <Input
              value={profile.name}
              disabled={savingProfile}
              onChange={(e) => setProfile({ ...profile, name: e.target.value })}
              className="border-gray-700 bg-gray-900 text-white"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold text-gray-400">
              Phone
            </label>
            <div className="flex items-center gap-2">
              <Phone className="h-4 w-4 flex-shrink-0 text-gray-500" />
              <Input
                value={profile.phone}
                disabled={savingProfile}
                onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                className="border-gray-700 bg-gray-900 text-white"
              />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold text-gray-400">
              Email
            </label>
            <div className="flex items-center gap-2 rounded-md border border-gray-700 bg-gray-900/60 px-3 py-2">
              <Mail className="h-4 w-4 flex-shrink-0 text-gray-500" />
              <span className="truncate text-sm text-gray-300">{user?.email}</span>
            </div>
            {/* Changing an email would move the account's identity and its
                login. That needs verification, which does not exist yet, so it
                is shown read-only rather than offered and quietly ignored. */}
            <p className="mt-1 text-[11px] text-gray-500">
              To change your email, ask your academy.
            </p>
          </div>

          <Button
            onClick={saveProfile}
            disabled={savingProfile}
            style={brandButton}
            className="w-full font-semibold hover:opacity-90"
          >
            {savingProfile ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Save className="mr-2 h-4 w-4" />
            )}
            Save changes
          </Button>
        </CardContent>
      </Card>

      {/* Password */}
      <Card className="border-gray-700 bg-gray-800">
        <CardContent className="space-y-4 p-6">
          <div className="flex items-center gap-2">
            <Shield className="h-4 w-4 text-gray-400" />
            <h3 className="text-base font-bold text-white">Password</h3>
          </div>

          {pwError && (
            <div className="rounded-lg border border-red-800/50 bg-red-950/40 px-3 py-2 text-xs text-red-200">
              {pwError}
            </div>
          )}

          {(
            [
              ["currentPassword", "Current password"],
              ["newPassword", "New password"],
              ["confirmPassword", "Confirm new password"],
            ] as const
          ).map(([field, label]) => (
            <div key={field}>
              <label className="mb-1 block text-xs font-semibold text-gray-400">
                {label}
              </label>
              <div className="flex items-center gap-2">
                <Lock className="h-4 w-4 flex-shrink-0 text-gray-500" />
                <Input
                  type="password"
                  autoComplete={
                    field === "currentPassword" ? "current-password" : "new-password"
                  }
                  value={pw[field]}
                  disabled={savingPw}
                  onChange={(e) => setPw({ ...pw, [field]: e.target.value })}
                  className="border-gray-700 bg-gray-900 text-white"
                />
              </div>
            </div>
          ))}

          <p className="text-[11px] leading-relaxed text-gray-500">
            At least 8 characters. You will stay signed in on this device.
          </p>

          <Button
            onClick={savePassword}
            disabled={
              savingPw ||
              !pw.currentPassword ||
              !pw.newPassword ||
              !pw.confirmPassword
            }
            style={brandButton}
            className="w-full font-semibold hover:opacity-90"
          >
            {savingPw ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Lock className="mr-2 h-4 w-4" />
            )}
            Change password
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default AccountSettings;
