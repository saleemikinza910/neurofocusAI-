/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

class AmbientPlayer {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private activeSource: AudioBufferSourceNode | null = null;
  private intervalIds: any[] = [];
  private activeOscillators: { osc: OscillatorNode; gain: GainNode }[] = [];
  private currentType: "none" | "brown" | "lofi" = "none";
  private baseVolume: number = 0.4;

  init() {
    if (this.ctx) return;
    try {
      this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(this.baseVolume, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);
    } catch (e) {
      console.error("AudioContext initialization failed", e);
    }
  }

  setVolume(vol: number) {
    this.baseVolume = vol;
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setValueAtTime(vol, this.ctx.currentTime);
    }
  }

  getVolume() {
    return this.baseVolume;
  }

  getCurrentType() {
    return this.currentType;
  }

  stop() {
    this.currentType = "none";
    this.clearScheduledNodes();
    if (this.activeSource) {
      try {
        this.activeSource.stop();
      } catch (e) {}
      this.activeSource = null;
    }
  }

  private clearScheduledNodes() {
    this.intervalIds.forEach(id => clearInterval(id));
    this.intervalIds = [];
    this.activeOscillators.forEach(item => {
      try {
        item.osc.stop();
      } catch (e) {}
    });
    this.activeOscillators = [];
  }

  playBrownNoise() {
    this.stop();
    this.init();
    if (!this.ctx || !this.masterGain) return;
    this.currentType = "brown";

    if (this.ctx.state === "suspended") {
      this.ctx.resume();
    }

    const sampleRate = this.ctx.sampleRate;
    const bufferSize = 10 * sampleRate;
    const buffer = this.ctx.createBuffer(1, bufferSize, sampleRate);
    const data = buffer.getChannelData(0);
    let lastOut = 0.0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      data[i] = (lastOut + (0.02 * white)) / 1.02;
      lastOut = data[i];
      data[i] *= 3.5; // Boost low-volume levels
    }

    const filter = this.ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.setValueAtTime(350, this.ctx.currentTime);

    const src = this.ctx.createBufferSource();
    src.buffer = buffer;
    src.loop = true;

    src.connect(filter);
    filter.connect(this.masterGain);
    src.start(0);
    this.activeSource = src;
  }

  playLofi() {
    this.stop();
    this.init();
    if (!this.ctx || !this.masterGain) return;
    this.currentType = "lofi";

    if (this.ctx.state === "suspended") {
      this.ctx.resume();
    }

    const filter = this.ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.setValueAtTime(450, this.ctx.currentTime);
    filter.connect(this.masterGain);

    // Soft crackle sounds
    const sampleRate = this.ctx.sampleRate;
    const crackleBufferSize = 3 * sampleRate;
    const crackleBuffer = this.ctx.createBuffer(1, crackleBufferSize, sampleRate);
    const data = crackleBuffer.getChannelData(0);
    for (let i = 0; i < crackleBufferSize; i++) {
      const white = Math.random() * 2 - 1;
      const isCrackle = Math.random() > 0.9997;
      data[i] = (white * 0.008) + (isCrackle ? (Math.random() * 0.12) : 0);
    }
    const crackleSrc = this.ctx.createBufferSource();
    crackleSrc.buffer = crackleBuffer;
    crackleSrc.loop = true;
    crackleSrc.connect(filter);
    crackleSrc.start(0);
    this.activeSource = crackleSrc;

    // Lofi Pentatonic Mellow Chord Progression (C - Fmaj7 - G - Am)
    const chords = [
      [130.81, 164.81, 196.00, 261.63], // C
      [174.61, 220.00, 261.63, 329.63], // Fmaj7
      [196.00, 246.94, 293.66, 392.00], // G
      [110.00, 164.81, 220.00, 261.63], // Am7
    ];

    let chordIdx = 0;

    const playNextChord = () => {
      if (this.currentType !== "lofi" || !this.ctx) return;
      const now = this.ctx.currentTime;
      const chord = chords[chordIdx];
      chordIdx = (chordIdx + 1) % chords.length;

      chord.forEach((freq) => {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const oscGain = this.ctx.createGain();

        osc.type = "triangle";
        osc.frequency.setValueAtTime(freq, now);

        oscGain.gain.setValueAtTime(0, now);
        oscGain.gain.linearRampToValueAtTime(0.045, now + 1.8);
        oscGain.gain.exponentialRampToValueAtTime(0.0001, now + 5.5);

        osc.connect(oscGain);
        oscGain.connect(filter);

        osc.start(now);
        osc.stop(now + 5.6);

        const oscItem = { osc, gain: oscGain };
        this.activeOscillators.push(oscItem);
        setTimeout(() => {
          this.activeOscillators = this.activeOscillators.filter(item => item !== oscItem);
        }, 5800);
      });
    };

    playNextChord();
    const intervalId = setInterval(playNextChord, 4800);
    this.intervalIds.push(intervalId);

    // Warm high-pitched mellow bell drops
    const playBell = () => {
      if (this.currentType !== "lofi" || !this.ctx) return;
      const now = this.ctx.currentTime;
      const scale = [392.00, 440.00, 523.25, 587.33, 659.25, 783.99]; // Pentatonic notes
      const freq = scale[Math.floor(Math.random() * scale.length)];

      const osc = this.ctx.createOscillator();
      const oscGain = this.ctx.createGain();

      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, now);

      oscGain.gain.setValueAtTime(0, now);
      oscGain.gain.linearRampToValueAtTime(0.025, now + 0.08);
      oscGain.gain.exponentialRampToValueAtTime(0.0001, now + 2.8);

      osc.connect(oscGain);
      oscGain.connect(filter);

      osc.start(now);
      osc.stop(now + 3.0);

      const oscItem = { osc, gain: oscGain };
      this.activeOscillators.push(oscItem);
      setTimeout(() => {
        this.activeOscillators = this.activeOscillators.filter(item => item !== oscItem);
      }, 3250);
    };

    const bellIntervalId = setInterval(() => {
      if (Math.random() > 0.25) {
        playBell();
      }
    }, 2800);
    this.intervalIds.push(bellIntervalId);
  }
}

export const ambientPlayer = new AmbientPlayer();
