"use client";

import { useState, useRef } from "react";
import { useTranslations } from "next-intl";
import Image from "next/image";
import { Camera, Check, Trash2, LogOut, ChevronDown } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  updateProfile,
  updateEmail,
  updatePassword,
  deleteAccount,
} from "@/app/actions/account";
import { logout } from "@/app/actions/auth";

interface AccountFormProps {
  locale: string;
  email: string;
  avatarPath: string | null;
}

export default function AccountForm({
  locale,
  email,
  avatarPath,
}: AccountFormProps) {
  const t = useTranslations("Account");

  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  const [newEmail, setNewEmail] = useState(email);
  const [emailLoading, setEmailLoading] = useState(false);
  const [emailSuccess, setEmailSuccess] = useState(false);
  const [emailError, setEmailError] = useState<string | null>(null);

  const [currentPwd, setCurrentPwd] = useState("");
  const [newPwd, setNewPwd] = useState("");
  const [confirmPwd, setConfirmPwd] = useState("");
  const [pwdLoading, setPwdLoading] = useState(false);
  const [pwdSuccess, setPwdSuccess] = useState(false);
  const [pwdError, setPwdError] = useState<string | null>(null);

  const [deleteConfirming, setDeleteConfirming] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [dangerOpen, setDangerOpen] = useState(false);

  function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  }

  const avatarSrc = avatarPreview
    || (avatarPath
      ? `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/avatars/${avatarPath}`
      : null);

  async function handleProfileSubmit(e: React.FormEvent) {
    e.preventDefault();
    setProfileLoading(true);
    setProfileError(null);
    setProfileSuccess(false);

    const formData = new FormData();
    if (avatarFile) formData.set("avatar", avatarFile);

    const result = await updateProfile(locale, formData);

    if (result.error) {
      setProfileError(t(result.error));
    } else {
      setProfileSuccess(true);
      setTimeout(() => setProfileSuccess(false), 3000);
    }
    setProfileLoading(false);
  }

  async function handleEmailSubmit(e: React.FormEvent) {
    e.preventDefault();
    setEmailLoading(true);
    setEmailError(null);
    setEmailSuccess(false);

    const result = await updateEmail(locale, newEmail);

    if (result.error) {
      setEmailError(t(result.error));
    } else {
      setEmailSuccess(true);
    }
    setEmailLoading(false);
  }

  async function handlePasswordSubmit(e: React.FormEvent) {
    e.preventDefault();
    setPwdLoading(true);
    setPwdError(null);
    setPwdSuccess(false);

    if (newPwd !== confirmPwd) {
      setPwdError(t("passwordMismatch"));
      setPwdLoading(false);
      return;
    }

    const result = await updatePassword(locale, currentPwd, newPwd);

    if (result.error) {
      setPwdError(t(result.error));
    } else {
      setPwdSuccess(true);
      setCurrentPwd("");
      setNewPwd("");
      setConfirmPwd("");
      setTimeout(() => setPwdSuccess(false), 3000);
    }
    setPwdLoading(false);
  }

  async function handleDelete() {
    setDeleteLoading(true);
    await deleteAccount(locale);
    setDeleteLoading(false);
  }

  return (
    <div className="space-y-8">
      {/* Profile section */}
      <form
        onSubmit={handleProfileSubmit}
        className="rounded-xl border border-border bg-surface p-6 space-y-5"
      >
        <h2 className="text-lg font-semibold text-text-primary">
          {t("profileSection")}
        </h2>

        <div className="flex items-center gap-4">
          <div className="relative">
            {avatarSrc ? (
              <Image
                src={avatarSrc}
                alt="Avatar"
                width={72}
                height={72}
                className="w-18 h-18 rounded-full object-cover border-2 border-border"
              />
            ) : (
              <div className="w-18 h-18 rounded-full bg-background border-2 border-border flex items-center justify-center">
                <Camera className="h-6 w-6 text-text-tertiary" />
              </div>
            )}
          </div>
          <div>
            <button
              type="button"
              onClick={() => avatarInputRef.current?.click()}
              className="text-sm font-medium text-primary-text hover:underline"
            >
              {t("changeAvatar")}
            </button>
            <p className="text-xs text-text-tertiary mt-0.5">
              {t("avatarHint")}
            </p>
            <input
              ref={avatarInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handleAvatarChange}
              className="hidden"
            />
          </div>
        </div>

        {profileError && (
          <p className="text-sm text-error">{profileError}</p>
        )}

        <div className="flex items-center gap-3">
          <Button type="submit" disabled={profileLoading} size="sm">
            {profileLoading ? t("saving") : t("save")}
          </Button>
          {profileSuccess && (
            <span className="inline-flex items-center gap-1 text-sm text-green-600">
              <Check className="h-4 w-4" />
              {t("saved")}
            </span>
          )}
        </div>
      </form>

      {/* Email section */}
      <form
        onSubmit={handleEmailSubmit}
        className="rounded-xl border border-border bg-surface p-6 space-y-5"
      >
        <h2 className="text-lg font-semibold text-text-primary">
          {t("emailSection")}
        </h2>

        <Input
          label={t("newEmail")}
          id="email"
          type="email"
          required
          value={newEmail}
          onChange={(e) => setNewEmail(e.target.value)}
          hint={t("emailHint")}
        />

        {emailError && <p className="text-sm text-error">{emailError}</p>}
        {emailSuccess && (
          <p className="text-sm text-green-600">{t("emailConfirmSent")}</p>
        )}

        <Button
          type="submit"
          disabled={emailLoading || newEmail === email}
          size="sm"
        >
          {emailLoading ? t("saving") : t("save")}
        </Button>
      </form>

      {/* Password section */}
      <form
        onSubmit={handlePasswordSubmit}
        className="rounded-xl border border-border bg-surface p-6 space-y-5"
      >
        <h2 className="text-lg font-semibold text-text-primary">
          {t("passwordSection")}
        </h2>

        <Input
          label={t("currentPassword")}
          id="current_password"
          type="password"
          required
          value={currentPwd}
          onChange={(e) => setCurrentPwd(e.target.value)}
        />

        <Input
          label={t("newPassword")}
          id="new_password"
          type="password"
          required
          value={newPwd}
          onChange={(e) => setNewPwd(e.target.value)}
        />

        <Input
          label={t("confirmPassword")}
          id="confirm_password"
          type="password"
          required
          value={confirmPwd}
          onChange={(e) => setConfirmPwd(e.target.value)}
        />

        {pwdError && <p className="text-sm text-error">{pwdError}</p>}

        <div className="flex items-center gap-3">
          <Button
            type="submit"
            disabled={pwdLoading || !currentPwd || !newPwd || !confirmPwd}
            size="sm"
          >
            {pwdLoading ? t("saving") : t("save")}
          </Button>
          {pwdSuccess && (
            <span className="inline-flex items-center gap-1 text-sm text-green-600">
              <Check className="h-4 w-4" />
              {t("saved")}
            </span>
          )}
        </div>
      </form>

      {/* Logout */}
      <div className="rounded-xl border border-border bg-surface p-6">
        <form action={logout.bind(null, locale)}>
          <Button variant="ghost" type="submit" className="text-text-secondary">
            <LogOut className="h-4 w-4 mr-1.5" />
            {t("logout")}
          </Button>
        </form>
      </div>

      {/* Danger zone */}
      <div className="rounded-xl border border-error/30 bg-surface p-6 space-y-4">
        <button
          type="button"
          onClick={() => setDangerOpen(!dangerOpen)}
          className="flex w-full items-center justify-between"
        >
          <h2 className="text-lg font-semibold text-error">
            {t("dangerZone")}
          </h2>
          <ChevronDown
            className={`h-5 w-5 text-error transition-transform ${dangerOpen ? "rotate-0" : "-rotate-90"}`}
          />
        </button>

        {dangerOpen && (
          <>
            {deleteConfirming ? (
              <div className="space-y-3">
                <p className="text-sm text-text-secondary">
                  {t("deleteWarning")}
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={handleDelete}
                    disabled={deleteLoading}
                  >
                    <Trash2 className="h-3.5 w-3.5 mr-1" />
                    {deleteLoading ? t("deleting") : t("confirmDeleteAccount")}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setDeleteConfirming(false)}
                    disabled={deleteLoading}
                  >
                    {t("cancelDelete")}
                  </Button>
                </div>
              </div>
            ) : (
              <Button
                variant="destructive"
                size="sm"
                onClick={() => setDeleteConfirming(true)}
              >
                <Trash2 className="h-3.5 w-3.5 mr-1" />
                {t("deleteAccount")}
              </Button>
            )}
          </>
        )}
      </div>
    </div>
  );
}
