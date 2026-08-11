"use client";

import React, { useState, useEffect, FormEvent } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Loader2,
  AlertTriangle,
  Clock,
  CheckCircle,
  Info,
  XCircle,
  User,
  Shield,
  MessageSquare,
  Lock,
  CornerDownRight,
  UserCheck,
  Send,
  Sparkles,
  Calendar,
  AlertCircle,
  Trash2,
} from "lucide-react";
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
} from "@/lib/prisma/actions/requests";
import { getStaffUsers } from "@/lib/prisma/actions/staff";
import { getCategories } from "@/lib/prisma/actions/categories";
import { getDepartments } from "@/lib/prisma/actions/departments";
import TimeLine from "@/components/requests/timeline";

interface StaffOption {
  id: string;
  name: string;
  role: string;
}

export default function RequestDetailsPage() {
  const { id } = useParams() as { id: string };
  const router = useRouter();

  // Data states
  const [request, setRequest] = useState<any>(null);
  const [staffOptions, setStaffOptions] = useState<StaffOption[]>([]);
  const [userRole, setUserRole] = useState("STUDENT");
  const [userRights, setUserRights] = useState<string[]>([]);
  const [userId, setUserId] = useState("");
  const [categories, setCategories] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [isPageLoading, setIsPageLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Form action states
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newStatus, setNewStatus] = useState("");
  const [assignedStaffId, setAssignedStaffId] = useState("");
  const [watcherSelectId, setWatcherSelectId] = useState("");
  const [commentText, setCommentText] = useState("");
  const [isInternalComment, setIsInternalComment] = useState(false);

  // Target change editing state
  const [isEditingTarget, setIsEditingTarget] = useState(false);
  const [newTargetMode, setNewTargetMode] = useState<"CATEGORY" | "DEPARTMENT">(
    "CATEGORY",
  );
  const [newTargetId, setNewTargetId] = useState("");

  const [userDeptId, setUserDeptId] = useState("");
  const [forwardStaffId, setForwardStaffId] = useState("");

  // Success messages for form actions
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const loadDetails = async () => {
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
  };

  useEffect(() => {
    if (id) {
      loadDetails();
    }
  }, [id]);

  // Handle Status Update Submit
  const handleStatusSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setActionSuccess(null);
    setActionError(null);
    setIsSubmitting(true);

    try {
      const response = await updateRequestStatus(id, newStatus);
      if (response.success) {
        setActionSuccess("Status updated successfully!");
        await loadDetails(); // Reload data
      } else {
        setActionError(response.message);
      }
    } catch (err) {
      setActionError("Failed to update status.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Staff Assignment Submit
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
    } catch (err) {
      setActionError("Failed to assign staff.");
    } finally {
      setIsSubmitting(false);
    }
  };

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
    } catch (err) {
      setActionError("Failed to forward request.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUnassign = async (userId: string) => {
    setActionSuccess(null);
    setActionError(null);
    setIsSubmitting(true);
    try {
      const response = await unassignRequest(id, userId);
      if (response.success) {
        setActionSuccess(response.message);
        await loadDetails();
      } else {
        setActionError(response.message);
      }
    } catch (err) {
      setActionError("Failed to unassign staff.");
    } finally {
      setIsSubmitting(false);
    }
  };

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
    } catch (err) {
      setActionError("Failed to add watcher.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRemoveWatcher = async (userId: string) => {
    setActionSuccess(null);
    setActionError(null);
    setIsSubmitting(true);
    try {
      const response = await removeRequestWatcher(id, userId);
      if (response.success) {
        setActionSuccess(response.message);
        await loadDetails();
      } else {
        setActionError(response.message);
      }
    } catch (err) {
      setActionError("Failed to remove watcher.");
    } finally {
      setIsSubmitting(false);
    }
  };

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
    } catch (err) {
      setActionError("Failed to update request target classification.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Comment Submission
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
    } catch (err) {
      setActionError("Failed to submit comment.");
    } finally {
      setIsSubmitting(false);
    }
  };

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

  // Combine Activities and Comments in unified chronological order (ascending)
  const timelineItems = [
    ...request.activities.map((a: any) => ({
      id: a.id,
      timelineType: "ACTIVITY",
      type: a.type,
      actorName: a.actorName,
      oldValue: a.oldValue,
      newValue: a.newValue,
      message: a.message,
      createdAt: a.createdAt,
    })),
    ...request.comments.map((c: any) => ({
      id: c.id,
      timelineType: "COMMENT",
      authorName: c.authorName,
      authorRole: c.authorRole,
      message: c.message,
      internal: c.internal,
      createdAt: c.createdAt,
    })),
  ].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );

  const isAdmin = userRole === "ADMIN" || userRole === "SUPER_ADMIN";
  const hasRoutingRight = userRights.includes("MANAGE_ROUTING");
  const isDepartmentHod =
    userRole === "HOD" && (
      (request?.departmentId && request?.departmentHodId === userId) ||
      (request?.departmentId && userDeptId === request.departmentId) ||
      (request?.creator?.departmentId && userDeptId === request.creator.departmentId)
    );
  const canAssign = isAdmin || hasRoutingRight || isDepartmentHod;
  const canChangeTarget = isAdmin || userRole === "HOD";
  const isStudent = userRole === "STUDENT";
  const isAssignedToMe = request?.assignments?.some((a: any) => a.user.id === userId);

  return (
    <div className="space-y-6">
      {/* Back Button Header */}
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

      {/* Main Grid: Management details card on left, Timeline on right */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-login-gap">
        {/* Left Column: Details and Actions (3/5 Width) */}
        <div className="lg:col-span-3 space-y-login-gap">
          {/* Card 1: Ticket Description Details */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-login-radius p-6 shadow-sm space-y-4">
            {isEditingTarget ? (
              <form
                onSubmit={handleTargetSubmit}
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
                    onClick={() => {
                      setIsEditingTarget(false);
                      setActionError(null);
                    }}
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
                  <div className="flex items-center gap-2">
                    <span className="inline-flex px-2 py-0.5 rounded bg-primary/10 text-primary text-[10px] font-bold tracking-wider uppercase">
                      {request.categoryName}
                    </span>
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
                        (Change)
                      </button>
                    )}
                  </div>
                  <h1 className="text-xl font-extrabold text-slate-900 dark:text-slate-50 tracking-tight leading-snug">
                    {request.subject}
                  </h1>
                </div>
                <div className="flex gap-2">
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

          {/* Card 2: Student Identity Card (only detail values visible based on anonymity) */}
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
                    This ticket was filed anonymously. Administrative staff will
                    not see your Name, Roll Number, or contact information.
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
                    {request.creator.name}
                  </span>
                </div>
                <div>
                  <span className="text-xs text-slate-455 block mb-1">
                    Email Address
                  </span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    {request.creator.email}
                  </span>
                </div>
                <div>
                  <span className="text-xs text-slate-455 block mb-1">
                    Mobile Contact
                  </span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    {request.creator.mobileNumber}
                  </span>
                </div>
                <div>
                  <span className="text-xs text-slate-455 block mb-1">
                    Enrolled Course
                  </span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200 truncate block">
                    {request.creator.courseName}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Card 3: Assigned Officers Details */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-login-radius p-6 shadow-sm space-y-3">
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-50 uppercase tracking-wider border-b border-slate-100 dark:border-slate-800 pb-2">
              Assigned Resolution Officers ({request.assignments?.length || 0})
            </h3>

            {request.assignments && request.assignments.length > 0 ? (
              <div className="space-y-3">
                {request.assignments.map((assignment: any) => (
                  <div
                    key={assignment.id}
                    className="flex items-center justify-between gap-3.5 p-2 bg-slate-50/50 dark:bg-slate-950/20 border border-slate-200/50 dark:border-slate-800 rounded-xl"
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-full bg-primary/10 border border-primary/20 text-primary flex items-center justify-center font-bold text-xs shrink-0">
                        {assignment.user.name
                          .split(" ")
                          .map((n: string) => n[0])
                          .join("")
                          .toUpperCase()
                          .slice(0, 2)}
                      </div>
                      <div className="space-y-0.5">
                        <h4 className="font-bold text-slate-850 dark:text-slate-100 text-xs">
                          {assignment.user.name}
                        </h4>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400">
                          {assignment.user.role.replace("_", " ")}{" "}
                          {assignment.user.designation
                            ? `• ${assignment.user.designation}`
                            : ""}
                        </p>
                      </div>
                    </div>
                    {canAssign && (
                      <button
                        type="button"
                        onClick={() => handleUnassign(assignment.user.id)}
                        className="p-1 text-slate-400 hover:text-red-500 rounded-lg hover:bg-red-50 dark:hover:bg-red-955/20 transition-colors cursor-pointer shrink-0"
                        title="Remove Assignee"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex items-center gap-2.5 p-3.5 bg-slate-50 dark:bg-slate-955/20 border border-slate-150 dark:border-slate-800/50 rounded-xl text-slate-500 dark:text-slate-400 text-xs">
                <User className="h-4.5 w-4.5 text-slate-400" />
                <span>
                  This grievance has not been assigned to a resolution officer
                  yet.
                </span>
              </div>
            )}
          </div>

          {/* Card: Watchers Details */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-login-radius p-6 shadow-sm space-y-3">
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-50 uppercase tracking-wider border-b border-slate-100 dark:border-slate-800 pb-2">
              Request Watchers ({request.watchers?.length || 0})
            </h3>

            {request.watchers && request.watchers.length > 0 ? (
              <div className="space-y-3">
                {request.watchers.map((watcher: any) => (
                  <div
                    key={watcher.user.id}
                    className="flex items-center justify-between gap-3.5 p-2 bg-slate-50/50 dark:bg-slate-950/20 border border-slate-200/50 dark:border-slate-800 rounded-xl"
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-550 dark:text-slate-350 flex items-center justify-center font-bold text-xs shrink-0">
                        {watcher.user.name
                          .split(" ")
                          .map((n: string) => n[0])
                          .join("")
                          .toUpperCase()
                          .slice(0, 2)}
                      </div>
                      <div className="space-y-0.5">
                        <h4 className="font-bold text-slate-805 dark:text-slate-100 text-xs">
                          {watcher.user.name}
                        </h4>
                        <p className="text-[10px] text-slate-400">
                          {watcher.user.role.replace("_", " ")}
                        </p>
                      </div>
                    </div>
                    {!isStudent && (
                      <button
                        type="button"
                        onClick={() => handleRemoveWatcher(watcher.user.id)}
                        className="p-1 text-slate-400 hover:text-red-500 rounded-lg hover:bg-red-50 dark:hover:bg-red-955/20 transition-colors cursor-pointer shrink-0"
                        title="Remove Watcher"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-slate-450 italic text-xs py-1 select-none">
                No watchers added to this request yet.
              </div>
            )}

            {/* Add Watcher */}
            {!isStudent && (
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
                  onClick={handleAddWatcherSubmit}
                  disabled={isSubmitting || !watcherSelectId}
                  className="px-2.5 h-8 bg-primary hover:bg-primary/95 text-white font-semibold text-[11px] rounded-lg transition-all active:scale-95 cursor-pointer disabled:opacity-50"
                >
                  Add
                </button>
              </div>
            )}
          </div>

          {/* Action Success / Error Messages for Staff controls */}
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

          {/* Card 4: Staff Resolution Panel (hidden for students) */}
          {!isStudent && (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-login-radius p-6 shadow-sm space-y-6">
              <h3 className="text-sm font-bold text-slate-950 dark:text-slate-50 uppercase tracking-wider border-b border-slate-100 dark:border-slate-800 pb-2">
                Administrative Resolution actions
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* 1. Status Update Form */}
                <form onSubmit={handleStatusSubmit} className="space-y-3">
                  <label
                    htmlFor="updateStatusSelect"
                    className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider"
                  >
                    Transition Ticket Status
                  </label>
                  <div className="flex gap-2">
                    <select
                      id="updateStatusSelect"
                      disabled={isSubmitting}
                      value={newStatus}
                      onChange={(e) => setNewStatus(e.target.value)}
                      className="flex-1 h-10 px-3 py-1.5 bg-slate-50/50 dark:bg-slate-955/50 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-800 dark:text-slate-200 text-xs focus:outline-none focus:border-primary transition-all disabled:opacity-50"
                    >
                      <option value="SUBMITTED">Pending (Submitted)</option>
                      <option value="ASSIGNED">Assigned</option>
                      <option value="UNDER_REVIEW">Under Review</option>
                      <option value="IN_PROGRESS">In Progress</option>
                      <option value="WAITING_FOR_STUDENT">
                        Waiting for Student
                      </option>
                      <option value="RESOLVED">Resolved</option>
                      <option value="REJECTED">Rejected</option>
                      <option value="CLOSED">Closed</option>
                    </select>

                    <button
                      type="submit"
                      disabled={isSubmitting || newStatus === request.status}
                      className="px-4 h-10 bg-primary hover:bg-primary/90 text-white font-semibold text-xs rounded-xl transition-all active:scale-95 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Update
                    </button>
                  </div>
                </form>

                {/* 2. Forward / Assignment Form */}
                {canAssign ? (
                  <form onSubmit={handleAssignSubmit} className="space-y-3">
                    <label
                      htmlFor="assignStaffSelect"
                      className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider"
                    >
                      Assign Handler
                    </label>
                    <div className="flex gap-2">
                      <select
                        id="assignStaffSelect"
                        disabled={isSubmitting}
                        value={assignedStaffId}
                        onChange={(e) => setAssignedStaffId(e.target.value)}
                        className="flex-1 h-10 px-3 py-1.5 bg-slate-50/50 dark:bg-slate-955/50 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-850 dark:text-slate-200 text-xs focus:outline-none focus:border-primary transition-all disabled:opacity-50"
                      >
                        <option value="" disabled>
                          Select Staff Member
                        </option>
                        {staffOptions.map((opt) => (
                          <option key={opt.id} value={opt.id}>
                            {opt.name} ({opt.role.replace("_", " ")})
                          </option>
                        ))}
                      </select>

                      <button
                        type="submit"
                        disabled={isSubmitting || !assignedStaffId}
                        className="px-4 h-10 bg-primary hover:bg-primary/95 text-white font-semibold text-xs rounded-xl transition-all active:scale-95 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Assign
                      </button>
                    </div>
                  </form>
                ) : (
                  isAssignedToMe && (
                    <form onSubmit={handleForwardSubmit} className="space-y-3">
                      <label
                        htmlFor="forwardStaffSelect"
                        className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider"
                      >
                        Forward Request (Self-Unassign & Watch)
                      </label>
                      <div className="flex gap-2">
                        <select
                          id="forwardStaffSelect"
                          disabled={isSubmitting}
                          value={forwardStaffId}
                          onChange={(e) => setForwardStaffId(e.target.value)}
                          className="flex-1 h-10 px-3 py-1.5 bg-slate-50/50 dark:bg-slate-955/50 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-850 dark:text-slate-200 text-xs focus:outline-none focus:border-primary transition-all disabled:opacity-50"
                        >
                          <option value="" disabled>
                            Select Staff Member
                          </option>
                          {staffOptions.map((opt) => (
                            <option key={opt.id} value={opt.id}>
                              {opt.name} ({opt.role.replace("_", " ")})
                            </option>
                          ))}
                        </select>

                        <button
                          type="submit"
                          disabled={isSubmitting || !forwardStaffId}
                          className="px-4 h-10 bg-amber-500 hover:bg-amber-600 text-white font-semibold text-xs rounded-xl transition-all active:scale-95 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Forward
                        </button>
                      </div>
                    </form>
                  )
                )}
              </div>

              {/* 3. Add Comments Action Form */}
              <form
                onSubmit={handleCommentSubmit}
                className="space-y-3 border-t border-slate-100 dark:border-slate-800 pt-4"
              >
                <label
                  htmlFor="commentTextarea"
                  className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider"
                >
                  Add Resolution Comment / Updates
                </label>

                <div className="relative group">
                  <textarea
                    id="commentTextarea"
                    required
                    disabled={isSubmitting}
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    placeholder="Write a response or update note..."
                    rows={3}
                    className="w-full pl-4 pr-12 py-3 bg-slate-50/50 dark:bg-slate-955/50 border border-slate-200 dark:border-slate-800 rounded-login-radius text-slate-850 dark:text-slate-200 placeholder-slate-455 text-xs focus:outline-none focus:border-primary transition-all resize-y disabled:opacity-50"
                  />

                  <button
                    type="submit"
                    disabled={isSubmitting || !commentText.trim()}
                    className="absolute bottom-3 right-3 p-2 bg-primary hover:bg-primary/95 text-white rounded-lg transition-all active:scale-95 cursor-pointer disabled:opacity-50"
                    title="Send comment"
                  >
                    {isSubmitting ? (
                      <Loader2 className="h-4.5 w-4.5 animate-spin" />
                    ) : (
                      <Send className="h-4.5 w-4.5" />
                    )}
                  </button>
                </div>

                <div className="flex items-center gap-2 select-none">
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
                    className="text-xs text-slate-550 dark:text-slate-300 font-semibold cursor-pointer flex items-center gap-1"
                  >
                    <Lock className="h-3 w-3 text-amber-500" />
                    <span>
                      Internal Comment (Staff Only - Hidden from Students)
                    </span>
                  </label>
                </div>
              </form>
            </div>
          )}

          {/* Action Comment form for students (if student, they can only write public comments/feedback notes!) */}
          {isStudent && (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-login-radius p-6 shadow-sm space-y-4">
              <h3 className="text-sm font-bold text-slate-950 dark:text-slate-50 uppercase tracking-wider border-b border-slate-100 dark:border-slate-800 pb-2">
                Write a Response Note
              </h3>

              <form onSubmit={handleCommentSubmit} className="space-y-3">
                <div className="relative group">
                  <textarea
                    required
                    disabled={isSubmitting}
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    placeholder="Provide additional details or response comments..."
                    rows={3}
                    className="w-full pl-4 pr-12 py-3 bg-slate-50/50 dark:bg-slate-955/50 border border-slate-200 dark:border-slate-800 rounded-login-radius text-slate-850 dark:text-slate-200 placeholder-slate-455 text-xs focus:outline-none focus:border-primary transition-all resize-y disabled:opacity-50"
                  />

                  <button
                    type="submit"
                    disabled={isSubmitting || !commentText.trim()}
                    className="absolute bottom-3 right-3 p-2 bg-primary hover:bg-primary/95 text-white rounded-lg transition-all active:scale-95 cursor-pointer disabled:opacity-50"
                  >
                    {isSubmitting ? (
                      <Loader2 className="h-4.5 w-4.5 animate-spin" />
                    ) : (
                      <Send className="h-4.5 w-4.5" />
                    )}
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>

        {/* Right Column: Chronological Timeline (2/5 Width) */}
        <div className="lg:col-span-2 space-y-login-gap">
          <TimeLine timelineItems={timelineItems} />
        </div>
      </div>
    </div>
  );
}
