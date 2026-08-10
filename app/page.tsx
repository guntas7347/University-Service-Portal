"use client";

import React, { useState, useEffect } from "react";
import { useTheme } from "@/hooks/useTheme";
import Link from "next/link";
import {
  GraduationCap,
  ArrowRight,
  ShieldCheck,
  Clock,
  ChevronDown,
  CheckCircle2,
  Moon,
  Sun,
  MessageSquare,
  Activity,
  Users,
  FileText,
  UserCheck,
  HelpCircle,
  Mail,
  Phone,
  MapPin,
  Sparkles,
  Lock,
} from "lucide-react";

export default function Home() {
  // Theme and UI States
  const { theme, toggleTheme } = useTheme();
  const isDarkMode = theme === "dark";
  const [activeFaq, setActiveFaq] = useState<number | null>(null);

  // FAQ Accordion Data
  const faqData = [
    {
      question: "Who is eligible to file a grievance on this portal?",
      answer: "All currently enrolled students, faculty members, and administrative staff at Shaheed Bhagat Singh State University are eligible to submit grievances and track their redressal.",
    },
    {
      question: "Can I submit my grievance anonymously?",
      answer: "Yes. When submitting a grievance, you can select the 'Anonymous' option. This hides your personal details (name, roll number, and email) from the department handlers, ensuring your identity is protected while the issue is being resolved.",
    },
    {
      question: "What is the typical resolution time for complaints?",
      answer: "Grievances are processed under standard SLAs. Critical/urgent matters (like exam portal issues or immediate hostel complaints) are usually acknowledged within 12-24 hours. General academic or administrative issues are resolved within 3 to 5 business days.",
    },
    {
      question: "What happens if I am not satisfied with the resolution?",
      answer: "Once a grievance is marked as 'Resolved', you have 7 days to review the action. If you feel the redressal is insufficient, you can decline the resolution and 'Reopen' the complaint for escalation to higher university authorities.",
    },
  ];

  return (
    <div
      className="bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200 min-h-screen font-sans transition-colors duration-300 flex flex-col"
    >
      {/* 1. Header / Navigation */}
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
            <a href="#features" className="text-sm font-semibold hover:text-primary transition-colors">
              Features
            </a>
            <a href="#workflow" className="text-sm font-semibold hover:text-primary transition-colors">
              How It Works
            </a>
            <a href="#stats" className="text-sm font-semibold hover:text-primary transition-colors">
              Impact
            </a>
            <a href="#faqs" className="text-sm font-semibold hover:text-primary transition-colors">
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
              className="text-sm font-semibold px-4 py-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors hidden sm:block"
            >
              Sign In
            </Link>

            {/* Register / Dashboard */}
            <Link
              href="/register"
              className="text-sm font-semibold bg-primary hover:bg-primary/90 text-white px-4 py-2 rounded-xl transition-all shadow-md shadow-primary/10 active:scale-95 cursor-pointer"
            >
              Register
            </Link>
          </div>
        </div>
      </header>

      {/* 2. Hero Section */}
      <section className="relative py-16 sm:py-24 overflow-hidden">
        {/* Glowing Decorative Background Blurs */}
        <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-primary/10 rounded-full blur-3xl opacity-60 dark:opacity-40 -translate-y-1/2 -translate-x-1/2 pointer-events-none"></div>
        <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-indigo-500/10 rounded-full blur-3xl opacity-60 dark:opacity-40 translate-y-1/3 translate-x-1/3 pointer-events-none"></div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
            {/* Text details */}
            <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-primary/10 border border-primary/25 rounded-full text-primary text-xs font-semibold uppercase tracking-wider">
                <Sparkles className="h-3.5 w-3.5" />
                <span>SBSSU Administration Endorsed</span>
              </div>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-slate-900 dark:text-slate-50 tracking-tight leading-[1.1]">
                Voice Your Concerns. <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-indigo-500">
                  Streamline Resolutions.
                </span>
              </h1>
              <p className="text-base sm:text-lg text-secondary max-w-2xl mx-auto lg:mx-0 leading-relaxed font-medium">
                The official Grievance Redressal Portal for Shaheed Bhagat Singh State University.
                Submit complaints, interact directly with department heads, and monitor your case resolution in real-time.
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 pt-4">
                <Link
                  href="/login"
                  className="w-full sm:w-auto h-12 flex items-center justify-center gap-2 px-8 bg-primary hover:bg-primary/95 text-white font-bold rounded-xl transition-all shadow-lg shadow-primary/20 active:scale-98 cursor-pointer"
                >
                  <span>File a Grievance</span>
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  href="/login"
                  className="w-full sm:w-auto h-12 flex items-center justify-center gap-2 px-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 font-bold rounded-xl transition-all active:scale-98 cursor-pointer"
                >
                  <Activity className="h-4 w-4 text-primary" />
                  <span>Track Status</span>
                </Link>
              </div>

              {/* Trust Indicators */}
              <div className="grid grid-cols-3 gap-4 pt-8 border-t border-slate-200/80 dark:border-slate-800/60 max-w-md mx-auto lg:mx-0">
                <div className="flex flex-col items-center lg:items-start">
                  <div className="flex items-center gap-1.5 text-emerald-500">
                    <ShieldCheck className="h-4 w-4" />
                    <span className="text-xs font-bold uppercase tracking-wider">Secured</span>
                  </div>
                  <span className="text-[10px] text-slate-500 mt-0.5">End-to-End SSL</span>
                </div>
                <div className="flex flex-col items-center lg:items-start">
                  <div className="flex items-center gap-1.5 text-primary">
                    <Clock className="h-4 w-4" />
                    <span className="text-xs font-bold uppercase tracking-wider">Fast SLAs</span>
                  </div>
                  <span className="text-[10px] text-slate-500 mt-0.5">24h First Response</span>
                </div>
                <div className="flex flex-col items-center lg:items-start">
                  <div className="flex items-center gap-1.5 text-indigo-500">
                    <Lock className="h-4 w-4" />
                    <span className="text-xs font-bold uppercase tracking-wider">Protected</span>
                  </div>
                  <span className="text-[10px] text-slate-500 mt-0.5">Anonymous Option</span>
                </div>
              </div>
            </div>

            {/* Right Side Visual Preview - Interactive Cards */}
            <div className="lg:col-span-5 relative mt-6 lg:mt-0">
              <div className="absolute inset-0 bg-gradient-to-tr from-primary/10 to-indigo-500/10 rounded-3xl filter blur-xl transform scale-95 pointer-events-none"></div>

              {/* Decorative border wrapper */}
              <div className="relative bg-white/70 dark:bg-slate-900/60 backdrop-blur-xl border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-2xl transition-all duration-300">
                <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800 mb-5">
                  <div className="flex items-center gap-2">
                    <span className="h-3 w-3 rounded-full bg-red-500 animate-ping"></span>
                    <span className="h-3 w-3 rounded-full bg-red-500 absolute"></span>
                    <span className="text-xs font-bold text-slate-900 dark:text-slate-200 uppercase tracking-widest pl-1.5">
                      Live Grievance Monitor
                    </span>
                  </div>
                  <span className="text-[10px] bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full font-semibold">
                    Simulated Preview
                  </span>
                </div>

                <div className="space-y-4">
                  {/* Complaint Item 1 */}
                  <div className="p-4 bg-slate-50/50 dark:bg-slate-955/50 border border-slate-200 dark:border-slate-800 rounded-2xl hover:scale-[1.02] transition-transform duration-200 shadow-sm">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase">
                          Grievance #SBS-1248
                        </span>
                        <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100 mt-0.5">
                          Hostel Block-C Wi-Fi Outage
                        </h4>
                      </div>
                      <span className="text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950/45 text-emerald-855 dark:text-emerald-300 px-2.5 py-1 rounded-full border border-emerald-200/50 dark:border-emerald-800/30">
                        RESOLVED
                      </span>
                    </div>
                    <div className="flex items-center justify-between mt-3.5 pt-2.5 border-t border-slate-200/60 dark:border-slate-800/40 text-[10px] text-slate-500 font-medium">
                      <span>Dept: IT Infrastructure</span>
                      <span>Resolved Today</span>
                    </div>
                  </div>

                  {/* Complaint Item 2 */}
                  <div className="p-4 bg-slate-50/50 dark:bg-slate-955/50 border border-slate-200 dark:border-slate-800 rounded-2xl hover:scale-[1.02] transition-transform duration-200 shadow-sm">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase">
                          Grievance #SBS-1245
                        </span>
                        <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100 mt-0.5">
                          Library Study AC Unit Malfunction
                        </h4>
                      </div>
                      <span className="text-[10px] font-bold bg-amber-100 dark:bg-amber-950/45 text-amber-855 dark:text-amber-300 px-2.5 py-1 rounded-full border border-amber-200/50 dark:border-amber-800/30">
                        IN PROGRESS
                      </span>
                    </div>
                    <div className="flex items-center justify-between mt-3.5 pt-2.5 border-t border-slate-200/60 dark:border-slate-800/40 text-[10px] text-slate-500 font-medium">
                      <span>Dept: Estate Management</span>
                      <span>Assigned 1d ago</span>
                    </div>
                  </div>

                  {/* Complaint Item 3 */}
                  <div className="p-4 bg-slate-50/50 dark:bg-slate-955/50 border border-slate-200 dark:border-slate-800 rounded-2xl hover:scale-[1.02] transition-transform duration-200 shadow-sm">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase">
                          Grievance #SBS-1241
                        </span>
                        <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100 mt-0.5">
                          Registration Fee Payment Timeout
                        </h4>
                      </div>
                      <span className="text-[10px] font-bold bg-indigo-100 dark:bg-indigo-950/45 text-indigo-855 dark:text-indigo-300 px-2.5 py-1 rounded-full border border-indigo-200/50 dark:border-indigo-800/30">
                        SUBMITTED
                      </span>
                    </div>
                    <div className="flex items-center justify-between mt-3.5 pt-2.5 border-t border-slate-200/60 dark:border-slate-800/40 text-[10px] text-slate-500 font-medium">
                      <span>Dept: Accounts Section</span>
                      <span>Received 2h ago</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Statistics Grid */}
      <section id="stats" className="py-12 bg-slate-100/55 dark:bg-slate-900/45 border-y border-slate-200/60 dark:border-slate-800/60 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div className="space-y-1">
              <p className="text-3xl sm:text-4xl font-extrabold text-primary">98.4%</p>
              <p className="text-xs font-semibold text-secondary uppercase tracking-wider">Resolution Rate</p>
            </div>
            <div className="space-y-1">
              <p className="text-3xl sm:text-4xl font-extrabold text-indigo-500">{"< 24 Hours"}</p>
              <p className="text-xs font-semibold text-secondary uppercase tracking-wider">Avg Acknowledgment</p>
            </div>
            <div className="space-y-1">
              <p className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-slate-50">4,200+</p>
              <p className="text-xs font-semibold text-secondary uppercase tracking-wider">Resolved Grievances</p>
            </div>
            <div className="space-y-1">
              <p className="text-3xl sm:text-4xl font-extrabold text-emerald-500">100%</p>
              <p className="text-xs font-semibold text-secondary uppercase tracking-wider">SSL Encrypted</p>
            </div>
          </div>
        </div>
      </section>

      {/* 4. Core Features Section */}
      <section id="features" className="py-20 sm:py-28 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16 space-y-3">
            <h2 className="text-xs font-bold text-primary uppercase tracking-widest">Core Capabilities</h2>
            <h3 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-slate-50 tracking-tight">
              Designed for Speed, Security, and Student Welfare
            </h3>
            <p className="text-sm text-secondary leading-relaxed font-medium">
              Eliminate paper bureaucracy. The portal establishes direct accountability between university departments and our campus community.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Feature Card 1 */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-slate-800/80 rounded-2xl p-6 shadow-sm hover:shadow-md hover:scale-[1.01] transition-all">
              <div className="p-3 bg-primary/10 border border-primary/20 text-primary w-fit rounded-xl mb-5">
                <FileText className="h-6 w-6" />
              </div>
              <h4 className="text-lg font-bold text-slate-900 dark:text-slate-50 mb-2">
                Digital Complaint Filing
              </h4>
              <p className="text-xs text-secondary leading-relaxed">
                Choose departments, describe issues, and upload file attachments (receipts, photos, transcripts). Submit securely in minutes.
              </p>
            </div>

            {/* Feature Card 2 */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-slate-800/80 rounded-2xl p-6 shadow-sm hover:shadow-md hover:scale-[1.01] transition-all">
              <div className="p-3 bg-indigo-500/10 border border-indigo-500/20 text-indigo-500 w-fit rounded-xl mb-5">
                <Activity className="h-6 w-6" />
              </div>
              <h4 className="text-lg font-bold text-slate-900 dark:text-slate-50 mb-2">
                Real-Time Tracking Logs
              </h4>
              <p className="text-xs text-secondary leading-relaxed">
                Stay updated via step-by-step progress tracking. See which officer was assigned, read status reports, and access action logs.
              </p>
            </div>

            {/* Feature Card 3 */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-slate-800/80 rounded-2xl p-6 shadow-sm hover:shadow-md hover:scale-[1.01] transition-all">
              <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 w-fit rounded-xl mb-5">
                <UserCheck className="h-6 w-6" />
              </div>
              <h4 className="text-lg font-bold text-slate-900 dark:text-slate-50 mb-2">
                Resolution Reopening
              </h4>
              <p className="text-xs text-secondary leading-relaxed">
                Redressal satisfaction is guaranteed. If the resolved action is unsatisfactory, reopen the ticket to alert supervisor boards.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 5. Workflow / How It Works */}
      <section id="workflow" className="py-20 bg-slate-100/55 dark:bg-slate-900/45 border-y border-slate-200/60 dark:border-slate-800/60 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16 space-y-3">
            <h2 className="text-xs font-bold text-primary uppercase tracking-widest font-sans">REDRESSAL PIPELINE</h2>
            <h3 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-slate-50 tracking-tight">
              How Your Complaint is Processed
            </h3>
            <p className="text-sm text-secondary font-medium">
              A transparent, structured four-step procedure handling complaints from submission to final check.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 relative">
            {/* Step 1 */}
            <div className="relative flex flex-col items-center text-center group">
              <div className="h-14 w-14 bg-white dark:bg-slate-900 border-2 border-primary rounded-2xl flex items-center justify-center font-bold text-primary shadow-md z-10 group-hover:scale-105 transition-transform">
                01
              </div>
              <h4 className="text-base font-bold text-slate-900 dark:text-slate-50 mt-5 mb-2">
                Submit Grievance
              </h4>
              <p className="text-xs text-secondary px-3 leading-relaxed">
                Log in and fill the form with category details, descriptions, and supporting attachments.
              </p>
            </div>

            {/* Step 2 */}
            <div className="relative flex flex-col items-center text-center group">
              <div className="h-14 w-14 bg-white dark:bg-slate-900 border-2 border-indigo-500 rounded-2xl flex items-center justify-center font-bold text-indigo-500 shadow-md z-10 group-hover:scale-105 transition-transform">
                02
              </div>
              <h4 className="text-base font-bold text-slate-900 dark:text-slate-50 mt-5 mb-2">
                Auto-Routing
              </h4>
              <p className="text-xs text-secondary px-3 leading-relaxed">
                Our system instantly routes the complaint to the designated officer of the selected department.
              </p>
            </div>

            {/* Step 3 */}
            <div className="relative flex flex-col items-center text-center group">
              <div className="h-14 w-14 bg-white dark:bg-slate-900 border-2 border-amber-500 rounded-2xl flex items-center justify-center font-bold text-amber-500 shadow-md z-10 group-hover:scale-105 transition-transform">
                03
              </div>
              <h4 className="text-base font-bold text-slate-900 dark:text-slate-50 mt-5 mb-2">
                Investigation
              </h4>
              <p className="text-xs text-secondary px-3 leading-relaxed">
                The department officer investigates, drafts updates, and implements resolution actions.
              </p>
            </div>

            {/* Step 4 */}
            <div className="relative flex flex-col items-center text-center group">
              <div className="h-14 w-14 bg-white dark:bg-slate-900 border-2 border-emerald-500 rounded-2xl flex items-center justify-center font-bold text-emerald-500 shadow-md z-10 group-hover:scale-105 transition-transform">
                04
              </div>
              <h4 className="text-base font-bold text-slate-900 dark:text-slate-50 mt-5 mb-2">
                Feedback & Closure
              </h4>
              <p className="text-xs text-secondary px-3 leading-relaxed">
                Approve the resolution to close the grievance, or reopen it within 7 days if unresolved.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 6. FAQ Section (Interactive Accordion) */}
      <section id="faqs" className="py-20 sm:py-28 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16 space-y-3">
          <div className="inline-flex items-center justify-center p-2.5 bg-primary/10 border border-primary/20 rounded-xl text-primary mb-1">
            <HelpCircle className="h-5 w-5" />
          </div>
          <h3 className="text-3xl font-extrabold text-slate-900 dark:text-slate-50 tracking-tight">
            Frequently Asked Questions
          </h3>
          <p className="text-sm text-secondary font-medium">
            Find answers to commonly asked questions about submitting and tracking grievances.
          </p>
        </div>

        <div className="space-y-4">
          {faqData.map((faq, index) => {
            const isOpen = activeFaq === index;
            return (
              <div
                key={index}
                className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/85 rounded-2xl overflow-hidden transition-all duration-300"
              >
                <button
                  type="button"
                  onClick={() => setActiveFaq(isOpen ? null : index)}
                  className="w-full flex items-center justify-between p-5 text-left font-bold text-slate-900 dark:text-slate-50 hover:bg-slate-50 dark:hover:bg-slate-950/40 transition-colors cursor-pointer"
                >
                  <span className="text-sm pr-4">{faq.question}</span>
                  <ChevronDown
                    className={`h-4.5 w-4.5 text-slate-400 shrink-0 transition-transform duration-300 ${
                      isOpen ? "rotate-180 text-primary" : ""
                    }`}
                  />
                </button>
                <div
                  className={`transition-all duration-300 ease-in-out ${
                    isOpen ? "max-h-60 opacity-100 border-t border-slate-100 dark:border-slate-800/35" : "max-h-0 opacity-0 pointer-events-none"
                  } overflow-hidden`}
                >
                  <p className="p-5 text-xs text-secondary leading-relaxed bg-slate-50/50 dark:bg-slate-955/20">
                    {faq.answer}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* 7. Footer & Contact Details */}
      <footer className="mt-auto bg-slate-900 dark:bg-slate-955 text-slate-400 border-t border-slate-800 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pb-10 border-b border-slate-800">
            {/* Column 1: Brand */}
            <div className="space-y-3.5">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-primary/20 border border-primary/30 rounded-xl text-primary">
                  <GraduationCap className="h-5 w-5" />
                </div>
                <span className="font-extrabold text-slate-100 tracking-tight text-base">
                  SBS State University
                </span>
              </div>
              <p className="text-xs text-slate-500 leading-relaxed max-w-xs">
                Dedicated to improving student welfare and administrative efficiency through digital accountability.
              </p>
            </div>

            {/* Column 2: Navigation Links */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200">
                Quick Navigation
              </h4>
              <ul className="space-y-2 text-xs">
                <li>
                  <Link href="/login" className="hover:text-white transition-colors">
                    Student Login
                  </Link>
                </li>
                <li>
                  <Link href="/register" className="hover:text-white transition-colors">
                    Create Student Account
                  </Link>
                </li>
                <li>
                  <a href="#features" className="hover:text-white transition-colors">
                    Core Portal Features
                  </a>
                </li>
                <li>
                  <a href="#workflow" className="hover:text-white transition-colors">
                    Redressal Process
                  </a>
                </li>
              </ul>
            </div>

            {/* Column 3: Contact Info */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200">
                Support & Contact
              </h4>
              <ul className="space-y-2 text-xs">
                <li className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-primary shrink-0" />
                  <a href="mailto:grievance@sbs.university.edu" className="hover:text-white transition-colors">
                    grievance@sbs.university.edu
                  </a>
                </li>
                <li className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-primary shrink-0" />
                  <span>+91 1800-244-8899</span>
                </li>
                <li className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-primary shrink-0" />
                  <span>SBS University Campus, IT Block, Room 204</span>
                </li>
              </ul>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between pt-6 text-[10px] text-slate-600 gap-4">
            <p>© {new Date().getFullYear()} Shaheed Bhagat Singh State University. All rights reserved.</p>
            <p>Developed with excellence by Team Hamilton</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
