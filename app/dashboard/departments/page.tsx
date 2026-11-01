"use client";

import React, { useState, useEffect, FormEvent, KeyboardEvent } from "react";
import {
  Landmark,
  Plus,
  Edit,
  Trash2,
  Loader2,
  CheckCircle2,
  AlertCircle,
  FileText,
  X,
  User,
  GraduationCap,
  ShieldCheck,
  Tag,
} from "lucide-react";
import {
  getDepartments,
  createDepartment,
  updateDepartment,
  deleteDepartment,
} from "@/lib/actions/departments";
import { getStaffUsers } from "@/lib/actions/staff";

interface DepartmentType {
  id: string;
  name: string;
  hodId: string;
  hodName: string;
  specializations: string[];
}

interface StaffUserOption {
  id: string;
  name: string;
  email: string;
  role: string;
  designation: string;
  departmentId: string;
}

export default function DepartmentsPage() {
  const [departments, setDepartments] = useState<DepartmentType[]>([]);
  const [staffUsers, setStaffUsers] = useState<StaffUserOption[]>([]);
  const [isPageLoading, setIsPageLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form states
  const [name, setName] = useState("");
  const [hodId, setHodId] = useState("");
  const [specializations, setSpecializations] = useState<string[]>([]);
  const [specInput, setSpecInput] = useState("");

  // Feedback states
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Fetch departments and staff users on load
  const loadInitialData = async () => {
    setIsPageLoading(true);
    try {
      const [deptRes, staffRes] = await Promise.all([
        getDepartments(),
        getStaffUsers(),
      ]);

      if (deptRes.success && deptRes.departments) {
        setDepartments(deptRes.departments as DepartmentType[]);
      }
      if (staffRes.success && staffRes.staff) {
        setStaffUsers(staffRes.staff as StaffUserOption[]);
      }
    } catch (err) {
      console.error("Failed to load department management data:", err);
    } finally {
      setIsPageLoading(false);
    }
  };

  useEffect(() => {
    loadInitialData();
  }, []);

  // Handle adding a specialization tag
  const handleAddSpecialization = () => {
    const trimmed = specInput.trim();
    if (!trimmed) return;

    setErrorMsg(null);

    // 1. Check if already added in current form
    const existsLocally = specializations.some(
      (s) => s.toLowerCase() === trimmed.toLowerCase(),
    );
    if (existsLocally) {
      setErrorMsg(`Specialization '${trimmed}' is already in this department's list.`);
      return;
    }

    // 2. Check if already allotted to another department (duplication prevention)
    const duplicateDept = departments.find(
      (d) =>
        d.id !== editingId &&
        d.specializations?.some(
          (s) => s.trim().toLowerCase() === trimmed.toLowerCase(),
        ),
    );

    if (duplicateDept) {
      setErrorMsg(
        `Specialization '${trimmed}' is already allotted to department '${duplicateDept.name}'. Specializations cannot be duplicated among departments.`,
      );
      return;
    }

    setSpecializations((prev) => [...prev, trimmed]);
    setSpecInput("");
  };

  const handleKeyDownSpec = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAddSpecialization();
    }
  };

  const handleRemoveSpecialization = (indexToRemove: number) => {
    setSpecializations((prev) =>
      prev.filter((_, idx) => idx !== indexToRemove),
    );
  };

  // Form submission: handles both Create and Update
  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSuccessMsg(null);
    setErrorMsg(null);

    const trimmedName = name.trim();
    if (!trimmedName) {
      setErrorMsg("Department name is required.");
      return;
    }

    setIsSubmitting(true);

    try {
      let response;
      if (editingId) {
        response = await updateDepartment(editingId, {
          name: trimmedName,
          hodId: hodId || null,
          specializations,
        });
      } else {
        response = await createDepartment({
          name: trimmedName,
          hodId: hodId || null,
          specializations,
        });
      }

      if (response.success) {
        setSuccessMsg(response.message);
        handleCancelEdit();
        // Refresh department list
        const refreshed = await getDepartments();
        if (refreshed.success && refreshed.departments) {
          setDepartments(refreshed.departments as DepartmentType[]);
        }
      } else {
        setErrorMsg(response.message);
      }
    } catch (err: any) {
      setErrorMsg(err.message || "An unexpected error occurred. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Edit existing department
  const handleEditClick = (dept: DepartmentType) => {
    setSuccessMsg(null);
    setErrorMsg(null);
    setEditingId(dept.id);
    setName(dept.name);
    setHodId(dept.hodId || "");
    setSpecializations(dept.specializations || []);
    setSpecInput("");
  };

  // Cancel edit mode
  const handleCancelEdit = () => {
    setEditingId(null);
    setName("");
    setHodId("");
    setSpecializations([]);
    setSpecInput("");
    setErrorMsg(null);
  };

  // Delete department
  const handleDeleteClick = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this department?")) {
      return;
    }

    setSuccessMsg(null);
    setErrorMsg(null);

    try {
      const response = await deleteDepartment(id);
      if (response.success) {
        setSuccessMsg(response.message);
        const refreshed = await getDepartments();
        if (refreshed.success && refreshed.departments) {
          setDepartments(refreshed.departments as DepartmentType[]);
        }
      } else {
        setErrorMsg(response.message);
      }
    } catch (err) {
      setErrorMsg("Failed to delete the department.");
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 font-sans">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 dark:text-slate-50 tracking-tight">
          Manage Departments
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Configure university departments, assign Heads of Departments (HOD), and allot unique specializations.
        </p>
      </div>

      {/* Grid Layout: Form on Left, List on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Form Card */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-login-radius p-6 shadow-sm h-fit">
          <div className="mb-5 flex justify-between items-center">
            <h2 className="text-lg font-bold text-slate-900 dark:text-slate-50">
              {editingId ? "Edit Department" : "Add New Department"}
            </h2>
            {editingId && (
              <button
                type="button"
                onClick={handleCancelEdit}
                className="p-1 text-slate-450 hover:text-slate-655 dark:hover:text-slate-250 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg cursor-pointer"
                title="Cancel Edit"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Feedback alerts */}
          {errorMsg && (
            <div className="mb-4 flex items-start gap-2.5 p-3 bg-red-50 dark:bg-red-955/20 border border-red-200 dark:border-red-800/30 rounded-xl text-red-800 dark:text-red-300 text-xs animate-fade-in">
              <AlertCircle className="h-4.5 w-4.5 shrink-0 text-red-655 dark:text-red-400 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="mb-4 flex items-start gap-2.5 p-3 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/30 rounded-xl text-emerald-800 dark:text-emerald-300 text-xs animate-fade-in">
              <CheckCircle2 className="h-4.5 w-4.5 shrink-0 text-emerald-655 dark:text-emerald-400 mt-0.5" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Department Name */}
            <div>
              <label
                htmlFor="deptName"
                className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5"
              >
                Department Name <span className="text-red-500">*</span>
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FileText className="h-4 w-4 text-slate-400 group-focus-within:text-primary transition-colors" />
                </div>
                <input
                  type="text"
                  id="deptName"
                  required
                  disabled={isSubmitting}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Computer Science & Engineering"
                  className="w-full h-11 pl-9 pr-4 py-2 bg-slate-50/50 dark:bg-slate-955/50 border border-slate-200 dark:border-slate-800 rounded-login-radius text-slate-850 dark:text-slate-200 placeholder-slate-455 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all disabled:opacity-50"
                />
              </div>
            </div>

            {/* Assign HOD */}
            <div>
              <label
                htmlFor="hodSelect"
                className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5"
              >
                Assign Head of Department (HOD)
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="h-4 w-4 text-slate-400 group-focus-within:text-primary transition-colors" />
                </div>
                <select
                  id="hodSelect"
                  disabled={isSubmitting}
                  value={hodId}
                  onChange={(e) => setHodId(e.target.value)}
                  className="w-full h-11 pl-9 pr-4 py-2 bg-slate-50/50 dark:bg-slate-955/50 border border-slate-200 dark:border-slate-800 rounded-login-radius text-slate-850 dark:text-slate-200 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all disabled:opacity-50 cursor-pointer"
                >
                  <option value="">-- No HOD Assigned --</option>
                  {staffUsers.map((staff) => {
                    // Check if already HOD of another department
                    const otherDeptHod = departments.find(
                      (d) => d.id !== editingId && d.hodId === staff.id,
                    );
                    return (
                      <option
                        key={staff.id}
                        value={staff.id}
                        disabled={!!otherDeptHod}
                      >
                        {staff.name} {staff.designation ? `(${staff.designation})` : `(${staff.email})`}
                        {otherDeptHod ? ` — [Already HOD of ${otherDeptHod.name}]` : ""}
                      </option>
                    );
                  })}
                </select>
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                Faculty assigned as HOD will manage grievance routing for this department.
              </p>
            </div>

            {/* Allot Specializations */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Allot Specializations
              </label>
              <div className="flex gap-2">
                <div className="relative flex-1 group">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Tag className="h-4 w-4 text-slate-400 group-focus-within:text-primary transition-colors" />
                  </div>
                  <input
                    type="text"
                    disabled={isSubmitting}
                    value={specInput}
                    onChange={(e) => setSpecInput(e.target.value)}
                    onKeyDown={handleKeyDownSpec}
                    placeholder="e.g. Artificial Intelligence"
                    className="w-full h-10 pl-9 pr-3 py-2 bg-slate-50/50 dark:bg-slate-955/50 border border-slate-200 dark:border-slate-800 rounded-login-radius text-slate-850 dark:text-slate-200 placeholder-slate-455 text-xs focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                  />
                </div>
                <button
                  type="button"
                  onClick={handleAddSpecialization}
                  disabled={isSubmitting || !specInput.trim()}
                  className="h-10 px-3.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold rounded-login-radius text-xs transition-all disabled:opacity-40 cursor-pointer flex items-center gap-1 shrink-0"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>Add</span>
                </button>
              </div>

              {/* Specialization Chips List */}
              <div className="mt-2.5 min-h-[50px] p-2.5 bg-slate-50/70 dark:bg-slate-950/40 border border-slate-200/80 dark:border-slate-800 rounded-login-radius flex flex-wrap gap-1.5">
                {specializations.length === 0 ? (
                  <span className="text-[11px] text-slate-400 italic my-auto">
                    No specializations allotted yet. Enter one above and press Add.
                  </span>
                ) : (
                  specializations.map((spec, idx) => (
                    <span
                      key={idx}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-primary/10 dark:bg-primary/20 text-primary border border-primary/20 rounded-lg text-xs font-medium animate-fade-in"
                    >
                      <GraduationCap className="h-3 w-3 shrink-0" />
                      <span>{spec}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveSpecialization(idx)}
                        disabled={isSubmitting}
                        className="hover:text-red-500 rounded-full transition-colors cursor-pointer ml-0.5"
                        title="Remove specialization"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  ))
                )}
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                Students enrolling with any of these specializations will be automatically allotted to this department.
              </p>
            </div>

            {/* Submit Action Block */}
            <div className="pt-2 flex gap-2">
              {editingId && (
                <button
                  type="button"
                  onClick={handleCancelEdit}
                  disabled={isSubmitting}
                  className="w-1/2 h-11 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-350 font-semibold rounded-login-radius text-sm transition-all active:scale-[0.98] cursor-pointer"
                >
                  Cancel
                </button>
              )}
              <button
                type="submit"
                disabled={isSubmitting}
                className={`h-11 bg-primary hover:bg-primary/95 text-white font-semibold rounded-login-radius text-sm transition-all active:scale-[0.98] shadow-md shadow-primary/10 cursor-pointer flex items-center justify-center gap-1.5 ${
                  editingId ? "w-1/2" : "w-full"
                }`}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <Plus className="h-4 w-4" />
                    <span>{editingId ? "Save Changes" : "Create Department"}</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Right Column: List Table */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-login-radius shadow-sm lg:col-span-2 overflow-hidden flex flex-col min-h-[450px]">
          <div className="p-6 border-b border-slate-200 dark:border-slate-800">
            <h2 className="text-lg font-bold text-slate-900 dark:text-slate-50">
              Department Listings
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Registered university departments, assigned HODs, and allotted specializations
            </p>
          </div>

          {isPageLoading ? (
            <div className="flex-1 flex flex-col items-center justify-center gap-2 py-20">
              <Loader2 className="h-8 w-8 text-primary animate-spin" />
              <p className="text-sm text-slate-450 font-medium">
                Loading department records...
              </p>
            </div>
          ) : departments.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center py-20 text-center gap-2 px-4">
              <Landmark className="h-10 w-10 text-slate-350 dark:text-slate-650" />
              <h4 className="font-bold text-slate-700 dark:text-slate-405 text-sm">
                No Departments Registered
              </h4>
              <p className="text-xs text-slate-400 max-w-xs mt-1">
                Create a department using the panel on the left to start organizing faculty members and specializations.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-955/20 text-slate-500 dark:text-slate-400 text-xs font-semibold uppercase">
                    <th className="py-3.5 px-6">Department Name</th>
                    <th className="py-3.5 px-6">Head of Dept (HOD)</th>
                    <th className="py-3.5 px-6">Allotted Specializations</th>
                    <th className="py-3.5 px-6 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-150 dark:divide-slate-850">
                  {departments.map((dept) => (
                    <tr
                      key={dept.id}
                      className="hover:bg-slate-50/20 dark:hover:bg-slate-800/5 transition-colors text-sm"
                    >
                      {/* Name */}
                      <td className="py-4 px-6 font-bold text-slate-900 dark:text-slate-100">
                        <div className="flex items-center gap-2">
                          <Landmark className="h-4 w-4 text-primary shrink-0" />
                          <span>{dept.name}</span>
                        </div>
                      </td>

                      {/* Current HOD */}
                      <td className="py-4 px-6 whitespace-nowrap">
                        {dept.hodName ? (
                          <div className="flex items-center gap-1.5 text-xs text-slate-700 dark:text-slate-200 font-semibold bg-amber-50 dark:bg-amber-955/20 border border-amber-200/50 dark:border-amber-800/40 px-2.5 py-1 rounded-lg w-fit">
                            <ShieldCheck className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
                            <span>{dept.hodName}</span>
                          </div>
                        ) : (
                          <span className="text-slate-400 text-xs italic">
                            Unassigned
                          </span>
                        )}
                      </td>

                      {/* Allotted Specializations */}
                      <td className="py-4 px-6">
                        {dept.specializations && dept.specializations.length > 0 ? (
                          <div className="flex flex-wrap gap-1 max-w-sm">
                            {dept.specializations.map((spec, sIdx) => (
                              <span
                                key={sIdx}
                                className="inline-block px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[11px] font-medium border border-slate-200/50 dark:border-slate-700/50"
                              >
                                {spec}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-slate-400 text-xs italic">
                            No specializations allotted
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-4 px-6 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => handleEditClick(dept)}
                            className="p-1.5 text-slate-550 dark:text-slate-400 hover:text-primary dark:hover:text-primary hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg cursor-pointer transition-colors"
                            title="Edit Department"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteClick(dept.id)}
                            className="p-1.5 text-slate-550 dark:text-slate-400 hover:text-red-655 dark:hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-lg cursor-pointer transition-colors"
                            title="Delete Department"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
