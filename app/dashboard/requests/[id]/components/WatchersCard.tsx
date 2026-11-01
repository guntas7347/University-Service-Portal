import React from "react";
import { Trash2 } from "lucide-react";

interface WatchersCardProps {
  watchers: any[];
  userId: string;
  canAssign: boolean;
  isSubmitting: boolean;
  staffOptions: any[];
  watcherSelectId: string;
  setWatcherSelectId: (val: string) => void;
  onAddWatcher: () => void;
  onRemoveWatcher: (userId: string) => void;
}

export function WatchersCard({
  watchers,
  userId,
  canAssign,
  isSubmitting,
  staffOptions,
  watcherSelectId,
  setWatcherSelectId,
  onAddWatcher,
  onRemoveWatcher,
}: WatchersCardProps) {
  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-login-radius p-6 shadow-sm space-y-3">
      <h3 className="text-sm font-bold text-slate-900 dark:text-slate-50 uppercase tracking-wider border-b border-slate-100 dark:border-slate-800 pb-2">
        Request Watchers ({watchers?.length || 0})
      </h3>

      {watchers && watchers.length > 0 ? (
        <div className="space-y-3">
          {watchers.map((watcher: any) => {
            const watcherName =
              watcher.user?.name ||
              watcher.name ||
              watcher.user?.fullName ||
              "Watcher";
            const watcherRole =
              watcher.user?.role || watcher.role || "STAFF";
            const watcherId =
              watcher.user?.id || watcher.userId || watcher.id;

            return (
              <div
                key={watcherId}
                className="flex items-center justify-between gap-3.5 p-2 bg-slate-50/50 dark:bg-slate-950/20 border border-slate-200/50 dark:border-slate-800 rounded-xl"
              >
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-550 dark:text-slate-350 flex items-center justify-center font-bold text-xs shrink-0">
                    {watcherName
                      .split(" ")
                      .map((n: string) => n[0])
                      .join("")
                      .toUpperCase()
                      .slice(0, 2)}
                  </div>
                  <div className="space-y-0.5">
                    <h4 className="font-bold text-slate-805 dark:text-slate-100 text-xs">
                      {watcherName}
                    </h4>
                    <p className="text-[10px] text-slate-400">
                      {watcherRole.replace("_", " ")}
                    </p>
                  </div>
                </div>
                {(canAssign || watcherId === userId) && (
                  <button
                    type="button"
                    onClick={() => onRemoveWatcher(watcherId)}
                    className="p-1 text-slate-400 hover:text-red-500 rounded-lg hover:bg-red-50 dark:hover:bg-red-955/20 transition-colors cursor-pointer shrink-0"
                    title={watcherId === userId ? "Stop Watching" : "Remove Watcher"}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-slate-450 italic text-xs py-1 select-none">
          No watchers added to this request yet.
        </div>
      )}

      {/* Add Watcher */}
      {canAssign && (
        <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex gap-2">
          <select
            id="addWatcherSelect"
            disabled={isSubmitting}
            value={watcherSelectId}
            onChange={(e) => setWatcherSelectId(e.target.value)}
            className="flex-1 h-8 px-2 bg-slate-50/50 dark:bg-slate-955/50 border border-slate-200 dark:border-slate-850 rounded-lg text-slate-850 dark:text-slate-200 text-[11px] focus:outline-none focus:border-primary transition-all disabled:opacity-50"
          >
            <option value="">Select watcher to add</option>
            {staffOptions.map((opt) => (
              <option key={opt.id} value={opt.id}>
                {opt.name} ({opt.role.replace("_", " ")})
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={onAddWatcher}
            disabled={isSubmitting || !watcherSelectId}
            className="px-2.5 h-8 bg-primary hover:bg-primary/95 text-white font-semibold text-[11px] rounded-lg transition-all active:scale-95 cursor-pointer disabled:opacity-50"
          >
            Add
          </button>
        </div>
      )}
    </div>
  );
}
