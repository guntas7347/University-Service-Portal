"use client";

import React, { useState, useEffect, FormEvent } from "react";
import {
  getStaffUsers,
  updateStaffUser,
  deleteStaffUser,
} from "@/lib/actions/staff";
import { getDepartments } from "@/lib/actions/departments";
import UserForm from "@/components/dashboard/UserForm";
import UserTable from "@/components/dashboard/UserTable";
import { AlertCircle, CheckCircle2 } from "lucide-react";

export default function UsersPage() {
  const [staff, setStaff] = useState<any[]>([]);
  const [departments, setDepartments] = useState<
    { id: string; name: string }[]
  >([]);

  const [isPageLoading, setIsPageLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Edit State
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<any>({});
  const [selectedRights, setSelectedRights] = useState<string[]>([]);

  const [userRights, setUserRights] = useState<string[]>([]); // Store the rights of the user being edited

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("ALL");

  // Alerts
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const loadData = async () => {
    setIsPageLoading(true);
    const [staffRes, deptRes] = await Promise.all([
      getStaffUsers(),
      getDepartments(),
    ]);

    if (staffRes?.success) {
      setStaff(staffRes.staff || []);
      setUserRights(staffRes?.userRights || []);
    }
    if (deptRes?.success) setDepartments(deptRes.departments || []);

    setIsPageLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  // Universal form change handler
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    setForm((prev: any) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  // Submit Handler
  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSuccessMsg(null);
    setErrorMsg(null);

    if (!form.name?.trim() || !form.email?.trim()) {
      setErrorMsg("Full Name and Email are required.");
      return;
    }
    if (!editingId) return;

    setIsSubmitting(true);

    try {
      const response = await updateStaffUser(editingId, {
        name: form.name,
        email: form.email,
        role: form.role,
        departmentId: form.departmentId || undefined,
        mobile: form.mobile || undefined,
        rights: selectedRights,
      });

      if (response.success) {
        setSuccessMsg(response.message);
        handleCancelEdit();
        await loadData();
      } else {
        setErrorMsg(response.message);
      }
    } catch (err) {
      setErrorMsg("An unexpected error occurred. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditClick = (u: any) => {
    setSuccessMsg(null);
    setErrorMsg(null);
    setEditingId(u.id);
    setSelectedRights(u.rights || []);
    setForm({
      name: u.name || "",
      email: u.email || "",
      mobile: u.mobile || "",
      departmentId: u.departmentId || "",
      role: u.role || "FACULTY",
    });
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setSelectedRights([]);
    setForm({});
  };

  const handleDeleteClick = async (id: string) => {
    if (
      !window.confirm(
        "Are you sure you want to delete this staff user account?",
      )
    )
      return;
    try {
      const response = await deleteStaffUser(id);
      if (response.success) {
        setSuccessMsg(response.message);
        await loadData();
      } else {
        setErrorMsg(response.message);
      }
    } catch {
      setErrorMsg("Failed to delete the user account.");
    }
  };

  // Badge Generator
  const getRoleBadge = (role: string) => {
    const r = (role || "").toUpperCase();
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
        {r || "FACULTY"}
      </span>
    );
  };

  const filteredStaff = staff.filter((u) => {
    const matchesSearch =
      u.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole =
      roleFilter === "ALL" ||
      u.role?.toUpperCase() === roleFilter.toUpperCase();
    return matchesSearch && matchesRole;
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 dark:text-slate-50 tracking-tight">
          Manage Users
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Configure access permissions and edit profile details for
          administrative staff and faculty.
        </p>
      </div>

      {/* Alerts */}
      {errorMsg && (
        <div className="flex items-center gap-2 p-3.5 bg-red-50 dark:bg-red-955/20 border border-red-200 dark:border-red-800/30 rounded-xl text-red-800 dark:text-red-300 text-xs">
          <AlertCircle className="h-4 w-4 shrink-0 text-red-500" />
          <span>{errorMsg}</span>
        </div>
      )}
      {successMsg && (
        <div className="flex items-center gap-2 p-3.5 bg-emerald-50 dark:bg-emerald-955/20 border border-emerald-200 dark:border-emerald-800/30 rounded-xl text-emerald-800 dark:text-emerald-300 text-xs">
          <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Split Layout */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 items-start">
        {/* Table Area */}
        <div className={editingId ? "xl:col-span-2" : "xl:col-span-3"}>
          <UserTable
            filteredStaff={filteredStaff}
            isPageLoading={isPageLoading}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            roleFilter={roleFilter}
            setRoleFilter={setRoleFilter}
            handleEditClick={handleEditClick}
            handleDeleteClick={handleDeleteClick}
            getRoleBadge={getRoleBadge}
          />
        </div>

        {/* Editor Card Area (Sticky) */}
        {editingId && (
          <div className="xl:col-span-1 sticky top-6">
            <UserForm
              form={form}
              handleChange={handleChange}
              isSubmitting={isSubmitting}
              handleCancelEdit={handleCancelEdit}
              departments={departments}
              selectedRights={selectedRights}
              setSelectedRights={setSelectedRights}
              handleSubmit={handleSubmit}
              userRights={userRights}
            />
          </div>
        )}
      </div>
    </div>
  );
}
