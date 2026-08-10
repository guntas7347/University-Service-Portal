"use client";

import React, { useState, useEffect } from "react";
import { Loader2, ShieldAlert } from "lucide-react";
import { getProfile } from "@/lib/prisma/actions/users";
import StudentDashboard from "@/components/dashboard/StudentDashboard";

interface ProfileUser {
  name: string;
  email: string;
  role: string;
}

export default function DashboardPage() {
  const [user, setUser] = useState<ProfileUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      setIsLoading(true);
      const response = await getProfile();
      if (response.success && response.user) {
        setUser(response.user as any);
      }
      setIsLoading(false);
    };
    fetchUser();
  }, []);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3">
        <Loader2 className="h-8 w-8 text-primary animate-spin" />
        <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">Loading user workspace...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center gap-3">
        <ShieldAlert className="h-10 w-10 text-red-500" />
        <h3 className="font-bold text-slate-800 dark:text-slate-200">Session Error</h3>
        <p className="text-xs text-slate-450 max-w-xs">Could not retrieve active session parameters. Please log out and sign in again.</p>
      </div>
    );
  }

  // Route layouts based on active user role
  const isStudent = user.role.toUpperCase() === "STUDENT";
  
  if (isStudent) {
    return (
      <div className="space-y-6">
        {/* Welcome Section */}
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-slate-50 tracking-tight">
            Welcome back, {user.name}!
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Monitor your submitted complaints and check official university responses
          </p>
        </div>

        {/* Student Dashboard panel */}
        <StudentDashboard />
      </div>
    );
  }

  // Fallback layout for Administrative/Officer roles (preparing the page for other user types)
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 dark:text-slate-50 tracking-tight">
          Welcome back, {user.name}!
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Shaheed Bhagat Singh State University Administration Portal
        </p>
      </div>

      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-login-radius p-8 shadow-sm text-center flex flex-col items-center justify-center py-20 gap-3.5">
        <div className="p-3.5 bg-primary/10 border border-primary/20 text-primary rounded-2xl">
          <ShieldAlert className="h-8 w-8" />
        </div>
        <div className="space-y-1 max-w-sm">
          <h3 className="font-bold text-slate-850 dark:text-slate-200">Administrative Dashboard</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
            You are signed in as an {user.role.toUpperCase()}. The administrator/officer resolution panels are currently under development.
          </p>
        </div>
      </div>
    </div>
  );
}
