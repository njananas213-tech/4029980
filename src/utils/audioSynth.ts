// Web Audio API Synthesizer for soft piano and instrumental nasheed style music.
// Creates a warm, emotional, and elegant loop with support for multiple authentic traditional Islamic melodies.

class NasheedPianoSynth {
  private ctx: AudioContext | null = null;
  private isPlaying: boolean = false;
  private padOscs: { osc: OscillatorNode; gain: GainNode }[] = [];
  private mainGain: GainNode | null = null;
  private schedulerTimer: number | null = null;
  private bpm: number = 54; // Very slow and emotional
  private nextNoteTime: number = 0;
  private beatCount: number = 0;
  private currentChordIndex: number = 0;
  private activePreset: 'serenity' | 'hasbi' | 'mawlay' | 'tala_al' = 'hasbi';

  // Preset 1: Emotional, peaceful chord progression in G minor / Bb Major ("Divine Serenity"):
  private serenityChords = [
    { root: 55, notes: [55, 62, 67, 70] }, // G minor
    { root: 51, notes: [51, 58, 63, 67] }, // Eb major
    { root: 58, notes: [58, 65, 70, 74] }, // Bb major
    { root: 53, notes: [53, 60, 65, 69] }  // F major
  ];

  // Preset 2: Hasbi Rabbi (Traditional G Minor / C Minor Progression):
  private hasbiChords = [
    { root: 55, notes: [55, 62, 67, 70] }, // G minor
    { root: 48, notes: [48, 55, 60, 63] }, // C minor
    { root: 58, notes: [58, 65, 70, 74] }, // Bb major
    { root: 50, notes: [50, 57, 62, 66] }  // D major / D7
  ];

  // Preset 3: Mawlaya chords (Emotional G Minor / F Major / Eb Major):
  private mawlayChords = [
    { root: 55, notes: [55, 62, 67, 70] }, // G minor
    { root: 53, notes: [53, 60, 65, 69] }, // F major
    { root: 51, notes: [51, 58, 63, 67] }, // Eb major
    { root: 55, notes: [55, 62, 67, 70] }  // G minor
  ];

  // Preset 4: Tala'al Badru chords (Gm / Bb / Eb / F):
  private talaChords = [
    { root: 55, notes: [55, 62, 67, 70] }, // G minor
    { root: 58, notes: [58, 65, 70, 74] }, // Bb major
    { root: 51, notes: [51, 58, 63, 67] }, // Eb major
    { root: 53, notes: [53, 60, 65, 69] }  // F major
  ];

  // Melodic leads
  private serenityMelody = [
    [70, 74, 77, 74], // Bb, D, F, D
    [67, 70, 74, 70], // G, Bb, D, Bb
    [70, 74, 77, 79], // Bb, D, F, G
    [69, 72, 74, 72]  // A, C, D, C
  ];

  // Hasbi Rabbi Melody notes (16 beats):
  // D5 (74), D5 (74), C5 (72), Bb4 (70), C5 (72), D5 (74), Bb4 (70), A4 (69)
  // C5 (72), C5 (72), Bb4 (70), A4 (69), Bb4 (70), C5 (72), A4 (69), G4 (67)
  private hasbiMelody = [
    74, 74, 72, 70, 72, 74, 70, 69,
    72, 72, 70, 69, 70, 72, 69, 67
  ];

  // Mawlaya Melody notes (16 beats):
  // G4 (67), G4 (67), A4 (69), Bb4 (70), A4 (69), G4 (67), A4 (69), F4 (65)
  // G4 (67), A4 (69), Bb4 (70), C5 (72), A4 (69), G4 (67), F4 (65), G4 (67)
  private mawlayMelody = [
    67, 67, 69, 70, 69, 67, 69, 65,
    67, 69, 70, 72, 69, 67, 65, 67
  ];

  // Tala'al Badru Melody notes (16 beats):
  // D5 (74), D5 (74), D5 (74), C5 (72), Bb4 (70), C5 (72), D5 (74), Bb4 (70)
  // D5 (74), F5 (77), F5 (77), Eb5 (75), D5 (74), C5 (72), D5 (74), Bb4 (70)
  private talaMelody = [
    74, 74, 74, 72, 70, 72, 74, 70,
    74, 77, 77, 75, 74, 72, 74, 70
  ];

  constructor() {}

  private getChords() {
    switch (this.activePreset) {
      case "serenity": return this.serenityChords;
      case "hasbi": return this.hasbiChords;
      case "mawlay": return this.mawlayChords;
      case "tala_al": return this.talaChords;
      default: return this.hasbiChords;
    }
  }

  public async start(preset: 'serenity' | 'hasbi' | 'mawlay' | 'tala_al' = 'hasbi') {
    if (this.isPlaying) {
      if (this.activePreset === preset) return;
      this.stop();
      await new Promise((resolve) => setTimeout(resolve, 150));
    }

    this.activePreset = preset;

    // Create browser audio context
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) {
      console.warn("Web Audio API not supported in this browser.");
      return;
    }

