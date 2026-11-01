"use client";

import React, {
  useState,
  useEffect,
  useRef,
  FormEvent,
  useCallback,
} from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Loader2, AlertTriangle } from "lucide-react";

import {
  getRequestDetails,
  updateRequestStatus,
  assignRequest,
  unassignRequest,
  addRequestWatcher,
  removeRequestWatcher,
  addRequestComment,
  updateRequestTarget,
  forwardRequest,
  escalateRequest,
  addRequestAttachment,
} from "@/lib/actions/requests";
import { uploadFile } from "@/lib/uploader";
import { getStaffUsers } from "@/lib/actions/staff";
import { getCategories } from "@/lib/actions/categories";
import { getDepartments } from "@/lib/actions/departments";

import TimeLine from "@/components/requests/timeline";
import { ObserverBanner } from "./components/ObserverBanner";
import { TicketHeader } from "./components/TicketHeader";
import { EscalationCard } from "./components/EscalationCard";
import { FilerDetailsCard } from "./components/FilerDetailsCard";
import { AssignedOfficersCard } from "./components/AssignedOfficersCard";
import { WatchersCard } from "./components/WatchersCard";
import { AttachmentsCard } from "./components/AttachmentsCard";
import { ActionPanel } from "./components/ActionPanel";

interface StaffOption {
  id: string;
  name: string;
  role: string;
}

