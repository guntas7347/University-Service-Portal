import React from "react";
import { Paperclip, FileText, Image as ImageIcon, File as FileIcon, ExternalLink, Download } from "lucide-react";

interface AttachmentsCardProps {
  attachments: any[];
  formatFileSize: (bytes: number) => string;
}

export function AttachmentsCard({
  attachments,
  formatFileSize,
}: AttachmentsCardProps) {
  if (!attachments || attachments.length === 0) {
    return (
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-login-radius p-5 shadow-sm space-y-3">
        <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-2">
          <Paperclip className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-bold text-slate-900 dark:text-slate-50 uppercase tracking-wider">
            Attached Files (0)
          </h3>
        </div>
        <div className="flex items-center gap-2.5 p-3.5 bg-slate-50/50 dark:bg-slate-955/20 border border-slate-150 dark:border-slate-800/50 rounded-xl text-slate-500 dark:text-slate-400 text-xs">
          <Paperclip className="h-4 w-4 text-slate-400 shrink-0" />
          <span>No supporting attachments have been uploaded for this grievance.</span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-login-radius p-5 shadow-sm space-y-3">
      <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
        <div className="flex items-center gap-2">
          <Paperclip className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-bold text-slate-900 dark:text-slate-50 uppercase tracking-wider">
            Attached Files ({attachments.length})
          </h3>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {attachments.map((att: any) => {
          const isPdf =
            att.mimeType?.toLowerCase().includes("pdf") ||
            att.fileName.toLowerCase().endsWith(".pdf");
          const isImg =
            att.mimeType?.toLowerCase().includes("image") ||
            /\.(png|jpe?g|webp|gif)$/i.test(att.fileName);

          return (
            <div
              key={att.id}
              className="flex items-center justify-between gap-3 p-3 bg-slate-50/70 dark:bg-slate-950/30 border border-slate-200/60 dark:border-slate-800 rounded-xl hover:border-slate-300 dark:hover:border-slate-700 transition-all group"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div
                  className={`h-9 w-9 rounded-lg flex items-center justify-center shrink-0 ${
                    isPdf
                      ? "bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border border-rose-200/60 dark:border-rose-900/40"
                      : isImg
                      ? "bg-blue-50 dark:bg-blue-955/40 text-blue-600 dark:text-blue-400 border border-blue-200/60 dark:border-blue-900/40"
                      : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700"
                  }`}
                >
                  {isPdf ? (
                    <FileText className="h-5 w-5" />
                  ) : isImg ? (
                    <ImageIcon className="h-5 w-5" />
                  ) : (
                    <FileIcon className="h-5 w-5" />
                  )}
                </div>
                <div className="min-w-0 space-y-0.5">
                  <p
                    className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate"
                    title={att.fileName}
                  >
                    {att.fileName}
                  </p>
                  <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-medium">
                    <span>{formatFileSize(att.fileSize)}</span>
                    <span>•</span>
                    <span className="truncate max-w-[100px]" title={att.uploadedByName}>
                      {att.uploadedByName}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-1 shrink-0">
                <a
                  href={att.fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-1.5 text-slate-500 hover:text-primary hover:bg-slate-200/60 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                  title="Open in new tab"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                </a>
                <a
                  href={att.fileUrl}
                  download={att.fileName}
                  className="p-1.5 text-slate-500 hover:text-primary hover:bg-slate-200/60 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                  title="Download file"
                >
                  <Download className="h-3.5 w-3.5" />
                </a>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
