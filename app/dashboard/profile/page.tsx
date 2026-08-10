"use client";

import React, { useState, useEffect, FormEvent } from "react";
import { 
  User, 
  Mail, 
  Smartphone, 
  Hash, 
  Calendar,
  GraduationCap,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Briefcase,
  Shield,
  Landmark
} from "lucide-react";
import { useForm } from "@/hooks/useForm";
import { getProfile, updateUserProfile } from "@/lib/prisma/actions/users";

export default function ProfilePage() {
  // Store the complete unmutated profile for read-only keys
  const [fullProfile, setFullProfile] = useState<any>(null);

  // Use Form hook with editable state fields only
  const { 
    form, 
    handleChange, 
    setFields,
    error, 
    checkError, 
    setCheckError 
  } = useForm({
    name: "",
    gender: "",
    dob: "",
    mobileNumber: "",
    designation: ""
  });

  // UI state variables
  const [isProfileLoading, setIsProfileLoading] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Fetch actual profile data on mount
  useEffect(() => {
    const loadProfile = async () => {
      const response = await getProfile();
      if (response.success && response.user) {
        setFullProfile(response.user);

        // Map db gender string/enum to UI selection format
        let mappedGender = "";
        if (response.user.gender) {
          const g = response.user.gender.toUpperCase();
          if (g === "MALE") mappedGender = "Male";
          else if (g === "FEMALE") mappedGender = "Female";
          else if (g === "OTHER") mappedGender = "Other";
        }

        setFields({
          name: response.user.name,
          gender: mappedGender,
          dob: response.user.dob,
          mobileNumber: response.user.mobileNumber,
          designation: response.user.designation || ""
        });
      }
      setIsProfileLoading(false);
    };
    loadProfile();
  }, [setFields]);

  // Handle updates to profile fields
  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSuccessMsg(null);
    setErrorMsg(null);
    setCheckError(false);

    // 1. Basic validation checks using hook error mapping (Name is required)
    if (!form.name.trim()) {
      setCheckError(true);
      setErrorMsg("Full Name is a required field.");
      return;
    }

    setIsLoading(true);

    try {
      const response = await updateUserProfile({
        name: form.name,
        email: fullProfile?.email || "", // Keep existing email
        mobileNumber: form.mobileNumber || undefined,
        dob: form.dob || undefined,
        gender: form.gender || undefined,
        designation: form.designation || undefined
      });

      if (response.success) {
        setSuccessMsg(response.message);
        // Refresh details
        const updated = await getProfile();
        if (updated.success && updated.user) {
          setFullProfile(updated.user);
        }
      } else {
        setErrorMsg(response.message);
      }
    } catch (err) {
      setErrorMsg("An error occurred while saving. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // Helper check for highlighting invalid inputs
  const isFieldInvalid = (fieldName: keyof typeof form) => {
    return checkError && error[fieldName];
  };

  if (isProfileLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3">
        <Loader2 className="h-8 w-8 text-primary animate-spin" />
        <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">Loading profile parameters...</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      
      {/* Title Header */}
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 dark:text-slate-50 tracking-tight">
          My Profile
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Review and update your university registration parameters
        </p>
      </div>

      {/* Card Form Wrapper */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-login-radius p-6 md:p-8 shadow-sm">
        
        {/* Status Alerts */}
        {errorMsg && (
          <div className="mb-6 flex items-start gap-3 p-3 bg-red-50 dark:bg-red-955/20 border border-red-200 dark:border-red-800/30 rounded-login-radius text-red-800 dark:text-red-300 text-sm animate-fade-in">
            <AlertCircle className="h-5 w-5 shrink-0 text-red-650 dark:text-red-450 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="mb-6 flex items-start gap-3 p-3 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/30 rounded-login-radius text-emerald-800 dark:text-emerald-300 text-sm animate-fade-in">
            <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-655 dark:text-emerald-450 mt-0.5" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Profile Edit Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          
          {/* Section: Personal Info (Editable) */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-primary border-b border-slate-100 dark:border-slate-800 pb-2">
              Personal Information
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-login-gap">
              {/* Full Name */}
              <div>
                <label htmlFor="name" className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-2">
                  Full Name
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <User className="h-4 w-4 text-slate-400 group-focus-within:text-primary transition-colors" />
                  </div>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    required
                    disabled={isLoading}
                    value={form.name}
                    onChange={handleChange}
                    className={`w-full h-login-input-h pl-10 pr-4 py-3 bg-slate-50/50 dark:bg-slate-955/50 border rounded-login-radius text-slate-800 dark:text-slate-200 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all ${
                      isFieldInvalid("name") ? "border-red-500" : "border-slate-200 dark:border-slate-800"
                    }`}
                  />
                </div>
              </div>

              {/* Gender */}
              <div>
                <label htmlFor="gender" className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-2">
                  Gender
                </label>
                <select
                  id="gender"
                  name="gender"
                  disabled={isLoading}
                  value={form.gender}
                  onChange={handleChange}
                  className="w-full h-login-input-h px-4 py-3 bg-slate-50/50 dark:bg-slate-955/50 border border-slate-200 dark:border-slate-800 rounded-login-radius text-slate-850 dark:text-slate-200 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                >
                  <option value="">Select Gender</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              {/* Date of Birth */}
              <div>
                <label htmlFor="dob" className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-2">
                  Date of Birth
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <Calendar className="h-4 w-4 text-slate-400 group-focus-within:text-primary transition-colors" />
                  </div>
                  <input
                    type="date"
                    id="dob"
                    name="dob"
                    disabled={isLoading}
                    value={form.dob}
                    onChange={handleChange}
                    className="w-full h-login-input-h pl-10 pr-4 py-3 bg-slate-50/50 dark:bg-slate-955/50 border border-slate-200 dark:border-slate-800 rounded-login-radius text-slate-850 dark:text-slate-200 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                  />
                </div>
              </div>

              {/* Designation (Staff only, editable) */}
              {fullProfile?.role !== "STUDENT" && (
                <div>
                  <label htmlFor="designation" className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-2">
                    Designation
                  </label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                      <Briefcase className="h-4 w-4 text-slate-400 group-focus-within:text-primary transition-colors" />
                    </div>
                    <input
                      type="text"
                      id="designation"
                      name="designation"
                      disabled={isLoading}
                      value={form.designation}
                      onChange={handleChange}
                      placeholder="e.g. Professor"
                      className="w-full h-login-input-h pl-10 pr-4 py-3 bg-slate-50/50 dark:bg-slate-955/50 border border-slate-200 dark:border-slate-800 rounded-login-radius text-slate-850 dark:text-slate-200 placeholder-slate-455 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Section: Contact Info (Editable) */}
          <div className="space-y-4 pt-2">
            <h3 className="text-sm font-bold uppercase tracking-wider text-primary border-b border-slate-100 dark:border-slate-800 pb-2">
              Contact Information
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-login-gap">
              {/* Mobile Number (Editable) */}
              <div>
                <label htmlFor="mobileNumber" className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-2">
                  Mobile Number
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <Smartphone className="h-4 w-4 text-slate-400 group-focus-within:text-primary transition-colors" />
                  </div>
                  <input
                    type="tel"
                    id="mobileNumber"
                    name="mobileNumber"
                    disabled={isLoading}
                    value={form.mobileNumber}
                    onChange={handleChange}
                    className="w-full h-login-input-h pl-10 pr-4 py-3 bg-slate-50/50 dark:bg-slate-955/50 border border-slate-200 dark:border-slate-800 rounded-login-radius text-slate-850 dark:text-slate-200 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Section: Academic Details (Read-Only, Students Only) */}
          {fullProfile?.role === "STUDENT" && (
            <div className="space-y-4 pt-2">
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500 border-b border-slate-100 dark:border-slate-800 pb-2">
                Academic Details (Read-Only)
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-login-gap">
                {/* Roll Number */}
                <div>
                  <span className="block text-xs font-semibold text-slate-500 dark:text-slate-450 mb-1.5">
                    Roll Number
                  </span>
                  <div className="px-4 py-3 bg-slate-100 dark:bg-slate-855 bg-slate-50/50 dark:bg-slate-850/50 border border-slate-200 dark:border-slate-800/80 rounded-login-radius text-slate-655 dark:text-slate-350 text-sm font-semibold select-none flex items-center gap-2">
                    <Hash className="h-4 w-4 text-slate-400 shrink-0" />
                    <span>{fullProfile?.rollNumber || "Not Provided"}</span>
                  </div>
                </div>

                {/* Enrolled Course */}
                <div>
                  <span className="block text-xs font-semibold text-slate-500 dark:text-slate-455 mb-1.5">
                    Enrolled Course
                  </span>
                  <div className="px-4 py-3 bg-slate-100 dark:bg-slate-855 bg-slate-50/50 dark:bg-slate-850/50 border border-slate-200 dark:border-slate-800/80 rounded-login-radius text-slate-655 dark:text-slate-350 text-sm font-semibold select-none flex items-center gap-2">
                    <GraduationCap className="h-4.5 w-4.5 text-slate-400 shrink-0" />
                    <span>{fullProfile?.enrolledCourse || "Unenrolled"}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Section: Account details (Read-Only, Shared) */}
          <div className="space-y-4 pt-2">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500 border-b border-slate-100 dark:border-slate-800 pb-2">
              Account Details (Read-Only)
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-login-gap">
              {/* Role */}
              <div>
                <span className="block text-xs font-semibold text-slate-500 dark:text-slate-450 mb-1.5">
                  System Role
                </span>
                <div className="px-4 py-3 bg-slate-50/50 dark:bg-slate-850/50 border border-slate-200 dark:border-slate-800/80 rounded-login-radius text-slate-655 dark:text-slate-350 text-sm font-semibold select-none">
                  {fullProfile?.role?.replace("_", " ") || "Loading..."}
                </div>
              </div>

              {/* Email Address */}
              <div>
                <span className="block text-xs font-semibold text-slate-500 dark:text-slate-455 mb-1.5">
                  Registered Email
                </span>
                <div className="px-4 py-3 bg-slate-50/50 dark:bg-slate-850/50 border border-slate-200 dark:border-slate-800/80 rounded-login-radius text-slate-655 dark:text-slate-350 text-sm font-semibold select-none flex items-center gap-2">
                  <Mail className="h-4 w-4 text-slate-400 shrink-0" />
                  <span>{fullProfile?.email || ""}</span>
                </div>
              </div>

              {/* Department (If staff) */}
              {fullProfile?.role !== "STUDENT" && (
                <div>
                  <span className="block text-xs font-semibold text-slate-500 dark:text-slate-455 mb-1.5">
                    Department
                  </span>
                  <div className="px-4 py-3 bg-slate-50/50 dark:bg-slate-850/50 border border-slate-200 dark:border-slate-800/80 rounded-login-radius text-slate-655 dark:text-slate-350 text-sm font-semibold select-none flex items-center gap-2">
                    <Landmark className="h-4 w-4 text-slate-400 shrink-0" />
                    <span>{fullProfile?.departmentName || "General Staff / No Department"}</span>
                  </div>
                </div>
              )}

              {/* Assigned Rights (If staff) */}
              {fullProfile?.role !== "STUDENT" && (
                <div>
                  <span className="block text-xs font-semibold text-slate-500 dark:text-slate-455 mb-1.5">
                    Assigned Rights
                  </span>
                  <div className="px-4 py-3 bg-slate-50/50 dark:bg-slate-850/50 border border-slate-200 dark:border-slate-800/80 rounded-login-radius text-slate-655 dark:text-slate-350 text-sm font-medium select-none">
                    {!fullProfile?.rights || fullProfile.rights.length === 0 ? (
                      <span className="text-slate-450 italic text-xs">No special administrative rights</span>
                    ) : (
                      <div className="flex flex-wrap gap-1">
                        {fullProfile.rights.map((right: string) => (
                          <span key={right} className="px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-800 text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider font-mono">
                            {right.replace("_", " ")}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Form Actions */}
          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-end">
            <button
              type="submit"
              disabled={isLoading}
              className="px-6 h-login-input-h bg-primary hover:bg-primary/90 text-white font-semibold rounded-login-radius flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed shadow-md shadow-primary/10 cursor-pointer"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Saving Changes...</span>
                </>
              ) : (
                <span>Save Profile</span>
              )}
            </button>
          </div>

        </form>

      </div>

    </div>
  );
}