export default function RequestDetailsPage() {
  const { id } = useParams() as { id: string };
  const router = useRouter();

  // Core data states
  const [request, setRequest] = useState<any>(null);
  const [staffOptions, setStaffOptions] = useState<StaffOption[]>([]);
  const [userRole, setUserRole] = useState("STUDENT");
  const [userRights, setUserRights] = useState<string[]>([]);
  const [userId, setUserId] = useState("");
  const [userDeptId, setUserDeptId] = useState("");
  const [categories, setCategories] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [isPageLoading, setIsPageLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Form action states
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newStatus, setNewStatus] = useState("");
  const [assignedStaffId, setAssignedStaffId] = useState("");
  const [watcherSelectId, setWatcherSelectId] = useState("");
  const [forwardStaffId, setForwardStaffId] = useState("");
  const [commentText, setCommentText] = useState("");
  const [isInternalComment, setIsInternalComment] = useState(false);

  // Classification editing state
  const [isEditingTarget, setIsEditingTarget] = useState(false);
  const [newTargetMode, setNewTargetMode] = useState<"CATEGORY" | "DEPARTMENT">(
    "CATEGORY",
  );
  const [newTargetId, setNewTargetId] = useState("");

  // Escalation modal state
  const [isEscalateModalOpen, setIsEscalateModalOpen] = useState(false);
  const [escalationReason, setEscalationReason] = useState("");
  const [isSubmittingEscalation, setIsSubmittingEscalation] = useState(false);

  // Attachment upload state
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploadingAttachment, setIsUploadingAttachment] = useState(false);
  const [fileUploadError, setFileUploadError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Feedback notifications
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const loadDetails = useCallback(async () => {
    setIsPageLoading(true);
    const response = await getRequestDetails(id);
    if (response.success && response.request) {
      setRequest(response.request);
      setUserRole(response.userRole || "STUDENT");
      setUserRights(response.userRights || []);
      setUserId(response.userId || "");
      setUserDeptId(response.userDeptId || "");
      setNewStatus(response.request.status);
      setAssignedStaffId("");
      setWatcherSelectId("");
      setForwardStaffId("");

      setNewTargetMode(
        response.request.departmentId ? "DEPARTMENT" : "CATEGORY",
      );
      setNewTargetId(
        response.request.departmentId || response.request.categoryId || "",
      );
    } else {
      setErrorMsg(response.message || "Failed to load request details.");
    }

    // Load staff options if viewer is not a student
    if (response.success && response.userRole !== "STUDENT") {
      const staffResponse = await getStaffUsers();
      if (staffResponse.success && staffResponse.staff) {
        setStaffOptions(staffResponse.staff as any);
      }

      // Load categories & departments if admin or HOD
      const isAdmin =
        response.userRole === "ADMIN" || response.userRole === "SUPER_ADMIN";
      const isHod = response.userRole === "HOD";
      if (isAdmin || isHod) {
        const [catRes, deptRes] = await Promise.all([
          getCategories(),
          getDepartments(),
        ]);
        if (catRes.success && catRes.categories) {
          setCategories(catRes.categories);
        }
        if (deptRes.success && deptRes.departments) {
          setDepartments(deptRes.departments as any[]);
        }
      }
    }
    setIsPageLoading(false);
  }, [id]);

  useEffect(() => {
    if (id) {
      loadDetails();
    }
  }, [id, loadDetails]);

  // Handle Status Update
  const handleStatusSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setActionSuccess(null);
    setActionError(null);
    setIsSubmitting(true);

    try {
      const response = await updateRequestStatus(id, newStatus);
      if (response.success) {
        setActionSuccess("Status updated successfully!");
        await loadDetails();
      } else {
        setActionError(response.message);
      }
    } catch {
      setActionError("Failed to update status.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Quick Keys / Quick Status Action for Officers
  const handleQuickStatus = async (targetStatus: string) => {
    if (!targetStatus || targetStatus === request?.status || isSubmitting)
      return;

    setActionSuccess(null);
    setActionError(null);
    setIsSubmitting(true);

    try {
      const response = await updateRequestStatus(id, targetStatus);
      if (response.success) {
        setActionSuccess(`Ticket marked as ${targetStatus.replace("_", " ")}!`);
        await loadDetails();
      } else {
        setActionError(response.message);
      }
    } catch {
      setActionError(`Failed to update status to ${targetStatus}.`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Staff Assignment
  const handleAssignSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setActionSuccess(null);
    setActionError(null);
    if (!assignedStaffId) return;

    setIsSubmitting(true);
    try {
      const response = await assignRequest(id, assignedStaffId);
      if (response.success) {
        setActionSuccess(response.message || "Officer assigned successfully.");
        setAssignedStaffId("");
        await loadDetails();
      } else {
        setActionError(response.message);
      }
    } catch {
      setActionError("Failed to assign staff.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Forward Request
  const handleForwardSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setActionSuccess(null);
    setActionError(null);
    if (!forwardStaffId) return;

    setIsSubmitting(true);
    try {
      const response = await forwardRequest(id, forwardStaffId);
      if (response.success) {
        setActionSuccess(response.message || "Request forwarded successfully.");
        setForwardStaffId("");
        await loadDetails();
      } else {
        setActionError(response.message);
      }
    } catch {
      setActionError("Failed to forward request.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Unassign Officer
  const handleUnassign = async (targetUserId: string) => {
    setActionSuccess(null);
    setActionError(null);
    setIsSubmitting(true);
    try {
      const response = await unassignRequest(id, targetUserId);
      if (response.success) {
        setActionSuccess(response.message);
        await loadDetails();
      } else {
        setActionError(response.message);
      }
    } catch {
      setActionError("Failed to unassign staff.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Watcher Actions
  const handleAddWatcherSubmit = async () => {
    if (!watcherSelectId) return;
    setActionSuccess(null);
    setActionError(null);
    setIsSubmitting(true);
    try {
      const response = await addRequestWatcher(id, watcherSelectId);
      if (response.success) {
        setActionSuccess(response.message);
        setWatcherSelectId("");
        await loadDetails();
      } else {
        setActionError(response.message);
      }
    } catch {
      setActionError("Failed to add watcher.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRemoveWatcher = async (targetUserId: string) => {
    setActionSuccess(null);
    setActionError(null);
    setIsSubmitting(true);
    try {
      const response = await removeRequestWatcher(id, targetUserId);
      if (response.success) {
        setActionSuccess(response.message);
        await loadDetails();
      } else {
        setActionError(response.message);
      }
    } catch {
      setActionError("Failed to remove watcher.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Classification Target Submit
  const handleTargetSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setActionSuccess(null);
    setActionError(null);
    if (!newTargetId) return;

    setIsSubmitting(true);
    try {
      const response = await updateRequestTarget(
        id,
        newTargetMode,
        newTargetId,
      );
      if (response.success) {
        setActionSuccess(response.message);
        setIsEditingTarget(false);
        await loadDetails();
      } else {
        setActionError(response.message);
      }
    } catch {
      setActionError("Failed to update request target classification.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Comment Submission
  const handleCommentSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setActionSuccess(null);
    setActionError(null);

    if (!commentText.trim()) return;

    setIsSubmitting(true);
    try {
      const response = await addRequestComment(
        id,
        commentText,
        isInternalComment,
      );
      if (response.success) {
        setActionSuccess("Comment added successfully!");
        setCommentText("");
        setIsInternalComment(false);
        await loadDetails();
      } else {
        setActionError(response.message);
      }
    } catch {
      setActionError("Failed to submit comment.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Escalation Submit
  const handleEscalateSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsSubmittingEscalation(true);
    setActionError(null);
    setActionSuccess(null);

    try {
      const response = await escalateRequest(id, escalationReason);
      if (response.success) {
        setActionSuccess(response.message);
        setIsEscalateModalOpen(false);
        setEscalationReason("");
        await loadDetails();
      } else {
        setActionError(response.message);
      }
    } catch {
      setActionError("Failed to escalate request.");
    } finally {
      setIsSubmittingEscalation(false);
    }
  };

  // File Upload Helpers & Actions
  const formatFileSize = (bytes: number) => {
    if (!bytes || bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
  };

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

  const handleFileSelect = (file: File) => {
    setFileUploadError(null);
    const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB
    const ALLOWED_TYPES = [
      "image/jpeg",
      "image/png",
      "image/webp",
      "image/gif",
      "application/pdf",
    ];

    if (file.size > MAX_FILE_SIZE) {
      setFileUploadError("File size must not exceed 10 MB.");
      return;
    }

    if (!ALLOWED_TYPES.includes(file.type.toLowerCase())) {
      setFileUploadError(
        "File type not allowed. Please choose a PDF, PNG, JPG, WebP, or GIF.",
      );
      return;
    }

    setSelectedFile(file);
  };

  const handleUploadAttachment = async () => {
    if (!selectedFile) return;

    setIsUploadingAttachment(true);
    setFileUploadError(null);
    setActionSuccess(null);
    setActionError(null);

    try {
      const formData = new FormData();
      formData.append("file", selectedFile);

      const uploadRes = await uploadFile(formData);

      if (!uploadRes.success || !uploadRes.path) {
        setFileUploadError(
          uploadRes.error || "Failed to upload file to storage.",
        );
        return;
      }

      const attachRes = await addRequestAttachment(
        id,
        selectedFile.name,
        selectedFile.size,
        uploadRes.path,
      );

      if (attachRes.success) {
        setActionSuccess("Attachment uploaded and recorded successfully!");
        setSelectedFile(null);
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
        await loadDetails();
      } else {
        setFileUploadError(attachRes.message || "Failed to link attachment.");
      }
    } catch (err: unknown) {
      console.error("Error during file attachment upload:", err);
      setFileUploadError(
        err instanceof Error ? err.message : "Unexpected error during upload.",
      );
    } finally {
      setIsUploadingAttachment(false);
    }
  };

  // Keyboard Shortcuts for Officers (Alt+U, Alt+P, Alt+W, Alt+R)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.tagName === "SELECT" ||
          target.isContentEditable)
      ) {
        return;
      }

      if (userRole === "STUDENT" || isSubmitting) {
        return;
      }

      if (e.altKey && !e.ctrlKey && !e.metaKey) {
        const key = e.key.toLowerCase();
        if (key === "u") {
          e.preventDefault();
          handleQuickStatus("UNDER_REVIEW");
        } else if (key === "p") {
          e.preventDefault();
          handleQuickStatus("IN_PROGRESS");
        } else if (key === "w") {
          e.preventDefault();
          handleQuickStatus("WAITING_FOR_STUDENT");
        } else if (key === "r") {
          e.preventDefault();
          handleQuickStatus("RESOLVED");
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [userRole, isSubmitting, request?.status, handleQuickStatus]);

  if (isPageLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3">
        <Loader2 className="h-8 w-8 text-primary animate-spin" />
        <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">
          Retrieving ticket details...
        </p>
      </div>
    );
  }

  if (errorMsg || !request) {
    return (
      <div className="max-w-md mx-auto py-20 text-center space-y-4">
        <AlertTriangle className="h-12 w-12 text-red-500 mx-auto" />
        <div className="space-y-1">
          <h2 className="text-lg font-bold text-slate-850 dark:text-slate-200">
            Retrieval Error
          </h2>
          <p className="text-xs text-slate-455">
            {errorMsg || "Request details not found."}
          </p>
        </div>
        <Link
          href="/dashboard/requests"
          className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-xs cursor-pointer"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Requests</span>
        </Link>
      </div>
    );
  }

  // Rights & Access evaluations
  const isAdmin =
    userRights.includes("ADMIN") ||
    userRole === "ADMIN" ||
    userRole === "SUPER_ADMIN";
  const hasRoutingRight = userRights.includes("MANAGE_ROUTING");
  const isDepartmentHod =
    (userRights.includes("MANAGE_DEPARTMENT") || userRole === "HOD") &&
    ((request?.departmentId && request?.departmentHodId === userId) ||
      (request?.departmentId && userDeptId === request.departmentId) ||
      (request?.creator?.departmentId &&
        userDeptId === request.creator.departmentId) ||
      (request?.student?.departmentId &&
        userDeptId === request.student.departmentId));
  const isCreator =
    request?.creator?.id === userId ||
    request?.student?.id === userId ||
    request?.createdById === userId;
  const isAssignedToMe = request?.assignments?.some(
    (a: any) => a.userId === userId || a.user?.id === userId,
  );
  const isWatcher = request?.watchers?.some(
    (w: any) => w.userId === userId || w.id === userId || w.user?.id === userId,
  );
  const isPureWatcher =
    isWatcher && !isAdmin && !isDepartmentHod && !isAssignedToMe && !isCreator;

  const canAssign =
    (isAdmin || hasRoutingRight || isDepartmentHod) && !isPureWatcher;
  const canChangeTarget =
    (isAdmin || isDepartmentHod || userRole === "HOD") && !isPureWatcher;
  const canUploadAttachment =
    (isAdmin || isDepartmentHod || isCreator || isAssignedToMe) &&
    !isPureWatcher;
  const isStudent = userRole === "STUDENT";

  // Build Unified Timeline with Attachment Links
  const timelineItems = [
    ...request.activities.map((a: any) => {
      // Find matching attachment if activity is ATTACHMENT_ADDED
      const matchedAtt =
        a.type === "ATTACHMENT_ADDED"
          ? request.attachments?.find(
              (att: any) =>
                (a.newValue && att.fileUrl === a.newValue) ||
                (a.oldValue && att.fileName === a.oldValue) ||
                (a.message && a.message.includes(att.fileName)),
            )
          : null;

      const fileUrl =
        a.newValue && a.newValue.startsWith("/data/")
          ? a.newValue
          : matchedAtt?.fileUrl || null;

      return {
        id: a.id,
        timelineType: "ACTIVITY" as const,
        type: a.type,
        actorName: a.actorName,
        oldValue: a.oldValue,
        newValue: a.newValue,
        message: a.message,
        fileUrl,
        fileName: matchedAtt?.fileName || a.oldValue || null,
        createdAt: a.createdAt,
      };
    }),
    ...request.comments.map((c: any) => ({
      id: c.id,
      timelineType: "COMMENT" as const,
      authorName: c.authorName,
      authorRole: c.authorRole,
      message: c.message,
      internal: c.internal,
      createdAt: c.createdAt,
    })),
  ].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );

  return (
    <div className="space-y-6">
      {/* 1. Observer Mode Banner */}
      <ObserverBanner
        isPureWatcher={isPureWatcher}
        userId={userId}
        isSubmitting={isSubmitting}
        onRemoveWatcher={handleRemoveWatcher}
      />

      {/* Main Grid: Management & Actions on left, Activity Timeline on right */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-login-gap">
        {/* Left Column (3/5 Width) */}
        <div className="lg:col-span-3 space-y-login-gap">
          {/* 2. Ticket Header (Subject, Category, Status, Priority, Description) */}
          <TicketHeader
            request={request}
            categories={categories}
            departments={departments}
            canChangeTarget={canChangeTarget}
            isEditingTarget={isEditingTarget}
            setIsEditingTarget={setIsEditingTarget}
            newTargetMode={newTargetMode}
            setNewTargetMode={setNewTargetMode}
            newTargetId={newTargetId}
            setNewTargetId={setNewTargetId}
            isSubmitting={isSubmitting}
            onTargetSubmit={handleTargetSubmit}
            formatTimelineDate={formatTimelineDate}
          />

          {/* 3. Action Panel: Note Writing & File Upload Side-by-Side + Quick Keys */}
          <ActionPanel
            request={request}
            userId={userId}
            isStudent={isStudent}
            isPureWatcher={isPureWatcher}
            isAdmin={isAdmin}
            canAssign={canAssign}
            isAssignedToMe={isAssignedToMe}
            isSubmitting={isSubmitting}
            actionSuccess={actionSuccess}
            actionError={actionError}
            newStatus={newStatus}
            setNewStatus={setNewStatus}
            onStatusSubmit={handleStatusSubmit}
            onQuickStatus={handleQuickStatus}
            assignedStaffId={assignedStaffId}
            setAssignedStaffId={setAssignedStaffId}
            onAssignSubmit={handleAssignSubmit}
            forwardStaffId={forwardStaffId}
            setForwardStaffId={setForwardStaffId}
            onForwardSubmit={handleForwardSubmit}
            staffOptions={staffOptions}
            commentText={commentText}
            setCommentText={setCommentText}
            isInternalComment={isInternalComment}
            setIsInternalComment={setIsInternalComment}
            onCommentSubmit={handleCommentSubmit}
            canUploadAttachment={canUploadAttachment}
            selectedFile={selectedFile}
            setSelectedFile={setSelectedFile}
            isUploadingAttachment={isUploadingAttachment}
            fileUploadError={fileUploadError}
            setFileUploadError={setFileUploadError}
            isDragging={isDragging}
            setIsDragging={setIsDragging}
            fileInputRef={fileInputRef}
            onFileSelect={handleFileSelect}
            onUploadAttachment={handleUploadAttachment}
            formatFileSize={formatFileSize}
            onRemoveWatcher={handleRemoveWatcher}
          />

          {/* 4. Attachments List */}
          <AttachmentsCard
            attachments={request.attachments || []}
            formatFileSize={formatFileSize}
          />

          {/* 5. Escalation & Hierarchy Tier Card */}
          <EscalationCard
            request={request}
            isPureWatcher={isPureWatcher}
            isAdmin={isAdmin}
            isEscalateModalOpen={isEscalateModalOpen}
            setIsEscalateModalOpen={setIsEscalateModalOpen}
            escalationReason={escalationReason}
            setEscalationReason={setEscalationReason}
            isSubmittingEscalation={isSubmittingEscalation}
            onEscalateSubmit={handleEscalateSubmit}
          />

          {/* 6. Student Identity / Filer Details */}
          <FilerDetailsCard request={request} isStudent={isStudent} />

          {/* 7. Assigned Resolution Officers */}
          <AssignedOfficersCard
            assignments={request.assignments || []}
            canAssign={canAssign}
            onUnassign={handleUnassign}
          />

          {/* 8. Request Watchers */}
          <WatchersCard
            watchers={request.watchers || []}
            userId={userId}
            canAssign={canAssign}
            isSubmitting={isSubmitting}
            staffOptions={staffOptions}
            watcherSelectId={watcherSelectId}
            setWatcherSelectId={setWatcherSelectId}
            onAddWatcher={handleAddWatcherSubmit}
            onRemoveWatcher={handleRemoveWatcher}
          />
        </div>

        {/* Right Column: Chronological Timeline (2/5 Width) */}
        <div className="lg:col-span-2 space-y-login-gap">
          <TimeLine timelineItems={timelineItems} />
        </div>
      </div>
    </div>
  );
}
