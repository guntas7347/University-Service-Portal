"use client";

import React, { useState, useEffect, FormEvent } from "react";
import { 
  BookOpen, 
  Plus, 
  Edit, 
  Trash2, 
  Loader2, 
  CheckCircle2, 
  AlertCircle,
  Hash,
  FileText,
  Clock,
  X
} from "lucide-react";
import { useForm } from "@/hooks/useForm";
import { 
  getCourses, 
  createCourse, 
  updateCourse, 
  deleteCourse 
} from "@/lib/prisma/actions/courses";

interface CourseType {
  id: string;
  code: string;
  name: string;
  duration: number | null;
  createdAt: Date;
}

export default function CoursesPage() {
  const [courses, setCourses] = useState<CourseType[]>([]);
  const [isPageLoading, setIsPageLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Alerts feedback
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Form management hook
  const { form, handleChange, setFields, resetFormFields } = useForm({
    code: "",
    name: "",
    duration: ""
  });

  // Fetch courses on page load
  const loadCourses = async () => {
    setIsPageLoading(true);
    const response = await getCourses();
    if (response.success && response.courses) {
      // Cast response to CourseType array
      setCourses(response.courses as any);
    }
    setIsPageLoading(false);
  };

  useEffect(() => {
    loadCourses();
  }, []);

  // Form submission handler: handles both Create and Update
  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSuccessMsg(null);
    setErrorMsg(null);

    if (!form.code.trim() || !form.name.trim()) {
      setErrorMsg("Course code and name are required.");
      return;
    }

    setIsSubmitting(true);
    const durationNum = form.duration ? Number(form.duration) : undefined;

    try {
      let response;
      if (editingId) {
        // Update existing record
        response = await updateCourse(editingId, {
          code: form.code,
          name: form.name,
          duration: durationNum
        });
      } else {
        // Create new record
        response = await createCourse({
          code: form.code,
          name: form.name,
          duration: durationNum
        });
      }

      if (response.success) {
        setSuccessMsg(response.message);
        resetFormFields();
        setEditingId(null);
        await loadCourses(); // Reload table
      } else {
        setErrorMsg(response.message);
      }
    } catch (err) {
      setErrorMsg("An unexpected error occurred. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Click handler to switch form into Edit Mode
  const handleEditClick = (course: CourseType) => {
    setSuccessMsg(null);
    setErrorMsg(null);
    setEditingId(course.id);
    setFields({
      code: course.code,
      name: course.name,
      duration: course.duration ? String(course.duration) : ""
    });
  };

  // Cancel editing handler
  const handleCancelEdit = () => {
    setEditingId(null);
    resetFormFields();
    setSuccessMsg(null);
    setErrorMsg(null);
  };

  // Delete click handler
  const handleDeleteClick = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this course?")) {
      return;
    }

    setSuccessMsg(null);
    setErrorMsg(null);

    try {
      const response = await deleteCourse(id);
      if (response.success) {
        setSuccessMsg(response.message);
        await loadCourses();
      } else {
        setErrorMsg(response.message);
      }
    } catch (err) {
      setErrorMsg("Failed to delete the course.");
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 dark:text-slate-50 tracking-tight">
          Manage Courses
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Configure educational programs and duration tracks for student enrollment
        </p>
      </div>

      {/* Grid Layout: Form on Left, List on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-login-gap">
        
        {/* Left Column: Form Card */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-login-radius p-6 shadow-sm h-fit">
          <div className="mb-6 flex justify-between items-center">
            <h2 className="text-lg font-bold text-slate-900 dark:text-slate-50">
              {editingId ? "Edit Course" : "Add New Course"}
            </h2>
            {editingId && (
              <button 
                type="button" 
                onClick={handleCancelEdit}
                className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-250 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg cursor-pointer"
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
            <div className="mb-4 flex items-start gap-2.5 p-3 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/30 rounded-xl text-emerald-800 dark:text-emerald-300 text-xs">
              <CheckCircle2 className="h-4.5 w-4.5 shrink-0 text-emerald-655 dark:text-emerald-400 mt-0.5" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Course Code */}
            <div>
              <label htmlFor="code" className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-2">
                Course Code
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Hash className="h-4 w-4 text-slate-400 group-focus-within:text-primary transition-colors" />
                </div>
                <input
                  type="text"
                  id="code"
                  name="code"
                  required
                  disabled={isSubmitting}
                  value={form.code}
                  onChange={handleChange}
                  placeholder="e.g. BTECH-CSE"
                  className="w-full h-11 pl-9 pr-4 py-2 bg-slate-50/50 dark:bg-slate-955/50 border border-slate-200 dark:border-slate-800 rounded-login-radius text-slate-850 dark:text-slate-200 placeholder-slate-400 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all disabled:opacity-50"
                />
              </div>
            </div>

            {/* Course Name */}
            <div>
              <label htmlFor="name" className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-2">
                Course Title
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FileText className="h-4 w-4 text-slate-400 group-focus-within:text-primary transition-colors" />
                </div>
                <input
                  type="text"
                  id="name"
                  name="name"
                  required
                  disabled={isSubmitting}
                  value={form.name}
                  onChange={handleChange}
                  placeholder="e.g. B.Tech Computer Science"
                  className="w-full h-11 pl-9 pr-4 py-2 bg-slate-50/50 dark:bg-slate-955/50 border border-slate-200 dark:border-slate-800 rounded-login-radius text-slate-850 dark:text-slate-200 placeholder-slate-400 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all disabled:opacity-50"
                />
              </div>
            </div>

            {/* Course Duration */}
            <div>
              <label htmlFor="duration" className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-2">
                Duration (in Months) - Optional
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Clock className="h-4 w-4 text-slate-400 group-focus-within:text-primary transition-colors" />
                </div>
                <input
                  type="number"
                  id="duration"
                  name="duration"
                  disabled={isSubmitting}
                  value={form.duration}
                  onChange={handleChange}
                  placeholder="e.g. 48"
                  min="1"
                  className="w-full h-11 pl-9 pr-4 py-2 bg-slate-50/50 dark:bg-slate-955/50 border border-slate-200 dark:border-slate-800 rounded-login-radius text-slate-850 dark:text-slate-200 placeholder-slate-400 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all disabled:opacity-50"
                />
              </div>
            </div>

            {/* Submit Buttons */}
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
                    <span>{editingId ? "Save Changes" : "Create Course"}</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Right Column: List Table */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-login-radius shadow-sm lg:col-span-2 overflow-hidden flex flex-col min-h-[350px]">
          <div className="p-6 border-b border-slate-200 dark:border-slate-800">
            <h2 className="text-lg font-bold text-slate-900 dark:text-slate-50">
              Registered Courses
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Active curriculum tracks listed in the system
            </p>
          </div>

          {isPageLoading ? (
            <div className="flex-1 flex flex-col items-center justify-center gap-2.5 py-20">
              <Loader2 className="h-8 w-8 text-primary animate-spin" />
              <p className="text-sm text-slate-400">Loading course curriculum...</p>
            </div>
          ) : courses.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center gap-2 py-20 text-center px-4">
              <BookOpen className="h-10 w-10 text-slate-350 dark:text-slate-650" />
              <h4 className="font-bold text-slate-700 dark:text-slate-400 text-sm">No Courses Listed</h4>
              <p className="text-xs text-slate-400 max-w-xs mt-1">
                There are currently no active course registrations. Create your first course using the dashboard form.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/20 text-slate-500 dark:text-slate-400 text-xs font-semibold uppercase">
                    <th className="py-3.5 px-6">Code</th>
                    <th className="py-3.5 px-6">Course Name</th>
                    <th className="py-3.5 px-6">Duration</th>
                    <th className="py-3.5 px-6 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-150 dark:divide-slate-800">
                  {courses.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50/20 dark:hover:bg-slate-800/5 transition-colors text-sm">
                      <td className="py-4 px-6 font-bold text-slate-900 dark:text-slate-100">
                        {item.code}
                      </td>
                      <td className="py-4 px-6 font-medium text-slate-600 dark:text-slate-350">
                        {item.name}
                      </td>
                      <td className="py-4 px-6 text-slate-500 dark:text-slate-450 font-medium">
                        {item.duration ? `${item.duration} Months` : "Flexible"}
                      </td>
                      <td className="py-4 px-6 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => handleEditClick(item)}
                            className="p-1.5 text-slate-550 dark:text-slate-400 hover:text-primary dark:hover:text-primary hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg cursor-pointer transition-colors"
                            title="Edit Program"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteClick(item.id)}
                            className="p-1.5 text-slate-550 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-lg cursor-pointer transition-colors"
                            title="Delete Program"
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
