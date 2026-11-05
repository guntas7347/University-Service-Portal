"use client";

import React from "react";
import {
  User,
  Mail,
  Smartphone,
  Save,
  Loader2,
  X,
  ShieldAlert,
  Contact2,
} from "lucide-react";

interface UserFormProps {
  form: any;
  handleChange: (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => void;
  isSubmitting: boolean;
  handleCancelEdit: () => void;
  departments: { id: string; name: string }[];
  selectedRights: string[];
  setSelectedRights: React.Dispatch<React.SetStateAction<string[]>>;
  handleSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  userRights?: string[];
}

const RIGHTS_OPTIONS = [
  { value: "ADMIN", label: "System Administrator (Full Access)" },
  { value: "VIEW_DEPARTMENT_TICKETS", label: "View Department Tickets" },
  { value: "MANAGE_DEPARTMENT_USERS", label: "Manage Department Users" },
];

export default function UserForm({
  form = {},
  handleChange,
  isSubmitting,
  handleCancelEdit,
  departments,
  selectedRights,
  setSelectedRights,
  handleSubmit,
  userRights = [],
}: UserFormProps) {
  // Custom Role handler to auto-tick rights when HOD is selected
  const handleRoleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    handleChange(e);

    if (e.target.value === "HOD") {
      setSelectedRights((prev) => {
        const newRights = new Set(prev);
        newRights.add("VIEW_DEPARTMENT_TICKETS");
        newRights.add("MANAGE_DEPARTMENT_USERS");
        return Array.from(newRights);
      });
    }
  };

  const handleRightToggle = (value: string, checked: boolean) => {
    if (checked) setSelectedRights((prev) => [...prev, value]);
    else setSelectedRights((prev) => prev.filter((r) => r !== value));
  };

  const hasRole = userRights.some((role) =>
    ["ADMIN", "MANAGE_DEPARTMENT_USERS"].includes(role),
  );

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Form Header */}
      <div className="flex justify-between items-center bg-slate-900 dark:bg-slate-800 text-white px-5 py-3.5 rounded-2xl shadow-sm">
        <h2 className="text-sm font-bold tracking-wide">Edit Staff Account</h2>
        <button
          type="button"
          onClick={handleCancelEdit}
          className="p-1 hover:bg-white/20 rounded-full transition-colors cursor-pointer"
          title="Close Editor"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {hasRole && (
        <div>
          {/* CARD 1: System & Access Settings */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3 mb-2">
              <ShieldAlert className="h-4 w-4 text-primary" />
              <h3 className="text-xs font-bold uppercase text-slate-800 dark:text-slate-200 tracking-wider">
                System & Access
              </h3>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                Role / Title
              </label>
              <select
                name="role"
                required
                disabled={isSubmitting}
                value={form?.role || "FACULTY"}
                onChange={handleRoleChange}
                className="w-full h-10 px-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none"
              >
                <option value="FACULTY">Faculty / Staff</option>
                <option value="HOD">Head of Department (HOD)</option>
                <option value="ADMIN">Administrator</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                Assigned Department
              </label>
              <select
                name="departmentId"
                disabled={isSubmitting}
                value={form?.departmentId || ""}
                onChange={handleChange}
                className="w-full h-10 px-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none"
              >
                <option value="">No Department Assigned</option>
                {departments.map((dept) => (
                  <option key={dept.id} value={dept.id}>
                    {dept.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="pt-2">
              <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-2">
                Action Rights
              </label>
              <div className="space-y-2.5 bg-slate-50 dark:bg-slate-950 p-3.5 rounded-xl border border-slate-100 dark:border-slate-800">
                {RIGHTS_OPTIONS.map((item) => (
                  <label
                    key={item.value}
                    className="flex items-center gap-3 cursor-pointer group"
                  >
                    <input
                      type="checkbox"
                      disabled={isSubmitting}
                      checked={selectedRights.includes(item.value)}
                      onChange={(e) =>
                        handleRightToggle(item.value, e.target.checked)
                      }
                      className="h-4 w-4 text-primary rounded border-slate-300 focus:ring-primary cursor-pointer"
                    />
                    <span className="text-xs font-medium text-slate-700 dark:text-slate-300 group-hover:text-primary transition-colors">
                      {item.label}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CARD 2: Personal Information */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
        <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3 mb-2">
          <Contact2 className="h-4 w-4 text-primary" />
          <h3 className="text-xs font-bold uppercase text-slate-800 dark:text-slate-200 tracking-wider">
            Personal Data
          </h3>
        </div>

        <div>
          <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
            Full Name
          </label>
          <div className="relative">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              name="name"
              required
              disabled={isSubmitting}
              value={form?.name || ""}
              onChange={handleChange}
              className="w-full h-10 pl-9 pr-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none"
            />
          </div>
        </div>

        <div>
          <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
            Email Address
          </label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="email"
              name="email"
              required
              disabled={isSubmitting}
              value={form?.email || ""}
              onChange={handleChange}
              className="w-full h-10 pl-9 pr-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none"
            />
          </div>
        </div>

        <div>
          <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
            Mobile Number
          </label>
          <div className="relative">
            <Smartphone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="tel"
              name="mobile"
              disabled={isSubmitting}
              value={form?.mobile || ""}
              onChange={handleChange}
              className="w-full h-10 pl-9 pr-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none"
            />
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3 pt-2">
        <button
          type="button"
          onClick={handleCancelEdit}
          disabled={isSubmitting}
          className="flex-1 h-11 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold rounded-xl text-sm transition-colors cursor-pointer"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="flex-1 h-11 bg-primary hover:bg-primary/90 text-white font-semibold rounded-xl text-sm transition-all shadow-md shadow-primary/20 cursor-pointer flex items-center justify-center gap-2"
        >
          {isSubmitting ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Save className="h-4 w-4" />
          )}
          <span>Save Changes</span>
        </button>
      </div>
    </form>
  );
}
