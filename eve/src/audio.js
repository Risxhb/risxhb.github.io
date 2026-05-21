const AudioContextClass = globalThis.AudioContext || globalThis.webkitAudioContext;

const SEMI = 2 ** (1 / 12);
const NOTE = {
  C2: 36, D2: 38, E2: 40, F2: 41, G2: 43, A2: 45, Bb2: 46, C3: 48, D3: 50, E3: 52, F3: 53, G3: 55, A3: 57, Bb3: 58,
  C4: 60, D4: 62, E4: 64, F4: 65, G4: 67, A4: 69, Bb4: 70, C5: 72, D5: 74, E5: 76, F5: 77, G5: 79, A5: 81,
  Bb5: 82, C6: 84, D6: 86
};

function freq(note) {
  return 440 * SEMI ** (note - 69);
}

function clampLevel(value) {
  return Math.max(0, Math.min(1, Number(value) || 0));
}

function gainCurve(value) {
  const level = clampLevel(value);
  return level * level;
}

function defaultSettings() {
  return { master: 0.82, sfx: 0.82, ambience: 0.34 };
}

function normalizeSettings(settings = {}) {
  const defaults = defaultSettings();
  return {
    master: clampLevel(settings.master ?? defaults.master),
    sfx: clampLevel(settings.sfx ?? defaults.sfx),
    ambience: clampLevel(settings.ambience ?? defaults.ambience)
  };
}

const AMBIENCE_AUDIO_PROFILES = {
  field: {
    gain: 0.75,
    windGain: 0.09,
    waterGain: 0.035,
    windFrequency: 680,
    waterFrequency: 1100
  },
  moonroot_entry_safe: {
    gain: 0.9,
    windGain: 0.075,
    waterGain: 0.055,
    windFrequency: 520,
    waterFrequency: 1350
  },
  moonroot_entry_contested: {
    gain: 1,
    windGain: 0.105,
    waterGain: 0.082,
    windFrequency: 430,
    waterFrequency: 980
  },
  moonroot_entry_deep: {
    gain: 1.12,
    windGain: 0.14,
    waterGain: 0.11,
    windFrequency: 330,
    waterFrequency: 720
  },
  moonroot_boss: {
    gain: 1.22,
    windGain: 0.16,
    waterGain: 0.04,
    windFrequency: 260,
    waterFrequency: 620
  }
};

export class AudioManager {
  constructor(settings = defaultSettings()) {
    this.settings = normalizeSettings(settings);
    this.enabled = Boolean(AudioContextClass);
    this.ctx = null;
    this.master = null;
    this.music = null;
    this.sfx = null;
    this.ambience = null;
    this.fxBus = null;
    this.scene = null;
    this.nextMusicTime = 0;
    this.step = 0;
    this.started = false;
    this.windSource = null;
    this.windFilter = null;
    this.windGain = null;
    this.waterSource = null;
    this.waterFilter = null;
    this.waterGain = null;
    this.ambienceProfileId = "field";
    this.ambienceIntensity = 1;
    this.combatPulse = null;
  }

  unlock() {
    if (!this.enabled) return;
    if (!this.ctx) this.createGraph();
    if (this.ctx.state === "suspended") this.ctx.resume();
    if (!this.started) {
      this.started = true;
      this.startAmbience();
      this.playCue("wake");
    }
  }

  createGraph() {
    this.ctx = new AudioContextClass();
    this.master = this.ctx.createGain();
    this.music = this.ctx.createGain();
    this.sfx = this.ctx.createGain();
    this.ambience = this.ctx.createGain();
    this.fxBus = this.ctx.createGain();
    const delay = this.ctx.createDelay(1.2);
    const feedback = this.ctx.createGain();
    const wet = this.ctx.createGain();
    delay.delayTime.value = 0.36;
    feedback.gain.value = 0.24;
    wet.gain.value = 0.22;
    this.sfx.connect(this.master);
    this.ambience.connect(this.master);
    this.fxBus.connect(delay);
    delay.connect(feedback);
    feedback.connect(delay);
    delay.connect(wet);
    wet.connect(this.sfx);
    this.master.connect(this.ctx.destination);
    this.applySettings(this.settings, true);
  }

