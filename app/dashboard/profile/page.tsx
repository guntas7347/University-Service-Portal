"use client";

import React, { useState, useEffect } from "react";
import {
  User,
  Mail,
  Smartphone,
  Hash,
  Calendar,
  GraduationCap,
  Loader2,
  Briefcase,
  Shield,
  Landmark,
  CheckCircle2,
  Info,
  Lock,
  Award,
  Pencil,
  Trash2,
  Check,
  AlertCircle,
  Settings,
  MailPlus,
  Building2,
} from "lucide-react";
import {
  getProfile,
  updateSecondaryEmail,
  updateUserDepartment,
} from "@/lib/actions/users";
import { getDepartments } from "@/lib/actions/departments";

export interface ProfileUser {
  id: string;
  email: string;
  email2?: string;
  name: string;
  username: string;
  fatherName: string;
  rollNumber: string;
  dob: string;
  gender: string;
  degree: string;
  specialization: string;
  enrolledCourse: string;
  photo: string;
  role: string;
  designation: string;
  departmentId: string;
  departmentName: string;
  mobile: string;
  rights: string[];
}

export default function ProfilePage() {
  const [user, setUser] = useState<ProfileUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [photoError, setPhotoError] = useState(false);

  // Department assignment state
  const [departments, setDepartments] = useState<any[]>([]);
  const [selectedDepartment, setSelectedDepartment] = useState("");
  const [isSavingDepartment, setIsSavingDepartment] = useState(false);
  const [departmentFeedback, setDepartmentFeedback] = useState("");

  // Secondary email state
  const [isEditingEmail2, setIsEditingEmail2] = useState(false);
  const [email2Input, setEmail2Input] = useState("");
  const [isSavingEmail2, setIsSavingEmail2] = useState(false);
  const [email2Feedback, setEmail2Feedback] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  useEffect(() => {
    const loadProfile = async () => {
      setIsLoading(true);
      try {
        const response = await getProfile();
        if (response.success && response.user) {
          const profile = response.user as ProfileUser;
          setUser(profile);
          setEmail2Input(profile.email2 || "");
        }
      } catch (err) {
        console.error("Error loading profile:", err);
      } finally {
        setIsLoading(false);
      }
    };
    loadProfile();
  }, []);

  useEffect(() => {
    getDepartments().then((result) => {
      if (result.success) {
        setDepartments(result.departments || []);
      }
    });
  }, []);

  const handleSaveEmail2 = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsSavingEmail2(true);
    setEmail2Feedback(null);
    try {
      const res = await updateSecondaryEmail(email2Input);
      if (res.success) {
        setEmail2Feedback({ type: "success", message: res.message });
        setUser((prev) =>
          prev ? { ...prev, email2: res.email2 || "" } : prev,
        );
        setEmail2Input(res.email2 || "");
        setIsEditingEmail2(false);
      } else {
        setEmail2Feedback({ type: "error", message: res.message });
      }
    } catch (err: any) {
      setEmail2Feedback({
        type: "error",
        message: err.message || "An unexpected error occurred.",
      });
    } finally {
      setIsSavingEmail2(false);
    }
  };

  const handleRemoveEmail2 = async () => {
    if (
      !confirm("Are you sure you want to remove your secondary personal email?")
    ) {
      return;
    }
    setIsSavingEmail2(true);
    setEmail2Feedback(null);
    try {
      const res = await updateSecondaryEmail("");
      if (res.success) {
        setEmail2Feedback({
          type: "success",
          message: "Secondary email removed.",
        });
        setUser((prev) => (prev ? { ...prev, email2: "" } : prev));
        setEmail2Input("");
        setIsEditingEmail2(false);
      } else {
        setEmail2Feedback({ type: "error", message: res.message });
      }
    } catch (err: any) {
      setEmail2Feedback({
        type: "error",
        message: err.message || "An unexpected error occurred.",
      });
    } finally {
      setIsSavingEmail2(false);
    }
  };

  const handleAssignDepartment = async () => {
    if (!selectedDepartment) return;
    const confirmed = window.confirm(
      `Confirm saving department? You will not be allowed to change it later.`,
    );
    if (!confirmed) return;

    setIsSavingDepartment(true);
    setDepartmentFeedback("");

    try {
      const result = await updateUserDepartment(selectedDepartment);
      if (result.success) {
        window.location.reload();
      } else {
        setDepartmentFeedback(result.message);
      }
    } catch {
      setDepartmentFeedback("Failed to update department.");
    } finally {
      setIsSavingDepartment(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-3">
        <Loader2 className="h-8 w-8 text-primary animate-spin" />
        <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">
          Loading profile records...
        </p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="max-w-xl mx-auto py-16 text-center space-y-3">
        <div className="p-3 bg-red-100 dark:bg-red-950/30 text-red-600 rounded-full w-fit mx-auto">
          <Info className="h-6 w-6" />
        </div>
        <h2 className="text-lg font-bold text-slate-900 dark:text-slate-50">
          Profile Not Found
        </h2>
        <p className="text-xs text-slate-500">
          Unable to retrieve your university account parameters. Please sign in
          again.
        </p>
      </div>
    );
  }

  const enrolledCourse =
    user.enrolledCourse?.trim() ||
    [user.degree, user.specialization]
      .filter(Boolean)
      .map((s) => s.trim())
      .join(" ") ||
    "Not Enrolled";

  const initials = (user.name || "U")
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12 font-sans">
      {/* HEADER */}
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 dark:text-slate-50 tracking-tight">
          My Profile
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Manage your personal settings and view official university records.
        </p>
      </div>

      {/* HERO CARD */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-login-radius p-6 sm:p-8 shadow-sm">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 text-center sm:text-left">
          <div className="relative shrink-0">
            {user.photo && !photoError ? (
              <img
                src={user.photo}
                alt={user.name}
                onError={() => setPhotoError(true)}
                className="h-24 w-24 sm:h-28 sm:w-28 rounded-2xl object-cover border-2 border-primary/20 shadow-sm"
              />
            ) : (
              <div className="h-24 w-24 sm:h-28 sm:w-28 rounded-2xl bg-gradient-to-br from-primary/90 to-primary text-white font-extrabold text-3xl flex items-center justify-center shadow-md shadow-primary/20">
                {initials}
              </div>
            )}
            <div
              className="absolute -bottom-2 -right-2 bg-emerald-500 text-white p-1 rounded-full border-2 border-white dark:border-slate-900"
              title="Active Account"
            >
              <CheckCircle2 className="h-4 w-4" />
            </div>
          </div>

          <div className="space-y-2 flex-1">
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2.5">
              <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-50">
                {user.name}
              </h2>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-primary/10 text-primary border border-primary/20">
                {user.role}
              </span>
            </div>

            {user.fatherName && (
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                Father&apos;s Name:{" "}
                <span className="text-slate-700 dark:text-slate-200 font-semibold">
                  {user.fatherName}
                </span>
              </p>
            )}

            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 text-xs text-slate-500 dark:text-slate-400 pt-1">
              {user.rollNumber && (
                <div className="flex items-center gap-1.5 font-mono bg-slate-50 dark:bg-slate-800/60 px-2.5 py-1 rounded-md border border-slate-200 dark:border-slate-700">
                  <Hash className="h-3.5 w-3.5 text-slate-400" />
                  <span>{user.rollNumber}</span>
                </div>
              )}
              {user.departmentName && (
                <div className="flex items-center gap-1.5 font-medium bg-slate-50 dark:bg-slate-800/60 px-2.5 py-1 rounded-md border border-slate-200 dark:border-slate-700">
                  <Landmark className="h-3.5 w-3.5 text-slate-400" />
                  <span>{user.departmentName}</span>
                </div>
              )}
              {user.designation && (
                <div className="flex items-center gap-1.5 font-medium bg-slate-50 dark:bg-slate-800/60 px-2.5 py-1 rounded-md border border-slate-200 dark:border-slate-700">
                  <Briefcase className="h-3.5 w-3.5 text-slate-400" />
                  <span>{user.designation}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ======================================================== */}
      {/* 1. EDITABLE SETTINGS & PREFERENCES */}
      {/* ======================================================== */}
      <div className="space-y-3 pt-2">
        <div className="flex items-center gap-2 px-1">
          <Settings className="h-5 w-5 text-slate-700 dark:text-slate-300" />
          <h2 className="text-lg font-bold text-slate-900 dark:text-slate-50 tracking-tight">
            Account Settings
          </h2>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-login-radius p-6 shadow-sm space-y-6">
          {/* Editable Secondary Email */}
          <div className="space-y-2 border-b border-slate-100 dark:border-slate-800 pb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-slate-800 dark:text-slate-200 font-semibold">
                <MailPlus className="h-4 w-4 text-primary" />
                <span className="text-sm">Recovery / Personal Email</span>
              </div>

              {!isEditingEmail2 && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setIsEditingEmail2(true);
                      setEmail2Feedback(null);
                    }}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:text-primary/80 transition-colors px-2 py-1 rounded hover:bg-primary/5 cursor-pointer"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                    <span>{user.email2 ? "Edit" : "Add Email"}</span>
                  </button>
                  {user.email2 && (
                    <button
                      onClick={handleRemoveEmail2}
                      disabled={isSavingEmail2}
                      className="p-1.5 text-slate-400 hover:text-red-500 transition-colors rounded hover:bg-red-50 dark:hover:bg-red-950/20 cursor-pointer"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              )}
            </div>

            {!isEditingEmail2 ? (
              <p className="text-sm text-slate-500 dark:text-slate-400 pl-6">
                {user.email2 || "No recovery email provided."}
              </p>
            ) : (
              <form onSubmit={handleSaveEmail2} className="pl-6 space-y-3 pt-1">
                <input
                  type="email"
                  value={email2Input}
                  onChange={(e) => setEmail2Input(e.target.value)}
                  placeholder="e.g. personal.name@gmail.com"
                  autoFocus
                  disabled={isSavingEmail2}
                  className="w-full max-w-sm h-10 px-3 text-sm bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg focus:outline-none focus:border-primary"
                />
                <div className="flex items-center gap-2">
                  <button
                    type="submit"
                    disabled={isSavingEmail2}
                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-primary hover:bg-primary/90 text-white text-xs font-semibold rounded-lg transition-all cursor-pointer"
                  >
                    {isSavingEmail2 ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Check className="h-3.5 w-3.5" />
                    )}
                    <span>Save Email</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsEditingEmail2(false);
                      setEmail2Input(user.email2 || "");
                    }}
                    className="px-4 py-2 text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}

            {email2Feedback && (
              <div
                className={`mt-2 ml-6 flex items-center gap-1.5 text-xs font-medium ${email2Feedback.type === "success" ? "text-emerald-600" : "text-red-600"}`}
              >
                {email2Feedback.type === "success" ? (
                  <CheckCircle2 className="h-3.5 w-3.5" />
                ) : (
                  <AlertCircle className="h-3.5 w-3.5" />
                )}
                <span>{email2Feedback.message}</span>
              </div>
            )}
          </div>

          {/* Department Assignment (Only visible if departmentId is missing) */}
          {!user.departmentId && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-slate-800 dark:text-slate-200 font-semibold mb-1">
                <Building2 className="h-4 w-4 text-primary" />
                <span className="text-sm">Link Academic Department</span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 pl-6 mb-3">
                You are currently not assigned to any department. Select your
                department below.{" "}
                <strong className="text-red-500 font-medium">
                  This action cannot be undone.
                </strong>
              </p>

              <div className="pl-6 flex flex-col sm:flex-row items-start sm:items-center gap-3">
                <select
                  value={selectedDepartment}
                  onChange={(e) => setSelectedDepartment(e.target.value)}
                  disabled={isSavingDepartment}
                  className="w-full max-w-sm h-10 px-3 text-sm bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg focus:outline-none focus:border-primary"
                >
                  <option value="">-- Select Department --</option>
                  {departments.map((dept) => (
                    <option key={dept.id} value={dept.id}>
                      {dept.name}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  disabled={!selectedDepartment || isSavingDepartment}
                  onClick={handleAssignDepartment}
                  className="px-4 py-2 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 text-xs font-semibold rounded-lg disabled:opacity-50 transition-colors w-full sm:w-auto text-center"
                >
                  {isSavingDepartment ? "Processing..." : "Confirm & Link"}
                </button>
              </div>

              {departmentFeedback && (
                <div className="mt-2 ml-6 flex items-center gap-1.5 text-xs font-medium text-red-600">
                  <AlertCircle className="h-3.5 w-3.5" />
                  <span>{departmentFeedback}</span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ======================================================== */}
      {/* 2. OFFICIAL VIEW-ONLY RECORDS */}
      {/* ======================================================== */}
      <div className="space-y-3 pt-6">
        <div className="flex items-center gap-2 px-1">
          <Lock className="h-5 w-5 text-slate-700 dark:text-slate-300" />
          <h2 className="text-lg font-bold text-slate-900 dark:text-slate-50 tracking-tight">
            Official University Records
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Academic Info */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-login-radius p-6 shadow-sm space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
              <GraduationCap className="h-5 w-5 text-slate-400" />
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-slate-50">
                Academic
              </h3>
            </div>

            <div className="p-3.5 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-100 dark:border-slate-800">
              <span className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                Enrolled Course
              </span>
              <p className="text-sm font-bold text-slate-900 dark:text-slate-100">
                {enrolledCourse}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-y-4">
              <div>
                <span className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                  Degree
                </span>
                <span className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                  {user.degree || "—"}
                </span>
              </div>
              <div>
                <span className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                  Specialization
                </span>
                <span className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                  {user.specialization || "—"}
                </span>
              </div>
              <div>
                <span className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                  Department
                </span>
                <span className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                  {user.departmentName || "—"}
                </span>
              </div>
              <div>
                <span className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                  Roll Number
                </span>
                <span className="text-sm font-mono font-semibold text-slate-800 dark:text-slate-200">
                  {user.rollNumber || "—"}
                </span>
              </div>
            </div>
          </div>

          {/* Contact & Access Info */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-login-radius p-6 shadow-sm space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
              <Shield className="h-5 w-5 text-slate-400" />
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-slate-50">
                Identity & Access
              </h3>
            </div>

            <div className="grid grid-cols-2 gap-y-4">
              <div className="col-span-2">
                <span className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                  Official Email
                </span>
                <div className="flex items-center gap-2 text-sm font-semibold text-slate-800 dark:text-slate-200">
                  <span>{user.email}</span>
                  <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/30 px-1.5 py-0.5 rounded border border-emerald-200">
                    Verified
                  </span>
                </div>
              </div>
              <div>
                <span className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                  Mobile
                </span>
                <span className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                  {user.mobile || "—"}
                </span>
              </div>
              <div>
                <span className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                  SSO Username
                </span>
                <span className="text-sm font-mono font-semibold text-slate-800 dark:text-slate-200">
                  {user.username}
                </span>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
              <span className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                Permissions
              </span>
              {!user.rights || user.rights.length === 0 ? (
                <span className="text-xs text-slate-500">Standard Access</span>
              ) : (
                <div className="flex flex-wrap gap-1.5">
                  {user.rights.map((right) => (
                    <span
                      key={right}
                      className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[10px] font-bold uppercase tracking-wider font-mono border border-slate-200 dark:border-slate-700"
                    >
                      {right.replace(/_/g, " ")}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Notice Banner */}
        <div className="flex items-start gap-3 p-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 rounded-login-radius text-xs text-slate-600 dark:text-slate-400 mt-4">
          <Info className="h-5 w-5 text-slate-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-semibold text-slate-800 dark:text-slate-200">
              Official Records are Locked
            </p>
            <p className="leading-relaxed">
              Records under this section are managed by the Shaheed Bhagat Singh
              State University SSO. To update name, roll number, or degree
              details, please contact the Academic Registrar.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
