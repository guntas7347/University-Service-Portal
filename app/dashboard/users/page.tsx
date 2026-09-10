"use client";

import React, { useState, useEffect, FormEvent } from "react";
import {
  getStaffUsers,
  updateStaffUser,
  deleteStaffUser,
} from "@/lib/prisma/actions/staff";
import { getDepartments } from "@/lib/prisma/actions/departments";
import { getProfile } from "@/lib/prisma/actions/users";
import { useForm } from "@/hooks/useForm";
import UserForm from "@/components/dashboard/UserForm";
import UserTable from "@/components/dashboard/UserTable";
import { AlertCircle, CheckCircle2 } from "lucide-react";

interface StaffUserType {
  id: string;
  name: string;
  email: string;
  mobileNumber: string;
  role: string;
  rights: string[];
  status: string;
  gender: string;
  designation: string;
  departmentId: string;
  departmentName: string;
}

const RIGHTS_OPTIONS = [
  { value: "ADMIN", label: "Full Administrator Access (ADMIN)" },
  { value: "MANAGE_CONFIGS", label: "Manage Configs (Departments, Courses, Categories)" },
  { value: "MANAGE_DEPARTMENT", label: "Manage Department (Department Users & Scoped Ops)" },
  { value: "MANAGE_USERS", label: "Manage Staff Users" },
  { value: "MANAGE_STUDENTS", label: "Manage Students" },
  { value: "MANAGE_ROUTING", label: "Manage Routing Rules" },
  { value: "RESOLVE_GRIEVANCES", label: "Resolve Grievances" },
  { value: "VIEW_ALL_REQUESTS", label: "View All Tickets (Across Departments)" },
];

