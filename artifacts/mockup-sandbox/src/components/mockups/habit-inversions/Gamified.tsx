import React, { useState } from "react";
import { User, Trophy, Flame, Sword, Shield, Zap, ChevronRight, Activity, Crosshair, Target, Star, Home, Calendar, BarChart3, Settings } from "lucide-react";

export default function Gamified() {
  const [activeTab, setActiveTab] = useState("quests");

  return (
    <div className="flex justify-center w-full min-h-screen bg-black overflow-hidden font-sans">
      {/* Mobile Simulator */}
      <div className="w-full max-w-[390px] min-h-screen bg-[#0F0F1A] text-white relative shadow-2xl flex flex-col">
        
        {/* Top Bar / Player Profile */}
        <div className="p-5 pb-6 border-b border-[#7C3AED]/30 bg-gradient-to-b from-[#7C3AED]/10 to-transparent relative overflow-hidden">
          {/* Neon Glow Effects */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-[#7C3AED]/20 blur-[50px] rounded-full"></div>
          <div className="absolute top-10 left-0 w-24 h-24 bg-[#06B6D4]/20 blur-[40px] rounded-full"></div>

          <div className="relative z-10">
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="w-12 h-12 rounded-lg bg-gradient-to-tr from-[#7C3AED] to-[#06B6D4] p-[2px]">
                    <div className="w-full h-full bg-[#0F0F1A] rounded-md flex items-center justify-center relative overflow-hidden">
                      <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Dedi&backgroundColor=transparent" alt="Avatar" className="w-10 h-10 object-cover absolute bottom-0" />
                    </div>
                  </div>
                  <div className="absolute -bottom-2 -right-2 bg-[#EC4899] text-white text-[10px] font-black px-1.5 py-0.5 rounded border border-[#0F0F1A] tracking-wider">
                    LVL 12
                  </div>
                </div>
                <div>
                  <h1 className="text-xl font-black uppercase tracking-tight text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.3)]">Dedi Styawan</h1>
                  <div className="text-[10px] text-[#06B6D4] font-bold tracking-widest uppercase flex items-center gap-1">
                    <Star className="w-3 h-3 fill-[#06B6D4]" />
                    Streak Master
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-[#7C3AED] via-[#06B6D4] to-[#EC4899] drop-shadow-[0_0_10px_rgba(124,58,237,0.5)]">
                  2,847
                </div>
                <div className="text-[10px] text-gray-400 font-bold tracking-widest uppercase">Total XP</div>
              </div>
            </div>

            {/* XP Bar */}
            <div className="space-y-1.5 mt-2">
              <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest text-gray-300">
                <span>XP Progress</span>
                <span className="text-[#EC4899]">420 XP to LVL 13</span>
              </div>
              <div className="h-3 w-full bg-[#1A1A2E] rounded-full overflow-hidden border border-[#7C3AED]/30 relative shadow-[inset_0_2px_4px_rgba(0,0,0,0.6)]">
                <div 
                  className="h-full bg-gradient-to-r from-[#7C3AED] via-[#06B6D4] to-[#EC4899] relative"
                  style={{ width: '85%' }}
                >
                  {/* Glare effect on bar */}
                  <div className="absolute top-0 left-0 w-full h-1 bg-white/30 rounded-full"></div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content / Quest Board */}
        <div className="flex-1 p-5 overflow-y-auto pb-24 scrollbar-hide">
          <div className="flex justify-between items-end mb-6">
            <div>
              <h2 className="text-2xl font-black uppercase tracking-wider text-white flex items-center gap-2 drop-shadow-[0_0_8px_rgba(255,255,255,0.2)]">
                <Sword className="w-6 h-6 text-[#EC4899]" />
                Daily Quests
              </h2>
              <p className="text-[#06B6D4] text-xs font-bold uppercase tracking-widest mt-1">3/5 Complete — Keep Going</p>
            </div>
            <div className="text-right">
              <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-[#1A1A2E] border border-[#7C3AED]/50 shadow-[0_0_15px_rgba(124,58,237,0.2)]">
                <span className="text-lg font-black text-[#7C3AED]">3<span className="text-gray-500 text-sm">/5</span></span>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            
            {/* Quest: Morning Run (Complete) */}
            <div className="relative p-[1px] rounded-xl bg-gradient-to-r from-[#06B6D4] to-[#7C3AED] shadow-[0_0_20px_rgba(6,182,212,0.2)]">
              <div className="bg-[#151525] p-4 rounded-xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-24 h-full bg-gradient-to-l from-[#06B6D4]/10 to-transparent"></div>
                <div className="flex justify-between items-center relative z-10">
                  <div className="flex items-center gap-4">
                    <div className="relative">
                      {/* Hexagon checkmark */}
                      <div className="w-12 h-12 flex items-center justify-center">
                        <svg viewBox="0 0 100 100" className="w-full h-full absolute inset-0 text-[#06B6D4] drop-shadow-[0_0_5px_rgba(6,182,212,0.8)]">
                          <polygon points="50 3, 93 25, 93 75, 50 97, 7 75, 7 25" fill="none" stroke="currentColor" strokeWidth="4"/>
                        </svg>
                        <div className="w-8 h-8 rounded-full bg-[#06B6D4] shadow-[0_0_10px_rgba(6,182,212,0.6)] flex items-center justify-center z-10">
                          <Crosshair className="w-5 h-5 text-white" />
                        </div>
                      </div>
                    </div>
                    <div>
                      <h3 className="text-lg font-black uppercase tracking-tight text-white strike-through opacity-90 line-through decoration-2 decoration-[#06B6D4]">Morning Run</h3>
                      <div className="flex items-center gap-1.5 mt-1">
                        <Flame className="w-3.5 h-3.5 text-[#EC4899] fill-[#EC4899]" />
                        <span className="text-xs font-bold text-[#EC4899] uppercase tracking-wider">7 Day Streak</span>
                        <span className="text-[9px] font-black bg-[#EC4899]/20 text-[#EC4899] px-1.5 py-0.5 rounded ml-1 border border-[#EC4899]/30">LEGENDARY</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right flex flex-col items-end">
                    <div className="text-sm font-black text-[#06B6D4]">+50 XP</div>
                    <div className="text-[10px] text-gray-500 font-bold uppercase mt-1">Cleared</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Quest: Read 30min (Incomplete) */}
            <div className="relative p-[1px] rounded-xl bg-[#2A2A3D] border border-gray-700/50">
              <div className="bg-[#151525] p-4 rounded-xl relative overflow-hidden">
                <div className="flex justify-between items-center relative z-10">
                  <div className="flex items-center gap-4">
                    <div className="relative">
                      {/* Hexagon empty */}
                      <div className="w-12 h-12 flex items-center justify-center">
                        <svg viewBox="0 0 100 100" className="w-full h-full absolute inset-0 text-gray-600">
                          <polygon points="50 3, 93 25, 93 75, 50 97, 7 75, 7 25" fill="#1A1A2E" stroke="currentColor" strokeWidth="2"/>
                        </svg>
                        <Target className="w-5 h-5 text-gray-400 z-10" />
                      </div>
                    </div>
                    <div>
                      <h3 className="text-lg font-black uppercase tracking-tight text-white drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)]">Read 30min</h3>
                      <div className="flex items-center gap-1.5 mt-1">
                        <Flame className="w-3 h-3 text-orange-500" />
                        <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">3 Day Streak</span>
                      </div>
                    </div>
                  </div>
                  <button className="bg-[#7C3AED] hover:bg-[#6D28D9] text-white px-4 py-2 rounded font-black text-xs uppercase tracking-widest shadow-[0_0_10px_rgba(124,58,237,0.4)] border border-[#A78BFA]/30 transition-all active:scale-95">
                    Start
                  </button>
                </div>
              </div>
            </div>

            {/* Quest: Cold Shower (Complete) */}
            <div className="relative p-[1px] rounded-xl bg-gradient-to-r from-[#7C3AED] to-[#06B6D4] shadow-[0_0_20px_rgba(124,58,237,0.2)]">
              <div className="bg-[#151525] p-4 rounded-xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-24 h-full bg-gradient-to-l from-[#7C3AED]/10 to-transparent"></div>
                <div className="flex justify-between items-center relative z-10">
                  <div className="flex items-center gap-4">
                    <div className="relative">
                      {/* Hexagon checkmark */}
                      <div className="w-12 h-12 flex items-center justify-center">
                        <svg viewBox="0 0 100 100" className="w-full h-full absolute inset-0 text-[#7C3AED] drop-shadow-[0_0_5px_rgba(124,58,237,0.8)]">
                          <polygon points="50 3, 93 25, 93 75, 50 97, 7 75, 7 25" fill="none" stroke="currentColor" strokeWidth="4"/>
                        </svg>
                        <div className="w-8 h-8 rounded-full bg-[#7C3AED] shadow-[0_0_10px_rgba(124,58,237,0.6)] flex items-center justify-center z-10">
                          <Zap className="w-4 h-4 text-white fill-white" />
                        </div>
                      </div>
                    </div>
                    <div>
                      <h3 className="text-lg font-black uppercase tracking-tight text-white line-through decoration-2 decoration-[#7C3AED] opacity-90">Cold Shower</h3>
                      <div className="flex items-center gap-1.5 mt-1">
                        <Flame className="w-3.5 h-3.5 text-[#06B6D4] fill-[#06B6D4]" />
                        <span className="text-xs font-bold text-[#06B6D4] uppercase tracking-wider">14 Day Streak</span>
                        <span className="text-[9px] font-black bg-[#06B6D4]/20 text-[#06B6D4] px-1.5 py-0.5 rounded ml-1 border border-[#06B6D4]/30">EPIC</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right flex flex-col items-end">
                    <div className="text-sm font-black text-[#7C3AED]">+75 XP</div>
                    <div className="text-[10px] text-gray-500 font-bold uppercase mt-1">Cleared</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Quest: Meditate (Incomplete) */}
             <div className="relative p-[1px] rounded-xl bg-[#2A2A3D] border border-gray-700/50">
              <div className="bg-[#151525] p-4 rounded-xl relative overflow-hidden">
                <div className="flex justify-between items-center relative z-10">
                  <div className="flex items-center gap-4">
                    <div className="relative">
                      {/* Hexagon empty */}
                      <div className="w-12 h-12 flex items-center justify-center">
                        <svg viewBox="0 0 100 100" className="w-full h-full absolute inset-0 text-gray-600">
                          <polygon points="50 3, 93 25, 93 75, 50 97, 7 75, 7 25" fill="#1A1A2E" stroke="currentColor" strokeWidth="2"/>
                        </svg>
                        <Activity className="w-5 h-5 text-gray-400 z-10" />
                      </div>
                    </div>
                    <div>
                      <h3 className="text-lg font-black uppercase tracking-tight text-white drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)]">Meditate</h3>
                      <div className="flex items-center gap-1.5 mt-1">
                        <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">No Streak</span>
                      </div>
                    </div>
                  </div>
                  <button className="bg-transparent text-[#7C3AED] border-2 border-[#7C3AED] hover:bg-[#7C3AED]/10 px-4 py-1.5 rounded font-black text-xs uppercase tracking-widest transition-all active:scale-95">
                    Start
                  </button>
                </div>
              </div>
            </div>

            {/* Quest: No Sugar (Complete) */}
            <div className="relative p-[1px] rounded-xl bg-gradient-to-r from-[#EC4899] to-[#7C3AED] shadow-[0_0_25px_rgba(236,72,153,0.3)] mt-6">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#151525] px-3 py-0.5 rounded border border-[#EC4899] text-[#EC4899] text-[10px] font-black uppercase tracking-widest z-20 flex items-center gap-1 shadow-[0_0_10px_rgba(236,72,153,0.5)]">
                <Flame className="w-3 h-3 fill-current" />
                Hot Streak
              </div>
              <div className="bg-[#151525] p-4 rounded-xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-24 h-full bg-gradient-to-l from-[#EC4899]/10 to-transparent"></div>
                <div className="flex justify-between items-center relative z-10 pt-2">
                  <div className="flex items-center gap-4">
                    <div className="relative">
                      {/* Hexagon checkmark glowing heavily */}
                      <div className="w-12 h-12 flex items-center justify-center">
                        <svg viewBox="0 0 100 100" className="w-full h-full absolute inset-0 text-[#EC4899] drop-shadow-[0_0_8px_rgba(236,72,153,1)]">
                          <polygon points="50 3, 93 25, 93 75, 50 97, 7 75, 7 25" fill="none" stroke="currentColor" strokeWidth="4"/>
                        </svg>
                        <div className="w-8 h-8 rounded-full bg-[#EC4899] shadow-[0_0_15px_rgba(236,72,153,0.8)] flex items-center justify-center z-10">
                          <Shield className="w-4 h-4 text-white fill-white" />
                        </div>
                      </div>
                    </div>
                    <div>
                      <h3 className="text-lg font-black uppercase tracking-tight text-white line-through decoration-2 decoration-[#EC4899] opacity-90">No Sugar</h3>
                      <div className="flex items-center gap-1.5 mt-1">
                        <Flame className="w-3.5 h-3.5 text-[#FFD700] fill-[#FFD700]" />
                        <span className="text-xs font-bold text-[#FFD700] uppercase tracking-wider">21 Day Streak</span>
                        <span className="text-[9px] font-black bg-[#FFD700]/20 text-[#FFD700] px-1.5 py-0.5 rounded ml-1 border border-[#FFD700]/30 animate-pulse">🔥 LEGENDARY</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right flex flex-col items-end">
                    <div className="text-sm font-black text-[#EC4899]">+100 XP</div>
                    <div className="text-[10px] text-gray-500 font-bold uppercase mt-1">Cleared</div>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* Bottom Nav / Dock */}
        <div className="absolute bottom-0 left-0 w-full h-20 bg-[#0A0A12] border-t border-gray-800 flex justify-around items-center px-2 z-50">
          <button 
            onClick={() => setActiveTab('quests')}
            className={`flex flex-col items-center justify-center w-16 h-14 relative ${activeTab === 'quests' ? 'text-[#7C3AED]' : 'text-gray-500 hover:text-gray-400'}`}
          >
            <Sword className={`w-6 h-6 mb-1 ${activeTab === 'quests' ? 'drop-shadow-[0_0_8px_rgba(124,58,237,0.8)]' : ''}`} />
            <span className="text-[9px] font-black uppercase tracking-widest">Quests</span>
            {activeTab === 'quests' && (
              <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 w-8 h-1 bg-[#7C3AED] rounded-t-full shadow-[0_-2px_10px_rgba(124,58,237,1)]"></div>
            )}
          </button>
          
          <button 
            onClick={() => setActiveTab('stats')}
            className={`flex flex-col items-center justify-center w-16 h-14 relative ${activeTab === 'stats' ? 'text-[#06B6D4]' : 'text-gray-500 hover:text-gray-400'}`}
          >
            <BarChart3 className={`w-6 h-6 mb-1 ${activeTab === 'stats' ? 'drop-shadow-[0_0_8px_rgba(6,182,212,0.8)]' : ''}`} />
            <span className="text-[9px] font-black uppercase tracking-widest">Stats</span>
            {activeTab === 'stats' && (
              <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 w-8 h-1 bg-[#06B6D4] rounded-t-full shadow-[0_-2px_10px_rgba(6,182,212,1)]"></div>
            )}
          </button>

          {/* Action Button */}
          <div className="relative -top-5">
            <button className="w-14 h-14 rounded-full bg-gradient-to-tr from-[#7C3AED] via-[#06B6D4] to-[#EC4899] flex items-center justify-center shadow-[0_0_20px_rgba(124,58,237,0.5)] border-2 border-[#0A0A12] active:scale-95 transition-transform">
              <div className="w-11 h-11 rounded-full bg-[#1A1A2E] flex items-center justify-center">
                <Target className="w-6 h-6 text-white" />
              </div>
            </button>
          </div>

          <button 
            onClick={() => setActiveTab('social')}
            className={`flex flex-col items-center justify-center w-16 h-14 relative ${activeTab === 'social' ? 'text-[#EC4899]' : 'text-gray-500 hover:text-gray-400'}`}
          >
            <Trophy className={`w-6 h-6 mb-1 ${activeTab === 'social' ? 'drop-shadow-[0_0_8px_rgba(236,72,153,0.8)]' : ''}`} />
            <span className="text-[9px] font-black uppercase tracking-widest">Guild</span>
            {activeTab === 'social' && (
              <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 w-8 h-1 bg-[#EC4899] rounded-t-full shadow-[0_-2px_10px_rgba(236,72,153,1)]"></div>
            )}
          </button>

          <button 
            onClick={() => setActiveTab('settings')}
            className={`flex flex-col items-center justify-center w-16 h-14 relative ${activeTab === 'settings' ? 'text-white' : 'text-gray-500 hover:text-gray-400'}`}
          >
            <Settings className={`w-6 h-6 mb-1 ${activeTab === 'settings' ? 'drop-shadow-[0_0_8px_rgba(255,255,255,0.8)]' : ''}`} />
            <span className="text-[9px] font-black uppercase tracking-widest">Gear</span>
            {activeTab === 'settings' && (
              <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 w-8 h-1 bg-white rounded-t-full shadow-[0_-2px_10px_rgba(255,255,255,0.8)]"></div>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
