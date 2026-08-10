"use client";

import React from "react";
import { Search, Filter, Loader2, Users, Edit, Trash2, FileText, Landmark } from "lucide-react";

interface UserTableProps {
  filteredStaff: any[];
  isPageLoading: boolean;
  searchQuery: string;
  setSearchQuery: (val: string) => void;
  roleFilter: string;
  setRoleFilter: (val: string) => void;
  handleEditClick: (u: any) => void;
  handleDeleteClick: (id: string) => void;
  currentUser: { id?: string; role: string; departmentId?: string } | null;
  getRoleBadge: (role: string) => React.ReactNode;
}

export default function UserTable({
  filteredStaff,
  isPageLoading,
  searchQuery,
  setSearchQuery,
  roleFilter,
  setRoleFilter,
  handleEditClick,
  handleDeleteClick,
  currentUser,
  getRoleBadge
}: UserTableProps) {
  const isHOD = currentUser?.role.toUpperCase() === "HOD";
  const isAdmin = currentUser?.role.toUpperCase() === "ADMIN" || currentUser?.role.toUpperCase() === "SUPER_ADMIN";

  // Helper check to determine if a staff row can be edited/deleted by the current user
  const canManageUser = (u: any) => {
    // Cannot manage self
    if (u.id === currentUser?.id) return false;

    // Admin can manage everyone (except self, handled above)
    if (isAdmin) return true;

    // HOD can only manage FACULTY members in their own department
    if (isHOD) {
      return u.role.toUpperCase() === "FACULTY" && u.departmentId === currentUser?.departmentId;
    }

    return false;
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-login-radius shadow-sm lg:col-span-2 overflow-hidden flex flex-col min-h-[450px]">
      
      {/* Table Header with Local Search and Filters */}
      <div className="p-6 border-b border-slate-200 dark:border-slate-800 space-y-4">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-slate-50">
              Staff Members
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              {isHOD 
                ? "Manage faculty members under your department" 
                : "University administrative officers and academic faculty members"}
            </p>
          </div>
        </div>

        {/* Inputs bar */}
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Search */}
          <div className="relative flex-1 group">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-slate-400 group-focus-within:text-primary transition-colors" />
            </div>
            <input
              type="text"
              placeholder="Search name or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-10 pl-9 pr-4 py-2 bg-slate-50/50 dark:bg-slate-955/50 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-850 dark:text-slate-200 placeholder-slate-405 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
            />
          </div>
          
          {/* Filter (Only show to Admin, HOD's list is already restricted to FACULTY under their department) */}
          {isAdmin && (
            <div className="relative w-full sm:w-44 group">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Filter className="h-4 w-4 text-slate-400 group-focus-within:text-primary transition-colors" />
              </div>
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="w-full h-10 pl-9 pr-4 py-2 bg-slate-50/50 dark:bg-slate-955/50 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-850 dark:text-slate-200 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
              >
                <option value="ALL">All Roles</option>
                <option value="FACULTY">Faculty / Staff</option>
                <option value="HOD">Heads of Department (HOD)</option>
                <option value="ADMIN">Administrators</option>
                <option value="SUPER_ADMIN">Super Admins</option>
              </select>
            </div>
          )}
        </div>
      </div>

      {/* Table details */}
      {isPageLoading ? (
        <div className="flex-1 flex flex-col items-center justify-center gap-2 py-20">
          <Loader2 className="h-8 w-8 text-primary animate-spin" />
          <p className="text-sm text-slate-450 font-medium">Querying staff accounts...</p>
        </div>
      ) : filteredStaff.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center py-20 text-center gap-2 px-4">
          <Users className="h-10 w-10 text-slate-350 dark:text-slate-650" />
          <h4 className="font-bold text-slate-700 dark:text-slate-405 text-sm">No Accounts Found</h4>
          <p className="text-xs text-slate-400 max-w-xs mt-1">
            No staff members match the query parameters or no registrations exist.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-955/20 text-slate-500 dark:text-slate-400 text-xs font-semibold uppercase">
                <th className="py-3.5 px-6">Staff Member</th>
                <th className="py-3.5 px-6">Role</th>
                <th className="py-3.5 px-6">Department</th>
                <th className="py-3.5 px-6">Assigned Rights</th>
                <th className="py-3.5 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-150 dark:divide-slate-850">
              {filteredStaff.map((u) => (
                <tr key={u.id} className="hover:bg-slate-50/20 dark:hover:bg-slate-800/5 transition-colors text-sm">
                  
                  {/* Name & Contact */}
                  <td className="py-4 px-6">
                    <div className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                      <span>{u.name}</span>
                      {u.id === currentUser?.id && (
                        <span className="px-1.5 py-0.5 text-[9px] bg-slate-100 dark:bg-slate-800 rounded font-bold text-slate-400 uppercase tracking-wider">
                          You
                        </span>
                      )}
                    </div>
                    {u.designation && (
                      <div className="text-xs font-semibold text-primary dark:text-primary/90 mt-0.5">
                        {u.designation}
                      </div>
                    )}
                    <div className="text-xs text-slate-450 font-medium mt-0.5">
                      {u.email}
                    </div>
                    {u.mobileNumber && (
                      <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                        {u.mobileNumber}
                      </div>
                    )}
                  </td>

                  {/* Role */}
                  <td className="py-4 px-6 whitespace-nowrap">
                    {getRoleBadge(u.role)}
                  </td>

                  {/* Department */}
                  <td className="py-4 px-6 whitespace-nowrap">
                    {u.departmentName ? (
                      <div className="flex items-center gap-1.5 text-xs text-slate-655 dark:text-slate-300 font-semibold">
                        <Landmark className="h-3.5 w-3.5 text-primary shrink-0" />
                        <span>{u.departmentName}</span>
                      </div>
                    ) : (
                      <span className="text-slate-400 text-xs italic">Unassigned</span>
                    )}
                  </td>

                  {/* Rights tags */}
                  <td className="py-4 px-6 max-w-xs">
                    {u.rights.length === 0 ? (
                      <span className="text-slate-400 text-xs italic">No rights assigned</span>
                    ) : (
                      <div className="flex flex-wrap gap-1">
                        {u.rights.map((right: string) => (
                          <span 
                            key={right} 
                            className="inline-flex px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-[10px] font-semibold tracking-wider font-mono border border-slate-200/20"
                            title={right}
                          >
                            {right.replace("_", " ")}
                          </span>
                        ))}
                      </div>
                    )}
                  </td>

                  {/* Actions */}
                  <td className="py-4 px-6 text-right">
                    <div className="flex items-center justify-end gap-2">
                      {canManageUser(u) ? (
                        <>
                          <button
                            type="button"
                            onClick={() => handleEditClick(u)}
                            className="p-1.5 text-slate-550 dark:text-slate-400 hover:text-primary dark:hover:text-primary hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg cursor-pointer transition-colors"
                            title="Edit Account"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteClick(u.id)}
                            className="p-1.5 text-slate-550 dark:text-slate-400 hover:text-red-650 dark:hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-lg cursor-pointer transition-colors"
                            title="Delete Account"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </>
                      ) : (
                        <span className="text-slate-400 text-xs italic pr-2 select-none">Locked</span>
                      )}
                    </div>
                  </td>

                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
