"use client";

import React from "react";
import {
  Search,
  Edit,
  Trash2,
  Loader2,
  Building2,
  ShieldCheck,
  AlertTriangle,
  Clock,
} from "lucide-react";

interface Props {
  students: any[];
  isLoading: boolean;
  searchQuery: string;
  setSearchQuery: (val: string) => void;
  onEdit: (student: any) => void;
  onDelete: (id: string) => void;
}

export default function StudentTable({
  students,
  isLoading,
  searchQuery,
  setSearchQuery,
  onEdit,
  onDelete,
}: Props) {
  const getStatusBadge = (status: string) => {
    const s = (status || "").toUpperCase();
    if (s === "ACTIVE")
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 border border-emerald-200/50">
          <ShieldCheck className="h-3 w-3" />
          Active
        </span>
      );
    if (s === "PENDING")
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400 border border-amber-200/50">
          <Clock className="h-3 w-3" />
          Pending
        </span>
      );
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 border border-red-200/50">
        <AlertTriangle className="h-3 w-3" />
        {s || "UNKNOWN"}
      </span>
    );
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden flex flex-col min-h-[450px]">
      <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row gap-4 justify-between items-center bg-slate-50/50 dark:bg-slate-900/50">
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-slate-50">
            Student Registry
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Manage enrolled student records
          </p>
        </div>
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search name, roll, email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-10 pl-9 pr-4 text-sm bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:border-primary outline-none"
          />
        </div>
      </div>

      <div className="overflow-x-auto flex-1">
        <table className="w-full text-left text-sm whitespace-nowrap">
          <thead className="bg-slate-50 dark:bg-slate-900/80 text-slate-500 dark:text-slate-400 font-medium border-b border-slate-200 dark:border-slate-800">
            <tr>
              <th className="px-6 py-4">Student Info</th>
              <th className="px-6 py-4">Roll & Batch</th>
              <th className="px-6 py-4">Department & Degree</th>
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
            {isLoading ? (
              <tr>
                <td
                  colSpan={4}
                  className="px-6 py-12 text-center text-slate-500"
                >
                  <Loader2 className="h-6 w-6 animate-spin text-primary mx-auto mb-2" />
                  Loading records...
                </td>
              </tr>
            ) : students.length === 0 ? (
              <tr>
                <td
                  colSpan={4}
                  className="px-6 py-12 text-center text-slate-500"
                >
                  No students found matching your criteria.
                </td>
              </tr>
            ) : (
              students.map((u) => (
                <tr
                  key={u.id}
                  className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors"
                >
                  <td className="px-6 py-4">
                    <div className="font-semibold text-slate-900 dark:text-slate-100">
                      {u.name}
                    </div>
                    <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      {u.email}
                    </div>
                    <div className="mt-1.5">{getStatusBadge(u.status)}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="font-mono text-xs font-semibold text-slate-800 dark:text-slate-300">
                      {u.rollNumber}
                    </div>
                    <div className="text-xs text-slate-400 mt-0.5">
                      Batch: {u.batch || "N/A"}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300 text-xs font-medium">
                      <Building2 className="h-3.5 w-3.5 text-slate-400" />
                      {u.departmentName}
                    </div>
                    {(u.degree || u.specialization) && (
                      <div className="text-xs text-slate-400 mt-0.5 ml-5">
                        {u.degree}{" "}
                        {u.specialization && ` - ${u.specialization}`}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => onEdit(u)}
                        className="p-1.5 text-slate-400 hover:text-primary bg-slate-50 hover:bg-primary/10 dark:bg-slate-800 dark:hover:bg-primary/20 rounded-lg transition-colors cursor-pointer"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => onDelete(u.id)}
                        className="p-1.5 text-slate-400 hover:text-red-500 bg-slate-50 hover:bg-red-50 dark:bg-slate-800 dark:hover:bg-red-950/30 rounded-lg transition-colors cursor-pointer"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
