"use client";

import { useTheme } from "@/hooks/useTheme";
import { GraduationCap, Moon, Sun } from "lucide-react";
import Link from "next/link";

export default function Header() {
  const { theme, toggleTheme } = useTheme();
  const isDarkMode = theme === "dark";

  return (
    <header className="sticky top-0 z-50 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200/60 dark:border-slate-800/50 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Logo Brand */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="p-2 bg-primary/10 border border-primary/20 rounded-xl group-hover:scale-105 transition-transform">
            <GraduationCap className="h-6 w-6 text-primary" />
          </div>
          <div>
            <span className="font-extrabold text-slate-900 dark:text-slate-50 tracking-tight text-base sm:text-lg block leading-none">
              SBSSU
            </span>
            <span className="text-[10px] font-semibold text-secondary uppercase tracking-wider block mt-0.5">
              Redressal Portal
            </span>
          </div>
        </Link>

        {/* Nav Links - Desktop */}
        <nav className="hidden md:flex items-center gap-8">
          <a
            href="/#features"
            className="text-sm font-semibold hover:text-primary transition-colors"
          >
            Features
          </a>
          <a
            href="/#workflow"
            className="text-sm font-semibold hover:text-primary transition-colors"
          >
            How It Works
          </a>
          <a
            href="/#stats"
            className="text-sm font-semibold hover:text-primary transition-colors"
          >
            Impact
          </a>
          <a
            href="/#faqs"
            className="text-sm font-semibold hover:text-primary transition-colors"
          >
            FAQs
          </a>
        </nav>

        {/* Action Buttons */}
        <div className="flex items-center gap-3">
          {/* Theme Switcher */}
          <button
            type="button"
            onClick={toggleTheme}
            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-500 dark:text-slate-400 transition-colors cursor-pointer"
            aria-label="Toggle theme"
          >
            {isDarkMode ? (
              <Sun className="h-5 w-5 text-amber-400" />
            ) : (
              <Moon className="h-5 w-5 text-primary" />
            )}
          </button>

          {/* Login */}
          <Link
            href="/login"
            className="text-sm font-semibold bg-primary hover:bg-primary/90 text-white px-4 py-2 rounded-xl transition-all shadow-md shadow-primary/10 active:scale-95 cursor-pointer"
          >
            Sign In
          </Link>
        </div>
      </div>
    </header>
  );
}
