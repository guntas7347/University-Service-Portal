import Header from "@/components/Header";
import Link from "next/link";
import { ExternalLink, GraduationCap, Award, Users, Heart } from "lucide-react";
import Footer from "@/components/Footer";

export default function MadeBy() {
  const team = [
    {
      name: "Guntas Singh",
      roll: "235030",
      role: "Team Leader",
      link: "https://guntassandhu.com",
    },
    { name: "Anurag", roll: "235030", role: "Team Member" },
    { name: "Gagandeep Kaur", roll: "235026", role: "Team Member" },
    { name: "Gurleen Kaur", roll: "235031", role: "Team Member" },
    { name: "Gurrleen Kaur", roll: "235033", role: "Team Member" },
  ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#090d16] text-slate-800 dark:text-slate-100 transition-colors duration-300">
      <Header />

      <main className="max-w-4xl mx-auto px-6 py-12 md:py-20 space-y-16">
        {/* Header Section */}
        <div className="text-center space-y-4">
          <div className="inline-flex items-center justify-center p-3 bg-brand-orange/10 rounded-2xl mb-2">
            <GraduationCap className="w-8 h-8 text-brand-orange" />
          </div>
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            Project Team & Acknowledgements
          </h1>
          <p className="text-sm md:text-base text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
            Developed as part of the Final Year Project for B.Tech Computer
            Science & Engineering (7th Semester), Batch of 2023.
          </p>
        </div>

        {/* Mentorship & Thanks Grid */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Mentor Card */}
          <div className="bg-white dark:bg-[#0c1220] p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-start gap-4">
            <div className="p-3 bg-blue-500/10 rounded-xl shrink-0">
              <Award className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
                Project Mentor
              </h3>
              <p className="font-bold text-lg text-slate-900 dark:text-white">
                Er. Japinder Singh
              </p>
              <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                Assistant Professor, Dept. of CSE
              </p>
            </div>
          </div>

          {/* Special Thanks Card */}
          <div className="bg-white dark:bg-[#0c1220] p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-start gap-4">
            <div className="p-3 bg-rose-500/10 rounded-xl shrink-0">
              <Heart className="w-6 h-6 text-rose-600 dark:text-rose-400" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
                Special Thanks To
              </h3>
              <p className="font-bold text-lg text-slate-900 dark:text-white">
                Dr. Sunny Behal
              </p>
              <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                Dean Students Welfare (DSW) <br />
                Dept. of CSE
              </p>
            </div>
          </div>
        </div>

        {/* Team Section */}
        <div className="space-y-8">
          <div className="flex items-center gap-3 border-b border-slate-200 dark:border-slate-800 pb-4">
            <Users className="w-6 h-6 text-brand-orange" />
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
              The Team
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {team.map((member, index) => (
              <div
                key={index}
                className="bg-white dark:bg-[#0c1220] p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group"
              >
                {/* Subtle highlight for Team Leader */}
                {member.role === "Team Leader" && (
                  <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-brand-orange to-amber-400" />
                )}

                <div className="space-y-1">
                  <div className="flex items-start justify-between">
                    <h3 className="font-bold text-slate-900 dark:text-white text-lg">
                      {member.name}
                    </h3>
                    {member.link && (
                      <Link
                        href={member.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-slate-400 hover:text-brand-orange transition-colors"
                        title="Visit Portfolio"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </Link>
                    )}
                  </div>
                  <p className="text-sm font-medium text-brand-orange">
                    Roll No: {member.roll}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 pt-1">
                    {member.role}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Group Photo Section */}
        <div className="space-y-4">
          <h3 className="text-sm font-bold text-center text-slate-400 uppercase tracking-wider">
            Project Group Photo
          </h3>
          <div className="w-full aspect-video md:aspect-[21/9] bg-slate-200 dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-800 overflow-hidden relative shadow-sm">
            {/* Replace the src with your actual group photo path */}
            <img
              src="/hamilton-group-photo.jpg"
              alt="Group photo of the Final Year Project Team"
              className="w-full h-full object-cover"
              loading="lazy"
            />
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
