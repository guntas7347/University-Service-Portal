"use client";

import React, { useState, useEffect, FormEvent } from "react";
import { 
  GraduationCap, 
  Plus, 
  Edit, 
  Trash2, 
  Loader2, 
  CheckCircle2, 
  AlertCircle,
  Hash,
  FileText,
  Clock,
  X,
  Search,
  User,
  Mail,
  Phone,
  Landmark,
  BookOpen,
  Calendar,
  ShieldCheck,
  AlertTriangle
} from "lucide-react";
import { useForm } from "@/hooks/useForm";
import { 
  getStudents, 
  createStudent, 
  updateStudent, 
  deleteStudent 
} from "@/lib/prisma/actions/students";
import { getDepartments } from "@/lib/prisma/actions/departments";
import { getCourses } from "@/lib/prisma/actions/courses";

interface StudentType {
  id: string;
  name: string;
  email: string;
  rollNumber: string;
  mobileNumber: string;
  batch: number | null;
  role: string;
  status: string;
  gender: string;
  departmentId: string;
  departmentName: string;
  courseId: string;
  courseName: string;
}

export default function StudentsPage() {
  const [students, setStudents] = useState<StudentType[]>([]);
  const [departments, setDepartments] = useState<{ id: string; name: string }[]>([]);
  const [courses, setCourses] = useState<{ id: string; name: string; departmentId?: string | null }[]>([]);
  const [userRole, setUserRole] = useState("STUDENT");
  const [userDeptId, setUserDeptId] = useState("");
  
  const [isPageLoading, setIsPageLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Search filter
  const [searchQuery, setSearchQuery] = useState("");

  // Alerts feedback
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Form management hook
  const { form, handleChange, setFields, resetFormFields } = useForm({
    name: "",
    email: "",
    rollNumber: "",
    mobileNumber: "",
    gender: "",
    departmentId: "",
    courseId: "",
    batch: "",
    status: "ACTIVE"
  });

  // Fetch all initial data
  const loadData = async () => {
    setIsPageLoading(true);
    try {
      const [studentRes, deptRes, coursesRes] = await Promise.all([
        getStudents(),
        getDepartments(),
        getCourses()
      ]);

      let role = "STUDENT";
      let deptId = "";

      if (studentRes.success && studentRes.students) {
        setStudents(studentRes.students as any[]);
        role = studentRes.userRole || "STUDENT";
        deptId = studentRes.userDeptId || "";
        setUserRole(role);
        setUserDeptId(deptId);
      }

      if (deptRes.success && deptRes.departments) {
        setDepartments(deptRes.departments as any[]);
      }

      if (coursesRes.success && coursesRes.courses) {
        setCourses(coursesRes.courses as any[]);
      }

      // If HOD, default and lock department
      if (role === "HOD" && deptId) {
        setFields({ departmentId: deptId });
      }

    } catch (err) {
      setErrorMsg("Failed to load student dashboard records.");
    } finally {
      setIsPageLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Filter courses based on department selection (especially useful for HOD or during department choice)
  const selectedDeptId = userRole === "HOD" ? userDeptId : form.departmentId;
  const filteredCourses = selectedDeptId
    ? courses.filter(c => c.departmentId === selectedDeptId)
    : courses;

  // Form submission handler (Create and Update)
  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSuccessMsg(null);
    setErrorMsg(null);

    if (!form.name.trim() || !form.email.trim() || !form.rollNumber.trim()) {
      setErrorMsg("Full Name, Email, and Roll Number are required fields.");
      return;
    }

    const isHod = userRole === "HOD";
    const finalDeptId = isHod ? userDeptId : form.departmentId;

    if (!finalDeptId) {
      setErrorMsg("Department is required.");
      return;
    }

    setIsSubmitting(true);
    const batchNum = form.batch ? Number(form.batch) : undefined;

    try {
      let response;
      if (editingId) {
        // Update existing student
        response = await updateStudent(editingId, {
          name: form.name,
          email: form.email,
          rollNumber: form.rollNumber,
          mobileNumber: form.mobileNumber || undefined,
          batch: batchNum,
          gender: form.gender || undefined,
          departmentId: finalDeptId,
          courseId: form.courseId || undefined,
          status: form.status
        });
      } else {
        // Create new student
        response = await createStudent({
          name: form.name,
          email: form.email,
          rollNumber: form.rollNumber,
          mobileNumber: form.mobileNumber || undefined,
          batch: batchNum,
          gender: form.gender || undefined,
          departmentId: finalDeptId,
          courseId: form.courseId || undefined
        });
      }

      if (response.success) {
        setSuccessMsg(response.message);
        resetFormFields();
        if (isHod && userDeptId) {
          setFields({ departmentId: userDeptId });
        }
        setEditingId(null);
        // Reload students list
        const studentRes = await getStudents();
        if (studentRes.success && studentRes.students) {
          setStudents(studentRes.students as any[]);
        }
      } else {
        setErrorMsg(response.message);
      }
    } catch (err) {
      setErrorMsg("An unexpected database error occurred. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Switch form to Edit Mode
  const handleEditClick = (student: StudentType) => {
    setSuccessMsg(null);
    setErrorMsg(null);
    setEditingId(student.id);
    setFields({
      name: student.name,
      email: student.email,
      rollNumber: student.rollNumber,
      mobileNumber: student.mobileNumber,
      gender: student.gender,
      departmentId: student.departmentId || "",
      courseId: student.courseId || "",
      batch: student.batch ? String(student.batch) : "",
      status: student.status
    });
  };

  // Cancel edit handler
  const handleCancelEdit = () => {
    setEditingId(null);
    resetFormFields();
    if (userRole === "HOD" && userDeptId) {
      setFields({ departmentId: userDeptId });
    }
    setSuccessMsg(null);
    setErrorMsg(null);
  };

  // Delete click handler
  const handleDeleteClick = async (student: StudentType) => {
    if (!window.confirm(`Are you sure you want to permanently delete the student account for ${student.name}?`)) {
      return;
    }

    setSuccessMsg(null);
    setErrorMsg(null);

    try {
      const response = await deleteStudent(student.id);
      if (response.success) {
        setSuccessMsg(response.message);
        const studentRes = await getStudents();
        if (studentRes.success && studentRes.students) {
          setStudents(studentRes.students as any[]);
        }
      } else {
        setErrorMsg(response.message);
      }
    } catch (err) {
      setErrorMsg("Failed to delete the student user account.");
    }
  };

  // Search query filters
  const filteredStudents = students.filter(s => {
    const matchesSearch = 
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.rollNumber.toLowerCase().includes(searchQuery.toLowerCase());
    
    return matchesSearch;
  });

  const getStatusBadge = (status: string) => {
    const s = status.toUpperCase();
    if (s === "ACTIVE") {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 dark:bg-emerald-955/35 text-emerald-800 dark:text-emerald-300 border border-emerald-200/30">
          <ShieldCheck className="h-3 w-3" />
          <span>Active</span>
        </span>
      );
    }
    if (s === "PENDING") {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 dark:bg-amber-955/35 text-amber-800 dark:text-amber-300 border border-amber-200/30">
          <Clock className="h-3 w-3" />
          <span>Pending</span>
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-50 dark:bg-red-955/35 text-red-800 dark:text-red-300 border border-red-200/30">
        <AlertTriangle className="h-3 w-3" />
        <span>{s}</span>
      </span>
    );
  };

  return (
    <div className="space-y-6">
      
      {/* Title */}
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 dark:text-slate-50 tracking-tight font-sans">
          Manage Students
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          {userRole === "HOD" 
            ? "Register and configure student profiles and course transitions within your department"
            : "University-wide administration of student user accounts, batch details, and program enrollments"
          }
        </p>
      </div>

      {/* Grid Layout: Form on Left, List on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-login-gap">
        
        {/* Left Column: Register/Edit Form Card */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-login-radius p-6 shadow-sm h-fit">
          <div className="mb-6 flex justify-between items-center">
            <h2 className="text-lg font-bold text-slate-900 dark:text-slate-50">
              {editingId ? "Edit Student Profile" : "Register Student"}
            </h2>
            {editingId && (
              <button 
                type="button" 
                onClick={handleCancelEdit}
                className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-250 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg cursor-pointer transition-all"
                title="Cancel Edit"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Feedback alerts */}
          {errorMsg && (
            <div className="mb-4 flex items-start gap-2.5 p-3 bg-red-50 dark:bg-red-955/20 border border-red-200 dark:border-red-800/30 rounded-xl text-red-800 dark:text-red-300 text-xs">
              <AlertCircle className="h-4.5 w-4.5 shrink-0 text-red-650 dark:text-red-400 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="mb-4 flex items-start gap-2.5 p-3 bg-emerald-50 dark:bg-emerald-955/20 border border-emerald-200 dark:border-emerald-800/30 rounded-xl text-emerald-800 dark:text-emerald-300 text-xs">
              <CheckCircle2 className="h-4.5 w-4.5 shrink-0 text-emerald-655 dark:text-emerald-400 mt-0.5" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            
            {/* Student Name */}
            <div>
              <label htmlFor="name" className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-2">
                Full Name
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="h-4 w-4 text-slate-400 group-focus-within:text-primary transition-colors" />
                </div>
                <input
                  type="text"
                  id="name"
                  name="name"
                  required
                  disabled={isSubmitting}
                  value={form.name}
                  onChange={handleChange}
                  placeholder="e.g. Rahul Sharma"
                  className="w-full h-11 pl-9 pr-4 py-2 bg-slate-50/50 dark:bg-slate-955/50 border border-slate-200 dark:border-slate-800 rounded-login-radius text-slate-850 dark:text-slate-200 placeholder-slate-400 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all disabled:opacity-50"
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-2">
                Email Address
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-4 w-4 text-slate-400 group-focus-within:text-primary transition-colors" />
                </div>
                <input
                  type="email"
                  id="email"
                  name="email"
                  required
                  disabled={isSubmitting}
                  value={form.email}
                  onChange={handleChange}
                  placeholder="e.g. rahul@university.edu"
                  className="w-full h-11 pl-9 pr-4 py-2 bg-slate-50/50 dark:bg-slate-955/50 border border-slate-200 dark:border-slate-800 rounded-login-radius text-slate-850 dark:text-slate-200 placeholder-slate-400 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all disabled:opacity-50"
                />
              </div>
            </div>

            {/* Roll Number */}
            <div>
              <label htmlFor="rollNumber" className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-2">
                Roll Number / Student ID
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Hash className="h-4 w-4 text-slate-400 group-focus-within:text-primary transition-colors" />
                </div>
                <input
                  type="text"
                  id="rollNumber"
                  name="rollNumber"
                  required
                  disabled={isSubmitting}
                  value={form.rollNumber}
                  onChange={handleChange}
                  placeholder="e.g. 2026CSE105"
                  className="w-full h-11 pl-9 pr-4 py-2 bg-slate-50/50 dark:bg-slate-955/50 border border-slate-200 dark:border-slate-800 rounded-login-radius text-slate-850 dark:text-slate-200 placeholder-slate-400 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all disabled:opacity-50"
                />
              </div>
            </div>

            {/* Mobile Number */}
            <div>
              <label htmlFor="mobileNumber" className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-2">
                Mobile Number
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Phone className="h-4 w-4 text-slate-400 group-focus-within:text-primary transition-colors" />
                </div>
                <input
                  type="tel"
                  id="mobileNumber"
                  name="mobileNumber"
                  disabled={isSubmitting}
                  value={form.mobileNumber}
                  onChange={handleChange}
                  placeholder="e.g. +91 9876543210"
                  className="w-full h-11 pl-9 pr-4 py-2 bg-slate-50/50 dark:bg-slate-955/50 border border-slate-200 dark:border-slate-800 rounded-login-radius text-slate-850 dark:text-slate-200 placeholder-slate-400 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all disabled:opacity-50"
                />
              </div>
            </div>

            {/* Department */}
            <div>
              <label htmlFor="departmentId" className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-2">
                Department
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Landmark className="h-4 w-4 text-slate-400 group-focus-within:text-primary transition-colors" />
                </div>
                <select
                  id="departmentId"
                  name="departmentId"
                  required
                  disabled={isSubmitting || userRole === "HOD"}
                  value={userRole === "HOD" ? userDeptId : form.departmentId}
                  onChange={handleChange}
                  className="w-full h-11 pl-9 pr-4 py-2 bg-slate-50/50 dark:bg-slate-955/50 border border-slate-200 dark:border-slate-800 rounded-login-radius text-slate-850 dark:text-slate-200 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all disabled:opacity-50 appearance-none cursor-pointer"
                >
                  <option value="">Select Department</option>
                  {departments.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Course */}
            <div>
              <label htmlFor="courseId" className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-2">
                Enrolled Course Program
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <BookOpen className="h-4 w-4 text-slate-400 group-focus-within:text-primary transition-colors" />
                </div>
                <select
                  id="courseId"
                  name="courseId"
                  disabled={isSubmitting}
                  value={form.courseId}
                  onChange={handleChange}
                  className="w-full h-11 pl-9 pr-4 py-2 bg-slate-50/50 dark:bg-slate-955/50 border border-slate-200 dark:border-slate-800 rounded-login-radius text-slate-850 dark:text-slate-200 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all disabled:opacity-50 appearance-none cursor-pointer"
                >
                  <option value="">Select Program</option>
                  {filteredCourses.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Batch & Gender Row */}
            <div className="grid grid-cols-2 gap-3">
              {/* Batch */}
              <div>
                <label htmlFor="batch" className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-2">
                  Graduation Batch
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Calendar className="h-4 w-4 text-slate-400 group-focus-within:text-primary transition-colors" />
                  </div>
                  <input
                    type="number"
                    id="batch"
                    name="batch"
                    disabled={isSubmitting}
                    value={form.batch}
                    onChange={handleChange}
                    placeholder="e.g. 2026"
                    min="1900"
                    max="2100"
                    className="w-full h-11 pl-9 pr-4 py-2 bg-slate-50/50 dark:bg-slate-955/50 border border-slate-200 dark:border-slate-800 rounded-login-radius text-slate-850 dark:text-slate-200 placeholder-slate-450 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all disabled:opacity-50"
                  />
                </div>
              </div>

              {/* Gender */}
              <div>
                <label htmlFor="gender" className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-2">
                  Gender
                </label>
                <select
                  id="gender"
                  name="gender"
                  disabled={isSubmitting}
                  value={form.gender}
                  onChange={handleChange}
                  className="w-full h-11 px-3 py-2 bg-slate-50/50 dark:bg-slate-955/50 border border-slate-200 dark:border-slate-800 rounded-login-radius text-slate-850 dark:text-slate-200 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all disabled:opacity-50 appearance-none cursor-pointer"
                >
                  <option value="">Select Gender</option>
                  <option value="MALE">Male</option>
                  <option value="FEMALE">Female</option>
                  <option value="OTHER">Other</option>
                  <option value="PREFER_NOT_TO_SAY">Prefer not to say</option>
                </select>
              </div>
            </div>

            {/* Account Status (Only visible in edit mode) */}
            {editingId && (
              <div>
                <label htmlFor="status" className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-2">
                  Account Access Status
                </label>
                <select
                  id="status"
                  name="status"
                  disabled={isSubmitting}
                  value={form.status}
                  onChange={handleChange}
                  className="w-full h-11 px-3 py-2 bg-slate-50/50 dark:bg-slate-955/50 border border-slate-200 dark:border-slate-800 rounded-login-radius text-slate-850 dark:text-slate-200 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all disabled:opacity-50 appearance-none cursor-pointer"
                >
                  <option value="ACTIVE">Active</option>
                  <option value="PENDING">Pending Approval</option>
                  <option value="SUSPENDED">Suspended / Disabled</option>
                  <option value="DELETED">Soft Deleted</option>
                </select>
              </div>
            )}

            {/* Action Buttons */}
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
                    <span>{editingId ? "Save Profile" : "Register Student"}</span>
                  </>
                )}
              </button>
            </div>

          </form>
        </div>

        {/* Right Column: List Table card */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-login-radius shadow-sm lg:col-span-2 overflow-hidden flex flex-col min-h-[450px]">
          
          {/* Controls */}
          <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row gap-4 items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-slate-50 font-sans">
                Student Registry
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Active student enrollment records
              </p>
            </div>
            
            {/* Search filter input */}
            <div className="relative group w-full sm:w-64">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-slate-400 group-focus-within:text-primary transition-colors" />
              </div>
              <input
                type="text"
                placeholder="Search name, email, roll..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-10 pl-9 pr-4 py-2 bg-slate-50/50 dark:bg-slate-955/50 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-850 dark:text-slate-200 placeholder-slate-400 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
              />
            </div>
          </div>

          {/* Records state render */}
          {isPageLoading ? (
            <div className="flex-1 flex flex-col items-center justify-center gap-2.5 py-20">
              <Loader2 className="h-8 w-8 text-primary animate-spin" />
              <p className="text-sm text-slate-400">Loading student directory...</p>
            </div>
          ) : filteredStudents.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center gap-2 py-20 text-center px-4">
              <GraduationCap className="h-10 w-10 text-slate-350 dark:text-slate-650" />
              <h4 className="font-bold text-slate-700 dark:text-slate-400 text-sm">No Student Profiles Found</h4>
              <p className="text-xs text-slate-400 max-w-xs mt-1">
                {searchQuery 
                  ? "No search matches found for the query parameter." 
                  : "No students are currently registered in this department or system track."
                }
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-955/20 text-slate-500 dark:text-slate-400 text-xs font-semibold uppercase">
                    <th className="py-3.5 px-6">Student Info</th>
                    <th className="py-3.5 px-6">ID & Batch</th>
                    <th className="py-3.5 px-6">Program & Department</th>
                    <th className="py-3.5 px-6">Status</th>
                    <th className="py-3.5 px-6 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-155 dark:divide-slate-850">
                  {filteredStudents.map((student) => {
                    const isOwnDept = userRole === "ADMIN" || userRole === "SUPER_ADMIN" || student.departmentId === userDeptId;

                    return (
                      <tr key={student.id} className="hover:bg-slate-50/20 dark:hover:bg-slate-800/5 transition-colors text-sm">
                        
                        {/* Student Name and Email */}
                        <td className="py-4 px-6">
                          <div className="font-bold text-slate-900 dark:text-slate-100">{student.name}</div>
                          <div className="text-xs text-slate-450 mt-0.5">{student.email}</div>
                          {student.mobileNumber && (
                            <div className="text-[10px] text-slate-400 font-medium mt-0.5 font-mono">{student.mobileNumber}</div>
                          )}
                        </td>

                        {/* Roll Number and Batch */}
                        <td className="py-4 px-6">
                          <div className="font-semibold text-slate-800 dark:text-slate-300 font-mono text-xs">{student.rollNumber}</div>
                          <div className="text-xs text-slate-450 mt-0.5">
                            {student.batch ? `Graduation: ${student.batch}` : "Batch: N/A"}
                          </div>
                        </td>

                        {/* Course & Department */}
                        <td className="py-4 px-6">
                          <div className="font-medium text-slate-700 dark:text-slate-350">{student.courseName || "General Track"}</div>
                          <div className="text-xs text-slate-450 mt-0.5">{student.departmentName || "Unassigned"}</div>
                        </td>

                        {/* Status Badge */}
                        <td className="py-4 px-6 whitespace-nowrap">
                          {getStatusBadge(student.status)}
                        </td>

                        {/* Actions */}
                        <td className="py-4 px-6 text-right">
                          {isOwnDept ? (
                            <div className="flex items-center justify-end gap-2">
                              <button
                                type="button"
                                onClick={() => handleEditClick(student)}
                                className="p-1.5 text-slate-550 dark:text-slate-400 hover:text-primary dark:hover:text-primary hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg cursor-pointer transition-colors"
                                title="Edit Student Profile"
                              >
                                <Edit className="h-4 w-4" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteClick(student)}
                                className="p-1.5 text-slate-550 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-955/20 rounded-lg cursor-pointer transition-colors"
                                title="Delete Student"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          ) : (
                            <span className="text-xs text-slate-400 italic pr-2">No Access</span>
                          )}
                        </td>

                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
          
        </div>

      </div>

    </div>
  );
}
