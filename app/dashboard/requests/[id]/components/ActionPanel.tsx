import React, { useState } from "react";
import {
  Send,
  Lock,
  Loader2,
  CheckCircle,
  AlertCircle,
  Upload,
  Paperclip,
  X,
  Zap,
  Check,
  Clock,
  Eye,
  Search,
} from "lucide-react";
import { SelectStaffModal } from "../../../../../components/dashboard/SelectStaffModal";

interface ActionPanelProps {
  request: any;
  userId: string;
  isStudent: boolean;
  isPureWatcher: boolean;
  isAdmin: boolean;
  canAssign: boolean;
  isAssignedToMe: boolean;
  isSubmitting: boolean;
  actionSuccess: string | null;
  actionError: string | null;
  // Status controls
  newStatus: string;
  setNewStatus: (val: string) => void;
  onStatusSubmit: (e: React.FormEvent) => void;
  onQuickStatus: (status: string) => void;
  // Assignment & Forwarding
  assignedStaffId: string;
  setAssignedStaffId: (val: string) => void;
  onAssignSubmit: (e: React.FormEvent) => void;
  forwardStaffId: string;
  setForwardStaffId: (val: string) => void;
  onForwardSubmit: (e: React.FormEvent) => void;
  staffOptions: any[];
  // Comment / Note
  commentText: string;
  setCommentText: (val: string) => void;
  isInternalComment: boolean;
  setIsInternalComment: (val: boolean) => void;
  onCommentSubmit: (e: React.FormEvent) => void;
  // File Upload
  canUploadAttachment: boolean;
  selectedFile: File | null;
  setSelectedFile: (file: File | null) => void;
  isUploadingAttachment: boolean;
  fileUploadError: string | null;
  setFileUploadError: (err: string | null) => void;
  isDragging: boolean;
  setIsDragging: (val: boolean) => void;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  onFileSelect: (file: File) => void;
  onUploadAttachment: () => void;
  formatFileSize: (bytes: number) => string;
  onRemoveWatcher: (userId: string) => void;
}

