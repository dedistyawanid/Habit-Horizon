import React, { useState } from "react";
import { Search, Plus, Check, Flame, Droplets, BookOpen, Brain, Activity } from "lucide-react";

export function Warmer() {
  const [activeFilter, setActiveFilter] = useState("All");

  const habits = [
    { id: 1, name: "Morning Run", category: "Health", streak: 2, done: true, icon: Activity },
    { id: 2, name: "Read 30min", category: "Learning", streak: 3, done: false, icon: BookOpen },
    { id: 3, name: "Cold Shower", category: "Health", streak: 14, done: true, icon: Droplets },
    { id: 4, name: "Meditate", category: "Mindfulness", streak: 0, done: false, icon: Brain },
    { id: 5, name: "No Sugar", category: "Health", streak: 21, done: true, icon: Activity },
  ];

  const filters = ["All", "Health", "Learning", "Mindfulness", "Productivity"];

  return (
    <div className="mx-auto w-[390px] min-h-screen bg-[#FAF8F5] font-sans text-slate-800 relative overflow-hidden pb-24 shadow-2xl">
      {/* Background Soft Gradients */}
      <div className="absolute top-0 left-0 w-full h-64 bg-gradient-to-b from-[#879A77]/10 to-transparent pointer-events-none" />

      {/* Header Section */}
      <header className="px-6 pt-12 pb-6 relative z-10">
        <div className="flex justify-between items-start mb-2">
          <div>
            <h1 className="text-3xl text-slate-900 tracking-tight">
              <span className="font-bold">Good</span>{" "}
              <span className="font-light">Morning, Dedi</span>
            </h1>
            <p className="text-sm text-slate-500 mt-1 font-medium">
              Sunday 5 April 2026 · 19 Syawal 1447 H
            </p>
          </div>
          <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-white shadow-sm shrink-0">
            <img 
              src="https://api.dicebear.com/7.x/notionists/svg?seed=Dedi&backgroundColor=e2e8f0" 
              alt="Avatar" 
              className="w-full h-full object-cover"
            />
          </div>
        </div>
        <p className="text-sm italic text-[#879A77] mt-3 opacity-90">
          "Small disciplines repeated with consistency every day lead to great achievements."
        </p>
      </header>

      {/* Main Dashboard Card */}
      <div className="px-6 relative z-10 mb-6">
        <div className="bg-white rounded-[24px] p-5 shadow-[0_8px_30px_rgb(0,0,0,0.04)] flex items-center justify-between">
          <div className="flex-1">
            <h2 className="text-lg font-semibold text-slate-800 mb-1">Daily Progress</h2>
            <p className="text-sm text-slate-500 mb-4">3 of 5 completed today</p>
            
            <div className="inline-flex items-center gap-2 bg-[#FAF8F5] px-3 py-1.5 rounded-full text-xs font-medium text-slate-600">
              <span className="text-orange-500">🔥</span> Top: No Sugar (21d)
            </div>
          </div>
          
          {/* Circular Progress */}
          <div className="relative w-24 h-24 shrink-0 flex items-center justify-center">
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
              <circle 
                cx="50" cy="50" r="40" 
                stroke="#F2F2F7" 
                strokeWidth="8" 
                fill="none" 
              />
              <circle 
                cx="50" cy="50" r="40" 
                stroke="#879A77" 
                strokeWidth="8" 
                fill="none" 
                strokeDasharray="251.2" 
                strokeDashoffset={251.2 - (251.2 * 0.6)} 
                strokeLinecap="round" 
                className="transition-all duration-1000 ease-out"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-2xl font-bold text-slate-800">60<span className="text-sm">%</span></span>
            </div>
          </div>
        </div>
      </div>

      {/* Controls: Search & Filters */}
      <div className="px-6 mb-6">
        <div className="relative mb-4">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input 
            type="text" 
            placeholder="Search habits..." 
            className="w-full bg-white rounded-full py-3 pl-11 pr-4 text-sm shadow-[0_4px_20px_rgb(0,0,0,0.03)] outline-none focus:ring-2 focus:ring-[#879A77]/20 placeholder:text-slate-400 transition-all border-none"
          />
        </div>
        
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide -mx-6 px-6">
          {filters.map(filter => (
            <button
              key={filter}
              onClick={() => setActiveFilter(filter)}
              className={`whitespace-nowrap px-4 py-2 rounded-full text-sm font-medium transition-all border border-transparent ${
                activeFilter === filter 
                  ? "bg-[#879A77] text-white shadow-md" 
                  : "bg-white text-slate-500 shadow-[0_2px_10px_rgb(0,0,0,0.02)] hover:bg-slate-50 hover:border-slate-100"
              }`}
            >
              {filter}
            </button>
          ))}
        </div>
      </div>

      {/* Habits List */}
      <div className="px-6 space-y-3 relative z-10">
        {habits.map((habit) => (
          <div 
            key={habit.id}
            className={`bg-white rounded-[20px] p-4 flex items-center gap-4 transition-all border border-transparent hover:border-slate-100 ${
              habit.done ? "opacity-75 shadow-sm" : "shadow-[0_8px_20px_rgb(0,0,0,0.03)]"
            }`}
          >
            <button 
              className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 border-2 transition-colors ${
                habit.done 
                  ? "bg-[#879A77] border-[#879A77] text-white" 
                  : "border-slate-200 text-transparent hover:border-[#879A77]"
              }`}
            >
              <Check className="w-4 h-4" strokeWidth={3} />
            </button>
            
            <div className="flex-1 min-w-0">
              <h3 className={`font-semibold text-[16px] truncate ${habit.done ? "text-slate-500 line-through decoration-slate-300" : "text-slate-800"}`}>
                {habit.name}
              </h3>
              <div className="flex items-center gap-3 mt-1">
                <span className="text-xs font-medium text-slate-400">{habit.category}</span>
                {habit.streak > 0 && (
                  <div className="flex items-center text-xs font-medium text-orange-500 bg-orange-50 px-1.5 py-0.5 rounded-md">
                    <Flame className="w-3 h-3 mr-0.5" />
                    {habit.streak}d
                  </div>
                )}
              </div>
            </div>
            
            <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
              habit.done ? "bg-slate-50 text-slate-400" : "bg-[#FAF8F5] text-[#879A77]"
            }`}>
              <habit.icon className="w-5 h-5" />
            </div>
          </div>
        ))}
      </div>

      {/* Floating Add Button */}
      <button className="absolute bottom-8 right-6 w-14 h-14 bg-[#879A77] text-white rounded-full flex items-center justify-center shadow-[0_8px_20px_rgba(135,154,119,0.4)] hover:bg-[#768966] transition-transform hover:scale-105 active:scale-95 z-50">
        <Plus className="w-6 h-6" />
      </button>

      {/* Base CSS for scrollbar hiding */}
      <style dangerouslySetInnerHTML={{__html: `
        .scrollbar-hide::-webkit-scrollbar {
            display: none;
        }
        .scrollbar-hide {
            -ms-overflow-style: none;
            scrollbar-width: none;
        }
      `}} />
    </div>
  );
}
