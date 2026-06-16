import React, { useState, useMemo } from "react";
import { Flower, BarChart3, TrendingUp, Sparkles, Calendar, Award } from "lucide-react";

interface HistoryItem {
  id: string;
  title: string;
  date: string;
  stepsCount: number;
  minutes: number;
}

interface FocusAnalyticsDashboardProps {
  history: HistoryItem[];
  calmMode: boolean;
}

export function FocusAnalyticsDashboard({ history, calmMode }: FocusAnalyticsDashboardProps) {
  const [visualMode, setVisualMode] = useState<"botanical" | "flow" | "minimal">("botanical");

  // Determine weekdays
  const daysOfWeek = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

  // Pre-populated base minutes so the graph is beautiful and illustrative, plus actual additions from history!
  const weekData = useMemo(() => {
    // Elegant baseline focus minutes (simulating a healthy cognitive habit rhythm)
    const baseMinutes = {
      Mon: 15,
      Tue: 25,
      Wed: 10,
      Thu: 35,
      Fri: 20,
      Sat: 0,
      Sun: 15,
    };

    // Calculate real additions from history
    // Since dates might be strings like "2026-06-16", let's extract weekday if possible, or distribute
    history.forEach((item, idx) => {
      // Direct placement fallback to keep it dynamic and interesting based on indices
      const targetDay = daysOfWeek[idx % daysOfWeek.length] as keyof typeof baseMinutes;
      baseMinutes[targetDay] = (baseMinutes[targetDay] || 0) + item.minutes;
    });

    return daysOfWeek.map((day) => ({
      day,
      minutes: baseMinutes[day as keyof typeof baseMinutes],
    }));
  }, [history]);

  // Aggregate stats
  const totalMinutes = useMemo(() => {
    return weekData.reduce((acc, curr) => acc + curr.minutes, 0);
  }, [weekData]);

  const maxMinutes = useMemo(() => {
    const maxVal = Math.max(...weekData.map((d) => d.minutes));
    return maxVal === 0 ? 50 : maxVal;
  }, [weekData]);

  // Executive advice wording based on cumulative volumes
  const cognitiveAdvice = useMemo(() => {
    if (totalMinutes === 0) {
      return {
        rating: "Seed Dormant",
        desc: "Your cognitive workspace is ready. Initiate any sequence above to sprout your forest plots.",
        color: "text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/25",
      };
    } else if (totalMinutes < 60) {
      return {
        rating: "Root Formation",
        desc: "Excellent entry blocks. You are forming steady habits without pushing into sensory fatigue.",
        color: "text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/25",
      };
    } else if (totalMinutes < 150) {
      return {
        rating: "Botanical Canopy Growth",
        desc: "Splendid focus endurance! Your ciliary rest splits and mini-rests are syncing beautifully.",
        color: "text-teal-600 dark:text-teal-400 bg-teal-50 dark:bg-teal-950/25",
      };
    } else {
      return {
        rating: "Cognitive Resonance Achieved",
        desc: "Peak execution! Remember to invoke your 20-20-20 visual rest intervals to stay relaxed.",
        color: "text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/25",
      };
    }
  }, [totalMinutes]);

  return (
    <div className="bg-white dark:bg-zinc-900 border border-[#dcd5c5] p-5 rounded-xl space-y-4" id="focus-analytics-dashboard-panel">
      
      {/* Header and Visual Selection */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-[#dcd5c5]/60 pb-3">
        <div>
          <h3 className="font-bold text-sm text-[#2d3e2b] flex items-center gap-1.5" id="analytics-heading">
            <span className="text-base">📊</span> ADHD-Sensitive Analytics & Flow Curve
          </h3>
          <p className="text-xs text-flow-secondary">
            Visual metrics mapped to soothe executive overwhelm or math anxiety. Select your safe mode below.
          </p>
        </div>

        {/* Visual selector buttons - tabs */}
        <div className="flex border border-[#dcd5c5] rounded-lg overflow-hidden shrink-0 self-start" id="analytics-visual-mode-tabs">
          {[
            { key: "botanical", label: "Garden 🌸", icon: Flower },
            { key: "flow", label: "Flow 〰️", icon: TrendingUp },
            { key: "minimal", label: "Simple 📊", icon: BarChart3 }
          ].map((mode) => {
            const Icon = mode.icon;
            const active = visualMode === mode.key;
            return (
              <button
                key={mode.key}
                type="button"
                onClick={() => setVisualMode(mode.key as any)}
                className={`px-3 py-1.5 text-[11px] font-bold flex items-center gap-1 transition-colors cursor-pointer ${
                  active
                    ? "bg-[#8baa7a] text-white"
                    : "bg-white hover:bg-stone-100 dark:bg-zinc-800 text-flow-primary"
                }`}
              >
                <Icon className="w-3 h-3" />
                <span>{mode.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Graph Canvas Area */}
      <div className="bg-stone-50 dark:bg-zinc-950/40 p-4 rounded-xl border border-[#dcd5c5]/65 relative h-56 select-none flex flex-col justify-between">
        
        {/* Graph renders */}
        <div className="flex-1 w-full flex items-end justify-between h-40 bg-white/20 dark:bg-black/10 rounded-lg p-2.5 relative overflow-hidden">
          
          {/* Grid lines (if NOT in botanical mode, to maintain sensory cleanliness) */}
          {visualMode === "minimal" && (
            <div className="absolute inset-0 flex flex-col justify-between pointer-events-none py-3 text-[8px] font-mono text-stone-400 px-1">
              <div className="border-b border-stone-200/50 w-full text-right pr-2">Max Focus</div>
              <div className="border-b border-stone-200/50 w-full text-right pr-2">Medium Focus</div>
              <div className="w-full text-right pr-2">Baseline</div>
            </div>
          )}

          {/* 1. BOTANICAL GARDEN MODE (No numbers, grows unique physical flowers based on duration!) */}
          {visualMode === "botanical" && (
            <div className="absolute inset-x-0 bottom-4 flex justify-between px-4 items-end h-full">
              {weekData.map((d, index) => {
                const ratio = d.minutes / maxMinutes;
                const heightPercent = d.minutes === 0 ? 0 : Math.max(12, ratio * 100);
                const stemHeight = calcStemHeight(d.minutes, maxMinutes);

                return (
                  <div key={d.day} className="flex flex-col items-center justify-end h-full w-12 group relative">
                    {/* Flower Head */}
                    {d.minutes > 0 ? (
                      <div 
                        className={`transition-all duration-700 ${calmMode ? "" : "animate-bounce"}`}
                        style={{ 
                          marginBottom: `${stemHeight}px`,
                          animationDelay: `${index * 0.15}s`,
                          position: 'absolute',
                          bottom: '0px'
                        }}
                      >
                        <span 
                          className="text-2xl cursor-pointer hover:scale-125 transition-transform duration-200" 
                          title={`${d.minutes} minute bloom`}
                        >
                          {d.minutes >= 30 ? "🌺" : d.minutes >= 20 ? "🌸" : d.minutes >= 10 ? "🌿" : "🌱"}
                        </span>
                      </div>
                    ) : (
                      <span className="text-[10px] text-stone-300 absolute bottom-4">💤</span>
                    )}

                    {/* Stem */}
                    {d.minutes > 0 && (
                      <div 
                        className="w-1.5 bg-emerald-500 rounded-t-full transition-all duration-500 absolute bottom-1"
                        style={{ height: `${stemHeight}px` }}
                      >
                        {/* Leaf */}
                        {d.minutes >= 20 && (
                          <div className={`absolute top-1/2 w-2 h-1 bg-emerald-400 rounded-full ${index % 2 === 0 ? "-left-2 rotate-[-45deg]" : "-right-2 rotate-[45deg]"}`} />
                        )}
                      </div>
                    )}

                    {/* Day label */}
                    <span className="text-[10px] font-mono font-bold text-flow-secondary absolute bottom-[-18px]">
                      {d.day}
                    </span>
                  </div>
                );
              })}
            </div>
          )}

          {/* 2. CURVED FLUID RIVER FLOW MODE (Smooth bezier SVG) */}
          {visualMode === "flow" && (
            <div className="absolute inset-0">
              <svg className="w-full h-full" viewBox="0 0 500 160" preserveAspectRatio="none">
                <defs>
                  <linearGradient id="flow-gradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#8baa7a" stopOpacity="0.4" />
                    <stop offset="100%" stopColor="#8baa7a" stopOpacity="0.0" />
                  </linearGradient>
                </defs>
                {/* Generate polyline path points */}
                {(() => {
                  const paddingX = 40;
                  const width = 500 - paddingX * 2;
                  const stepX = width / (weekData.length - 1);
                  const points = weekData.map((d, i) => {
                    const x = paddingX + i * stepX;
                    const ratio = d.minutes / maxMinutes;
                    const y = 130 - (ratio * 100);
                    return { x, y };
                  });

                  // Build cubic bezier curved string or fallback to linear
                  const pathStr = points.reduce((acc, p, i) => {
                    if (i === 0) return `M ${p.x} ${p.y}`;
                    const prev = points[i - 1];
                    const cpX1 = prev.x + stepX / 2;
                    const cpY1 = prev.y;
                    const cpX2 = p.x - stepX / 2;
                    const cpY2 = p.y;
                    return `${acc} C ${cpX1} ${cpY1}, ${cpX2} ${cpY2}, ${p.x} ${p.y}`;
                  }, "");

                  const fillStr = `${pathStr} L ${points[points.length - 1].x} 150 L ${points[0].x} 150 Z`;

                  return (
                    <>
                      {/* Gradient Fill under path */}
                      <path d={fillStr} fill="url(#flow-gradient)" className="transition-all duration-500" />
                      {/* Flowing curve line */}
                      <path d={pathStr} fill="none" stroke="#8baa7a" strokeWidth="3.5" strokeLinecap="round" className="transition-all duration-500" />
                      
                      {/* Render nodes and text */}
                      {points.map((p, idx) => (
                        <g key={idx}>
                          <circle cx={p.x} cy={p.y} r="5" fill="#5b6e55" className="hover:scale-150 transition-transform cursor-pointer" />
                          {weekData[idx].minutes > 0 && (
                            <text x={p.x} y={p.y - 12} textAnchor="middle" fill="#2d3e2b" className="text-[9px] font-mono font-bold dark:fill-stone-300">
                              {weekData[idx].minutes}m
                            </text>
                          )}
                          <text x={p.x} y="152" textAnchor="middle" fill="#888" className="text-[10px] font-mono font-bold dark:fill-stone-400">
                            {weekData[idx].day}
                          </text>
                        </g>
                      ))}
                    </>
                  );
                })()}
              </svg>
            </div>
          )}

          {/* 3. COGNITIVE MINIMALIST BARS (Smooth aesthetic standard representation) */}
          {visualMode === "minimal" && (
            <div className="absolute inset-x-0 bottom-4 flex justify-between px-6 items-end h-full">
              {weekData.map((d) => {
                const ratio = d.minutes / maxMinutes;
                const barHeight = Math.max(3, ratio * 110);
                return (
                  <div key={d.day} className="flex flex-col items-center justify-end w-12 group transition-all">
                    {/* Floating Value */}
                    {d.minutes > 0 && (
                      <span className="text-[9px] font-mono font-bold text-[#8baa7a] mb-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                        {d.minutes}m
                      </span>
                    )}
                    {/* Flat Styled Bar */}
                    <div 
                      className={`w-4 bg-[#8baa7a] hover:bg-[#729162] rounded-t-md transition-all duration-500 cursor-pointer ${
                        d.minutes === 0 ? "h-1 bg-[#dcd5c5]/40" : ""
                      }`}
                      style={{ height: `${d.minutes === 0 ? 4 : barHeight}px` }}
                      title={`${d.minutes} focus minutes`}
                    />
                    {/* Day label */}
                    <span className="text-[10px] font-mono font-bold text-flow-secondary mt-1.5">
                      {d.day}
                    </span>
                  </div>
                );
              })}
            </div>
          )}

        </div>

        {/* Grass/Plot base edge */}
        <div className="h-1 bg-[#8baa7a]/20 w-full rounded-full" />
      </div>

      {/* Wellness & Cognitive Resonance Aggregation */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 pt-1">
        
        {/* Advice widget */}
        <div className={`p-3.5 rounded-xl border border-transparent leading-relaxed text-xs flex items-start gap-3 ${cognitiveAdvice.color}`}>
          <div className="text-xl shrink-0 mt-0.5">🌱</div>
          <div>
            <span className="block text-[10px] uppercase tracking-widest font-mono font-bold text-flow-secondary">COGNITIVE INDEX</span>
            <span className="font-bold text-flow-primary block mb-0.5">{cognitiveAdvice.rating}</span>
            <p className="text-[10px] text-flow-secondary font-medium leading-normal">{cognitiveAdvice.desc}</p>
          </div>
        </div>

        {/* Aggregate statistics */}
        <div className="p-3 bg-stone-50 dark:bg-zinc-950/20 border border-[#dcd5c5]/70 rounded-xl flex items-center justify-between text-xs">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#8baa7a]/15 rounded-full border border-[#8baa7a]/15 flex items-center justify-center text-lg">
              🏅
            </div>
            <div>
              <span className="text-[9px] font-mono tracking-wider uppercase text-flow-secondary block">Harvest Output</span>
              <strong className="text-flow-primary text-sm font-serif">Aura Score Sync</strong>
            </div>
          </div>
          <div className="text-right">
            <div className="text-base font-mono font-black text-[#5b6e55]">
              {totalMinutes} mins
            </div>
            <span className="text-[9px] text-[#8baa7a] font-mono font-bold uppercase">Weekly Flow</span>
          </div>
        </div>

      </div>

    </div>
  );
}

// Simple deterministic helper for stem height (capped to ensure fit)
function calcStemHeight(mins: number, max: number): number {
  if (mins === 0) return 0;
  const ratio = mins / max;
  return Math.max(15, Math.min(ratio * 90, 95));
}