export function ActionPanel({
  request,
  userId,
  isStudent,
  isPureWatcher,
  canAssign,
  isAssignedToMe,
  isSubmitting,
  actionSuccess,
  actionError,
  newStatus,
  setNewStatus,
  onStatusSubmit,
  onQuickStatus,
  assignedStaffId,
  setAssignedStaffId,
  onAssignSubmit,
  forwardStaffId,
  setForwardStaffId,
  onForwardSubmit,
  staffOptions,
  commentText,
  setCommentText,
  isInternalComment,
  setIsInternalComment,
  onCommentSubmit,
  canUploadAttachment,
  selectedFile,
  setSelectedFile,
  isUploadingAttachment,
  fileUploadError,
  setFileUploadError,
  isDragging,
  setIsDragging,
  fileInputRef,
  onFileSelect,
  onUploadAttachment,
  formatFileSize,
  onRemoveWatcher,
}: ActionPanelProps) {
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [isForwardModalOpen, setIsForwardModalOpen] = useState(false);

  const selectedAssignOfficer = staffOptions.find(
    (s) => s.id === assignedStaffId,
  );
  const selectedForwardOfficer = staffOptions.find(
    (s) => s.id === forwardStaffId,
  );

  // Feedback alerts
  const renderAlerts = () => (
    <>
      {actionSuccess && (
        <div className="flex items-start gap-2.5 p-3 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/30 rounded-xl text-emerald-800 dark:text-emerald-300 text-xs animate-fade-in">
          <CheckCircle className="h-4.5 w-4.5 text-emerald-600 dark:text-emerald-400 mt-0.5 shrink-0" />
          <span>{actionSuccess}</span>
        </div>
      )}
      {actionError && (
        <div className="flex items-start gap-2.5 p-3 bg-red-50 dark:bg-red-955/20 border border-red-200 dark:border-red-800/30 rounded-xl text-red-800 dark:text-red-300 text-xs animate-fade-in">
          <AlertCircle className="h-4.5 w-4.5 text-red-600 dark:text-red-400 mt-0.5 shrink-0" />
          <span>{actionError}</span>
        </div>
      )}
    </>
  );

  // Hidden file input reusable by dropzone / buttons
  const renderFileInput = () => (
    <input
      type="file"
      ref={fileInputRef}
      onChange={(e) => {
        const file = e.target.files?.[0];
        if (file) onFileSelect(file);
      }}
      accept="image/jpeg,image/png,image/webp,image/gif,application/pdf"
      className="hidden"
      id="actionPanelFileInput"
      disabled={isUploadingAttachment}
    />
  );

  // Shared file upload box (placed next to note)
  const renderFileUploadBox = () => (
    <div className="flex flex-col justify-between h-full bg-slate-50/60 dark:bg-slate-950/30 border border-slate-200 dark:border-slate-800 rounded-xl p-4 space-y-3">
      <div className="space-y-1">
        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center justify-between">
          <span className="flex items-center gap-1.5">
            <Paperclip className="h-3.5 w-3.5 text-primary" />
            Attach Supporting Document
          </span>
          <span className="text-[10px] text-slate-400 font-normal lowercase">
            Max 10 MB (PDF, Images)
          </span>
        </label>
        <p className="text-[11px] text-slate-500 dark:text-slate-400">
          Upload receipts, screenshots, documents, or written notices.
        </p>
      </div>

      {!selectedFile ? (
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={(e) => {
            e.preventDefault();
            setIsDragging(false);
          }}
          onDrop={(e) => {
            e.preventDefault();
            setIsDragging(false);
            const file = e.dataTransfer.files?.[0];
            if (file) onFileSelect(file);
          }}
          onClick={() => fileInputRef.current?.click()}
          className={`flex-1 min-h-[100px] border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-1.5 ${
            isDragging
              ? "border-primary bg-primary/10"
              : "border-slate-250 dark:border-slate-800 hover:border-primary/60 hover:bg-white dark:hover:bg-slate-900"
          }`}
        >
          <div className="h-8 w-8 rounded-full bg-primary/10 text-primary flex items-center justify-center">
            <Upload className="h-4 w-4" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-750 dark:text-slate-200">
              Click to select or drag & drop file
            </p>
            <p className="text-[10px] text-slate-400">
              PDF, PNG, JPG, WebP, GIF
            </p>
          </div>
        </div>
      ) : (
        <div className="flex-1 min-h-[100px] p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-750 rounded-xl flex flex-col justify-between gap-3">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <div className="h-8 w-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                <Paperclip className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">
                  {selectedFile.name}
                </p>
                <p className="text-[10px] text-slate-400 font-mono">
                  {formatFileSize(selectedFile.size)}
                </p>
              </div>
            </div>
            <button
              type="button"
              disabled={isUploadingAttachment}
              onClick={() => {
                setSelectedFile(null);
                if (fileInputRef.current) fileInputRef.current.value = "";
                setFileUploadError(null);
              }}
              className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded cursor-pointer shrink-0"
              title="Remove file"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="flex justify-end gap-2 pt-1 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              disabled={isUploadingAttachment}
              onClick={() => {
                setSelectedFile(null);
                if (fileInputRef.current) fileInputRef.current.value = "";
                setFileUploadError(null);
              }}
              className="px-2.5 py-1.5 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={isUploadingAttachment}
              onClick={onUploadAttachment}
              className="px-3.5 py-1.5 bg-primary hover:bg-primary/95 text-white text-xs font-bold rounded-lg shadow-xs transition-all active:scale-95 flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              {isUploadingAttachment ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  <span>Uploading...</span>
                </>
              ) : (
                <>
                  <Upload className="h-3.5 w-3.5" />
                  <span>Attach Document</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {fileUploadError && (
        <div className="flex items-center gap-1.5 p-2 bg-red-50 dark:bg-red-955/20 border border-red-200/60 dark:border-red-900/40 rounded-lg text-red-700 dark:text-red-300 text-[11px]">
          <AlertCircle className="h-3.5 w-3.5 shrink-0" />
          <span>{fileUploadError}</span>
        </div>
      )}
    </div>
  );

  // 1. Pure Watcher View (Observer mode)
  if (isPureWatcher) {
    return (
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-login-radius p-6 shadow-sm space-y-3">
        {renderAlerts()}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0">
              <Eye className="h-5 w-5 text-slate-500 dark:text-slate-400" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
                Read-Only Timeline Access
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                You are an observer on this grievance. Adding comments,
                uploading attachments, and changing ticket status are disabled.
              </p>
            </div>
          </div>
          <button
            type="button"
            disabled={isSubmitting}
            onClick={() => onRemoveWatcher(userId)}
            className="px-4 py-2 border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold rounded-xl transition-all active:scale-95 cursor-pointer disabled:opacity-50 shrink-0"
          >
            Leave Watchlist
          </button>
        </div>
      </div>
    );
  }

  // 2. Student Action Panel
  if (isStudent) {
    return (
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-login-radius p-6 shadow-sm space-y-4">
        {renderFileInput()}
        {renderAlerts()}

        <h3 className="text-sm font-bold text-slate-950 dark:text-slate-50 uppercase tracking-wider border-b border-slate-100 dark:border-slate-800 pb-2">
          Take Action on Ticket
        </h3>

        {/* Side-by-side: Note and File Upload */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-stretch">
          {/* Left: Comment form */}
          <form
            onSubmit={onCommentSubmit}
            className="flex flex-col justify-between bg-slate-50/60 dark:bg-slate-955/30 border border-slate-200 dark:border-slate-800 rounded-xl p-4 space-y-3"
          >
            <div className="space-y-1">
              <label
                htmlFor="studentCommentTextarea"
                className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider"
              >
                Write a Response Note
              </label>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Provide clarifications, ask questions, or respond to university
                staff.
              </p>
            </div>

            <div className="relative group flex-1 flex flex-col justify-end">
              <textarea
                id="studentCommentTextarea"
                required
                disabled={isSubmitting}
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder="Type your message here..."
                rows={4}
                className="w-full pl-3 pr-12 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-750 rounded-xl text-slate-850 dark:text-slate-200 placeholder-slate-400 text-xs focus:outline-none focus:border-primary transition-all resize-y disabled:opacity-50"
              />

              <button
                type="submit"
                disabled={isSubmitting || !commentText.trim()}
                className="absolute bottom-2.5 right-2.5 p-2 bg-primary hover:bg-primary/95 text-white rounded-lg transition-all active:scale-95 cursor-pointer disabled:opacity-50"
                title="Send comment"
              >
                {isSubmitting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </button>
            </div>
          </form>

          {/* Right: File Upload Box */}
          {canUploadAttachment && renderFileUploadBox()}
        </div>
      </div>
    );
  }

  // 3. Officer / Staff Action Panel
  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-login-radius p-6 shadow-sm space-y-5">
      {renderFileInput()}
      {renderAlerts()}

      <div className="border-b border-slate-100 dark:border-slate-800 pb-2 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <h3 className="text-sm font-bold text-slate-950 dark:text-slate-50 uppercase tracking-wider">
          Officer Resolution & Action Hub
        </h3>
        <span className="text-[11px] text-slate-400 font-medium">
          Quick keys:{" "}
          <kbd className="px-1.5 py-0.5 text-[10px] bg-slate-100 dark:bg-slate-800 rounded border border-slate-200 dark:border-slate-700 font-mono">
            Alt+U
          </kbd>{" "}
          Review •{" "}
          <kbd className="px-1.5 py-0.5 text-[10px] bg-slate-100 dark:bg-slate-800 rounded border border-slate-200 dark:border-slate-700 font-mono">
            Alt+P
          </kbd>{" "}
          Progress •{" "}
          <kbd className="px-1.5 py-0.5 text-[10px] bg-slate-100 dark:bg-slate-800 rounded border border-slate-200 dark:border-slate-700 font-mono">
            Alt+R
          </kbd>{" "}
          Resolve
        </span>
      </div>

      {/* QUICK KEYS / ACTION BUTTONS FOR OFFICERS */}
      <div className="space-y-2">
        <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
          <Zap className="h-3.5 w-3.5 text-amber-500" />
          <span>Quick Status Actions</span>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            disabled={isSubmitting || request.status === "UNDER_REVIEW"}
            onClick={() => onQuickStatus("UNDER_REVIEW")}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-900/40 hover:bg-blue-100 dark:hover:bg-blue-900/50 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed shadow-xs"
            title="Shortcut: Alt+U"
          >
            <Clock className="h-3.5 w-3.5 text-blue-500" />
            <span>Mark Under Review</span>
            <kbd className="text-[9px] px-1 py-0.2 bg-white/70 dark:bg-slate-900/80 rounded border font-mono ml-1">
              Alt+U
            </kbd>
          </button>

          <button
            type="button"
            disabled={isSubmitting || request.status === "IN_PROGRESS"}
            onClick={() => onQuickStatus("IN_PROGRESS")}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all bg-indigo-50 dark:bg-indigo-950/30 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-900/40 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed shadow-xs"
            title="Shortcut: Alt+P"
          >
            <Zap className="h-3.5 w-3.5 text-indigo-500" />
            <span>Mark In Progress</span>
            <kbd className="text-[9px] px-1 py-0.2 bg-white/70 dark:bg-slate-900/80 rounded border font-mono ml-1">
              Alt+P
            </kbd>
          </button>

          <button
            type="button"
            disabled={isSubmitting || request.status === "WAITING_FOR_STUDENT"}
            onClick={() => onQuickStatus("WAITING_FOR_STUDENT")}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all bg-amber-50 dark:bg-amber-955/35 text-amber-800 dark:text-amber-300 border border-amber-250 dark:border-amber-900/40 hover:bg-amber-100 dark:hover:bg-amber-900/40 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed shadow-xs"
            title="Shortcut: Alt+W"
          >
            <Clock className="h-3.5 w-3.5 text-amber-500" />
            <span>Wait for Student</span>
            <kbd className="text-[9px] px-1 py-0.2 bg-white/70 dark:bg-slate-900/80 rounded border font-mono ml-1">
              Alt+W
            </kbd>
          </button>

          <button
            type="button"
            disabled={isSubmitting || request.status === "RESOLVED"}
            onClick={() => onQuickStatus("RESOLVED")}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900/40 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed shadow-xs"
            title="Shortcut: Alt+R"
          >
            <Check className="h-3.5 w-3.5 text-emerald-600" />
            <span>Mark Resolved</span>
            <kbd className="text-[9px] px-1 py-0.2 bg-white/70 dark:bg-slate-900/80 rounded border font-mono ml-1">
              Alt+R
            </kbd>
          </button>
        </div>
      </div>

      {/* Primary Staff Controls: Status Transition & Assignment/Forwarding */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
        {/* 1. Status Dropdown Form */}
        <form
          onSubmit={onStatusSubmit}
          className="space-y-2 bg-slate-50/50 dark:bg-slate-950/20 border border-slate-200 dark:border-slate-800 rounded-xl p-3"
        >
          <label
            htmlFor="updateStatusSelect"
            className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider"
          >
            Manual Status Transition
          </label>
          <div className="flex gap-2">
            <select
              id="updateStatusSelect"
              disabled={isSubmitting}
              value={newStatus}
              onChange={(e) => setNewStatus(e.target.value)}
              className="flex-1 h-9 px-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-800 dark:text-slate-200 text-xs focus:outline-none focus:border-primary transition-all disabled:opacity-50"
            >
              <option value="SUBMITTED">Pending (Submitted)</option>
              <option value="ASSIGNED">Assigned</option>
              <option value="UNDER_REVIEW">Under Review</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="WAITING_FOR_STUDENT">Waiting for Student</option>
              <option value="RESOLVED">Resolved</option>
              <option value="REJECTED">Rejected</option>
              <option value="CLOSED">Closed</option>
            </select>

            <button
              type="submit"
              disabled={isSubmitting || newStatus === request.status}
              className="px-3 h-9 bg-primary hover:bg-primary/90 text-white font-semibold text-xs rounded-lg transition-all active:scale-95 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Update
            </button>
          </div>
        </form>

        {/* 2. Assign / Forward Handler Form */}
        {canAssign ? (
          <form
            onSubmit={onAssignSubmit}
            className="space-y-2.5 bg-slate-50/50 dark:bg-slate-950/20 border border-slate-200 dark:border-slate-800 rounded-xl p-3 flex flex-col justify-between"
          >
            <div className="flex items-center justify-between">
              <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Assign Resolution Officer
              </label>
              {assignedStaffId && (
                <button
                  type="button"
                  onClick={() => setIsAssignModalOpen(true)}
                  className="text-[11px] font-semibold text-primary hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <Search className="h-3 w-3" />
                  Change Officer
                </button>
              )}
            </div>

            {selectedAssignOfficer ? (
              <div className="p-2.5 bg-white dark:bg-slate-900 border border-primary/30 rounded-xl flex items-center justify-between gap-3 shadow-2xs">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="h-8 w-8 rounded-lg bg-primary/10 text-primary font-bold text-xs flex items-center justify-center shrink-0">
                    {(selectedAssignOfficer.name || "U")
                      .slice(0, 2)
                      .toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="font-bold text-slate-900 dark:text-slate-100 text-xs truncate">
                        {selectedAssignOfficer.name}
                      </span>
                      <span className="text-[10px] font-bold uppercase tracking-wider bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-1.5 py-0.5 rounded border border-slate-200/50 dark:border-slate-700/50">
                        {selectedAssignOfficer.role.replace(/_/g, " ")}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                      {selectedAssignOfficer.departmentName ||
                        selectedAssignOfficer.email}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setAssignedStaffId("")}
                  className="p-1 text-slate-400 hover:text-red-500 rounded-md transition-colors shrink-0 cursor-pointer"
                  title="Clear selection"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setIsAssignModalOpen(true)}
                className="w-full h-11 px-3 bg-white dark:bg-slate-900 border border-dashed border-slate-300 dark:border-slate-700 hover:border-primary dark:hover:border-primary rounded-xl text-slate-600 dark:text-slate-300 text-xs font-medium flex items-center justify-between group transition-all cursor-pointer shadow-2xs"
              >
                <div className="flex items-center gap-2">
                  <div className="p-1 rounded-md bg-slate-100 dark:bg-slate-800 group-hover:bg-primary/10 group-hover:text-primary transition-colors text-slate-500">
                    <Search className="h-3.5 w-3.5" />
                  </div>
                  <span>Browse Employee & Staff Directory...</span>
                </div>
                <span className="text-[10px] font-bold text-primary px-2 py-0.5 rounded-full bg-primary/10 group-hover:bg-primary group-hover:text-white transition-all">
                  {staffOptions.length} Officers
                </span>
              </button>
            )}

            <div className="flex justify-end pt-0.5">
              <button
                type="submit"
                disabled={isSubmitting || !assignedStaffId}
                className="w-full sm:w-auto px-4 h-9 bg-primary hover:bg-primary/95 text-white font-semibold text-xs rounded-lg transition-all active:scale-95 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1.5 shadow-2xs"
              >
                {isSubmitting ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Check className="h-3.5 w-3.5" />
                )}
                <span>Assign Officer</span>
              </button>
            </div>
          </form>
        ) : (
          isAssignedToMe && (
            <form
              onSubmit={onForwardSubmit}
              className="space-y-2.5 bg-slate-50/50 dark:bg-slate-950/20 border border-slate-200 dark:border-slate-800 rounded-xl p-3 flex flex-col justify-between"
            >
              <div className="flex items-center justify-between">
                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Forward (Self-Unassign & Watch)
                </label>
                {forwardStaffId && (
                  <button
                    type="button"
                    onClick={() => setIsForwardModalOpen(true)}
                    className="text-[11px] font-semibold text-amber-600 dark:text-amber-400 hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <Search className="h-3 w-3" />
                    Change Target
                  </button>
                )}
              </div>

              {selectedForwardOfficer ? (
                <div className="p-2.5 bg-white dark:bg-slate-900 border border-amber-500/30 rounded-xl flex items-center justify-between gap-3 shadow-2xs">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="h-8 w-8 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 font-bold text-xs flex items-center justify-center shrink-0">
                      {(selectedForwardOfficer.name || "U")
                        .slice(0, 2)
                        .toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-bold text-slate-900 dark:text-slate-100 text-xs truncate">
                          {selectedForwardOfficer.name}
                        </span>
                        <span className="text-[10px] font-bold uppercase tracking-wider bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-1.5 py-0.5 rounded border border-slate-200/50 dark:border-slate-700/50">
                          {selectedForwardOfficer.role.replace(/_/g, " ")}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                        {selectedForwardOfficer.departmentName ||
                          selectedForwardOfficer.email}
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setForwardStaffId("")}
                    className="p-1 text-slate-400 hover:text-red-500 rounded-md transition-colors shrink-0 cursor-pointer"
                    title="Clear selection"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setIsForwardModalOpen(true)}
                  className="w-full h-11 px-3 bg-white dark:bg-slate-900 border border-dashed border-slate-300 dark:border-slate-700 hover:border-amber-500 dark:hover:border-amber-500 rounded-xl text-slate-600 dark:text-slate-300 text-xs font-medium flex items-center justify-between group transition-all cursor-pointer shadow-2xs"
                >
                  <div className="flex items-center gap-2">
                    <div className="p-1 rounded-md bg-slate-100 dark:bg-slate-800 group-hover:bg-amber-500/10 group-hover:text-amber-600 transition-colors text-slate-500">
                      <Search className="h-3.5 w-3.5" />
                    </div>
                    <span>Search Officer to Forward to...</span>
                  </div>
                  <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 px-2 py-0.5 rounded-full bg-amber-50 dark:bg-amber-950/40 border border-amber-200/60 dark:border-amber-800/40">
                    {staffOptions.length} Officers
                  </span>
                </button>
              )}

              <div className="flex justify-end pt-0.5">
                <button
                  type="submit"
                  disabled={isSubmitting || !forwardStaffId}
                  className="w-full sm:w-auto px-4 h-9 bg-amber-500 hover:bg-amber-600 text-white font-semibold text-xs rounded-lg transition-all active:scale-95 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1.5 shadow-2xs"
                >
                  {isSubmitting ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Send className="h-3.5 w-3.5" />
                  )}
                  <span>Forward Request</span>
                </button>
              </div>
            </form>
          )
        )}
      </div>

      {/* SIDE-BY-SIDE: RESOLUTION NOTE (LEFT) & ATTACHMENT UPLOAD (RIGHT) */}
      <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
        <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
          Resolution Details & Supporting Files
        </h4>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-stretch">
          {/* Left Column: Note Textarea */}
          <form
            onSubmit={onCommentSubmit}
            className="flex flex-col justify-between bg-slate-50/60 dark:bg-slate-950/30 border border-slate-200 dark:border-slate-800 rounded-xl p-4 space-y-3"
          >
            <div className="space-y-1">
              <label
                htmlFor="commentTextarea"
                className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider"
              >
                Write Response / Update Note
              </label>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Logged to grievance history. Check below to keep staff-only.
              </p>
            </div>

            <div className="relative group flex-1 flex flex-col justify-end">
              <textarea
                id="commentTextarea"
                required
                disabled={isSubmitting}
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder="Write resolution updates or instructions for the student..."
                rows={4}
                className="w-full pl-3 pr-12 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-750 rounded-xl text-slate-850 dark:text-slate-200 placeholder-slate-400 text-xs focus:outline-none focus:border-primary transition-all resize-y disabled:opacity-50"
              />

              <button
                type="submit"
                disabled={isSubmitting || !commentText.trim()}
                className="absolute bottom-2.5 right-2.5 p-2 bg-primary hover:bg-primary/95 text-white rounded-lg transition-all active:scale-95 cursor-pointer disabled:opacity-50 shadow-xs"
                title="Send note"
              >
                {isSubmitting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </button>
            </div>

            <div className="flex items-center gap-2 select-none pt-1">
              <input
                id="internalCommentCheck"
                type="checkbox"
                disabled={isSubmitting}
                checked={isInternalComment}
                onChange={(e) => setIsInternalComment(e.target.checked)}
                className="h-3.5 w-3.5 text-primary border-slate-350 dark:border-slate-800 rounded cursor-pointer"
              />
              <label
                htmlFor="internalCommentCheck"
                className="text-xs text-slate-600 dark:text-slate-300 font-semibold cursor-pointer flex items-center gap-1"
              >
                <Lock className="h-3 w-3 text-amber-500" />
                <span>Internal Note (Staff Only - Hidden from Students)</span>
              </label>
            </div>
          </form>

          {/* Right Column: File Upload */}
          {canUploadAttachment && renderFileUploadBox()}
        </div>
      </div>

      {/* Assign Resolution Officer Modal */}
      <SelectStaffModal
        isOpen={isAssignModalOpen}
        onClose={() => setIsAssignModalOpen(false)}
        staffOptions={staffOptions}
        selectedStaffId={assignedStaffId}
        onSelectStaff={(id) => setAssignedStaffId(id)}
        title="Assign Resolution Officer"
        description="Search faculty and administrative staff directory to assign resolution handler"
      />

      {/* Forward Request Modal */}
      <SelectStaffModal
        isOpen={isForwardModalOpen}
        onClose={() => setIsForwardModalOpen(false)}
        staffOptions={staffOptions}
        selectedStaffId={forwardStaffId}
        onSelectStaff={(id) => setForwardStaffId(id)}
        title="Forward Grievance to Colleague"
        description="Select another faculty member or department officer to handle this grievance"
      />
    </div>
  );
}