    this.ctx = new AudioContextClass();
    if (!this.ctx) {
      console.warn("Failed to create AudioContext.");
      return;
    }
    if (this.ctx.state === "suspended") {
      await this.ctx.resume();
    }

    this.isPlaying = true;

    // Master volume control block
    this.mainGain = this.ctx.createGain();
    this.mainGain.gain.setValueAtTime(0, this.ctx.currentTime);
    this.mainGain.gain.linearRampToValueAtTime(0.7, this.ctx.currentTime + 1.5); // Warm fade-in

    // Add mild stereo delay effect for depth
    const delayNode = this.ctx.createDelay(1.0);
    const delayGain = this.ctx.createGain();
    const delayFilter = this.ctx.createBiquadFilter();

    delayNode.delayTime.value = 0.45; // Slow ambient echo
    delayGain.gain.value = 0.25; // 25% wet echo
    delayFilter.type = "lowpass";
    delayFilter.frequency.value = 800; // Warm delay tone

    // Connect delay loop
    this.mainGain.connect(delayNode);
    delayNode.connect(delayFilter);
    delayFilter.connect(delayGain);
    delayGain.connect(this.mainGain); // feedback
    delayGain.connect(this.ctx.destination);

    this.mainGain.connect(this.ctx.destination);

    // 1. Start the Warm Ambient Pad (string/hum accompaniment)
    this.startAmbientPads();

