"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  GraduationCap,
  LayoutDashboard,
  User,
  LogOut,
  Menu,
  X,
  Bell,
  Sun,
  Moon,
  Loader2,
  Grid,
  PlusCircle,
  Users,
  Inbox,
  ShieldAlert,
  Landmark,
  Shuffle,
  Settings2,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { getProfile, logoutUser } from "@/lib/actions/users";
import { useTheme } from "@/hooks/useTheme";

interface SidebarLinkProps {
  href: string;
  icon: React.ReactNode;
  label: string;
  isCollapsed: boolean;
  onClick?: () => void;
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { theme, toggleTheme } = useTheme();
  const isDarkMode = theme === "dark";

  // Layout states
  const [isSidebarOpen, setIsSidebarOpen] = useState(false); // Mobile drawer
  const [isCollapsed, setIsCollapsed] = useState(false); // Desktop collapse
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

  // Auth states
  const [user, setUser] = useState<any | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);

  // Derive access roles based on the 3 strict rights
  const rights = user?.rights || [];
  const isAdmin = rights.includes("ADMIN");
  const isDeptManager = rights.includes("MANAGE_DEPARTMENT_USERS");

  // Path authorization checks
  const isAuthorized = () => {
    if (!user) return true; // Handled by auth loading

    if (
      pathname.startsWith("/dashboard/users") ||
      pathname.startsWith("/dashboard/students")
    ) {
      return isAdmin || isDeptManager;
    }

    if (
      pathname.startsWith("/dashboard/category") ||
      pathname.startsWith("/dashboard/departments") ||
      pathname.startsWith("/dashboard/routing") ||
      pathname.startsWith("/dashboard/configs")
    ) {
      return isAdmin;
    }

    // Default routes (Dashboard, Profile, Create Request, View Requests) are accessible to all authenticated users
    return true;
  };

  useEffect(() => {
    const checkAuth = async () => {
      const response = await getProfile();
      if (response.success && response.user) {
        setUser(response.user);
        setIsAuthLoading(false);
      } else {
        await logoutUser();
        router.push("/login");
      }
    };
    checkAuth();
  }, [router]);

  const handleLogout = async (e?: React.MouseEvent) => {
    if (e) e.preventDefault();
    const response = await logoutUser();
    if (response.success) router.push("/");
  };

  const SidebarLink = ({
    href,
    icon,
    label,
    isCollapsed,
    onClick,
  }: SidebarLinkProps) => {
    const isActive =
      pathname.startsWith(href) &&
      (href !== "/dashboard" || pathname === "/dashboard");

    return (
      <Link
        href={href}
        onClick={onClick}
        title={isCollapsed ? label : undefined}
        className={`flex items-center ${isCollapsed ? "justify-center" : "gap-3.5 px-4"} py-3 rounded-xl font-medium transition-all text-sm group relative ${
          isActive
            ? "bg-primary text-white shadow-lg shadow-primary/20"
            : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-200"
        }`}
      >
        <span
          className={`${isActive ? "text-white" : "text-slate-400 group-hover:text-primary transition-colors"}`}
        >
          {icon}
        </span>

        {!isCollapsed && <span className="truncate flex-1">{label}</span>}

        {/* Tooltip for collapsed state */}
        {isCollapsed && (
          <div className="absolute left-full ml-3 px-2 py-1 bg-slate-800 text-white text-xs rounded opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all whitespace-nowrap z-50">
            {label}
          </div>
        )}
      </Link>
    );
  };

  if (isAuthLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 font-sans">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-10 w-10 text-primary animate-spin" />
          <div className="text-center">
            <h3 className="font-bold">Verifying session...</h3>
            <p className="text-xs text-slate-500 mt-1">
              Please wait while we validate your credentials
            </p>
          </div>
        </div>
      </div>
    );
  }

  const initials = user?.name
    ? user.name
        .split(" ")
        .map((n: string) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "ST";

  return (
    <div className="min-h-screen flex transition-colors duration-300 font-sans bg-slate-50 dark:bg-[#090d16] text-slate-800 dark:text-slate-200">
      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div
          onClick={() => setIsSidebarOpen(false)}
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-30 md:hidden"
        />
      )}

      {/* Sidebar Navigation */}
      <aside
        className={`fixed md:sticky top-0 left-0 h-screen bg-white dark:bg-[#0c1220] border-r border-slate-200 dark:border-slate-800 flex flex-col z-40 transition-all duration-300 ease-in-out shrink-0
          ${isSidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}
          ${isCollapsed ? "w-20" : "w-64"}
        `}
      >
        {/* Sidebar Header */}
        <div
          className={`h-16 flex items-center ${isCollapsed ? "justify-center" : "justify-between px-6"} border-b border-slate-200 dark:border-slate-800 transition-all`}
        >
          <Link
            href="/dashboard"
            className="flex items-center gap-2.5 overflow-hidden"
          >
            <div className="p-1.5 bg-primary/10 rounded-lg shrink-0">
              <GraduationCap className="h-6 w-6 text-primary" />
            </div>
            {!isCollapsed && (
              <div className="flex flex-col whitespace-nowrap animate-in fade-in duration-300">
                <span className="font-extrabold text-slate-900 dark:text-slate-50 leading-tight">
                  SBS SSU
                </span>
                <span className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider">
                  Grievance Portal
                </span>
              </div>
            )}
          </Link>

          <button
            onClick={() => setIsSidebarOpen(false)}
            className="md:hidden p-1.5 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg shrink-0"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Sidebar Links */}
        <nav
          className={`flex-1 overflow-y-auto overflow-x-hidden py-6 space-y-1.5 ${isCollapsed ? "px-3" : "px-4"}`}
        >
          <SidebarLink
            href="/dashboard"
            icon={<LayoutDashboard className="h-4.5 w-4.5" />}
            label="Dashboard"
            isCollapsed={isCollapsed}
            onClick={() => setIsSidebarOpen(false)}
          />
          <SidebarLink
            href="/dashboard/profile"
            icon={<User className="h-4.5 w-4.5" />}
            label="My Profile"
            isCollapsed={isCollapsed}
            onClick={() => setIsSidebarOpen(false)}
          />

          <div className="pt-4 pb-1">
            {!isCollapsed && (
              <p className="px-4 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Applications
              </p>
            )}
            {isCollapsed && (
              <div className="mx-auto w-6 border-t border-slate-200 dark:border-slate-700 mt-2 mb-1" />
            )}
          </div>

          <SidebarLink
            href="/dashboard/create-request"
            icon={<PlusCircle className="h-4.5 w-4.5" />}
            label="Submit Request"
            isCollapsed={isCollapsed}
            onClick={() => setIsSidebarOpen(false)}
          />
          <SidebarLink
            href="/dashboard/requests"
            icon={<Inbox className="h-4.5 w-4.5" />}
            label="Grievances"
            isCollapsed={isCollapsed}
            onClick={() => setIsSidebarOpen(false)}
          />

          {(isAdmin || isDeptManager) && (
            <>
              <div className="pt-4 pb-1">
                {!isCollapsed && (
                  <p className="px-4 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Management
                  </p>
                )}
                {isCollapsed && (
                  <div className="mx-auto w-6 border-t border-slate-200 dark:border-slate-700 mt-2 mb-1" />
                )}
              </div>
              <SidebarLink
                href="/dashboard/users"
                icon={<Users className="h-4.5 w-4.5" />}
                label="Manage Users"
                isCollapsed={isCollapsed}
                onClick={() => setIsSidebarOpen(false)}
              />
              <SidebarLink
                href="/dashboard/students"
                icon={<GraduationCap className="h-4.5 w-4.5" />}
                label="Manage Students"
                isCollapsed={isCollapsed}
                onClick={() => setIsSidebarOpen(false)}
              />
            </>
          )}

          {isAdmin && (
            <>
              <div className="pt-4 pb-1">
                {!isCollapsed && (
                  <p className="px-4 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    System Admin
                  </p>
                )}
                {isCollapsed && (
                  <div className="mx-auto w-6 border-t border-slate-200 dark:border-slate-700 mt-2 mb-1" />
                )}
              </div>
              <SidebarLink
                href="/dashboard/category"
                icon={<Grid className="h-4.5 w-4.5" />}
                label="Categories"
                isCollapsed={isCollapsed}
                onClick={() => setIsSidebarOpen(false)}
              />
              <SidebarLink
                href="/dashboard/departments"
                icon={<Landmark className="h-4.5 w-4.5" />}
                label="Departments"
                isCollapsed={isCollapsed}
                onClick={() => setIsSidebarOpen(false)}
              />
              <SidebarLink
                href="/dashboard/routing"
                icon={<Shuffle className="h-4.5 w-4.5" />}
                label="Routing Rules"
                isCollapsed={isCollapsed}
                onClick={() => setIsSidebarOpen(false)}
              />
              <SidebarLink
                href="/dashboard/configs"
                icon={<Settings2 className="h-4.5 w-4.5" />}
                label="Configs"
                isCollapsed={isCollapsed}
                onClick={() => setIsSidebarOpen(false)}
              />
            </>
          )}
        </nav>

        {/* Sidebar Footer Controls */}
        <div
          className={`p-4 border-t border-slate-200 dark:border-slate-800 flex flex-col gap-2`}
        >
          {/* Desktop Collapse Toggle */}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className={`hidden md:flex items-center ${isCollapsed ? "justify-center" : "justify-between px-4"} py-2.5 rounded-xl text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors w-full cursor-pointer`}
          >
            {!isCollapsed && (
              <span className="text-xs font-semibold">Collapse Menu</span>
            )}
            {isCollapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <ChevronLeft className="h-4 w-4" />
            )}
          </button>

          {/* Logout Button */}
          <button
            onClick={handleLogout}
            title={isCollapsed ? "Sign Out" : undefined}
            className={`flex items-center ${isCollapsed ? "justify-center" : "gap-3.5 px-4"} py-2.5 w-full text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-xl font-semibold transition-colors text-sm cursor-pointer`}
          >
            <LogOut className="h-4.5 w-4.5 shrink-0" />
            {!isCollapsed && <span>Sign Out</span>}
          </button>
        </div>
      </aside>

      {/* Main Container */}
      <div className="flex-1 flex flex-col min-w-0 transition-all duration-300">
        {/* Header */}
        <header className="sticky top-0 h-16 bg-white/80 dark:bg-[#0c1220]/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-4 md:px-8 z-20">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="md:hidden p-2 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg cursor-pointer"
            >
              <Menu className="h-5 w-5" />
            </button>
            <h2 className="font-bold text-slate-800 dark:text-slate-100 hidden sm:block text-sm md:text-base">
              Shaheed Bhagat Singh State University
            </h2>
            <h2 className="font-bold text-slate-800 dark:text-slate-100 sm:hidden text-sm">
              SBS University
            </h2>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={toggleTheme}
              className="p-2 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg cursor-pointer transition-all duration-200 active:scale-95"
              aria-label="Toggle dark mode"
            >
              {isDarkMode ? (
                <Sun className="h-5 w-5 text-amber-400 hover:rotate-45 transition-transform duration-300" />
              ) : (
                <Moon className="h-5 w-5 text-primary hover:-rotate-12 transition-transform duration-300" />
              )}
            </button>

            {/* <button className="relative p-2 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg cursor-pointer">
              <Bell className="h-5 w-5" />
              <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-red-500 ring-2 ring-white dark:ring-[#0c1220]" />
            </button> */}

            <button
              onClick={() => setIsProfileModalOpen(true)}
              className="flex items-center gap-2.5 pl-2 ml-1 border-l border-slate-200 dark:border-slate-800 hover:opacity-80 transition-opacity text-left cursor-pointer focus:outline-none"
            >
              <div className="flex flex-col text-right hidden sm:flex">
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200 leading-tight">
                  {user?.name || "User"}
                </span>
                <span className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider">
                  {user?.role?.replace("_", " ") || "Member"}
                </span>
              </div>
              <div className="h-8 w-8 rounded-full bg-primary/10 border border-primary/20 text-primary flex items-center justify-center font-bold text-sm select-none shrink-0 hover:scale-105 transition-transform">
                {initials}
              </div>
            </button>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 p-4 md:p-8 overflow-y-auto z-10 relative">
          {isAuthorized() ? (
            children
          ) : (
            <div className="flex flex-col items-center justify-center py-20 text-center gap-4 animate-in fade-in duration-500">
              <ShieldAlert className="h-16 w-16 text-red-500" />
              <div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-slate-50">
                  Access Denied
                </h2>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-sm">
                  You do not have the required permissions to view this page.
                  Contact an administrator if you need access.
                </p>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Profile Modal */}
      {isProfileModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            onClick={() => setIsProfileModalOpen(false)}
            className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm transition-opacity duration-300"
          />

          <div className="relative bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200 z-10 flex flex-col max-h-[90vh]">
            <button
              onClick={() => setIsProfileModalOpen(false)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all z-20 cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="relative p-6 pt-8 pb-6 border-b border-slate-200 dark:border-slate-800 bg-gradient-to-br from-primary/5 via-transparent to-transparent flex flex-col items-center text-center">
              <div className="h-20 w-20 rounded-full bg-primary/10 border-2 border-primary/20 text-primary flex items-center justify-center font-bold text-2xl mb-4 shadow-lg shadow-primary/5">
                {initials}
              </div>
              <h3 className="text-xl font-extrabold text-slate-900 dark:text-white leading-tight">
                {user?.name}
              </h3>
              <span className="text-xs font-bold uppercase tracking-wider px-2.5 py-1 bg-primary/10 text-primary rounded-full mt-2 inline-block">
                {user?.role?.replace("_", " ")}
              </span>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50/50 dark:bg-slate-950/50">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
                <div className="flex flex-col gap-1">
                  <span className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider">
                    Email Address
                  </span>
                  <span className="text-sm font-semibold text-slate-800 dark:text-slate-200 break-all">
                    {user?.email || "N/A"}
                  </span>
                </div>

                <div className="flex flex-col gap-1">
                  <span className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider">
                    Mobile Number
                  </span>
                  <span className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                    {user?.mobile || "N/A"}
                  </span>
                </div>

                <div className="flex flex-col gap-1">
                  <span className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider">
                    Department
                  </span>
                  <span className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                    {user?.departmentName || "N/A"}
                  </span>
                </div>

                {user?.role === "STUDENT" ? (
                  <>
                    <div className="flex flex-col gap-1">
                      <span className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider">
                        Roll Number
                      </span>
                      <span className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                        {user?.rollNumber || "N/A"}
                      </span>
                    </div>
                    <div className="flex flex-col gap-1">
                      <span className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider">
                        Enrolled Course
                      </span>
                      <span className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                        {user?.enrolledCourse || "N/A"}
                      </span>
                    </div>
                  </>
                ) : (
                  <div className="flex flex-col gap-1">
                    <span className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider">
                      Designation
                    </span>
                    <span className="text-sm font-semibold text-slate-800 dark:text-slate-200 capitalize">
                      {user?.designation || "N/A"}
                    </span>
                  </div>
                )}

                {rights.length > 0 && (
                  <div className="col-span-1 sm:col-span-2 flex flex-col gap-1.5 mt-2 pt-4 border-t border-slate-200 dark:border-slate-800">
                    <span className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider">
                      System Permissions
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {rights.map((right: string) => (
                        <span
                          key={right}
                          className="text-[10px] font-bold px-2 py-0.5 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 rounded"
                        >
                          {right.replace(/_/g, " ")}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="p-6 flex gap-3 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0">
              <Link
                href="/dashboard/profile"
                onClick={() => setIsProfileModalOpen(false)}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all text-sm cursor-pointer"
              >
                <User className="h-4 w-4" />
                <span>Edit Profile</span>
              </Link>
              <button
                onClick={(e) => {
                  setIsProfileModalOpen(false);
                  handleLogout(e);
                }}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-red-600 hover:bg-red-500 text-white font-semibold transition-all text-sm cursor-pointer"
              >
                <LogOut className="h-4 w-4" />
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
