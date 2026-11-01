import React from "react";
import { Eye } from "lucide-react";

interface ObserverBannerProps {
  isPureWatcher: boolean;
  userId: string;
  isSubmitting: boolean;
  onRemoveWatcher: (userId: string) => void;
}

export function ObserverBanner({
  isPureWatcher,
  userId,
  isSubmitting,
  onRemoveWatcher,
}: ObserverBannerProps) {
  if (!isPureWatcher) return null;

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-amber-500/10 border border-amber-500/30 dark:bg-amber-955/20 dark:border-amber-800/40 rounded-login-radius text-amber-900 dark:text-amber-200 animate-fade-in">
      <div className="flex items-center gap-3">
        <div className="h-9 w-9 rounded-xl bg-amber-500/20 flex items-center justify-center shrink-0">
          <Eye className="h-5 w-5 text-amber-600 dark:text-amber-400" />
        </div>
        <div>
          <h4 className="text-xs font-bold uppercase tracking-wider text-amber-800 dark:text-amber-300">
            Observer Mode Active
          </h4>
          <p className="text-xs text-amber-750/80 dark:text-amber-400/80">
            You are watching this grievance in read-only mode. You cannot comment, forward, attach files, or update ticket status.
          </p>
        </div>
      </div>
      <button
        type="button"
        disabled={isSubmitting}
        onClick={() => onRemoveWatcher(userId)}
        className="px-3.5 py-1.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold rounded-lg shadow-xs transition-all active:scale-95 cursor-pointer shrink-0 disabled:opacity-50"
      >
        Stop Watching
      </button>
    </div>
  );
}