    // 2. Start the Piano Sequencer Scheduler
    this.nextNoteTime = this.ctx.currentTime + 0.1;
    this.beatCount = 0;
    this.currentChordIndex = 0;
    this.runScheduler();
  }

  // Start continuous, ethereal background drones (simulating vocal warmth/humming in nasheeds)
  private startAmbientPads() {
    if (!this.ctx || !this.mainGain) return;

    const chords = this.getChords();
    const baseChord = chords[0];
    const padFrequencies = baseChord.notes.map(n => Math.pow(2, ((n - 12) - 69) / 12) * 440); // 1 octave lower

    padFrequencies.forEach((freq, idx) => {
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gainNode = this.ctx.createGain();
      const filter = this.ctx.createBiquadFilter();

      // Soft triangle waves and sine waves for beautiful resonance
      osc.type = idx % 2 === 0 ? "triangle" : "sine";
      osc.frequency.value = freq;

      // Slow drift detuning for beautiful vocal-chorus expansion
      osc.detune.value = (idx - 1.5) * 6; 

      filter.type = "lowpass";
      filter.frequency.value = 240; // Warm cozy filter sweep

      gainNode.gain.setValueAtTime(0, this.ctx.currentTime);
      gainNode.gain.linearRampToValueAtTime(0.12, this.ctx.currentTime + 3 + idx);

      osc.connect(filter);
      filter.connect(gainNode);
      gainNode.connect(this.mainGain!);

      osc.start();
      this.padOscs.push({ osc, gain: gainNode });
    });
  }

  // Play a soft synthetic acoustic piano note
  private playPianoPluck(midiNote: number, time: number, velocity: number = 0.5) {
    if (!this.ctx || !this.mainGain) return;

    const freq = Math.pow(2, (midiNote - 69) / 12) * 440;

    const oscBody = this.ctx.createOscillator(); // Main body (sine/triangle)
    const oscTine = this.ctx.createOscillator(); // Crisp attack chime (sine)
    
    const bodyGain = this.ctx.createGain();
    const tineGain = this.ctx.createGain();

    const lowpass = this.ctx.createBiquadFilter();
    lowpass.type = "lowpass";
    lowpass.frequency.setValueAtTime(freq * 2.5, time);
    lowpass.Q.setValueAtTime(1, time);

    oscBody.type = "triangle";
    oscBody.frequency.setValueAtTime(freq, time);

    oscTine.type = "sine";
    oscTine.frequency.setValueAtTime(freq * 3, time); // Ringing third harmonic

    // Gain Envelopes
    bodyGain.gain.setValueAtTime(0, time);
    bodyGain.gain.linearRampToValueAtTime(velocity * 0.45, time + 0.008);
    bodyGain.gain.exponentialRampToValueAtTime(velocity * 0.15, time + 0.3);
    bodyGain.gain.exponentialRampToValueAtTime(0.0001, time + 2.5);

    tineGain.gain.setValueAtTime(0, time);
    tineGain.gain.linearRampToValueAtTime(velocity * 0.18, time + 0.002);
    tineGain.gain.exponentialRampToValueAtTime(0.0001, time + 0.12);

    // Connections
    oscBody.connect(bodyGain);
    bodyGain.connect(lowpass);

    oscTine.connect(tineGain);
    tineGain.connect(lowpass);

    lowpass.connect(this.mainGain);

    oscBody.start(time);
    oscTine.start(time);

    oscBody.stop(time + 2.5);
    oscTine.stop(time + 0.15);
  }

  // Modulates ambient pads slowly to align with the current harmony changes
  private morphPadsToChord(chordIndex: number, transitionTime: number) {
    if (!this.ctx || this.padOscs.length < 4) return;
    const chords = this.getChords();
    const chord = chords[chordIndex];
    
    this.padOscs.forEach((pad, idx) => {
      if (!this.ctx) return;
      const targetMidi = chord.notes[idx] - 12; // octave lower for warm pad
      const targetFreq = Math.pow(2, (targetMidi - 69) / 12) * 440;
      
      pad.osc.frequency.exponentialRampToValueAtTime(targetFreq, transitionTime + 1.2);
    });
  }

  // The scheduler loop tracks when the next beats happen
  private runScheduler() {
    if (!this.isPlaying || !this.ctx) return;

    const scheduleAheadTime = 0.25;
    const secondsPerBeat = 60.0 / this.bpm;

    while (this.ctx && this.nextNoteTime < this.ctx.currentTime + scheduleAheadTime) {
      this.scheduleBeat(this.beatCount, this.nextNoteTime);
      this.nextNoteTime += secondsPerBeat;
      this.beatCount = (this.beatCount + 1) % 16; // 16-step bar loop (4 bars of 4 beats)
    }

    this.schedulerTimer = window.setTimeout(() => this.runScheduler(), 80);
  }

  // Orchestrate the instruments beat-by-beat
  private scheduleBeat(beat: number, time: number) {
    const chords = this.getChords();
    const chordDuration = 4;
    const chordIndex = Math.floor(beat / chordDuration) % chords.length;

    // Trigger chord progression morphing at beat boundaries
    if (beat % chordDuration === 0) {
      this.currentChordIndex = chordIndex;
      this.morphPadsToChord(this.currentChordIndex, time);
      
      const bassNote = chords[this.currentChordIndex].root - 12;
      this.playPianoPluck(bassNote, time, 0.45);
    }

    const currentChord = chords[this.currentChordIndex];

    if (this.activePreset === "serenity") {
      if (beat % 4 === 0) {
        this.playPianoPluck(currentChord.notes[0], time, 0.25);
        this.playPianoPluck(currentChord.notes[1], time + 0.05, 0.2);
        this.playPianoPluck(currentChord.notes[2], time + 0.1, 0.18);
      } else if (beat % 4 === 1) {
        this.playPianoPluck(currentChord.notes[3], time, 0.2);
      } else if (beat % 4 === 2) {
        const melodyNote = this.serenityMelody[this.currentChordIndex][0];
        this.playPianoPluck(melodyNote, time, 0.45);
      } else if (beat % 4 === 3) {
        const melodyNote = this.serenityMelody[this.currentChordIndex][2];
        this.playPianoPluck(melodyNote, time, 0.35);
        this.playPianoPluck(currentChord.notes[3] + 12, time + 0.5, 0.12);
      }
    } else {
      // Step-sequenced actual traditional Islamic songs
      let melodyNote = 0;
      if (this.activePreset === "hasbi") {
        melodyNote = this.hasbiMelody[beat];
      } else if (this.activePreset === "mawlay") {
        melodyNote = this.mawlayMelody[beat];
      } else if (this.activePreset === "tala_al") {
        melodyNote = this.talaMelody[beat];
      }

      if (melodyNote > 0) {
        // Play the lead melody note clearly on top of the chord
        this.playPianoPluck(melodyNote, time, 0.52);
      }

      // Add gentle double-note piano accompaniment chords
      if (beat % 2 === 0) {
        this.playPianoPluck(currentChord.notes[0], time, 0.18);
        this.playPianoPluck(currentChord.notes[1], time + 0.04, 0.15);
      } else if (beat % 4 === 3) {
        this.playPianoPluck(currentChord.notes[2], time, 0.15);
        this.playPianoPluck(currentChord.notes[3] + 12, time, 0.1);
      }
    }
  }

  public setVolume(volume: number) {
    if (this.mainGain && this.ctx) {
      const vol = Math.max(0, Math.min(1, volume));
      this.mainGain.gain.setValueAtTime(this.mainGain.gain.value, this.ctx.currentTime);
      this.mainGain.gain.linearRampToValueAtTime(vol * 0.7, this.ctx.currentTime + 0.1);
    }
  }

  public stop() {
    if (!this.isPlaying) return;

    this.isPlaying = false;

    if (this.schedulerTimer) {
      clearTimeout(this.schedulerTimer);
      this.schedulerTimer = null;
    }

    const fadeOutTime = 0.8;
    if (this.mainGain && this.ctx) {
      this.mainGain.gain.setValueAtTime(this.mainGain.gain.value, this.ctx.currentTime);
      this.mainGain.gain.linearRampToValueAtTime(0, this.ctx.currentTime + fadeOutTime);
    }

    setTimeout(() => {
      this.padOscs.forEach(pad => {
        try {
          pad.osc.stop();
        } catch (_) {}
      });
      this.padOscs = [];

      if (this.ctx) {
        try {
          this.ctx.close();
        } catch (_) {}
        this.ctx = null;
      }
    }, fadeOutTime * 1000 + 50);
  }
}

export const nasheedSynth = new NasheedPianoSynth();
