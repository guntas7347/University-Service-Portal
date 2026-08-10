"use client";

import React from "react";
import { User, Mail, Smartphone, Briefcase, Plus, Loader2, X, Shield, Landmark } from "lucide-react";

interface UserFormProps {
  form: any;
  handleChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
  isSubmitting: boolean;
  editingId: string | null;
  handleCancelEdit: () => void;
  departments: { id: string; code: string; name: string }[];
  currentUser: { role: string; departmentId?: string; departmentName?: string } | null;
  selectedRights: string[];
  handleRightCheckboxChange: (value: string, checked: boolean) => void;
  rightsOptions: { value: string; label: string }[];
  handleSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
}

export default function UserForm({
  form,
  handleChange,
  isSubmitting,
  editingId,
  handleCancelEdit,
  departments,
  currentUser,
  selectedRights,
  handleRightCheckboxChange,
  rightsOptions,
  handleSubmit
}: UserFormProps) {
  const isHOD = currentUser?.role.toUpperCase() === "HOD";
  const isAdmin = currentUser?.role.toUpperCase() === "ADMIN" || currentUser?.role.toUpperCase() === "SUPER_ADMIN";

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-login-radius p-6 shadow-sm h-fit">
      <div className="mb-6 flex justify-between items-center">
        <h2 className="text-lg font-bold text-slate-900 dark:text-slate-50">
          {editingId ? "Edit Staff Account" : "Register Staff User"}
        </h2>
        {editingId && (
          <button 
            type="button" 
            onClick={handleCancelEdit}
            className="p-1 text-slate-450 hover:text-slate-650 dark:hover:text-slate-250 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg cursor-pointer"
            title="Cancel Edit"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        
        {/* Full Name */}
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
              placeholder="e.g. Dr. Ramesh Kumar"
              className="w-full h-11 pl-9 pr-4 py-2 bg-slate-50/50 dark:bg-slate-955/50 border border-slate-200 dark:border-slate-800 rounded-login-radius text-slate-850 dark:text-slate-200 placeholder-slate-450 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all disabled:opacity-50"
            />
          </div>
        </div>

        {/* Email Address */}
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
              placeholder="e.g. rkumar@sbs.edu"
              className="w-full h-11 pl-9 pr-4 py-2 bg-slate-50/50 dark:bg-slate-955/50 border border-slate-200 dark:border-slate-800 rounded-login-radius text-slate-850 dark:text-slate-200 placeholder-slate-455 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all disabled:opacity-50"
            />
          </div>
        </div>

        {/* Designation */}
        <div>
          <label htmlFor="designation" className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-2">
            Designation (Optional)
          </label>
          <div className="relative group">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Briefcase className="h-4 w-4 text-slate-400 group-focus-within:text-primary transition-colors" />
            </div>
            <input
              type="text"
              id="designation"
              name="designation"
              disabled={isSubmitting}
              value={form.designation}
              onChange={handleChange}
              placeholder="e.g. Professor / Head of Department"
              className="w-full h-11 pl-9 pr-4 py-2 bg-slate-50/50 dark:bg-slate-955/50 border border-slate-200 dark:border-slate-800 rounded-login-radius text-slate-850 dark:text-slate-200 placeholder-slate-455 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all disabled:opacity-50"
            />
          </div>
        </div>

        {/* Mobile Number */}
        <div>
          <label htmlFor="mobileNumber" className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-2">
            Mobile Number (Optional)
          </label>
          <div className="relative group">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Smartphone className="h-4 w-4 text-slate-400 group-focus-within:text-primary transition-colors" />
            </div>
            <input
              type="tel"
              id="mobileNumber"
              name="mobileNumber"
              disabled={isSubmitting}
              value={form.mobileNumber}
              onChange={handleChange}
              placeholder="e.g. 9876543210"
              className="w-full h-11 pl-9 pr-4 py-2 bg-slate-50/50 dark:bg-slate-955/50 border border-slate-200 dark:border-slate-800 rounded-login-radius text-slate-850 dark:text-slate-200 placeholder-slate-455 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all disabled:opacity-50"
            />
          </div>
        </div>

        {/* Role select (Only Admin can change roles) */}
        <div>
          <label htmlFor="role" className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-2">
            Administrative Role
          </label>
          {isAdmin ? (
            <select
              id="role"
              name="role"
              required
              disabled={isSubmitting}
              value={form.role}
              onChange={handleChange}
              className="w-full h-11 px-4 py-2 bg-slate-50/50 dark:bg-slate-955/50 border border-slate-200 dark:border-slate-800 rounded-login-radius text-slate-850 dark:text-slate-200 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all disabled:opacity-50"
            >
              <option value="FACULTY">Faculty / Staff</option>
              <option value="HOD">Head of Department (HOD)</option>
              <option value="ADMIN">Administrator</option>
              <option value="SUPER_ADMIN">Super Administrator</option>
            </select>
          ) : (
            <div className="w-full h-11 px-4 py-3 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-800 rounded-login-radius text-slate-500 dark:text-slate-400 text-sm flex items-center select-none font-medium">
              Faculty / Staff (Restricted by HOD Role)
            </div>
          )}
        </div>

        {/* Department select */}
        {((isAdmin && (form.role === "FACULTY" || form.role === "HOD")) || isHOD) && (
          <div>
            <label htmlFor="departmentId" className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-2">
              Department {form.role === "HOD" ? "(Required)" : "(Optional)"}
            </label>
            {isAdmin ? (
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Landmark className="h-4 w-4 text-slate-400" />
                </div>
                <select
                  id="departmentId"
                  name="departmentId"
                  required={form.role === "HOD"}
                  disabled={isSubmitting}
                  value={form.departmentId}
                  onChange={handleChange}
                  className="w-full h-11 pl-9 pr-4 py-2 bg-slate-50/50 dark:bg-slate-955/50 border border-slate-200 dark:border-slate-800 rounded-login-radius text-slate-850 dark:text-slate-200 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all disabled:opacity-50"
                >
                  <option value="">No Assigned Department</option>
                  {departments.map((dept) => (
                    <option key={dept.id} value={dept.id}>
                      {dept.name} ({dept.code})
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              // HOD role department is locked to their own department
              <div className="w-full h-11 px-4 py-3 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-800 rounded-login-radius text-slate-550 dark:text-slate-350 text-sm flex items-center select-none font-semibold">
                {currentUser?.departmentName || "My Department"} (Locked)
              </div>
            )}
          </div>
        )}

        {/* Gender select */}
        <div>
          <label htmlFor="gender" className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-2">
            Gender (Optional)
          </label>
          <select
            id="gender"
            name="gender"
            disabled={isSubmitting}
            value={form.gender}
            onChange={handleChange}
            className="w-full h-11 px-4 py-2 bg-slate-50/50 dark:bg-slate-955/50 border border-slate-200 dark:border-slate-800 rounded-login-radius text-slate-850 dark:text-slate-200 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all disabled:opacity-50"
          >
            <option value="">Select Gender</option>
            <option value="MALE">Male</option>
            <option value="FEMALE">Female</option>
            <option value="OTHER">Other</option>
          </select>
        </div>

        {/* Rights checklist (Only Admin can manage administrative action rights) */}
        {isAdmin && (
          <div className="space-y-2 pt-2">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-350">
              Configure Action Rights
            </label>
            
            <div className="bg-slate-55 bg-slate-50/60 dark:bg-slate-955/30 border border-slate-150 dark:border-slate-850 rounded-login-radius p-3.5 space-y-2.5">
              {rightsOptions.map((item) => {
                const isChecked = selectedRights.includes(item.value);
                return (
                  <div key={item.value} className="flex items-center gap-2.5 select-none">
                    <input
                      id={`right-${item.value}`}
                      type="checkbox"
                      disabled={isSubmitting}
                      checked={isChecked}
                      onChange={(e) => handleRightCheckboxChange(item.value, e.target.checked)}
                      className="h-4 w-4 text-primary focus:ring-primary border-slate-300 dark:border-slate-800 rounded cursor-pointer"
                    />
                    <label 
                      htmlFor={`right-${item.value}`} 
                      className="text-xs text-slate-655 dark:text-slate-300 font-medium cursor-pointer"
                    >
                      {item.label}
                    </label>
                  </div>
                );
              })}
            </div>
          </div>
        )}

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
                <span>{editingId ? "Save User" : "Register User"}</span>
              </>
            )}
          </button>
        </div>

      </form>
    </div>
  );
}
