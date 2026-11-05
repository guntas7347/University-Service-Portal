"use client";

import React from "react";
import {
  User,
  Mail,
  Hash,
  Smartphone,
  Calendar,
  Save,
  Loader2,
  X,
  Landmark,
  ShieldCheck,
} from "lucide-react";

interface Props {
  form: any;
  handleChange: (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => void;
  isSubmitting: boolean;
  onCancel: () => void;
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  departments: { id: string; name: string }[];
  isAdmin: boolean;
}

export default function StudentForm({
  form = {},
  handleChange,
  isSubmitting,
  onCancel,
  onSubmit,
  departments,
  isAdmin,
}: Props) {
  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="flex justify-between items-center bg-slate-900 dark:bg-slate-800 text-white px-5 py-3.5 rounded-2xl shadow-sm">
        <h2 className="text-sm font-bold tracking-wide">
          Edit Student Profile
        </h2>
        <button
          type="button"
          onClick={onCancel}
          className="p-1 hover:bg-white/20 rounded-full transition-colors"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
        {/* Academic & Access */}
        <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3 mb-2">
          <ShieldCheck className="h-4 w-4 text-primary" />
          <h3 className="text-xs font-bold uppercase text-slate-800 dark:text-slate-200 tracking-wider">
            Academic & Access
          </h3>
        </div>

        <div>
          <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
            Roll Number
          </label>
          <div className="relative">
            <Hash className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              name="rollNumber"
              required
              disabled={isSubmitting}
              value={form?.rollNumber || ""}
              onChange={handleChange}
              className="w-full h-10 pl-9 pr-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:border-primary outline-none"
            />
          </div>
        </div>

        {isAdmin ? (
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
              Department
            </label>
            <div className="relative">
              <Landmark className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <select
                name="departmentId"
                disabled={isSubmitting}
                value={form?.departmentId || ""}
                onChange={handleChange}
                className="w-full h-10 pl-9 pr-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:border-primary outline-none"
              >
                <option value="">Unassigned</option>
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        ) : (
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
              Department (Locked)
            </label>
            <div className="w-full h-10 px-3 flex items-center bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-500 cursor-not-allowed">
              Managed within your department
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
              Graduation Batch
            </label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="number"
                name="batch"
                disabled={isSubmitting}
                value={form?.batch || ""}
                onChange={handleChange}
                className="w-full h-10 pl-9 pr-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:border-primary outline-none"
              />
            </div>
          </div>
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
              Status
            </label>
            <select
              name="status"
              disabled={isSubmitting}
              value={form?.status || "ACTIVE"}
              onChange={handleChange}
              className="w-full h-10 px-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:border-primary outline-none"
            >
              <option value="ACTIVE">Active</option>
              <option value="PENDING">Pending</option>
              <option value="SUSPENDED">Suspended</option>
            </select>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
        {/* Personal Details */}
        <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3 mb-2">
          <User className="h-4 w-4 text-primary" />
          <h3 className="text-xs font-bold uppercase text-slate-800 dark:text-slate-200 tracking-wider">
            Personal Details
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
              className="w-full h-10 pl-9 pr-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:border-primary outline-none"
            />
          </div>
        </div>

        <div>
          <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
            Email
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
              className="w-full h-10 pl-9 pr-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:border-primary outline-none"
            />
          </div>
        </div>

        <div>
          <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
            Mobile
          </label>
          <div className="relative">
            <Smartphone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="tel"
              name="mobile"
              disabled={isSubmitting}
              value={form?.mobile || ""}
              onChange={handleChange}
              className="w-full h-10 pl-9 pr-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:border-primary outline-none"
            />
          </div>
        </div>

        <div>
          <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
            Gender
          </label>
          <select
            name="gender"
            disabled={isSubmitting}
            value={form?.gender || ""}
            onChange={handleChange}
            className="w-full h-10 px-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:border-primary outline-none"
          >
            <option value="">Select Gender</option>
            <option value="MALE">Male</option>
            <option value="FEMALE">Female</option>
            <option value="OTHER">Other</option>
          </select>
        </div>
      </div>

      <div className="flex gap-3 pt-2">
        <button
          type="button"
          onClick={onCancel}
          disabled={isSubmitting}
          className="flex-1 h-11 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold rounded-xl text-sm transition-colors cursor-pointer"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="flex-1 h-11 bg-primary hover:bg-primary/90 text-white font-semibold rounded-xl text-sm transition-all shadow-md shadow-primary/20 flex items-center justify-center gap-2 cursor-pointer"
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