export default function UsersPage() {
  const [staff, setStaff] = useState<StaffUserType[]>([]);
  const [departments, setDepartments] = useState<
    { id: string; code: string; name: string }[]
  >([]);
  const [currentUser, setCurrentUser] = useState<{
    id: string;
    role: string;
    rights: string[];
    departmentId?: string;
    departmentName?: string;
  } | null>(null);

  const [isPageLoading, setIsPageLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("ALL");

  // Selected rights state
  const [selectedRights, setSelectedRights] = useState<string[]>([]);

  // Alerts feedback
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Form management hook
  const { form, handleChange, setFields, resetFormFields } = useForm({
    name: "",
    email: "",
    designation: "",
    mobileNumber: "",
    departmentId: "",
    role: "FACULTY",
    gender: "",
  });

  // Load staff records on load
  const loadStaff = async () => {
    setIsPageLoading(true);
    const response = await getStaffUsers();
    if (response.success && response.staff) {
      setStaff(response.staff as StaffUserType[]);
    }
    setIsPageLoading(false);
  };

  // Load departments
  const loadDepartments = async () => {
    const response = await getDepartments();
    if (response.success && response.departments) {
      setDepartments(response.departments);
    }
  };

  // Load active session user
  const loadCurrentUser = async () => {
    const response = await getProfile();
    if (response.success && response.user) {
      setCurrentUser(response.user as any);
    }
  };

  useEffect(() => {
    const initPage = async () => {
      await Promise.all([loadCurrentUser(), loadDepartments(), loadStaff()]);
    };
    initPage();
  }, []);

  // Handle right checkbox clicks
  const handleRightCheckboxChange = (value: string, checked: boolean) => {
    if (checked) {
      setSelectedRights((prev) => [...prev, value]);
    } else {
      setSelectedRights((prev) => prev.filter((r) => r !== value));
    }
  };

  // Form submission handler: Create/Update user accounts
  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSuccessMsg(null);
    setErrorMsg(null);

    if (!form.name.trim() || !form.email.trim()) {
      setErrorMsg("Full Name and Email are required fields.");
      return;
    }

    const isAdmin =
      currentUser?.rights?.includes("ADMIN") ||
      currentUser?.rights?.includes("MANAGE_USERS");
    const isDeptManager = currentUser?.rights?.includes("MANAGE_DEPARTMENT");

    const targetRole = form.role || "FACULTY";
    const targetDeptId =
      isDeptManager && !isAdmin
        ? currentUser?.departmentId
        : form.departmentId;

    if (!editingId) {
      setErrorMsg("No active user account selected for editing.");
      return;
    }

    setIsSubmitting(true);

    try {
      // Update user
      const response = await updateStaffUser(editingId, {
        name: form.name,
        email: form.email,
        role: targetRole,
        designation: form.designation || undefined,
        departmentId: targetDeptId || undefined,
        mobileNumber: form.mobileNumber || undefined,
        gender: form.gender || undefined,
        rights: selectedRights,
      });

      if (response.success) {
        setSuccessMsg(response.message);
        resetFormFields();
        setSelectedRights([]);
        setEditingId(null);
        await loadStaff(); // Reload table
      } else {
        setErrorMsg(response.message);
      }
    } catch (err) {
      setErrorMsg("An unexpected error occurred. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Click edit button trigger
  const handleEditClick = (u: StaffUserType) => {
    setSuccessMsg(null);
    setErrorMsg(null);
    setEditingId(u.id);
    setSelectedRights(u.rights);
    setFields({
      name: u.name,
      email: u.email,
      designation: u.designation || "",
      mobileNumber: u.mobileNumber,
      departmentId: u.departmentId || "",
      role: u.role,
      gender: u.gender,
    });
  };

  // Cancel edit mode
  const handleCancelEdit = () => {
    setEditingId(null);
    setSelectedRights([]);
    resetFormFields();
    setSuccessMsg(null);
    setErrorMsg(null);
  };

  // Delete click handler
  const handleDeleteClick = async (id: string) => {
    if (
      !window.confirm(
        "Are you sure you want to delete this staff user account?",
      )
    ) {
      return;
    }

    setSuccessMsg(null);
    setErrorMsg(null);

    try {
      const response = await deleteStaffUser(id);
      if (response.success) {
        setSuccessMsg(response.message);
        await loadStaff();
      } else {
        setErrorMsg(response.message);
      }
    } catch (err) {
      setErrorMsg("Failed to delete the user account.");
    }
  };

  // Local state search & filter routing computations
  const filteredStaff = staff.filter((u) => {
    const isAdmin =
      currentUser?.rights?.includes("ADMIN") ||
      currentUser?.rights?.includes("MANAGE_USERS");
    const isDeptManager = currentUser?.rights?.includes("MANAGE_DEPARTMENT");

    // If department manager without global admin rights, only see users in their department
    if (isDeptManager && !isAdmin && currentUser?.departmentId) {
      if (u.departmentId !== currentUser.departmentId) return false;
    }

    const matchesSearch =
      u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesRole =
      roleFilter === "ALL" || u.role.toUpperCase() === roleFilter.toUpperCase();

    return matchesSearch && matchesRole;
  });

  const getRoleBadge = (role: string) => {
    const r = role.toUpperCase();
    if (r === "SUPER_ADMIN") {
      return (
        <span className="inline-flex px-2 py-0.5 rounded-md text-[10px] font-bold bg-purple-50 dark:bg-purple-950/20 text-purple-750 dark:text-purple-400 border border-purple-200/50">
          Super Admin
        </span>
      );
    }
    if (r === "ADMIN") {
      return (
        <span className="inline-flex px-2 py-0.5 rounded-md text-[10px] font-bold bg-blue-50 dark:bg-blue-950/20 text-blue-750 dark:text-blue-400 border border-blue-200/50">
          Admin
        </span>
      );
    }
    if (r === "HOD") {
      return (
        <span className="inline-flex px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-50 dark:bg-amber-950/20 text-amber-700 dark:text-amber-400 border border-amber-200/50">
          HOD
        </span>
      );
    }
    return (
      <span className="inline-flex px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-350 border border-slate-200/50">
        {role.replace("_", " ")}
      </span>
    );
  };

  const isDeptManager = currentUser?.rights?.includes("MANAGE_DEPARTMENT") && !currentUser?.rights?.includes("ADMIN");

  return (
    <div className="space-y-6">
      {/* Page Title */}
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 dark:text-slate-50 tracking-tight">
          Manage Users
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          {isDeptManager
            ? `Manage faculty members inside the ${currentUser?.departmentName || ""} Department`
            : "Configure access permissions and edit profile details for university administrative staff and faculty"}
        </p>
      </div>

      {/* Feedback alerts */}
      {errorMsg && (
        <div className="flex items-start gap-2.5 p-3.5 bg-red-50 dark:bg-red-955/20 border border-red-200 dark:border-red-800/30 rounded-xl text-red-800 dark:text-red-300 text-xs">
          <AlertCircle className="h-4.5 w-4.5 shrink-0 text-red-650 dark:text-red-400 mt-0.5" />
          <span>{errorMsg}</span>
        </div>
      )}

      {successMsg && (
        <div className="flex items-start gap-2.5 p-3.5 bg-emerald-50 dark:bg-emerald-955/20 border border-emerald-200 dark:border-emerald-800/30 rounded-xl text-emerald-800 dark:text-emerald-300 text-xs">
          <CheckCircle2 className="h-4.5 w-4.5 shrink-0 text-emerald-655 dark:text-emerald-400 mt-0.5" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Grid: Form on Left, List table on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-login-gap">
        {/* Left Column: Edit Form Card */}
        {editingId ? (
          <UserForm
            form={form}
            handleChange={handleChange}
            isSubmitting={isSubmitting}
            editingId={editingId}
            handleCancelEdit={handleCancelEdit}
            departments={departments}
            currentUser={currentUser}
            selectedRights={selectedRights}
            handleRightCheckboxChange={handleRightCheckboxChange}
            rightsOptions={RIGHTS_OPTIONS}
            handleSubmit={handleSubmit}
          />
        ) : null}

        {/* Right Column: List Table */}
        <UserTable
          filteredStaff={filteredStaff}
          isPageLoading={isPageLoading}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          roleFilter={roleFilter}
          setRoleFilter={setRoleFilter}
          handleEditClick={handleEditClick}
          handleDeleteClick={handleDeleteClick}
          currentUser={currentUser}
          getRoleBadge={getRoleBadge}
          className={editingId ? "lg:col-span-2" : "lg:col-span-3"}
        />
      </div>
    </div>
  );
}