  applySettings(settings, instant = false) {
    this.settings = normalizeSettings({ ...this.settings, ...settings });
    if (!this.ctx) return;
    const at = this.ctx.currentTime;
    const dur = instant ? 0.01 : 0.12;
    this.ramp(this.master.gain, gainCurve(this.settings.master), at, dur);
    this.ramp(this.music.gain, 0, at, dur);
    this.ramp(this.sfx.gain, gainCurve(this.settings.sfx) * 0.9, at, dur);
    this.ramp(this.ambience.gain, gainCurve(this.settings.ambience) * 0.42, at, dur);
  }

  setAmbienceProfile(profileId, options = {}) {
    this.ambienceProfileId = AMBIENCE_AUDIO_PROFILES[profileId] ? profileId : "field";
    this.ambienceIntensity = Math.max(0, Math.min(1, options.intensity ?? 1));
    if (!this.ctx) return;
    this.applyAmbienceProfile(options.fadeMs ?? 1000);
  }

  applyAmbienceProfile(fadeMs = 1000) {
    if (!this.ctx || !this.windGain || !this.waterGain || !this.windFilter || !this.waterFilter) return;
    const profile = AMBIENCE_AUDIO_PROFILES[this.ambienceProfileId] ?? AMBIENCE_AUDIO_PROFILES.field;
    const gain = (profile.gain ?? 1) * this.ambienceIntensity;
    const at = this.ctx.currentTime;
    const dur = Math.max(0.01, fadeMs / 1000);
    this.ramp(this.windGain.gain, (profile.windGain ?? 0.09) * gain, at, dur);
    this.ramp(this.waterGain.gain, (profile.waterGain ?? 0.04) * gain, at, dur);
    this.ramp(this.windFilter.frequency, profile.windFrequency ?? 620, at, dur);
    this.ramp(this.waterFilter.frequency, profile.waterFrequency ?? 1200, at, dur);
  }

  ramp(param, value, at, duration) {
    param.cancelScheduledValues(at);
    param.setTargetAtTime(value, at, Math.max(0.01, duration / 3));
  }

  update(state) {
    if (!this.ctx || this.ctx.state !== "running") return;
    const scene = state.mode === "combat" ? (state.combat?.boss ? "boss" : "combat") : state.mapId;
    if (scene !== this.scene) this.changeScene(scene);
  }

  changeScene(scene) {
    this.scene = scene;
    this.stopCombatPulse();
  }

  scheduleMusic() {
    const lookahead = this.ctx.currentTime + 1.2;
    while (this.nextMusicTime < lookahead) {
      if (this.scene === "combat" || this.scene === "boss") this.scheduleCombatStep(this.nextMusicTime, this.step, this.scene === "boss");
      else if (this.scene === "emberleaf_trail") this.scheduleForestTutorialStep(this.nextMusicTime, this.step);
      else this.scheduleFieldStep(this.nextMusicTime, this.step);
      const bpm = this.scene === "combat" ? 118 : this.scene === "boss" ? 126 : this.scene === "emberleaf_trail" ? 68 : 74;
      this.nextMusicTime += 60 / bpm / 2;
      this.step++;
    }
  }

