"use client";

import React, { useState, useEffect, FormEvent } from "react";
import { AlertCircle, CheckCircle2 } from "lucide-react";
import {
  getStudents,
  updateStudent,
  deleteStudent,
} from "@/lib/actions/students";
import { getDepartments } from "@/lib/actions/departments";
import StudentTable from "@/components/dashboard/StudentTable";
import StudentForm from "@/components/dashboard/StudentForm";

export default function StudentsPage() {
  const [students, setStudents] = useState<any[]>([]);
  const [departments, setDepartments] = useState<
    { id: string; name: string }[]
  >([]);
  const [userRights, setUserRights] = useState<string[]>([]);
  const [userDeptId, setUserDeptId] = useState("");

  const [isPageLoading, setIsPageLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [form, setForm] = useState<any>({});

  const isAdmin = userRights.includes("ADMIN");

  const loadData = async () => {
    setIsPageLoading(true);
    const [studentRes, deptRes] = await Promise.all([
      getStudents(),
      getDepartments(),
    ]);

    if (studentRes.success) {
      setStudents(studentRes.students || []);
      setUserRights(studentRes.userRights || []);
      setUserDeptId(studentRes.userDeptId || "");
    }
    if (deptRes.success) setDepartments(deptRes.departments || []);
    setIsPageLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    setForm((prev: any) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleEditClick = (student: any) => {
    setSuccessMsg(null);
    setErrorMsg(null);
    setEditingId(student.id);
    setForm({
      name: student.name || "",
      email: student.email || "",
      rollNumber: student.rollNumber || "",
      mobile: student.mobile || "",
      gender: student.gender || "",
      departmentId: student.departmentId || "",
      batch: student.batch || "",
      status: student.status || "ACTIVE",
    });
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setForm({});
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSuccessMsg(null);
    setErrorMsg(null);
    if (!editingId) return;

    setIsSubmitting(true);
    try {
      const response = await updateStudent(editingId, {
        name: form.name,
        email: form.email,
        rollNumber: form.rollNumber,
        mobile: form.mobile,
        batch: form.batch ? Number(form.batch) : undefined,
        gender: form.gender,
        departmentId: isAdmin ? form.departmentId : userDeptId, // Enforce dept locking
        status: form.status,
      });

      if (response.success) {
        setSuccessMsg(response.message);
        handleCancelEdit();
        await loadData();
      } else {
        setErrorMsg(response.message);
      }
    } catch {
      setErrorMsg("An unexpected error occurred.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteClick = async (id: string) => {
    if (
      !window.confirm(
        "Are you sure you want to permanently delete this student account?",
      )
    )
      return;
    try {
      const response = await deleteStudent(id);
      if (response.success) {
        setSuccessMsg(response.message);
        await loadData();
      } else {
        setErrorMsg(response.message);
      }
    } catch {
      setErrorMsg("Failed to delete the student.");
    }
  };

  const filteredStudents = students.filter(
    (s) =>
      s.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.rollNumber?.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 dark:text-slate-50 tracking-tight">
          Manage Students
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          {isAdmin
            ? "University-wide administration of student accounts"
            : "Manage student profiles within your department"}
        </p>
      </div>

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

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 items-start">
        <div className={editingId ? "xl:col-span-2" : "xl:col-span-3"}>
          <StudentTable
            students={filteredStudents}
            isLoading={isPageLoading}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            onEdit={handleEditClick}
            onDelete={handleDeleteClick}
          />
        </div>

        {editingId && (
          <div className="xl:col-span-1 sticky top-6">
            <StudentForm
              form={form}
              handleChange={handleChange}
              isSubmitting={isSubmitting}
              onCancel={handleCancelEdit}
              onSubmit={handleSubmit}
              departments={departments}
              isAdmin={isAdmin}
            />
          </div>
        )}
      </div>
    </div>
  );
}
