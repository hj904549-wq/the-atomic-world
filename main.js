/**
 * ============================================================================
 * PROJECT: THE ATOMIC WORLD («سفر به دنیای اتم‌ها»)
 * 60-Second Continuous 3D Scientific Motion Graphic Engine + Foley & Score Studio
 * Subject: Lithium-7 Atom (3 Protons, 4 Neutrons, 3 Electrons)
 * ============================================================================
 */

window.onload = function () {
  // ------------------------------------------------------------------------
  // 1. MASTER TIMELINE & STATE CONFIGURATION
  // ------------------------------------------------------------------------
  const TOTAL_DURATION = 60.0; // Exact 60.0 seconds seamless cycle
  let masterTime = 0.0;
  let prevMasterTime = 0.0;
  const reducedMotionQuery = window.matchMedia
    ? window.matchMedia("(prefers-reduced-motion: reduce)")
    : { matches: false };
  let isPlaying = !reducedMotionQuery.matches;
  let isScrubbing = false;
  let lastFrameTime = performance.now();
  let currentSceneIndex = 1;

  // Interactive User Camera Offset (allows subtle orbit inspection at any time)
  let isPointerDown = false;
  let pointerStart = { x: 0, y: 0 };
  let userOrbitOffset = { theta: 0, phi: 0 };
  let targetOrbitOffset = { theta: 0, phi: 0 };

  // Persian numeral converter helper
  const persianDigits = ["۰", "۱", "۲", "۳", "۴", "۵", "۶", "۷", "۸", "۹"];
  function toPersianNum(str) {
    return String(str).replace(/\d/g, (d) => persianDigits[d]);
  }

  // Mathematical smoothing utilities
  function clamp(val, min, max) {
    return Math.max(min, Math.min(max, val));
  }
  function lerp(a, b, t) {
    return a + (b - a) * t;
  }
  function smoothstep(edge0, edge1, x) {
    const t = clamp((x - edge0) / (edge1 - edge0), 0.0, 1.0);
    return t * t * (3.0 - 2.0 * t);
  }
  function smootherstep(edge0, edge1, x) {
    const t = clamp((x - edge0) / (edge1 - edge0), 0.0, 1.0);
    return t * t * t * (t * (t * 6.0 - 15.0) + 10.0);
  }

  // ------------------------------------------------------------------------
  // 2. PROCEDURAL CINEMATIC MUSIC & SYNCHRONIZED FOLEY STUDIO (WEB AUDIO API)
  // ------------------------------------------------------------------------
  class CinematicAtomicAudioStudio {
    constructor() {
      this.ctx = null;
      this.initialized = false;
      this.isMuted = true;
      this.musicEnabled = true;
      this.sfxEnabled = true;

      // Mixer Buses
      this.masterGain = null;
      this.compressor = null;
      this.analyser = null;
      this.musicBus = null;
      this.sfxBus = null;
      this.reverbSend = null;

      // Continuous Spatial Synth Nodes
      this.padOscs = [];
      this.padFilter = null;
      this.nucleusHumOsc = null;
      this.nucleusHumGain = null;
      this.electronShimmerFilter = null;
      this.electronShimmerGain = null;
      this.noiseBuffer = null;

      // Sequencer state for background arpeggiator & heartbeat
      this.lastArpStep = -1;
      this.lastHeartbeatStep = -1;
      this.firedCues = new Set();

      // FFT Spectrum data buffer
      this.freqData = null;
    }

    init() {
      if (this.initialized) return;
      try {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        this.ctx = new AudioCtx();

        // 1. Master Dynamics Compressor & Analyser
        this.compressor = this.ctx.createDynamicsCompressor();
        this.compressor.threshold.value = -16;
        this.compressor.knee.value = 18;
        this.compressor.ratio.value = 4;
        this.compressor.attack.value = 0.005;
        this.compressor.release.value = 0.2;

        this.analyser = this.ctx.createAnalyser();
        this.analyser.fftSize = 64;
        this.analyser.smoothingTimeConstant = 0.78;
        this.freqData = new Uint8Array(this.analyser.frequencyBinCount);

        this.masterGain = this.ctx.createGain();
        this.masterGain.gain.value = 0.0;

        this.compressor.connect(this.masterGain);
        this.masterGain.connect(this.analyser);
        this.analyser.connect(this.ctx.destination);

        // 2. Sub-buses: Music Bus & SFX Bus
        this.musicBus = this.ctx.createGain();
        this.musicBus.gain.value = 0.75;
        this.musicBus.connect(this.compressor);

        this.sfxBus = this.ctx.createGain();
        this.sfxBus.gain.value = 0.95;
        this.sfxBus.connect(this.compressor);

        // 3. Stereo Ping-Pong Delay / Lush Space Reverb Network
        this.reverbSend = this.ctx.createGain();
        this.reverbSend.gain.value = 0.38;

        const delayL = this.ctx.createDelay(1.0);
        const delayR = this.ctx.createDelay(1.0);
        delayL.delayTime.value = 0.27;
        delayR.delayTime.value = 0.41;

        const fbL = this.ctx.createGain();
        const fbR = this.ctx.createGain();
        fbL.gain.value = 0.42;
        fbR.gain.value = 0.42;

        const dampFilter = this.ctx.createBiquadFilter();
        dampFilter.type = "lowpass";
        dampFilter.frequency.value = 2200;

        const merger = this.ctx.createChannelMerger(2);
        this.reverbSend.connect(delayL);
        this.reverbSend.connect(delayR);
        delayL.connect(fbL);
        fbL.connect(dampFilter);
        dampFilter.connect(delayR);
        delayR.connect(fbR);
        fbR.connect(delayL);

        delayL.connect(merger, 0, 0);
        delayR.connect(merger, 0, 1);
        merger.connect(this.compressor);

        // 4. Generate 3-second Pink/White Noise Buffer for Whooshes & Shimmers
        const sr = this.ctx.sampleRate;
        this.noiseBuffer = this.ctx.createBuffer(1, sr * 3, sr);
        const data = this.noiseBuffer.getChannelData(0);
        let b0 = 0,
          b1 = 0,
          b2 = 0,
          b3 = 0,
          b4 = 0,
          b5 = 0,
          b6 = 0;
        for (let i = 0; i < data.length; i++) {
          const white = Math.random() * 2 - 1;
          b0 = 0.99886 * b0 + white * 0.0555179;
          b1 = 0.99332 * b1 + white * 0.0750759;
          b2 = 0.969 * b2 + white * 0.153852;
          b3 = 0.8665 * b3 + white * 0.3104856;
          b4 = 0.55 * b4 + white * 0.5329522;
          b5 = -0.7616 * b5 - white * 0.016898;
          data[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.045;
          b6 = white * 0.115926;
        }

        // 5. Continuous Warm Ambient Cinematic Pad (D minor 9 Lush Drone)
        this.padFilter = this.ctx.createBiquadFilter();
        this.padFilter.type = "lowpass";
        this.padFilter.frequency.value = 420;
        this.padFilter.Q.value = 1.2;

        const padMasterGain = this.ctx.createGain();
        padMasterGain.gain.value = 0.22;
        this.padFilter.connect(padMasterGain);
        padMasterGain.connect(this.musicBus);
        padMasterGain.connect(this.reverbSend);

        // Base frequencies for warm sci-fi pad (D2, A2, D3, F3, A3, E4)
        const basePadFreqs = [73.42, 110.0, 146.83, 174.61, 220.0, 329.63];
        basePadFreqs.forEach((f, idx) => {
          const osc = this.ctx.createOscillator();
          osc.type = idx < 2 ? "sine" : idx % 2 === 0 ? "sawtooth" : "triangle";
          osc.frequency.value = f;
          osc.detune.value = (idx - 2.5) * 4.5; // Warm analog chorus detuning
          const g = this.ctx.createGain();
          g.gain.value = idx < 2 ? 0.35 : 0.12;
          osc.connect(g);
          g.connect(this.padFilter);
          osc.start();
          this.padOscs.push(osc);
        });

        // 6. Continuous Distance-Modulated Nucleus Magnetic Thrum
        this.nucleusHumOsc = this.ctx.createOscillator();
        this.nucleusHumOsc.type = "sine";
        this.nucleusHumOsc.frequency.value = 58.27; // Bb1 / D1 magnetic resonance
        this.nucleusHumGain = this.ctx.createGain();
        this.nucleusHumGain.gain.value = 0.05;
        this.nucleusHumOsc.connect(this.nucleusHumGain);
        this.nucleusHumGain.connect(this.sfxBus);
        this.nucleusHumOsc.start();

        this.initialized = true;
      } catch (err) {
        console.warn("Web Audio API initialization error:", err);
      }
    }

    unlockAndUnmute() {
      if (!this.initialized) this.init();
      if (!this.ctx) return false;
      if (this.ctx.state === "suspended") {
        this.ctx.resume();
      }
      if (this.isMuted) {
        this.isMuted = false;
        const now = this.ctx.currentTime;
        this.masterGain.gain.cancelScheduledValues(now);
        this.masterGain.gain.setTargetAtTime(0.85, now, 0.15);
        this.playCinematicImpact(73.42, 1.4);
        this.playUIAppear("title");
      }
      return !this.isMuted;
    }

    toggleMute() {
      if (!this.initialized) this.init();
      if (!this.ctx) return false;
      if (this.ctx.state === "suspended") {
        this.ctx.resume();
      }
      this.isMuted = !this.isMuted;
      const now = this.ctx.currentTime;
      this.masterGain.gain.cancelScheduledValues(now);
      this.masterGain.gain.setTargetAtTime(
        this.isMuted ? 0.0 : 0.85,
        now,
        0.18,
      );
      if (!this.isMuted) {
        this.playUIAppear("badge");
      }
      return !this.isMuted;
    }

    toggleMusic() {
      this.musicEnabled = !this.musicEnabled;
      if (this.initialized && this.musicBus) {
        this.musicBus.gain.setTargetAtTime(
          this.musicEnabled ? 0.75 : 0.0,
          this.ctx.currentTime,
          0.15,
        );
      }
      return this.musicEnabled;
    }

    toggleSFX() {
      this.sfxEnabled = !this.sfxEnabled;
      if (this.initialized && this.sfxBus) {
        this.sfxBus.gain.setTargetAtTime(
          this.sfxEnabled ? 0.95 : 0.0,
          this.ctx.currentTime,
          0.15,
        );
      }
      return this.sfxEnabled;
    }

    // ====================================================================
    // CONTINUOUS BACKGROUND SCORE & SPATIAL TELEMETRY UPDATER
    // ====================================================================
    updateContinuousSoundscape(t, sceneIdx, camRadius) {
      if (!this.initialized || this.isMuted || !this.ctx) return;
      const now = this.ctx.currentTime;

      // 1. Evolving Chord Progression across 60s (4-bar harmonic shifts)
      // Chord roots: D minor 9 -> Bb Maj9 -> G min9 -> A7sus4
      const chordSets = [
        [73.42, 110.0, 146.83, 174.61, 220.0, 329.63], // Dm9
        [58.27, 116.54, 146.83, 174.61, 220.0, 261.63], // BbMaj9
        [49.0, 98.0, 146.83, 174.61, 233.08, 293.66], // Gm9
        [55.0, 110.0, 146.83, 164.81, 220.0, 293.66], // A7sus4
      ];
      const chordIndex = Math.floor((t / 4.0) % 4);
      const activeChord = chordSets[chordIndex];
      this.padOscs.forEach((osc, i) => {
        osc.frequency.setTargetAtTime(activeChord[i], now, 0.45);
      });

      // Modulate Pad Filter brightness by Scene
      const sceneCutoffs = [420, 680, 360, 860, 580, 740];
      const targetCutoff =
        sceneCutoffs[(sceneIdx - 1) % 6] + Math.sin(t * 0.8) * 90;
      this.padFilter.frequency.setTargetAtTime(targetCutoff, now, 0.3);

      // 2. Modulate Nuclear Magnetic Hum by Camera Proximity to Nucleus
      const closeness = clamp(1.0 - (camRadius - 5.5) / 20.0, 0.05, 1.0);
      this.nucleusHumGain.gain.setTargetAtTime(closeness * 0.14, now, 0.15);
      this.nucleusHumOsc.frequency.setTargetAtTime(
        55.0 + closeness * 18.42,
        now,
        0.2,
      );

      // 3. Synchronized Crystalline Arpeggiator (plays every 0.375s = 160 BPM 8th notes)
      const arpStep = Math.floor(t / 0.375);
      if (arpStep !== this.lastArpStep && this.musicEnabled) {
        this.lastArpStep = arpStep;
        this.triggerArpNote(arpStep, sceneIdx, chordIndex);
      }

      // 4. Deep Sub-Bass Heartbeat Pulse every 3.0 seconds
      const hbStep = Math.floor(t / 3.0);
      if (hbStep !== this.lastHeartbeatStep && this.musicEnabled) {
        this.lastHeartbeatStep = hbStep;
        this.playSubHeartbeat(activeChord[0]);
      }
    }

    triggerArpNote(step, sceneIdx, chordIndex) {
      if (!this.ctx || !this.musicEnabled) return;
      const now = this.ctx.currentTime;

      // D minor / F major pentatonic crystalline notes (Hz)
      const arpScale = [
        293.66, 329.63, 349.23, 440.0, 523.25, 587.33, 659.25, 698.46, 880.0,
      ];
      const pattern = [0, 2, 3, 5, 4, 7, 5, 3];
      const noteIdx =
        (pattern[step % pattern.length] + chordIndex) % arpScale.length;
      let freq = arpScale[noteIdx];

      // Shift up an octave in Scene 4 (Electron Cloud) for sparkling energy
      if (sceneIdx === 4) freq *= 1.5;
      // Deeper, more contemplative in Scene 3 (Inside Nucleus)
      if (sceneIdx === 3 && step % 2 === 1) return;

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const panner = this.ctx.createStereoPanner
        ? this.ctx.createStereoPanner()
        : null;

      osc.type = sceneIdx === 4 ? "sine" : "triangle";
      osc.frequency.setValueAtTime(freq, now);

      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.linearRampToValueAtTime(0.045, now + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.42);

      if (panner) {
        panner.pan.value = Math.sin(step * 0.9) * 0.65;
        osc.connect(gain);
        gain.connect(panner);
        panner.connect(this.musicBus);
        panner.connect(this.reverbSend);
      } else {
        osc.connect(gain);
        gain.connect(this.musicBus);
        gain.connect(this.reverbSend);
      }

      osc.start(now);
      osc.stop(now + 0.45);
    }

    playSubHeartbeat(rootFreq) {
      if (!this.ctx || !this.musicEnabled) return;
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(rootFreq * 1.5, now);
      osc.frequency.exponentialRampToValueAtTime(rootFreq * 0.75, now + 0.35);

      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(0.16, now + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.65);

      osc.connect(gain);
      gain.connect(this.musicBus);
      osc.start(now);
      osc.stop(now + 0.7);
    }

    // ====================================================================
    // SYNCHRONIZED MOTION SFX & ELEMENT ARRIVAL SYNTHESIZERS
    // ====================================================================

    // 1. Cinematic Camera Movement Whoosh (Filtered Noise + Sub Pitch Sweep)
    playCameraWhoosh(type = "dive", duration = 1.4) {
      if (!this.initialized || this.isMuted || !this.sfxEnabled || !this.ctx)
        return;
      const now = this.ctx.currentTime;

      // Filtered Pink Noise Sweep
      const noiseSrc = this.ctx.createBufferSource();
      noiseSrc.buffer = this.noiseBuffer;

      const filter = this.ctx.createBiquadFilter();
      filter.type = "bandpass";
      filter.Q.value = 2.2;

      const startF = type === "zoomIn" ? 180 : type === "pullOut" ? 1100 : 260;
      const peakF = type === "zoomIn" ? 1400 : type === "pullOut" ? 220 : 950;
      filter.frequency.setValueAtTime(startF, now);
      filter.frequency.exponentialRampToValueAtTime(
        peakF,
        now + duration * 0.45,
      );
      filter.frequency.exponentialRampToValueAtTime(140, now + duration);

      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(0.28, now + duration * 0.35);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

      noiseSrc.connect(filter);
      filter.connect(gain);
      gain.connect(this.sfxBus);
      gain.connect(this.reverbSend);

      noiseSrc.start(now);
      noiseSrc.stop(now + duration + 0.05);

      // Sub-bass body sweep
      const subOsc = this.ctx.createOscillator();
      const subGain = this.ctx.createGain();
      subOsc.type = "sine";
      subOsc.frequency.setValueAtTime(type === "zoomIn" ? 110 : 65, now);
      subOsc.frequency.exponentialRampToValueAtTime(
        type === "zoomIn" ? 45 : 95,
        now + duration * 0.8,
      );

      subGain.gain.setValueAtTime(0.001, now);
      subGain.gain.linearRampToValueAtTime(0.18, now + duration * 0.25);
      subGain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

      subOsc.connect(subGain);
      subGain.connect(this.sfxBus);
      subOsc.start(now);
      subOsc.stop(now + duration + 0.05);
    }

    // 2. Holographic Typography & UI Card Reveal Sound
    playUIAppear(style = "card") {
      if (!this.initialized || this.isMuted || !this.sfxEnabled || !this.ctx)
        return;
      const now = this.ctx.currentTime;

      const freqs =
        style === "title"
          ? [293.66, 440.0, 587.33, 880.0]
          : style === "badge"
            ? [587.33, 880.0]
            : [440.0, 659.25, 880.0];

      freqs.forEach((f, i) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = "sine";
        const startT = now + i * 0.045;
        osc.frequency.setValueAtTime(f, startT);
        osc.frequency.exponentialRampToValueAtTime(f * 1.005, startT + 0.35);

        gain.gain.setValueAtTime(0.0001, startT);
        gain.gain.linearRampToValueAtTime(
          0.065 / Math.sqrt(i + 1),
          startT + 0.012,
        );
        gain.gain.exponentialRampToValueAtTime(0.0001, startT + 0.45);

        osc.connect(gain);
        gain.connect(this.sfxBus);
        gain.connect(this.reverbSend);
        osc.start(startT);
        osc.stop(startT + 0.48);
      });
    }

    // 3. SVG Callout Line Laser Draw + Telemetry Ticks
    playCalloutDraw(colorTheme = "cyan") {
      if (!this.initialized || this.isMuted || !this.sfxEnabled || !this.ctx)
        return;
      const now = this.ctx.currentTime;
      const baseF =
        colorTheme === "amber"
          ? 523.25
          : colorTheme === "silver"
            ? 659.25
            : 783.99;

      // Rapid telemetry ticks (simulating line extension & data lock)
      for (let i = 0; i < 5; i++) {
        const t0 = now + i * 0.045;
        const osc = this.ctx.createOscillator();
        const g = this.ctx.createGain();
        osc.type = "triangle";
        osc.frequency.setValueAtTime(baseF * (1 + i * 0.12), t0);

        g.gain.setValueAtTime(0.001, t0);
        g.gain.linearRampToValueAtTime(0.05, t0 + 0.006);
        g.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.04);

        osc.connect(g);
        g.connect(this.sfxBus);
        osc.start(t0);
        osc.stop(t0 + 0.045);
      }
    }

    // 4. Individual Subatomic Particle Ping (Proton = Warm Amber, Neutron = Crystalline Silver, Electron = Electric Cyan)
    playParticlePing(type = "proton", index = 0) {
      if (!this.initialized || this.isMuted || !this.sfxEnabled || !this.ctx)
        return;
      const now = this.ctx.currentTime;

      if (type === "proton") {
        // Warm resonant magnetic lock chime (Amber)
        const scale = [293.66, 349.23, 440.0, 587.33];
        const f = scale[index % scale.length];
        const osc1 = this.ctx.createOscillator();
        const osc2 = this.ctx.createOscillator();
        const g = this.ctx.createGain();

        osc1.type = "triangle";
        osc2.type = "sine";
        osc1.frequency.setValueAtTime(f, now);
        osc2.frequency.setValueAtTime(f * 1.5, now);

        g.gain.setValueAtTime(0.001, now);
        g.gain.linearRampToValueAtTime(0.14, now + 0.02);
        g.gain.exponentialRampToValueAtTime(0.0001, now + 0.75);

        osc1.connect(g);
        osc2.connect(g);
        g.connect(this.sfxBus);
        g.connect(this.reverbSend);
        osc1.start(now);
        osc2.start(now);
        osc1.stop(now + 0.8);
        osc2.stop(now + 0.8);
      } else if (type === "neutron") {
        // Crisp metallic/crystalline bell (Silver-White)
        const scale = [523.25, 587.33, 659.25, 783.99];
        const f = scale[index % scale.length];
        const osc = this.ctx.createOscillator();
        const harmonic = this.ctx.createOscillator();
        const g = this.ctx.createGain();

        osc.type = "sine";
        harmonic.type = "sine";
        osc.frequency.setValueAtTime(f, now);
        harmonic.frequency.setValueAtTime(f * 2.756, now); // Bell overtone ratio

        g.gain.setValueAtTime(0.001, now);
        g.gain.linearRampToValueAtTime(0.11, now + 0.01);
        g.gain.exponentialRampToValueAtTime(0.0001, now + 0.65);

        osc.connect(g);
        harmonic.connect(g);
        g.connect(this.sfxBus);
        g.connect(this.reverbSend);
        osc.start(now);
        harmonic.start(now);
        osc.stop(now + 0.7);
        harmonic.stop(now + 0.7);
      } else {
        // High-frequency electric quantum shimmer (Cyan Electron)
        const scale = [659.25, 783.99, 987.77, 1174.66];
        const f = scale[index % scale.length];
        const osc = this.ctx.createOscillator();
        const g = this.ctx.createGain();

        osc.type = "sine";
        osc.frequency.setValueAtTime(f * 0.85, now);
        osc.frequency.exponentialRampToValueAtTime(f, now + 0.08);

        g.gain.setValueAtTime(0.001, now);
        g.gain.linearRampToValueAtTime(0.12, now + 0.015);
        g.gain.exponentialRampToValueAtTime(0.0001, now + 0.55);

        osc.connect(g);
        g.connect(this.sfxBus);
        g.connect(this.reverbSend);
        osc.start(now);
        osc.stop(now + 0.6);
      }
    }

    // 5. Electron Orbital Pass-By Stereo Shimmer
    playElectronPassby(panDir = 0.6) {
      if (!this.initialized || this.isMuted || !this.sfxEnabled || !this.ctx)
        return;
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const g = this.ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(980, now);
      osc.frequency.exponentialRampToValueAtTime(1480, now + 0.25);
      osc.frequency.exponentialRampToValueAtTime(620, now + 0.65);

      g.gain.setValueAtTime(0.0001, now);
      g.gain.linearRampToValueAtTime(0.06, now + 0.22);
      g.gain.exponentialRampToValueAtTime(0.0001, now + 0.7);

      if (this.ctx.createStereoPanner) {
        const panner = this.ctx.createStereoPanner();
        panner.pan.setValueAtTime(-panDir, now);
        panner.pan.linearRampToValueAtTime(panDir, now + 0.65);
        osc.connect(g);
        g.connect(panner);
        panner.connect(this.sfxBus);
        panner.connect(this.reverbSend);
      } else {
        osc.connect(g);
        g.connect(this.sfxBus);
      }

      osc.start(now);
      osc.stop(now + 0.72);
    }

    // 6. Deep Cinematic Impact / Formula Resolution Chord
    playCinematicImpact(rootFreq = 146.83, duration = 1.8) {
      if (!this.initialized || this.isMuted || !this.sfxEnabled || !this.ctx)
        return;
      const now = this.ctx.currentTime;
      const ratios = [0.5, 1.0, 1.5, 2.0, 2.5];

      ratios.forEach((r, idx) => {
        const osc = this.ctx.createOscillator();
        const g = this.ctx.createGain();
        osc.type = idx === 0 ? "sine" : "triangle";
        osc.frequency.setValueAtTime(rootFreq * r, now);

        g.gain.setValueAtTime(0.001, now);
        g.gain.linearRampToValueAtTime(0.09 / (idx + 1), now + 0.03);
        g.gain.exponentialRampToValueAtTime(0.0001, now + duration);

        osc.connect(g);
        g.connect(this.sfxBus);
        g.connect(this.reverbSend);
        osc.start(now);
        osc.stop(now + duration + 0.05);
      });
    }

    // 7. Subtle Interactive UI Click / Scrubbing Tick
    playUIClick(freq = 720) {
      if (!this.initialized || this.isMuted || !this.sfxEnabled || !this.ctx)
        return;
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const g = this.ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, now);
      osc.frequency.exponentialRampToValueAtTime(freq * 1.4, now + 0.035);

      g.gain.setValueAtTime(0.04, now);
      g.gain.exponentialRampToValueAtTime(0.0001, now + 0.04);

      osc.connect(g);
      g.connect(this.sfxBus);
      osc.start(now);
      osc.stop(now + 0.045);
    }

    // ====================================================================
    // TIMELINE CUE SEQUENCER (Fires exact Foley & Motion SFX across 0-60s)
    // ====================================================================
    checkTimelineCues(prevT, currT) {
      // Reset fired cues when looping around 60.0s -> 0.0s or jumping backward
      if (currT < prevT) {
        this.firedCues.clear();
      }

      const cues = [
        // SCENE 01 (00:00 - 00:07): Journey into Matter
        {
          time: 0.15,
          id: "s1_start",
          fn: () => this.playCinematicImpact(73.42, 2.0),
        },
        {
          time: 0.8,
          id: "s1_badge",
          fn: () => this.playUIAppear("badge"),
        },
        {
          time: 1.4,
          id: "s1_title",
          fn: () => this.playUIAppear("title"),
        },
        {
          time: 2.3,
          id: "s1_sub",
          fn: () => this.playCalloutDraw("cyan"),
        },
        {
          time: 3.8,
          id: "s1_dive",
          fn: () => this.playCameraWhoosh("dive", 2.4),
        },

        // SCENE 02 (00:07 - 00:15): Introducing the Atom
        {
          time: 7.05,
          id: "s2_enter",
          fn: () => {
            this.playCameraWhoosh("dive", 1.4);
            this.playUIAppear("title");
          },
        },
        {
          time: 7.65,
          id: "s2_call1",
          fn: () => {
            this.playCalloutDraw("amber");
            this.playParticlePing("proton", 0);
          },
        },
        {
          time: 8.4,
          id: "s2_call2",
          fn: () => {
            this.playCalloutDraw("cyan");
            this.playParticlePing("electron", 1);
          },
        },
        {
          time: 11.2,
          id: "s2_pass1",
          fn: () => this.playElectronPassby(0.7),
        },
        {
          time: 13.5,
          id: "s2_pass2",
          fn: () => this.playElectronPassby(-0.7),
        },

        // SCENE 03 (00:15 - 00:27): Inside the Nucleus
        {
          time: 15.05,
          id: "s3_zoom",
          fn: () => this.playCameraWhoosh("zoomIn", 2.2),
        },
        {
          time: 16.0,
          id: "s3_expand",
          fn: () => this.playCinematicImpact(110.0, 1.5),
        },
        {
          time: 16.8,
          id: "s3_p_card",
          fn: () => this.playCalloutDraw("amber"),
        },
        {
          time: 17.5,
          id: "s3_p1",
          fn: () => this.playParticlePing("proton", 0),
        },
        {
          time: 18.1,
          id: "s3_p2",
          fn: () => this.playParticlePing("proton", 1),
        },
        {
          time: 18.7,
          id: "s3_p3",
          fn: () => this.playParticlePing("proton", 2),
        },
        {
          time: 19.6,
          id: "s3_n_card",
          fn: () => this.playCalloutDraw("silver"),
        },
        {
          time: 20.4,
          id: "s3_n1",
          fn: () => this.playParticlePing("neutron", 0),
        },
        {
          time: 21.0,
          id: "s3_n2",
          fn: () => this.playParticlePing("neutron", 1),
        },
        {
          time: 21.6,
          id: "s3_n3",
          fn: () => this.playParticlePing("neutron", 2),
        },
        {
          time: 22.2,
          id: "s3_n4",
          fn: () => this.playParticlePing("neutron", 3),
        },
        {
          time: 24.8,
          id: "s3_pull",
          fn: () => this.playCameraWhoosh("pullOut", 1.8),
        },

        // SCENE 04 (00:27 - 00:37): The Electron Region
        {
          time: 27.05,
          id: "s4_enter",
          fn: () => {
            this.playCameraWhoosh("pullOut", 1.6);
            this.playUIAppear("title");
          },
        },
        {
          time: 27.9,
          id: "s4_e_card",
          fn: () => {
            this.playCalloutDraw("cyan");
            this.playParticlePing("electron", 2);
          },
        },
        {
          time: 29.2,
          id: "s4_note",
          fn: () => this.playUIAppear("card"),
        },
        {
          time: 30.8,
          id: "s4_orb1",
          fn: () => this.playElectronPassby(0.8),
        },
        {
          time: 32.8,
          id: "s4_orb2",
          fn: () => this.playElectronPassby(-0.8),
        },
        {
          time: 34.8,
          id: "s4_orb3",
          fn: () => this.playElectronPassby(0.6),
        },

        // SCENE 05 (00:37 - 00:47): Understanding Atomic Number (Synchronized Counting!)
        {
          time: 37.05,
          id: "s5_enter",
          fn: () => {
            this.playCameraWhoosh("dive", 1.2);
            this.playUIAppear("title");
          },
        },
        // Count 3 Protons
        {
          time: 38.0,
          id: "s5_cp1",
          fn: () => this.playParticlePing("proton", 0),
        },
        {
          time: 38.45,
          id: "s5_cp2",
          fn: () => this.playParticlePing("proton", 1),
        },
        {
          time: 38.9,
          id: "s5_cp3",
          fn: () => this.playParticlePing("proton", 2),
        },
        // Count 4 Neutrons
        {
          time: 39.8,
          id: "s5_cn1",
          fn: () => this.playParticlePing("neutron", 0),
        },
        {
          time: 40.2,
          id: "s5_cn2",
          fn: () => this.playParticlePing("neutron", 1),
        },
        {
          time: 40.6,
          id: "s5_cn3",
          fn: () => this.playParticlePing("neutron", 2),
        },
        {
          time: 41.0,
          id: "s5_cn4",
          fn: () => this.playParticlePing("neutron", 3),
        },
        // Count 3 Electrons
        {
          time: 41.9,
          id: "s5_ce1",
          fn: () => this.playParticlePing("electron", 0),
        },
        {
          time: 42.35,
          id: "s5_ce2",
          fn: () => this.playParticlePing("electron", 1),
        },
        {
          time: 42.8,
          id: "s5_ce3",
          fn: () => this.playParticlePing("electron", 2),
        },
        // Formula Locks
        {
          time: 43.6,
          id: "s5_f1",
          fn: () => this.playCinematicImpact(146.83, 1.4),
        },
        {
          time: 45.0,
          id: "s5_f2",
          fn: () => this.playCinematicImpact(174.61, 1.8),
        },

        // SCENE 06 (00:47 - 00:60): Final Reveal & Seamless Loop
        {
          time: 47.05,
          id: "s6_enter",
          fn: () => {
            this.playCameraWhoosh("pullOut", 2.0);
            this.playUIAppear("title");
          },
        },
        {
          time: 48.0,
          id: "s6_c1",
          fn: () => this.playParticlePing("proton", 2),
        },
        {
          time: 48.7,
          id: "s6_c2",
          fn: () => this.playParticlePing("neutron", 2),
        },
        {
          time: 49.4,
          id: "s6_c3",
          fn: () => this.playParticlePing("electron", 2),
        },
        {
          time: 54.8,
          id: "s6_loop_whoosh",
          fn: () => this.playCameraWhoosh("pullOut", 3.6),
        },
        {
          time: 58.2,
          id: "s6_bridge",
          fn: () => this.playCinematicImpact(110.0, 2.0),
        },
      ];

      for (let i = 0; i < cues.length; i++) {
        const c = cues[i];
        if (
          !this.firedCues.has(c.id) &&
          currT >= c.time &&
          currT - prevT < 1.0 &&
          prevT <= c.time
        ) {
          this.firedCues.add(c.id);
          c.fn();
        }
      }
    }

    // Draw Live Real-Time Audio Spectrum Equalizer in Footer
    renderSpectrum(canvasCtx, width, height) {
      canvasCtx.clearRect(0, 0, width, height);
      const barCount = 14;
      const barWidth = 4;
      const gap = 2;

      if (!this.initialized || this.isMuted || !this.analyser) {
        // Draw subtle idle baseline dots
        canvasCtx.fillStyle = "rgba(0, 240, 255, 0.22)";
        for (let i = 0; i < barCount; i++) {
          const x = i * (barWidth + gap) + 2;
          canvasCtx.fillRect(x, height - 3, barWidth, 2);
        }
        return;
      }

      this.analyser.getByteFrequencyData(this.freqData);
      for (let i = 0; i < barCount; i++) {
        const val = this.freqData[i + 1] || 0;
        const normalized = val / 255.0;
        const barH = Math.max(2, normalized * (height - 2));
        const x = i * (barWidth + gap) + 2;
        const y = height - barH;

        canvasCtx.fillStyle = i > 9 ? "#ff8c1a" : i > 4 ? "#00f0ff" : "#0066ff";
        canvasCtx.fillRect(x, y, barWidth, barH);
      }
    }
  }

  const audioEngine = new CinematicAtomicAudioStudio();
  const spectrumCanvas = document.getElementById("audio-spectrum-canvas");
  const spectrumCtx = spectrumCanvas ? spectrumCanvas.getContext("2d") : null;

  // ------------------------------------------------------------------------
  // 3. THREE.JS SCENE, CAMERA & LIGHTING SETUP
  // ------------------------------------------------------------------------
  const stageEl = document.getElementById("cinematic-stage");
  const canvasEl = document.getElementById("webgl-canvas");
  const badgesContainer = document.getElementById("particle-badges-container");

  if (!window.THREE) {
    stageEl.classList.add("webgl-unavailable");
    console.error("Three.js could not be loaded; the 3D experience is unavailable.");
    return;
  }

  const pointerCoarse =
    window.matchMedia && window.matchMedia("(pointer: coarse)").matches;
  const deviceMemory = Number(navigator.deviceMemory) || 0;
  const hardwareCores = Number(navigator.hardwareConcurrency) || 0;
  const lowPowerDevice =
    pointerCoarse &&
    ((deviceMemory > 0 && deviceMemory <= 3) ||
      (hardwareCores > 0 && hardwareCores <= 4 && deviceMemory > 0 && deviceMemory <= 4));
  const compactDevice = pointerCoarse || window.innerWidth <= 768;
  const targetFPS = lowPowerDevice ? 30 : compactDevice ? 45 : 60;
  const frameInterval = 1000 / targetFPS;

  const scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x040814, 0.012);

  const camera = new THREE.PerspectiveCamera(45, 16 / 9, 0.1, 300);
  camera.position.set(0, 2, 42);

  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({
      canvas: canvasEl,
      antialias: !lowPowerDevice,
      alpha: true,
      powerPreference: compactDevice ? "default" : "high-performance",
    });
  } catch (error) {
    stageEl.classList.add("webgl-unavailable");
    console.error("WebGL initialization failed:", error);
    return;
  }
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.15;

  const viewportState = {
    width: 1,
    height: 1,
    aspect: 16 / 9,
    isPortrait: false,
    cameraDistanceFactor: 1,
    targetPixelRatio: 1,
    needsSceneRefresh: true,
  };
  const calloutSvg = document.getElementById("svg-callout-layer");

  function handleResize() {
    const rect = stageEl.getBoundingClientRect();
    const w = Math.max(1, rect.width);
    const h = Math.max(1, rect.height);
    const aspect = w / h;
    const isPortrait = aspect < 0.95;
    const cameraFov = aspect < 0.95 ? 54 : aspect < 1.35 ? 48 : 45;
    const cameraDistanceFactor = aspect < 0.95 ? clamp(1.04 / aspect, 1, 2.3) : 1;
    const pixelRatioCap = lowPowerDevice
      ? 1.0
      : compactDevice
        ? 1.4
        : aspect < 1.2
          ? 1.55
          : 2.0;
    const pixelRatio = Math.min(window.devicePixelRatio || 1, pixelRatioCap);

    viewportState.width = w;
    viewportState.height = h;
    viewportState.aspect = aspect;
    viewportState.isPortrait = isPortrait;
    viewportState.cameraDistanceFactor = cameraDistanceFactor;
    viewportState.targetPixelRatio = pixelRatio;
    viewportState.needsSceneRefresh = true;

    camera.aspect = aspect;
    camera.fov = cameraFov;
    camera.updateProjectionMatrix();
    if (Math.abs(renderer.getPixelRatio() - pixelRatio) > 0.01) {
      renderer.setPixelRatio(pixelRatio);
    }
    renderer.setSize(w, h, false);
    if (calloutSvg) {
      calloutSvg.setAttribute("viewBox", `0 0 ${w} ${h}`);
    }
  }

  window.addEventListener("resize", handleResize, { passive: true });
  window.addEventListener("orientationchange", handleResize, { passive: true });
  if (window.visualViewport) {
    window.visualViewport.addEventListener("resize", handleResize, { passive: true });
  }
  if (window.ResizeObserver) {
    const stageResizeObserver = new ResizeObserver(handleResize);
    stageResizeObserver.observe(stageEl);
  }
  handleResize();

  // Cinematic 3-Point Scientific Lighting + Nucleus Core Point Light
  const ambientLight = new THREE.AmbientLight(0x1e3a5f, 1.35);
  scene.add(ambientLight);

  const keyLight = new THREE.DirectionalLight(0xe0f2fe, 2.2);
  keyLight.position.set(18, 24, 22);
  scene.add(keyLight);

  const rimLight = new THREE.DirectionalLight(0x00f0ff, 1.65);
  rimLight.position.set(-22, -14, -18);
  scene.add(rimLight);

  const warmFillLight = new THREE.DirectionalLight(0xff8c1a, 1.1);
  warmFillLight.position.set(12, -18, 10);
  scene.add(warmFillLight);

  const nucleusCoreLight = new THREE.PointLight(0xff8c1a, 2.4, 18);
  nucleusCoreLight.position.set(0, 0, 0);
  scene.add(nucleusCoreLight);

  // ------------------------------------------------------------------------
  // 4. 3D WORLD CONSTRUCTION: MACROSCOPIC LATTICE & LITHIUM-7 ATOM
  // ------------------------------------------------------------------------

  // A. Deep Background Quantum Dust Field
  const starCount = lowPowerDevice ? 420 : 700;
  const starGeo = new THREE.BufferGeometry();
  const starPos = new Float32Array(starCount * 3);
  const starColors = new Float32Array(starCount * 3);
  for (let i = 0; i < starCount; i++) {
    const r = 22 + Math.random() * 75;
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);
    starPos[i * 3] = r * Math.sin(phi) * Math.cos(theta);
    starPos[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
    starPos[i * 3 + 2] = r * Math.cos(phi);

    const isCyan = Math.random() > 0.25;
    starColors[i * 3] = isCyan ? 0.0 : 1.0;
    starColors[i * 3 + 1] = isCyan ? 0.85 : 0.6;
    starColors[i * 3 + 2] = isCyan ? 1.0 : 0.2;
  }
  starGeo.setAttribute("position", new THREE.BufferAttribute(starPos, 3));
  starGeo.setAttribute("color", new THREE.BufferAttribute(starColors, 3));
  const starMat = new THREE.PointsMaterial({
    size: 0.26,
    vertexColors: true,
    transparent: true,
    opacity: 0.55,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });
  const starField = new THREE.Points(starGeo, starMat);
  scene.add(starField);

  // B. Scene 01 & 06 Macroscopic Crystalline Matter Lattice
  const latticeGroup = new THREE.Group();
  scene.add(latticeGroup);

  const latticeNodeGeo = new THREE.SphereGeometry(0.28, 16, 16);
  const latticeNodeMat = new THREE.MeshStandardMaterial({
    color: 0x00d2b4,
    emissive: 0x004466,
    roughness: 0.25,
    metalness: 0.6,
    transparent: true,
    opacity: 0.85,
  });

  const gridRange = 2;
  const spacing = 5.5;
  const latticePositions = [];
  const latticeNodeCount = Math.pow(gridRange * 2 + 1, 3) - 1;
  const latticeNodeMeshes = new THREE.InstancedMesh(
    latticeNodeGeo,
    latticeNodeMat,
    latticeNodeCount,
  );
  const latticeNodeDummy = new THREE.Object3D();
  let latticeNodeIndex = 0;

  for (let x = -gridRange; x <= gridRange; x++) {
    for (let y = -gridRange; y <= gridRange; y++) {
      for (let z = -gridRange; z <= gridRange; z++) {
        // Leave the very center (0,0,0) for our hero Lithium-7 atom
        if (x === 0 && y === 0 && z === 0) continue;
        const pos = new THREE.Vector3(x * spacing, y * spacing, z * spacing);
        latticePositions.push(pos);
        latticeNodeDummy.position.copy(pos);
        latticeNodeDummy.updateMatrix();
        latticeNodeMeshes.setMatrixAt(latticeNodeIndex++, latticeNodeDummy.matrix);
      }
    }
  }
  latticeNodeMeshes.instanceMatrix.needsUpdate = true;
  if (latticeNodeMeshes.computeBoundingSphere) {
    latticeNodeMeshes.computeBoundingSphere();
  }
  latticeGroup.add(latticeNodeMeshes);

  // Crystalline Bond Lines
  const bondPoints = [];
  for (let i = 0; i < latticePositions.length; i++) {
    for (let j = i + 1; j < latticePositions.length; j++) {
      const d = latticePositions[i].distanceTo(latticePositions[j]);
      if (Math.abs(d - spacing) < 0.1) {
        bondPoints.push(
          latticePositions[i].clone(),
          latticePositions[j].clone(),
        );
      }
    }
  }
  const bondGeo = new THREE.BufferGeometry().setFromPoints(bondPoints);
  const bondMat = new THREE.LineBasicMaterial({
    color: 0x00f0ff,
    transparent: true,
    opacity: 0.22,
    blending: THREE.AdditiveBlending,
  });
  const bondLines = new THREE.LineSegments(bondGeo, bondMat);
  latticeGroup.add(bondLines);

  // C. Central Hero Atom Group (Lithium-7: 3 Protons, 4 Neutrons, 3 Electrons)
  const atomGroup = new THREE.Group();
  scene.add(atomGroup);

  const nucleusGroup = new THREE.Group();
  atomGroup.add(nucleusGroup);

  const electronCloudGroup = new THREE.Group();
  atomGroup.add(electronCloudGroup);

  // Nucleon Geometry & Materials
  const nucleonSegments = lowPowerDevice ? 24 : 32;
  const nucleonGeo = new THREE.SphereGeometry(0.62, nucleonSegments, nucleonSegments);

  const protonMat = new THREE.MeshStandardMaterial({
    color: 0xff8c1a,
    emissive: 0xd95300,
    emissiveIntensity: 0.45,
    roughness: 0.22,
    metalness: 0.35,
  });

  const neutronMat = new THREE.MeshStandardMaterial({
    color: 0xe2e8f0,
    emissive: 0x334155,
    emissiveIntensity: 0.25,
    roughness: 0.18,
    metalness: 0.65,
  });

  // Helper to create soft radial glow halo around particles
  function createHaloMesh(hexColor, scaleSize) {
    const haloSegments = lowPowerDevice ? 14 : 20;
    const geo = new THREE.SphereGeometry(scaleSize, haloSegments, haloSegments);
    const mat = new THREE.MeshBasicMaterial({
      color: hexColor,
      transparent: true,
      opacity: 0.18,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    return new THREE.Mesh(geo, mat);
  }

  // 3 Protons (Amber +) & 4 Neutrons (Silver 0) compact & expanded positions
  const protonCompactDirs = [
    new THREE.Vector3(0.58, 0.42, 0.32),
    new THREE.Vector3(-0.62, 0.35, -0.38),
    new THREE.Vector3(0.08, -0.68, 0.45),
  ];

  const neutronCompactDirs = [
    new THREE.Vector3(-0.42, -0.45, 0.55),
    new THREE.Vector3(0.55, -0.35, -0.52),
    new THREE.Vector3(-0.15, 0.68, -0.42),
    new THREE.Vector3(0.0, 0.05, -0.72),
  ];

  const protons = [];
  const neutrons = [];
  const electrons = [];
  const particleBadges = [];

  function createBadgeDOM(symbol, className) {
    const div = document.createElement("div");
    div.className = `particle-badge ${className}`;
    div.textContent = symbol;
    div.style.opacity = "0";
    badgesContainer.appendChild(div);
    return div;
  }

  // Build 3 Protons
  protonCompactDirs.forEach((dir, i) => {
    const mesh = new THREE.Mesh(nucleonGeo, protonMat.clone());
    const halo = createHaloMesh(0xff8c1a, 0.92);
    mesh.add(halo);
    nucleusGroup.add(mesh);

    const badge = createBadgeDOM("+", "badge-proton");
    const pObj = {
      type: "proton",
      index: i,
      mesh,
      halo,
      badge,
      compactPos: dir.clone(),
      expandedPos: dir.clone().normalize().multiplyScalar(2.05),
      phase: i * 2.1,
    };
    protons.push(pObj);
    particleBadges.push(pObj);
  });

  // Build 4 Neutrons
  neutronCompactDirs.forEach((dir, i) => {
    const mesh = new THREE.Mesh(nucleonGeo, neutronMat.clone());
    const halo = createHaloMesh(0xe2e8f0, 0.88);
    mesh.add(halo);
    nucleusGroup.add(mesh);

    const badge = createBadgeDOM("۰", "badge-neutron");
    const nObj = {
      type: "neutron",
      index: i,
      mesh,
      halo,
      badge,
      compactPos: dir.clone(),
      expandedPos: dir.clone().normalize().multiplyScalar(2.25),
      phase: i * 1.7 + 0.5,
    };
    neutrons.push(nObj);
    particleBadges.push(nObj);
  });

  // D. Volumetric Electron Probability Cloud Shells (Custom Fresnel Shader)
  const fresnelVertexShader = `
        varying vec3 vNormal;
        varying vec3 vViewPosition;
        void main() {
            vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
            vNormal = normalize(normalMatrix * normal);
            vViewPosition = -mvPosition.xyz;
            gl_Position = projectionMatrix * mvPosition;
        }
    `;

  const fresnelFragmentShader = `
        uniform vec3 uColor;
        uniform float uOpacity;
        varying vec3 vNormal;
        varying vec3 vViewPosition;
        void main() {
            vec3 normal = normalize(vNormal);
            vec3 viewDir = normalize(vViewPosition);
            float fresnel = pow(1.0 - abs(dot(normal, viewDir)), 2.2);
            gl_FragColor = vec4(uColor, fresnel * uOpacity);
        }
    `;

  function createProbabilityShell(radius, hexColor, baseOpacity) {
    const shellSegments = lowPowerDevice ? 32 : 48;
    const geo = new THREE.SphereGeometry(radius, shellSegments, shellSegments);
    const mat = new THREE.ShaderMaterial({
      vertexShader: fresnelVertexShader,
      fragmentShader: fresnelFragmentShader,
      uniforms: {
        uColor: { value: new THREE.Color(hexColor) },
        uOpacity: { value: baseOpacity },
      },
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      side: THREE.DoubleSide,
    });
    return new THREE.Mesh(geo, mat);
  }

  // Inner Shell (K-shell, n=1, radius = 4.6) & Outer Shell (L-shell, n=2, radius = 7.6)
  const shellKMesh = createProbabilityShell(4.6, 0x00f0ff, 0.36);
  const shellLMesh = createProbabilityShell(7.6, 0x0066ff, 0.28);
  electronCloudGroup.add(shellKMesh);
  electronCloudGroup.add(shellLMesh);

  // 3D Quantum Wave Orbital Guide Curves (Non-planar spherical harmonic wave paths)
  const electronConfigs = [
    {
      shellRadius: 4.6,
      speed: 1.85,
      tiltX: 0.55,
      tiltZ: 0.35,
      waveAmp: 0.35,
      phaseOffset: 0.0,
    },
    {
      shellRadius: 4.6,
      speed: 1.75,
      tiltX: -0.65,
      tiltZ: 0.85,
      waveAmp: 0.35,
      phaseOffset: Math.PI,
    },
    {
      shellRadius: 7.6,
      speed: 1.25,
      tiltX: 0.32,
      tiltZ: -0.6,
      waveAmp: 0.55,
      phaseOffset: 1.2,
    },
  ];

  electronConfigs.forEach((cfg) => {
    cfg.rotation = new THREE.Euler(cfg.tiltX, 0, cfg.tiltZ, "XYZ");
  });

  function computeQuantumElectronPos(cfg, timeSec, target = new THREE.Vector3()) {
    const angle = timeSec * cfg.speed + cfg.phaseOffset;
    const r = cfg.shellRadius + Math.sin(angle * 3.0) * cfg.waveAmp;
    const x0 = r * Math.cos(angle);
    const y0 = Math.sin(angle * 2.0) * (cfg.waveAmp * 1.8);
    const z0 = r * Math.sin(angle);

    return target.set(x0, y0, z0).applyEuler(cfg.rotation);
  }

  const electronGeo = new THREE.SphereGeometry(0.26, 24, 24);
  const electronMat = new THREE.MeshBasicMaterial({ color: 0x00f0ff });
  const orbitalTrails = [];

  electronConfigs.forEach((cfg, idx) => {
    const eMesh = new THREE.Mesh(electronGeo, electronMat.clone());
    const eHalo = createHaloMesh(0x00f0ff, 0.62);
    eMesh.add(eHalo);
    electronCloudGroup.add(eMesh);

    // Precompute full 3D wave path ring for educational visualization
    const curvePts = [];
    const segments = lowPowerDevice ? 88 : 120;
    for (let s = 0; s <= segments; s++) {
      const fakeT = (s / segments) * ((Math.PI * 2) / cfg.speed);
      curvePts.push(computeQuantumElectronPos(cfg, fakeT));
    }
    const trailGeo = new THREE.BufferGeometry().setFromPoints(curvePts);
    const trailMat = new THREE.LineBasicMaterial({
      color: idx < 2 ? 0x00f0ff : 0x38bdf8,
      transparent: true,
      opacity: 0.32,
      blending: THREE.AdditiveBlending,
    });
    const trailLine = new THREE.Line(trailGeo, trailMat);
    electronCloudGroup.add(trailLine);
    orbitalTrails.push(trailMat);

    const badge = createBadgeDOM("−", "badge-electron");
    const eObj = {
      type: "electron",
      index: idx,
      mesh: eMesh,
      halo: eHalo,
      badge,
      cfg,
      positionScratch: new THREE.Vector3(),
    };
    electrons.push(eObj);
    particleBadges.push(eObj);
  });

  // ------------------------------------------------------------------------
  // 5. DOM REFERENCES FOR HUD, SCENES, CALLOUTS & COUNTERS
  // ------------------------------------------------------------------------
  const hudSceneTitle = document.getElementById("hud-scene-title");
  const hudScaleReadout = document.getElementById("hud-scale-readout");
  const timecodeDisplay = document.getElementById("timecode-display");
  const timelineProgress = document.getElementById("timeline-progress");
  const timelineThumb = document.getElementById("timeline-thumb");

  const sceneEls = [
    document.getElementById("scene-1"),
    document.getElementById("scene-2"),
    document.getElementById("scene-3"),
    document.getElementById("scene-4"),
    document.getElementById("scene-5"),
    document.getElementById("scene-6"),
  ];

  const callout1Group = document.getElementById("callout-1");
  const c1Dot = document.getElementById("c1-dot");
  const c1Ring = document.getElementById("c1-ring");
  const c1Line = document.getElementById("c1-line");

  const callout2Group = document.getElementById("callout-2");
  const c2Dot = document.getElementById("c2-dot");
  const c2Ring = document.getElementById("c2-ring");
  const c2Line = document.getElementById("c2-line");

  // Scene 5 Live Counter DOM Elements
  const rowCountProton = document.getElementById("row-count-proton");
  const rowCountNeutron = document.getElementById("row-count-neutron");
  const rowCountElectron = document.getElementById("row-count-electron");
  const valCountProton = document.getElementById("val-count-proton");
  const valCountNeutron = document.getElementById("val-count-neutron");
  const valCountElectron = document.getElementById("val-count-electron");
  const cardFormula1 = document.getElementById("card-formula-1");
  const cardFormula2 = document.getElementById("card-formula-2");

  const sceneTitles = [
    "بخش اول: سفر به درون ماده (۰۰:۰۰ تا ۰۰:۰۷)",
    "بخش دوم: معرفی بخش‌های اتم (۰۰:۰۷ تا ۰۰:۱۵)",
    "بخش سوم: شکافت و بررسی درون هسته (۰۰:۱۵ تا ۰۰:۲۷)",
    "بخش چهارم: ناحیه و ابر الکترونی (۰۰:۲۷ تا ۰۰:۳۷)",
    "بخش پنجم: عدد اتمی و اتم خنثی (۰۰:۳۷ تا ۰۰:۴۷)",
    "بخش ششم: نمای کامل اتم لیتیم (۰۰:۴۷ تا ۰۱:۰۰)",
  ];

  // ------------------------------------------------------------------------
  // 6. 3D-TO-2D SCREEN PROJECTION HELPERS FOR CALLOUTS & PARTICLE BADGES
  // ------------------------------------------------------------------------
  const tempProjVec = new THREE.Vector3();

  function project3DToSVG(worldPos) {
    tempProjVec.copy(worldPos);
    tempProjVec.project(camera);
    const x = (tempProjVec.x * 0.5 + 0.5) * viewportState.width;
    const y = (-tempProjVec.y * 0.5 + 0.5) * viewportState.height;
    return { x, y, z: tempProjVec.z };
  }

  function updateSVGCallout(
    groupEl,
    dotEl,
    ringEl,
    lineEl,
    worldAnchor,
    elbowX,
    elbowY,
    endX,
    endY,
    opacity,
  ) {
    groupEl.setAttribute("opacity", opacity.toFixed(2));
    if (opacity <= 0.02) return;
    const pt = project3DToSVG(worldAnchor);
    dotEl.setAttribute("cx", pt.x.toFixed(1));
    dotEl.setAttribute("cy", pt.y.toFixed(1));
    ringEl.setAttribute("cx", pt.x.toFixed(1));
    ringEl.setAttribute("cy", pt.y.toFixed(1));
    lineEl.setAttribute(
      "points",
      `${pt.x.toFixed(1)},${pt.y.toFixed(1)} ${elbowX},${elbowY} ${endX},${endY}`,
    );
  }

  // ------------------------------------------------------------------------
  // 7. MASTER 60-SECOND SCIENTIFIC CHOREOGRAPHY ENGINE
  // ------------------------------------------------------------------------
  const worldPosHelper = new THREE.Vector3();

  function updateChoreography(t) {
    // Determine active scene (1..6)
    let newScene = 1;
    if (t < 7.0) newScene = 1;
    else if (t < 15.0) newScene = 2;
    else if (t < 27.0) newScene = 3;
    else if (t < 37.0) newScene = 4;
    else if (t < 47.0) newScene = 5;
    else newScene = 6;

    if (newScene !== currentSceneIndex) {
      currentSceneIndex = newScene;
      sceneEls.forEach((el, idx) => {
        if (idx === currentSceneIndex - 1) {
          el.classList.add("active");
        } else {
          el.classList.remove("active");
        }
      });
      hudSceneTitle.textContent = sceneTitles[currentSceneIndex - 1];
    }

    // Seamless loop fade for Scene 6 text during final 3.5 seconds (56.5s -> 60.0s)
    if (currentSceneIndex === 6) {
      const fadeOut = 1.0 - smoothstep(56.5, 59.6, t);
      sceneEls[5].style.opacity = String(fadeOut);
    } else {
      sceneEls[5].style.opacity = "";
    }

    // ====================================================================
    // SCENE 05 SYNCHRONIZED ANIMATED PARTICLE COUNTERS & FORMULA PULSES
    // ====================================================================
    if (currentSceneIndex === 5) {
      // Animated Proton count (38.0s -> 39.2s)
      let pCount = 0;
      if (t >= 38.9) pCount = 3;
      else if (t >= 38.45) pCount = 2;
      else if (t >= 38.0) pCount = 1;
      else pCount = 0;
      valCountProton.textContent = `${toPersianNum(pCount)} عدد (+${toPersianNum(pCount)})`;
      rowCountProton.classList.toggle(
        "counter-highlight-amber",
        t >= 37.95 && t <= 39.45,
      );

      // Animated Neutron count (39.8s -> 41.2s)
      let nCount = 0;
      if (t >= 41.0) nCount = 4;
      else if (t >= 40.6) nCount = 3;
      else if (t >= 40.2) nCount = 2;
      else if (t >= 39.8) nCount = 1;
      valCountNeutron.textContent = `${toPersianNum(nCount)} عدد (۰)`;
      rowCountNeutron.classList.toggle(
        "counter-highlight-silver",
        t >= 39.75 && t <= 41.5,
      );

      // Animated Electron count (41.9s -> 43.2s)
      let eCount = 0;
      if (t >= 42.8) eCount = 3;
      else if (t >= 42.35) eCount = 2;
      else if (t >= 41.9) eCount = 1;
      valCountElectron.textContent = `${toPersianNum(eCount)} عدد (−${toPersianNum(eCount)})`;
      rowCountElectron.classList.toggle(
        "counter-highlight-cyan",
        t >= 41.85 && t <= 43.35,
      );

      // Formula 1 & Formula 2 highlight locks
      cardFormula1.classList.toggle(
        "counter-highlight-amber",
        t >= 43.55 && t <= 44.85,
      );
      cardFormula2.classList.toggle(
        "counter-highlight-cyan",
        t >= 44.95 && t <= 46.5,
      );
    }

    // ====================================================================
    // CAMERA SPLINE & SCALE CHOREOGRAPHY ACROSS 60 SECONDS
    // ====================================================================
    let camRadius = 42.0;
    let camElevation = 2.0;
    let camAzimuth = t * 0.22;
    let scaleExponent = -2;

    if (t < 7.0) {
      // Scene 1: Glide from macroscopic crystal lattice (R=42) to single atom (R=16.5)
      const k = smootherstep(0.0, 7.0, t);
      camRadius = lerp(42.0, 16.5, k);
      camElevation = lerp(4.0, 2.2, k);
      scaleExponent = Math.round(lerp(-2, -10, k));
    } else if (t < 15.0) {
      // Scene 2: Orbit full atom showing Nucleus vs Electron Cloud
      const k = smootherstep(7.0, 15.0, t);
      camRadius = lerp(16.5, 14.5, k);
      camElevation = 2.2 + Math.sin(t * 0.5) * 1.2;
      scaleExponent = -10;
    } else if (t < 27.0) {
      // Scene 3: Push inside the Nucleus (R=6.2) to inspect Protons & Neutrons
      const pushIn = smootherstep(15.0, 18.0, t);
      const pullBack = smootherstep(24.5, 27.0, t);
      camRadius = lerp(14.5, 6.2, pushIn);
      camRadius = lerp(camRadius, 17.5, pullBack);
      camElevation = lerp(2.2, 0.9, pushIn);
      scaleExponent = Math.round(lerp(-10, -15, pushIn - pullBack));
    } else if (t < 37.0) {
      // Scene 4: Wide orbital view of the 3D Electron Probability Shells
      const k = smootherstep(27.0, 37.0, t);
      camRadius = lerp(17.5, 16.0, k);
      camElevation = 3.2 * Math.sin((t - 27.0) * 0.45);
      scaleExponent = -10;
    } else if (t < 47.0) {
      // Scene 5: Diagnostic framing for Atomic Number & Neutral Atom comparison
      const k = smootherstep(37.0, 40.0, t);
      camRadius = lerp(16.0, 14.2, k);
      camElevation = 1.6;
      scaleExponent = -10;
    } else {
      // Scene 6: Grand reveal & seamless pull-back to R=42.0 at t=60.0s
      const loopBack = smootherstep(54.5, 60.0, t);
      camRadius = lerp(14.2, 42.0, loopBack);
      camElevation = lerp(1.6, 4.0, loopBack);
      scaleExponent = Math.round(lerp(-10, -2, loopBack));
    }

    hudScaleReadout.textContent = `10^${scaleExponent} m`;

    // Smoothly interpolate user drag offset
    userOrbitOffset.theta = lerp(
      userOrbitOffset.theta,
      targetOrbitOffset.theta,
      0.1,
    );
    userOrbitOffset.phi = lerp(userOrbitOffset.phi, targetOrbitOffset.phi, 0.1);

    const finalTheta = camAzimuth + userOrbitOffset.theta;
    const finalY = clamp(camElevation + userOrbitOffset.phi * 8.0, -12.0, 12.0);

    const responsiveCamRadius = camRadius * viewportState.cameraDistanceFactor;
    camera.position.x = responsiveCamRadius * Math.sin(finalTheta);
    camera.position.z = responsiveCamRadius * Math.cos(finalTheta);
    camera.position.y = finalY * viewportState.cameraDistanceFactor;
    camera.lookAt(0, 0, 0);

    // ====================================================================
    // LATTICE OPACITY & ROTATION (Seamless match at t=0 and t=60)
    // ====================================================================
    let latticeVisibility = 0.0;
    if (t < 6.5) {
      latticeVisibility = 1.0 - smoothstep(2.5, 6.2, t);
    } else if (t > 54.0) {
      latticeVisibility = smoothstep(54.5, 59.5, t);
    }
    latticeGroup.visible = latticeVisibility > 0.01;
    latticeNodeMat.opacity = latticeVisibility * 0.85;
    bondMat.opacity = latticeVisibility * 0.25;
    latticeGroup.rotation.y = t * ((Math.PI * 2) / TOTAL_DURATION);

    // ====================================================================
    // NUCLEUS EXPANSION & SUBATOMIC PARTICLE ANIMATION
    // ====================================================================
    // Expand nucleons apart in Scene 3 (15.5s -> 25.5s) and slightly in Scene 5
    let nucleonExpand = 0.0;
    if (t >= 15.0 && t <= 27.0) {
      nucleonExpand =
        smootherstep(15.5, 17.8, t) * (1.0 - smootherstep(24.5, 26.8, t));
    } else if (t >= 37.0 && t <= 47.0) {
      nucleonExpand =
        0.35 *
        smootherstep(37.2, 38.5, t) *
        (1.0 - smootherstep(45.5, 47.0, t));
    }

    // Subtle nuclear rotation
    nucleusGroup.rotation.y = t * 0.35;
    nucleusGroup.rotation.x = Math.sin(t * 0.25) * 0.2;

    // Animate 3 Protons
    protons.forEach((p, idx) => {
      p.mesh.position.lerpVectors(p.compactPos, p.expandedPos, nucleonExpand);
      // Subtle quantum vibration
      p.mesh.position.x += Math.sin(t * 5.0 + p.phase) * 0.04;
      p.mesh.position.y += Math.cos(t * 4.5 + p.phase) * 0.04;

      // Highlight pulse during Scene 3 Proton focus (17s-20s) or Scene 5 Proton count (38s-39.4s)
      const isHighlighted =
        (t >= 17.0 && t <= 20.2) || (t >= 38.0 + idx * 0.45 && t <= 39.5);
      const scaleBoost = isHighlighted ? 1.24 : 1.0;
      p.mesh.scale.setScalar(scaleBoost);
      p.mesh.material.emissiveIntensity = isHighlighted ? 0.95 : 0.45;
    });

    // Animate 4 Neutrons
    neutrons.forEach((n, idx) => {
      n.mesh.position.lerpVectors(n.compactPos, n.expandedPos, nucleonExpand);
      n.mesh.position.y += Math.sin(t * 4.8 + n.phase) * 0.04;
      n.mesh.position.z += Math.cos(t * 5.2 + n.phase) * 0.04;

      // Highlight pulse during Scene 3 Neutron focus (20.2s-24.2s) or Scene 5 Neutron count (39.8s-41.5s)
      const isHighlighted =
        (t >= 20.2 && t <= 24.2) || (t >= 39.8 + idx * 0.4 && t <= 41.5);
      const scaleBoost = isHighlighted ? 1.22 : 1.0;
      n.mesh.scale.setScalar(scaleBoost);
      n.mesh.material.emissiveIntensity = isHighlighted ? 0.75 : 0.25;
    });

    // Animate 3 Electrons & Probability Shells
    let cloudAlpha = 1.0;
    if (t >= 15.0 && t <= 27.0) {
      // Dim electron shells when inside the nucleus in Scene 3
      cloudAlpha =
        1.0 -
        0.75 *
          smootherstep(15.2, 17.0, t) *
          (1.0 - smootherstep(25.0, 26.8, t));
    }
    shellKMesh.material.uniforms.uOpacity.value = 0.36 * cloudAlpha;
    shellLMesh.material.uniforms.uOpacity.value = 0.28 * cloudAlpha;
    orbitalTrails.forEach((mat) => {
      mat.opacity = 0.34 * cloudAlpha;
    });

    electrons.forEach((e, idx) => {
      computeQuantumElectronPos(e.cfg, t, e.positionScratch);
      e.mesh.position.copy(e.positionScratch);
      const isHighlighted =
        (t >= 27.5 && t <= 36.5) || (t >= 41.9 + idx * 0.45 && t <= 43.4);
      e.mesh.scale.setScalar(isHighlighted ? 1.35 : 1.0);
    });

    // ====================================================================
    // UPDATE 3D FLOATING PARTICLE BADGES (+, 0, -)
    // ====================================================================
    const rect = viewportState;
    const showNucleonBadges =
      (t >= 16.2 && t <= 26.2) || (t >= 37.5 && t <= 55.5);
    const showElectronBadges = t >= 27.3 && t <= 55.5;

    particleBadges.forEach((item) => {
      let visible = false;
      if (item.type === "electron") visible = showElectronBadges;
      else visible = showNucleonBadges;

      if (!visible) {
        item.badge.style.opacity = "0";
        return;
      }

      item.mesh.getWorldPosition(worldPosHelper);
      tempProjVec.copy(worldPosHelper).project(camera);

      if (tempProjVec.z > 1.0) {
        item.badge.style.opacity = "0";
        return;
      }

      const screenX = (tempProjVec.x * 0.5 + 0.5) * rect.width;
      const screenY = (-tempProjVec.y * 0.5 + 0.5) * rect.height;
      item.badge.style.left = `${screenX}px`;
      item.badge.style.top = `${screenY - 22}px`;
      item.badge.style.opacity = "0.95";
    });

    // ====================================================================
    // UPDATE DYNAMIC 3D-TO-2D SVG SCIENTIFIC CALLOUT LINES
    // ====================================================================
    if (currentSceneIndex === 2) {
      const cAlpha =
        smootherstep(7.4, 8.4, t) * (1.0 - smootherstep(14.0, 14.9, t));
      // Callout 1 -> Central Nucleus
      worldPosHelper.set(0, 0, 0);
      updateSVGCallout(
        callout1Group,
        c1Dot,
        c1Ring,
        c1Line,
        worldPosHelper,
        viewportState.width * (viewportState.isPortrait ? 0.84 : 0.615),
        viewportState.height * 0.426,
        viewportState.width * (viewportState.isPortrait ? 0.96 : 0.698),
        viewportState.height * 0.426,
        cAlpha,
      );
      // Callout 2 -> Outer Electron Shell
      electrons[2].mesh.getWorldPosition(worldPosHelper);
      updateSVGCallout(
        callout2Group,
        c2Dot,
        c2Ring,
        c2Line,
        worldPosHelper,
        viewportState.width * (viewportState.isPortrait ? 0.16 : 0.385),
        viewportState.height * 0.574,
        viewportState.width * (viewportState.isPortrait ? 0.04 : 0.302),
        viewportState.height * 0.574,
        cAlpha,
      );
    } else if (currentSceneIndex === 3) {
      const cAlpha =
        smootherstep(16.6, 17.6, t) * (1.0 - smootherstep(25.2, 26.4, t));
      // Callout 1 -> Highlighted Proton
      protons[0].mesh.getWorldPosition(worldPosHelper);
      updateSVGCallout(
        callout1Group,
        c1Dot,
        c1Ring,
        c1Line,
        worldPosHelper,
        viewportState.width * (viewportState.isPortrait ? 0.84 : 0.635),
        viewportState.height * 0.481,
        viewportState.width * (viewportState.isPortrait ? 0.96 : 0.719),
        viewportState.height * 0.481,
        cAlpha,
      );
      // Callout 2 -> Highlighted Neutron
      neutrons[0].mesh.getWorldPosition(worldPosHelper);
      updateSVGCallout(
        callout2Group,
        c2Dot,
        c2Ring,
        c2Line,
        worldPosHelper,
        viewportState.width * (viewportState.isPortrait ? 0.16 : 0.365),
        viewportState.height * 0.481,
        viewportState.width * (viewportState.isPortrait ? 0.04 : 0.281),
        viewportState.height * 0.481,
        cAlpha,
      );
    } else if (currentSceneIndex === 4) {
      const cAlpha =
        smootherstep(27.5, 28.5, t) * (1.0 - smootherstep(35.8, 36.8, t));
      callout1Group.setAttribute("opacity", "0");
      electrons[0].mesh.getWorldPosition(worldPosHelper);
      updateSVGCallout(
        callout2Group,
        c2Dot,
        c2Ring,
        c2Line,
        worldPosHelper,
        viewportState.width * (viewportState.isPortrait ? 0.84 : 0.635),
        viewportState.height * 0.481,
        viewportState.width * (viewportState.isPortrait ? 0.96 : 0.719),
        viewportState.height * 0.481,
        cAlpha,
      );
    } else {
      callout1Group.setAttribute("opacity", "0");
      callout2Group.setAttribute("opacity", "0");
    }

    // ====================================================================
    // UPDATE TIMELINE SCRUBBER, AUDIO ENGINE & TIMECODE
    // ====================================================================
    audioEngine.updateContinuousSoundscape(t, currentSceneIndex, camRadius);
    audioEngine.checkTimelineCues(prevMasterTime, t);
    prevMasterTime = t;

    const pct = (t / TOTAL_DURATION) * 100;
    timelineProgress.style.width = `${pct}%`;
    timelineThumb.style.left = `${pct}%`;
    timelineTrack.setAttribute("aria-valuenow", t.toFixed(1));

    const mins = Math.floor(t / 60);
    const secs = (t % 60).toFixed(1).padStart(4, "0");
    timecodeDisplay.textContent = `0${mins}:${secs} / 01:00.0`;
  }

  // ------------------------------------------------------------------------
  // 8. INTERACTIVE PLAYER CONTROLS & EVENT LISTENERS
  // ------------------------------------------------------------------------
  const btnPlayPause = document.getElementById("btn-play-pause");
  const playIcon = document.getElementById("play-icon");
  const playLabel = document.getElementById("play-label");
  const btnRestart = document.getElementById("btn-restart");
  const btnAudio = document.getElementById("btn-audio");
  const audioIcon = document.getElementById("audio-icon");
  const audioLabel = document.getElementById("audio-label");
  const btnMusicToggle = document.getElementById("btn-music-toggle");
  const musicToggleLabel = document.getElementById("music-toggle-label");
  const btnSfxToggle = document.getElementById("btn-sfx-toggle");
  const sfxToggleLabel = document.getElementById("sfx-toggle-label");
  const audioLaunchOverlay = document.getElementById("audio-launch-overlay");
  const btnUnlockSound = document.getElementById("btn-unlock-sound");
  const btnFullscreen = document.getElementById("btn-fullscreen");
  const timelineTrack = document.getElementById("timeline-track");

  function syncAudioButtonsUI(isActive) {
    if (isActive) {
      audioIcon.textContent = "🔊";
      audioLabel.textContent = "صدا: فعال";
      btnAudio.classList.replace("text-cyan-300", "text-emerald-300");
      if (audioLaunchOverlay)
        audioLaunchOverlay.classList.add("hidden-overlay");
    } else {
      audioIcon.textContent = "🔇";
      audioLabel.textContent = "صدا: خاموش";
      btnAudio.classList.replace("text-emerald-300", "text-cyan-300");
    }
  }

  function updatePlayButtonUI() {
    if (isPlaying) {
      playIcon.textContent = "❚❚";
      playLabel.textContent = "توقف";
    } else {
      playIcon.textContent = "▶";
      playLabel.textContent = "پخش";
    }
  }
  updatePlayButtonUI();

  // One-Click Launch Banner unlocks full sound & restarts from 00:00 for the complete cinematic experience
  if (btnUnlockSound) {
    btnUnlockSound.addEventListener("click", (e) => {
      e.stopPropagation();
      masterTime = 0.0;
      prevMasterTime = 0.0;
      audioEngine.firedCues.clear();
      isPlaying = true;
      updatePlayButtonUI();
      const active = audioEngine.unlockAndUnmute();
      syncAudioButtonsUI(active);
      updateChoreography(masterTime);
    });
  }

  // Also auto-unlock audio if user clicks on the 3D canvas while muted
  canvasEl.addEventListener(
    "click",
    () => {
      if (audioEngine.isMuted) {
        const active = audioEngine.unlockAndUnmute();
        syncAudioButtonsUI(active);
      }
    },
    { once: true },
  );

  btnPlayPause.addEventListener("click", () => {
    isPlaying = !isPlaying;
    audioEngine.playUIClick(isPlaying ? 840 : 520);
    updatePlayButtonUI();
  });

  btnRestart.addEventListener("click", () => {
    masterTime = 0.0;
    prevMasterTime = 0.0;
    audioEngine.firedCues.clear();
    isPlaying = true;
    audioEngine.playCinematicImpact(73.42, 1.5);
    updatePlayButtonUI();
    updateChoreography(masterTime);
  });

  btnAudio.addEventListener("click", () => {
    const active = audioEngine.toggleMute();
    syncAudioButtonsUI(active);
  });

  if (btnMusicToggle) {
    btnMusicToggle.addEventListener("click", () => {
      if (audioEngine.isMuted) {
        syncAudioButtonsUI(audioEngine.unlockAndUnmute());
      }
      const musicOn = audioEngine.toggleMusic();
      musicToggleLabel.textContent = musicOn ? "موسیقی: روشن" : "موسیقی: خاموش";
      btnMusicToggle.style.opacity = musicOn ? "1" : "0.55";
      audioEngine.playUIClick(musicOn ? 780 : 480);
    });
  }

  if (btnSfxToggle) {
    btnSfxToggle.addEventListener("click", () => {
      if (audioEngine.isMuted) {
        syncAudioButtonsUI(audioEngine.unlockAndUnmute());
      }
      const sfxOn = audioEngine.toggleSFX();
      sfxToggleLabel.textContent = sfxOn
        ? "افکت حرکت: روشن"
        : "افکت حرکت: خاموش";
      btnSfxToggle.style.opacity = sfxOn ? "1" : "0.55";
      if (sfxOn) audioEngine.playUIClick(920);
    });
  }

  btnFullscreen.addEventListener("click", () => {
    audioEngine.playUIClick(660);
    const wrapper = document.getElementById("viewport-wrapper");
    if (!document.fullscreenElement) {
      if (wrapper.requestFullscreen) {
        const request = wrapper.requestFullscreen();
        if (request && request.catch) {
          request.catch((error) => {
            console.warn("Fullscreen could not be entered:", error);
          });
        }
      }
    } else if (document.exitFullscreen) {
      const request = document.exitFullscreen();
      if (request && request.catch) {
        request.catch((error) => {
          console.warn("Fullscreen could not be exited:", error);
        });
      }
    }
  });
  if (!document.getElementById("viewport-wrapper").requestFullscreen) {
    btnFullscreen.disabled = true;
    btnFullscreen.title = "تمام‌صفحه در این مرورگر پشتیبانی نمی‌شود";
  }

  // Scene Quick-Jump Buttons
  document.querySelectorAll(".scene-jump-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      if (audioEngine.isMuted) {
        syncAudioButtonsUI(audioEngine.unlockAndUnmute());
      }
      const targetSec = parseFloat(btn.getAttribute("data-jump"));
      masterTime = clamp(targetSec, 0, TOTAL_DURATION - 0.01);
      prevMasterTime = masterTime;
      audioEngine.firedCues.clear();
      audioEngine.playCameraWhoosh("dive", 1.1);
      updateChoreography(masterTime);
    });
  });

  // Timeline Scrubber Interaction
  function scrubToClientX(clientX) {
    const rect = timelineTrack.getBoundingClientRect();
    const ratio = clamp((clientX - rect.left) / rect.width, 0, 0.999);
    masterTime = ratio * TOTAL_DURATION;
    prevMasterTime = masterTime;
    audioEngine.firedCues.clear();
    audioEngine.playUIClick(500 + ratio * 500);
    updateChoreography(masterTime);
  }

  timelineTrack.addEventListener("pointerdown", (e) => {
    e.preventDefault();
    isScrubbing = true;
    if (timelineTrack.setPointerCapture) {
      timelineTrack.setPointerCapture(e.pointerId);
    }
    scrubToClientX(e.clientX);
  });
  timelineTrack.addEventListener("pointercancel", finishPointerInteraction);
  timelineTrack.addEventListener("keydown", (e) => {
    let nextTime = masterTime;
    if (e.key === "ArrowRight") nextTime += 1;
    else if (e.key === "ArrowLeft") nextTime -= 1;
    else if (e.key === "PageUp") nextTime += 5;
    else if (e.key === "PageDown") nextTime -= 5;
    else if (e.key === "Home") nextTime = 0;
    else if (e.key === "End") nextTime = TOTAL_DURATION - 0.01;
    else return;

    e.preventDefault();
    masterTime = clamp(nextTime, 0, TOTAL_DURATION - 0.01);
    prevMasterTime = masterTime;
    audioEngine.firedCues.clear();
    updateChoreography(masterTime);
  });

  window.addEventListener("pointermove", (e) => {
    if (isScrubbing) {
      scrubToClientX(e.clientX);
    } else if (isPointerDown) {
      const dx = (e.clientX - pointerStart.x) * 0.007;
      const dy = (e.clientY - pointerStart.y) * 0.005;
      targetOrbitOffset.theta = clamp(dx, -Math.PI, Math.PI);
      targetOrbitOffset.phi = clamp(dy, -0.8, 0.8);
    }
  });

  function finishPointerInteraction() {
    isScrubbing = false;
    isPointerDown = false;
    targetOrbitOffset.theta = 0;
    targetOrbitOffset.phi = 0;
  }
  window.addEventListener("pointerup", finishPointerInteraction);
  window.addEventListener("pointercancel", finishPointerInteraction);

  // 3D Canvas Interactive Orbit Inspection (Mouse & Touch)
  canvasEl.addEventListener("pointerdown", (e) => {
    if (e.pointerType === "mouse" && e.button !== 0) return;
    isPointerDown = true;
    pointerStart.x = e.clientX;
    pointerStart.y = e.clientY;
    if (canvasEl.setPointerCapture) {
      canvasEl.setPointerCapture(e.pointerId);
    }
  });

  // ------------------------------------------------------------------------
  // 9. MASTER 60FPS ANIMATION LOOP
  // ------------------------------------------------------------------------
  function animate(now) {
    requestAnimationFrame(animate);
    if (document.hidden) {
      lastFrameTime = now;
      return;
    }
    if (now - lastFrameTime < frameInterval) return;

    const dt = Math.min((now - lastFrameTime) / 1000, 0.1);
    lastFrameTime = now;

    if (isPlaying && !isScrubbing) {
      masterTime += dt;
      if (masterTime >= TOTAL_DURATION) {
        masterTime = masterTime % TOTAL_DURATION; // Seamless infinite loop
        prevMasterTime = 0.0;
        audioEngine.firedCues.clear();
      }
    }

    const cameraIsSettling =
      Math.abs(userOrbitOffset.theta - targetOrbitOffset.theta) > 0.001 ||
      Math.abs(userOrbitOffset.phi - targetOrbitOffset.phi) > 0.001;
    if (
      isPlaying ||
      isScrubbing ||
      isPointerDown ||
      cameraIsSettling ||
      viewportState.needsSceneRefresh
    ) {
      updateChoreography(masterTime);
      viewportState.needsSceneRefresh = false;
    }
    if (spectrumCtx && spectrumCanvas && !audioEngine.isMuted) {
      audioEngine.renderSpectrum(
        spectrumCtx,
        spectrumCanvas.width,
        spectrumCanvas.height,
      );
    }
    renderer.render(scene, camera);
  }

  document.addEventListener("visibilitychange", () => {
    lastFrameTime = performance.now();
  });

  updateChoreography(masterTime);
  viewportState.needsSceneRefresh = false;
  requestAnimationFrame(animate);
};
