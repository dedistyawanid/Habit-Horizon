import { useState, useEffect } from "react";
import {
  Rocket,
  Calendar,
  Wallet,
  Activity,
  FileText,
  TrendingUp,
  MapPin,
  Clock,
  ArrowUpRight,
  CheckCircle2,
  Sun,
  Moon,
} from "lucide-react";

interface LandingPageProps {
  onNavigateToLogin: () => void;
}

export default function LandingPage({ onNavigateToLogin }: LandingPageProps) {
  const [isDark, setIsDark] = useState<boolean>(() => {
    const saved = localStorage.getItem("horizon_theme_mode");
    if (saved) return saved === "dark";
    return window.matchMedia("(prefers-color-scheme: dark)").matches;
  });

  useEffect(() => {
    localStorage.setItem("horizon_theme_mode", isDark ? "dark" : "light");
    if (isDark) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [isDark]);

  return (
    <div
      className={`min-h-screen font-sans antialiased transition-colors duration-300 ${
        isDark
          ? "bg-[#141211] text-[#E8E3DD] selection:bg-[#B86B52] selection:text-white"
          : "bg-[#F7F5F0] text-[#2C2724] selection:bg-[#B86B52] selection:text-white"
      }`}
    >
      {/* 1. NAVBAR */}
      <header
        className={`sticky top-0 z-50 backdrop-blur-md border-b transition-colors duration-300 ${
          isDark
            ? "bg-[#141211]/85 border-white/10"
            : "bg-[#F7F5F0]/85 border-[#E2DDD5]"
        }`}
      >
        <div className="max-w-6xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#B86B52] to-[#8C4A35] flex items-center justify-center text-white shadow-md shadow-[#B86B52]/20">
              <Rocket className="w-5 h-5 -rotate-45" />
            </div>
            <span
              className={`text-xl font-bold tracking-tight ${
                isDark ? "text-white" : "text-[#24201D]"
              }`}
            >
              Horizon Hub
            </span>
          </div>

          <nav
            className={`hidden md:flex items-center gap-8 text-sm font-medium ${
              isDark ? "text-[#9E978F]" : "text-[#736B63]"
            }`}
          >
            <a href="#features" className="hover:text-[#B86B52] transition-colors">
              Product
            </a>
            <a href="#features" className="hover:text-[#B86B52] transition-colors">
              Features
            </a>
            <a href="#features" className="hover:text-[#B86B52] transition-colors">
              Journal
            </a>
          </nav>

          <div className="flex items-center gap-3">
            {/* Theme Toggle Button */}
            <button
              onClick={() => setIsDark(!isDark)}
              className={`p-2.5 rounded-full border transition-all ${
                isDark
                  ? "bg-[#221E1C] border-white/10 text-[#D8D2CA] hover:text-white hover:border-white/20"
                  : "bg-[#ECE7DF] border-[#D8D2C7] text-[#5C554D] hover:text-[#24201D] hover:border-[#C4BCB0]"
              }`}
              title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
              aria-label="Toggle theme"
            >
              {isDark ? <Sun className="w-4 h-4 text-[#E2A676]" /> : <Moon className="w-4 h-4 text-[#60584F]" />}
            </button>

            {/* Sign In CTA */}
            <button
              onClick={onNavigateToLogin}
              className={`px-5 py-2.5 rounded-full text-sm font-medium border transition-all ${
                isDark
                  ? "bg-[#24201D] hover:bg-[#302B27] text-white border-white/10 hover:border-[#B86B52]/40"
                  : "bg-[#ECE7DF] hover:bg-[#E2DDD3] text-[#2C2724] border-[#D8D2C7] hover:border-[#B86B52]/40"
              }`}
            >
              Sign In
            </button>
          </div>
        </div>
      </header>

      {/* 2. HERO SECTION */}
      <section className="relative pt-20 pb-16 px-6 overflow-hidden">
        <div
          className={`absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[520px] h-[520px] rounded-full blur-[140px] pointer-events-none ${
            isDark ? "bg-[#B86B52]/15" : "bg-[#B86B52]/10"
          }`}
        />

        <div className="max-w-4xl mx-auto text-center relative z-10">
          <h1
            className={`text-4xl md:text-6xl lg:text-7xl font-extrabold tracking-tight leading-[1.12] mb-6 ${
              isDark ? "text-white" : "text-[#24201D]"
            }`}
          >
            Horizon Hub: Master Your Life,{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#DDA185] via-[#B86B52] to-[#9C543E]">
              from Habits to Finances.
            </span>
          </h1>

          <p
            className={`text-base md:text-lg max-w-2xl mx-auto mb-10 leading-relaxed ${
              isDark ? "text-[#A39B91]" : "text-[#6E665E]"
            }`}
          >
            Your curated personal journal for a balanced life, combining habit tracking,
            health data, financial analytics, and reflective note-taking.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={onNavigateToLogin}
              className="w-full sm:w-auto px-8 py-3.5 rounded-full font-semibold text-white bg-gradient-to-r from-[#B86B52] to-[#9C543E] hover:opacity-95 shadow-xl shadow-[#B86B52]/25 transition-transform transform hover:-translate-y-0.5"
            >
              Get Started Free
            </button>
            <a
              href="#features"
              className={`w-full sm:w-auto px-8 py-3.5 rounded-full font-medium border transition-all text-center ${
                isDark
                  ? "text-[#D8D2CA] bg-[#221E1C] hover:bg-[#2C2724] border-white/10"
                  : "text-[#4A433C] bg-[#ECE7DF] hover:bg-[#E2DDD3] border-[#D8D2C7]"
              }`}
            >
              See How It Works
            </a>
          </div>
        </div>
      </section>

      {/* 3. FEATURES BENTO GRID */}
      <section id="features" className="py-12 px-6 max-w-6xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Card 1: Habits */}
          <div
            className={`p-8 rounded-3xl border transition-all flex flex-col justify-between ${
              isDark
                ? "bg-[#1C1816] border-white/5 hover:border-white/15"
                : "bg-[#FFFFFF] border-[#E5E0D8] shadow-sm hover:shadow-md"
            }`}
          >
            <div>
              <div className="w-11 h-11 rounded-2xl bg-[#B86B52]/15 text-[#B86B52] flex items-center justify-center mb-6">
                <Calendar className="w-5 h-5" />
              </div>
              <h3 className={`text-2xl font-bold mb-3 ${isDark ? "text-white" : "text-[#24201D]"}`}>
                Cultivate Habits
              </h3>
              <p className={`text-sm leading-relaxed mb-8 ${isDark ? "text-[#9E978F]" : "text-[#6E665E]"}`}>
                Cultivate your daily routines, manage habit streaks, and track completion progress effortlessly.
              </p>
            </div>

            <div
              className={`p-5 rounded-2xl border ${
                isDark ? "bg-[#25201D] border-white/5" : "bg-[#F7F5F0] border-[#E8E3DC]"
              }`}
            >
              <div className="flex items-center justify-between text-xs mb-3">
                <span className={isDark ? "text-[#A39B91]" : "text-[#736B63]"}>Today's Progress</span>
                <span className={`font-semibold ${isDark ? "text-white" : "text-[#24201D]"}`}>67%</span>
              </div>
              <div className={`w-full h-2 rounded-full overflow-hidden mb-4 ${isDark ? "bg-white/10" : "bg-[#E2DDD5]"}`}>
                <div className="w-2/3 h-full bg-[#B86B52] rounded-full" />
              </div>
              <div
                className={`flex items-center justify-between p-3 rounded-xl border ${
                  isDark ? "bg-[#181513] border-white/5" : "bg-white border-[#E5E0D8]"
                }`}
              >
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  <span className={`text-xs font-medium ${isDark ? "text-white" : "text-[#24201D]"}`}>
                    Sleep 8 Hours
                  </span>
                </div>
                <span className={`text-[11px] ${isDark ? "text-[#9E978F]" : "text-[#827A71]"}`}>20% this mo</span>
              </div>
            </div>
          </div>

          {/* Card 2: Finances */}
          <div
            className={`p-8 rounded-3xl border transition-all flex flex-col justify-between ${
              isDark
                ? "bg-[#1C1816] border-white/5 hover:border-white/15"
                : "bg-[#FFFFFF] border-[#E5E0D8] shadow-sm hover:shadow-md"
            }`}
          >
            <div>
              <div className="w-11 h-11 rounded-2xl bg-emerald-500/15 text-emerald-500 flex items-center justify-center mb-6">
                <Wallet className="w-5 h-5" />
              </div>
              <h3 className={`text-2xl font-bold mb-3 ${isDark ? "text-white" : "text-[#24201D]"}`}>
                Analyze Finances
              </h3>
              <p className={`text-sm leading-relaxed mb-8 ${isDark ? "text-[#9E978F]" : "text-[#6E665E]"}`}>
                Simplified revenue goals, expense breakdowns, cashflow tracking, and balance insights.
              </p>
            </div>

            <div
              className={`p-5 rounded-2xl border space-y-4 ${
                isDark ? "bg-[#25201D] border-white/5" : "bg-[#F7F5F0] border-[#E8E3DC]"
              }`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className={`text-[11px] ${isDark ? "text-[#8C847B]" : "text-[#8C847B]"}`}>
                    Annual Revenue Goal
                  </p>
                  <p className={`text-xl font-bold ${isDark ? "text-white" : "text-[#24201D]"}`}>
                    65.8M IDR
                  </p>
                </div>
                <div className="text-right">
                  <p className={`text-[11px] ${isDark ? "text-[#8C847B]" : "text-[#8C847B]"}`}>Target</p>
                  <p className={`text-xs ${isDark ? "text-[#C2BCB4]" : "text-[#5C554D]"}`}>500.0M IDR</p>
                </div>
              </div>
              <div className={`grid grid-cols-3 gap-2 text-center pt-2 border-t ${isDark ? "border-white/5" : "border-[#E5E0D8]"}`}>
                <div className={`p-2 rounded-lg ${isDark ? "bg-[#181513]" : "bg-white"}`}>
                  <span className="text-[10px] text-[#8C847B] block">Balance</span>
                  <span className="text-xs font-semibold text-emerald-500">40.3M</span>
                </div>
                <div className={`p-2 rounded-lg ${isDark ? "bg-[#181513]" : "bg-white"}`}>
                  <span className="text-[10px] text-[#8C847B] block">Revenue</span>
                  <span className={`text-xs font-semibold ${isDark ? "text-[#D8D2CA]" : "text-[#24201D]"}`}>65.8M</span>
                </div>
                <div className={`p-2 rounded-lg ${isDark ? "bg-[#181513]" : "bg-white"}`}>
                  <span className="text-[10px] text-[#8C847B] block">Expenses</span>
                  <span className="text-xs font-semibold text-rose-500">25.5M</span>
                </div>
              </div>
            </div>
          </div>

          {/* Card 3: Health */}
          <div
            className={`p-8 rounded-3xl border transition-all flex flex-col justify-between ${
              isDark
                ? "bg-[#1C1816] border-white/5 hover:border-white/15"
                : "bg-[#FFFFFF] border-[#E5E0D8] shadow-sm hover:shadow-md"
            }`}
          >
            <div>
              <div className="w-11 h-11 rounded-2xl bg-rose-500/15 text-rose-500 flex items-center justify-center mb-6">
                <Activity className="w-5 h-5" />
              </div>
              <h3 className={`text-2xl font-bold mb-3 ${isDark ? "text-white" : "text-[#24201D]"}`}>
                Monitor Health
              </h3>
              <p className={`text-sm leading-relaxed mb-8 ${isDark ? "text-[#9E978F]" : "text-[#6E665E]"}`}>
                Keep log of endurance runs, elevation gains, active hours, and vital body metrics.
              </p>
            </div>

            <div
              className={`p-5 rounded-2xl border ${
                isDark ? "bg-[#25201D] border-white/5" : "bg-[#F7F5F0] border-[#E8E3DC]"
              }`}
            >
              <div className="grid grid-cols-3 gap-3 text-center mb-3">
                <div className={`p-3 rounded-xl ${isDark ? "bg-[#181513]" : "bg-white"}`}>
                  <MapPin className="w-3.5 h-3.5 mx-auto mb-1 text-[#8C847B]" />
                  <span className={`text-sm font-bold block ${isDark ? "text-white" : "text-[#24201D]"}`}>27.9</span>
                  <span className="text-[10px] text-[#8C847B]">KM DIST</span>
                </div>
                <div className={`p-3 rounded-xl ${isDark ? "bg-[#181513]" : "bg-white"}`}>
                  <TrendingUp className="w-3.5 h-3.5 mx-auto mb-1 text-[#8C847B]" />
                  <span className={`text-sm font-bold block ${isDark ? "text-white" : "text-[#24201D]"}`}>1,293</span>
                  <span className="text-[10px] text-[#8C847B]">M ELEV</span>
                </div>
                <div className={`p-3 rounded-xl ${isDark ? "bg-[#181513]" : "bg-white"}`}>
                  <Clock className="w-3.5 h-3.5 mx-auto mb-1 text-[#8C847B]" />
                  <span className={`text-sm font-bold block ${isDark ? "text-white" : "text-[#24201D]"}`}>7.7</span>
                  <span className="text-[10px] text-[#8C847B]">HRS ACT</span>
                </div>
              </div>
              <div
                className={`h-10 rounded-xl border flex items-center px-4 justify-between text-xs ${
                  isDark
                    ? "bg-[#181513] border-white/5 text-[#A39B91]"
                    : "bg-white border-[#E5E0D8] text-[#6E665E]"
                }`}
              >
                <span>Running Distance (30D)</span>
                <span className="text-emerald-500 font-semibold">+12% vs last mo</span>
              </div>
            </div>
          </div>

          {/* Card 4: Notes */}
          <div
            className={`p-8 rounded-3xl border transition-all flex flex-col justify-between ${
              isDark
                ? "bg-[#1C1816] border-white/5 hover:border-white/15"
                : "bg-[#FFFFFF] border-[#E5E0D8] shadow-sm hover:shadow-md"
            }`}
          >
            <div>
              <div className="w-11 h-11 rounded-2xl bg-blue-500/15 text-blue-500 flex items-center justify-center mb-6">
                <FileText className="w-5 h-5" />
              </div>
              <h3 className={`text-2xl font-bold mb-3 ${isDark ? "text-white" : "text-[#24201D]"}`}>
                Reflective Notes
              </h3>
              <p className={`text-sm leading-relaxed mb-8 ${isDark ? "text-[#9E978F]" : "text-[#6E665E]"}`}>
                Capture quick thoughts, manage meeting action items, and store reminders privately.
              </p>
            </div>

            <div
              className={`p-5 rounded-2xl border space-y-2.5 ${
                isDark ? "bg-[#25201D] border-white/5" : "bg-[#F7F5F0] border-[#E8E3DC]"
              }`}
            >
              <div
                className={`p-3 rounded-xl border flex items-center justify-between ${
                  isDark ? "bg-[#181513] border-white/5" : "bg-white border-[#E5E0D8]"
                }`}
              >
                <div>
                  <p className={`text-xs font-semibold ${isDark ? "text-white" : "text-[#24201D]"}`}>
                    Meeting Pagi
                  </p>
                  <p className="text-[11px] text-[#8C847B]">Action items review</p>
                </div>
                <span
                  className={`text-[10px] px-2 py-0.5 rounded-full ${
                    isDark ? "bg-white/5 text-[#A39B91]" : "bg-[#EFEAE2] text-[#6E665E]"
                  }`}
                >
                  Work
                </span>
              </div>
              <div
                className={`p-3 rounded-xl border flex items-center justify-between ${
                  isDark ? "bg-[#181513] border-white/5" : "bg-white border-[#E5E0D8]"
                }`}
              >
                <div>
                  <p className={`text-xs font-semibold ${isDark ? "text-white" : "text-[#24201D]"}`}>
                    Pay Rent
                  </p>
                  <p className="text-[11px] text-[#8C847B]">Annual rent transfer</p>
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#B86B52]/20 text-[#B86B52] font-medium">
                  Reminder
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. FOOTER CALL TO ACTION */}
      <section className="py-16 px-6 max-w-6xl mx-auto">
        <div className="relative rounded-3xl p-10 md:p-14 bg-gradient-to-r from-[#B86B52] to-[#8C4A35] text-center overflow-hidden shadow-2xl">
          <div className="relative z-10 max-w-2xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-extrabold text-white mb-4">
              Start Your Balance Today
            </h2>
            <p className="text-white/85 text-sm md:text-base mb-8">
              Take back control of your habits, health, and finances inside one earth-tone workspace.
            </p>
            <button
              onClick={onNavigateToLogin}
              className="px-8 py-3.5 rounded-full bg-[#1C1816] hover:bg-[#2A2421] text-white font-semibold shadow-xl transition-transform inline-flex items-center gap-2"
            >
              Get Started Now <ArrowUpRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </section>

      {/* 5. FOOTER */}
      <footer
        className={`border-t py-10 text-xs text-center transition-colors duration-300 ${
          isDark
            ? "border-white/5 text-[#736B63]"
            : "border-[#E5E0D8] text-[#8C847B]"
        }`}
      >
        <div className="max-w-6xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Rocket className="w-4 h-4 text-[#B86B52] -rotate-45" />
            <span className={`font-semibold ${isDark ? "text-[#D8D2CA]" : "text-[#24201D]"}`}>
              Horizon Hub
            </span>
            <span>&copy; {new Date().getFullYear()} Horizon Hub. All rights reserved.</span>
          </div>
          <div className="flex gap-6">
            <a href="#features" className="hover:text-[#B86B52] transition-colors">
              Features
            </a>
            <a href="#features" className="hover:text-[#B86B52] transition-colors">
              Privacy
            </a>
            <a href="#features" className="hover:text-[#B86B52] transition-colors">
              Terms
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
