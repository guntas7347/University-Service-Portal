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
  BookOpen,
  Grid,
  PlusCircle,
  Users,
  Inbox,
  Headphones,
  ShieldAlert,
  Landmark,
  Shuffle,
} from "lucide-react";
import { getProfile, logoutUser } from "@/lib/prisma/actions/users";
import { useTheme } from "@/hooks/useTheme";

interface SidebarLinkProps {
  href: string;
  icon: React.ReactNode;
  label: string;
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
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Auth state variables
  const [user, setUser] = useState<any | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);

  // Path authorization checks
  const isAuthorized = () => {
    if (!user) return true;

    const role = user.role.toUpperCase();
    const rights = user.rights || [];

    if (pathname === "/dashboard/users") {
      return role === "ADMIN" || role === "SUPER_ADMIN" || role === "HOD" || rights.includes("MANAGE_USERS");
    }

    if (pathname === "/dashboard/students") {
      return role === "ADMIN" || role === "SUPER_ADMIN" || role === "HOD" || rights.includes("MANAGE_USERS");
    }

    if (pathname === "/dashboard/courses") {
      return role === "ADMIN" || role === "SUPER_ADMIN" || role === "HOD" || rights.includes("MANAGE_COURSES");
    }

    if (pathname === "/dashboard/category") {
      return role === "ADMIN" || role === "SUPER_ADMIN" || rights.includes("MANAGE_CATEGORIES");
    }

    if (pathname === "/dashboard/departments") {
      return role === "ADMIN" || role === "SUPER_ADMIN";
    }

    if (pathname === "/dashboard/routing") {
      return role === "ADMIN" || role === "SUPER_ADMIN" || rights.includes("MANAGE_ROUTING");
    }

    if (pathname === "/dashboard/create-request") {
      return role === "STUDENT" || role === "FACULTY" || role === "HOD";
    }

    return true;
  };

  // Authentication check on mount
  useEffect(() => {
    const checkAuth = async () => {
      const response = await getProfile();
      if (response.success && response.user) {
        setUser(response.user);
        setIsAuthLoading(false);
      } else {
        // Redirect to login if not authenticated
        router.push("/login");
      }
    };
    checkAuth();
  }, [router]);

  // Sign out click handler
  const handleLogout = async (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    const response = await logoutUser();
    if (response.success) {
      router.push("/login");
    }
  };

  const SidebarLink = ({ href, icon, label, onClick }: SidebarLinkProps) => {
    const isActive = pathname === href;
    return (
      <Link
        href={href}
        onClick={onClick}
        className={`flex items-center gap-3.5 px-4 py-3 rounded-xl font-medium transition-all text-sm group ${
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
        <span>{label}</span>
      </Link>
    );
  };

  // 1. Loading splash screen during authentication checks
  if (isAuthLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-955 text-slate-100 font-sans">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-10 w-10 text-primary animate-spin" />
          <div className="text-center">
            <h3 className="font-bold text-slate-200">Verifying session...</h3>
            <p className="text-xs text-slate-500 mt-1">
              Please wait while we validate your credentials
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Get initials for profile thumbnail
  const initials = user?.name
    ? user.name
        .split(" ")
        .map((n: string) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "ST";

  return (
    <div
      className="min-h-screen flex transition-colors duration-300 font-sans bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200"
    >
      {/* Mobile Sidebar Backdrop Overlay */}
      {isSidebarOpen && (
        <div
          onClick={() => setIsSidebarOpen(false)}
          className="fixed inset-0 bg-slate-955/45 backdrop-blur-sm z-30 md:hidden"
        />
      )}

      {/* Sidebar Navigation */}
      <aside
        className={`fixed md:sticky top-0 left-0 h-screen w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col z-40 transition-transform duration-300 md:transform-none ${
          isSidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        }`}
      >
        {/* Sidebar Header / Branding */}
        <div className="h-16 flex items-center justify-between px-6 border-b border-slate-200 dark:border-slate-800">
          <Link href="/dashboard" className="flex items-center gap-2.5">
            <div className="p-1.5 bg-primary/10 rounded-lg">
              <GraduationCap className="h-6 w-6 text-primary" />
            </div>
            <div className="flex flex-col">
              <span className="font-extrabold text-slate-900 dark:text-slate-50 leading-tight">
                SBS SSU
              </span>
              <span className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider">
                Grievance Portal
              </span>
            </div>
          </Link>
          <button
            type="button"
            onClick={() => setIsSidebarOpen(false)}
            className="md:hidden p-1.5 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Sidebar Links */}
        <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
          <SidebarLink
            href="/dashboard"
            icon={<LayoutDashboard className="h-4 w-4" />}
            label="Dashboard"
            onClick={() => setIsSidebarOpen(false)}
          />
          <SidebarLink
            href="/dashboard/profile"
            icon={<User className="h-4 w-4" />}
            label="Edit Profile"
            onClick={() => setIsSidebarOpen(false)}
          />
          {user && (user.role === "ADMIN" || user.role === "SUPER_ADMIN" || user.role === "HOD" || user.rights?.includes("MANAGE_COURSES")) && (
            <SidebarLink
              href="/dashboard/courses"
              icon={<BookOpen className="h-4 w-4" />}
              label="Manage Courses"
              onClick={() => setIsSidebarOpen(false)}
            />
          )}
          {user && (user.role === "ADMIN" || user.role === "SUPER_ADMIN" || user.rights?.includes("MANAGE_CATEGORIES")) && (
            <SidebarLink
              href="/dashboard/category"
              icon={<Grid className="h-4 w-4" />}
              label="Manage Categories"
              onClick={() => setIsSidebarOpen(false)}
            />
          )}
          {user && (user.role === "ADMIN" || user.role === "SUPER_ADMIN") && (
            <SidebarLink
              href="/dashboard/departments"
              icon={<Landmark className="h-4 w-4" />}
              label="Manage Departments"
              onClick={() => setIsSidebarOpen(false)}
            />
          )}
          {user && (user.role === "ADMIN" || user.role === "SUPER_ADMIN" || user.rights?.includes("MANAGE_ROUTING")) && (
            <SidebarLink
              href="/dashboard/routing"
              icon={<Shuffle className="h-4 w-4" />}
              label="Routing Rules"
              onClick={() => setIsSidebarOpen(false)}
            />
          )}
          {user && (user.role === "STUDENT" || user.role === "FACULTY" || user.role === "HOD") && (
            <SidebarLink
              href="/dashboard/create-request"
              icon={<PlusCircle className="h-4 w-4" />}
              label="Submit Request"
              onClick={() => setIsSidebarOpen(false)}
            />
          )}
          {user && (user.role === "ADMIN" || user.role === "SUPER_ADMIN" || user.role === "HOD" || user.rights?.includes("MANAGE_USERS")) && (
            <SidebarLink
              href="/dashboard/users"
              icon={<Users className="h-4 w-4" />}
              label="Manage Users"
              onClick={() => setIsSidebarOpen(false)}
            />
          )}
          {user && (user.role === "ADMIN" || user.role === "SUPER_ADMIN" || user.role === "HOD" || user.rights?.includes("MANAGE_USERS")) && (
            <SidebarLink
              href="/dashboard/students"
              icon={<GraduationCap className="h-4 w-4" />}
              label="Manage Students"
              onClick={() => setIsSidebarOpen(false)}
            />
          )}
          <SidebarLink
            href="/dashboard/requests"
            icon={<Inbox className="h-4 w-4" />}
            label="Grievances"
            onClick={() => setIsSidebarOpen(false)}
          />
        </nav>

        {/* Sidebar Footer / Logout */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800">
          <a
            href="/login"
            onClick={handleLogout}
            className="flex items-center gap-3.5 px-4 py-3 w-full text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-xl font-semibold transition-colors text-sm cursor-pointer"
          >
            <LogOut className="h-4 w-4" />
            <span>Sign Out</span>
          </a>
        </div>
      </aside>

      {/* Main Application Container */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Sticky Header */}
        <header className="sticky top-0 h-16 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-4 md:px-8 z-20">
          <div className="flex items-center gap-3">
            {/* Hamburger Button */}
            <button
              type="button"
              onClick={() => setIsSidebarOpen(true)}
              className="md:hidden p-2 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg cursor-pointer"
            >
              <Menu className="h-5 w-5" />
            </button>
            <h2 className="font-bold text-slate-800 dark:text-slate-100 hidden sm:block text-sm md:text-base">
              Shaheed Bhagat Singh State University
            </h2>
            <h2 className="font-bold text-slate-800 dark:text-slate-100 sm:hidden text-sm">
              SBS State University
            </h2>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
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

            {/* Notifications Button */}
            <button
              type="button"
              className="relative p-2 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg cursor-pointer"
            >
              <Bell className="h-5 w-5" />
              <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-red-500 ring-2 ring-white dark:ring-slate-900" />
            </button>

            {/* User Profile Thumbnail & Details */}
            <div className="flex items-center gap-2.5 pl-2 border-l border-slate-200 dark:border-slate-800">
              <div className="flex flex-col text-right hidden sm:flex">
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200 leading-tight">
                  {user?.name || "Loading..."}
                </span>
                <span className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider">
                  {user?.role?.replace("_", " ") || ""}
                </span>
              </div>
              <div className="h-8 w-8 rounded-full bg-primary/10 border border-primary/20 text-primary flex items-center justify-center font-bold text-sm select-none shrink-0">
                {initials}
              </div>
            </div>
          </div>
        </header>

        {/* Dashboard Pages Main Content Area */}
        <main className="flex-1 p-4 md:p-8 overflow-y-auto z-10">
          {isAuthorized() ? (
            children
          ) : (
            <div className="flex flex-col items-center justify-center py-20 text-center gap-4 animate-fade-in">
              <ShieldAlert className="h-16 w-16 text-red-500" />
              <div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-slate-50">Access Denied</h2>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-sm">
                  You do not have the required permissions to view this page. Please contact the administrator if you believe this is an error.
                </p>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
