
class AudioManager {
  private ctx: AudioContext | null = null;
  
  private masterGain: GainNode | null = null;
  private musicGain: GainNode | null = null;
  private sfxGain: GainNode | null = null;

  private _musicVol: number = 0.5;
  private _sfxVol: number = 0.8;

  private currentMusicType: 'NONE' | 'MENU' | 'GAME' = 'NONE';
  private musicNodes: AudioScheduledSourceNode[] = [];
  private musicInterval: number | null = null;

  constructor() {
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioContextClass) {
        this.ctx = new AudioContextClass();
        
        this.masterGain = this.ctx.createGain();
        this.masterGain.gain.value = 1.0;
        this.masterGain.connect(this.ctx.destination);

        this.musicGain = this.ctx.createGain();
        this.musicGain.gain.value = this._musicVol;
        this.musicGain.connect(this.masterGain);

        this.sfxGain = this.ctx.createGain();
        this.sfxGain.gain.value = this._sfxVol;
        this.sfxGain.connect(this.masterGain);
      }
    } catch (e) {
      console.error("Web Audio API not supported");
    }
  }

  resume(): Promise<void> {
    if (this.ctx && this.ctx.state === 'suspended') {
      return this.ctx.resume();
    }
    return Promise.resolve();
  }

  setMusicVolume(val: number) {
    this._musicVol = Math.max(0, Math.min(1, val));
    if (this.musicGain && this.ctx) {
        this.musicGain.gain.setTargetAtTime(this._musicVol, this.ctx.currentTime, 0.1);
    }
  }

  setSfxVolume(val: number) {
    this._sfxVol = Math.max(0, Math.min(1, val));
    if (this.sfxGain && this.ctx) {
        this.sfxGain.gain.setTargetAtTime(this._sfxVol, this.ctx.currentTime, 0.1);
    }
  }

  stopMusic() {
    if (this.musicInterval) {
        window.clearInterval(this.musicInterval);
        this.musicInterval = null;
    }
    
    // Ramp down gently before stopping to avoid click
    // Note: Since we are disconnecting nodes, a quick fade on the individual nodes or music gain 
    // would be ideal, but simply stopping them is acceptable if they are continuous drones.
    // However, immediate stop can click.
    
    this.musicNodes.forEach(node => {
        try { 
            // Try to ramp down if it's a gain node? 
            // We only stored source nodes. Just stop them.
            node.stop(); 
        } catch(e){}
        try {
            node.disconnect();
        } catch(e){}
    });
    this.musicNodes = [];
    this.currentMusicType = 'NONE';
  }

  playMenuMusic() {
    if (this.currentMusicType === 'MENU' || !this.ctx) return;
    this.stopMusic();
    this.currentMusicType = 'MENU';
    this.resume();

    const notes = [130.81, 155.56, 196.00, 261.63, 196.00, 155.56]; 
    let noteIdx = 0;

    const playNote = () => {
        if (!this.ctx || this.currentMusicType !== 'MENU') return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        
        const t = this.ctx.currentTime;
        osc.type = 'sine';
        osc.frequency.value = notes[noteIdx];
        noteIdx = (noteIdx + 1) % notes.length;

        // Envelope: Attack (silence -> vol), Decay
        gain.gain.setValueAtTime(0, t);
        gain.gain.linearRampToValueAtTime(0.15, t + 0.1);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 1.5);

        osc.connect(gain);
        gain.connect(this.musicGain!);
        
        osc.start(t);
        osc.stop(t + 1.5);
    };

    playNote();
    this.musicInterval = window.setInterval(playNote, 600);
  }

  playGameMusic() {
    if (this.currentMusicType === 'GAME' || !this.ctx) return;
    this.stopMusic();
    this.currentMusicType = 'GAME';
    this.resume();

    const t = this.ctx.currentTime;

    // Drone 1
    const osc1 = this.ctx.createOscillator();
    osc1.type = 'sawtooth';
    osc1.frequency.value = 55; 
    const gain1 = this.ctx.createGain();
    
    // Fade in drone
    gain1.gain.setValueAtTime(0, t);
    gain1.gain.linearRampToValueAtTime(0.05, t + 2.0);
    
    const filter1 = this.ctx.createBiquadFilter();
    filter1.type = 'lowpass';
    filter1.frequency.value = 200;

    osc1.connect(filter1);
    filter1.connect(gain1);
    gain1.connect(this.musicGain!);
    osc1.start(t);
    this.musicNodes.push(osc1);

    // Drone 2
    const osc2 = this.ctx.createOscillator();
    osc2.type = 'triangle';
    osc2.frequency.value = 110; 
    const gain2 = this.ctx.createGain();
    
    // Fade in drone
    gain2.gain.setValueAtTime(0, t);
    gain2.gain.linearRampToValueAtTime(0.03, t + 3.0);
    
    const lfo = this.ctx.createOscillator();
    lfo.frequency.value = 0.1; 
    const lfoGain = this.ctx.createGain();
    lfoGain.gain.value = 2; 
    lfo.connect(lfoGain);
    lfoGain.connect(osc2.frequency);
    lfo.start(t);
    this.musicNodes.push(lfo);

    osc2.connect(gain2);
    gain2.connect(this.musicGain!);
    osc2.start(t);
    this.musicNodes.push(osc2);
  }

  private playTone(freq: number, type: OscillatorType, duration: number, vol: number) {
      if (!this.ctx || !this.sfxGain) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const t = this.ctx.currentTime;
      
      osc.type = type;
      osc.frequency.setValueAtTime(freq, t);
      
      // Envelope to prevent popping
      gain.gain.setValueAtTime(0, t);
      gain.gain.linearRampToValueAtTime(vol, t + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, t + duration);

      osc.connect(gain);
      gain.connect(this.sfxGain);
      
      osc.start(t);
      osc.stop(t + duration + 0.1);
  }

  playAttack() {
    if (!this.ctx || !this.sfxGain) return;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    
    osc.frequency.setValueAtTime(400, t);
    osc.frequency.exponentialRampToValueAtTime(100, t + 0.15);
    
    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(0.2, t + 0.02);
    gain.gain.linearRampToValueAtTime(0.001, t + 0.15);
    
    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(t);
    osc.stop(t + 0.2);
  }

  playHit() {
     this.playTone(100, 'sawtooth', 0.1, 0.2);
  }

  playPlayerDamage() {
     this.playTone(150, 'square', 0.2, 0.3);
  }

  playPickup() {
    if (!this.ctx || !this.sfxGain) return;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    
    osc.frequency.setValueAtTime(880, t);
    osc.frequency.exponentialRampToValueAtTime(1760, t + 0.1);
    
    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(0.1, t + 0.02);
    gain.gain.linearRampToValueAtTime(0.001, t + 0.2);
    
    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(t);
    osc.stop(t + 0.25);
  }

  playEquip() {
    if (!this.ctx || !this.sfxGain) return;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'triangle';
    
    osc.frequency.setValueAtTime(600, t);
    
    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(0.1, t + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.1);
    
    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(t);
    osc.stop(t + 0.15);
  }

  playPowerup() {
    if (!this.ctx || !this.sfxGain) return;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'square';
    
    osc.frequency.setValueAtTime(220, t);
    osc.frequency.linearRampToValueAtTime(880, t + 0.4);
    
    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(0.1, t + 0.05);
    gain.gain.linearRampToValueAtTime(0.001, t + 0.4);
    
    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(t);
    osc.stop(t + 0.45);
  }
  
  playSummon() {
    if (!this.ctx || !this.sfxGain) return;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    
    osc.type = 'sine';
    osc.frequency.setValueAtTime(300, t);
    osc.frequency.linearRampToValueAtTime(600, t + 0.5);
    
    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(0.2, t + 0.25);
    gain.gain.linearRampToValueAtTime(0.001, t + 0.5);
    
    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(t);
    osc.stop(t + 0.55);
  }

  playDeath() {
      this.playTone(200, 'sawtooth', 1.0, 0.4);
  }

  playLevelTransition() {
    if (!this.ctx || !this.sfxGain) return;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(150, t);
    osc.frequency.exponentialRampToValueAtTime(40, t + 1.5);
    
    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(0.3, t + 0.1);
    gain.gain.linearRampToValueAtTime(0.001, t + 1.5);
    
    osc.connect(gain);
    gain.connect(this.sfxGain);
    
    osc.start(t);
    osc.stop(t + 1.6);
  }

  playVictory() {
    if (!this.ctx || !this.sfxGain) return;
    const t = this.ctx.currentTime;
    
    // Major Chord Arpeggio
    [523.25, 659.25, 783.99, 1046.50].forEach((freq, i) => {
        const osc = this.ctx!.createOscillator();
        const gain = this.ctx!.createGain();
        osc.type = 'triangle';
        osc.frequency.value = freq;
        
        const startTime = t + i * 0.1;
        gain.gain.setValueAtTime(0, startTime);
        gain.gain.linearRampToValueAtTime(0.2, startTime + 0.05);
        gain.gain.exponentialRampToValueAtTime(0.001, startTime + 2.0);
        
        osc.connect(gain);
        gain.connect(this.sfxGain!);
        osc.start(startTime);
        osc.stop(startTime + 2.1);
    });
  }
}

export const audioManager = new AudioManager();
