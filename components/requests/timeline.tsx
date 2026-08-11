import { Lock } from "lucide-react";

type TimelineActivity = {
  id: string;
  timelineType: "ACTIVITY";
  type: string;
  actorName: string;
  oldValue: string | null;
  newValue: string | null;
  message: string | null;
  createdAt: string;
};

type TimelineComment = {
  id: string;
  timelineType: "COMMENT";
  authorName: string;
  authorRole: string;
  message: string;
  internal: boolean;
  createdAt: string;
};

type TimelineItem = TimelineActivity | TimelineComment;

const TimeLine = ({ timelineItems }: { timelineItems: TimelineItem[] }) => {
  const formatTimelineDate = (isoString: string) => {
    try {
      const d = new Date(isoString);
      return d.toLocaleDateString("en-US", {
        month: "short",
        day: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return "";
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-login-radius p-6 shadow-sm min-h-[450px] flex flex-col">
      <h3 className="text-sm font-bold text-slate-950 dark:text-slate-50 uppercase tracking-wider border-b border-slate-100 dark:border-slate-800 pb-3 mb-6">
        Request Activity Timeline
      </h3>

      {/* Vertical timeline timelineItems */}
      <div className="flex-1 relative pl-6 border-l-2 border-slate-100 dark:border-slate-800 space-y-6">
        {timelineItems.map((item: any) => {
          const isComment = item.timelineType === "COMMENT";

          return (
            <div key={item.id} className="relative group select-none">
              {/* Timeline Node Point Dot Icon */}
              <div
                className={`absolute -left-[31px] top-1 h-4 w-4 rounded-full border-4 bg-white dark:bg-slate-900 ${
                  isComment
                    ? item.internal
                      ? "border-amber-450"
                      : "border-primary"
                    : "border-slate-350 dark:border-slate-600"
                }`}
              />

              {/* Timeline Content card */}
              <div
                className={`p-4 rounded-login-radius border text-xs space-y-1.5 transition-colors ${
                  isComment
                    ? item.internal
                      ? "bg-amber-50/40 dark:bg-amber-955/15 border-amber-200/50 dark:border-amber-850"
                      : "bg-primary/5 border-primary/20"
                    : "bg-slate-50/50 dark:bg-slate-955/20 border-slate-200/50 dark:border-slate-800/80"
                }`}
              >
                {/* Sub-header (Author/Actor and Date) */}
                <div className="flex justify-between items-center gap-2">
                  <div className="flex items-center gap-1 font-bold text-slate-800 dark:text-slate-250">
                    {isComment ? (
                      <>
                        <span>{item.authorName}</span>
                        <span className="text-[10px] text-slate-400 font-medium">
                          ({item.authorRole.replace("_", " ")})
                        </span>
                      </>
                    ) : (
                      <>
                        <span>{item.actorName}</span>
                      </>
                    )}
                  </div>
                  <span className="text-[10px] text-slate-400 dark:text-slate-500 whitespace-nowrap font-medium">
                    {formatTimelineDate(item.createdAt)}
                  </span>
                </div>

                {/* Content details */}
                {isComment ? (
                  <div className="space-y-1.5 pt-1 text-slate-700 dark:text-slate-300">
                    {item.internal && (
                      <div className="flex items-center gap-1 text-[10px] text-amber-600 dark:text-amber-450 font-bold tracking-wider uppercase">
                        <Lock className="h-3 w-3" />
                        <span>Internal Note</span>
                      </div>
                    )}
                    <p className="leading-relaxed whitespace-pre-wrap">
                      {item.message}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-1 text-slate-500 dark:text-slate-400 leading-relaxed pt-0.5">
                    {/* Activity Specific text representations */}
                    <div className="flex items-center gap-1">
                      <span className="font-semibold text-slate-750 dark:text-slate-300">
                        {item.type.replace("_", " ")}
                      </span>
                      {item.oldValue && item.newValue && (
                        <span className="text-[10px] text-slate-400 font-mono">
                          ({item.oldValue} → {item.newValue})
                        </span>
                      )}
                    </div>
                    {item.message && (
                      <p className="text-[11px] text-slate-400 font-medium">
                        {item.message}
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default TimeLine;
