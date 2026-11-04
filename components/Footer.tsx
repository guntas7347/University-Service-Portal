import { GraduationCap, Mail, MapPin, Phone } from "lucide-react";
import MadeBy from "./MadeBy";
import Link from "next/link";

export default function Footer() {
  return (
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
              Dedicated to improving student welfare and administrative
              efficiency through digital accountability.
            </p>
          </div>

          {/* Column 2: Navigation Links */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200">
              Quick Navigation
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link
                  href="/login"
                  className="hover:text-white transition-colors"
                >
                  Student Login
                </Link>
              </li>
              <li>
                <Link
                  href="/register"
                  className="hover:text-white transition-colors"
                >
                  Create Student Account
                </Link>
              </li>
              <li>
                <a
                  href="#features"
                  className="hover:text-white transition-colors"
                >
                  Core Portal Features
                </a>
              </li>
              <li>
                <a
                  href="#workflow"
                  className="hover:text-white transition-colors"
                >
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
                <a
                  href="mailto:grievance@sbs.university.edu"
                  className="hover:text-white transition-colors"
                >
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
          <p>
            © {new Date().getFullYear()} Shaheed Bhagat Singh State University.
            All rights reserved.
          </p>
          <MadeBy />
        </div>
      </div>
    </footer>
  );
}
