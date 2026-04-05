import React, { useState } from 'react';

export default function Terminal() {
  const [habits, setHabits] = useState([
    { id: 1, name: 'Morning Run', done: true, streak: 7 },
    { id: 2, name: 'Read 30min', done: false, streak: 3 },
    { id: 3, name: 'Cold Shower', done: true, streak: 14 },
    { id: 4, name: 'Meditate', done: false, streak: 0 },
    { id: 5, name: 'No Sugar', done: true, streak: 21 },
    { id: 6, name: 'Journal', done: false, streak: 5 },
  ]);

  const toggleHabit = (id: number) => {
    setHabits(habits.map(h => h.id === id ? { ...h, done: !h.done } : h));
  };

  const completedCount = habits.filter(h => h.done).length;
  const totalCount = habits.length;
  const percentage = Math.round((completedCount / totalCount) * 100);

  const renderProgressBar = (percent: number) => {
    const totalBlocks = 10;
    const filledBlocks = Math.round((percent / 100) * totalBlocks);
    const emptyBlocks = totalBlocks - filledBlocks;
    return `${'█'.repeat(filledBlocks)}${'░'.repeat(emptyBlocks)}`;
  };

  const today = new Date();
  const dateStr = today.toISOString().split('T')[0];

  return (
    <div className="flex justify-center bg-black min-h-screen pt-10">
      <div className="w-[390px] h-[844px] bg-[#0D1117] text-[#39D353] font-mono text-sm overflow-hidden flex flex-col relative">
        <div className="sticky top-0 bg-[#0D1117] pt-4 px-4 pb-2 z-10 border-b border-[#39D353]/30">
          <div className="flex flex-col gap-1 mb-4">
            <div><span className="text-white">user@host</span>:<span className="text-blue-400">~/habits</span>$ ./dedi</div>
            <div className="opacity-70">Starting daily routine tracker...</div>
            <div className="opacity-70">Date: {dateStr}</div>
          </div>
          
          <div className="flex gap-4 mb-2 text-xs">
            <span className="bg-[#39D353] text-black px-1">[TODAY]</span>
            <span className="opacity-50 hover:opacity-100 cursor-pointer">[WEEK]</span>
            <span className="opacity-50 hover:opacity-100 cursor-pointer">[STATS]</span>
            <span className="opacity-50 hover:opacity-100 cursor-pointer">[LOG]</span>
          </div>

          <div className="mt-4 mb-2">
            <div>PROGRESS: {completedCount}/{totalCount} today — {percentage}%</div>
            <div>{renderProgressBar(percentage)}</div>
          </div>
        </div>

        <div className="flex-1 p-4 overflow-y-auto">
          <div className="flex text-xs opacity-50 mb-2">
            <div className="w-8">STAT</div>
            <div className="w-12">STRK</div>
            <div className="flex-1">TASK_NAME</div>
          </div>
          
          {habits.map((habit) => (
            <div 
              key={habit.id} 
              className="flex items-center py-1 cursor-pointer hover:bg-[#39D353]/10 transition-colors"
              onClick={() => toggleHabit(habit.id)}
            >
              <div className="w-8">
                {habit.done ? '[x]' : '[ ]'}
              </div>
              <div className={`w-12 ${habit.streak > 0 ? 'text-[#F0A500]' : 'opacity-50'}`}>
                {habit.streak > 0 ? `${habit.streak}d↑` : '--'}
              </div>
              <div className={`flex-1 ${habit.done ? 'opacity-50 line-through' : ''}`}>
                {habit.name}
              </div>
            </div>
          ))}

          <div className="mt-8 flex items-center gap-2">
            <span className="text-white">user@host</span>:<span className="text-blue-400">~/habits</span>$ <span className="animate-pulse">_</span>
          </div>
        </div>
      </div>
    </div>
  );
}
