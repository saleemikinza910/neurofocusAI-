/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface MicroStep {
  id: string;
  text: string;
  minutes: number;
  visualMetaphor?: string;
  checked: boolean;
}

export interface Task {
  id: string;
  originalInput: string;
  condition: string;
  steps: MicroStep[];
  createdAt: string;
  completedAt?: string;
}

export type SensoryProfile = "default" | "adhd" | "autism" | "dyslexia" | "spd";

export interface GranularPreferences {
  motionLevel: "full" | "subtle" | "off";
  contrast: "normal" | "muted" | "high";
  fontSize: "normal" | "large" | "extra-large";
  fontFamily: "sans" | "readability" | "monospace";
  soundEnabled: boolean;
  readingRulerEnabled: boolean;
  rulerY: number; // Y position in pixels or %
  focusOnlyMode: boolean; // hides others' progress in study room
  confettiIntensity?: "off" | "low" | "medium" | "burst";
  colorBlindFilter?: "none" | "protanopia" | "deuteranopia" | "tritanopia";
}

export interface StudyBuddy {
  id: string;
  name: string;
  condition: string;
  avatar: string;
  statusText: string;
  progressPercent: number;
  isFocusing: boolean;
  chatWillingness: number; // 0-100
}

export interface ChatMessage {
  id: string;
  sender: string;
  avatar: string;
  text: string;
  timestamp: string;
  isSystem?: boolean;
}

export interface Stats {
  completedStepsCount: number;
  focusedMinutesCount: number;
  streakCount: number;
  lastActiveDate?: string;
}
