import React from "react";
import { AlertCircle } from "lucide-react";

interface FilerDetailsCardProps {
  request: any;
  isStudent: boolean;
}

export function FilerDetailsCard({
  request,
  isStudent,
}: FilerDetailsCardProps) {
  const studentName =
    request.creator?.fullName ||
    request.creator?.name ||
    request.student?.fullName ||
    request.student?.name ||
    "N/A";

  const email = request.creator?.email || request.student?.email || "N/A";
  const mobile = request.creator?.mobile || request.student?.mobile || "N/A";
  const course =
    request.creator?.courseName || request.student?.courseName || "N/A";

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-login-radius p-6 shadow-sm space-y-4">
      <h3 className="text-sm font-bold text-slate-900 dark:text-slate-50 uppercase tracking-wider border-b border-slate-100 dark:border-slate-800 pb-2">
        Filer Details
      </h3>

      {request.isAnonymous && isStudent ? (
        <div className="flex items-start gap-3 bg-amber-50 dark:bg-amber-955/20 border border-amber-200 dark:border-amber-800/30 p-3.5 rounded-xl text-amber-800 dark:text-amber-300 text-xs">
          <AlertCircle className="h-4.5 w-4.5 shrink-0 text-amber-600 dark:text-amber-400 mt-0.5" />
          <div className="space-y-1">
            <span className="font-bold">Identity Masked</span>
            <p className="leading-relaxed">
              This ticket was filed anonymously. Administrative staff will not
              see your Name, Roll Number, or contact information.
            </p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-xs text-slate-450 block mb-1">
              Student Name
            </span>
            <span className="font-semibold text-slate-800 dark:text-slate-200">
              {studentName}
            </span>
          </div>
          <div>
            <span className="text-xs text-slate-455 block mb-1">
              Email Address
            </span>
            <span className="font-semibold text-slate-800 dark:text-slate-200">
              {email}
            </span>
          </div>
          <div>
            <span className="text-xs text-slate-455 block mb-1">
              Mobile Contact
            </span>
            <span className="font-semibold text-slate-800 dark:text-slate-200">
              {mobile}
            </span>
          </div>
          <div>
            <span className="text-xs text-slate-455 block mb-1">
              Enrolled Course
            </span>
            <span className="font-semibold text-slate-800 dark:text-slate-200 truncate block">
              {course}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
