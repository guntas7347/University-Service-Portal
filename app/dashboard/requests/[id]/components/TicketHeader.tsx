import React from "react";
import Link from "next/link";
import { ArrowLeft, Calendar, Flame, Clock, Info, CheckCircle, XCircle } from "lucide-react";

interface TicketHeaderProps {
  request: any;
  categories: any[];
  departments: any[];
  canChangeTarget: boolean;
  isEditingTarget: boolean;
  setIsEditingTarget: (val: boolean) => void;
  newTargetMode: "CATEGORY" | "DEPARTMENT";
  setNewTargetMode: (mode: "CATEGORY" | "DEPARTMENT") => void;
  newTargetId: string;
  setNewTargetId: (id: string) => void;
  isSubmitting: boolean;
  onTargetSubmit: (e: React.FormEvent) => void;
  formatTimelineDate: (isoString: string) => string;
}

export function TicketHeader({
  request,
  categories,
  departments,
  canChangeTarget,
  isEditingTarget,
  setIsEditingTarget,
  newTargetMode,
  setNewTargetMode,
  newTargetId,
  setNewTargetId,
  isSubmitting,
  onTargetSubmit,
  formatTimelineDate,
}: TicketHeaderProps) {
  // Status mapping to badges
  const getStatusBadge = (status: string) => {
    const s = status.toUpperCase();
    if (s === "SUBMITTED" || s === "ASSIGNED" || s === "DRAFT") {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-50 dark:bg-amber-955/35 text-amber-800 dark:text-amber-300 border border-amber-250 dark:border-amber-900/30">
          <Clock className="h-3.5 w-3.5" />
          <span>Pending</span>
        </span>
      );
    }
    if (
      s === "UNDER_REVIEW" ||
      s === "IN_PROGRESS" ||
      s === "WAITING_FOR_STUDENT"
    ) {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 dark:bg-blue-955/35 text-blue-800 dark:text-blue-300 border border-blue-250 dark:border-blue-900/30">
          <Info className="h-3.5 w-3.5" />
          <span>Under Investigation</span>
        </span>
      );
    }
    if (s === "RESOLVED" || s === "CLOSED") {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 dark:bg-emerald-955/35 text-emerald-800 dark:text-emerald-300 border border-emerald-250 dark:border-emerald-900/30">
          <CheckCircle className="h-3.5 w-3.5" />
          <span>Resolved</span>
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-red-50 dark:bg-red-955/35 text-red-800 dark:text-red-300 border border-red-200/30">
        <XCircle className="h-3.5 w-3.5" />
        <span>Closed / Rejected</span>
      </span>
    );
  };

  const getPriorityColor = (priority: string) => {
    const p = priority.toUpperCase();
    if (p === "URGENT")
      return "text-red-650 bg-red-50 dark:bg-red-950/20 border-red-200/50";
    if (p === "HIGH")
      return "text-orange-655 bg-orange-50 dark:bg-orange-950/20 border-orange-200/50";
    if (p === "MEDIUM")
      return "text-blue-655 bg-blue-50 dark:bg-blue-950/20 border-blue-200/50";
    return "text-slate-600 bg-slate-50 dark:bg-slate-800 border-slate-200/50";
  };

  return (
    <div className="space-y-4">
      {/* Back button & Ticket Number */}
      <div className="flex items-center justify-between">
        <Link
          href="/dashboard/requests"
          className="inline-flex items-center gap-1.5 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 text-xs font-semibold transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Grievances</span>
        </Link>
        <span className="text-xs text-slate-400 font-mono select-none">
          Ticket: {request.ticketId}
        </span>
      </div>

      {/* Main Ticket Card */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-login-radius p-6 shadow-sm space-y-4">
        {isEditingTarget ? (
          <form
            onSubmit={onTargetSubmit}
            className="bg-slate-50 dark:bg-slate-955/40 p-4 border border-slate-200 dark:border-slate-800 rounded-xl space-y-3"
          >
            <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">
              Update Request Classification Target
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] font-semibold text-slate-500 uppercase mb-1">
                  Filing Option
                </label>
                <select
                  value={newTargetMode}
                  onChange={(e) => {
                    setNewTargetMode(
                      e.target.value as "CATEGORY" | "DEPARTMENT",
                    );
                    setNewTargetId("");
                  }}
                  className="w-full h-9 px-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-xs"
                >
                  <option value="CATEGORY">Category</option>
                  <option value="DEPARTMENT">Department</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-slate-500 uppercase mb-1">
                  Select Target
                </label>
                {newTargetMode === "CATEGORY" ? (
                  <select
                    value={newTargetId}
                    onChange={(e) => setNewTargetId(e.target.value)}
                    required
                    className="w-full h-9 px-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-xs"
                  >
                    <option value="">Select Category</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                ) : (
                  <select
                    value={newTargetId}
                    onChange={(e) => setNewTargetId(e.target.value)}
                    required
                    className="w-full h-9 px-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-xs"
                  >
                    <option value="">Select Department</option>
                    {departments.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name} ({d.code})
                      </option>
                    ))}
                  </select>
                )}
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setIsEditingTarget(false)}
                className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold rounded-lg cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting || !newTargetId}
                className="px-3 py-1.5 bg-primary text-white text-xs font-semibold rounded-lg disabled:opacity-50 cursor-pointer"
              >
                {isSubmitting ? "Saving..." : "Save Classification"}
              </button>
            </div>
          </form>
        ) : (
          <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="inline-flex px-2 py-0.5 rounded bg-primary/10 text-primary text-[10px] font-bold tracking-wider uppercase">
                  {request.categoryName}
                </span>
                {request.isEscalated && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-red-50 dark:bg-red-955/35 text-red-700 dark:text-red-300 border border-red-200/50 uppercase tracking-wider">
                    <Flame className="h-3 w-3 text-red-500" />
                    <span>Escalated Level {request.escalationLevel ? request.escalationLevel + 1 : 2}</span>
                  </span>
                )}
                {request.tags && request.tags.map((tag: string) => (
                  <span
                    key={tag}
                    className="inline-flex px-2 py-0.5 rounded-full text-[9px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200/50 font-mono"
                  >
                    #{tag}
                  </span>
                ))}
                {canChangeTarget && (
                  <button
                    type="button"
                    onClick={() => {
                      setNewTargetMode(
                        request.departmentId ? "DEPARTMENT" : "CATEGORY",
                      );
                      setNewTargetId(
                        request.departmentId || request.categoryId || "",
                      );
                      setIsEditingTarget(true);
                    }}
                    className="text-[10px] text-slate-400 hover:text-primary font-semibold flex items-center gap-0.5 cursor-pointer"
                  >
                    (Change Target)
                  </button>
                )}
              </div>
              <h1 className="text-xl font-extrabold text-slate-900 dark:text-slate-50 tracking-tight leading-snug">
                {request.subject}
              </h1>
            </div>
            <div className="flex gap-2 flex-wrap items-center">
              {getStatusBadge(request.status)}
              <span
                className={`inline-flex px-2.5 py-1 rounded-full text-xs font-semibold border ${getPriorityColor(request.priority)}`}
              >
                {request.priority}
              </span>
            </div>
          </div>
        )}

        {/* Description Text */}
        <div className="space-y-2">
          <h4 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            Grievance Description
          </h4>
          <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">
            {request.description}
          </p>
        </div>

        {/* Date info banner */}
        <div className="flex items-center gap-2 pt-2 text-xs text-slate-400">
          <Calendar className="h-4 w-4 shrink-0" />
          <span>Filed on {formatTimelineDate(request.createdAt)}</span>
          {request.isAnonymous && (
            <>
              <span className="h-1.5 w-1.5 rounded-full bg-slate-300" />
              <span className="text-amber-600 dark:text-amber-450 font-semibold">
                Anonymous Submission
              </span>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
