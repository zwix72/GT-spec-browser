// Simple WebAudio engine synth
export class EngineAudio {
  ctx: any;
  osc: any;
  gain: any;
  noise: any;
  noiseGain: any;
  
  constructor() {
    this.ctx = new ((window as any).AudioContext || (window as any).webkitAudioContext)();
    
    // Main tone
    this.osc = this.ctx.createOscillator();
    this.gain = this.ctx.createGain();
    
    this.osc.type = 'sawtooth';
    this.osc.connect(this.gain);
    this.gain.connect(this.ctx.destination);
    
    // Idle noise
    this.noiseGain = this.ctx.createGain();
    this.noiseGain.connect(this.ctx.destination);
    
    this.gain.gain.value = 0;
    this.noiseGain.gain.value = 0;
    
    this.osc.start();
  }

  setRPM(rpm: number) {
    if (this.ctx.state === 'suspended') this.ctx.resume();
    
    // Base frequency mapping
    // Idle ~800rpm -> 100hz
    // Redline ~7000rpm -> 600hz
    const freq = 60 + (rpm / 8000) * 400;
    
    // Smooth transition
    const time = this.ctx.currentTime;
    this.osc.frequency.setTargetAtTime(freq, time, 0.1);
    
    // Volume based on load roughly
    this.gain.gain.setTargetAtTime(0.1 + (rpm / 8000) * 0.2, time, 0.1);
  }

  stop() {
    this.gain.gain.setTargetAtTime(0, this.ctx.currentTime, 0.5);
  }
}