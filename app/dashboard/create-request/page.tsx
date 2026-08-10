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
  EyeOff,
  Eye,
  Bookmark,
  Landmark,
  FolderOpen,
  User,
  Users
} from "lucide-react";
import { useForm } from "@/hooks/useForm";
import { getCategories } from "@/lib/prisma/actions/categories";
import { getDepartments } from "@/lib/prisma/actions/departments";
import { getStaffUsers } from "@/lib/prisma/actions/staff";
import { createRequest } from "@/lib/prisma/actions/requests";

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

interface StaffOption {
  id: string;
  name: string;
  email: string;
  role: string;
  designation: string;
  departmentId: string;
}

export default function CreateRequestPage() {
  const [categories, setCategories] = useState<CategoryOption[]>([]);
  const [departments, setDepartments] = useState<DepartmentOption[]>([]);
  const [staffList, setStaffList] = useState<StaffOption[]>([]);
  const [selectedWatchers, setSelectedWatchers] = useState<string[]>([]);

  const [isDataLoading, setIsDataLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAnonymous, setIsAnonymous] = useState(false);
  
  // Submission result states
  const [ticketId, setTicketId] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Form management hook
  const { form, handleChange, setFields, resetFormFields } = useForm({
    type: "COMPLAINT",
    raiseMode: "CATEGORY", // "CATEGORY" | "DEPARTMENT"
    categoryId: "",
    departmentId: "",
    assignedUserId: "", // Empty or "HOD" defaults to HOD, otherwise specific faculty ID
    subject: "",
    description: "",
    priority: "MEDIUM"
  });

  // Load all dependencies on mount
  useEffect(() => {
    const fetchDependencies = async () => {
      setIsDataLoading(true);
      const [catRes, deptRes, staffRes] = await Promise.all([
        getCategories(),
        getDepartments(),
        getStaffUsers()
      ]);

      if (catRes.success && catRes.categories) {
        setCategories(catRes.categories);
        if (catRes.categories.length > 0) {
          setFields({
            type: "COMPLAINT",
            raiseMode: "CATEGORY",
            categoryId: catRes.categories[0].id,
            departmentId: "",
            assignedUserId: "",
            subject: "",
            description: "",
            priority: "MEDIUM"
          });
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

  // Submit action handler
  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSuccessMsg(null);
    setErrorMsg(null);

    if (form.raiseMode === "CATEGORY" && !form.categoryId) {
      setErrorMsg("Please select a grievance category classification.");
      return;
    }
    if (form.raiseMode === "DEPARTMENT" && !form.departmentId) {
      setErrorMsg("Please select a target university department.");
      return;
    }
    if (!form.subject.trim()) {
      setErrorMsg("A short subject heading is required.");
      return;
    }
    if (form.description.trim().length < 15) {
      setErrorMsg("Please write a detailed description of the issue (minimum 15 characters).");
      return;
    }

    setIsSubmitting(true);

    const assignedUserIds = form.raiseMode === "DEPARTMENT" && form.assignedUserId && form.assignedUserId !== "HOD"
      ? [form.assignedUserId]
      : [];

    try {
      const response = await createRequest({
        type: form.type,
        raiseMode: form.raiseMode as any,
        categoryId: form.raiseMode === "CATEGORY" ? form.categoryId : undefined,
        departmentId: form.raiseMode === "DEPARTMENT" ? form.departmentId : undefined,
        assignedUserIds,
        watcherUserIds: selectedWatchers,
        subject: form.subject,
        description: form.description,
        priority: form.priority,
        isAnonymous
      });

      if (response.success && response.ticketId) {
        setSuccessMsg(response.message);
        setTicketId(response.ticketId);
        resetFormFields();
        setIsAnonymous(false);
        setSelectedWatchers([]);
      } else {
        setErrorMsg(response.message);
      }
    } catch (err) {
      setErrorMsg("An unexpected error occurred during submission. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Switch form back to clean state
  const handleResetForm = () => {
    setTicketId(null);
    setSuccessMsg(null);
    setErrorMsg(null);
    setSelectedWatchers([]);
    setFields({
      type: "COMPLAINT",
      raiseMode: "CATEGORY",
      categoryId: categories.length > 0 ? categories[0].id : "",
      departmentId: "",
      assignedUserId: "",
      subject: "",
      description: "",
      priority: "MEDIUM"
    });
  };

  // Filter staff to selected department (for direct assignee selection)
  const departmentFaculty = staffList.filter(s => s.departmentId === form.departmentId);

  // 1. Loading active category tracks
  if (isDataLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3">
        <Loader2 className="h-8 w-8 text-primary animate-spin" />
        <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">Loading form dependencies...</p>
      </div>
    );
  }

  // 2. Success state layout (displays generated Ticket tracking ID card)
  if (ticketId && successMsg) {
    return (
      <div className="max-w-xl mx-auto space-y-6">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-login-radius p-8 shadow-sm text-center flex flex-col items-center space-y-5">
          <div className="p-3 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 rounded-full border border-emerald-100 dark:border-emerald-900/30">
            <CheckCircle2 className="h-12 w-12" />
          </div>

          <div className="space-y-2">
            <h2 className="text-xl font-extrabold text-slate-900 dark:text-slate-50">
              {successMsg}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm">
              Your ticket has been logged into the university redressal cells. Use this tracking ID for official references:
            </p>
          </div>

          {/* Ticket ID display card */}
          <div className="w-full bg-slate-50 dark:bg-slate-955 border border-slate-200 dark:border-slate-800 rounded-login-radius py-4 px-6 select-all cursor-pointer group hover:border-primary transition-colors">
            <span className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider block mb-1">
              Public Ticket ID
            </span>
            <span className="text-lg font-mono font-extrabold text-primary group-hover:scale-105 transition-transform block">
              {ticketId}
            </span>
          </div>

          <div className="w-full pt-4 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row gap-2">
            <button
              type="button"
              onClick={handleResetForm}
              className="flex-1 h-11 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-350 font-semibold rounded-login-radius text-sm transition-all active:scale-[0.98] cursor-pointer"
            >
              File Another Request
            </button>
            <Link
              href="/dashboard"
              className="flex-1 h-11 bg-primary hover:bg-primary/95 text-white font-semibold rounded-login-radius text-sm flex items-center justify-center gap-1.5 transition-all active:scale-[0.98] cursor-pointer shadow-md shadow-primary/10"
            >
              <span>Back to Dashboard</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      
      {/* Title Header */}
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 dark:text-slate-50 tracking-tight">
          File a Request
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Submit official complaints, inquiries, or feedback to administration departments
        </p>
      </div>

      {/* Main card wrapper */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-login-radius p-6 md:p-8 shadow-sm">
        
        {categories.length === 0 && departments.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center space-y-4">
            <AlertTriangle className="h-10 w-10 text-amber-500" />
            <div className="space-y-1">
              <h3 className="font-bold text-slate-800 dark:text-slate-200 text-sm">
                No Categories or Departments
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm leading-relaxed">
                Before filing a request, categories or departments must be configured in the portal dashboard.
              </p>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            
            {/* Feedback Alerts */}
            {errorMsg && (
              <div className="mb-4 flex items-start gap-2.5 p-3 bg-red-50 dark:bg-red-955/20 border border-red-200 dark:border-red-800/30 rounded-xl text-red-800 dark:text-red-300 text-xs">
                <AlertCircle className="h-4.5 w-4.5 shrink-0 text-red-650 dark:text-red-400 mt-0.5" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Split Form Elements */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-login-gap">
              
              {/* Request Type Selection */}
              <div>
                <label htmlFor="type" className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-2">
                  Request Type Classification
                </label>
                <select
                  id="type"
                  name="type"
                  required
                  disabled={isSubmitting}
                  value={form.type}
                  onChange={handleChange}
                  className="w-full h-11 px-4 py-2 bg-slate-50/50 dark:bg-slate-955/50 border border-slate-200 dark:border-slate-800 rounded-login-radius text-slate-850 dark:text-slate-200 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all disabled:opacity-50"
                >
                  <option value="COMPLAINT">Complaint</option>
                  <option value="GRIEVANCE">Grievance</option>
                  <option value="SERVICE_REQUEST">Service Request</option>
                  <option value="INQUIRY">Inquiry</option>
                  <option value="SUGGESTION">Suggestion</option>
                  <option value="APPEAL">Appeal</option>
                </select>
              </div>

              {/* Priority Select */}
              <div>
                <label htmlFor="priority" className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-2">
                  Priority Urgency
                </label>
                <select
                  id="priority"
                  name="priority"
                  required
                  disabled={isSubmitting}
                  value={form.priority}
                  onChange={handleChange}
                  className="w-full h-11 px-4 py-2 bg-slate-50/50 dark:bg-slate-955/50 border border-slate-200 dark:border-slate-800 rounded-login-radius text-slate-850 dark:text-slate-200 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all disabled:opacity-50"
                >
                  <option value="LOW">Low</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="HIGH">High</option>
                  <option value="URGENT">Urgent</option>
                </select>
              </div>

              {/* Raise Mode selector */}
              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-2.5">
                  Filing Option (Grievance Target)
                </label>
                <div className="grid grid-cols-2 gap-3.5">
                  <label className={`flex items-center gap-3 p-3.5 border rounded-xl cursor-pointer transition-all select-none ${
                    form.raiseMode === "CATEGORY" 
                      ? "border-primary bg-primary/5 dark:bg-primary/5" 
                      : "border-slate-200 dark:border-slate-800 hover:bg-slate-50/50 dark:hover:bg-slate-950/20"
                  }`}>
                    <input 
                      type="radio" 
                      name="raiseMode" 
                      value="CATEGORY"
                      checked={form.raiseMode === "CATEGORY"}
                      onChange={handleChange}
                      className="h-4 w-4 text-primary focus:ring-primary border-slate-300 dark:border-slate-800 cursor-pointer"
                    />
                    <div className="flex flex-col">
                      <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                        <FolderOpen className="h-3.5 w-3.5 text-primary shrink-0" />
                        Raise by Category
                      </span>
                      <span className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">Auto-route assign based on rules</span>
                    </div>
                  </label>

                  <label className={`flex items-center gap-3 p-3.5 border rounded-xl cursor-pointer transition-all select-none ${
                    form.raiseMode === "DEPARTMENT" 
                      ? "border-primary bg-primary/5 dark:bg-primary/5" 
                      : "border-slate-200 dark:border-slate-800 hover:bg-slate-50/50 dark:hover:bg-slate-950/20"
                  }`}>
                    <input 
                      type="radio" 
                      name="raiseMode" 
                      value="DEPARTMENT"
                      checked={form.raiseMode === "DEPARTMENT"}
                      onChange={handleChange}
                      className="h-4 w-4 text-primary focus:ring-primary border-slate-300 dark:border-slate-800 cursor-pointer"
                    />
                    <div className="flex flex-col">
                      <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                        <Landmark className="h-3.5 w-3.5 text-primary shrink-0" />
                        Raise by Department
                      </span>
                      <span className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">Assign directly to HOD or Faculty</span>
                    </div>
                  </label>
                </div>
              </div>

              {/* Category Dropdown Selection */}
              {form.raiseMode === "CATEGORY" && (
                <div className="md:col-span-2">
                  <label htmlFor="categoryId" className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-2">
                    Grievance Category classification
                  </label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                      <FolderOpen className="h-4 w-4 text-slate-400" />
                    </div>
                    <select
                      id="categoryId"
                      name="categoryId"
                      required={form.raiseMode === "CATEGORY"}
                      disabled={isSubmitting}
                      value={form.categoryId}
                      onChange={handleChange}
                      className="w-full h-11 pl-10 pr-4 py-2 bg-slate-50/50 dark:bg-slate-955/50 border border-slate-200 dark:border-slate-800 rounded-login-radius text-slate-850 dark:text-slate-200 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all disabled:opacity-50"
                    >
                      <option value="">Select Category</option>
                      {categories.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              )}

              {/* Department Dropdown Selection */}
              {form.raiseMode === "DEPARTMENT" && (
                <>
                  <div>
                    <label htmlFor="departmentId" className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-2">
                      Target Department / Office
                    </label>
                    <div className="relative group">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                        <Landmark className="h-4 w-4 text-slate-400" />
                      </div>
                      <select
                        id="departmentId"
                        name="departmentId"
                        required={form.raiseMode === "DEPARTMENT"}
                        disabled={isSubmitting}
                        value={form.departmentId}
                        onChange={handleChange}
                        className="w-full h-11 pl-10 pr-4 py-2 bg-slate-50/50 dark:bg-slate-955/50 border border-slate-200 dark:border-slate-800 rounded-login-radius text-slate-850 dark:text-slate-200 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all disabled:opacity-50"
                      >
                        <option value="">Select Department</option>
                        {departments.map((d) => (
                          <option key={d.id} value={d.id}>
                            {d.name} ({d.code})
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label htmlFor="assignedUserId" className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-2">
                      Assign Handlers
                    </label>
                    <div className="relative group">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                        <User className="h-4 w-4 text-slate-400" />
                      </div>
                      <select
                        id="assignedUserId"
                        name="assignedUserId"
                        disabled={isSubmitting || !form.departmentId}
                        value={form.assignedUserId}
                        onChange={handleChange}
                        className="w-full h-11 pl-10 pr-4 py-2 bg-slate-50/50 dark:bg-slate-955/50 border border-slate-200 dark:border-slate-800 rounded-login-radius text-slate-850 dark:text-slate-200 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all disabled:opacity-50"
                      >
                        <option value="">Faculty Default HOD (Auto)</option>
                        {departmentFaculty.map((f) => (
                          <option key={f.id} value={f.id}>
                            {f.name} {f.designation ? `(${f.designation})` : `(Faculty)`}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </>
              )}

            </div>

            {/* Subject heading */}
            <div>
              <label htmlFor="subject" className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-2">
                Subject Heading
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <Bookmark className="h-4 w-4 text-slate-400 group-focus-within:text-primary transition-colors" />
                </div>
                <input
                  type="text"
                  id="subject"
                  name="subject"
                  required
                  disabled={isSubmitting}
                  value={form.subject}
                  onChange={handleChange}
                  placeholder="e.g. Wifi issue in Room 101"
                  className="w-full h-11 pl-10 pr-4 py-2 bg-slate-50/50 dark:bg-slate-955/50 border border-slate-200 dark:border-slate-800 rounded-login-radius text-slate-850 dark:text-slate-200 placeholder-slate-450 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all disabled:opacity-50"
                />
              </div>
            </div>

            {/* Description textarea */}
            <div>
              <label htmlFor="description" className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-2">
                Grievance Description Detail
              </label>
              <div className="relative group">
                <div className="absolute top-3 left-3 pointer-events-none">
                  <FileText className="h-4 w-4 text-slate-400 group-focus-within:text-primary transition-colors" />
                </div>
                <textarea
                  id="description"
                  name="description"
                  required
                  disabled={isSubmitting}
                  value={form.description}
                  onChange={handleChange}
                  placeholder="Provide comprehensive details about the issue. Mention specific dates, locations, or code courses to speed up resolution tracks..."
                  rows={6}
                  className="w-full pl-10 pr-4 py-3 bg-slate-50/50 dark:bg-slate-955/50 border border-slate-200 dark:border-slate-800 rounded-login-radius text-slate-850 dark:text-slate-200 placeholder-slate-450 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all disabled:opacity-50 resize-y"
                />
              </div>
            </div>

            {/* Add Request Watchers */}
            {staffList.length > 0 && (
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-400">
                  Request Watchers (Optional)
                </label>
                <div className="bg-slate-50/50 dark:bg-slate-955/20 border border-slate-200 dark:border-slate-800 rounded-login-radius p-3 max-h-36 overflow-y-auto space-y-2">
                  {staffList.map((s) => (
                    <div key={s.id} className="flex items-center gap-2">
                      <input
                        id={`watcher-${s.id}`}
                        type="checkbox"
                        checked={selectedWatchers.includes(s.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedWatchers(prev => [...prev, s.id]);
                          } else {
                            setSelectedWatchers(prev => prev.filter(id => id !== s.id));
                          }
                        }}
                        className="h-3.5 w-3.5 text-primary border-slate-350 dark:border-slate-850 rounded cursor-pointer focus:ring-primary"
                      />
                      <label htmlFor={`watcher-${s.id}`} className="text-xs text-slate-705 dark:text-slate-300 font-medium cursor-pointer select-none">
                        {s.name} {s.designation ? `(${s.designation})` : `(${s.role.replace("_", " ")})`}
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Checkbox: Anonymous Reporting */}
            <div className="bg-slate-50/50 dark:bg-slate-955/30 border border-slate-200/60 dark:border-slate-850 rounded-login-radius p-4 flex items-start gap-3.5 select-none transition-colors">
              <div className="flex items-center h-5">
                <input
                  id="isAnonymous"
                  type="checkbox"
                  disabled={isSubmitting}
                  checked={isAnonymous}
                  onChange={(e) => setIsAnonymous(e.target.checked)}
                  className="h-4 w-4 text-primary focus:ring-primary border-slate-300 dark:border-slate-800 rounded cursor-pointer"
                />
              </div>
              <div className="space-y-0.5">
                <label htmlFor="isAnonymous" className="block text-xs font-bold text-slate-800 dark:text-slate-250 cursor-pointer flex items-center gap-1">
                  <span>File Anonymously</span>
                  {isAnonymous ? (
                    <EyeOff className="h-3.5 w-3.5 text-amber-500" />
                  ) : (
                    <Eye className="h-3.5 w-3.5 text-slate-400" />
                  )}
                </label>
                <p className="text-[10px] text-slate-500 dark:text-slate-450 leading-relaxed">
                  Your identity details will be masked from administrators. Only your public ticket ID will be displayed.
                </p>
              </div>
            </div>

            {/* Form actions */}
            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-2">
              <Link
                href="/dashboard"
                className="px-5 h-11 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold rounded-login-radius text-sm flex items-center justify-center transition-all active:scale-[0.98] cursor-pointer"
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-6 h-11 bg-primary hover:bg-primary/95 text-white font-semibold rounded-login-radius text-sm flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-50 shadow-md shadow-primary/10 cursor-pointer"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Submitting Request...</span>
                  </>
                ) : (
                  <>
                    <span>Submit Complaint</span>
                    <PlusCircle className="h-4 w-4" />
                  </>
                )}
              </button>
            </div>

          </form>
        )}

      </div>

    </div>
  );
}
