"use client";

import React, { useState, FormEvent } from "react";
import {
  User,
  Mail,
  Lock,
  Eye,
  EyeOff,
  AlertCircle,
  CheckCircle2,
  GraduationCap,
  ArrowLeft,
  ArrowRight,
  Loader2,
  Sun,
  Moon,
  Calendar,
  Smartphone,
  Hash,
} from "lucide-react";
import { useForm } from "@/hooks/useForm";
import { registerUser } from "@/lib/prisma/actions/users";
import { useTheme } from "@/hooks/useTheme";

const COURSES = [
  "B.Tech Computer Science & Engineering",
  "B.Tech Electronics & Communication",
  "B.Sc Mathematics",
  "B.Com Honours",
  "Bachelor of Computer Applications (BCA)",
  "Master of Computer Applications (MCA)",
  "Master of Business Administration (MBA)",
];

export default function RegisterPage() {
  // Form handling hook
  const {
    form,
    handleChange,
    resetFormFields,
    error,
    checkError,
    setCheckError,
  } = useForm({
    name: "",
    email: "",
    rollNumber: "",
    gender: "",
    mobileNumber: "",
    dob: "",
    enrolledCourse: "",
    password: "",
    confirmPassword: "",
  });

  // UI state variables
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // UI feedback & theme states
  const { theme, toggleTheme } = useTheme();
  const isDarkMode = theme === "dark";
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Form submission handler
  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    // Reset feedback states
    setErrorMsg(null);
    setSuccessMsg(null);
    setCheckError(false);

    // 1. Check if any fields are empty/unchanged from default
    const hasEmptyField = Object.values(error).some((isDefault) => isDefault);
    if (hasEmptyField) {
      setCheckError(true);
      setErrorMsg("Please fill in all the required fields correctly.");
      return;
    }

    // 2. Validate passwords match
    if (form.password !== form.confirmPassword) {
      setErrorMsg("Passwords do not match. Please verify your passwords.");
      return;
    }

    // 3. Validate password strength
    if (form.password.length < 6) {
      setErrorMsg("Password must be at least 6 characters long.");
      return;
    }

    setIsLoading(true);

    try {
      const response = await registerUser(form);

      if (response.success) {
        setSuccessMsg(response.message);
        // Reset form on success
        resetFormFields();
      } else {
        setErrorMsg(response.message);
      }
    } catch (error) {
      setErrorMsg("An unexpected error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // Check if an individual field is invalid for display styling
  const isFieldInvalid = (fieldName: keyof typeof form) => {
    return checkError && error[fieldName];
  };

  return (
    <div
      className="relative min-h-screen flex flex-col justify-center items-center px-4 py-12 overflow-hidden transition-colors duration-300 font-sans bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200"
    >
      {/* Theme Toggle Button */}
      <div className="absolute top-4 right-4 z-20">
        <button
          type="button"
          onClick={toggleTheme}
          className="p-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:scale-105 active:scale-95 transition-all duration-200 shadow-sm cursor-pointer"
          aria-label="Toggle dark mode"
        >
          {isDarkMode ? (
            <Sun className="h-5 w-5 text-amber-400 hover:rotate-45 transition-transform duration-300" />
          ) : (
            <Moon className="h-5 w-5 text-primary hover:-rotate-12 transition-transform duration-300" />
          )}
        </button>
      </div>

      {/* Decorative Background Elements */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none z-0">
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-primary rounded-full blur-3xl opacity-10 dark:opacity-15 animate-pulse"></div>
        <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-primary/70 rounded-full blur-3xl opacity-10 dark:opacity-15 animate-pulse"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-slate-200/10 dark:bg-slate-900/10 rounded-full border border-slate-200/20 dark:border-slate-800/10 z-0"></div>
      </div>

      {/* Main Container */}
      <div className="w-full max-w-2xl z-10 my-4">
        {/* Portal Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center p-3 bg-primary/10 border border-primary/20 rounded-2xl mb-4 shadow-sm">
            <GraduationCap className="h-10 w-10 text-primary" />
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900 dark:text-slate-50 tracking-tight">
            Shaheed Bhagat Singh State University
          </h1>
          <p className="text-sm font-medium text-secondary mt-2">
            Student Registration Portal
          </p>
        </div>

        {/* Card Wrapper */}
        <div className="bg-white dark:bg-slate-900/85 backdrop-blur-xl border border-slate-200 dark:border-slate-800/60 rounded-login-radius p-6 md:p-8 shadow-xl shadow-slate-200/30 dark:shadow-slate-955/40">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-slate-50">
                Create Student Account
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Fill in the details below to complete your registration
              </p>
            </div>
            <a
              href="/login"
              className="flex items-center gap-1.5 text-xs font-semibold text-primary hover:opacity-85 transition-opacity"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Back to Login</span>
            </a>
          </div>

          {/* Alert messages */}
          {errorMsg && (
            <div className="mb-6 flex items-start gap-3 p-3 bg-red-50 dark:bg-red-955/20 border border-red-200 dark:border-red-800/30 rounded-login-radius text-red-800 dark:text-red-300 text-sm animate-in fade-in slide-in-from-top-1 duration-250">
              <AlertCircle className="h-5 w-5 shrink-0 text-red-600 dark:text-red-400 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="mb-6 flex items-start gap-3 p-3 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/30 rounded-login-radius text-emerald-800 dark:text-emerald-300 text-sm animate-in fade-in slide-in-from-top-1 duration-255">
              <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600 dark:text-emerald-400 mt-0.5" />
              <div>
                <p className="font-semibold">{successMsg}</p>
                <p className="text-xs text-emerald-700/80 dark:text-emerald-400/80 mt-1">
                  You can now return to the{" "}
                  <a
                    href="/login"
                    className="underline font-bold text-emerald-900 dark:text-white"
                  >
                    login page
                  </a>{" "}
                  to sign in.
                </p>
              </div>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-login-gap">
            {/* Grid Layout for Personal Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-login-gap">
              {/* Full Name */}
              <div>
                <label
                  htmlFor="name"
                  className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-2"
                >
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
                    placeholder="John Doe"
                    className={`w-full h-login-input-h pl-10 pr-4 py-3 bg-slate-50/50 dark:bg-slate-955/50 border rounded-login-radius text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all text-sm disabled:opacity-50 disabled:cursor-not-allowed ${
                      isFieldInvalid("name")
                        ? "border-red-500 focus:border-red-500 focus:ring-red-500"
                        : "border-slate-200 dark:border-slate-800"
                    }`}
                  />
                </div>
              </div>

              {/* Email Address */}
              <div>
                <label
                  htmlFor="email"
                  className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-2"
                >
                  Email Address
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <Mail className="h-4 w-4 text-slate-400 group-focus-within:text-primary transition-colors" />
                  </div>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    required
                    disabled={isLoading}
                    value={form.email}
                    onChange={handleChange}
                    placeholder="john.doe@university.edu"
                    className={`w-full h-login-input-h pl-10 pr-4 py-3 bg-slate-50/50 dark:bg-slate-955/50 border rounded-login-radius text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all text-sm disabled:opacity-50 disabled:cursor-not-allowed ${
                      isFieldInvalid("email")
                        ? "border-red-500 focus:border-red-500 focus:ring-red-500"
                        : "border-slate-200 dark:border-slate-800"
                    }`}
                  />
                </div>
              </div>

              {/* Roll Number */}
              <div>
                <label
                  htmlFor="rollNumber"
                  className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-2"
                >
                  Roll Number
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <Hash className="h-4 w-4 text-slate-400 group-focus-within:text-primary transition-colors" />
                  </div>
                  <input
                    type="text"
                    id="rollNumber"
                    name="rollNumber"
                    required
                    disabled={isLoading}
                    value={form.rollNumber}
                    onChange={handleChange}
                    placeholder="e.g. APX/2026/0891"
                    className={`w-full h-login-input-h pl-10 pr-4 py-3 bg-slate-50/50 dark:bg-slate-955/50 border rounded-login-radius text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all text-sm disabled:opacity-50 disabled:cursor-not-allowed ${
                      isFieldInvalid("rollNumber")
                        ? "border-red-500 focus:border-red-500 focus:ring-red-500"
                        : "border-slate-200 dark:border-slate-800"
                    }`}
                  />
                </div>
              </div>

              {/* Mobile Number */}
              <div>
                <label
                  htmlFor="mobileNumber"
                  className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-2"
                >
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
                    required
                    disabled={isLoading}
                    value={form.mobileNumber}
                    onChange={handleChange}
                    placeholder="+1 (555) 123-4567"
                    className={`w-full h-login-input-h pl-10 pr-4 py-3 bg-slate-50/50 dark:bg-slate-955/50 border rounded-login-radius text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all text-sm disabled:opacity-50 disabled:cursor-not-allowed ${
                      isFieldInvalid("mobileNumber")
                        ? "border-red-500 focus:border-red-500 focus:ring-red-500"
                        : "border-slate-200 dark:border-slate-800"
                    }`}
                  />
                </div>
              </div>

              {/* Date of Birth */}
              <div>
                <label
                  htmlFor="dob"
                  className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-2"
                >
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
                    required
                    disabled={isLoading}
                    value={form.dob}
                    onChange={handleChange}
                    className={`w-full h-login-input-h pl-10 pr-4 py-3 bg-slate-50/50 dark:bg-slate-955/50 border rounded-login-radius text-slate-800 dark:text-slate-200 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all text-sm disabled:opacity-50 disabled:cursor-not-allowed ${
                      isFieldInvalid("dob")
                        ? "border-red-500 focus:border-red-500 focus:ring-red-500"
                        : "border-slate-200 dark:border-slate-800"
                    }`}
                  />
                </div>
              </div>

              {/* Gender */}
              <div>
                <label
                  htmlFor="gender"
                  className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-2"
                >
                  Gender
                </label>
                <select
                  id="gender"
                  name="gender"
                  required
                  disabled={isLoading}
                  value={form.gender}
                  onChange={handleChange}
                  className={`w-full h-login-input-h px-4 py-3 bg-slate-50/50 dark:bg-slate-955/50 border rounded-login-radius text-slate-800 dark:text-slate-200 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all text-sm disabled:opacity-50 disabled:cursor-not-allowed ${
                    isFieldInvalid("gender")
                      ? "border-red-500 focus:border-red-500 focus:ring-red-500"
                      : "border-slate-200 dark:border-slate-800"
                  }`}
                >
                  <option
                    value=""
                    disabled
                    className="text-slate-400 dark:bg-slate-900"
                  >
                    Select Gender
                  </option>
                  <option value="Male" className="dark:bg-slate-900">
                    Male
                  </option>
                  <option value="Female" className="dark:bg-slate-900">
                    Female
                  </option>
                  <option value="Other" className="dark:bg-slate-900">
                    Other
                  </option>
                </select>
              </div>
            </div>

            {/* Enrolled Course */}
            <div>
              <label
                htmlFor="enrolledCourse"
                className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-2"
              >
                Enrolled Course
              </label>
              <select
                id="enrolledCourse"
                name="enrolledCourse"
                required
                disabled={isLoading}
                value={form.enrolledCourse}
                onChange={handleChange}
                className={`w-full h-login-input-h px-4 py-3 bg-slate-50/50 dark:bg-slate-955/50 border rounded-login-radius text-slate-800 dark:text-slate-200 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all text-sm disabled:opacity-50 disabled:cursor-not-allowed ${
                  isFieldInvalid("enrolledCourse")
                    ? "border-red-500 focus:border-red-500 focus:ring-red-500"
                    : "border-slate-200 dark:border-slate-800"
                }`}
              >
                <option
                  value=""
                  disabled
                  className="text-slate-400 dark:bg-slate-900"
                >
                  Select Enrolled Course
                </option>
                {COURSES.map((course) => (
                  <option
                    key={course}
                    value={course}
                    className="dark:bg-slate-900"
                  >
                    {course}
                  </option>
                ))}
              </select>
            </div>

            {/* Password Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-login-gap">
              {/* Choose Password */}
              <div>
                <label
                  htmlFor="password"
                  className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-2"
                >
                  Create Password
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <Lock className="h-4 w-4 text-slate-400 group-focus-within:text-primary transition-colors" />
                  </div>
                  <input
                    type={showPassword ? "text" : "password"}
                    id="password"
                    name="password"
                    required
                    disabled={isLoading}
                    value={form.password}
                    onChange={handleChange}
                    placeholder="••••••••"
                    className={`w-full h-login-input-h pl-10 pr-10 py-3 bg-slate-50/50 dark:bg-slate-955/50 border rounded-login-radius text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all text-sm disabled:opacity-50 disabled:cursor-not-allowed ${
                      isFieldInvalid("password")
                        ? "border-red-500 focus:border-red-500 focus:ring-red-500"
                        : "border-slate-200 dark:border-slate-800"
                    }`}
                  />
                  <button
                    type="button"
                    tabIndex={-1}
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" aria-hidden="true" />
                    ) : (
                      <Eye className="h-4 w-4" aria-hidden="true" />
                    )}
                  </button>
                </div>
              </div>

              {/* Confirm Password */}
              <div>
                <label
                  htmlFor="confirmPassword"
                  className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-2"
                >
                  Confirm Password
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <Lock className="h-4 w-4 text-slate-400 group-focus-within:text-primary transition-colors" />
                  </div>
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    id="confirmPassword"
                    name="confirmPassword"
                    required
                    disabled={isLoading}
                    value={form.confirmPassword}
                    onChange={handleChange}
                    placeholder="••••••••"
                    className={`w-full h-login-input-h pl-10 pr-10 py-3 bg-slate-50/50 dark:bg-slate-955/50 border rounded-login-radius text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all text-sm disabled:opacity-50 disabled:cursor-not-allowed ${
                      isFieldInvalid("confirmPassword")
                        ? "border-red-500 focus:border-red-500 focus:ring-red-500"
                        : "border-slate-200 dark:border-slate-800"
                    }`}
                  />
                  <button
                    type="button"
                    tabIndex={-1}
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-4 w-4" aria-hidden="true" />
                    ) : (
                      <Eye className="h-4 w-4" aria-hidden="true" />
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="relative w-full h-login-input-h flex justify-center items-center gap-2 py-3 px-4 bg-primary hover:bg-primary/90 text-white font-semibold rounded-login-radius transition-all duration-200 active:scale-[0.98] shadow-lg shadow-primary/10 dark:shadow-primary/20 disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100 text-sm overflow-hidden cursor-pointer"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Registering...</span>
                </>
              ) : (
                <>
                  <span>Create Account</span>
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </>
              )}
            </button>
          </form>

          {/* Switch to Login link */}
          <div className="mt-6 text-center text-xs">
            <span className="text-slate-500 dark:text-slate-400">
              Already have a student account?{" "}
            </span>
            <a
              href="/login"
              className="font-medium text-primary hover:opacity-85 transition-colors"
            >
              Sign In here
            </a>
          </div>
        </div>

        {/* Footer Support Info */}
        <p className="text-center text-xs text-slate-500 mt-8 z-10 relative">
          By registering, you agree to the university's Acceptable Use Policy.
          <br />
          Need help?{" "}
          <a
            href="#support"
            onClick={(e) => {
              e.preventDefault();
              setErrorMsg(
                "Support ticket creation is currently offline. Please contact IT Helpdesk directly.",
              );
            }}
            className="text-primary hover:opacity-80 font-medium transition-colors ml-1"
          >
            Contact IT Helpdesk
          </a>
        </p>
      </div>
    </div>
  );
}
