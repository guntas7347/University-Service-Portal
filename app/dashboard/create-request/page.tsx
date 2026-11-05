"use client";

import React, { useState, useEffect, FormEvent } from "react";
import Link from "next/link";
import {
  PlusCircle,
  Loader2,
  CheckCircle2,
  AlertCircle,
  FileText,
  AlertTriangle,
  ArrowRight,
  Bookmark,
  Landmark,
  FolderOpen,
  User,
  Users,
  X,
} from "lucide-react";
import { useForm } from "@/hooks/useForm";
import { getCategories } from "@/lib/actions/categories";
import { getDepartments } from "@/lib/actions/departments";
import { getStaffUsers } from "@/lib/actions/staff";
import { createRequest } from "@/lib/actions/requests";
import { SelectStaffModal } from "@/components/dashboard/SelectStaffModal";

export interface StaffOption {
  id: string;
  name: string;
  email: string;
  role: string;
  designation?: string;
  departmentId?: string;
  departmentName?: string;
  mobile?: string;
  photo?: string;
}

interface CategoryOption {
  id: string;
  name: string;
  description: string | null;
}

interface DepartmentOption {
  id: string;
  code: string;
  name: string;
  hodName: string;
}

export default function CreateRequestPage() {
  const [categories, setCategories] = useState<CategoryOption[]>([]);
  const [departments, setDepartments] = useState<DepartmentOption[]>([]);
  const [staffList, setStaffList] = useState<StaffOption[]>([]);

  // Selection states
  const [selectedWatchers, setSelectedWatchers] = useState<string[]>([]);
  const [isStaffModalOpen, setIsStaffModalOpen] = useState(false);
  const [isWatcherModalOpen, setIsWatcherModalOpen] = useState(false);

  const [isDataLoading, setIsDataLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAnonymous, setIsAnonymous] = useState(false);

  // Result states
  const [ticketId, setTicketId] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const { form, handleChange, setFields, resetFormFields } = useForm({
    type: "COMPLAINT",
    raiseMode: "CATEGORY",
    categoryId: "",
    departmentId: "",
    assignedUserId: "",
    subject: "",
    description: "",
    priority: "MEDIUM",
  });

  useEffect(() => {
    const fetchDependencies = async () => {
      setIsDataLoading(true);
      const [catRes, deptRes, staffRes] = await Promise.all([
        getCategories(),
        getDepartments(),
        getStaffUsers(),
      ]);

      if (catRes.success && catRes.categories) {
        setCategories(catRes.categories);
        if (catRes.categories.length > 0) {
          setFields({ categoryId: catRes.categories[0].id });
        }
      }
      if (deptRes.success && deptRes.departments) {
        setDepartments(deptRes.departments as DepartmentOption[]);
      }
      if (staffRes.success && staffRes.staff) {
        setStaffList(staffRes.staff as StaffOption[]);
      }
      setIsDataLoading(false);
    };
    fetchDependencies();
  }, [setFields]);

  // Derived faculty list for the currently selected department
  const departmentFaculty = staffList.filter(
    (s) => s.departmentId === form.departmentId,
  );

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSuccessMsg(null);
    setErrorMsg(null);

    if (form.raiseMode === "CATEGORY" && !form.categoryId) {
      setErrorMsg("Please select a grievance category.");
      return;
    }
    if (form.raiseMode === "DEPARTMENT" && !form.departmentId) {
      setErrorMsg("Please select a target department.");
      return;
    }
    if (!form.subject.trim() || form.description.trim().length < 15) {
      setErrorMsg(
        "Subject and a detailed description (min 15 chars) are required.",
      );
      return;
    }

    setIsSubmitting(true);

    const assignedUserIds =
      form.raiseMode === "DEPARTMENT" && form.assignedUserId
        ? [form.assignedUserId]
        : [];

    try {
      const response = await createRequest({
        type: form.type,
        raiseMode: form.raiseMode as any,
        categoryId: form.raiseMode === "CATEGORY" ? form.categoryId : undefined,
        departmentId:
          form.raiseMode === "DEPARTMENT" ? form.departmentId : undefined,
        assignedUserIds,
        watcherUserIds: selectedWatchers,
        subject: form.subject,
        description: form.description,
        priority: form.priority,
        isAnonymous,
      });

      if (response.success && response.ticketId) {
        setSuccessMsg(response.message);
        setTicketId(response.ticketId);
        window.scrollTo({ top: 0, behavior: "smooth" });
      } else {
        setErrorMsg(response.message);
      }
    } catch (err) {
      setErrorMsg("An unexpected error occurred. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetForm = () => {
    setTicketId(null);
    setSuccessMsg(null);
    setErrorMsg(null);
    setSelectedWatchers([]);
    resetFormFields();
    setFields({
      type: "COMPLAINT",
      raiseMode: "CATEGORY",
      categoryId: categories.length > 0 ? categories[0].id : "",
      priority: "MEDIUM",
    });
  };

  // Render assigned user display for department mode
  const selectedFaculty = staffList.find((s) => s.id === form.assignedUserId);

  if (isDataLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3">
        <Loader2 className="h-8 w-8 text-primary animate-spin" />
        <p className="text-sm text-slate-500 font-medium">
          Loading form dependencies...
        </p>
      </div>
    );
  }

  // Success State
  if (ticketId && successMsg) {
    return (
      <div className="max-w-xl mx-auto space-y-6 pt-10">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 shadow-sm text-center flex flex-col items-center space-y-5 animate-in zoom-in-95 duration-300">
          <div className="p-4 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 rounded-full">
            <CheckCircle2 className="h-12 w-12" />
          </div>
          <div className="space-y-2">
            <h2 className="text-xl font-extrabold text-slate-900 dark:text-slate-50">
              {successMsg}
            </h2>
            <p className="text-sm text-slate-500 max-w-sm mx-auto">
              Your ticket has been logged into the university redressal cells.
              Use this tracking ID for official references.
            </p>
          </div>
          <div className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl py-5 px-6">
            <span className="text-xs text-slate-500 font-bold uppercase tracking-wider block mb-1">
              Public Ticket ID
            </span>
            <span className="text-2xl font-mono font-extrabold text-primary select-all">
              {ticketId}
            </span>
          </div>
          <div className="w-full pt-4 flex gap-3">
            <button
              onClick={handleResetForm}
              className="flex-1 h-11 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold rounded-xl text-sm transition-colors hover:bg-slate-200 dark:hover:bg-slate-700"
            >
              File Another
            </button>
            <Link
              href="/dashboard"
              className="flex-1 h-11 bg-primary text-white font-semibold rounded-xl text-sm flex items-center justify-center gap-1.5 transition-colors hover:bg-primary/90"
            >
              <span>Dashboard</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-12">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 dark:text-slate-50 tracking-tight">
          File a Request
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Submit official complaints, inquiries, or feedback to administration
          departments
        </p>
      </div>

      {categories.length === 0 && departments.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-10 text-center space-y-4">
          <AlertTriangle className="h-10 w-10 text-amber-500 mx-auto" />
          <h3 className="font-bold text-slate-800 dark:text-slate-200">
            System Not Ready
          </h3>
          <p className="text-sm text-slate-500">
            Categories and Departments must be configured before requests can be
            filed.
          </p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6">
          {errorMsg && (
            <div className="flex items-start gap-2.5 p-4 bg-red-50 dark:bg-red-955/20 border border-red-200 dark:border-red-800/30 rounded-xl text-red-800 dark:text-red-300 text-sm animate-in fade-in">
              <AlertCircle className="h-5 w-5 shrink-0 text-red-500" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* SECTION 1: Classification & Target */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-50 uppercase tracking-wider border-b border-slate-100 dark:border-slate-800 pb-3">
              1. Classification
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-2">
                  Request Type
                </label>
                <select
                  name="type"
                  required
                  value={form.type}
                  onChange={handleChange}
                  className="w-full h-11 px-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:border-primary outline-none"
                >
                  <option value="COMPLAINT">Complaint</option>
                  <option value="GRIEVANCE">Grievance</option>
                  <option value="SERVICE_REQUEST">Service Request</option>
                  <option value="INQUIRY">Inquiry</option>
                  <option value="SUGGESTION">Suggestion</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-2">
                  Priority
                </label>
                <select
                  name="priority"
                  required
                  value={form.priority}
                  onChange={handleChange}
                  className="w-full h-11 px-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:border-primary outline-none"
                >
                  <option value="LOW">Low</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="HIGH">High</option>
                  <option value="URGENT">Urgent</option>
                </select>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-2">
                  Filing Mode
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <label
                    className={`flex items-center gap-3 p-4 border rounded-xl cursor-pointer transition-all ${form.raiseMode === "CATEGORY" ? "border-primary bg-primary/5" : "border-slate-200 hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800/50"}`}
                  >
                    <input
                      type="radio"
                      name="raiseMode"
                      value="CATEGORY"
                      checked={form.raiseMode === "CATEGORY"}
                      onChange={handleChange}
                      className="h-4 w-4 text-primary"
                    />
                    <div className="flex flex-col">
                      <span className="text-sm font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                        <FolderOpen className="h-4 w-4 text-primary" /> By
                        Category
                      </span>
                      <span className="text-xs text-slate-500 mt-0.5">
                        Auto-routes to correct staff
                      </span>
                    </div>
                  </label>
                  <label
                    className={`flex items-center gap-3 p-4 border rounded-xl cursor-pointer transition-all ${form.raiseMode === "DEPARTMENT" ? "border-primary bg-primary/5" : "border-slate-200 hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800/50"}`}
                  >
                    <input
                      type="radio"
                      name="raiseMode"
                      value="DEPARTMENT"
                      checked={form.raiseMode === "DEPARTMENT"}
                      onChange={handleChange}
                      className="h-4 w-4 text-primary"
                    />
                    <div className="flex flex-col">
                      <span className="text-sm font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                        <Landmark className="h-4 w-4 text-primary" /> By
                        Department
                      </span>
                      <span className="text-xs text-slate-500 mt-0.5">
                        Send directly to department
                      </span>
                    </div>
                  </label>
                </div>
              </div>

              {/* Dynamic Target Selection */}
              {form.raiseMode === "CATEGORY" ? (
                <div className="sm:col-span-2 animate-in fade-in slide-in-from-top-2">
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-2">
                    Select Category
                  </label>
                  <select
                    name="categoryId"
                    required
                    value={form.categoryId}
                    onChange={handleChange}
                    className="w-full h-11 px-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:border-primary outline-none"
                  >
                    <option value="">Choose category...</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <div className="sm:col-span-2 space-y-5 animate-in fade-in slide-in-from-top-2">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-2">
                      Select Department
                    </label>
                    <select
                      name="departmentId"
                      required
                      value={form.departmentId}
                      onChange={(e) => {
                        handleChange(e);
                        setFields({ assignedUserId: "" });
                      }}
                      className="w-full h-11 px-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:border-primary outline-none"
                    >
                      <option value="">Choose department...</option>
                      {departments.map((d) => (
                        <option key={d.id} value={d.id}>
                          {d.name} ({d.code})
                        </option>
                      ))}
                    </select>
                  </div>

                  {form.departmentId && (
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-2 flex justify-between">
                        <span>Direct Handler (Optional)</span>
                        <span className="text-primary font-normal">
                          Defaults to HOD if empty
                        </span>
                      </label>
                      <div
                        onClick={() => setIsStaffModalOpen(true)}
                        className="w-full h-11 px-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm flex items-center justify-between cursor-pointer hover:border-primary transition-colors"
                      >
                        {selectedFaculty ? (
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4 text-slate-400" />
                            <span className="font-medium text-slate-800 dark:text-slate-200">
                              {selectedFaculty.name}
                            </span>
                            <span className="text-xs text-slate-500">
                              ({selectedFaculty.designation || "Employee"})
                            </span>
                          </div>
                        ) : (
                          <span className="text-slate-400">
                            Click to assign specific faculty member...
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* SECTION 2: Details */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-sm space-y-5">
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-50 uppercase tracking-wider border-b border-slate-100 dark:border-slate-800 pb-3">
              2. Details
            </h3>

            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-2">
                Subject
              </label>
              <div className="relative">
                <Bookmark className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  name="subject"
                  required
                  value={form.subject}
                  onChange={handleChange}
                  placeholder="Brief summary of issue..."
                  className="w-full h-11 pl-11 pr-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:border-primary outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-2">
                Description (Attachment can be added after submission)
              </label>
              <div className="relative">
                <FileText className="absolute left-4 top-4 h-4 w-4 text-slate-400" />
                <textarea
                  name="description"
                  required
                  value={form.description}
                  onChange={handleChange}
                  placeholder="Provide detailed context..."
                  rows={6}
                  className="w-full pl-11 pr-4 py-3 bg-slate-50 dark:bg-slate-955/50 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:border-primary outline-none resize-y"
                />
              </div>
            </div>
          </div>

          {/* SECTION 3: Watchers (Optional) */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-sm space-y-5">
            <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3 mb-2">
              <Users className="h-4 w-4 text-primary" />
              <h3 className="text-xs font-bold text-slate-900 dark:text-slate-50 uppercase tracking-wider">
                3. Watchers (Optional)
              </h3>
            </div>

            <p className="text-xs text-slate-500 dark:text-slate-400">
              Add faculty or staff members who should receive notifications and
              track this request's progress.
            </p>

            <div className="space-y-4">
              {/* Selected Watchers Chips */}
              {selectedWatchers.length > 0 && (
                <div className="flex flex-wrap gap-2.5">
                  {selectedWatchers.map((watcherId) => {
                    const watcher = staffList.find((s) => s.id === watcherId);
                    if (!watcher) return null;
                    return (
                      <div
                        key={watcherId}
                        className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm animate-in zoom-in-95"
                      >
                        <User className="h-3.5 w-3.5 text-slate-400" />
                        <span className="font-medium text-slate-700 dark:text-slate-300">
                          {watcher.name}
                        </span>
                        <button
                          type="button"
                          onClick={() =>
                            setSelectedWatchers((prev) =>
                              prev.filter((id) => id !== watcherId),
                            )
                          }
                          className="ml-1 p-0.5 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-md transition-colors cursor-pointer"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Add Watcher Trigger */}
              <button
                type="button"
                onClick={() => setIsWatcherModalOpen(true)}
                className="h-11 px-5 bg-slate-50 dark:bg-slate-950 border border-dashed border-slate-300 dark:border-slate-700 hover:border-primary dark:hover:border-primary hover:text-primary rounded-xl text-sm flex items-center justify-center gap-2 text-slate-600 dark:text-slate-400 transition-colors cursor-pointer w-full sm:w-auto"
              >
                <PlusCircle className="h-4 w-4" />
                <span className="font-medium">Add Watcher</span>
              </button>
            </div>
          </div>

          {/* Action Footer */}
          <div className="flex justify-end gap-3 pt-2">
            <Link
              href="/dashboard"
              className="px-6 h-12 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold rounded-xl text-sm flex items-center transition-colors hover:bg-slate-200 dark:hover:bg-slate-700"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-8 h-12 bg-primary text-white font-bold rounded-xl text-sm flex items-center gap-2 transition-all hover:bg-primary/90 shadow-lg shadow-primary/20 disabled:opacity-70"
            >
              {isSubmitting ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <PlusCircle className="h-5 w-5" />
              )}
              <span>Submit Request</span>
            </button>
          </div>
        </form>
      )}

      {/* Staff Selection Modal */}
      {isStaffModalOpen && (
        <SelectStaffModal
          isOpen={isStaffModalOpen}
          onClose={() => setIsStaffModalOpen(false)}
          staffOptions={departmentFaculty} // Pass only the faculty of the selected department
          selectedStaffId={form.assignedUserId}
          onSelectStaff={(id) => {
            setFields({ assignedUserId: id });
            setIsStaffModalOpen(false);
          }}
          title="Assign Request to Employee"
          description="Select a specific faculty member from this department to handle this request directly. If you skip this, it will automatically route to the Head of Department."
        />
      )}

      {/* Watcher Selection Modal */}
      {isWatcherModalOpen && (
        <SelectStaffModal
          isOpen={isWatcherModalOpen}
          onClose={() => setIsWatcherModalOpen(false)}
          // Filter out people who are already watchers OR who are already assigned as the primary handler
          staffOptions={staffList.filter(
            (s) =>
              !selectedWatchers.includes(s.id) && s.id !== form.assignedUserId,
          )}
          onSelectStaff={(id) => {
            setSelectedWatchers((prev) => [...prev, id]);
            setIsWatcherModalOpen(false);
          }}
          title="Add Request Watcher"
          description="Search and select a faculty or staff member to keep them updated on this request's progress."
        />
      )}
    </div>
  );
}
