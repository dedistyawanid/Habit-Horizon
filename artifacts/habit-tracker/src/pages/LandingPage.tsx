import React from "react";
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
} from "lucide-react";

interface LandingPageProps {
  onNavigateToLogin: () => void;
}

export default function LandingPage({ onNavigateToLogin }: LandingPageProps) {
  return (
    <div className="min-h-screen bg-[#121212] text-[#E5E0DA] font-sans antialiased selection:bg-[#B86B52] selection:text-white">
      {/* NAVBAR */}
      <header className="sticky top-0 z-50 backdrop-blur-md bg-[#121212]/80 border-b border-white/5">
        <div className="max-w-6xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#B86B52] to-[#8C4A35] flex items-center justify-center text-white shadow-lg shadow-[#B86B52]/20">
              <Rocket className="w-5 h-5 -rotate-45" />
            </div>
            <span className="text-xl font-bold tracking-tight text-white">
              Horizon Hub
            </span>
          </div>

          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-[#A39E98]">
            <a href="#features" className="hover:text-white transition-colors">
              Product
            </a>
            <a href="#features" className="hover:text-white transition-colors">
              Features
            </a>
            <a href="#features" className="hover:text-white transition-colors">
              Journal
            </a>
            <a href="#features" className="hover:text-white transition-colors">
              Blog
            </a>
          </nav>

          <div className="flex items-center gap-3">
            <button
              onClick={onNavigateToLogin}
              className="px-5 py-2.5 rounded-full text-sm font-medium bg-[#24211E] hover:bg-[#322D28] text-white border border-white/10 transition-all hover:border-[#B86B52]/40"
            >
              Sign In
            </button>
          </div>
        </div>
      </header>

      {/* HERO SECTION */}
      <section className="relative pt-20 pb-16 px-6 overflow-hidden">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[550px] bg-[#B86B52]/10 rounded-full blur-[140px] pointer-events-none" />

        <div className="max-w-4xl mx-auto text-center relative z-10">
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-extrabold tracking-tight text-white leading-[1.15] mb-6">
            Horizon Hub: Master Your Life,{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#DDA185] via-[#B86B52] to-[#C97C62]">
              from Habits to Finances.
            </span>
          </h1>

          <p className="text-base md:text-lg text-[#9C948B] max-w-2xl mx-auto mb-10 leading-relaxed">
            Your curated personal journal for a balanced life, combining habit
            tracking, health data, financial analytics, and reflective
            note-taking.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={onNavigateToLogin}
              className="w-full sm:w-auto px-8 py-3.5 rounded-full font-semibold text-white bg-gradient-to-r from-[#B86B52] to-[#9C543E] hover:opacity-95 shadow-xl shadow-[#B86B52]/25 transition-all transform hover:-translate-y-0.5"
            >
              Get Started Free
            </button>
            <a
              href="#features"
              className="w-full sm:w-auto px-8 py-3.5 rounded-full font-medium text-[#D8D2CA] bg-[#1E1B18] hover:bg-[#2A2622] border border-white/10 transition-all text-center"
            >
              See How It Works
            </a>
          </div>
        </div>

        {/* ECOSYSTEM PREVIEW */}
        <div className="max-w-4xl mx-auto mt-20 relative">
          <div className="relative mx-auto w-full max-w-lg aspect-square rounded-full border border-dashed border-white/15 p-8 flex items-center justify-center bg-gradient-to-b from-[#1C1815]/50 to-transparent">
            <div className="text-center z-10 p-6 rounded-3xl bg-[#1B1815] border border-white/10 shadow-2xl backdrop-blur-md">
              <div className="w-12 h-12 mx-auto mb-3 rounded-2xl bg-[#B86B52]/20 border border-[#B86B52]/40 flex items-center justify-center text-[#DDA185]">
                <Rocket className="w-6 h-6 -rotate-45" />
              </div>
              <h4 className="font-bold text-white text-base">Ecosystem Wheel</h4>
              <p className="text-xs text-[#8A837A] mt-1">Unified Daily Life Hub</p>
            </div>

            <div className="absolute top-4 left-1/2 -translate-x-1/2 px-4 py-2 rounded-2xl bg-[#231F1C] border border-white/10 flex items-center gap-2 text-xs font-semibold text-[#D8D2CA] shadow-lg">
              <Calendar className="w-4 h-4 text-[#B86B52]" /> Habits
            </div>
            <div className="absolute right-4 top-1/2 -translate-y-1/2 px-4 py-2 rounded-2xl bg-[#231F1C] border border-white/10 flex items-center gap-2 text-xs font-semibold text-[#D8D2CA] shadow-lg">
              <Wallet className="w-4 h-4 text-[#34D399]" /> Finance
            </div>
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 px-4 py-2 rounded-2xl bg-[#231F1C] border border-white/10 flex items-center gap-2 text-xs font-semibold text-[#D8D2CA] shadow-lg">
              <Activity className="w-4 h-4 text-[#F87171]" /> Health
            </div>
            <div className="absolute left-4 top-1/2 -translate-y-1/2 px-4 py-2 rounded-2xl bg-[#231F1C] border border-white/10 flex items-center gap-2 text-xs font-semibold text-[#D8D2CA] shadow-lg">
              <FileText className="w-4 h-4 text-[#60A5FA]" /> Notes
            </div>
          </div>
        </div>
      </section>

      {/* FEATURES GRID */}
      <section id="features" className="py-20 px-6 max-w-6xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Habits */}
          <div className="p-8 rounded-3xl bg-[#191614] border border-white/5 flex flex-col justify-between">
            <div>
              <div className="w-11 h-11 rounded-2xl bg-[#B86B52]/15 text-[#DDA185] flex items-center justify-center mb-6">
                <Calendar className="w-5 h-5" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-3">Cultivate Habits</h3>
              <p className="text-sm text-[#958E85] leading-relaxed mb-8">
                Cultivate your daily routines, manage habit streaks, and track completion progress effortlessly.
              </p>
            </div>
            <div className="p-5 rounded-2xl bg-[#221E1A] border border-white/5">
              <div className="flex items-center justify-between text-xs text-[#A79F95] mb-3">
                <span>Today's Progress</span>
                <span className="font-semibold text-white">67%</span>
              </div>
              <div className="w-full h-2 rounded-full bg-white/5 overflow-hidden mb-4">
                <div className="w-2/3 h-full bg-[#B86B52] rounded-full" />
              </div>
              <div className="flex items-center justify-between p-3 rounded-xl bg-[#161311] border border-white/5">
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="w-4 h-4 text-[#34D399]" />
                  <span className="text-xs font-medium text-white">Sleep 8 Hours</span>
                </div>
                <span className="text-[11px] text-[#A79F95]">20% this mo</span>
              </div>
            </div>
          </div>

          {/* Finances */}
          <div className="p-8 rounded-3xl bg-[#191614] border border-white/5 flex flex-col justify-between">
            <div>
              <div className="w-11 h-11 rounded-2xl bg-emerald-500/15 text-emerald-400 flex items-center justify-center mb-6">
                <Wallet className="w-5 h-5" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-3">Analyze Finances</h3>
              <p className="text-sm text-[#958E85] leading-relaxed mb-8">
                Simplified revenue goals, expense breakdowns, cashflow tracking, and balance insights.
              </p>
            </div>
            <div className="p-5 rounded-2xl bg-[#221E1A] border border-white/5 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[11px] text-[#8C847B]">Annual Revenue Goal</p>
                  <p className="text-xl font-bold text-white">65.8M IDR</p>
                </div>
                <div className="text-right">
                  <p className="text-[11px] text-[#8C847B]">Target</p>
                  <p className="text-xs text-[#C2BCB4]">500.0M IDR</p>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2 text-center pt-2 border-t border-white/5">
                <div className="p-2 rounded-lg bg-[#161311]">
                  <span className="text-[10px] text-[#8C847B] block">Balance</span>
                  <span className="text-xs font-semibold text-emerald-400">40.3M</span>
                </div>
                <div className="p-2 rounded-lg bg-[#161311]">
                  <span className="text-[10px] text-[#8C847B] block">Revenue</span>
                  <span className="text-xs font-semibold text-[#D8D2CA]">65.8M</span>
                </div>
                <div className="p-2 rounded-lg bg-[#161311]">
                  <span className="text-[10px] text-[#8C847B] block">Expenses</span>
                  <span className="text-xs font-semibold text-rose-400">25.5M</span>
                </div>
              </div>
            </div>
          </div>

          {/* Health */}
          <div className="p-8 rounded-3xl bg-[#191614] border border-white/5 flex flex-col justify-between">
            <div>
              <div className="w-11 h-11 rounded-2xl bg-rose-500/15 text-rose-400 flex items-center justify-center mb-6">
                <Activity className="w-5 h-5" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-3">Monitor Health</h3>
              <p className="text-sm text-[#958E85] leading-relaxed mb-8">
                Keep log of endurance runs, elevation gains, active hours, and vital body metrics.
              </p>
            </div>
            <div className="p-5 rounded-2xl bg-[#221E1A] border border-white/5">
              <div className="grid grid-cols-3 gap-3 text-center mb-3">
                <div className="p-3 rounded-xl bg-[#161311]">
                  <MapPin className="w-3.5 h-3.5 mx-auto mb-1 text-[#8C847B]" />
                  <span className="text-sm font-bold text-white block">27.9</span>
                  <span className="text-[10px] text-[#8C847B]">KM DIST</span>
                </div>
                <div className="p-3 rounded-xl bg-[#161311]">
                  <TrendingUp className="w-3.5 h-3.5 mx-auto mb-1 text-[#8C847B]" />
                  <span className="text-sm font-bold text-white block">1,293</span>
                  <span className="text-[10px] text-[#8C847B]">M ELEV</span>
                </div>
                <div className="p-3 rounded-xl bg-[#161311]">
                  <Clock className="w-3.5 h-3.5 mx-auto mb-1 text-[#8C847B]" />
                  <span className="text-sm font-bold text-white block">7.7</span>
                  <span className="text-[10px] text-[#8C847B]">HRS ACT</span>
                </div>
              </div>
              <div className="h-10 rounded-xl bg-[#161311] border border-white/5 flex items-center px-4 justify-between text-xs text-[#A79F95]">
                <span>Running Distance (30D)</span>
                <span className="text-emerald-400 font-semibold">+12% vs last mo</span>
              </div>
            </div>
          </div>

          {/* Notes */}
          <div className="p-8 rounded-3xl bg-[#191614] border border-white/5 flex flex-col justify-between">
            <div>
              <div className="w-11 h-11 rounded-2xl bg-blue-500/15 text-blue-400 flex items-center justify-center mb-6">
                <FileText className="w-5 h-5" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-3">Reflective Notes</h3>
              <p className="text-sm text-[#958E85] leading-relaxed mb-8">
                Capture quick thoughts, manage meeting action items, and store reminders privately.
              </p>
            </div>
            <div className="p-5 rounded-2xl bg-[#221E1A] border border-white/5 space-y-2.5">
              <div className="p-3 rounded-xl bg-[#161311] border border-white/5 flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-white">Meeting Pagi</p>
                  <p className="text-[11px] text-[#8C847B]">Action items review</p>
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/5 text-[#A79F95]">
                  Work
                </span>
              </div>
              <div className="p-3 rounded-xl bg-[#161311] border border-white/5 flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-white">Pay Rent</p>
                  <p className="text-[11px] text-[#8C847B]">Annual rent transfer</p>
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#B86B52]/20 text-[#DDA185]">
                  Reminder
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER CTA */}
      <section className="py-16 px-6 max-w-6xl mx-auto">
        <div className="relative rounded-3xl p-10 md:p-14 bg-gradient-to-r from-[#B86B52] to-[#8C4A35] text-center overflow-hidden shadow-2xl">
          <div className="relative z-10 max-w-2xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-extrabold text-white mb-4">
              Start Your Balance Today
            </h2>
            <p className="text-white/80 text-sm md:text-base mb-8">
              Take back control of your habits, health, and finances inside one earth-tone workspace.
            </p>
            <button
              onClick={onNavigateToLogin}
              className="px-8 py-3.5 rounded-full bg-[#1A1715] hover:bg-[#25201D] text-white font-semibold shadow-xl transition-transform inline-flex items-center gap-2"
            >
              Get Started Now <ArrowUpRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-white/5 py-10 text-xs text-[#7A746C] text-center">
        <div className="max-w-6xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Rocket className="w-4 h-4 text-[#B86B52] -rotate-45" />
            <span className="text-[#C2BCB4] font-medium">Horizon Hub</span>
            <span>&copy; {new Date().getFullYear()} Horizon Hub. All rights reserved.</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
