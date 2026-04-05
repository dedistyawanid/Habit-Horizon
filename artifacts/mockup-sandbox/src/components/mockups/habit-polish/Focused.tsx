import React, { useState } from 'react';
import { Search, Plus, Check, Flame, ChevronRight } from 'lucide-react';

type Habit = {
  id: number;
  title: string;
  completed: boolean;
  streak: number;
  category: string;
};

const initialHabits: Habit[] = [
  { id: 1, title: 'Morning Run', completed: true, streak: 2, category: 'Health' },
  { id: 2, title: 'Read 30min', completed: false, streak: 3, category: 'Learning' },
  { id: 3, title: 'Cold Shower', completed: true, streak: 14, category: 'Health' },
  { id: 4, title: 'Meditate', completed: false, streak: 0, category: 'Mindfulness' },
  { id: 5, title: 'No Sugar', completed: true, streak: 21, category: 'Health' },
  { id: 6, title: 'Journal', completed: false, streak: 5, category: 'Mindfulness' },
];

const categories = ['All', 'Health', 'Learning', 'Mindfulness'];

export default function Focused() {
  const [habits, setHabits] = useState<Habit[]>(initialHabits);
  const [activeFilter, setActiveFilter] = useState('All');

  const toggleHabit = (id: number) => {
    setHabits(habits.map(h => h.id === id ? { ...h, completed: !h.completed } : h));
  };

  const completedCount = habits.filter(h => h.completed).length;
  const totalCount = habits.length;
  const progressPercent = Math.round((completedCount / totalCount) * 100);

  const filteredHabits = activeFilter === 'All' 
    ? habits 
    : habits.filter(h => h.category === activeFilter);

  return (
    <div className="flex justify-center w-full min-h-screen bg-neutral-900 overflow-hidden font-sans">
      <div className="w-[390px] min-h-[844px] bg-[#F2F2F7] relative shadow-2xl flex flex-col">
        
        {/* Header */}
        <header className="flex items-center justify-between px-6 pt-14 pb-4">
          <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-200">
            <img 
              src="https://api.dicebear.com/7.x/notionists/svg?seed=Dedi&backgroundColor=e2e8f0" 
              alt="Avatar" 
              className="w-full h-full object-cover"
            />
          </div>
          <button className="w-10 h-10 flex items-center justify-center rounded-full bg-black/5 text-slate-700 hover:bg-black/10 transition-colors">
            <Search size={20} />
          </button>
        </header>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto px-6 pb-32 no-scrollbar">
          
          {/* Rich Summary Card */}
          <div className="bg-white rounded-[24px] p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] mb-8">
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <h1 className="text-2xl text-slate-800 tracking-tight">
                  <span className="font-bold">Good</span> <span className="font-light">Morning</span>
                </h1>
                <p className="text-[13px] font-medium text-slate-500 mt-1 mb-6 uppercase tracking-wider">
                  Sunday 5 April 2026<br/>
                  <span className="text-slate-400 font-normal normal-case tracking-normal">19 Syawal 1447 H</span>
                </p>
                <div className="inline-flex items-center gap-2 bg-[#879A77]/10 px-3 py-1.5 rounded-full">
                  <Flame size={14} className="text-[#879A77]" />
                  <span className="text-sm font-medium text-[#879A77]">On a 3-day perfect streak</span>
                </div>
              </div>

              {/* Progress Ring */}
              <div className="relative w-[72px] h-[72px] shrink-0 ml-4">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                  {/* Background Track */}
                  <path
                    className="text-gray-100"
                    strokeWidth="3"
                    stroke="currentColor"
                    fill="none"
                    strokeLinecap="round"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                  {/* Progress Arc */}
                  <path
                    className="text-[#879A77] transition-all duration-700 ease-out"
                    strokeWidth="3"
                    strokeDasharray={`${progressPercent}, 100`}
                    stroke="currentColor"
                    fill="none"
                    strokeLinecap="round"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-lg font-bold text-slate-800 leading-none">{completedCount}</span>
                  <span className="text-[10px] font-medium text-slate-400 mt-0.5 leading-none">of {totalCount}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Filters */}
          <div className="flex gap-2 overflow-x-auto no-scrollbar mb-6 -mx-6 px-6">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setActiveFilter(cat)}
                className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                  activeFilter === cat 
                    ? 'bg-slate-800 text-white shadow-sm' 
                    : 'bg-white text-slate-500 hover:bg-slate-100'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Habits List */}
          <div className="space-y-3">
            {filteredHabits.map(habit => (
              <div 
                key={habit.id}
                className={`bg-white rounded-[20px] p-4 flex items-center gap-4 transition-all duration-300 shadow-[0_4px_20px_rgb(0,0,0,0.03)] cursor-pointer
                  ${habit.completed ? 'opacity-60 grayscale-[0.2]' : 'opacity-100'}`}
                onClick={() => toggleHabit(habit.id)}
              >
                {/* Check Button */}
                <button 
                  className={`w-11 h-11 shrink-0 rounded-full flex items-center justify-center transition-all duration-300 border-2
                    ${habit.completed 
                      ? 'bg-[#879A77] border-[#879A77] text-white shadow-inner scale-95' 
                      : 'border-slate-200 text-transparent hover:border-[#879A77]/50'}`}
                >
                  <Check size={20} strokeWidth={3} className={habit.completed ? 'scale-100' : 'scale-50 opacity-0'} />
                </button>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className={`text-[17px] font-medium text-slate-800 truncate transition-all duration-300
                      ${habit.completed ? 'line-through text-slate-500' : ''}`}>
                      {habit.title}
                    </h3>
                    {habit.streak > 0 && (
                      <div className="flex items-center gap-0.5 text-orange-500 bg-orange-50 px-1.5 py-0.5 rounded text-[11px] font-bold shrink-0">
                        <Flame size={10} strokeWidth={3} />
                        {habit.streak}
                      </div>
                    )}
                  </div>
                  <p className="text-[13px] text-slate-400 font-medium">{habit.category}</p>
                </div>

              </div>
            ))}
          </div>
          
        </div>

        {/* FAB */}
        <button className="absolute bottom-8 right-6 w-14 h-14 bg-[#879A77] text-white rounded-full flex items-center justify-center shadow-[0_8px_30px_rgba(135,154,119,0.4)] hover:scale-105 active:scale-95 transition-all">
          <Plus size={24} strokeWidth={2.5} />
        </button>

        {/* Gradient fade at bottom of list */}
        <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-[#F2F2F7] to-transparent pointer-events-none" />
      </div>
    </div>
  );
}
