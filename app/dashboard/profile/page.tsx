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
} from "lucide-react";
import { getProfile } from "@/lib/actions/users";

export interface ProfileUser {
  id: string;
  email: string;
  name: string;
  username: string;
  fatherName: string;
  rollNumber: string;
  mobileNumber: string;
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
  rights: string[];
}

export default function ProfilePage() {
  const [user, setUser] = useState<ProfileUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [photoError, setPhotoError] = useState(false);

  useEffect(() => {
    const loadProfile = async () => {
      setIsLoading(true);
      try {
        const response = await getProfile();
        if (response.success && response.user) {
          setUser(response.user as ProfileUser);
        }
      } catch (err) {
        console.error("Error loading profile:", err);
      } finally {
        setIsLoading(false);
      }
    };
    loadProfile();
  }, []);

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
          Unable to retrieve your university account parameters. Please sign in again.
        </p>
      </div>
    );
  }

  // Display enrolled course cleanly as degree + specialization
  const enrolledCourse =
    user.enrolledCourse?.trim() ||
    [user.degree, user.specialization].filter(Boolean).map((s) => s.trim()).join(" ") ||
    "Not Enrolled";

  // Initials for avatar fallback
  const initials = (user.name || "U")
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12 font-sans">
      {/* Title Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-slate-50 tracking-tight">
            My Profile
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Official university registration and enrollment parameters
          </p>
        </div>

        {/* View Only Badge */}
        <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-semibold w-fit border border-slate-200 dark:border-slate-700/60 shadow-xs">
          <Lock className="h-3.5 w-3.5 text-slate-500 dark:text-slate-400" />
          <span>Official Record • View Only</span>
        </div>
      </div>

      {/* Hero Profile Card */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-login-radius p-6 sm:p-8 shadow-sm">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 text-center sm:text-left">
          {/* Avatar / Photo */}
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
            <div className="absolute -bottom-2 -right-2 bg-emerald-500 text-white p-1 rounded-full border-2 border-white dark:border-slate-900" title="Active Account">
              <CheckCircle2 className="h-4 w-4" />
            </div>
          </div>

          {/* User Primary Identity */}
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
                Father&apos;s Name: <span className="text-slate-700 dark:text-slate-200 font-semibold">{user.fatherName}</span>
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

      {/* Grid of Sections */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Section 1: Academic Enrollment */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-login-radius p-6 shadow-sm space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
            <GraduationCap className="h-5 w-5 text-primary" />
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-slate-50">
              Academic Enrollment
            </h3>
          </div>

          <div className="space-y-3.5">
            {/* Prominent Enrolled Course */}
            <div className="p-3.5 bg-primary/5 dark:bg-primary/10 border border-primary/20 rounded-xl">
              <span className="block text-[11px] font-bold uppercase tracking-wider text-primary mb-1">
                Enrolled Course (Degree & Specialization)
              </span>
              <p className="text-base font-extrabold text-slate-900 dark:text-slate-100">
                {enrolledCourse}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-1">
              <div>
                <span className="block text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">
                  Degree
                </span>
                <span className="text-sm font-bold text-slate-800 dark:text-slate-200">
                  {user.degree || "—"}
                </span>
              </div>

              <div>
                <span className="block text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">
                  Specialization
                </span>
                <span className="text-sm font-bold text-slate-800 dark:text-slate-200">
                  {user.specialization || "—"}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-1 border-t border-slate-100 dark:border-slate-800/60">
              <div>
                <span className="block text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">
                  Department
                </span>
                <span className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                  {user.departmentName || "General / Unassigned"}
                </span>
              </div>

              <div>
                <span className="block text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">
                  Roll / Username
                </span>
                <span className="text-sm font-mono font-semibold text-slate-800 dark:text-slate-200">
                  {user.rollNumber || user.username || "—"}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Section 2: Contact Information */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-login-radius p-6 shadow-sm space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
            <Mail className="h-5 w-5 text-primary" />
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-slate-50">
              Contact Information
            </h3>
          </div>

          <div className="space-y-4">
            <div>
              <span className="block text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">
                Official Email Address
              </span>
              <div className="flex items-center gap-2 text-sm font-semibold text-slate-800 dark:text-slate-200">
                <span>{user.email}</span>
                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30 px-2 py-0.5 rounded-md border border-emerald-200/50 dark:border-emerald-800/40">
                  <CheckCircle2 className="h-3 w-3" />
                  Verified
                </span>
              </div>
            </div>

            <div>
              <span className="block text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">
                Registered Mobile Number
              </span>
              <div className="flex items-center gap-2 text-sm font-semibold text-slate-800 dark:text-slate-200">
                <Smartphone className="h-4 w-4 text-slate-400" />
                <span>{user.mobileNumber || "Not Provided"}</span>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-100 dark:border-slate-800/60">
              <span className="block text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">
                SSO Identity Reference
              </span>
              <span className="text-xs font-mono text-slate-600 dark:text-slate-400">
                {user.username || user.email}
              </span>
            </div>
          </div>
        </div>

        {/* Section 3: Personal Information */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-login-radius p-6 shadow-sm space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
            <User className="h-5 w-5 text-primary" />
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-slate-50">
              Personal Information
            </h3>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <span className="block text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">
                Full Name
              </span>
              <span className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                {user.name || "—"}
              </span>
            </div>

            <div>
              <span className="block text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">
                Father&apos;s Name
              </span>
              <span className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                {user.fatherName || "—"}
              </span>
            </div>

            <div>
              <span className="block text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">
                Gender
              </span>
              <span className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                {user.gender ? user.gender.charAt(0).toUpperCase() + user.gender.slice(1).toLowerCase() : "Not Specified"}
              </span>
            </div>

            <div>
              <span className="block text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">
                Date of Birth
              </span>
              <div className="flex items-center gap-1.5 text-sm font-semibold text-slate-800 dark:text-slate-200">
                <Calendar className="h-3.5 w-3.5 text-slate-400" />
                <span>{user.dob || "—"}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Section 4: System Roles & Permissions */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-login-radius p-6 shadow-sm space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
            <Shield className="h-5 w-5 text-primary" />
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-slate-50">
              System Roles & Access
            </h3>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <span className="block text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-0.5">
                  Account Type
                </span>
                <span className="text-sm font-bold text-slate-900 dark:text-slate-100">
                  {user.role}
                </span>
              </div>
              {user.designation && (
                <div className="text-right">
                  <span className="block text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-0.5">
                    Designation
                  </span>
                  <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                    {user.designation}
                  </span>
                </div>
              )}
            </div>

            <div>
              <span className="block text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1.5">
                Assigned Administrative Permissions
              </span>
              {!user.rights || user.rights.length === 0 ? (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-50 dark:bg-slate-800/80 text-slate-500 dark:text-slate-400 text-xs">
                  <Award className="h-3.5 w-3.5 text-slate-400" />
                  Standard Student Grievance Access
                </span>
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
      </div>

      {/* University Record Notice Banner */}
      <div className="flex items-start gap-3 p-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 rounded-login-radius text-xs text-slate-600 dark:text-slate-400">
        <Info className="h-5 w-5 text-primary shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="font-semibold text-slate-800 dark:text-slate-200">
            Official University Identity Record
          </p>
          <p className="leading-relaxed">
            All user profile information—including Name, Roll Number, Father&apos;s Name, Enrolled Course, Degree, and Specialization—is officially synchronized from the Shaheed Bhagat Singh State University Single Sign-On (SSO) system. To update your verified university records, please contact the University Academic Registrar.
          </p>
        </div>
      </div>
    </div>
  );
}
