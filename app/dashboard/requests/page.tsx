"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { 
  Inbox, 
  Search, 
  Filter, 
  Loader2, 
  AlertTriangle,
  Clock,
  CheckCircle,
  Info,
  XCircle,
  ChevronRight
} from "lucide-react";
import { getAllRequests } from "@/lib/prisma/actions/requests";
import { getCategories } from "@/lib/prisma/actions/categories";

interface RequestRow {
  id: string;
  ticketId: string;
  subject: string;
  type: string;
  priority: string;
  status: string;
  category: string;
  createdByName: string;
  assignedToName: string;
  date: string;
}

interface CategoryOption {
  id: string;
  name: string;
}

export default function RequestsPage() {
  const router = useRouter();
  const [requests, setRequests] = useState<RequestRow[]>([]);
  const [categories, setCategories] = useState<CategoryOption[]>([]);
  const [userRole, setUserRole] = useState("STUDENT");
  const [isPageLoading, setIsPageLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("ALL");
  const [priorityFilter, setPriorityFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");

  useEffect(() => {
    const loadData = async () => {
      setIsPageLoading(true);
      const [reqResponse, catResponse] = await Promise.all([
        getAllRequests(),
        getCategories()
      ]);

      if (reqResponse.success && reqResponse.requests) {
        setRequests(reqResponse.requests);
        setUserRole(reqResponse.role || "STUDENT");
      } else {
        setErrorMsg(reqResponse.message || "Failed to load requests.");
      }

      if (catResponse.success && catResponse.categories) {
        setCategories(catResponse.categories);
      }
      setIsPageLoading(false);
    };
    loadData();
  }, []);

  // Compute status badges
  const getStatusBadge = (status: string) => {
    const s = status.toUpperCase();
    if (s === "SUBMITTED" || s === "ASSIGNED" || s === "DRAFT") {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 dark:bg-amber-955/35 text-amber-800 dark:text-amber-300 border border-amber-200/30">
          <Clock className="h-3 w-3" />
          <span>Pending</span>
        </span>
      );
    }
    if (s === "UNDER_REVIEW" || s === "IN_PROGRESS" || s === "WAITING_FOR_STUDENT") {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 dark:bg-blue-955/35 text-blue-800 dark:text-blue-300 border border-blue-200/30">
          <Info className="h-3 w-3" />
          <span>Under Investigation</span>
        </span>
      );
    }
    if (s === "RESOLVED" || s === "CLOSED") {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 dark:bg-emerald-955/35 text-emerald-800 dark:text-emerald-300 border border-emerald-200/30">
          <CheckCircle className="h-3 w-3" />
          <span>Resolved</span>
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-50 dark:bg-red-955/35 text-red-800 dark:text-red-300 border border-red-200/30">
        <XCircle className="h-3 w-3" />
        <span>Closed / Rejected</span>
      </span>
    );
  };

  const getPriorityBadge = (priority: string) => {
    const p = priority.toUpperCase();
    if (p === "URGENT") {
      return (
        <span className="inline-flex px-2 py-0.5 rounded text-[10px] font-bold bg-red-55/15 text-red-600 dark:text-red-400">
          Urgent
        </span>
      );
    }
    if (p === "HIGH") {
      return (
        <span className="inline-flex px-2 py-0.5 rounded text-[10px] font-bold bg-orange-55/15 text-orange-600 dark:text-orange-400">
          High
        </span>
      );
    }
    if (p === "MEDIUM") {
      return (
        <span className="inline-flex px-2 py-0.5 rounded text-[10px] font-bold bg-blue-55/15 text-blue-600 dark:text-blue-400">
          Medium
        </span>
      );
    }
    return (
      <span className="inline-flex px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400">
        Low
      </span>
    );
  };

  const formatDate = (isoString: string) => {
    try {
      return new Date(isoString).toLocaleDateString("en-US", {
        month: "short",
        day: "2-digit",
        year: "numeric"
      });
    } catch {
      return "N/A";
    }
  };

  // Local state filtering and search
  const filteredRequests = requests.filter((r) => {
    const matchesSearch = 
      r.ticketId.toLowerCase().includes(searchQuery.toLowerCase()) || 
      r.subject.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory = 
      categoryFilter === "ALL" || 
      r.category.toLowerCase() === categoryFilter.toLowerCase();

    const matchesPriority = 
      priorityFilter === "ALL" || 
      r.priority.toUpperCase() === priorityFilter.toUpperCase();

    const matchesStatus = () => {
      if (statusFilter === "ALL") return true;
      const s = r.status.toUpperCase();
      if (statusFilter === "PENDING") return s === "SUBMITTED" || s === "ASSIGNED" || s === "DRAFT";
      if (statusFilter === "INVESTIGATION") return s === "UNDER_REVIEW" || s === "IN_PROGRESS" || s === "WAITING_FOR_STUDENT";
      if (statusFilter === "RESOLVED") return s === "RESOLVED" || s === "CLOSED";
      return s === "REJECTED" || s === "CANCELLED";
    };

    return matchesSearch && matchesCategory && matchesPriority && matchesStatus();
  });

  const isStudent = userRole === "STUDENT";

  return (
    <div className="space-y-6">
      
      {/* Title Header */}
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 dark:text-slate-50 tracking-tight">
          {isStudent ? "My Grievances" : "All Student Requests"}
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          {isStudent 
            ? "Track resolution stages and timeline history of complaints filed by you" 
            : "Review, assign, and address student complaints and query requests"
          }
        </p>
      </div>

      {/* Main card panel */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-login-radius shadow-sm flex flex-col min-h-[450px]">
        
        {/* Table Controls (Search & Filters) */}
        <div className="p-6 border-b border-slate-200 dark:border-slate-800 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {/* Search query input */}
            <div className="relative group flex-1">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-slate-400 group-focus-within:text-primary transition-colors" />
              </div>
              <input
                type="text"
                placeholder="Search ticket code or subject..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-10 pl-9 pr-4 py-2 bg-slate-50/50 dark:bg-slate-955/50 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-850 dark:text-slate-200 placeholder-slate-405 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
              />
            </div>

            {/* Category filter */}
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Filter className="h-4 w-4 text-slate-400 group-focus-within:text-primary transition-colors" />
              </div>
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="w-full h-10 pl-9 pr-4 py-2 bg-slate-50/50 dark:bg-slate-955/50 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-850 dark:text-slate-200 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
              >
                <option value="ALL">All Categories</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.name}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Priority filter */}
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Filter className="h-4 w-4 text-slate-400 group-focus-within:text-primary transition-colors" />
              </div>
              <select
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
                className="w-full h-10 pl-9 pr-4 py-2 bg-slate-50/50 dark:bg-slate-955/50 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-850 dark:text-slate-200 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
              >
                <option value="ALL">All Priorities</option>
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
                <option value="URGENT">Urgent</option>
              </select>
            </div>

            {/* Status filter */}
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Filter className="h-4 w-4 text-slate-400 group-focus-within:text-primary transition-colors" />
              </div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full h-10 pl-9 pr-4 py-2 bg-slate-50/50 dark:bg-slate-955/50 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-850 dark:text-slate-200 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
              >
                <option value="ALL">All Statuses</option>
                <option value="PENDING">Pending</option>
                <option value="INVESTIGATION">Under Investigation</option>
                <option value="RESOLVED">Resolved</option>
                <option value="REJECTED">Closed / Rejected</option>
              </select>
            </div>

          </div>
        </div>

        {/* Table records display */}
        {isPageLoading ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-2 py-20">
            <Loader2 className="h-8 w-8 text-primary animate-spin" />
            <p className="text-sm text-slate-450 font-medium">Fetching tickets database...</p>
          </div>
        ) : errorMsg ? (
          <div className="flex-1 flex flex-col items-center justify-center py-20 text-center gap-2 px-4">
            <AlertTriangle className="h-10 w-10 text-red-500" />
            <h4 className="font-bold text-slate-700 dark:text-slate-450 text-sm">Failed to retrieve records</h4>
            <p className="text-xs text-slate-400 max-w-xs mt-1">{errorMsg}</p>
          </div>
        ) : filteredRequests.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center py-20 text-center gap-2 px-4">
            <Inbox className="h-10 w-10 text-slate-350 dark:text-slate-650" />
            <h4 className="font-bold text-slate-700 dark:text-slate-405 text-sm">No Grievances Found</h4>
            <p className="text-xs text-slate-400 max-w-xs mt-1">
              No matching tickets found under the selected filters or search parameters.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-955/20 text-slate-500 dark:text-slate-400 text-xs font-semibold uppercase">
                  <th className="py-3.5 px-6">ID & Subject</th>
                  <th className="py-3.5 px-6">Category</th>
                  {!isStudent && <th className="py-3.5 px-6">Filed By</th>}
                  <th className="py-3.5 px-6">Priority</th>
                  <th className="py-3.5 px-6">Status</th>
                  <th className="py-3.5 px-6">Assigned To</th>
                  <th className="py-3.5 px-6 text-right">Date Filed</th>
                  <th className="py-3.5 px-6"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-155 dark:divide-slate-850">
                {filteredRequests.map((item) => (
                  <tr 
                    key={item.id} 
                    onClick={() => router.push(`/dashboard/requests/${item.id}`)}
                    className="hover:bg-slate-50/30 dark:hover:bg-slate-800/10 cursor-pointer transition-colors text-sm"
                  >
                    
                    {/* ID & Subject */}
                    <td className="py-4 px-6 max-w-xs">
                      <div className="font-bold text-slate-900 dark:text-slate-100 truncate">
                        {item.subject}
                      </div>
                      <div className="text-xs text-slate-450 font-mono mt-0.5">
                        {item.ticketId}
                      </div>
                    </td>

                    {/* Category */}
                    <td className="py-4 px-6 text-slate-600 dark:text-slate-350 font-medium whitespace-nowrap">
                      {item.category}
                    </td>

                    {/* Student Name */}
                    {!isStudent && (
                      <td className="py-4 px-6 text-slate-655 dark:text-slate-350 font-semibold whitespace-nowrap">
                        {item.createdByName}
                      </td>
                    )}

                    {/* Priority */}
                    <td className="py-4 px-6 whitespace-nowrap">
                      {getPriorityBadge(item.priority)}
                    </td>

                    {/* Status */}
                    <td className="py-4 px-6 whitespace-nowrap">
                      {getStatusBadge(item.status)}
                    </td>

                    {/* Assigned Staff */}
                    <td className="py-4 px-6 text-slate-500 dark:text-slate-450 font-medium whitespace-nowrap">
                      {item.assignedToName}
                    </td>

                    {/* Date Filed */}
                    <td className="py-4 px-6 text-right text-slate-500 dark:text-slate-450 font-semibold whitespace-nowrap">
                      {formatDate(item.date)}
                    </td>

                    {/* Chevron Indicator */}
                    <td className="py-4 px-6 text-slate-400">
                      <ChevronRight className="h-4 w-4" />
                    </td>

                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

      </div>

    </div>
  );
}
