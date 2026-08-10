"use client";

import React, { useState, FormEvent } from "react";
import Link from "next/link";
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  AlertCircle,
  CheckCircle2,
  GraduationCap,
  ArrowRight,
  Loader2,
  Sun,
  Moon,
} from "lucide-react";
import { useForm } from "@/hooks/useForm";
import { loginUser } from "@/lib/prisma/actions/users";
import { useRouter } from "next/navigation";
import { useTheme } from "@/hooks/useTheme";

// Login response interface
interface LoginResponse {
  success: boolean;
  message: string;
  user?: {
    email: string;
    name: string;
    role: string;
  };
}

export default function LoginPage() {
  const router = useRouter();

  // Form handling hook
  const { form, handleChange, resetFormFields } = useForm({
    username: "",
    password: "",
  });

  // UI state variables
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  // UI feedback & theme states
  const { theme, toggleTheme } = useTheme();
  const isDarkMode = theme === "dark";
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Form submission handler
  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    // Reset feedback states
    setErrorMsg(null);
    setSuccessMsg(null);
    setIsLoading(true);

    try {
      const response = await loginUser(form.username, form.password);

      if (response.success) {
        setSuccessMsg(response.message);
        // Reset form on success
        resetFormFields();
        // Redirect to dashboard after a short delay for user feedback
        setTimeout(() => {
          router.push("/dashboard");
        }, 800);
      } else {
        setErrorMsg(response.message);
      }
    } catch (error) {
      setErrorMsg("An unexpected error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // Google Login click handler
  const handleGoogleLogin = () => {
    setErrorMsg(null);
    setSuccessMsg(null);
    setIsGoogleLoading(true);

    // Simulate Google OAuth popup behavior
    setTimeout(() => {
      setIsGoogleLoading(false);
      setSuccessMsg(
        "Google authenticated successfully! Connecting to portal...",
      );
      // Simulate redirect to dashboard after Google login success
      setTimeout(() => {
        router.push("/dashboard");
      }, 800);
    }, 1200);
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
              Sign In
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Please enter your credentials to access the portal
            </p>
          </div>

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

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-login-gap">
            {/* Username/Email Input */}
            <div>
              <label
                htmlFor="username"
                className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-2"
              >
                Username or Email Address
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <Mail className="h-4 w-4 text-slate-400 group-focus-within:text-primary transition-colors" />
                </div>
                <input
                  type="text"
                  id="username"
                  name="username"
                  autoComplete="username"
                  required
                  disabled={isLoading || isGoogleLoading}
                  value={form.username}
                  onChange={handleChange}
                  placeholder="student@university.edu or username"
                  className="w-full h-login-input-h pl-10 pr-4 py-3 bg-slate-50/50 dark:bg-slate-955/50 border border-slate-200 dark:border-slate-800 rounded-login-radius text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                />
              </div>
            </div>

            {/* Password Input */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <label
                  htmlFor="current-password"
                  className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400"
                >
                  Password
                </label>
                <Link
                  href="/login/reset"
                  className="text-xs font-medium text-primary hover:opacity-80 transition-colors"
                >
                  Forgot password?
                </Link>
              </div>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <Lock className="h-4 w-4 text-slate-400 group-focus-within:text-primary transition-colors" />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  id="current-password"
                  name="password"
                  autoComplete="current-password"
                  required
                  disabled={isLoading || isGoogleLoading}
                  value={form.password}
                  onChange={handleChange}
                  placeholder="••••••••"
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

            {/* Remember me & Options */}
            <div className="flex items-center">
              <input
                id="remember-me"
                name="remember-me"
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="h-4 w-4 rounded border-slate-300 dark:border-slate-700 bg-slate-50/50 text-primary focus:ring-primary focus:ring-offset-white dark:focus:ring-offset-slate-900"
              />
              <label
                htmlFor="remember-me"
                className="ml-2.5 block text-xs text-slate-500 dark:text-slate-400 font-medium cursor-pointer selection:bg-transparent"
              >
                Keep me signed in
              </label>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading || isGoogleLoading}
              className="relative w-full h-login-input-h flex justify-center items-center gap-2 py-3 px-4 bg-primary hover:bg-primary/90 text-white font-semibold rounded-login-radius transition-all duration-200 active:scale-[0.98] shadow-lg shadow-primary/10 dark:shadow-primary/20 disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100 text-sm overflow-hidden cursor-pointer"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Signing in...</span>
                </>
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </>
              )}
            </button>
          </form>

          {/* Styled Divider */}
          <div className="relative my-6">
            <div
              className="absolute inset-0 flex items-center"
              aria-hidden="true"
            >
              <div className="w-full border-t border-slate-200 dark:border-slate-800"></div>
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="bg-white dark:bg-slate-900 px-3 text-slate-400 font-medium">
                Or continue with
              </span>
            </div>
          </div>

          {/* Google Login Button */}
          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={isLoading || isGoogleLoading}
            className="w-full h-login-input-h flex items-center justify-center gap-3 py-3 px-4 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 rounded-login-radius text-slate-700 dark:text-slate-300 font-semibold transition-all duration-200 active:scale-[0.98] text-sm disabled:opacity-50 disabled:cursor-not-allowed shadow-sm cursor-pointer"
          >
            {isGoogleLoading ? (
              <Loader2 className="h-4 w-4 animate-spin text-slate-400" />
            ) : (
              <svg
                className="h-5 w-5"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  fill="#4285F4"
                />
                <path
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  fill="#34A853"
                />
                <path
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  fill="#FBBC05"
                />
                <path
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  fill="#EA4335"
                />
              </svg>
            )}
            <span>Sign in with Google</span>
          </button>

          {/* Switch to Register page link */}
          <div className="mt-6 text-center text-xs">
            <span className="text-slate-500 dark:text-slate-400">
              Don't have an account?{" "}
            </span>
            <a
              href="/register"
              className="font-medium text-primary hover:opacity-85 transition-colors"
            >
              Sign up as a Student
            </a>
          </div>
        </div>

        {/* Footer Support Info */}
        <p className="text-center text-xs text-slate-500 mt-8 z-10 relative">
          By signing in, you agree to the university's Acceptable Use Policy.
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
