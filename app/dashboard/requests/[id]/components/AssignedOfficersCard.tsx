import React from "react";
import { User, Trash2 } from "lucide-react";

interface AssignedOfficersCardProps {
  assignments: any[];
  canAssign: boolean;
  onUnassign: (userId: string) => void;
}

export function AssignedOfficersCard({
  assignments,
  canAssign,
  onUnassign,
}: AssignedOfficersCardProps) {
  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-login-radius p-6 shadow-sm space-y-3">
      <h3 className="text-sm font-bold text-slate-900 dark:text-slate-50 uppercase tracking-wider border-b border-slate-100 dark:border-slate-800 pb-2">
        Assigned Resolution Officers ({assignments?.length || 0})
      </h3>

      {assignments && assignments.length > 0 ? (
        <div className="space-y-3">
          {assignments.map((assignment: any) => {
            const assigneeName =
              assignment.user?.name ||
              assignment.name ||
              assignment.user?.fullName ||
              "Assigned User";
            const assigneeRole =
              assignment.user?.role || assignment.role || "STAFF";
            const assigneeDesignation =
              assignment.user?.designation ||
              assignment.designation ||
              "";
            const assigneeId =
              assignment.user?.id || assignment.userId || assignment.id;

            return (
              <div
                key={assignment.id || assigneeId}
                className="flex items-center justify-between gap-3.5 p-2 bg-slate-50/50 dark:bg-slate-950/20 border border-slate-200/50 dark:border-slate-800 rounded-xl"
              >
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-full bg-primary/10 border border-primary/20 text-primary flex items-center justify-center font-bold text-xs shrink-0">
                    {assigneeName
                      .split(" ")
                      .map((n: string) => n[0])
                      .join("")
                      .toUpperCase()
                      .slice(0, 2)}
                  </div>
                  <div className="space-y-0.5">
                    <h4 className="font-bold text-slate-850 dark:text-slate-100 text-xs">
                      {assigneeName}
                    </h4>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400">
                      {assigneeRole.replace("_", " ")}{" "}
                      {assigneeDesignation ? `• ${assigneeDesignation}` : ""}
                    </p>
                  </div>
                </div>
                {canAssign && (
                  <button
                    type="button"
                    onClick={() => onUnassign(assigneeId)}
                    className="p-1 text-slate-400 hover:text-red-500 rounded-lg hover:bg-red-50 dark:hover:bg-red-955/20 transition-colors cursor-pointer shrink-0"
                    title="Remove Assignee"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="flex items-center gap-2.5 p-3.5 bg-slate-50 dark:bg-slate-955/20 border border-slate-150 dark:border-slate-800/50 rounded-xl text-slate-500 dark:text-slate-400 text-xs">
          <User className="h-4.5 w-4.5 text-slate-400" />
          <span>This grievance has not been assigned to a resolution officer yet.</span>
        </div>
      )}
    </div>
  );
}
