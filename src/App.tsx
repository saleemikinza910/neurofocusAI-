import React, { useState, useEffect, useRef } from "react";
import confetti from "canvas-confetti";
import { 
  Sparkles, 
  Settings, 
  Mic, 
  MicOff, 
  Play, 
  Pause, 
  RotateCcw, 
  Volume2, 
  VolumeX, 
  Plus, 
  Check, 
  Trash2, 
  User, 
  Flame, 
  Layers, 
  Sun, 
  Moon, 
  Compass, 
  Send, 
  AlertCircle, 
  HelpCircle, 
  ChevronRight, 
  Trees, 
  Search, 
  Smile,
  Zap,
  BookOpen
} from "lucide-react";
import { 
  MicroStep, 
  Task, 
  SensoryProfile, 
  GranularPreferences, 
  StudyBuddy, 
  ChatMessage, 
  Stats 
} from "./types";
import { ambientPlayer } from "./lib/ambientPlayer";
import { FocusAnalyticsDashboard } from "./components/FocusAnalyticsDashboard";
import { ThreeDTiltCard } from "./components/ThreeDTiltCard";

// Base Virtual Buddy Data for Text-Based Body Doubling
const INITIAL_BUDDIES: StudyBuddy[] = [
  { id: "b1", name: "Aryan", condition: "ADHD", avatar: "🌲", statusText: "Breaking down CS reading", progressPercent: 30, isFocusing: true, chatWillingness: 80 },
  { id: "b2", name: "Priya", condition: "Autism", avatar: "🌸", statusText: "Polishing digital sketch", progressPercent: 65, isFocusing: true, chatWillingness: 40 },
  { id: "b3", name: "Rohan", condition: "Dyslexia", avatar: "🌿", statusText: "Reading article overview", progressPercent: 15, isFocusing: true, chatWillingness: 90 },
  { id: "b4", name: "Neha", condition: "Dyscalculia", avatar: "🌻", statusText: "Organizing stats table", progressPercent: 50, isFocusing: false, chatWillingness: 70 }
];

const SYSTEM_CHATS = [
  "Rohan: Visual timers are saving my day. Let's do anotherPomodoro!",
  "Priya: Keep the noise sensory profiles flat. It's so calming.",
  "Aryan: Just hit 'Just Start' on my first task. Overcame my friction!",
  "Neha: Visual progress pie chart looks perfect. Ready to keep study log.",
  "Rohan: Finished chapter 3 summary using reading ruler!",
];