  scheduleForestTutorialStep(time, step) {
    const bar = Math.floor(step / 8);
    const beat = step % 8;
    const chords = [
      [NOTE.F3, NOTE.A3, NOTE.C4, NOTE.G4],
      [NOTE.C3, NOTE.G3, NOTE.C4, NOTE.E4],
      [NOTE.D3, NOTE.A3, NOTE.C4, NOTE.F4],
      [NOTE.Bb2, NOTE.F3, NOTE.C4, NOTE.D4]
    ];
    const chord = chords[bar % chords.length];
    if (beat === 0) this.forestPad(chord, time, 4.2, 0.045);
    if (beat === 0 || beat === 3 || beat === 6) {
      const note = chord[(beat / 3 + bar) % chord.length] + 12;
      this.softPiano(note, time + (beat === 6 ? 0.06 : 0), beat === 0 ? 0.06 : 0.046);
    }
    if (beat === 4 && bar % 2 === 0) this.softPiano(chord[2] + 19, time + 0.02, 0.034);
    if (beat === 7 && bar % 4 === 1) this.bell(chord[3] + 12, time + 0.05, 0.02);
  }

  scheduleFieldStep(time, step) {
    const bar = Math.floor(step / 8);
    const beat = step % 8;
    const chords = [
      [NOTE.D3, NOTE.F3, NOTE.A3, NOTE.C4, NOTE.E4],
      [NOTE.Bb2, NOTE.F3, NOTE.A3, NOTE.C4, NOTE.D4],
      [NOTE.F2, NOTE.C3, NOTE.F3, NOTE.A3, NOTE.C4],
      [NOTE.C3, NOTE.G3, NOTE.Bb3, NOTE.D4, NOTE.E4]
    ];
    const chord = chords[bar % chords.length];
    if (beat === 0) this.pad(chord, time, 4.9, bar % 2 ? 0.11 : 0.13);
    if (beat % 2 === 0) this.harp(chord[(beat + bar) % chord.length] + 24, time, 0.09);
    if (beat === 6) this.bell(chord[3] + 24, time + 0.04, 0.055);
    if (beat === 0 && bar % 4 === 3) this.lowBoom(chord[0] - 12, time, 0.09);
  }

  scheduleCombatStep(time, step, boss) {
    const beat = step % 8;
    const roots = boss ? [NOTE.D2, NOTE.F2, NOTE.C2, NOTE.Bb2] : [NOTE.D2, NOTE.C2, NOTE.Bb2, NOTE.C2];
    const root = roots[Math.floor(step / 8) % roots.length];
    if (beat === 0 || beat === 4) this.lowBoom(root, time, boss ? 0.18 : 0.13);
    if (beat % 2 === 0) this.pulse(root + 12, time, boss ? 0.11 : 0.085);
    if (beat === 3 || beat === 7) this.noiseHit(time, boss ? 0.045 : 0.032, 0.09);
    if (beat === 2 || beat === 6) this.brassStab([root + 24, root + 31, root + 36], time, boss ? 0.12 : 0.08);
  }

  osc(type, frequency, destination, time, duration, peak, attack = 0.01, release = 0.2) {
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(frequency, time);
    gain.gain.setValueAtTime(0.0001, time);
    gain.gain.exponentialRampToValueAtTime(Math.max(0.0002, peak), time + attack);
    gain.gain.setTargetAtTime(0.0001, time + Math.max(attack, duration - release), release / 4);
    osc.connect(gain);
    gain.connect(destination);
    osc.start(time);
    osc.stop(time + duration + release);
    return { osc, gain };
  }

  filteredOsc(type, frequency, destination, time, duration, peak, cutoff, q = 0.8) {
    const filter = this.ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.setValueAtTime(cutoff, time);
    filter.Q.value = q;
    filter.connect(destination);
    this.osc(type, frequency, filter, time, duration, peak, 0.03, 0.55);
  }

  pad(chord, time, duration, peak) {
    for (const note of chord) {
      const f = freq(note);
      this.filteredOsc("sine", f, this.music, time, duration, peak / chord.length, 1450);
      this.filteredOsc("sawtooth", f * 1.003, this.fxBus, time + 0.01, duration, peak / chord.length * 0.28, 900);
    }
  }

