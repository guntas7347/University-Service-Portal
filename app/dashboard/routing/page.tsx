"use client";

import React, { useState, useEffect, FormEvent } from "react";
import { 
  Shuffle, 
  Plus, 
  Trash2, 
  Loader2, 
  CheckCircle2, 
  AlertCircle,
  FolderOpen,
  User,
  Power,
  Layers,
  ShieldAlert,
  ArrowUpRight
} from "lucide-react";
import { useForm } from "@/hooks/useForm";
import { 
  getRoutingRules, 
  createRoutingRule, 
  toggleRoutingRule, 
  deleteRoutingRule 
} from "@/lib/prisma/actions/routing";
import { getCategories } from "@/lib/prisma/actions/categories";
import { getStaffUsers } from "@/lib/prisma/actions/staff";

interface RuleType {
  id: string;
  categoryId: string;
  categoryName: string;
  userId: string;
  userName: string;
  userEmail: string;
  userRole: string;
  userDesignation: string;
  level: number;
  isCentral: boolean;
  isActive: boolean;
}

interface CategoryType {
  id: string;
  name: string;
}

interface StaffType {
  id: string;
  name: string;
  email: string;
  role: string;
  designation: string;
}

export default function RoutingRulesPage() {
  const [rules, setRules] = useState<RuleType[]>([]);
  const [categories, setCategories] = useState<CategoryType[]>([]);
  const [staffList, setStaffList] = useState<StaffType[]>([]);

  const [isPageLoading, setIsPageLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [filterType, setFilterType] = useState<"ALL" | "CATEGORY" | "CENTRAL">("ALL");

  // Form mode state: Category vs Central Escalation
  const [ruleMode, setRuleMode] = useState<"CATEGORY" | "CENTRAL">("CATEGORY");

  // Alerts feedback
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Form management hook
  const { form, handleChange, setFields, resetFormFields } = useForm({
    categoryId: "",
    userId: "",
    level: "1",
  });

  // Fetch all dependencies and rules
  const loadData = async () => {
    setIsPageLoading(true);
    const [rulesRes, categoriesRes, staffRes] = await Promise.all([
      getRoutingRules(),
      getCategories(),
      getStaffUsers()
    ]);

    if (rulesRes.success && rulesRes.rules) {
      setRules(rulesRes.rules as RuleType[]);
    }
    if (categoriesRes.success && categoriesRes.categories) {
      setCategories(categoriesRes.categories as CategoryType[]);
    }
    if (staffRes.success && staffRes.staff) {
      setStaffList(staffRes.staff as StaffType[]);
    }
    setIsPageLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  // Form submission handler: Create rule
  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSuccessMsg(null);
    setErrorMsg(null);

    const isCentral = ruleMode === "CENTRAL";

    if (!isCentral && !form.categoryId) {
      setErrorMsg("Please select a Request Category.");
      return;
    }
    if (!form.userId) {
      setErrorMsg("Please select an Assignee / Authority.");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await createRoutingRule({
        categoryId: isCentral ? null : form.categoryId,
        userId: form.userId,
        level: Number(form.level) || 1,
        isCentral,
      });

      if (response.success) {
        setSuccessMsg(response.message);
        resetFormFields();
        setFields({ level: "1" });
        // Reload rule list
        const rulesRes = await getRoutingRules();
        if (rulesRes.success && rulesRes.rules) {
          setRules(rulesRes.rules as RuleType[]);
        }
      } else {
        setErrorMsg(response.message);
      }
    } catch (err) {
      setErrorMsg("An unexpected error occurred. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Toggle active status click handler
  const handleToggleActive = async (id: string, currentActive: boolean) => {
    setSuccessMsg(null);
    setErrorMsg(null);

    try {
      const response = await toggleRoutingRule(id, !currentActive);
      if (response.success) {
        setSuccessMsg(response.message);
        // Refresh local rules state
        setRules(prev => prev.map(r => r.id === id ? { ...r, isActive: !currentActive } : r));
      } else {
        setErrorMsg(response.message);
      }
    } catch (err) {
      setErrorMsg("Failed to toggle routing rule status.");
    }
  };

  // Delete click handler
  const handleDeleteClick = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this routing rule?")) {
      return;
    }

    setSuccessMsg(null);
    setErrorMsg(null);

    try {
      const response = await deleteRoutingRule(id);
      if (response.success) {
        setSuccessMsg(response.message);
        setRules(prev => prev.filter(r => r.id !== id));
      } else {
        setErrorMsg(response.message);
      }
    } catch (err) {
      setErrorMsg("Failed to delete the routing rule.");
    }
  };

  const filteredRules = rules.filter(r => {
    if (filterType === "CATEGORY") return !r.isCentral;
    if (filterType === "CENTRAL") return r.isCentral;
    return true;
  });

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 dark:text-slate-50 tracking-tight">
          Routing & Escalation Hierarchy
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Configure multi-level routing per category and a central fallback route for student escalations
        </p>
      </div>

      {/* Grid Layout: Form on Left, List on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-login-gap">
        
        {/* Left Column: Form Card */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-login-radius p-6 shadow-sm h-fit">
          <div className="mb-5">
            <h2 className="text-lg font-bold text-slate-900 dark:text-slate-50">
              Add Routing Rule
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Assign staff at specific resolution or escalation levels
            </p>
          </div>

          {/* Rule Type Mode Selector */}
          <div className="mb-5 flex rounded-lg p-1 bg-slate-100 dark:bg-slate-800 text-xs font-semibold">
            <button
              type="button"
              onClick={() => setRuleMode("CATEGORY")}
              className={`flex-1 py-1.5 rounded-md transition-all cursor-pointer ${
                ruleMode === "CATEGORY"
                  ? "bg-white dark:bg-slate-900 text-primary shadow-xs font-bold"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
              }`}
            >
              Category Route
            </button>
            <button
              type="button"
              onClick={() => setRuleMode("CENTRAL")}
              className={`flex-1 py-1.5 rounded-md transition-all cursor-pointer ${
                ruleMode === "CENTRAL"
                  ? "bg-white dark:bg-slate-900 text-amber-600 dark:text-amber-400 shadow-xs font-bold"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
              }`}
            >
              Central Escalation
            </button>
          </div>

          {/* Feedback alerts */}
          {errorMsg && (
            <div className="mb-4 flex items-start gap-2.5 p-3 bg-red-50 dark:bg-red-955/20 border border-red-200 dark:border-red-800/30 rounded-xl text-red-800 dark:text-red-300 text-xs animate-fade-in">
              <AlertCircle className="h-4.5 w-4.5 shrink-0 text-red-655 dark:text-red-400 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="mb-4 flex items-start gap-2.5 p-3 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/30 rounded-xl text-emerald-800 dark:text-emerald-300 text-xs animate-fade-in">
              <CheckCircle2 className="h-4.5 w-4.5 shrink-0 text-emerald-655 dark:text-emerald-400 mt-0.5" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            
            {/* Category Select (only in Category Mode) */}
            {ruleMode === "CATEGORY" ? (
              <div>
                <label htmlFor="categoryId" className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-2">
                  Request Category
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FolderOpen className="h-4 w-4 text-slate-400 group-focus-within:text-primary transition-colors" />
                  </div>
                  <select
                    id="categoryId"
                    name="categoryId"
                    required
                    disabled={isSubmitting}
                    value={form.categoryId}
                    onChange={handleChange}
                    className="w-full h-11 pl-9 pr-4 py-2 bg-slate-50/50 dark:bg-slate-955/50 border border-slate-200 dark:border-slate-800 rounded-login-radius text-slate-850 dark:text-slate-200 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all disabled:opacity-50"
                  >
                    <option value="">Select Category</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            ) : (
              <div className="p-3 bg-amber-50/60 dark:bg-amber-955/20 border border-amber-200/50 dark:border-amber-850 rounded-xl text-xs text-amber-800 dark:text-amber-300 flex items-start gap-2">
                <ShieldAlert className="h-4 w-4 shrink-0 mt-0.5 text-amber-600 dark:text-amber-400" />
                <span>
                  <strong>Central Escalation Route:</strong> Acts as the university-wide last resort when category tiers are exhausted.
                </span>
              </div>
            )}

            {/* Level Selector */}
            <div>
              <label htmlFor="level" className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-2">
                Authority Level
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Layers className="h-4 w-4 text-slate-400 group-focus-within:text-primary transition-colors" />
                </div>
                <select
                  id="level"
                  name="level"
                  required
                  disabled={isSubmitting}
                  value={form.level}
                  onChange={handleChange}
                  className="w-full h-11 pl-9 pr-4 py-2 bg-slate-50/50 dark:bg-slate-955/50 border border-slate-200 dark:border-slate-800 rounded-login-radius text-slate-850 dark:text-slate-200 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all disabled:opacity-50"
                >
                  <option value="1">Level 1 - Initial Assignment (Day 1)</option>
                  <option value="2">Level 2 - 1st Escalation (After 7 Days)</option>
                  <option value="3">Level 3 - 2nd Escalation (After 14 Days)</option>
                  <option value="4">Level 4 - 3rd Escalation (After 21 Days)</option>
                  <option value="5">Level 5 - Highest Authority</option>
                </select>
              </div>
              <p className="text-[10px] text-slate-400 mt-1">
                Student escalations automatically advance tickets from Level 1 to Level 2 and higher.
              </p>
            </div>

            {/* Staff User Select */}
            <div>
              <label htmlFor="userId" className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-2">
                Target Staff / Authority
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="h-4 w-4 text-slate-400 group-focus-within:text-primary transition-colors" />
                </div>
                <select
                  id="userId"
                  name="userId"
                  required
                  disabled={isSubmitting}
                  value={form.userId}
                  onChange={handleChange}
                  className="w-full h-11 pl-9 pr-4 py-2 bg-slate-50/50 dark:bg-slate-955/50 border border-slate-200 dark:border-slate-800 rounded-login-radius text-slate-850 dark:text-slate-200 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all disabled:opacity-50"
                >
                  <option value="">Select Staff Member</option>
                  {staffList.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.designation || s.role})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Submit */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full h-11 bg-primary hover:bg-primary/95 text-white font-semibold rounded-login-radius text-sm transition-all active:scale-[0.98] shadow-md shadow-primary/10 cursor-pointer flex items-center justify-center gap-1.5"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Creating Rule...</span>
                  </>
                ) : (
                  <>
                    <Plus className="h-4 w-4" />
                    <span>Add {ruleMode === "CENTRAL" ? "Central Escalation" : "Category"} Rule</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Right Column: List Table */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-login-radius shadow-sm lg:col-span-2 overflow-hidden flex flex-col min-h-[450px]">
          
          <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-slate-50">
                Active Routing Rules
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Mappings and escalation tiers for automatic assignment
              </p>
            </div>

            {/* Filter Tabs */}
            <div className="flex rounded-lg p-0.5 bg-slate-100 dark:bg-slate-800 text-xs font-semibold">
              <button
                type="button"
                onClick={() => setFilterType("ALL")}
                className={`px-3 py-1 rounded-md transition-all cursor-pointer ${
                  filterType === "ALL"
                    ? "bg-white dark:bg-slate-900 text-primary shadow-xs font-bold"
                    : "text-slate-600 dark:text-slate-400"
                }`}
              >
                All ({rules.length})
              </button>
              <button
                type="button"
                onClick={() => setFilterType("CATEGORY")}
                className={`px-3 py-1 rounded-md transition-all cursor-pointer ${
                  filterType === "CATEGORY"
                    ? "bg-white dark:bg-slate-900 text-primary shadow-xs font-bold"
                    : "text-slate-600 dark:text-slate-400"
                }`}
              >
                Category ({rules.filter(r => !r.isCentral).length})
              </button>
              <button
                type="button"
                onClick={() => setFilterType("CENTRAL")}
                className={`px-3 py-1 rounded-md transition-all cursor-pointer ${
                  filterType === "CENTRAL"
                    ? "bg-white dark:bg-slate-900 text-amber-600 dark:text-amber-400 shadow-xs font-bold"
                    : "text-slate-600 dark:text-slate-400"
                }`}
              >
                Central ({rules.filter(r => r.isCentral).length})
              </button>
            </div>
          </div>

          {isPageLoading ? (
            <div className="flex-1 flex flex-col items-center justify-center gap-2 py-20">
              <Loader2 className="h-8 w-8 text-primary animate-spin" />
              <p className="text-sm text-slate-450 font-medium">Loading routing list...</p>
            </div>
          ) : filteredRules.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center py-20 text-center gap-2 px-4">
              <Shuffle className="h-10 w-10 text-slate-350 dark:text-slate-650" />
              <h4 className="font-bold text-slate-700 dark:text-slate-405 text-sm">No Rules Found</h4>
              <p className="text-xs text-slate-400 max-w-xs mt-1">
                Configure routing and escalation rules using the form on the left.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-955/20 text-slate-500 dark:text-slate-400 text-xs font-semibold uppercase">
                    <th className="py-3 px-5">Target Category / Scope</th>
                    <th className="py-3 px-5">Level / Tier</th>
                    <th className="py-3 px-5">Assigned Staff</th>
                    <th className="py-3 px-5">Status</th>
                    <th className="py-3 px-5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-150 dark:divide-slate-850">
                  {filteredRules.map((rule) => (
                    <tr key={rule.id} className="hover:bg-slate-50/20 dark:hover:bg-slate-800/5 transition-colors text-sm">
                      
                      {/* Category or Central Scope */}
                      <td className="py-3.5 px-5">
                        {rule.isCentral ? (
                          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold bg-amber-50 dark:bg-amber-955/30 text-amber-800 dark:text-amber-300 border border-amber-200/40">
                            <ShieldAlert className="h-3.5 w-3.5 text-amber-600" />
                            <span>Central Escalation</span>
                          </div>
                        ) : (
                          <div className="font-bold text-slate-900 dark:text-slate-100">
                            {rule.categoryName}
                          </div>
                        )}
                      </td>

                      {/* Level */}
                      <td className="py-3.5 px-5 whitespace-nowrap">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold border ${
                          rule.level === 1
                            ? "bg-blue-50 dark:bg-blue-955/30 text-blue-800 dark:text-blue-300 border-blue-200/50"
                            : rule.level === 2
                            ? "bg-amber-50 dark:bg-amber-955/30 text-amber-800 dark:text-amber-300 border-amber-200/50"
                            : "bg-red-50 dark:bg-red-955/30 text-red-800 dark:text-red-300 border-red-200/50"
                        }`}>
                          <span>Level {rule.level}</span>
                          <span className="text-[10px] font-normal opacity-75">
                            {rule.level === 1 ? "(Initial)" : `(+${(rule.level - 1) * 7}d)`}
                          </span>
                        </span>
                      </td>

                      {/* Staff */}
                      <td className="py-3.5 px-5">
                        <div className="font-bold text-slate-800 dark:text-slate-200 text-xs">
                          {rule.userName}
                        </div>
                        {rule.userDesignation && (
                          <div className="text-[11px] text-primary dark:text-primary/90 font-medium">
                            {rule.userDesignation}
                          </div>
                        )}
                        <div className="text-[10px] text-slate-400">
                          {rule.userEmail}
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-5 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-0.5 rounded text-[10px] font-bold border ${
                          rule.isActive 
                            ? "bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400 border-emerald-200/50" 
                            : "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-200/50"
                        }`}>
                          {rule.isActive ? "Active" : "Disabled"}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-5 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => handleToggleActive(rule.id, rule.isActive)}
                            className={`p-1.5 rounded-lg cursor-pointer transition-colors ${
                              rule.isActive 
                                ? "text-slate-550 dark:text-slate-400 hover:text-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800" 
                                : "text-primary hover:bg-primary/10"
                            }`}
                            title={rule.isActive ? "Disable Rule" : "Enable Rule"}
                          >
                            <Power className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteClick(rule.id)}
                            className="p-1.5 text-slate-550 dark:text-slate-400 hover:text-red-655 dark:hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-955/20 rounded-lg cursor-pointer transition-colors"
                            title="Delete Rule"
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