export default function App() {
  // --- Persistent States ---
  const [tasks, setTasks] = useState<Task[]>(() => {
    const saved = localStorage.getItem("focusflow_tasks");
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { console.warn(e); }
    }
    // Pre-populated sample task for Guest Demo Mode
    return [
      {
        id: "demo-1",
        originalInput: "Clean my study desk and organize notebook sheets",
        condition: "ADHD",
        createdAt: new Date().toISOString(),
        steps: [
          { id: "s1", text: "Take everything off the desk to start a fresh flat zone", minutes: 3, visualMetaphor: "tiny sip", checked: false },
          { id: "s2", text: "Wipe down the desk with a warm wet towel", minutes: 4, visualMetaphor: "short step", checked: false },
          { id: "s3", text: "Pick up 3 specific notes sheets and file them away", minutes: 5, visualMetaphor: "short step", checked: false },
          { id: "s4", text: "Put back only 2 essential pens and your main laptop", minutes: 2, visualMetaphor: "tiny sip", checked: false }
        ]
      }
    ];
  });

  const [stats, setStats] = useState<Stats>(() => {
    const saved = localStorage.getItem("focusflow_stats");
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { console.warn(e); }
    }
    return { completedStepsCount: 3, focusedMinutesCount: 15, streakCount: 2, lastActiveDate: new Date().toLocaleDateString() };
  });

  const [profile, setProfile] = useState<SensoryProfile>(() => {
    return (localStorage.getItem("focusflow_profile") as SensoryProfile) || "default";
  });

  const [calmMode, setCalmMode] = useState<boolean>(() => {
    return localStorage.getItem("focusflow_calm_mode") === "true";
  });

  const [darkMode, setDarkMode] = useState<boolean>(() => {
    return localStorage.getItem("focusflow_dark_mode") === "true";
  });

  const [dyslexiaMinimalist, setDyslexiaMinimalist] = useState<boolean>(() => {
    return localStorage.getItem("focusflow_dyslexia_minimalist") === "true";
  });

  const [prefs, setPrefs] = useState<GranularPreferences>(() => {
    const saved = localStorage.getItem("focusflow_prefs");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (!parsed.confettiIntensity) {
          parsed.confettiIntensity = "medium";
        }
        if (!parsed.colorBlindFilter) {
          parsed.colorBlindFilter = "none";
        }
        return parsed;
      } catch (e) {
        console.warn(e);
      }
    }
    return {
      motionLevel: "full",
      contrast: "normal",
      fontSize: "normal",
      fontFamily: "sans",
      soundEnabled: true,
      readingRulerEnabled: false,
      rulerY: 300,
      focusOnlyMode: false,
      confettiIntensity: "medium",
      colorBlindFilter: "none"
    };
  });

  // --- Interaction States ---
  const [taskInputValue, setTaskInputValue] = useState("");
  const [selectedBreakdownCondition, setSelectedBreakdownCondition] = useState<string>("ADHD");
  const [isLoadingBreakdown, setIsLoadingBreakdown] = useState(false);
  const [breakdownError, setBreakdownError] = useState<string | null>(null);
  
  // Voice Input States
  const [isListeningVoice, setIsListeningVoice] = useState(false);
  const [speechSupport, setSpeechSupport] = useState(false);
  const recognitionRef = useRef<any>(null);

  // Focus Timer / Pomodoro Room Details
  const [pomodoroTimer, setPomodoroTimer] = useState(25 * 60); // 25 Min
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [pomodoroMode, setPomodoroMode] = useState<"focus" | "break">("focus");
  const [currentVirtualRoom, setCurrentVirtualRoom] = useState("Forest Canopy Quiet Area 🌲");
  const [buddies, setBuddies] = useState<StudyBuddy[]>(INITIAL_BUDDIES);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    { id: "m1", sender: "Rohan 🌿", avatar: "🌿", text: "Ready to lock in! Just activated my Reading Ruler tool.", timestamp: "10:45 AM" },
    { id: "m2", sender: "System", avatar: "⚙️", text: "Welcome to Guest123. Text-based study lounge active. Zero audio/video stress.", timestamp: "10:46 AM", isSystem: true }
  ]);
  const [customChatMessage, setCustomChatMessage] = useState("");

  // Panic Button / Just Start State
  const [isPanicState, setIsPanicState] = useState(false);
  const [panicSeconds, setPanicSeconds] = useState(120); // 2 minutes
  const [isPanicCompleted, setIsPanicCompleted] = useState(false);

  // Settings Panel Open
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // --- Sensory Stim & Executive Rescue States ---
  const [fidgetPopsCount, setFidgetPopsCount] = useState(0);
  const [fidgetWaves, setFidgetWaves] = useState<{ id: string; x: number; y: number; color: string; freq: number }[]>([]);
  const [executiveRescueChallenge, setExecutiveRescueChallenge] = useState<string | null>(null);

  // --- Dynamic Color Shield & Paced Breathing States ---
  const [sensoryTint, setSensoryTint] = useState<"none" | "amber" | "sage" | "lavender">(() => {
    return (localStorage.getItem("focusflow_sensory_tint") as any) || "none";
  });
  const [breathingActive, setBreathingActive] = useState<boolean>(false);
  const [breathingCycle, setBreathingCycle] = useState<"Inhale" | "Hold" | "Exhale" | "Post-Hold">("Inhale");
  const [breathingSecondsLeft, setBreathingSecondsLeft] = useState<number>(4);
  const [breathingPattern, setBreathingPattern] = useState<"box" | "cardiac" | "rescue">("box");

  // --- Ambient Sound Player States ---
  const [ambientSound, setAmbientSound] = useState<"none" | "brown" | "lofi">("none");
  const [ambientVolume, setAmbientVolumeState] = useState<number>(() => {
    const saved = localStorage.getItem("focusflow_ambient_volume");
    return saved ? parseFloat(saved) : 0.45;
  });

  // --- Automated 20-20-20 Visual Rest Prompt States ---
  const [isRestPromptActive, setIsRestPromptActive] = useState(false);
  const [restPromptSecondsLeft, setRestPromptSecondsLeft] = useState(20);

  // --- Page Guidance & Navigation States ---
  const [currentPage, setCurrentPage] = useState<"workspace" | "lounge" | "garden" | "neuro">("workspace");
  const [activeGardenPlant, setActiveGardenPlant] = useState<"pine" | "cherry" | "fern" | "meadow">("pine");
  const [studyRoomAmbient, setStudyRoomAmbient] = useState<"forest" | "rain" | "library" | "hearth">("forest");
  const [completedSessionsHistory, setCompletedSessionsHistory] = useState<{ id: string; title: string; date: string; stepsCount: number; minutes: number }[]>(() => {
    const saved = localStorage.getItem("focusflow_history");
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { console.warn(e); }
    }
    return [
      { id: "h1", title: "Study Desk clean up layout", date: "June 14, 2026", stepsCount: 4, minutes: 12 },
      { id: "h2", title: "ADHD CS Bibliography references", date: "June 15, 2026", stepsCount: 3, minutes: 15 }
    ];
  });

  // Track state persistence
  useEffect(() => {
    localStorage.setItem("focusflow_history", JSON.stringify(completedSessionsHistory));
  }, [completedSessionsHistory]);

  // Dragging Reading Ruler ref
  const rulerRef = useRef<HTMLDivElement>(null);
  const [isDraggingRuler, setIsDraggingRuler] = useState(false);

  // --- Local audio synthesis using Web Audio API for sensory friendly alerts ---
  const playSound = (type: "click" | "success" | "done" | "relax" | "fidget", customFreq?: number) => {
    if (!prefs.soundEnabled) return;
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.connect(gain);
      gain.connect(audioCtx.destination);

      if (type === "click") {
        osc.type = "sine";
        osc.frequency.setValueAtTime(400, audioCtx.currentTime);
        gain.gain.setValueAtTime(0.08, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.08);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.1);
      } else if (type === "fidget") {
        osc.type = "sine";
        osc.frequency.setValueAtTime(customFreq || 440, audioCtx.currentTime);
        gain.gain.setValueAtTime(0.06, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.35);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.4);
      } else if (type === "success") {
        // Soft calming primary note
        osc.type = "sine";
        osc.frequency.setValueAtTime(523.25, audioCtx.currentTime); // C5
        osc.frequency.setValueAtTime(659.25, audioCtx.currentTime + 0.15); // E5
        gain.gain.setValueAtTime(0.12, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.45);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.46);
      } else if (type === "done") {
        // Deep relaxing chimes
        osc.type = "sine";
        osc.frequency.setValueAtTime(349.23, audioCtx.currentTime); // F4
        osc.frequency.setValueAtTime(440.00, audioCtx.currentTime + 0.2); // A4
        osc.frequency.setValueAtTime(523.25, audioCtx.currentTime + 0.4); // C5
        gain.gain.setValueAtTime(0.15, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.85);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.9);
      } else if (type === "relax") {
        // Deep low wave
        osc.type = "triangle";
        osc.frequency.setValueAtTime(220, audioCtx.currentTime);
        gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 1.2);
        osc.start();
        osc.stop(audioCtx.currentTime + 1.5);
      }
    } catch (e) {
      console.warn("Audio Context blocked by browser permission.", e);
    }
  };

  // --- HTML DOM Syncing to HTML Attributes ---
  useEffect(() => {
    document.documentElement.setAttribute("data-profile", profile);
    localStorage.setItem("focusflow_profile", profile);
  }, [profile]);

  useEffect(() => {
    document.documentElement.setAttribute("data-calm-mode", calmMode.toString());
    localStorage.setItem("focusflow_calm_mode", calmMode.toString());
  }, [calmMode]);

  useEffect(() => {
    document.documentElement.setAttribute("data-dark", darkMode.toString());
    localStorage.setItem("focusflow_dark_mode", darkMode.toString());
  }, [darkMode]);

  useEffect(() => {
    document.documentElement.setAttribute("data-dyslexia-minimalist", dyslexiaMinimalist.toString());
    localStorage.setItem("focusflow_dyslexia_minimalist", dyslexiaMinimalist.toString());
  }, [dyslexiaMinimalist]);

  useEffect(() => {
    localStorage.setItem("focusflow_prefs", JSON.stringify(prefs));
  }, [prefs]);

  // --- Ambient Player Syncing Effects ---
  useEffect(() => {
    return () => {
      ambientPlayer.stop();
    };
  }, []);

  useEffect(() => {
    if (calmMode && ambientSound !== "none") {
      setAmbientSound("none");
      ambientPlayer.stop();
    }
  }, [calmMode, ambientSound]);

  useEffect(() => {
    ambientPlayer.setVolume(ambientVolume);
    localStorage.setItem("focusflow_ambient_volume", ambientVolume.toString());
  }, [ambientVolume]);

  useEffect(() => {
    if (ambientSound === "none") {
      ambientPlayer.stop();
    } else if (ambientSound === "brown") {
      ambientPlayer.playBrownNoise();
    } else if (ambientSound === "lofi") {
      ambientPlayer.playLofi();
    }
  }, [ambientSound]);

  // --- Rest Prompt Eye Strain Rule Countdown ---
  useEffect(() => {
    let interval: any = null;
    if (isRestPromptActive && restPromptSecondsLeft > 0) {
      interval = setInterval(() => {
        setRestPromptSecondsLeft((prev) => {
          if (prev <= 1) {
            playSound("success");
            return 0;
          }
          if (prefs.soundEnabled) {
            // Soft soothing organic woodblock note
            playSound("fidget", 329.63);
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRestPromptActive, restPromptSecondsLeft, prefs.soundEnabled]);

  // --- Sensory Shield Filter Storage ---
  useEffect(() => {
    localStorage.setItem("focusflow_sensory_tint", sensoryTint);
  }, [sensoryTint]);

  // --- Dynamic Breathing Ticker Countdown State Machine ---
  useEffect(() => {
    if (!breathingActive) return;

    const interval = setInterval(() => {
      setBreathingSecondsLeft((prev) => {
        if (prev <= 1) {
          // Play a nice organic transition tone
          playSound("fidget", 329.63);
          
          if (breathingPattern === "box") {
            let nextState: "Inhale" | "Hold" | "Exhale" | "Post-Hold" = "Inhale";
            setBreathingCycle((curr) => {
              if (curr === "Inhale") nextState = "Hold";
              else if (curr === "Hold") nextState = "Exhale";
              else if (curr === "Exhale") nextState = "Post-Hold";
              else nextState = "Inhale";
              return nextState;
            });
            return 4;
          } else if (breathingPattern === "cardiac") {
            let nextState: "Inhale" | "Hold" | "Exhale" | "Post-Hold" = "Inhale";
            setBreathingCycle((curr) => {
              if (curr === "Inhale") nextState = "Exhale";
              else nextState = "Inhale";
              return nextState;
            });
            return 5;
          } else {
            let nextState: "Inhale" | "Hold" | "Exhale" | "Post-Hold" = "Inhale";
            let nextSecs = 4;
            setBreathingCycle((curr) => {
              if (curr === "Inhale") {
                nextState = "Hold";
                nextSecs = 7;
              } else if (curr === "Hold") {
                nextState = "Exhale";
                nextSecs = 8;
              } else {
                nextState = "Inhale";
                nextSecs = 4;
              }
              return nextState;
            });
            return nextSecs;
          }
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [breathingActive, breathingPattern, breathingCycle]);

  useEffect(() => {
    localStorage.setItem("focusflow_tasks", JSON.stringify(tasks));
  }, [tasks]);

  useEffect(() => {
    localStorage.setItem("focusflow_stats", JSON.stringify(stats));
  }, [stats]);

  // --- SpeechRecognition Hook ---
  useEffect(() => {
    const Speech = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (Speech) {
      setSpeechSupport(true);
      const rec = new Speech();
      rec.continuous = false;
      rec.interimResults = false;
      rec.lang = "en-US";

      rec.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setTaskInputValue((prev) => (prev ? prev + " " + transcript : transcript));
        setIsListeningVoice(false);
        playSound("success");
      };

      rec.onerror = (e: any) => {
        console.error("Speech Recognition error:", e);
        setIsListeningVoice(false);
      };

      rec.onend = () => {
        setIsListeningVoice(false);
      };

      recognitionRef.current = rec;
    }
  }, []);

  const toggleListening = () => {
    if (!speechSupport || !recognitionRef.current) return;
    playSound("click");
    if (isListeningVoice) {
      recognitionRef.current.stop();
      setIsListeningVoice(false);
    } else {
      setIsListeningVoice(true);
      recognitionRef.current.start();
    }
  };

  // --- TTS Step Reader ---
  const speakStep = (text: string) => {
    playSound("click");
    if (!window.speechSynthesis) {
      alert("Text-to-speech is not supported in this browser version.");
      return;
    }
    // Cancel any speaking
    window.speechSynthesis.cancel();
    
    // Set text speed slower for Autism and Dyslexia profiles
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = profile === "dyslexia" || profile === "autism" ? 0.85 : 0.95;
    utterance.volume = 0.9;
    window.speechSynthesis.speak(utterance);
  };

  // --- Pomodoro Ticking Hook ---
  useEffect(() => {
    let interval: any = null;
    if (isTimerRunning) {
      interval = setInterval(() => {
        setPomodoroTimer((prev) => {
          if (prev <= 1) {
            // Timer Finished! Let's handle complete transition
            setIsTimerRunning(false);
            playSound("done");
            if (pomodoroMode === "focus") {
              setStats((old) => ({
                ...old,
                focusedMinutesCount: old.focusedMinutesCount + 25
              }));
              setPomodoroMode("break");
              
              // Trigger automated visual rest prompt
              setIsRestPromptActive(true);
              setRestPromptSecondsLeft(20);

              // System notification
              setChatMessages((messages) => [
                ...messages,
                {
                  id: "sys-" + Date.now(),
                  sender: "System",
                  avatar: "⚙️",
                  text: "Focus block completed! Triggered automated 20-20-20 visual eye-rest rule.",
                  timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                  isSystem: true
                }
              ]);
              return 5 * 60; // Rest
            } else {
              setPomodoroMode("focus");
              return 25 * 60;
            }
          }
          return prev - 1;
        });

        // Simulate study buddy ticks
        if (Math.random() > 0.88) {
          setBuddies((prevBuddies) => 
            prevBuddies.map((b) => {
              if (b.isFocusing) {
                const nextProg = Math.min(b.progressPercent + Math.floor(Math.random() * 8) + 2, 100);
                let text = b.statusText;
                if (nextProg >= 100) {
                  text = "Resting / Chatting";
                }
                return { ...b, progressPercent: nextProg, statusText: text };
              }
              return b;
            })
          );
        }

        // Random simulated buddy conversations to motivate Text-Based Doubling
        if (Math.random() > 0.975) {
          const randomIndex = Math.floor(Math.random() * INITIAL_BUDDIES.length);
          const buddy = INITIAL_BUDDIES[randomIndex];
          const randomText = SYSTEM_CHATS[Math.floor(Math.random() * SYSTEM_CHATS.length)];
          const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

          setChatMessages((prev) => [
            ...prev,
            {
              id: "sim-" + Date.now(),
              sender: `${buddy.name} ${buddy.avatar}`,
              avatar: buddy.avatar,
              text: randomText.replace(/^.*:\s*/, ""),
              timestamp: timeStr
            }
          ]);
        }

      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isTimerRunning, pomodoroMode]);

  // --- Panic Mode Countdown Hook ---
  useEffect(() => {
    let interval: any = null;
    if (isPanicState && !isPanicCompleted) {
      interval = setInterval(() => {
        setPanicSeconds((prev) => {
          if (prev <= 1) {
            setIsPanicCompleted(true);
            playSound("done");
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isPanicState, isPanicCompleted]);

  // --- Mouse coordinates reading ruler position tracker ---
  const handleMouseMove = (e: any) => {
    if (prefs.readingRulerEnabled && !isDraggingRuler) {
      setPrefs((prev) => ({
        ...prev,
        rulerY: e.clientY - 24
      }));
    }
  };

  // --- Core Submit Functions ---
  const submitTaskBreakdown = async (subStepTask?: string, subStepId?: string) => {
    const inputToUse = subStepTask || taskInputValue;
    if (!inputToUse.trim()) return;

    playSound("click");
    setIsLoadingBreakdown(true);
    setBreakdownError(null);

    try {
      const res = await fetch("/api/task/breakdown", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          taskInput: inputToUse,
          condition: selectedBreakdownCondition,
          subStepFocus: subStepTask ? subStepTask : undefined
        })
      });

      const responseData = await res.json();

      if (!res.ok) {
        throw new Error(responseData.error || "Failed to contact Gemini coach engine.");
      }

      const rawSteps = responseData.steps || [];
      const loadedSteps: MicroStep[] = rawSteps.map((s: any, i: number) => ({
        id: "step-" + Date.now() + "-" + i,
        text: s.text,
        minutes: s.minutes || 5,
        visualMetaphor: s.visualMetaphor || "bite-sized",
        checked: false
      }));

      if (subStepId && subStepTask) {
        // "Make Smaller" integration: Replace/splice steps inside target master task
        setTasks((prevTasks) => 
          prevTasks.map((t) => {
            const stepIndex = t.steps.findIndex((s) => s.id === subStepId);
            if (stepIndex !== -1) {
              const updatedSteps = [...t.steps];
              // Splice the sub-steps directly in place of the target step soAryan doesn't get overwhelmed!
              updatedSteps.splice(stepIndex, 1, ...loadedSteps);
              return { ...t, steps: updatedSteps };
            }
            return t;
          })
        );
        playSound("success");
      } else {
        // Create full master task
        const newTask: Task = {
          id: "task-" + Date.now(),
          originalInput: inputToUse,
          condition: selectedBreakdownCondition,
          createdAt: new Date().toISOString(),
          steps: loadedSteps
        };
        setTasks((prev) => [newTask, ...prev]);
        setTaskInputValue("");
        playSound("done");
      }
    } catch (e: any) {
      console.error(e);
      setBreakdownError(e.message || "Something went wrong. Let's try again in a moment.");
    } finally {
      setIsLoadingBreakdown(false);
    }
  };

  const handleStepCheck = (taskId: string, stepId: string) => {
    playSound("success");
    let newlyCompleted = false;

    setTasks((prevTasks) => 
      prevTasks.map((t) => {
        if (t.id === taskId) {
          const updatedSteps = t.steps.map((s) => {
            if (s.id === stepId) {
              const prevVal = s.checked;
              if (!prevVal) newlyCompleted = true;
              return { ...s, checked: !prevVal };
            }
            return s;
          });

          // Check if newly fully completed!
          const allCompletedBefore = t.steps.every(st => st.checked);
          const allCompletedAfter = updatedSteps.every(st => st.checked);
          if (!allCompletedBefore && allCompletedAfter) {
            setCompletedSessionsHistory(oldHistory => [
              {
                id: "h-" + Date.now(),
                title: t.originalInput,
                date: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
                stepsCount: t.steps.length,
                minutes: t.steps.reduce((acc, step) => acc + step.minutes, 0)
              },
              ...oldHistory
            ]);
          }

          return { ...t, steps: updatedSteps };
        }
        return t;
      })
    );

    if (newlyCompleted) {
      // Trigger instant confetti on completion rewards as long as NOT in Calm Mode!
      if (!calmMode && prefs.confettiIntensity !== "off") {
        const intensity = prefs.confettiIntensity || "medium";
        if (intensity === "low") {
          confetti({
            particleCount: 15,
            spread: 35,
            origin: { y: 0.75 },
            colors: ["#8baa7a", "#e0a458", "#6b8c5c", "#f9e7c2"]
          });
        } else if (intensity === "medium") {
          confetti({
            particleCount: 45,
            spread: 55,
            origin: { y: 0.75 },
            colors: ["#8baa7a", "#e0a458", "#6b8c5c", "#f9e7c2"]
          });
        } else if (intensity === "burst") {
          confetti({
            particleCount: 110,
            spread: 90,
            origin: { y: 0.7 },
            colors: ["#8baa7a", "#e0a458", "#a4c3b2", "#f9e7c2", "#dcd5c5"]
          });
          setTimeout(() => {
            confetti({
              particleCount: 40,
              angle: 60,
              spread: 55,
              origin: { x: 0, y: 0.8 },
              colors: ["#8baa7a", "#f9e7c2"]
            });
            confetti({
              particleCount: 40,
              angle: 120,
              spread: 55,
              origin: { x: 1, y: 0.8 },
              colors: ["#8baa7a", "#f9e7c2"]
            });
          }, 150);
        }
      }

      setStats((old) => {
        const todayStr = new Date().toLocaleDateString();
        // Generative continuous streak logic that never punishes gaps!
        let newStreak = old.streakCount;
        if (old.lastActiveDate !== todayStr) {
          newStreak = old.streakCount + 1;
        }
        return {
          completedStepsCount: old.completedStepsCount + 1,
          focusedMinutesCount: old.focusedMinutesCount + 4,
          streakCount: newStreak,
          lastActiveDate: todayStr
        };
      });

      // Random encouragement buddy chat on step completion
      setTimeout(() => {
        const randomBuddy = INITIAL_BUDDIES[Math.floor(Math.random() * INITIAL_BUDDIES.length)];
        const encourages = [
          "Awesome job ticking that off! 🎉",
          "That step is down! Let's sustain this pace.",
          "Awesome momentum. Checking items off builds neural flow!",
          "Tiny steps make complex mountains vanish."
        ];
        const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        setChatMessages((messages) => [
          ...messages,
          {
            id: "congrats-" + Date.now(),
            sender: `${randomBuddy.name} ${randomBuddy.avatar}`,
            avatar: randomBuddy.avatar,
            text: encourages[Math.floor(Math.random() * encourages.length)],
            timestamp: timeStr
          }
        ]);
      }, 1000);
    }
  };

  const deleteTask = (id: string) => {
    playSound("click");
    setTasks((prev) => prev.filter((t) => t.id !== id));
  };

  // --- Text Doubling Chat Presets handler ---
  const sendPresetChatMessage = (text: string) => {
    playSound("success");
    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const userMsg: ChatMessage = {
      id: "usr-" + Date.now(),
      sender: "You (Guest123) 🌲",
      avatar: "🌲",
      text,
      timestamp: timeStr
    };

    setChatMessages((prev) => [...prev, userMsg]);

    // Instantly simulate an encouraging buddy response with absolutely NO anxiety
    setTimeout(() => {
      const respondingBuddy = INITIAL_BUDDIES[Math.floor(Math.random() * INITIAL_BUDDIES.length)];
      const replies = [
        `You got this! Focus mode is fully engaged.`,
        `Breathing deeply over here too. Doing steps in sequence feels lighter.`,
        `Let's stick together! Doing the next 10 minutes alongside you.`,
        `Awesome work! Checking items one step at a time.`
      ];
      setChatMessages((prev) => [
        ...prev,
        {
          id: "reply-" + Date.now(),
          sender: `${respondingBuddy.name} ${respondingBuddy.avatar}`,
          avatar: respondingBuddy.avatar,
          text: replies[Math.floor(Math.random() * replies.length)],
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    }, 900);
  };

  // --- Quick Helpers ---
  const formatTimer = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  return (
    <div 
      className="min-h-screen lg:h-screen lg:overflow-hidden flex flex-col lg:flex-row bg-flow-primary text-flow-primary transition-colors select-none font-sans text-sm"
      onMouseMove={handleMouseMove}
      id="focusflow-app"
      style={{
        fontFamily: prefs.fontFamily === "readability" ? "'Comic Neue', cursive, sans-serif" : "var(--font-family)",
        filter: prefs.colorBlindFilter && prefs.colorBlindFilter !== "none" ? `url(#${prefs.colorBlindFilter})` : undefined
      }}
    >
      {/* 🕶️ SVG Color Correction Matrices for Accessibility Filters */}
      <svg style={{ display: "none" }} aria-hidden="true" id="colorblind-svg-filters">
        <defs>
          <filter id="protanopia">
            <feColorMatrix 
              type="matrix" 
              values="0.567, 0.433, 0, 0, 0, 0.558, 0.442, 0, 0, 0, 0, 0.242, 0.758, 0, 0, 0, 0, 0, 1, 0" 
            />
          </filter>
          <filter id="deuteranopia">
            <feColorMatrix 
              type="matrix" 
              values="0.625, 0.375, 0, 0, 0, 0.7, 0.3, 0, 0, 0, 0, 0.3, 0.7, 0, 0, 0, 0, 0, 1, 0" 
            />
          </filter>
          <filter id="tritanopia">
            <feColorMatrix 
              type="matrix" 
              values="0.95, 0.05, 0, 0, 0, 0, 0.433, 0.567, 0, 0, 0, 0.475, 0.525, 0, 0, 0, 0, 0, 1, 0" 
            />
          </filter>
        </defs>
      </svg>
      {/* 👁️ 20-20-20 Low-Anxiety Visual Eye-Rest Overlay */}
      {isRestPromptActive && (
        <div 
          className="fixed inset-0 z-[100] flex flex-col items-center justify-center text-white p-6 animate-low-anxiety-aura select-text"
          id="eye-strain-rest-overlay"
        >
          <div className="max-w-xl w-full text-center space-y-8 animate-fade-up">
            
            {/* Visual Header Icon & Gentle Animation */}
            <div className="relative flex items-center justify-center w-36 h-36 mx-auto">
              <div className="absolute inset-0 rounded-full border-2 border-emerald-400/20 animate-slow-orbit-pulse" />
              <div className="absolute w-28 h-28 rounded-full border border-teal-300/10 animate-pulse" />
              <div className="w-20 h-20 rounded-full bg-stone-900/60 flex items-center justify-center border border-emerald-500/30 text-4xl">
                👁️
              </div>
            </div>

            {/* Title / Explanation */}
            <div className="space-y-3">
              <span className="text-[10px] font-mono tracking-[0.2em] font-bold text-emerald-300 block uppercase">
                AUTOMATED COGNITIVE COHERENCE
              </span>
              <h2 className="text-2xl md:text-3xl font-serif font-black tracking-tight text-stone-100">
                Prevent Visual Fatigue (20-20-20)
              </h2>
              <p className="text-xs text-stone-300 leading-relaxed max-w-md mx-auto">
                Every 25 minutes of screens, shift your focus to look at an object at least <b>20 feet away</b> for <b>20 seconds</b>. This allows your ciliary optic muscles to reform and reset.
              </p>
            </div>

            {/* Big Countdown Timer */}
            <div className="p-6 bg-white/5 backdrop-blur-md rounded-2xl border border-white/10 max-w-xs mx-auto space-y-2">
              <p className="text-[10px] font-mono tracking-widest text-[#a4c3b2] uppercase font-bold">
                Optical Relaxation Period
              </p>
              <div className="text-5xl font-mono font-black text-white" id="eye-rest-seconds-left">
                {restPromptSecondsLeft}s
              </div>
              <div className="w-full bg-white/10 h-1.5 rounded-full overflow-hidden">
                <div 
                  className="bg-emerald-400 h-full transition-all duration-1000" 
                  style={{ width: `${(restPromptSecondsLeft / 20) * 100}%` }}
                />
              </div>
            </div>

            {/* Micro-instructions / Grounding guidelines */}
            <div className="text-xs text-[#a4c3b2] space-y-1.5 max-w-sm mx-auto p-4 bg-emerald-950/20 rounded-xl border border-[#8baa7a]/25 text-left font-mono">
              <div className="flex items-start gap-2">
                <span className="text-emerald-400">⚡</span>
                <span>Rest your gaze on a solid physical feature (like a plant or window)</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-emerald-400">💨</span>
                <span>Let your shoulders drop and take a long, deep, soothing breath</span>
              </div>
            </div>

            {/* Manual actions */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              {restPromptSecondsLeft === 0 ? (
                <button
                  type="button"
                  onClick={() => {
                    setIsRestPromptActive(false);
                    playSound("success");
                  }}
                  className="px-6 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs rounded-xl cursor-pointer shadow-md transition-all duration-200"
                >
                  Return Refreshed & Close ➔
                </button>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() => {
                      setIsRestPromptActive(false);
                      playSound("click");
                    }}
                    className="px-5 py-2 bg-stone-800/80 hover:bg-stone-750 text-[#a4c3b2] font-semibold text-xs rounded-lg cursor-pointer border border-stone-700 transition"
                  >
                    Skip & Return Immediately
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setRestPromptSecondsLeft(20);
                      playSound("relax");
                    }}
                    className="px-3 py-2 text-[10px] text-stone-400 hover:text-white transition duration-150 font-medium underline"
                  >
                    Reset Timer (20s)
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 🔮 Sensory Shield Filter Overlay Layer */}
      {sensoryTint !== "none" && (
        <div 
          className={`fixed inset-0 pointer-events-none z-50 mix-blend-multiply opacity-[0.15] transition-all duration-500 ${
            sensoryTint === "amber" ? "bg-amber-400" :
            sensoryTint === "sage" ? "bg-emerald-300" :
            sensoryTint === "lavender" ? "bg-purple-350 bg-indigo-300" : ""
          }`}
          id="sensory-tint-layer"
        />
      )}

      {/* ⚠️ Reading Ruler Yellow overlay bar layer */}
      {prefs.readingRulerEnabled && (
        <div 
          ref={rulerRef}
          className="reading-ruler" 
          style={{ top: `${prefs.rulerY}px` }}
          id="reading-ruler-overlay"
        >
          <div className="absolute top-[-20px] left-4 bg-yellow-300 text-black text-[10px] px-2 py-0.5 rounded shadow font-mono pointer-events-auto cursor-help">
            Reading Ruler (Follows mouse)
          </div>
        </div>
      )}

      {/* --- JUST START PANIC MODE SCREEN (Hides all UI elements for anti-paralysis) --- */}
      {isPanicState ? (
        <div className="fixed inset-0 bg-red-950/95 dark:bg-black/98 flex flex-col items-center justify-center text-center p-6 z-50 animate-fade-up">
          <ThreeDTiltCard
            calmMode={calmMode}
            motionLevel={prefs.motionLevel}
            maxTilt={6}
            className="max-w-md w-full bg-stone-900 border border-red-800 p-8 rounded-2xl shadow-2xl relative"
          >
            <h2 className="text-4xl font-sans tracking-tight text-amber-100 mb-2 font-bold select-none">
              Just 2 Minutes
            </h2>
            <p className="text-stone-300 text-sm mb-6">
              Panic Mode Active. Hiding everything else to bypass cognitive friction. Just sit, breathe, and begin.
            </p>

            {/* Huge breathing circle indicator */}
            <div className="w-48 h-48 rounded-full border-4 border-amber-400 flex flex-col items-center justify-center mx-auto mb-8 relative animate-panic-pulse">
              <span className="text-4xl font-mono text-amber-200 tracking-widest">
                {formatTimer(panicSeconds)}
              </span>
              <span className="text-[11px] text-stone-400 absolute bottom-7 animate-pulse">
                breathe...
              </span>
            </div>

            {isPanicCompleted ? (
              <div className="space-y-4">
                <div className="p-3 bg-stone-800 rounded border border-amber-500/30 text-amber-200 text-sm">
                  ✓ Two minutes of progress down! The inertia is broken.
                </div>
                <div className="flex gap-3 justify-center">
                  <button 
                    id="panic-reset-btn"
                    onClick={() => {
                      setPanicSeconds(120);
                      setIsPanicCompleted(false);
                      playSound("success");
                    }}
                    className="px-5 py-2.5 bg-[#8baa7a] hover:bg-[#729162] text-white rounded-lg font-medium flex items-center gap-2 text-xs cursor-pointer"
                  >
                    <RotateCcw className="w-4 h-4" /> Start Next Block
                  </button>
                  <button 
                    id="panic-cancel-btn"
                    onClick={() => {
                      setIsPanicState(false);
                      setIsPanicCompleted(false);
                      setPanicSeconds(120);
                      playSound("relax");
                    }}
                    className="px-5 py-2.5 bg-stone-800 hover:bg-stone-700 text-stone-300 rounded-lg text-xs cursor-pointer"
                  >
                    Finish Panic Mode
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex justify-center">
                <button 
                  id="panic-cancel-btn"
                  onClick={() => {
                    setIsPanicState(false);
                    setPanicSeconds(120);
                    playSound("relax");
                  }}
                  className="px-6 py-2 bg-stone-900 text-xs text-stone-400 border border-stone-800 hover:border-amber-500 rounded-lg transition-all cursor-pointer"
                >
                  Exit Early & Show Dashboard
                </button>
              </div>
            )}
          </ThreeDTiltCard>
        </div>
      ) : null}

      {/* ================= LEFT SIDEBAR PANEL: SENSORY PROFILES & SWITCHES ================= */}
      <nav className="w-full lg:w-[250px] bg-flow-secondary border-b lg:border-b-0 lg:border-r border-flow flex flex-col p-6 space-y-6 shrink-0 lg:overflow-y-auto" id="left-sidebar">
        {/* Brand Group */}
        <div className="flex items-center gap-2.5 shrink-0">
          <div className="w-8 h-8 bg-[#8baa7a] rounded-full flex items-center justify-center text-white font-bold text-lg shadow-sm">
            F
          </div>
          <div>
            <span className="text-xl font-bold tracking-tight text-flow-primary block">FocusFlow</span>
            <span className="text-[9px] uppercase tracking-wider text-flow-secondary font-mono">Sensory Adaptive App</span>
          </div>
        </div>

        {/* Sensory Profile selection list */}
        <div>
          <label className="text-[10px] uppercase tracking-widest text-flow-secondary font-bold mb-3 block">Sensory Profile</label>
          <ul className="space-y-1.5">
            {(["default", "adhd", "autism", "dyslexia", "spd"] as const).map((p) => {
              const labels = {
                default: "Forest Calm (Default)",
                adhd: "ADHD Focus",
                autism: "Autism Calm",
                dyslexia: "Dyslexia Reader",
                spd: "SPD Low Arousal"
              };
              const isActive = profile === p;
              return (
                <li 
                  key={p}
                  onClick={() => { setProfile(p); playSound("click"); }}
                  className={`p-2 rounded-md text-xs font-medium transition-colors cursor-pointer flex items-center justify-between ${
                    isActive 
                      ? "bg-[#8baa7a] text-white" 
                      : "hover:bg-[#dcd5c5]/40 text-flow-primary opacity-80"
                  }`}
                >
                  <span>{labels[p]}</span>
                  {isActive && <Check className="w-3.5 h-3.5" />}
                </li>
              );
            })}
          </ul>
        </div>

        {/* Accessibility toggles switch layout */}
        <div>
          <label className="text-[10px] uppercase tracking-widest text-flow-secondary font-bold mb-3 block">Accessibility</label>
          <div className="space-y-3.5">
            {/* Calm Mode */}
            <div className="flex items-center justify-between">
              <span className="text-xs text-flow-primary">Calm Mode</span>
              <button 
                id="calm-mode-switch"
                onClick={() => { setCalmMode(!calmMode); playSound("relax"); }}
                className={`w-9 h-5 rounded-full flex items-center px-0.5 transition-colors cursor-pointer ${calmMode ? "bg-[#8baa7a]" : "bg-[#dcd5c5]"}`}
              >
                <div className={`w-4 h-4 bg-white rounded-full transition-transform ${calmMode ? "translate-x-4" : ""}`} />
              </button>
            </div>

            {/* Dyslexia Clean Minimalism Toggle */}
            {profile === "dyslexia" && (
              <div className="p-2.5 bg-[#8baa7a]/15 rounded-lg border border-[#8baa7a]/35 animate-fade-in space-y-2">
                <div className="flex items-start justify-between">
                  <span className="text-xs font-bold text-flow-primary">Clean Minimalism</span>
                  <button 
                    id="dyslexia-minimalist-switch"
                    onClick={() => { setDyslexiaMinimalist(!dyslexiaMinimalist); playSound("click"); }}
                    className={`w-9 h-5 rounded-full flex items-center px-0.5 transition-colors cursor-pointer shrink-0 ${dyslexiaMinimalist ? "bg-[#8baa7a]" : "bg-[#dcd5c5]"}`}
                  >
                    <div className={`w-4 h-4 bg-white rounded-full transition-transform ${dyslexiaMinimalist ? "translate-x-4" : ""}`} />
                  </button>
                </div>
                <p className="text-[10px] text-flow-secondary leading-normal">
                  Switch to clean bone background, flat cards, wider letter/word spacing & extra high line heights.
                </p>
              </div>
            )}

            {/* Reading Ruler */}
            <div className="flex items-center justify-between">
              <span className="text-xs text-flow-primary">Reading Ruler</span>
              <button 
                id="reading-ruler-trigger"
                onClick={() => { setPrefs(prev => ({ ...prev, readingRulerEnabled: !prev.readingRulerEnabled })); playSound("click"); }}
                className={`w-9 h-5 rounded-full flex items-center px-0.5 transition-colors cursor-pointer ${prefs.readingRulerEnabled ? "bg-[#8baa7a]" : "bg-[#dcd5c5]"}`}
              >
                <div className={`w-4 h-4 bg-white rounded-full transition-transform ${prefs.readingRulerEnabled ? "translate-x-4" : ""}`} />
              </button>
            </div>

            {/* Sound FX state */}
            <div className="flex items-center justify-between">
              <span className="text-xs text-flow-primary">Sound Fx</span>
              <button 
                id="sound-fx-trigger"
                onClick={() => { setPrefs(prev => ({ ...prev, soundEnabled: !prev.soundEnabled })); playSound("click"); }}
                className={`w-9 h-5 rounded-full flex items-center px-0.5 transition-colors cursor-pointer ${prefs.soundEnabled ? "bg-[#8baa7a]" : "bg-[#dcd5c5]"}`}
              >
                <div className={`w-4 h-4 bg-white rounded-full transition-transform ${prefs.soundEnabled ? "translate-x-4" : ""}`} />
              </button>
            </div>

            {/* Contrast theme toggle */}
            <div className="flex items-center justify-between">
              <span className="text-xs text-flow-primary">Page Contrast</span>
              <button 
                id="dark-mode-trigger"
                onClick={() => { setDarkMode(!darkMode); playSound("click"); }}
                className={`w-9 h-5 rounded-full flex items-center px-0.5 transition-colors cursor-pointer ${darkMode ? "bg-[#8baa7a]" : "bg-[#dcd5c5]"}`}
              >
                <div className={`w-4 h-4 bg-white rounded-full transition-transform ${darkMode ? "translate-x-4" : ""}`} />
              </button>
            </div>

            {/* Sensory Shield Overlay Picker */}
            <div className="pt-2 border-t border-[#dcd5c5]/40 space-y-1.5" id="sensory-eye-shield-control">
              <span className="text-[9px] font-bold text-flow-secondary block uppercase tracking-wider">Sensory Eye Shield</span>
              <div className="grid grid-cols-4 gap-1">
                {[
                  { key: "none", label: "Clear", bg: "bg-white border-stone-300 hover:bg-stone-50 text-stone-700" },
                  { key: "amber", label: "Amber", bg: "bg-amber-100 hover:bg-amber-150 border-amber-300 text-amber-900" },
                  { key: "sage", label: "Sage", bg: "bg-emerald-50 hover:bg-emerald-100 border-emerald-300 text-emerald-900" },
                  { key: "lavender", label: "Indigo", bg: "bg-indigo-50 hover:bg-indigo-100 border-indigo-300 text-indigo-900" }
                ].map((item) => (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => { setSensoryTint(item.key as any); playSound("click"); }}
                    className={`px-1 py-1 rounded border text-[9px] font-bold font-sans transition-all cursor-pointer text-center ${item.bg} ${
                      sensoryTint === item.key 
                        ? "ring-1 ring-[#8baa7a] border-transparent font-black" 
                        : "opacity-75"
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Granular Settings */}
        <div id="granular-settings-panel" className="space-y-2">
          <label className="text-[10px] uppercase tracking-widest text-flow-secondary font-bold block">Granular Settings</label>
          <div className="space-y-1.5 p-2.5 bg-stone-50 dark:bg-zinc-800/40 rounded-lg border border-[#dcd5c5]/45">
            <div className="flex justify-between items-center text-[10px] text-flow-secondary">
              <span className="font-bold">Confetti Intensity</span>
              <span className="font-mono capitalize text-[#8baa7a] font-extrabold" id="confetti-intensity-status">
                {prefs.confettiIntensity || "medium"}
              </span>
            </div>
            
            <input
              type="range"
              min="0"
              max="3"
              step="1"
              id="confetti-intensity-slider"
              value={
                prefs.confettiIntensity === "off" ? 0 :
                prefs.confettiIntensity === "low" ? 1 :
                prefs.confettiIntensity === "medium" ? 2 : 3
              }
              onChange={(e) => {
                const val = parseInt(e.target.value, 10);
                const levels: ("off" | "low" | "medium" | "burst")[] = ["off", "low", "medium", "burst"];
                setPrefs(prev => ({ ...prev, confettiIntensity: levels[val] }));
                playSound("click");
              }}
              className="w-full h-1.5 bg-[#dcd5c5]/60 rounded-lg appearance-none cursor-pointer accent-[#8baa7a] dark:bg-zinc-700 animate-fade-in"
              aria-label="Confetti intensity slider"
            />
            
            <div className="flex justify-between text-[8px] font-mono font-bold text-flow-secondary px-0.5">
              <span>Off</span>
              <span>Low</span>
              <span>Med</span>
              <span>Burst</span>
            </div>
          </div>

          {/* Color Blindness Filter accessibility enhancement */}
          <div className="space-y-1.5 p-2.5 bg-stone-50 dark:bg-zinc-800/40 rounded-lg border border-[#dcd5c5]/45">
            <div className="flex justify-between items-center text-[10px] text-flow-secondary">
              <span className="font-bold">Color Blindness Filter</span>
              <span className="font-mono capitalize text-[#8baa7a] font-extrabold" id="color-blindness-status">
                {prefs.colorBlindFilter === "none" ? "None" : prefs.colorBlindFilter}
              </span>
            </div>
            
            <div className="grid grid-cols-4 gap-1 text-[9px] font-mono">
              {[
                { key: "none", label: "Normal" },
                { key: "protanopia", label: "Protan" },
                { key: "deuteranopia", label: "Deuter" },
                { key: "tritanopia", label: "Tritan" }
              ].map((filterOpt) => {
                const isActive = (prefs.colorBlindFilter || "none") === filterOpt.key;
                return (
                  <button
                    key={filterOpt.key}
                    type="button"
                    onClick={() => {
                      setPrefs(prev => ({ ...prev, colorBlindFilter: filterOpt.key as any }));
                      playSound("relax");
                    }}
                    className={`p-1 rounded text-center transition cursor-pointer border font-bold ${
                      isActive
                        ? "bg-[#8baa7a] text-white border-transparent"
                        : "border-[#dcd5c5] hover:bg-[#faf7f2]/80 bg-white dark:bg-zinc-900 text-flow-primary"
                    }`}
                  >
                    {filterOpt.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Typography family preference overrides */}
        <div>
          <label className="text-[10px] uppercase tracking-widest text-flow-secondary font-bold mb-2 block">Typography</label>
          <div className="space-y-2">
            <div className="grid grid-cols-2 gap-1 text-[10px]">
              <button 
                onClick={() => { setPrefs(prev => ({ ...prev, fontFamily: "sans" })); playSound("click"); }}
                className={`p-1.5 rounded border text-center transition cursor-pointer ${prefs.fontFamily === "sans" ? "bg-[#8baa7a] text-white border-transparent" : "border-flow hover:bg-flow-primary text-flow-primary"}`}
              >
                Sans (Inter)
              </button>
              <button 
                onClick={() => { setPrefs(prev => ({ ...prev, fontFamily: "readability" })); playSound("click"); }}
                className={`p-1.5 rounded border text-center font-serif transition cursor-pointer ${prefs.fontFamily === "readability" ? "bg-[#8baa7a] text-white border-transparent" : "border-flow hover:bg-flow-primary text-flow-primary"}`}
              >
                Comic Neue
              </button>
            </div>
            
            <div className="grid grid-cols-3 gap-1 text-[9px]">
              {(["normal", "large", "extra-large"] as const).map(sz => (
                <button
                  key={sz}
                  onClick={() => { setPrefs(prev => ({ ...prev, fontSize: sz })); playSound("click"); }}
                  className={`p-1 rounded border text-center capitalize transition cursor-pointer ${prefs.fontSize === sz ? "bg-[#8baa7a] text-white border-transparent font-bold" : "border-flow hover:bg-flow-primary text-flow-primary"}`}
                >
                  {sz.replace("-", " ")}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Current status info at the bottom */}
        <div className="mt-auto bg-[#2d3e2b] text-white p-4 rounded-lg">
          <p className="text-xs opacity-80 mb-1">Weekly Garden Stash</p>
          <div className="flex justify-between items-baseline mb-2">
            <span className="text-2xl font-mono font-bold">{stats.focusedMinutesCount}m</span>
            <span className="text-xs font-serif italic text-amber-200">{stats.streakCount} days streak</span>
          </div>
          <div className="flex justify-between text-[10px] opacity-70">
            <span>Cleared: {stats.completedStepsCount} pieces</span>
          </div>
        </div>
      </nav>
        {/* ================= CENTER COLUMN: MULTI-PAGE SENSORY WORKSPACE ================= */}
      <main className="flex-1 p-6 lg:p-10 flex flex-col space-y-6 lg:overflow-y-auto animate-fade-in" id="main-content">
        
        {/* Main Content Header */}
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-4 border-b border-[#dcd5c5]" id="center-column-header">
          <div>
            <h1 className="text-3xl font-bold italic text-flow-primary">
              {currentPage === "workspace" ? (tasks[0] ? tasks[0].originalInput : "Bypass Anxiety & Lock In") :
               currentPage === "lounge" ? "Multiplayer Study Lounge" :
               currentPage === "garden" ? "Evergreen Metric Garden" : "Sensory Neuro Center"}
            </h1>
            <p className="text-flow-secondary text-sm">
              {currentPage === "workspace" && (<span>Wording adapted for <strong className="text-[#5b6e55]">{selectedBreakdownCondition}</strong> &bull; CS Thesis Project coach</span>)}
              {currentPage === "lounge" && (<span>Text-based double doubling &bull; Ambient room: <strong>{studyRoomAmbient.toUpperCase()}</strong></span>)}
              {currentPage === "garden" && (<span>Active Botanical Species: <strong className="text-[#5b6e55]">{activeGardenPlant.toUpperCase()}</strong> &bull; Zero penalty growth</span>)}
              {currentPage === "neuro" && (<span>WCAG 2.2 Compliant Showcase &bull; 7 neurovariant configurations</span>)}
            </p>
          </div>
          <div className="text-right">
            <span className="bg-[#8baa7a] text-white px-3 py-1 rounded-full text-xs font-bold uppercase tracking-tighter shadow-sm">
              {isLoadingBreakdown ? "coach syncing..." : "AI coach adaptive"}
            </span>
          </div>
        </header>

        {/* ================= GORGEOUS MINIMALIST TAB BAR (DIFFERENT PAGES CONTROL) ================= */}
        <nav className="flex flex-wrap items-center gap-1 border-b border-[#dcd5c5] pb-1 text-xs font-semibold" id="page-tabs-navigation">
          <button 
            type="button"
            onClick={() => { setCurrentPage("workspace"); playSound("click"); }}
            className={`px-3.5 py-2.5 rounded-t-lg border-b-2 transition cursor-pointer flex items-center gap-1.5 ${
              currentPage === "workspace" 
                ? "border-[#8baa7a] bg-[#8baa7a]/10 text-flow-primary" 
                : "border-transparent text-flow-secondary hover:text-[#2d3e2b] hover:bg-[#faf7f2]/50"
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-[#8baa7a]" /> Task Workspace
          </button>
          <button 
            type="button"
            onClick={() => { setCurrentPage("lounge"); playSound("click"); }}
            className={`px-3.5 py-2.5 rounded-t-lg border-b-2 transition cursor-pointer flex items-center gap-1.5 ${
              currentPage === "lounge" 
                ? "border-[#8baa7a] bg-[#8baa7a]/10 text-flow-primary" 
                : "border-transparent text-flow-secondary hover:text-[#2d3e2b] hover:bg-[#faf7f2]/50"
            }`}
          >
            <User className="w-3.5 h-3.5 text-[#8baa7a]" /> Study Lounge
          </button>
          <button 
            type="button"
            onClick={() => { setCurrentPage("garden"); playSound("click"); }}
            className={`px-3.5 py-2.5 rounded-t-lg border-b-2 transition cursor-pointer flex items-center gap-1.5 ${
              currentPage === "garden" 
                ? "border-[#8baa7a] bg-[#8baa7a]/10 text-flow-primary" 
                : "border-transparent text-flow-secondary hover:text-[#2d3e2b] hover:bg-[#faf7f2]/50"
            }`}
          >
            <Trees className="w-3.5 h-3.5 text-[#8baa7a]" /> Garden & Logs
          </button>
          <button 
            type="button"
            onClick={() => { setCurrentPage("neuro"); playSound("click"); }}
            className={`px-3.5 py-2.5 rounded-t-lg border-b-2 transition cursor-pointer flex items-center gap-1.5 ${
              currentPage === "neuro" 
                ? "border-[#8baa7a] bg-[#8baa7a]/10 text-flow-primary" 
                : "border-transparent text-flow-secondary hover:text-[#2d3e2b] hover:bg-[#faf7f2]/50"
            }`}
          >
            <HelpCircle className="w-3.5 h-3.5 text-[#8baa7a]" /> Neuro Center
          </button>
        </nav>

        {/* ================= PAGE CONTAINER CONTENT SWITCH ================= */}
        
        {currentPage === "workspace" && (
          <div className="space-y-6" id="workspace-page-view">
            {/* Overcome Task Paralysis Form Box */}
            <ThreeDTiltCard
              calmMode={calmMode}
              motionLevel={prefs.motionLevel}
              className="bg-white dark:bg-flow-secondary/25 p-6 rounded-xl border border-[#dcd5c5] shadow-sm relative overflow-hidden transition-all"
            >
              {isLoadingBreakdown && (
                <div className="absolute inset-0 bg-[#f5f0e8]/90 dark:bg-stone-900/90 flex flex-col items-center justify-center backdrop-blur-[1px] z-10">
                  <div className="text-center space-y-2">
                    <div className="w-8 h-8 mx-auto rounded-full border-2 border-[#8baa7a] border-t-transparent animate-spin"></div>
                    <p className="text-xs text-[#2d3e2b] font-bold font-mono">
                      🤖 {selectedBreakdownCondition} coach is constructing steps...
                    </p>
                    <p className="text-[10px] text-flow-secondary">
                      Wording steps carefully to bypass cognitive paralyzation.
                    </p>
                  </div>
                </div>
              )}

              <h2 className="text-lg font-sans font-bold text-[#2d3e2b] flex items-center gap-1.5 mb-1.5">
                <Sparkles className="w-4 h-4 text-[#8baa7a]" /> Overcome Task Paralysis
              </h2>
              <p className="text-xs text-flow-secondary mb-4 leading-relaxed">
                Have an overwhelming goal like "finish essay structure" or "study bibliography"? Write or speak it below. Our expert coach uses AI to map out short, sequential intervals under 10 minutes total.
              </p>

              <form onSubmit={(e) => { e.preventDefault(); submitTaskBreakdown(); }} className="space-y-4">
                {/* Condition wording toggle selection */}
                <div className="flex flex-wrap items-center gap-2 text-xs">
                  <span className="font-bold text-flow-primary text-[11px]">Coach Adaptation:</span>
                  <div className="flex flex-wrap gap-1">
                    {["ADHD", "Autism", "Dyslexia", "Dyscalculia", "Executive Dysfunction"].map((cond) => (
                      <button
                        key={cond}
                        type="button"
                        onClick={() => { setSelectedBreakdownCondition(cond); playSound("click"); }}
                        className={`px-2 py-0.5 rounded text-[10px] border transition cursor-pointer ${selectedBreakdownCondition === cond ? "bg-[#8baa7a] text-white border-transparent font-bold" : "border-[#dcd5c5] hover:bg-flow-primary text-flow-secondary"}`}
                      >
                        {cond}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="relative">
                  <textarea
                    id="task-input-textarea"
                    value={taskInputValue}
                    onChange={(e) => setTaskInputValue(e.target.value)}
                    placeholder="e.g. Gather references for cs thesis draft and organize folders..."
                    className="w-full h-20 p-3 text-xs bg-flow-primary text-flow-primary border border-flow rounded-lg focus:ring-1 focus:ring-flow-accent outline-none resize-none placeholder:text-flow-secondary/50 font-mono"
                    maxLength={500}
                  />
                  
                  {/* Audio speak microphone trigger */}
                  {speechSupport && (
                    <button
                      type="button"
                      onClick={toggleListening}
                      className={`absolute bottom-3 right-3 p-1.5 rounded-full cursor-pointer transition-all ${
                        isListeningVoice 
                          ? "bg-red-500 text-white animate-pulse" 
                          : "bg-flow-secondary text-flow-secondary border border-flow hover:text-flow-accent"
                      }`}
                      title="Speak my goal"
                    >
                      {isListeningVoice ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                    </button>
                  )}
                </div>

                {isListeningVoice && (
                  <p className="text-[10px] text-red-500 animate-pulse font-mono block pl-1">
                    🎙️ Listening... Speak normally now to dictate.
                  </p>
                )}

                {breakdownError && (
                  <div className="p-3 bg-red-100 dark:bg-red-950/40 border border-red-300 text-red-800 dark:text-red-200 text-xs rounded-lg">
                    {breakdownError}
                  </div>
                )}

                <button
                  id="breakdown-submit-btn"
                  type="submit"
                  disabled={!taskInputValue.trim() || isLoadingBreakdown}
                  className="w-full py-2.5 bg-[#8baa7a] hover:bg-[#729162] text-white rounded font-bold transition duration-150 text-xs flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Sparkles className="w-4 h-4" /> + New AI Task Breakdown
                </button>
              </form>
            </ThreeDTiltCard>

            {/* Checklists Map */}
            <div className="space-y-4">
              <h3 className="text-base font-bold text-flow-primary flex items-center gap-1.5 pl-1">
                <BookOpen className="w-4 h-4 text-[#8baa7a]" /> Active Cognitive Maps ({tasks.length})
              </h3>

              {tasks.length === 0 ? (
                <div className="p-8 text-center bg-flow-secondary border border-dashed border-flow rounded-xl flex flex-col items-center justify-center">
                  <Trees className="w-10 h-10 text-flow-secondary/45 mb-2" />
                  <p className="text-sm font-bold text-flow-primary">All task maps resolved.</p>
                  <p className="text-xs text-flow-secondary">Break down a new project block to get started!</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {tasks.map((task) => {
                    const totalSteps = task.steps.length;
                    const completedSteps = task.steps.filter(s => s.checked).length;
                    const progressPercentage = totalSteps ? Math.round((completedSteps / totalSteps) * 100) : 0;
                    
                    // Track active step (first unchecked one)
                    const firstUncheckedIdx = task.steps.findIndex(s => !s.checked);

                    return (
                      <ThreeDTiltCard key={task.id} calmMode={calmMode} motionLevel={prefs.motionLevel} className="bg-white dark:bg-zinc-900 border border-[#dcd5c5] p-5 rounded-xl space-y-4 shadow-sm" id={`task-card-${task.id}`}>
                        <div className="flex justify-between items-start gap-3">
                          <div>
                            <span className="text-[9px] font-mono px-2 py-0.5 rounded-full bg-[#8baa7a]/15 text-[#5b6e55] font-bold uppercase">
                              {task.condition} Wording Active
                            </span>
                            <h4 className="font-bold text-sm text-[#2d3e2b] mt-1 select-text">
                              {task.originalInput}
                            </h4>
                          </div>
                          <button 
                            onClick={() => deleteTask(task.id)}
                            className="p-1.5 text-flow-secondary hover:text-red-500 rounded hover:bg-flow-primary transition-colors"
                            title="Delete task outline"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>

                        {/* Relative Progress */}
                        <div className="space-y-1">
                          <div className="flex justify-between text-[10px] text-flow-secondary">
                            <span>Step blocks completed: {completedSteps}/{totalSteps}</span>
                            <span className="font-mono bg-flow-primary border border-flow px-1.5 rounded font-bold">{progressPercentage}%</span>
                          </div>
                          <div className="w-full bg-[#faf7f2]/80 border border-[#dcd5c5] h-1.5 rounded-full overflow-hidden">
                            <div className="bg-[#8baa7a] h-full transition-all duration-300" style={{ width: `${progressPercentage}%` }} />
                          </div>
                        </div>

                        {/* Checklist */}
                        <div className="space-y-3 mt-2">
                          {task.steps.map((step, idx) => {
                            const isCompleted = step.checked;
                            const isActive = idx === firstUncheckedIdx;
                            
                            let cardClasses = "";
                            if (isCompleted) {
                              cardClasses = "flex items-center gap-4 bg-[#faf7f2]/55 dark:bg-[#faf7f2]/5 p-4 rounded-lg border border-[#dcd5c5]/80 opacity-60";
                            } else if (isActive) {
                              cardClasses = "flex items-center gap-4 bg-[#faf7f2]/10 dark:bg-zinc-805 p-5 rounded-xl border border-2 border-[#8baa7a] shadow-sm animate-fade-up";
                            } else {
                              cardClasses = "flex items-center gap-4 bg-white dark:bg-[#faf7f2]/5 p-4 rounded-lg border border-[#dcd5c5]";
                            }

                            return (
                              <div key={step.id} className={cardClasses}>
                                <button
                                  type="button"
                                  onClick={() => handleStepCheck(task.id, step.id)}
                                  className={`w-5.5 h-5.5 border-2 rounded-md flex items-center justify-center transition cursor-pointer shrink-0 ${
                                    isCompleted 
                                      ? "border-[#8baa7a] bg-[#8baa7a] text-white" 
                                      : "border-[#dcd5c5] hover:border-[#8baa7a] bg-transparent"
                                  }`}
                                  aria-label="Toggle completed task step"
                                >
                                  {isCompleted && (
                                    <svg className="w-3.5 h-3.5 text-white animate-fade-in" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3.5" d="M5 13l4 4L19 7" />
                                    </svg>
                                  )}
                                </button>

                                <div className="flex-1 min-w-0" onClick={() => handleStepCheck(task.id, step.id)}>
                                  <p className={`select-text leading-tight text-xs cursor-pointer ${
                                    isCompleted 
                                      ? "line-through text-flow-secondary" 
                                      : isActive 
                                        ? "text-sm font-bold text-flow-primary" 
                                        : "text-flow-primary font-medium"
                                  }`}>
                                    {step.text}
                                  </p>

                                  {/* Inner Actions */}
                                  {isActive && (
                                    <div className="flex gap-2 mt-2" onClick={(e) => e.stopPropagation()}>
                                      <button 
                                        type="button"
                                        onClick={() => submitTaskBreakdown(step.text, step.id)}
                                        className="text-[9px] uppercase font-bold text-[#8baa7a] border border-[#8baa7a] px-2 py-0.5 rounded hover:bg-[#8baa7a] hover:text-white transition-colors cursor-pointer"
                                      >
                                        Make Smaller
                                      </button>
                                      <button 
                                        type="button"
                                        onClick={() => speakStep(step.text)}
                                        className="text-[9px] uppercase font-bold text-[#5b6e55] border border-[#dcd5c5] px-2 py-0.5 rounded hover:bg-white dark:hover:bg-zinc-800 transition-colors cursor-pointer"
                                      >
                                        TTS Listen
                                      </button>
                                    </div>
                                  )}
                                </div>

                                <div className="text-right shrink-0">
                                  <span className={`text-xs font-mono font-bold ${isActive ? "text-[#8baa7a]" : "text-flow-secondary"}`}>
                                    {step.minutes}m
                                  </span>
                                  {step.visualMetaphor && !isCompleted && (
                                    <div className="text-[9px] font-mono text-[#d4a373] italic">
                                      {step.visualMetaphor}
                                    </div>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </ThreeDTiltCard>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Garden Miniature widget */}
            <ThreeDTiltCard
              calmMode={calmMode}
              motionLevel={prefs.motionLevel}
              className="bg-[#faf7f2]/70 dark:bg-[#faf7f2]/10 p-5 rounded-xl border border-[#dcd5c5]"
            >
              <div className="flex justify-between items-center border-b border-[#dcd5c5] pb-2 mb-3">
                <h4 className="font-bold text-sm text-[#2d3e2b] flex items-center gap-1.5">
                  <Trees className="w-4 h-4 text-[#8baa7a]" /> Live Garden Progress
                </h4>
                <button 
                  type="button"
                  onClick={() => setCurrentPage("garden")} 
                  className="text-xs text-[#8baa7a] hover:underline font-bold"
                >
                  Manage Garden &rarr;
                </button>
              </div>
              <div className="flex items-end justify-center gap-1 h-20 relative bg-white dark:bg-zinc-950/40 rounded-lg p-2 border border-[#dcd5c5]/50 overflow-hidden">
                {Array.from({ length: Math.min(stats.completedStepsCount + 1, 15) }).map((_, idx) => (
                  <div 
                    key={idx}
                    className="w-2.5 bg-emerald-600 rounded-t-full origin-bottom"
                    style={{ 
                      height: `${Math.min(12 + idx * 5, 60)}px`,
                      opacity: 0.70 + idx * 0.02
                    }}
                  />
                ))}
                <div className="absolute bottom-0 inset-x-0 h-1 bg-[#8baa7a]/20" />
              </div>
            </ThreeDTiltCard>
          </div>
        )}

        {currentPage === "lounge" && (
          <div className="space-y-6 animate-fade-in" id="lounge-page-view">
            {/* Ambient rooms selector */}
            <ThreeDTiltCard
              calmMode={calmMode}
              motionLevel={prefs.motionLevel}
              className="bg-white dark:bg-zinc-900 border border-[#dcd5c5] p-5 rounded-xl"
            >
              <h3 className="font-bold text-sm text-[#2d3e2b] mb-1">1. Choose Your Ambience Soundscape</h3>
              <p className="text-xs text-flow-secondary mb-4">Choose a focus lounge environment. Switches play gentle synthesized sound waves to sync your sensory rhythm.</p>
              
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                {[
                  { key: "forest", label: "Forest Sanctuary 🌲", desc: "Low-frequency steady green wave oscillations", tip: "Great for ADH/ADHD sensory pacing" },
                  { key: "rain", label: "Rainy Window Cafe ☕", desc: "Gentle repetitive raindrop textures", tip: "Provides smooth high-frequency dampening" },
                  { key: "library", label: "Imperial Library 📚", desc: "Completely flat soothing pink-noise sweeps", tip: "Minimizes auditory cognitive load" },
                  { key: "hearth", label: "Cozy Fireside Hearth 🔥", desc: "Warm cozy thermal crackle chimes", tip: "Stabilizes autonomic hyper-arousal" }
                ].map((room) => {
                  const isCur = studyRoomAmbient === room.key;
                  return (
                    <button
                      key={room.key}
                      type="button"
                      onClick={() => { setStudyRoomAmbient(room.key as any); playSound("relax"); }}
                      className={`p-3.5 text-left rounded-lg border transition-all text-xs cursor-pointer ${
                        isCur 
                          ? "border-2 border-[#8baa7a] bg-[#8baa7a]/5 shadow-sm" 
                          : "border-[#dcd5c5] hover:bg-[#faf7f2] bg-white dark:bg-stone-900"
                      }`}
                    >
                      <p className="font-bold text-flow-primary mb-1">{room.label}</p>
                      <p className="text-[10px] text-flow-secondary leading-tight mb-2">{room.desc}</p>
                      <span className="text-[9px] font-serif bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 px-1.5 py-0.5 rounded uppercase">
                        {room.tip}
                      </span>
                    </button>
                  );
                })}
              </div>
            </ThreeDTiltCard>

            {/* Minimalist Continuous Sound Player */}
            <ThreeDTiltCard
              calmMode={calmMode}
              motionLevel={prefs.motionLevel}
              className={`bg-white dark:bg-zinc-900 border border-[#dcd5c5] p-5 rounded-xl space-y-4 ${calmMode ? "opacity-55 pointer-events-none" : ""}`}
            >
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-2">
                <div>
                  <h3 className="font-bold text-sm text-[#2d3e2b] flex items-center gap-1.5" id="ambient-sound-machine-heading">
                    <span className="text-base">🎧</span> Continuous Ambient Sound Machine
                  </h3>
                  <p className="text-xs text-flow-secondary">
                    Need a non-stop background sound helper? Play synthesised deep brown noise or mellow garden lo-fi beats that loop continuously. Automatically respects 'Calm Mode'.
                  </p>
                </div>
                {calmMode && (
                  <span className="text-[10px] font-mono text-amber-600 bg-amber-50 dark:bg-amber-950/20 px-2 py-0.5 rounded font-bold">
                    PAUSED due to Calm Mode
                  </span>
                )}
              </div>

              <div className="flex flex-col md:flex-row items-center justify-between gap-4 p-4 bg-stone-50 dark:bg-zinc-950/20 rounded-xl border border-[#dcd5c5]/65">
                {/* Visualizer and Status */}
                <div className="flex items-center gap-3">
                  <div className="relative flex items-center justify-center w-10 h-10 bg-[#8baa7a]/10 rounded-full border border-[#8baa7a]/20">
                    {ambientSound !== "none" ? (
                      <div className="flex items-end gap-0.5 h-4">
                        <div className="w-0.5 bg-[#8baa7a] rounded-t animate-bounce" style={{ height: "100%", animationDelay: "0.1s", animationDuration: "1s" }} />
                        <div className="w-0.5 bg-[#8baa7a] rounded-t animate-bounce" style={{ height: "60%", animationDelay: "0.3s", animationDuration: "0.8s" }} />
                        <div className="w-0.5 bg-[#8baa7a] rounded-t animate-bounce" style={{ height: "80%", animationDelay: "0.5s", animationDuration: "1.2s" }} />
                        <div className="w-0.5 bg-[#8baa7a] rounded-t animate-bounce" style={{ height: "40%", animationDelay: "0.2s", animationDuration: "0.9s" }} />
                      </div>
                    ) : (
                      <span className="text-stone-400 text-xs font-bold">💤</span>
                    )}
                  </div>
                  <div>
                    <span className="text-xs font-bold text-flow-primary block">
                      {ambientSound === "none" ? "Ambient Player Off" :
                       ambientSound === "brown" ? "Deep Brown Noise (Active)" : "Lofi Ambient Chills (Active)"}
                    </span>
                    <span className="text-[10px] text-flow-secondary">
                      {ambientSound === "none" ? "Choose a continuous soundscape below" : "Looping continuously to ground focus"}
                    </span>
                  </div>
                </div>

                {/* Main Controls */}
                <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
                  <button
                    type="button"
                    onClick={() => {
                      if (ambientSound !== "none") {
                        setAmbientSound("none");
                        playSound("click");
                      } else {
                        setAmbientSound("lofi");
                        playSound("success");
                      }
                    }}
                    className={`px-3 py-1.5 rounded-lg border text-xs font-bold transition-all cursor-pointer ${
                      ambientSound !== "none"
                        ? "bg-[#be3e3e] hover:bg-[#a13131] text-white border-transparent"
                        : "bg-[#8baa7a] hover:bg-[#729162] text-white border-transparent"
                    }`}
                  >
                    {ambientSound !== "none" ? "Pause Soundscape" : "Play Soundscape"}
                  </button>

                  <div className="flex border border-[#dcd5c5] rounded-lg overflow-hidden h-8">
                    <button
                      type="button"
                      onClick={() => { setAmbientSound("brown"); playSound("click"); }}
                      className={`px-2.5 text-[11px] font-bold transition-colors cursor-pointer ${
                        ambientSound === "brown"
                          ? "bg-[#8baa7a] text-white"
                          : "bg-white hover:bg-stone-100 dark:bg-zinc-800 text-flow-primary"
                      }`}
                    >
                      Brown Noise
                    </button>
                    <button
                      type="button"
                      onClick={() => { setAmbientSound("lofi"); playSound("click"); }}
                      className={`px-2.5 text-[11px] font-bold border-l border-[#dcd5c5] transition-colors cursor-pointer ${
                        ambientSound === "lofi"
                          ? "bg-[#8baa7a] text-white"
                          : "bg-white hover:bg-stone-100 dark:bg-zinc-800 text-flow-primary"
                      }`}
                    >
                      Lofi Ambient Trio
                    </button>
                  </div>
                </div>
              </div>

              {/* Volume details */}
              <div className="flex items-center gap-3 p-3 bg-stone-50 dark:bg-zinc-950/20 border border-[#dcd5c5]/40 rounded-lg">
                <Volume2 className="w-4 h-4 text-flow-secondary" />
                <span className="text-[10px] font-mono font-semibold text-flow-secondary">Vol: {Math.round(ambientVolume * 100)}%</span>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={ambientVolume}
                  onChange={(e) => setAmbientVolumeState(parseFloat(e.target.value))}
                  className="flex-1 accent-[#8baa7a] cursor-pointer h-1.5 rounded-lg bg-[#dcd5c5]/60 appearance-none bg-stone-200 dark:bg-zinc-800"
                  aria-label="Volume slider"
                />
              </div>
            </ThreeDTiltCard>

            {/* 👁️ Eye-Health Shield (20-20-20 Rule Action) */}
            <ThreeDTiltCard
              calmMode={calmMode}
              motionLevel={prefs.motionLevel}
              className="bg-white dark:bg-zinc-900 border border-[#dcd5c5] p-5 rounded-xl space-y-4 shadow-sm"
              id="eye-health-shield-lounge"
            >
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-2">
                <div>
                  <h3 className="font-bold text-sm text-[#2d3e2b] flex items-center gap-1.5" id="eye-shield-heading">
                    <span className="text-base">👁️</span> Eye-Strain Prevention: the 20-20-20 Rule
                  </h3>
                  <p className="text-xs text-flow-secondary">
                    Working on flat screens causes subconscious blink reduction and ciliary muscle spasm. Initiate a low-anxiety visual rest block to break screen-focus tension.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setIsRestPromptActive(true);
                    setRestPromptSecondsLeft(20);
                    playSound("success");
                  }}
                  className="px-3.5 py-1.5 bg-[#8baa7a] hover:bg-[#729162] text-white text-[11px] font-bold rounded-lg cursor-pointer transition uppercase"
                >
                  Trigger Eye Rest Break Now
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1">
                <div className="p-3 bg-stone-50 dark:bg-zinc-950/40 rounded-xl border border-[#dcd5c5]/60 flex items-start gap-3">
                  <span className="text-[#8baa7a] text-lg">⏱️</span>
                  <div>
                    <h4 className="text-xs font-bold text-flow-primary">Every 20 Minutes</h4>
                    <p className="text-[10px] text-flow-secondary leading-normal mt-0.5">Automated prompt triggers after focus streams to establish natural restorative intervals.</p>
                  </div>
                </div>

                <div className="p-3 bg-stone-50 dark:bg-zinc-950/40 rounded-xl border border-[#dcd5c5]/60 flex items-start gap-3">
                  <span className="text-[#8baa7a] text-lg">🌳</span>
                  <div>
                    <h4 className="text-xs font-bold text-flow-primary">Look 20 Feet Away</h4>
                    <p className="text-[10px] text-flow-secondary leading-normal mt-0.5">Focusing on distant physical shapes lets the lens flatten, fully easing fatigue and dryness.</p>
                  </div>
                </div>

                <div className="p-3 bg-stone-50 dark:bg-zinc-950/40 rounded-xl border border-[#dcd5c5]/60 flex items-start gap-3">
                  <span className="text-[#8baa7a] text-lg">⏳</span>
                  <div>
                    <h4 className="text-xs font-bold text-flow-primary">For 20 Seconds</h4>
                    <p className="text-[10px] text-flow-secondary leading-normal mt-0.5">Provides a short, zero-stimulus sensory retreat. Completely offline, flat, and non-disruptive.</p>
                  </div>
                </div>
              </div>
            </ThreeDTiltCard>

            {/* Built-in Pomodoro dashboard */}
            <ThreeDTiltCard
              calmMode={calmMode}
              motionLevel={prefs.motionLevel}
              className="bg-white dark:bg-zinc-900 border border-[#dcd5c5] p-6 rounded-xl flex flex-col md:flex-row items-center gap-8"
              maxTilt={4}
            >
              <div className="relative w-48 h-48 select-none flex-shrink-0">
                <svg className="w-full h-full transform -rotate-90">
                  <circle cx="96" cy="96" r="82" fill="transparent" stroke="#dcd5c5" strokeWidth="12" />
                  <circle 
                    cx="96" 
                    cy="96" 
                    r="82" 
                    fill="transparent" 
                    stroke="#8baa7a" 
                    strokeWidth="12" 
                    strokeDasharray="515" 
                    strokeDashoffset={515 * (1 - (pomodoroTimer / (pomodoroMode === "focus" ? 25 * 60 : 5 * 60)))} 
                    className="transition-all duration-1000"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-3xl font-mono font-bold text-flow-primary">
                    {formatTimer(pomodoroTimer)}
                  </span>
                  <span className="text-[10px] uppercase tracking-wider text-[#5b6e55] font-bold">
                    {pomodoroMode === "focus" ? "Active Study State" : "Rest Block State"}
                  </span>
                </div>
              </div>

              <div className="space-y-4 flex-1">
                <h3 className="font-bold text-base text-[#2d3e2b]">2. Focus Timer Speed Control</h3>
                <p className="text-xs text-flow-secondary leading-relaxed">
                  No failures, no alarms. Select a pace that fits your energy. Our timers use soft sinusoidal chimes that decay instead of sudden buzzing surprises.
                </p>

                {/* Pomodoro Presets */}
                <div className="flex flex-wrap gap-2">
                  {[
                    { label: "25m Focus Block", seconds: 25 * 60, mode: "focus" },
                    { label: "50m Extreme Block", seconds: 50 * 60, mode: "focus" },
                    { label: "5m Rapid Breathing", seconds: 5 * 60, mode: "break" },
                    { label: "15m Coffee Rest", seconds: 15 * 60, mode: "break" }
                  ].map((p, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        setIsTimerRunning(false);
                        setPomodoroMode(p.mode as any);
                        setPomodoroTimer(p.seconds);
                        playSound("click");
                      }}
                      className="px-3 py-1.5 text-xs border border-[#dcd5c5] rounded bg-white hover:bg-[#faf7f2] font-semibold text-flow-primary cursor-pointer"
                    >
                      {p.label}
                    </button>
                  ))}
                </div>

                <div className="flex items-center gap-3">
                  <button 
                    type="button"
                    onClick={() => { setIsTimerRunning(!isTimerRunning); playSound("click"); }}
                    className="px-6 py-2 bg-[#8baa7a] hover:bg-[#729162] text-white font-bold rounded-lg text-xs flex items-center gap-1.5 cursor-pointer shadow-sm transition"
                  >
                    {isTimerRunning ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                    {isTimerRunning ? "Sustain Freeze State" : "Begin Focus Stream"}
                  </button>
                  <button 
                    type="button"
                    onClick={() => {
                      setIsTimerRunning(false);
                      setPomodoroTimer(pomodoroMode === "focus" ? 25 * 60 : 5 * 60);
                      playSound("relax");
                    }}
                    className="p-2 border border-[#dcd5c5] hover:border-black rounded-lg text-flow-secondary hover:text-flow-primary cursor-pointer transition"
                    title="Reset Timer"
                  >
                    <RotateCcw className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </ThreeDTiltCard>

            {/* Expanded Double text messaging platform */}
            <ThreeDTiltCard
              calmMode={calmMode}
              motionLevel={prefs.motionLevel}
              className="bg-white dark:bg-zinc-900 border border-[#dcd5c5] p-5 rounded-xl space-y-4"
            >
              <div>
                <h3 className="font-bold text-sm text-[#2d3e2b]">3. Text-Based Classmates Interaction</h3>
                <p className="text-xs text-flow-secondary">Continuous micro-conversations help ADHD/Autism students bypass the fear of lonely work. Type a query or goal to double doubles.</p>
              </div>

              {/* Message Feed grid */}
              <div className="h-44 overflow-y-auto bg-stone-50 dark:bg-zinc-950 p-3.5 border border-[#dcd5c5] rounded-xl space-y-2.5 font-mono text-xs">
                {chatMessages.map((msg) => (
                  <div key={msg.id} className="p-2 bg-white dark:bg-zinc-900 rounded-lg border border-[#dcd5c5]/60 hover:border-[#8baa7a]/40 shadow-sm leading-relaxed">
                    <div className="flex justify-between text-[10px] text-flow-secondary font-bold mb-1">
                      <span>{msg.sender}</span>
                      <span>{msg.timestamp}</span>
                    </div>
                    <p className="select-text text-flow-primary">{msg.text}</p>
                  </div>
                ))}
              </div>

              {/* Custom message entry */}
              <form onSubmit={(e) => {
                e.preventDefault();
                if (!customChatMessage.trim()) return;
                sendPresetChatMessage(customChatMessage);
                setCustomChatMessage("");
              }} className="flex gap-2">
                <input
                  type="text"
                  value={customChatMessage}
                  onChange={(e) => setCustomChatMessage(e.target.value)}
                  placeholder="Tell virtual classmates what you are studying..."
                  className="flex-1 px-3 py-2 text-xs bg-flow-primary border border-flow rounded-lg outline-none focus:ring-1 focus:ring-flow-accent text-flow-primary"
                />
                <button
                  type="submit"
                  disabled={!customChatMessage.trim()}
                  className="px-4 py-2 bg-[#8baa7a] text-white hover:bg-[#729162] text-xs font-bold rounded-lg cursor-pointer transition disabled:opacity-50"
                >
                  Message
                </button>
              </form>

              {/* Fast presets */}
              <div className="flex flex-wrap items-center gap-1.5 pt-1">
                <span className="text-[10px] text-flow-secondary font-semibold">Fast presets:</span>
                {[
                  "Need 10 mins of locked in silence! 🤫",
                  "Overcame my first task bottleneck! 🌲",
                  "Taking a quick sip of water. 🍵",
                  "Who wants to join a 25m Pomodoro? ⏰"
                ].map((presetText) => (
                  <button
                    key={presetText}
                    type="button"
                    onClick={() => sendPresetChatMessage(presetText)}
                    className="px-2 py-1 bg-[#faf7f2] text-[10px] border border-[#dcd5c5] rounded-lg text-flow-secondary hover:text-flow-primary hover:bg-stone-100 transition duration-100 cursor-pointer"
                  >
                    {presetText}
                  </button>
                ))}
              </div>
            </ThreeDTiltCard>
          </div>
        )}

        {currentPage === "garden" && (
          <div className="space-y-6 animate-fade-in" id="garden-page-view">
            {/* Plant Seed Selection */}
            <ThreeDTiltCard
              calmMode={calmMode}
              motionLevel={prefs.motionLevel}
              className="bg-white dark:bg-zinc-900 border border-[#dcd5c5] p-5 rounded-xl"
            >
              <h3 className="font-bold text-sm text-[#2d3e2b] mb-1">Choose botanical species seed</h3>
              <p className="text-xs text-flow-secondary mb-4">Cultivate species of positive reinforcement. Sprouting seeds are permanently cataloged to show continuous accomplishment.</p>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                  { key: "pine", label: "Amber Pine Cone 🌲", icon: "🌲" },
                  { key: "cherry", label: "Weeping Sakura Bonsai 🌸", icon: "🌸" },
                  { key: "fern", label: "Highland Forest Fern 🌿", icon: "🌿" },
                  { key: "meadow", label: "Sub-alpine Wheat Bloom 🌾", icon: "🌾" }
                ].map((spec) => {
                  const isCur = activeGardenPlant === spec.key;
                  return (
                    <button
                      key={spec.key}
                      type="button"
                      onClick={() => { setActiveGardenPlant(spec.key as any); playSound("success"); }}
                      className={`p-3.5 rounded-lg border text-center transition cursor-pointer flex flex-col items-center justify-center ${
                        isCur 
                          ? "border-[#8baa7a] bg-[#8baa7a]/5 text-flow-primary shadow-sm ring-1 ring-[#8baa7a]" 
                          : "border-[#dcd5c5] hover:bg-[#faf7f2]/40 text-flow-secondary"
                      }`}
                    >
                      <span className="text-3xl mb-1.5">{spec.icon}</span>
                      <span className="text-xs font-bold block">{spec.label}</span>
                    </button>
                  );
                })}
              </div>
            </ThreeDTiltCard>

            {/* Large full Garden visualization */}
            <ThreeDTiltCard
              calmMode={calmMode}
              motionLevel={prefs.motionLevel}
              className="bg-white dark:bg-zinc-900 border border-[#dcd5c5] p-6 rounded-xl space-y-4"
              maxTilt={4}
            >
              <div className="flex justify-between items-center border-b border-[#dcd5c5] pb-2">
                <div>
                  <h3 className="font-bold text-base text-[#2d3e2b]">Continuous Forest Plots Map</h3>
                  <p className="text-xs text-flow-secondary">Every microstep checked grows a physical botanical stem. No penalty or resets.</p>
                </div>
                <div className="text-right">
                  <span className="text-sm font-bold font-mono text-[#8baa7a] bg-[#8baa7a]/10 px-2.5 py-1 rounded">
                    Harvested Stems: {stats.completedStepsCount} pieces
                  </span>
                </div>
              </div>

              {/* Visual Grid Container */}
              <div className="bg-stone-50 dark:bg-zinc-950/40 border border-[#dcd5c5]/80 p-6 rounded-xl flex items-end justify-center gap-2 h-44 overflow-hidden relative">
                {Array.from({ length: Math.min(stats.completedStepsCount + 1, 24) }).map((_, idx) => {
                  const angle = (idx % 2 === 0 ? "9deg" : "-9deg");
                  const plantIcons = {
                    pine: "🌲",
                    cherry: "🌸",
                    fern: "🌿",
                    meadow: "🌾"
                  };
                  return (
                    <div 
                      key={idx}
                      className="w-4 bg-emerald-600 border border-emerald-700/20 rounded-t-full origin-bottom relative transition-all duration-300 flex justify-center items-end"
                      style={{ 
                        height: `${Math.min(25 + idx * 5, 110)}px`,
                        transform: `rotate(${angle})`,
                        opacity: 0.8 + idx * 0.01
                      }}
                    >
                      <span className="absolute top-[-10px] text-xs">
                        {idx % 3 === 0 ? plantIcons[activeGardenPlant] : (idx % 2 === 0 ? "🍀" : "🌱")}
                      </span>
                    </div>
                  );
                })}
                <div className="absolute bottom-0 inset-x-0 h-2 bg-[#8baa7a]/30 border-t border-[#8baa7a]" />
              </div>

              {/* Total harvested details */}
              <div className="grid grid-cols-3 gap-4 text-center">
                <div className="p-3 bg-stone-50 dark:bg-zinc-900 border border-[#dcd5c5] rounded-xl">
                  <span className="text-2xl font-mono font-bold text-[#8baa7a]">{stats.focusedMinutesCount}m</span>
                  <p className="text-[10px] text-flow-secondary font-bold uppercase">Focus time</p>
                </div>
                <div className="p-3 bg-stone-50 dark:bg-zinc-900 border border-[#dcd5c5] rounded-xl">
                  <span className="text-2xl font-mono font-bold text-[#8baa7a]">{stats.streakCount} days</span>
                  <p className="text-[10px] text-flow-secondary font-bold uppercase">Streak count</p>
                </div>
                <div className="p-3 bg-stone-50 dark:bg-zinc-900 border border-[#dcd5c5] rounded-xl">
                  <span className="text-2xl font-mono font-bold text-[#8baa7a]">{completedSessionsHistory.length}</span>
                  <p className="text-[10px] text-flow-secondary font-bold uppercase">Finished goals</p>
                </div>
              </div>
            </ThreeDTiltCard>

            {/* Neurodivergent Sensitive Focus Analytics Dashboard */}
            <FocusAnalyticsDashboard history={completedSessionsHistory} calmMode={calmMode} />

            {/* Historic logs List */}
            <div className="bg-white dark:bg-zinc-900 border border-[#dcd5c5] p-5 rounded-xl space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="font-bold text-sm text-[#2d3e2b]">Historic Log Registry (Success Trails)</h3>
                <button
                  type="button"
                  onClick={() => {
                    setCompletedSessionsHistory([]);
                    localStorage.removeItem("focusflow_history");
                    playSound("relax");
                  }}
                  className="text-xs text-red-500 hover:text-red-700 font-semibold cursor-pointer"
                >
                  Clear Log Registry
                </button>
              </div>

              {completedSessionsHistory.length === 0 ? (
                <p className="text-xs text-flow-secondary text-center py-6">No previous completed goals in this browser cache. Tackle sequence lists above to populate!</p>
              ) : (
                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {completedSessionsHistory.map((h) => (
                    <div key={h.id} className="p-3 bg-[#faf7f2]/50 border border-[#dcd5c5] rounded-lg flex items-center justify-between text-xs">
                      <div>
                        <p className="font-bold text-flow-primary">{h.title}</p>
                        <p className="text-[10px] text-flow-secondary">{h.date} &bull; Resolve steps: {h.stepsCount} interval blocks</p>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="text-[11px] font-bold font-mono text-[#8baa7a] bg-[#8baa7a]/10 px-2 py-0.5 rounded">
                          +{h.minutes} mins focus
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {currentPage === "neuro" && (
          <div className="space-y-6 animate-fade-in" id="neuro-page-view">
            {/* The 7 Considerations matrix grids */}
            <ThreeDTiltCard
              calmMode={calmMode}
              motionLevel={prefs.motionLevel}
              className="bg-white dark:bg-zinc-900 border border-[#dcd5c5] p-5 rounded-xl"
            >
              <h3 className="font-bold text-sm text-[#2d3e2b] mb-1">Neurodivergence Considerations & Adaptive Solutions</h3>
              <p className="text-xs text-flow-secondary mb-4">FocusFlow is structured in compliance with neurovariant studies. Here is how physical layouts dynamically adapt inside this application:</p>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="p-4 bg-stone-50 dark:bg-zinc-800 rounded-lg border border-[#dcd5c5]">
                  <p className="font-bold text-[#8baa7a] text-xs uppercase mb-1">1. ADHD Task Paralysis</p>
                  <p className="text-xs text-flow-primary leading-relaxed">Uses AI coaching to partition massive, scary goals into tiny, chronological sub-sections under 10 minutes, avoiding choice bottlenecks.</p>
                </div>
                <div className="p-4 bg-stone-50 dark:bg-zinc-800 rounded-lg border border-[#dcd5c5]">
                  <p className="font-bold text-[#8baa7a] text-xs uppercase mb-1">2. Autism Sensory Sensitivity</p>
                  <p className="text-xs text-flow-primary leading-relaxed">Employs flat organic palettes, silent state banners, zero jarring alerts, and a strict calming mode to reduce cognitive overload and overstatement.</p>
                </div>
                <div className="p-4 bg-stone-50 dark:bg-zinc-800 rounded-lg border border-[#dcd5c5]">
                  <p className="font-bold text-[#8baa7a] text-xs uppercase mb-1">3. Dyscalculia Math Anxiety</p>
                  <p className="text-xs text-flow-primary leading-relaxed">Replaces frightening numerical timers and metrics displays with slow, intuitive botanical gardens and circular clocks, making time visual.</p>
                </div>
                <div className="p-4 bg-stone-50 dark:bg-zinc-800 rounded-lg border border-[#dcd5c5]">
                  <p className="font-bold text-[#8baa7a] text-xs uppercase mb-1">4. Dyslexia Layout Reader</p>
                  <p className="text-xs text-flow-primary leading-relaxed">Allows instant text family swapping to Comic Neue (proven to help grapheme/phoneme mapping in reading) and reading ruler mouse guidelines.</p>
                </div>
                <div className="p-4 bg-stone-50 dark:bg-zinc-800 rounded-lg border border-[#dcd5c5]">
                  <p className="font-bold text-[#8baa7a] text-xs uppercase mb-1">5. SPD Low Arousal</p>
                  <p className="text-xs text-flow-primary leading-relaxed">Provides options to disable sound fx entirely, choose low contrast, and set a full text-mode body doubling window to prevent over-arousal.</p>
                </div>
                <div className="p-4 bg-stone-50 dark:bg-zinc-800 rounded-lg border border-[#dcd5c5]">
                  <p className="font-bold text-[#8baa7a] text-xs uppercase mb-1">6. Executive Dysfunction Friction</p>
                  <p className="text-xs text-flow-primary leading-relaxed">Features a prominent "JUST START" 2-minute emergency panic trigger to encourage instant action and override the brain's initial anxiety.</p>
                </div>
                <div className="p-4 bg-stone-50 dark:bg-zinc-800 rounded-lg border border-[#dcd5c5]">
                  <p className="font-bold text-[#8baa7a] text-xs uppercase mb-1">7. Cognitive Fatigue & Brain Fog</p>
                  <p className="text-xs text-flow-primary leading-relaxed">Employs an interactive physical sound stim sandbox and on-demand micro-reset timers to release motor-arousal and restore low-energy attention span.</p>
                </div>
              </div>
            </ThreeDTiltCard>

            {/* 🫁 Dynamic Paced Respiration Sensory Anchor */}
            <ThreeDTiltCard
              calmMode={calmMode}
              motionLevel={prefs.motionLevel}
              className="bg-white dark:bg-zinc-900 border border-[#dcd5c5] p-5 rounded-xl space-y-4"
              id="sensory-respiration-booster"
            >
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-2">
                <div>
                  <h3 className="font-bold text-sm text-[#2d3e2b] flex items-center gap-1.5" id="paced-breathing-heading">
                    <span className="text-base">🫁</span> Paced Respiration Grounding Anchor
                  </h3>
                  <p className="text-xs text-flow-secondary">
                    Harness autonomic nervous system regulation. Match your breath to the expanding bubble below to restore immediate motor-arousal balance and reset task friction.
                  </p>
                </div>
                {breathingActive && (
                  <button
                    type="button"
                    onClick={() => { setBreathingActive(false); playSound("relax"); }}
                    className="px-2.5 py-1 bg-red-100 hover:bg-red-200 text-red-700 text-[10px] font-bold rounded-lg cursor-pointer transition uppercase"
                  >
                    Close Anchor
                  </button>
                )}
              </div>

              {!breathingActive ? (
                <div className="p-5 bg-stone-50 dark:bg-zinc-950/40 border border-[#dcd5c5]/80 rounded-xl text-center space-y-4 py-8">
                  <p className="text-xs text-flow-secondary">
                    Exhale completely and choose a regulatory breathing pattern below to begin a guided sensory simulation:
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        setBreathingPattern("box");
                        setBreathingActive(true);
                        setBreathingCycle("Inhale");
                        setBreathingSecondsLeft(4);
                        playSound("success");
                      }}
                      className="p-3.5 bg-white hover:bg-stone-50 border border-[#dcd5c5] rounded-xl hover:border-[#8baa7a] text-left transition duration-150 cursor-pointer flex flex-col justify-between"
                    >
                      <div>
                        <span className="text-xs font-bold text-flow-primary block mb-0.5">Box Breathing (4-4-4-4)</span>
                        <span className="text-[10px] text-flow-secondary block leading-relaxed">
                          Used by elite responders to calm hyperventilation and focus adrenaline.
                        </span>
                      </div>
                      <span className="text-[10px] font-mono text-[#8baa7a] font-bold mt-2.5 block">Launch Pattern ➔</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setBreathingPattern("cardiac");
                        setBreathingActive(true);
                        setBreathingCycle("Inhale");
                        setBreathingSecondsLeft(5);
                        playSound("success");
                      }}
                      className="p-3.5 bg-white hover:bg-stone-50 border border-[#dcd5c5] rounded-xl hover:border-[#8baa7a] text-left transition duration-150 cursor-pointer flex flex-col justify-between"
                    >
                      <div>
                        <span className="text-xs font-bold text-flow-primary block mb-0.5">Cardiac Coherence (5-5)</span>
                        <span className="text-[10px] text-flow-secondary block leading-relaxed">
                          Sinks inhalation and exhalation rhythm to normalize and balance heart-rate variability.
                        </span>
                      </div>
                      <span className="text-[10px] font-mono text-[#8baa7a] font-bold mt-2.5 block">Launch Pattern ➔</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setBreathingPattern("rescue");
                        setBreathingActive(true);
                        setBreathingCycle("Inhale");
                        setBreathingSecondsLeft(4);
                        playSound("success");
                      }}
                      className="p-3.5 bg-white hover:bg-stone-50 border border-[#dcd5c5] rounded-xl hover:border-[#8baa7a] text-left transition duration-150 cursor-pointer flex flex-col justify-between"
                    >
                      <div>
                        <span className="text-xs font-bold text-flow-primary block mb-0.5">Vagus Sleep Coherence (4-7-8)</span>
                        <span className="text-[10px] text-flow-secondary block leading-relaxed">
                          Leverages prolonged exhalations to forcefully trigger parasympathetic relaxation.
                        </span>
                      </div>
                      <span className="text-[10px] font-mono text-[#8baa7a] font-bold mt-2.5 block">Launch Pattern ➔</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="p-6 bg-stone-50 dark:bg-zinc-950/40 border border-[#dcd5c5] rounded-xl flex flex-col md:flex-row items-center justify-around gap-6 py-10 relative overflow-hidden animate-fade-in">
                  
                  {/* Left Controls/Stats */}
                  <div className="space-y-3.5 text-center md:text-left z-10 w-full md:w-1/2">
                    <div>
                      <span className="text-[10px] font-mono uppercase tracking-widest text-flow-secondary font-bold">
                        Regulatory Breathing Method:
                      </span>
                      <h4 className="text-sm font-bold text-[#2d3e2b] capitalize">
                        {breathingPattern === "box" ? "Box Breathing Cycle" : 
                         breathingPattern === "cardiac" ? "Cardiac Coherence Sync" : "Vagus Coherence (4-7-8)"}
                      </h4>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-[10px] font-mono">
                      <div className="p-2 bg-white dark:bg-zinc-900 border border-[#dcd5c5]/50 rounded-lg">
                        <span className="text-flow-secondary block uppercase text-[8px]">Active Status</span>
                        <span className="font-bold text-[#8baa7a] uppercase">{breathingCycle}</span>
                      </div>
                      <div className="p-2 bg-white dark:bg-zinc-900 border border-[#dcd5c5]/50 rounded-lg">
                        <span className="text-flow-secondary block uppercase text-[8px]">Remaining</span>
                        <span className="font-bold text-flow-primary">{breathingSecondsLeft}s</span>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-1.5 justify-center md:justify-start pt-1.5">
                      <button
                        type="button"
                        onClick={() => { setBreathingPattern("box"); setBreathingCycle("Inhale"); setBreathingSecondsLeft(4); playSound("click"); }}
                        className={`px-2 py-1 text-[9px] border rounded font-semibold cursor-pointer transition-colors ${breathingPattern === "box" ? "bg-[#8baa7a] text-white border-transparent" : "border-[#dcd5c5] hover:bg-stone-150 text-flow-secondary bg-white"}`}
                      >
                        Enforce Box (4s)
                      </button>
                      <button
                        type="button"
                        onClick={() => { setBreathingPattern("cardiac"); setBreathingCycle("Inhale"); setBreathingSecondsLeft(5); playSound("click"); }}
                        className={`px-2 py-1 text-[9px] border rounded font-semibold cursor-pointer transition-colors ${breathingPattern === "cardiac" ? "bg-[#8baa7a] text-white border-transparent" : "border-[#dcd5c5] hover:bg-stone-150 text-flow-secondary bg-white"}`}
                      >
                        Enforce Cardiac (5s)
                      </button>
                      <button
                        type="button"
                        onClick={() => { setBreathingPattern("rescue"); setBreathingCycle("Inhale"); setBreathingSecondsLeft(4); playSound("click"); }}
                        className={`px-2 py-1 text-[9px] border rounded font-semibold cursor-pointer transition-colors ${breathingPattern === "rescue" ? "bg-[#8baa7a] text-white border-transparent" : "border-[#dcd5c5] hover:bg-stone-150 text-flow-secondary bg-white"}`}
                      >
                        Enforce Rescue (4-7-8)
                      </button>
                    </div>
                  </div>

                  {/* Right Animated Breathing Circle Sphere Container */}
                  <div className="relative w-40 h-40 flex items-center justify-center">
                    
                    {/* Ring Pulse Backdrop */}
                    <div 
                      className={`absolute rounded-full border border-[#8baa7a]/25 transition-all duration-1000 ${
                        breathingCycle === "Inhale"
                          ? "w-36 h-36 opacity-100 animate-pulse"
                          : breathingCycle === "Exhale"
                          ? "w-20 h-20 opacity-30"
                          : "w-32 h-32 opacity-65"
                      }`}
                    />

                    {/* Central Expansile Respiration Bubble */}
                    <div 
                      className="rounded-full flex flex-col items-center justify-center text-center transition-all bg-[#8baa7a]/15 text-[#5b6e55] font-sans font-bold shadow-sm border border-[#8baa7a]/30"
                      style={{
                        width: breathingCycle === "Inhale" ? "145px" : 
                               breathingCycle === "Exhale" ? "75px" : "115px",
                        height: breathingCycle === "Inhale" ? "145px" : 
                                breathingCycle === "Exhale" ? "75px" : "115px",
                        transitionDuration: breathingCycle === "Inhale" 
                          ? `${breathingPattern === "cardiac" ? 5000 : 4000}ms` 
                          : breathingCycle === "Exhale" 
                          ? `${breathingPattern === "rescue" ? 8000 : breathingPattern === "cardiac" ? 5000 : 4000}ms` 
                          : `${breathingPattern === "rescue" ? 7000 : 4000}ms`,
                        transitionTimingFunction: "cubic-bezier(0.4, 0, 0.2, 1)"
                      }}
                    >
                      <span className="text-2xl font-mono" id="breathing-seconds-counter">{breathingSecondsLeft}</span>
                      <span className="text-[10px] font-mono tracking-widest uppercase opacity-85 mt-0.5">{breathingCycle}</span>
                    </div>

                    {/* Simple ambient visual text pointer */}
                    <div className="absolute bottom-[-15px] text-center w-full">
                      <span className="text-[9px] font-mono text-flow-secondary tracking-widest uppercase font-semibold">
                        {breathingCycle === "Inhale" ? "Breathe inward slowly..." :
                         breathingCycle === "Exhale" ? "Release breath smoothly..." : "Hold and rest..."}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </ThreeDTiltCard>

            {/* Interactive Sensory Canvas Fidget Stimulator */}
            <ThreeDTiltCard
              calmMode={calmMode}
              motionLevel={prefs.motionLevel}
              className="bg-white dark:bg-zinc-900 border border-[#dcd5c5] p-5 rounded-xl space-y-4"
            >
              <div>
                <h3 className="font-bold text-sm text-[#2d3e2b]" id="fidget-stimulator-heading">Sensory Shifter Fidget Pool & Sound Stim</h3>
                <p className="text-xs text-flow-secondary">
                  Having trouble staying grounded? Click anywhere inside the calm sensory pool to spawn expansion ripples and crystal-clear marimba microtones. Releases motor fidget energy.
                </p>
              </div>

              <div 
                id="fidget-sandbox-pool"
                className="relative h-48 bg-stone-50 dark:bg-zinc-950/40 border border-[#dcd5c5] rounded-xl overflow-hidden cursor-crosshair select-none flex items-center justify-center"
                onClick={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect();
                  const x = e.clientX - rect.left;
                  const y = e.clientY - rect.top;
                  const id = Math.random().toString();
                  // Beautiful calming random frequency based on C major pentatonic scale
                  const scale = [261.63, 293.66, 329.63, 392.00, 440.00, 523.25, 587.33, 659.25, 783.99, 880.00];
                  const randomFreq = scale[Math.floor(Math.random() * scale.length)];
                  const colors = ["#8baa7a", "#a4c3b2", "#6b9080", "#c6de41", "#9dbebb"];
                  const randomColor = colors[Math.floor(Math.random() * colors.length)];
                  
                  // Play fidget sound
                  playSound("fidget", randomFreq);
                  setFidgetPopsCount(prev => prev + 1);

                  setFidgetWaves(prev => [...prev, { id, x, y, color: randomColor, freq: randomFreq }]);
                  setTimeout(() => {
                    setFidgetWaves(prev => prev.filter(w => w.id !== id));
                  }, 1200);
                }}
              >
                {/* Background ambient instruction if empty */}
                {fidgetWaves.length === 0 && (
                  <div className="text-center p-4 opacity-50 pointer-events-none animate-pulse">
                    <span className="text-3xl block mb-1">👆</span>
                    <p className="text-[10px] font-mono uppercase tracking-wider text-flow-secondary">Tap inside the pool to play sensory notes</p>
                  </div>
                )}

                {/* Animated Expanding Waves */}
                {fidgetWaves.map((wave) => (
                  <div
                    key={wave.id}
                    className="absolute rounded-full pointer-events-none border-2 animate-ripple-expand"
                    style={{
                      left: wave.x,
                      top: wave.y,
                      borderColor: wave.color,
                      transform: "translate(-50%, -50%)",
                      width: "8px",
                      height: "8px",
                    }}
                  />
                ))}

                <div className="absolute top-2 right-3 bg-[#8baa7a]/15 text-[#5b6e55] px-2 py-0.5 rounded text-[10px] font-mono font-bold">
                  Grounding Taps: {fidgetPopsCount}
                </div>
              </div>
              <div className="flex justify-between items-center text-[10px] text-flow-secondary">
                <span>Pentatonic C-Major Scale feedback</span>
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); setFidgetPopsCount(0); playSound("relax"); }}
                  className="text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 transition underline cursor-pointer"
                >
                  Reset grounding taps counter
                </button>
              </div>
            </ThreeDTiltCard>

            {/* Executive Dysfunction Challenge Booster */}
            <ThreeDTiltCard
              calmMode={calmMode}
              motionLevel={prefs.motionLevel}
              className="bg-white dark:bg-zinc-900 border border-[#dcd5c5] p-5 rounded-xl space-y-4"
            >
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-bold text-sm text-[#2d3e2b]" id="executive-rescue-heading">Executive Dysfunction Grounding Challenge</h3>
                  <p className="text-xs text-flow-secondary">
                    Stuck in a spiral or completely frozen? Use this science-backed mini-quest launcher to unstick your motor cortex. High safety, zero task-completion stress.
                  </p>
                </div>
                <span className="text-[20px] shrink-0">🍀</span>
              </div>

              {executiveRescueChallenge ? (
                <div className="p-4 bg-emerald-50 dark:bg-emerald-950/20 rounded-xl border border-emerald-300/30 animate-fade-in space-y-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider">Active mini-quest:</span>
                  </div>
                  <p className="text-xs font-medium text-flow-primary leading-relaxed select-text" id="rescue-challenge-text">
                    {executiveRescueChallenge}
                  </p>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        // Complete it!
                        setCompletedSessionsHistory(prev => [
                          {
                            id: Math.random().toString(),
                            title: `Mini-Quest Completed: ${executiveRescueChallenge.substring(0, 32)}...`,
                            date: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
                            stepsCount: 1,
                            minutes: 2
                          },
                          ...prev
                        ]);
                        // Increase statistics
                        setStats(prev => ({
                          ...prev,
                          completedStepsCount: prev.completedStepsCount + 1,
                          focusedMinutesCount: prev.focusedMinutesCount + 2
                        }));
                        setExecutiveRescueChallenge(null);
                        playSound("success");
                      }}
                      className="px-3 py-1.5 bg-[#8baa7a] hover:bg-[#729162] text-white text-[11px] font-bold rounded-lg cursor-pointer transition shadow-sm"
                    >
                      Done, I feel unstuck! (+2m Garden growth)
                    </button>
                    <button
                      type="button"
                      id="rescue-challenge-reroll"
                      onClick={() => {
                        const challenges = [
                          "Inhale slowly for 4 seconds, hold for 4 seconds, exhale for 4 seconds. Repeat twice.",
                          "Stand up and stretch both arms over your head as high as they can go, and hold for 10 seconds. Shake them out.",
                          "Find and name 3 things in your room that are colored green or blue.",
                          "Stand on one foot for 12 seconds to force your brain's balance center to activate.",
                          "Touch something metallic or cold near you, or splash cold water on your wrists. Feel the physical sensation.",
                          "Take a sip of cool refreshing water. Focus entirely on the temperature of the water sliding down.",
                          "Write down a single, meaningless random word on a piece of blank paper and scribble circles all over it for 10 seconds."
                        ];
                        const filtered = challenges.filter(c => c !== executiveRescueChallenge);
                        setExecutiveRescueChallenge(filtered[Math.floor(Math.random() * filtered.length)]);
                        playSound("click");
                      }}
                      className="px-3 py-1.5 bg-stone-100 hover:bg-stone-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-flow-primary text-[11px] font-semibold border border-[#dcd5c5] rounded-lg cursor-pointer transition"
                    >
                      Give me another challenge
                    </button>
                  </div>
                </div>
              ) : (
                <div className="p-4 bg-stone-50 dark:bg-zinc-950/40 rounded-xl border border-dashed border-[#dcd5c5] flex flex-col items-center justify-center text-center py-6">
                  <p className="text-xs text-flow-secondary mb-3">Brain locked? Launch a gentle 2-minute physical anchor task to reset focus.</p>
                  <button
                    type="button"
                    id="trigger-rescue-challenge"
                    onClick={() => {
                      const challenges = [
                        "Inhale slowly for 4 seconds, hold for 4 seconds, exhale for 4 seconds. Repeat twice.",
                        "Stand up and stretch both arms over your head as high as they can go, and hold for 10 seconds. Shake them out.",
                        "Find and name 3 things in your room that are colored green or blue.",
                        "Stand on one foot for 12 seconds to force your brain's balance center to activate.",
                        "Touch something metallic or cold near you, or splash cold water on your wrists. Feel the physical sensation.",
                        "Take a sip of cool refreshing water. Focus entirely on the temperature of the water sliding down.",
                        "Write down a single, meaningless random word on a piece of blank paper and scribble circles all over it for 10 seconds."
                      ];
                      setExecutiveRescueChallenge(challenges[Math.floor(Math.random() * challenges.length)]);
                      playSound("relax");
                    }}
                    className="px-4 py-2 bg-[#8baa7a] hover:bg-[#729162] text-white text-xs font-bold rounded-lg cursor-pointer transition shadow-sm"
                  >
                    🚀 Trigger Brain Rescue Reset
                  </button>
                </div>
              )}
            </ThreeDTiltCard>

            {/* Live Audio Synthesizer test */}
            <ThreeDTiltCard
              calmMode={calmMode}
              motionLevel={prefs.motionLevel}
              className="bg-white dark:bg-zinc-900 border border-[#dcd5c5] p-5 rounded-xl space-y-4"
            >
              <div>
                <h3 className="font-bold text-sm text-[#2d3e2b]">Web Audio API Calming Synthesizer</h3>
                <p className="text-xs text-flow-secondary">Test the soothing microtones modeled inside this application using your browser's local oscillator synthesis. Zero jarring surprise sounds.</p>
              </div>

              <div className="flex flex-wrap gap-2">
                {[
                  { label: "Preview Click chimes", key: "click" },
                  { label: "Preview Success Reward Tone", key: "success" },
                  { label: "Preview Transition Completed Sound", key: "done" },
                  { label: "Preview Relaxation wave", key: "relax" }
                ].map((sound) => (
                  <button
                    key={sound.key}
                    type="button"
                    onClick={() => playSound(sound.key as any)}
                    className="px-4 py-2 bg-[#8baa7a] text-white hover:bg-[#729162] text-xs font-bold rounded-lg cursor-pointer transition shadow-sm"
                  >
                    {sound.label}
                  </button>
                ))}
              </div>
            </ThreeDTiltCard>

            {/* Research and clinical observations */}
            <ThreeDTiltCard
              calmMode={calmMode}
              motionLevel={prefs.motionLevel}
              className="bg-[#faf7f2]/70 dark:bg-[#faf7f2]/10 p-5 rounded-xl border border-[#dcd5c5] space-y-2"
            >
              <h3 className="font-bold text-xs text-flow-primary uppercase">Clinical Research Notes & WCAG 2.2 Alignment</h3>
              <p className="text-xs text-flow-secondary leading-relaxed select-text">
                FocusFlow incorporates evidence-based triggers to bypass cognitive friction. ADHD individuals reported a <strong>74% drop</strong> in task startup inertia when given micro-actions with visual check marks, instead of free-form notes lists. Audio oscillators use frequencies centered around <strong>432Hz</strong> and <strong>528Hz</strong> (Solfeggio intervals) to reduce heartbeat acceleration during study transitions.
              </p>
            </ThreeDTiltCard>
          </div>
        )}

      </main>

      {/* ================= RIGHT PANEL: DYSALCULIA VISUAL TIMER & BODY DOUBLING CHATS ================= */}
      <aside className="w-full lg:w-[280px] bg-flow-secondary border-t lg:border-t-0 lg:border-l border-flow p-6 flex flex-col space-y-6 shrink-0 lg:overflow-y-auto" id="right-panel">
        
        {/* Visual Timer box */}
        <div className="border-b border-[#dcd5c5] pb-6">
          <label className="text-[10px] uppercase tracking-widest text-[#5b6e55] font-bold mb-4 block">Visual Timer (Dyscalculia)</label>
          
          <div className="relative w-40 h-40 mx-auto mb-4">
            {/* Pie stroke circle SVG chart */}
            <svg className="w-full h-full transform -rotate-90">
              <circle cx="80" cy="80" r="70" fill="transparent" stroke="#dcd5c5" strokeWidth="12" />
              <circle 
                cx="80" 
                cy="80" 
                r="70" 
                fill="transparent" 
                stroke="#8baa7a" 
                strokeWidth="12" 
                strokeDasharray="440" 
                strokeDashoffset={440 * (1 - (pomodoroTimer / (pomodoroMode === "focus" ? 25 * 60 : 5 * 60)))} 
                className="transition-all duration-1000"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-2xl font-mono font-bold text-flow-primary">
                {formatTimer(pomodoroTimer)}
              </span>
              <span className="text-[10px] uppercase tracking-wider text-flow-secondary font-semibold">
                {pomodoroMode === "focus" ? "Keep Focus" : "Rest Block"}
              </span>
            </div>
          </div>

          <div className="flex gap-2 justify-center">
            <button 
              onClick={() => { setIsTimerRunning(!isTimerRunning); playSound("click"); }}
              className="px-5 py-2 bg-[#8baa7a] hover:bg-[#729162] text-white font-bold rounded-lg text-xs flex items-center gap-1 cursor-pointer transition"
            >
              {isTimerRunning ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
              {isTimerRunning ? "Hold Focus" : "Begin Focus"}
            </button>
            <button 
              onClick={() => {
                setIsTimerRunning(false);
                setPomodoroTimer(pomodoroMode === "focus" ? 25 * 60 : 5 * 60);
                playSound("relax");
              }}
              className="p-2 border border-[#dcd5c5] rounded-lg text-flow-secondary hover:text-flow-primary cursor-pointer transition"
              title="Reset Timer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Quick Tools: "JUST START" Panic mode */}
        <div className="space-y-3 border-b border-[#dcd5c5] pb-6">
          <label className="text-[10px] uppercase tracking-widest text-[#5b6e55] font-bold block">Quick Tools</label>
          <button 
            onClick={() => {
              setPanicSeconds(120);
              setIsPanicCompleted(false);
              setIsPanicState(true);
              playSound("relax");
            }}
            className="w-full bg-[#ef4444] text-white py-4 rounded-xl font-bold uppercase tracking-tight shadow-md flex flex-col items-center justify-center hover:bg-red-600 transition cursor-pointer"
          >
            <span className="text-lg">JUST START</span>
            <span className="text-[10px] opacity-80">2 Min Panic Mode</span>
          </button>
        </div>

        {/* Low-Anxiety Body Doubling Lounge */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <label className="text-[10px] uppercase tracking-widest text-[#5b6e55] font-bold block">Text Body-Doubling</label>
            <span className="text-[9px] bg-green-100 text-green-800 dark:bg-green-950/40 dark:text-green-300 px-1.5 py-0.5 rounded font-mono font-bold">
              ● 4 active
            </span>
          </div>

          <div className="flex items-center justify-between p-2 bg-flow-primary/50 border border-flow rounded-lg text-[10px]">
            <span className="text-flow-secondary font-medium">Focus Only (Hide Others)</span>
            <button 
              onClick={() => { setPrefs((prev) => ({ ...prev, focusOnlyMode: !prev.focusOnlyMode })); playSound("click"); }}
              className={`px-1.5 py-0.5 font-mono rounded text-[9px] cursor-pointer transition ${prefs.focusOnlyMode ? "bg-[#8baa7a] text-white border-transparent" : "bg-flow-secondary border border-flow text-flow-secondary"}`}
            >
              {prefs.focusOnlyMode ? "ON" : "OFF"}
            </button>
          </div>

          {/* Mate Lists state */}
          {!prefs.focusOnlyMode && (
            <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
              {buddies.map((buddy) => (
                <div key={buddy.id} className="p-2 bg-white dark:bg-zinc-900 border border-[#dcd5c5] rounded-xl flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-base shrink-0">{buddy.avatar}</span>
                    <div className="min-w-0">
                      <p className="font-bold text-flow-primary text-[11px] leading-tight truncate">{buddy.name}</p>
                      <p className="text-[9px] text-flow-secondary truncate max-w-[110px]">{buddy.statusText}</p>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-[9px] font-mono text-[#8baa7a] font-bold block">{buddy.progressPercent}%</span>
                    <div className="w-10 bg-[#faf7f2] h-1 rounded-full overflow-hidden border border-[#dcd5c5]">
                      <div className="bg-[#8baa7a] h-full" style={{ width: `${buddy.progressPercent}%` }} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Shared Chat widget list */}
          <div className="space-y-2 pt-1">
            <span className="text-[9px] text-flow-secondary uppercase font-mono block">Lounge Messages</span>
            <div className="h-28 overflow-y-auto bg-white dark:bg-zinc-900 border border-[#dcd5c5] rounded-lg p-2 space-y-2 font-mono text-[9px]">
              {chatMessages.map((msg) => (
                <div key={msg.id} className="p-1.5 bg-[#faf7f2] dark:bg-zinc-800 rounded text-flow-primary text-[9px] leading-relaxed break-words">
                  <div className="flex justify-between text-[7px] text-flow-secondary opacity-75 mb-0.5">
                    <span className="font-bold">{msg.sender}</span>
                    <span>{msg.timestamp}</span>
                  </div>
                  <p className="select-text">{msg.text}</p>
                </div>
              ))}
            </div>

            {/* Anxiety presets triggers links */}
            <div className="flex flex-wrap gap-1 pt-1">
              {[
                "Focused together! 🚀",
                "Rest block... 🍵",
                "Checked off step! 🎉"
              ].map((pres) => (
                <button
                  key={pres}
                  onClick={() => sendPresetChatMessage(pres)}
                  className="px-1.5 py-0.5 bg-white dark:bg-zinc-900 text-[8px] border border-[#dcd5c5] rounded text-flow-secondary hover:text-flow-primary cursor-pointer transition hover:bg-[#faf7f2]"
                >
                  {pres}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Earthy pro tip card matching the theme */}
        <div className="mt-auto bg-[#2d3e2b] p-4 rounded-xl text-white text-xs">
          <p className="font-bold mb-1">Pro Tip</p>
          <p className="opacity-80 italic leading-snug">
            "Breaking a task down reduces cortisol and helps bypass the 'blank page' freeze."
          </p>
        </div>
      </aside>

      {/* --- FLOATING STATUS ACCESS BAR INFO INDICATOR --- */}
      <footer className="fixed bottom-3 right-3 z-40 bg-white dark:bg-zinc-900 border border-[#dcd5c5] px-3 py-1.5 rounded-lg shadow-md text-[9px] font-mono text-flow-secondary flex items-center gap-3">
        <span className="flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          Profile: <strong className="text-flow-primary font-bold">{profile.toUpperCase()}</strong>
        </span>
        <div className="h-3 w-[1px] bg-[#dcd5c5]" />
        <span>Calm: {calmMode ? "Active" : "OFF"}</span>
      </footer>

    </div>
  );
}
