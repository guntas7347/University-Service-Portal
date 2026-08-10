"use client";

import React, { useState, useEffect, FormEvent } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  Lock,
  Eye,
  EyeOff,
  AlertCircle,
  CheckCircle2,
  GraduationCap,
  ArrowRight,
  ArrowLeft,
  Loader2,
  Sun,
  Moon,
} from "lucide-react";
import { useForm } from "@/hooks/useForm";
import { validateResetToken, resetPassword } from "@/lib/prisma/actions/users";
import { useTheme } from "@/hooks/useTheme";

export default function ResetPasswordConfirmPage() {
  const params = useParams() as { token: string };
  const router = useRouter();

  const { form, handleChange, resetFormFields } = useForm({
    password: "",
    confirmPassword: "",
  });

  const { theme, toggleTheme } = useTheme();
  const isDarkMode = theme === "dark";
  const [isValidating, setIsValidating] = useState(true);
  const [isTokenValid, setIsTokenValid] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Validate the reset token when component mounts
  useEffect(() => {
    async function checkToken() {
      if (!params.token) {
        setErrorMsg("Missing password reset token.");
        setIsTokenValid(false);
        setIsValidating(false);
        return;
      }

      try {
        const res = await validateResetToken(params.token);
        if (res.success) {
          setIsTokenValid(true);
        } else {
          setErrorMsg(res.message || "This password reset link is invalid or has expired.");
          setIsTokenValid(false);
        }
      } catch (err) {
        setErrorMsg("An error occurred while validating the reset token.");
        setIsTokenValid(false);
      } finally {
        setIsValidating(false);
      }
    }
    checkToken();
  }, [params.token]);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    // Front-end validations
    if (form.password.length < 8) {
      setErrorMsg("Password must be at least 8 characters long.");
      return;
    }

    if (form.password !== form.confirmPassword) {
      setErrorMsg("Passwords do not match.");
      return;
    }

    setIsLoading(true);

    try {
      const response = await resetPassword(params.token, form.password);

      if (response.success) {
        setSuccessMsg(response.message);
        resetFormFields();
        // Redirect to login page after 3 seconds
        setTimeout(() => {
          router.push("/login");
        }, 3000);
      } else {
        setErrorMsg(response.message);
      }
    } catch (error) {
      setErrorMsg("An unexpected error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
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
      <div className="w-full max-w-login-card z-10">
        {/* Portal Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center p-3 bg-primary/10 border border-primary/20 rounded-2xl mb-4 shadow-sm">
            <GraduationCap className="h-10 w-10 text-primary" />
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900 dark:text-slate-50 tracking-tight">
            Shaheed Bhagat Singh State University
          </h1>
          <p className="text-sm font-medium text-secondary mt-2">
            Grievance Redressal Portal
          </p>
        </div>

        {/* Card Wrapper */}
        <div className="bg-white dark:bg-slate-900/85 backdrop-blur-xl border border-slate-200 dark:border-slate-800/60 rounded-login-radius p-8 shadow-xl shadow-slate-200/30 dark:shadow-slate-955/40">
          <div className="mb-6">
            <h2 className="text-xl font-bold text-slate-900 dark:text-slate-50">
              Reset Password
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              {isValidating
                ? "Checking reset token validity..."
                : isTokenValid
                  ? "Please enter your new password below"
                  : "Unable to reset password"}
            </p>
          </div>

          {/* Validation Loader */}
          {isValidating && (
            <div className="flex flex-col items-center justify-center py-8 gap-3">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <span className="text-xs text-slate-500">Validating reset token...</span>
            </div>
          )}

          {/* Alert messages */}
          {errorMsg && (
            <div className="mb-5 flex items-start gap-3 p-3 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800/30 rounded-login-radius text-red-800 dark:text-red-300 text-sm animate-in fade-in slide-in-from-top-1 duration-255">
              <AlertCircle className="h-5 w-5 shrink-0 text-red-600 dark:text-red-400 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="mb-5 flex items-start gap-3 p-3 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/30 rounded-login-radius text-emerald-800 dark:text-emerald-300 text-sm animate-in fade-in slide-in-from-top-1 duration-255">
              <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600 dark:text-emerald-400 mt-0.5" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Reset form when token is valid and not loading token verification */}
          {!isValidating && isTokenValid && !successMsg && (
            <form onSubmit={handleSubmit} className="space-y-login-gap">
              {/* New Password Input */}
              <div>
                <label
                  htmlFor="password"
                  className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-2"
                >
                  New Password
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <Lock className="h-4 w-4 text-slate-400 group-focus-within:text-primary transition-colors" />
                  </div>
                  <input
                    type={showPassword ? "text" : "password"}
                    id="password"
                    name="password"
                    autoComplete="new-password"
                    required
                    disabled={isLoading}
                    value={form.password}
                    onChange={handleChange}
                    placeholder="Min. 8 characters"
                    className="w-full h-login-input-h pl-10 pr-10 py-3 bg-slate-50/50 dark:bg-slate-955/50 border border-slate-200 dark:border-slate-800 rounded-login-radius text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all text-sm disabled:opacity-50 disabled:cursor-not-allowed"
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

              {/* Confirm Password Input */}
              <div>
                <label
                  htmlFor="confirmPassword"
                  className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-2"
                >
                  Confirm New Password
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <Lock className="h-4 w-4 text-slate-400 group-focus-within:text-primary transition-colors" />
                  </div>
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    id="confirmPassword"
                    name="confirmPassword"
                    autoComplete="new-password"
                    required
                    disabled={isLoading}
                    value={form.confirmPassword}
                    onChange={handleChange}
                    placeholder="Confirm new password"
                    className="w-full h-login-input-h pl-10 pr-10 py-3 bg-slate-50/50 dark:bg-slate-955/50 border border-slate-200 dark:border-slate-800 rounded-login-radius text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all text-sm disabled:opacity-50 disabled:cursor-not-allowed"
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

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="relative w-full h-login-input-h flex justify-center items-center gap-2 py-3 px-4 bg-primary hover:bg-primary/90 text-white font-semibold rounded-login-radius transition-all duration-200 active:scale-[0.98] shadow-lg shadow-primary/10 dark:shadow-primary/20 disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100 text-sm overflow-hidden cursor-pointer"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Resetting password...</span>
                  </>
                ) : (
                  <>
                    <span>Reset Password</span>
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </>
                )}
              </button>
            </form>
          )}

          {/* Navigation Links */}
          <div className="mt-6 text-center text-xs">
            {(!isTokenValid && !isValidating) ? (
              <Link
                href="/login/reset"
                className="inline-flex items-center gap-1.5 font-medium text-slate-500 dark:text-slate-400 hover:text-primary dark:hover:text-primary transition-colors"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                <span>Request another reset link</span>
              </Link>
            ) : (
              <Link
                href="/login"
                className="inline-flex items-center gap-1.5 font-medium text-slate-500 dark:text-slate-400 hover:text-primary dark:hover:text-primary transition-colors"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                <span>Back to Sign In</span>
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