  forestPad(chord, time, duration, peak) {
    for (const note of chord) {
      const f = freq(note);
      this.filteredOsc("sine", f, this.music, time, duration, peak / chord.length, 980);
      this.filteredOsc("triangle", f * 1.002, this.fxBus, time + 0.04, duration, peak / chord.length * 0.18, 720);
    }
  }

  softPiano(note, time, peak) {
    const body = this.ctx.createBiquadFilter();
    const shimmer = this.ctx.createBiquadFilter();
    body.type = "lowpass";
    body.frequency.setValueAtTime(1850, time);
    body.frequency.exponentialRampToValueAtTime(720, time + 0.72);
    shimmer.type = "highpass";
    shimmer.frequency.value = 900;
    body.connect(this.music);
    shimmer.connect(this.fxBus);
    this.osc("triangle", freq(note), body, time, 1.15, peak, 0.004, 0.58);
    this.osc("sine", freq(note + 12) * 1.004, shimmer, time + 0.002, 0.86, peak * 0.18, 0.003, 0.46);
  }

  harp(note, time, peak) {
    const filter = this.ctx.createBiquadFilter();
    filter.type = "highpass";
    filter.frequency.value = 260;
    filter.connect(this.music);
    const voice = this.osc("triangle", freq(note), filter, time, 1.35, peak, 0.006, 0.75);
    voice.osc.frequency.exponentialRampToValueAtTime(freq(note) * 0.996, time + 1.1);
    filter.connect(this.fxBus);
  }

  bell(note, time, peak) {
    this.osc("sine", freq(note), this.sfx, time, 2.4, peak, 0.012, 1.4);
    this.osc("sine", freq(note + 12) * 1.01, this.fxBus, time, 1.8, peak * 0.34, 0.006, 1.1);
  }

  lowBoom(note, time, peak) {
    const voice = this.osc("sine", freq(note), this.music, time, 1.2, peak, 0.01, 0.5);
    voice.osc.frequency.exponentialRampToValueAtTime(freq(note) * 0.58, time + 0.7);
  }

  pulse(note, time, peak) {
    const filter = this.ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.setValueAtTime(420, time);
    filter.frequency.exponentialRampToValueAtTime(1100, time + 0.08);
    filter.connect(this.music);
    this.osc("sawtooth", freq(note), filter, time, 0.34, peak, 0.004, 0.13);
  }

  brassStab(notes, time, peak) {
    for (const note of notes) this.filteredOsc("sawtooth", freq(note), this.music, time, 0.56, peak / notes.length, 820, 1.2);
  }

  startAmbience() {
    if (!this.ctx) return;
    const wind = this.makeNoiseBuffer(4);
    this.windSource = this.ctx.createBufferSource();
    const windFilter = this.ctx.createBiquadFilter();
    const windGain = this.ctx.createGain();
    this.windSource.buffer = wind;
    this.windSource.loop = true;
    windFilter.type = "bandpass";
    windFilter.frequency.value = 620;
    windFilter.Q.value = 0.45;
    windGain.gain.value = 0.0001;
    this.windSource.connect(windFilter);
    windFilter.connect(windGain);
    windGain.connect(this.ambience);
    this.windSource.start();
    this.windFilter = windFilter;
    this.windGain = windGain;

    const water = this.makeNoiseBuffer(2);
    this.waterSource = this.ctx.createBufferSource();
    const waterFilter = this.ctx.createBiquadFilter();
    const waterGain = this.ctx.createGain();
    this.waterSource.buffer = water;
    this.waterSource.loop = true;
    waterFilter.type = "lowpass";
    waterFilter.frequency.value = 1200;
    waterGain.gain.value = 0.0001;
    this.waterSource.connect(waterFilter);
    waterFilter.connect(waterGain);
    waterGain.connect(this.ambience);
    this.waterSource.start();
    this.waterFilter = waterFilter;
    this.waterGain = waterGain;
    this.applyAmbienceProfile(10);
  }

