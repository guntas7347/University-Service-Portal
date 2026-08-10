"use client";

import React from "react";
import { 
  Clock, 
  CheckCircle, 
  Info,
  XCircle,
  FileText,
  AlertTriangle,
  Loader2
} from "lucide-react";

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

interface RecentGrievancesProps {
  requests: RequestItem[];
  isLoading: boolean;
  errorMsg: string | null;
}

export default function RecentGrievances({ requests, isLoading, errorMsg }: RecentGrievancesProps) {
  const getStatusBadge = (status: string) => {
    const s = status.toUpperCase();
    
    if (s === "SUBMITTED" || s === "ASSIGNED" || s === "DRAFT") {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 dark:bg-amber-955/35 text-amber-800 dark:text-amber-300 border border-amber-250 dark:border-amber-900/30">
          <Clock className="h-3.5 w-3.5" />
          <span>Pending</span>
        </span>
      );
    }
    
    if (s === "UNDER_REVIEW" || s === "IN_PROGRESS" || s === "WAITING_FOR_STUDENT") {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-50 dark:bg-blue-955/35 text-blue-800 dark:text-blue-300 border border-blue-250 dark:border-blue-900/30">
          <Info className="h-3.5 w-3.5" />
          <span>Under Investigation</span>
        </span>
      );
    }

    if (s === "RESOLVED" || s === "CLOSED") {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 dark:bg-emerald-955/35 text-emerald-800 dark:text-emerald-300 border border-emerald-250 dark:border-emerald-900/30">
          <CheckCircle className="h-3.5 w-3.5" />
          <span>Resolved</span>
        </span>
      );
    }

    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-red-50 dark:bg-red-955/35 text-red-800 dark:text-red-300 border border-red-250 dark:border-red-900/30">
        <XCircle className="h-3.5 w-3.5" />
        <span>Closed / Rejected</span>
      </span>
    );
  };

  const getPriorityColor = (priority: string) => {
    const p = priority.toUpperCase();
    if (p === "URGENT") return "text-red-650 dark:text-red-400 font-extrabold";
    if (p === "HIGH") return "text-orange-650 dark:text-orange-400 font-bold";
    if (p === "MEDIUM") return "text-blue-600 dark:text-blue-405 font-semibold";
    return "text-slate-500 dark:text-slate-450 font-medium";
  };

  const formatDate = (isoString: string) => {
    try {
      const d = new Date(isoString);
      return d.toLocaleDateString("en-US", {
        month: "short",
        day: "2-digit",
        year: "numeric"
      });
    } catch {
      return "N/A";
    }
  };

  if (isLoading) {
    return (
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-login-radius p-10 flex flex-col items-center justify-center gap-3">
        <Loader2 className="h-8 w-8 text-primary animate-spin" />
        <p className="text-sm text-slate-400">Loading your grievances...</p>
      </div>
    );
  }

  if (errorMsg) {
    return (
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-login-radius p-10 flex flex-col items-center justify-center text-center gap-2">
        <AlertTriangle className="h-10 w-10 text-red-500" />
        <h4 className="font-bold text-slate-800 dark:text-slate-200 text-sm">Failed to Load Grievances</h4>
        <p className="text-xs text-slate-455 max-w-xs mt-1">{errorMsg}</p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-login-radius shadow-sm overflow-hidden flex flex-col min-h-[350px]">
      <div className="p-6 border-b border-slate-200 dark:border-slate-800">
        <h2 className="text-lg font-bold text-slate-900 dark:text-slate-50">
          Recent Grievances
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Your active complaint tickets filed in the portal
        </p>
      </div>

      {requests.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center gap-2 py-20 text-center px-4">
          <FileText className="h-10 w-10 text-slate-350 dark:text-slate-650" />
          <h4 className="font-bold text-slate-700 dark:text-slate-400 text-sm">No Grievances Logged</h4>
          <p className="text-xs text-slate-400 max-w-xs mt-1">
            You have not submitted any grievance tickets yet. Use the submit button to file your first complaint.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/20 text-slate-500 dark:text-slate-400 text-xs font-semibold uppercase">
                <th className="py-3.5 px-6">ID & Subject</th>
                <th className="py-3.5 px-6">Category</th>
                <th className="py-3.5 px-6">Urgency</th>
                <th className="py-3.5 px-6">Status</th>
                <th className="py-3.5 px-6 text-right">Date Filed</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-150 dark:divide-slate-850">
              {requests.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50/20 dark:hover:bg-slate-800/5 transition-colors text-sm">
                  <td className="py-4 px-6 max-w-xs">
                    <div className="font-semibold text-slate-900 dark:text-slate-100 truncate">
                      {item.subject}
                    </div>
                    <div className="text-xs text-slate-400 font-mono mt-0.5">
                      {item.ticketId}
                    </div>
                  </td>
                  <td className="py-4 px-6 text-slate-600 dark:text-slate-350 font-medium whitespace-nowrap">
                    {item.category}
                  </td>
                  <td className={`py-4 px-6 text-xs whitespace-nowrap ${getPriorityColor(item.priority)}`}>
                    {item.priority}
                  </td>
                  <td className="py-4 px-6 whitespace-nowrap">
                    {getStatusBadge(item.status)}
                  </td>
                  <td className="py-4 px-6 text-right text-slate-500 dark:text-slate-450 font-semibold whitespace-nowrap">
                    {formatDate(item.date)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
