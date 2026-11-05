"use client";

import React, { useState, useEffect, FormEvent } from "react";
import {
  Save,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Clock,
  Settings,
} from "lucide-react";
import { getConfig, upsertConfig } from "@/lib/actions/configs";

export default function ConfigurationPage() {
  const [escalationDays, setEscalationDays] = useState<any>("2");
  const [isPageLoading, setIsPageLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Alerts feedback
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Fetch initial config on page load
  useEffect(() => {
    const loadConfig = async () => {
      setIsPageLoading(true);
      try {
        const response = await getConfig("escalationDays");
        if (response?.success && response?.data) {
          setEscalationDays(response.data.escalationDays?.toString());
        }
      } catch (error) {
        console.error("Failed to load configuration", error);
      } finally {
        setIsPageLoading(false);
      }
    };

    loadConfig();
  }, []);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSuccessMsg(null);
    setErrorMsg(null);

    const daysValue = Number(escalationDays);

    if (escalationDays.trim() === "" || isNaN(daysValue) || daysValue < 0) {
      setErrorMsg("Please enter a valid number of days.");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await upsertConfig("escalationDays", {
        escalationDays: daysValue,
      });

      if (response?.success) {
        setSuccessMsg(response.message || "Configuration saved successfully.");
      } else {
        setErrorMsg(response?.message || "Failed to save configuration.");
      }
    } catch (err) {
      setErrorMsg("An unexpected error occurred. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 dark:text-slate-50 tracking-tight">
          System Configurations
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Manage global system rules, thresholds, and operational settings
        </p>
      </div>

      {/* Main Content Area */}
      <div className="max-w-3xl">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-login-radius p-6 shadow-sm">
          <div className="mb-6 flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-4">
            <div className="p-2 bg-primary/10 dark:bg-primary/20 rounded-lg">
              <Settings className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-slate-50">
                Escalation Rules
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Configure when grievances can be escalated to higher authorities
              </p>
            </div>
          </div>

          {/* Feedback alerts */}
          {errorMsg && (
            <div className="mb-6 flex items-start gap-2.5 p-3 bg-red-50 dark:bg-red-955/20 border border-red-200 dark:border-red-800/30 rounded-xl text-red-800 dark:text-red-300 text-xs">
              <AlertCircle className="h-4.5 w-4.5 shrink-0 text-red-655 dark:text-red-400 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="mb-6 flex items-start gap-2.5 p-3 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/30 rounded-xl text-emerald-800 dark:text-emerald-300 text-xs">
              <CheckCircle2 className="h-4.5 w-4.5 shrink-0 text-emerald-655 dark:text-emerald-400 mt-0.5" />
              <span>{successMsg}</span>
            </div>
          )}

          {isPageLoading ? (
            <div className="flex items-center justify-center gap-2.5 py-10">
              <Loader2 className="h-6 w-6 text-primary animate-spin" />
              <p className="text-sm text-slate-400">Loading settings...</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              <label
                htmlFor="escalationDays"
                className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-2"
              >
                Escalation Threshold (Days)
              </label>

              <div className="flex gap-3 items-start">
                <div className="relative group flex-1 max-w-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Clock className="h-4 w-4 text-slate-400 group-focus-within:text-primary transition-colors" />
                  </div>

                  <input
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    id="escalationDays"
                    required
                    disabled={isSubmitting}
                    value={escalationDays}
                    onChange={(e) =>
                      setEscalationDays(e.target.value.replace(/\D/g, ""))
                    }
                    placeholder="e.g. 2"
                    className="w-full h-11 pl-9 pr-4 py-2 bg-slate-50/50 dark:bg-slate-955/50 border border-slate-200 dark:border-slate-800 rounded-login-radius text-slate-850 dark:text-slate-200 placeholder-slate-400 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all disabled:opacity-50"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="h-11 px-6 bg-primary hover:bg-primary/95 text-white font-semibold rounded-login-radius text-sm transition-all active:scale-[0.98] shadow-md shadow-primary/10 cursor-pointer flex items-center justify-center gap-2 min-w-[120px]"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4" />
                      <span>Save Config</span>
                    </>
                  )}
                </button>
              </div>

              <p className="text-xs text-slate-500 dark:text-slate-450 mt-2 max-w-sm leading-relaxed">
                The number of days a request must remain unresolved before a
                student is granted the option to escalate it.
              </p>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
