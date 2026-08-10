"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { 
  FileText, 
  Clock, 
  CheckCircle, 
  AlertCircle,
  PlusCircle, 
  ArrowRight,
  ChevronRight
} from "lucide-react";
import RecentGrievances from "./RecentGrievances";
import { getStudentRequests } from "@/lib/prisma/actions/requests";

interface RequestItem {
  id: string;
  ticketId: string;
  type: string;
  category: string;
  subject: string;
  status: string;
  priority: string;
  date: string;
}

export default function StudentDashboard() {
  const [requests, setRequests] = useState<RequestItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Load grievances on mount
  useEffect(() => {
    const fetchRequests = async () => {
      setIsLoading(true);
      const response = await getStudentRequests();
      if (response.success && response.requests) {
        setRequests(response.requests);
      } else {
        setErrorMsg(response.message || "Failed to load requests.");
      }
      setIsLoading(false);
    };
    fetchRequests();
  }, []);

  // Compute dynamic stats from the active student requests list
  const totalCount = requests.length;
  
  const pendingCount = requests.filter((r) => {
    const s = r.status.toUpperCase();
    return s === "SUBMITTED" || s === "ASSIGNED" || s === "DRAFT";
  }).length;

  const investigationCount = requests.filter((r) => {
    const s = r.status.toUpperCase();
    return s === "UNDER_REVIEW" || s === "IN_PROGRESS" || s === "WAITING_FOR_STUDENT";
  }).length;

  const resolvedCount = requests.filter((r) => {
    const s = r.status.toUpperCase();
    return s === "RESOLVED" || s === "CLOSED";
  }).length;

  return (
    <div className="space-y-6">
      
      {/* Metrics Card Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-login-gap">
        {/* Total Grievances */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-login-radius p-5 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider">
              Total Grievances
            </span>
            <h3 className="text-3xl font-extrabold text-slate-900 dark:text-slate-100">
              {totalCount}
            </h3>
          </div>
          <div className="p-3 bg-slate-100 dark:bg-slate-800 text-slate-650 dark:text-slate-400 rounded-xl">
            <FileText className="h-6 w-6" />
          </div>
        </div>

        {/* Pending Action */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-login-radius p-5 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider">
              Pending Action
            </span>
            <h3 className="text-3xl font-extrabold text-amber-600 dark:text-amber-400">
              {pendingCount}
            </h3>
          </div>
          <div className="p-3 bg-amber-55/10 text-amber-600 rounded-xl">
            <Clock className="h-6 w-6" />
          </div>
        </div>

        {/* In Investigation */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-login-radius p-5 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider">
              In Investigation
            </span>
            <h3 className="text-3xl font-extrabold text-blue-650 dark:text-blue-400">
              {investigationCount}
            </h3>
          </div>
          <div className="p-3 bg-blue-55/10 text-blue-655 rounded-xl">
            <AlertCircle className="h-6 w-6" />
          </div>
        </div>

        {/* Resolved Tickets */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-login-radius p-5 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider">
              Resolved Tickets
            </span>
            <h3 className="text-3xl font-extrabold text-emerald-600 dark:text-emerald-400">
              {resolvedCount}
            </h3>
          </div>
          <div className="p-3 bg-emerald-55/10 text-emerald-600 rounded-xl">
            <CheckCircle className="h-6 w-6" />
          </div>
        </div>
      </div>

      {/* Main Grid: List & Quick Action */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-login-gap">
        
        {/* Dynamic Grievances List Component */}
        <div className="lg:col-span-2">
          <RecentGrievances 
            requests={requests} 
            isLoading={isLoading} 
            errorMsg={errorMsg} 
          />
        </div>

        {/* Quick Submit Actions */}
        <div className="space-y-login-gap">
          {/* File New Request Card */}
          <div className="bg-primary/5 dark:bg-primary/10 border border-primary/20 rounded-login-radius p-6 shadow-sm flex flex-col justify-between space-y-4">
            <div className="space-y-2">
              <div className="inline-flex p-2.5 bg-primary/10 border border-primary/20 text-primary rounded-xl">
                <PlusCircle className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                File a Grievance
              </h3>
              <p className="text-xs text-slate-655 dark:text-slate-400 leading-relaxed">
                Submit academic, infrastructure, hostel, or administration complaints to university redressal cells.
              </p>
            </div>
            
            <Link
              href="/dashboard/create-request"
              className="flex items-center justify-between w-full py-3 px-4 bg-primary hover:bg-primary/95 text-white font-semibold rounded-xl text-sm transition-all duration-200 active:scale-[0.98] cursor-pointer shadow-md shadow-primary/10"
            >
              <span>Submit Complaint</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          {/* Standards Guidelines Card */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-login-radius p-6 shadow-sm space-y-3">
            <h4 className="font-bold text-slate-800 dark:text-slate-100 text-sm">
              Standard Resolution Timelines
            </h4>
            <ul className="text-xs text-slate-500 dark:text-slate-400 space-y-2">
              <li className="flex items-center gap-2">
                <ChevronRight className="h-3.5 w-3.5 text-primary shrink-0" />
                <span>Academic departments: 3 working days</span>
              </li>
              <li className="flex items-center gap-2">
                <ChevronRight className="h-3.5 w-3.5 text-primary shrink-0" />
                <span>Hostel Maintenance & IT: 24-48 hours</span>
              </li>
              <li className="flex items-center gap-2">
                <ChevronRight className="h-3.5 w-3.5 text-primary shrink-0" />
                <span>General Amenities: 5 working days</span>
              </li>
            </ul>
          </div>
        </div>

      </div>

    </div>
  );
}
