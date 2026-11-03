"use client";

import React, { useState, useMemo, useEffect, useRef } from "react";
import {
  Search,
  X,
  User,
  Landmark,
  Briefcase,
  Check,
  CheckCircle2,
  Users,
  Filter,
} from "lucide-react";

export interface StaffOption {
  id: string;
  name: string;
  email: string;
  role: string;
  designation?: string;
  departmentId?: string;
  departmentName?: string;
  mobile?: string;
}

interface AssignOfficerModalProps {
  isOpen: boolean;
  onClose: () => void;
  staffOptions: StaffOption[];
  selectedStaffId: string;
  onSelectStaff: (staffId: string) => void;
  title?: string;
  description?: string;
  onConfirm?: () => void;
  isSubmitting?: boolean;
}

export function AssignOfficerModal({
  isOpen,
  onClose,
  staffOptions,
  selectedStaffId,
  onSelectStaff,
  title = "Select Resolution Officer",
  description = "Search faculty and staff members to assign as resolution handler",
  onConfirm,
  isSubmitting = false,
}: AssignOfficerModalProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDept, setSelectedDept] = useState("ALL");
  const [tempSelectedId, setTempSelectedId] = useState(selectedStaffId);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Sync internal state when modal opens
  useEffect(() => {
    if (isOpen) {
      setTempSelectedId(selectedStaffId);
      setSearchQuery("");
      setSelectedDept("ALL");
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 100);
    }
  }, [isOpen, selectedStaffId]);

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  // Extract unique departments for filtering
  const departments = useMemo(() => {
    const set = new Set<string>();
    staffOptions.forEach((s) => {
      if (s.departmentName && s.departmentName.trim()) {
        set.add(s.departmentName.trim());
      }
    });
    return Array.from(set).sort();
  }, [staffOptions]);

  // Client-side filtering
  const filteredStaff = useMemo(() => {
    let list = staffOptions;
    if (selectedDept !== "ALL") {
      list = list.filter(
        (s) => (s.departmentName || "").trim() === selectedDept,
      );
    }

    const query = searchQuery.trim().toLowerCase();
    if (query) {
      list = list.filter((s) => {
        const name = (s.name || "").toLowerCase();
        const email = (s.email || "").toLowerCase();
        const dept = (s.departmentName || "").toLowerCase();
        const designation = (s.designation || "").toLowerCase();
        const role = (s.role || "").toLowerCase().replace(/_/g, " ");
        return (
          name.includes(query) ||
          email.includes(query) ||
          dept.includes(query) ||
          designation.includes(query) ||
          role.includes(query)
        );
      });
    }
    return list;
  }, [staffOptions, searchQuery, selectedDept]);

  if (!isOpen) return null;

  const handleRowClick = (staffId: string) => {
    setTempSelectedId(staffId);
  };

  const handleConfirm = () => {
    if (!tempSelectedId) return;
    onSelectStaff(tempSelectedId);
    if (onConfirm) {
      onConfirm();
    }
    onClose();
  };

  const selectedOfficer = staffOptions.find((s) => s.id === tempSelectedId);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-fade-in">
      {/* Modal Dialog Card */}
      <div
        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-3xl shadow-2xl flex flex-col max-h-[85vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between gap-4">
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              <h2
                id="modal-title"
                className="text-base font-bold text-slate-900 dark:text-slate-100 tracking-tight"
              >
                {title}
              </h2>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {description}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            title="Close (Esc)"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Search & Filter Toolbar */}
        <div className="p-4 bg-slate-50/60 dark:bg-slate-950/40 border-b border-slate-100 dark:border-slate-800 space-y-3">
          <div className="flex flex-col sm:flex-row gap-2.5">
            {/* Search Input */}
            <div className="relative flex-1 group">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-slate-400 group-focus-within:text-primary transition-colors" />
              </div>
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by name, email, department, role, or designation..."
                className="w-full h-10 pl-9 pr-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-750 rounded-xl text-slate-850 dark:text-slate-100 placeholder-slate-400 text-xs focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                  title="Clear search"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            {/* Department Filter */}
            {departments.length > 0 && (
              <div className="relative sm:w-56 shrink-0">
                <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none">
                  <Filter className="h-3.5 w-3.5 text-slate-400" />
                </div>
                <select
                  value={selectedDept}
                  onChange={(e) => setSelectedDept(e.target.value)}
                  className="w-full h-10 pl-8 pr-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-750 rounded-xl text-slate-700 dark:text-slate-300 text-xs focus:outline-none focus:border-primary transition-all cursor-pointer"
                >
                  <option value="ALL">
                    All Departments ({staffOptions.length})
                  </option>
                  {departments.map((dept) => {
                    const count = staffOptions.filter(
                      (s) => (s.departmentName || "").trim() === dept,
                    ).length;
                    return (
                      <option key={dept} value={dept}>
                        {dept} ({count})
                      </option>
                    );
                  })}
                </select>
              </div>
            )}
          </div>

          <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 px-0.5">
            <span>
              Showing{" "}
              <strong className="text-slate-800 dark:text-slate-200">
                {filteredStaff.length}
              </strong>{" "}
              of {staffOptions.length} available staff
            </span>
            {(searchQuery || selectedDept !== "ALL") && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery("");
                  setSelectedDept("ALL");
                }}
                className="text-primary hover:underline font-semibold"
              >
                Reset filters
              </button>
            )}
          </div>
        </div>

        {/* Officers Table Container */}
        <div className="flex-1 overflow-y-auto min-h-[260px] p-2">
          {filteredStaff.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center px-4">
              <div className="p-3 bg-slate-100 dark:bg-slate-800 rounded-full text-slate-400 mb-2">
                <Search className="h-6 w-6" />
              </div>
              <h4 className="text-sm font-bold text-slate-700 dark:text-slate-200">
                No matching officers found
              </h4>
              <p className="text-xs text-slate-450 mt-1 max-w-sm">
                No staff member matches &ldquo;{searchQuery}&rdquo; in{" "}
                {selectedDept === "ALL" ? "any department" : selectedDept}.
              </p>
              <button
                type="button"
                onClick={() => {
                  setSearchQuery("");
                  setSelectedDept("ALL");
                }}
                className="mt-3 px-3 py-1.5 text-xs font-semibold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg transition-colors"
              >
                Clear Search Query
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-150 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-950/20 text-slate-500 uppercase text-[10px] tracking-wider font-bold">
                    <th className="py-2.5 px-3">Faculty / Officer</th>
                    <th className="py-2.5 px-3">Department</th>
                    <th className="py-2.5 px-3">Designation / Role</th>
                    <th className="py-2.5 px-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                  {filteredStaff.map((staff) => {
                    const isSelected = tempSelectedId === staff.id;
                    const initials = (staff.name || "U")
                      .split(" ")
                      .map((w) => w[0])
                      .join("")
                      .slice(0, 2)
                      .toUpperCase();

                    return (
                      <tr
                        key={staff.id}
                        onClick={() => handleRowClick(staff.id)}
                        className={`transition-colors cursor-pointer group ${
                          isSelected
                            ? "bg-primary/10 dark:bg-primary/20 hover:bg-primary/15"
                            : "hover:bg-slate-50/80 dark:hover:bg-slate-800/40"
                        }`}
                      >
                        {/* Name & Email */}
                        <td className="py-3 px-3">
                          <div className="flex items-center gap-2.5">
                            <div
                              className={`h-8 w-8 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 ${
                                isSelected
                                  ? "bg-primary text-white"
                                  : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 group-hover:bg-primary/10 group-hover:text-primary transition-colors"
                              }`}
                            >
                              {initials}
                            </div>
                            <div className="min-w-0">
                              <span className="font-bold text-slate-900 dark:text-slate-100 block truncate">
                                {staff.name}
                              </span>
                              <span className="text-[11px] text-slate-400 block truncate">
                                {staff.email}
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* Department */}
                        <td className="py-3 px-3 whitespace-nowrap">
                          {staff.departmentName ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium text-[11px] border border-slate-200/60 dark:border-slate-700/60">
                              <Landmark className="h-3 w-3 text-slate-400 shrink-0" />
                              <span className="truncate max-w-[150px]">
                                {staff.departmentName}
                              </span>
                            </span>
                          ) : (
                            <span className="text-slate-400 italic text-[11px]">
                              General
                            </span>
                          )}
                        </td>

                        {/* Role / Designation */}
                        <td className="py-3 px-3 whitespace-nowrap">
                          <div className="space-y-0.5">
                            <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200/50 dark:border-slate-700/50">
                              {staff.role.replace(/_/g, " ")}
                            </span>
                            {staff.designation && (
                              <span className="block text-[11px] text-slate-500 dark:text-slate-400 font-medium truncate max-w-[140px]">
                                {staff.designation}
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Action / Select Button */}
                        <td className="py-3 px-3 text-right whitespace-nowrap">
                          {isSelected ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-primary text-white text-xs font-semibold shadow-xs">
                              <Check className="h-3.5 w-3.5" />
                              Selected
                            </span>
                          ) : (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleRowClick(staff.id);
                              }}
                              className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-primary hover:text-white text-slate-700 dark:text-slate-300 text-xs font-semibold transition-all cursor-pointer"
                            >
                              Select
                            </button>
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

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/30 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-xs">
            {selectedOfficer ? (
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                <span className="text-slate-600 dark:text-slate-300">
                  Selected:{" "}
                  <strong className="text-slate-900 dark:text-slate-100 font-bold">
                    {selectedOfficer.name}
                  </strong>{" "}
                  {selectedOfficer.departmentName && (
                    <span className="text-slate-400">
                      ({selectedOfficer.departmentName})
                    </span>
                  )}
                </span>
              </div>
            ) : (
              <span className="text-slate-400 italic">
                Please select an officer from the list above
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              disabled={!tempSelectedId || isSubmitting}
              className="px-4 py-2 text-xs font-semibold text-white bg-primary hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl transition-all shadow-sm active:scale-95 cursor-pointer flex items-center gap-1.5"
            >
              <Check className="h-3.5 w-3.5" />
              <span>Confirm Officer</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
