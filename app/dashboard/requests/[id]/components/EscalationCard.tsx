import React from "react";
import { Layers, ShieldAlert, Clock, ArrowUpRight, X, Loader2 } from "lucide-react";

interface EscalationCardProps {
  request: any;
  isPureWatcher: boolean;
  isAdmin: boolean;
  isEscalateModalOpen: boolean;
  setIsEscalateModalOpen: (val: boolean) => void;
  escalationReason: string;
  setEscalationReason: (val: string) => void;
  isSubmittingEscalation: boolean;
  onEscalateSubmit: (e: React.FormEvent) => void;
}

export function EscalationCard({
  request,
  isPureWatcher,
  isAdmin,
  isEscalateModalOpen,
  setIsEscalateModalOpen,
  escalationReason,
  setEscalationReason,
  isSubmittingEscalation,
  onEscalateSubmit,
}: EscalationCardProps) {
  const isTerminalStatus = ["RESOLVED", "CLOSED", "REJECTED", "CANCELLED"].includes(
    request.status,
  );

  return (
    <>
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-login-radius p-5 shadow-sm space-y-3">
        <div className="flex items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-2.5">
          <div className="flex items-center gap-2">
            <Layers className="h-4 w-4 text-primary" />
            <h3 className="text-xs font-bold text-slate-900 dark:text-slate-50 uppercase tracking-wider">
              Escalation & Hierarchy Tier
            </h3>
          </div>
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
            Current: <strong className="text-primary font-bold">Level {request.escalationLevel ? request.escalationLevel + 1 : 1}</strong>
          </span>
        </div>

        {/* Escalation Condition Message & Button */}
        {!isTerminalStatus ? (
          !isPureWatcher && request.canEscalate ? (
            <div className="p-3.5 bg-red-50/70 dark:bg-red-955/25 border border-red-200/70 dark:border-red-850 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="space-y-0.5">
                <h4 className="text-xs font-bold text-red-900 dark:text-red-300 flex items-center gap-1.5">
                  <ShieldAlert className="h-4 w-4 text-red-600 dark:text-red-400" />
                  Eligible for Escalation
                </h4>
                <p className="text-[11px] text-red-750 dark:text-red-400 leading-normal">
                  This grievance has been unresolved for 7+ days. You can escalate it to the next authority tier (Level {(request.escalationLevel || 0) + 2}).
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsEscalateModalOpen(true)}
                className="px-3.5 py-2 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-lg transition-all active:scale-95 shadow-xs flex items-center justify-center gap-1.5 shrink-0 cursor-pointer"
              >
                <ArrowUpRight className="h-3.5 w-3.5" />
                <span>Escalate Ticket</span>
              </button>
            </div>
          ) : (
            <div className="p-3 bg-slate-50 dark:bg-slate-955/40 border border-slate-200/60 dark:border-slate-800 rounded-xl text-xs text-slate-600 dark:text-slate-400 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-slate-400 shrink-0" />
                <span>
                  Next escalation unlock in <strong>{request.daysUntilEscalation || 0} day(s)</strong> (7-day resolution window per level).
                </span>
              </div>
              {isAdmin && (
                <button
                  type="button"
                  onClick={() => setIsEscalateModalOpen(true)}
                  className="text-[11px] text-primary hover:underline font-semibold cursor-pointer shrink-0"
                >
                  Admin Force Escalate
                </button>
              )}
            </div>
          )
        ) : (
          <div className="p-3 bg-slate-50 dark:bg-slate-955/20 border border-slate-200/50 dark:border-slate-800 rounded-xl text-xs text-slate-400 italic">
            This grievance is currently marked as {request.status} and does not require further escalation.
          </div>
        )}
      </div>

      {/* Escalation Modal Dialog */}
      {isEscalateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
                <ShieldAlert className="h-5 w-5" />
                <h3 className="font-extrabold text-sm text-slate-900 dark:text-slate-50">
                  Escalate Grievance Ticket
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsEscalateModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Escalating will automatically forward this ticket from <strong>Level {(request.escalationLevel || 0) + 1}</strong> to <strong>Level {(request.escalationLevel || 0) + 2}</strong> (or central escalation authority) and elevate its priority.
            </p>

            <form onSubmit={onEscalateSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Reason / Remarks for Escalation (Optional)
                </label>
                <textarea
                  rows={3}
                  value={escalationReason}
                  onChange={(e) => setEscalationReason(e.target.value)}
                  placeholder="Explain why current resolution is unsatisfactory or delayed..."
                  className="w-full p-3 bg-slate-50 dark:bg-slate-955/50 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-850 dark:text-slate-200 focus:outline-none focus:border-primary transition-all resize-none"
                />
              </div>

              <div className="flex justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  disabled={isSubmittingEscalation}
                  onClick={() => setIsEscalateModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold rounded-xl cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingEscalation}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-xl transition-all shadow-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {isSubmittingEscalation ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      <span>Escalating...</span>
                    </>
                  ) : (
                    <>
                      <ArrowUpRight className="h-3.5 w-3.5" />
                      <span>Confirm Escalation</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