  makeNoiseBuffer(seconds) {
    const length = Math.floor(this.ctx.sampleRate * seconds);
    const buffer = this.ctx.createBuffer(1, length, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    let last = 0;
    for (let i = 0; i < length; i++) {
      last = last * 0.985 + (Math.random() * 2 - 1) * 0.015;
      data[i] = last;
    }
    return buffer;
  }

  startCombatPulse(boss) {
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();
    osc.type = "sawtooth";
    osc.frequency.value = boss ? 54 : 48;
    filter.type = "lowpass";
    filter.frequency.value = boss ? 150 : 120;
    gain.gain.value = boss ? 0.035 : 0.023;
    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.music);
    osc.start();
    this.combatPulse = { osc, gain };
  }

  stopCombatPulse() {
    if (!this.combatPulse) return;
    const { osc, gain } = this.combatPulse;
    gain.gain.setTargetAtTime(0.0001, this.ctx.currentTime, 0.08);
    osc.stop(this.ctx.currentTime + 0.25);
    this.combatPulse = null;
  }

  playCue(name) {
    if (!this.ctx || this.ctx.state !== "running") return;
    const t = this.ctx.currentTime + 0.01;
    if (name === "menuMove") return this.uiTick(t, 690, 0.032);
    if (name === "confirm") return this.uiTick(t, 880, 0.06, 1.5);
    if (name === "cancel") return this.uiTick(t, 420, 0.052, 0.74);
    if (name === "item") return this.bell(NOTE.A5, t, 0.08);
    if (name === "attack") return this.noiseHit(t, 0.13, 0.16);
    if (name === "skill") return this.arcane(t);
    if (name === "enemy") return this.noiseHit(t, 0.1, 0.22, 260);
    if (name === "guard") return this.uiTick(t, 300, 0.06, 0.5);
    if (name === "encounter") return this.brassStab([NOTE.D3, NOTE.A3, NOTE.D4], t, 0.18);
    if (name === "victory") return this.victory(t);
    if (name === "transition") return this.bell(NOTE.D5, t, 0.06);
    if (name === "wake") return this.bell(NOTE.F5, t, 0.035);
  }

  uiTick(time, startFreq, peak, endRatio = 1.18) {
    const voice = this.osc("sine", startFreq, this.sfx, time, 0.16, peak, 0.003, 0.08);
    voice.osc.frequency.exponentialRampToValueAtTime(Math.max(80, startFreq * endRatio), time + 0.08);
  }

  noiseHit(time, peak, duration, cutoff = 740) {
    const source = this.ctx.createBufferSource();
    const gain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();
    source.buffer = this.makeNoiseBuffer(0.24);
    filter.type = "lowpass";
    filter.frequency.setValueAtTime(cutoff, time);
    filter.frequency.exponentialRampToValueAtTime(cutoff * 0.45, time + duration);
    gain.gain.setValueAtTime(0.0001, time);
    gain.gain.exponentialRampToValueAtTime(peak, time + 0.006);
    gain.gain.setTargetAtTime(0.0001, time + 0.03, duration / 4);
    source.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfx);
    source.start(time);
    source.stop(time + duration + 0.1);
  }

  arcane(time) {
    this.bell(NOTE.D5, time, 0.07);
    this.bell(NOTE.A5, time + 0.07, 0.055);
    this.noiseHit(time + 0.02, 0.035, 0.24, 1600);
  }

  victory(time) {
    [NOTE.D4, NOTE.F4, NOTE.A4, NOTE.D5].forEach((note, index) => this.bell(note, time + index * 0.09, 0.075));
  }
}

export function loadAudioSettings() {
  try {
    return normalizeSettings(JSON.parse(localStorage.getItem("eve-audio-settings-v1") || "{}"));
  } catch {
    return defaultSettings();
  }
}

export function saveAudioSettings(settings) {
  localStorage.setItem("eve-audio-settings-v1", JSON.stringify(normalizeSettings(settings)));
}
