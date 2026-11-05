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
} from "lucide-react";
import { useForm } from "@/hooks/useForm";
import {
  getRoutingRules,
  createRoutingRule,
  toggleRoutingRule,
  deleteRoutingRule,
} from "@/lib/actions/routing";
import { getCategories } from "@/lib/actions/categories";
import { getStaffUsers } from "@/lib/actions/staff";
import { SelectStaffModal } from "@/components/dashboard/SelectStaffModal";

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

  // Selection states
  const [isStaffModalOpen, setIsStaffModalOpen] = useState(false);
  const [filterType, setFilterType] = useState<"ALL" | "CATEGORY" | "CENTRAL">(
    "ALL",
  );
  const [ruleMode, setRuleMode] = useState<"CATEGORY" | "CENTRAL">("CATEGORY");

  // Alerts feedback
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const { form, handleChange, setFields, resetFormFields } = useForm({
    categoryId: "",
    userId: "",
    level: "1",
  });

  // Auto-dismiss success message
  useEffect(() => {
    if (successMsg) {
      const timer = setTimeout(() => setSuccessMsg(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [successMsg]);

  const loadData = async () => {
    setIsPageLoading(true);
    const [rulesRes, categoriesRes, staffRes] = await Promise.all([
      getRoutingRules(),
      getCategories(),
      getStaffUsers(),
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
      setErrorMsg("Please select a target Staff Member to route to.");
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

  const handleToggleActive = async (id: string, currentActive: boolean) => {
    setSuccessMsg(null);
    setErrorMsg(null);
    try {
      const response = await toggleRoutingRule(id, !currentActive);
      if (response.success) {
        setSuccessMsg(response.message);
        setRules((prev) =>
          prev.map((r) =>
            r.id === id ? { ...r, isActive: !currentActive } : r,
          ),
        );
      } else {
        setErrorMsg(response.message);
      }
    } catch {
      setErrorMsg("Failed to toggle routing rule status.");
    }
  };

  const handleDeleteClick = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this routing rule?"))
      return;
    setSuccessMsg(null);
    setErrorMsg(null);

    try {
      const response = await deleteRoutingRule(id);
      if (response.success) {
        setSuccessMsg(response.message);
        setRules((prev) => prev.filter((r) => r.id !== id));
      } else {
        setErrorMsg(response.message);
      }
    } catch {
      setErrorMsg("Failed to delete the routing rule.");
    }
  };

  const filteredRules = rules.filter((r) => {
    if (filterType === "CATEGORY") return !r.isCentral;
    if (filterType === "CENTRAL") return r.isCentral;
    return true;
  });

  const selectedFaculty = staffList.find((s) => s.id === form.userId);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 dark:text-slate-50 tracking-tight">
          Routing & Escalation Hierarchy
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Configure multi-level routing per category and a central fallback
          route for student escalations.
        </p>
      </div>

      <div className="space-y-3 empty:hidden">
        {errorMsg && (
          <div className="flex items-start gap-2.5 p-3.5 bg-red-50 dark:bg-red-955/20 border border-red-200 dark:border-red-800/30 rounded-xl text-red-800 dark:text-red-300 text-sm animate-in fade-in slide-in-from-top-2">
            <AlertCircle className="h-5 w-5 shrink-0 text-red-500" />
            <span>{errorMsg}</span>
          </div>
        )}
        {successMsg && (
          <div className="flex items-start gap-2.5 p-3.5 bg-emerald-50 dark:bg-emerald-955/20 border border-emerald-200 dark:border-emerald-800/30 rounded-xl text-emerald-800 dark:text-emerald-300 text-sm animate-in fade-in slide-in-from-top-2">
            <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-500" />
            <span>{successMsg}</span>
          </div>
        )}
      </div>

      <div className="flex flex-col xl:flex-row gap-6 items-start">
        {/* Left Column: Form Card */}
        <div className="w-full xl:w-1/3 xl:sticky xl:top-24 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm">
          <div className="mb-6">
            <h2 className="text-lg font-bold text-slate-900 dark:text-slate-50">
              Create New Route
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Assign staff at specific escalation levels.
            </p>
          </div>

          <div className="mb-6 flex rounded-xl p-1 bg-slate-100 dark:bg-slate-950 text-xs font-semibold">
            <button
              type="button"
              onClick={() => {
                setRuleMode("CATEGORY");
                setFields({ categoryId: "" });
              }}
              className={`flex-1 py-2 rounded-lg transition-all ${
                ruleMode === "CATEGORY"
                  ? "bg-white dark:bg-slate-900 text-primary shadow-sm"
                  : "text-slate-500 hover:text-slate-900 dark:hover:text-slate-200"
              }`}
            >
              Category Route
            </button>
            <button
              type="button"
              onClick={() => {
                setRuleMode("CENTRAL");
                setFields({ categoryId: "" });
              }}
              className={`flex-1 py-2 rounded-lg transition-all ${
                ruleMode === "CENTRAL"
                  ? "bg-white dark:bg-slate-900 text-amber-600 shadow-sm"
                  : "text-slate-500 hover:text-slate-900 dark:hover:text-slate-200"
              }`}
            >
              Central Escalation
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {ruleMode === "CATEGORY" ? (
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-2">
                  Target Category
                </label>
                <div className="relative">
                  <FolderOpen className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <select
                    name="categoryId"
                    required
                    disabled={isSubmitting}
                    value={form.categoryId}
                    onChange={handleChange}
                    className="w-full h-11 pl-9 pr-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:border-primary outline-none"
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
              <div className="p-4 bg-amber-50 dark:bg-amber-955/20 border border-amber-200/50 dark:border-amber-850 rounded-xl text-xs text-amber-800 dark:text-amber-300 flex items-start gap-3 leading-relaxed">
                <ShieldAlert className="h-5 w-5 shrink-0 text-amber-500" />
                <span>
                  <strong>Central Escalation Route:</strong> Acts as the
                  university-wide last resort when standard category tiers are
                  completely exhausted.
                </span>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-2">
                Authority Escalation Level
              </label>
              <div className="relative">
                <Layers className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <select
                  name="level"
                  required
                  disabled={isSubmitting}
                  value={form.level}
                  onChange={handleChange}
                  className="w-full h-11 pl-9 pr-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:border-primary outline-none"
                >
                  <option value="1">
                    Level 1 - Initial Assignment (Day 1)
                  </option>
                  <option value="2">
                    Level 2 - 1st Escalation (After 7 Days)
                  </option>
                  <option value="3">
                    Level 3 - 2nd Escalation (After 14 Days)
                  </option>
                  <option value="4">
                    Level 4 - 3rd Escalation (After 21 Days)
                  </option>
                  <option value="5">Level 5 - Highest Authority</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-2">
                Target Assigned Staff
              </label>
              <div
                onClick={() => setIsStaffModalOpen(true)}
                className="w-full h-11 px-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm flex items-center cursor-pointer hover:border-primary transition-colors"
              >
                {selectedFaculty ? (
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-slate-400" />
                    <span className="font-medium text-slate-800 dark:text-slate-200">
                      {selectedFaculty.name}
                    </span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-slate-400">
                    <User className="h-4 w-4" />
                    <span>Click to assign staff member...</span>
                  </div>
                )}
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full h-11 bg-primary text-white font-semibold rounded-xl text-sm transition-all hover:bg-primary/90 shadow-md shadow-primary/20 flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Plus className="h-4 w-4" />
                )}
                <span>
                  Add {ruleMode === "CENTRAL" ? "Central" : "Category"} Route
                </span>
              </button>
            </div>
          </form>
        </div>

        {/* Right Column: List Table */}
        <div className="w-full xl:w-2/3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-sm overflow-hidden flex flex-col min-h-[500px]">
          <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-slate-50">
                Active Routing Rules
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Automatic assignment escalations across the system.
              </p>
            </div>

            <div className="flex rounded-xl p-1 bg-slate-100 dark:bg-slate-950 text-xs font-semibold w-full md:w-auto">
              {["ALL", "CATEGORY", "CENTRAL"].map((type) => (
                <button
                  key={type}
                  onClick={() => setFilterType(type as any)}
                  className={`flex-1 md:flex-none px-4 py-2 rounded-lg transition-all ${
                    filterType === type
                      ? `bg-white dark:bg-slate-900 shadow-sm ${type === "CENTRAL" ? "text-amber-600" : "text-primary"}`
                      : "text-slate-500 hover:text-slate-900 dark:hover:text-slate-200"
                  }`}
                >
                  {type === "ALL"
                    ? `All (${rules.length})`
                    : type === "CATEGORY"
                      ? `Category (${rules.filter((r) => !r.isCentral).length})`
                      : `Central (${rules.filter((r) => r.isCentral).length})`}
                </button>
              ))}
            </div>
          </div>

          {isPageLoading ? (
            <div className="flex-1 flex flex-col items-center justify-center gap-2 py-20">
              <Loader2 className="h-8 w-8 text-primary animate-spin" />
              <p className="text-sm text-slate-500">Loading rules...</p>
            </div>
          ) : filteredRules.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center py-20 text-center gap-3 px-4">
              <Shuffle className="h-12 w-12 text-slate-300 dark:text-slate-700" />
              <h4 className="font-bold text-slate-700 dark:text-slate-300">
                No Rules Found
              </h4>
              <p className="text-xs text-slate-500 max-w-sm">
                Configure category routing or central escalation rules using the
                form.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto flex-1">
              <table className="w-full text-left text-sm whitespace-nowrap">
                <thead className="bg-slate-50 dark:bg-slate-900/80 text-slate-500 dark:text-slate-400 font-medium border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="py-4 px-6">Scope / Target</th>
                    <th className="py-4 px-6">Escalation Tier</th>
                    <th className="py-4 px-6">Assigned Handler</th>
                    <th className="py-4 px-6">Status</th>
                    <th className="py-4 px-6 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                  {filteredRules.map((rule) => (
                    <tr
                      key={rule.id}
                      className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors"
                    >
                      <td className="py-4 px-6">
                        {rule.isCentral ? (
                          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold bg-amber-50 dark:bg-amber-955/30 text-amber-800 dark:text-amber-400 border border-amber-200/40">
                            <ShieldAlert className="h-3.5 w-3.5" />
                            <span>Central Escalation</span>
                          </div>
                        ) : (
                          <div className="font-bold text-slate-800 dark:text-slate-200">
                            {rule.categoryName}
                          </div>
                        )}
                      </td>
                      <td className="py-4 px-6">
                        <span
                          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${
                            rule.level === 1
                              ? "bg-blue-50 dark:bg-blue-955/30 text-blue-700 dark:text-blue-400 border-blue-200/50"
                              : rule.level === 2
                                ? "bg-amber-50 dark:bg-amber-955/30 text-amber-700 dark:text-amber-400 border-amber-200/50"
                                : "bg-red-50 dark:bg-red-955/30 text-red-700 dark:text-red-400 border-red-200/50"
                          }`}
                        >
                          Level {rule.level}
                        </span>
                      </td>
                      <td className="py-4 px-6">
                        <div className="font-bold text-slate-900 dark:text-slate-100">
                          {rule.userName}
                        </div>
                        <div className="text-[11px] text-slate-500 mt-0.5">
                          {rule.userDesignation || rule.userRole}
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <span
                          className={`inline-flex px-2 py-0.5 rounded text-[10px] font-bold border ${rule.isActive ? "bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400 border-emerald-200/50" : "bg-slate-100 dark:bg-slate-800 text-slate-500 border-slate-200/50"}`}
                        >
                          {rule.isActive ? "Active" : "Disabled"}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-right">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() =>
                              handleToggleActive(rule.id, rule.isActive)
                            }
                            className={`p-1.5 rounded-lg transition-colors ${rule.isActive ? "text-slate-400 hover:text-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800" : "text-primary hover:bg-primary/10"}`}
                            title={
                              rule.isActive ? "Disable Rule" : "Enable Rule"
                            }
                          >
                            <Power className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteClick(rule.id)}
                            className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg transition-colors"
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

      {/* Staff Selection Modal */}
      {isStaffModalOpen && (
        <SelectStaffModal
          isOpen={isStaffModalOpen}
          onClose={() => setIsStaffModalOpen(false)}
          staffOptions={staffList}
          selectedStaffId={form.userId}
          onSelectStaff={(id) => {
            setFields({ userId: id });
            setIsStaffModalOpen(false);
          }}
          title="Select Target Handler"
          description="Choose a faculty or staff member to assign this routing rule to."
        />
      )}
    </div>
  );
}
