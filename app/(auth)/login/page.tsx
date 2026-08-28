"use client";

import React, { useState, useEffect } from "react";
import { CheckCircle2, GraduationCap, Loader2, Sun, Moon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTheme } from "@/hooks/useTheme";
import { fetchSSOToken, loginWithSSO } from "@/lib/auth/auth";

export const REDIRECT_URL = "http://localhost:3000?redirect=grevience";

export default function LoginPage() {
  const router = useRouter();

  // UI feedback & theme states
  const { theme, toggleTheme } = useTheme();
  const isDarkMode = theme === "dark";

  // SSO Redirection & verification states
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationSuccess, setVerificationSuccess] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");

  useEffect(() => {
    // Check if there is an SSO auth code in query parameters
    const params = new URLSearchParams(window.location.search);
    const code = params.get("code");

    if (code) {
      setIsVerifying(true);

      fetchSSOToken(code);

      setStatusMessage(
        "Initializing verification of SSO authorization code...",
      );

      const timer1 = setTimeout(() => {
        setStatusMessage(
          "Verifying token signature and authentication credentials...",
        );

        const timer2 = setTimeout(() => {
          setStatusMessage(
            "Syncing student profile details with university directory...",
          );

          const timer3 = setTimeout(() => {
            setVerificationSuccess(true);
            setStatusMessage(
              "Authentication successful! Loading your dashboard...",
            );

            const timer4 = setTimeout(() => {
              router.push("/dashboard");
            }, 1000);
            return () => clearTimeout(timer4);
          }, 1200);
          return () => clearTimeout(timer3);
        }, 1200);
        return () => clearTimeout(timer2);
      }, 1000);
      return () => clearTimeout(timer1);
    } else {
      setIsRedirecting(true);
      setStatusMessage(
        "Connecting to Shaheed Bhagat Singh SSO portal. Please wait...",
      );

      setTimeout(async () => {
        window.location.href = await loginWithSSO();
      }, 200);
    }
  }, [router]);

  return (
    <div className="relative min-h-screen flex flex-col justify-center items-center px-4 py-12 overflow-hidden transition-colors duration-300 font-sans bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200">
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
      <div className="w-full max-w-login-card z-10 flex flex-col items-center">
        {/* Portal Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center p-3 bg-primary/10 border border-primary/20 rounded-2xl mb-4 shadow-sm">
            <GraduationCap className="h-10 w-10 text-primary" />
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900 dark:text-slate-50 tracking-tight text-center">
            Shaheed Bhagat Singh State University
          </h1>
          <p className="text-sm font-medium text-secondary mt-2">
            Grievance Redressal Portal
          </p>
        </div>

        {/* Card Wrapper */}
        <div className="w-full bg-white dark:bg-slate-900/85 backdrop-blur-xl border border-slate-200 dark:border-slate-800/60 rounded-login-radius p-8 shadow-xl shadow-slate-200/30 dark:shadow-slate-955/40 text-center flex flex-col items-center justify-center min-h-[220px]">
          {verificationSuccess ? (
            <div className="flex flex-col items-center gap-4 animate-in zoom-in duration-300">
              <div className="p-3.5 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 rounded-2xl border border-emerald-100 dark:border-emerald-900/30 animate-bounce">
                <CheckCircle2 className="h-10 w-10" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-slate-50 animate-pulse">
                Authentication Successful!
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {statusMessage}
              </p>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-6">
              <div className="relative flex items-center justify-center">
                <div className="h-14 w-14 rounded-full border-4 border-slate-100 dark:border-slate-800/60 border-t-primary animate-spin" />
                <Loader2 className="absolute h-5 w-5 text-primary animate-pulse" />
              </div>
              <div className="space-y-2">
                <h3 className="text-lg font-bold text-slate-900 dark:text-slate-50">
                  {isRedirecting
                    ? "Connecting to SSO"
                    : "Verifying SSO Session"}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 min-h-[1.5rem] px-2 leading-relaxed">
                  {statusMessage}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
