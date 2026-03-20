export const Sfx = {
    ctx: null,
    init: function() {
        if(!this.ctx) this.ctx = new (window.AudioContext || window.webkitAudioContext)();
        if(this.ctx.state === 'suspended') this.ctx.resume();
    },
    play: function(f, t, d, v, f2=null, pan=0, filterType=null, filterFreq=1000) {
        if(!this.ctx) return;
        const o = this.ctx.createOscillator(); const g = this.ctx.createGain();
        const panner = this.ctx.createStereoPanner ? this.ctx.createStereoPanner() : null;
        const filter = this.ctx.createBiquadFilter();

        o.type = t; o.frequency.setValueAtTime(f, this.ctx.currentTime);
        if(f2) o.frequency.exponentialRampToValueAtTime(f2, this.ctx.currentTime + d);
        
        g.gain.setValueAtTime(v, this.ctx.currentTime);
        g.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + d);

        filter.type = filterType || 'allpass';
        filter.frequency.setValueAtTime(filterFreq, this.ctx.currentTime);

        if(panner) panner.pan.value = pan;

        o.connect(filter); filter.connect(g);
        if(panner) { g.connect(panner); panner.connect(this.ctx.destination); } 
        else { g.connect(this.ctx.destination); }

        o.start(); o.stop(this.ctx.currentTime + d);
    },
    noise: function(d, v, filterType=null, filterFreq=1000) {
        if(!this.ctx) return;
        const bs = this.ctx.sampleRate * d; const b = this.ctx.createBuffer(1, bs, this.ctx.sampleRate);
        const data = b.getChannelData(0); for(let i=0; i<bs; i++) data[i] = Math.random() * 2 - 1;
        const n = this.ctx.createBufferSource(); n.buffer = b; 
        const g = this.ctx.createGain(); const filter = this.ctx.createBiquadFilter();

        filter.type = filterType || 'allpass';
        filter.frequency.setValueAtTime(filterFreq, this.ctx.currentTime);

        g.gain.setValueAtTime(v, this.ctx.currentTime);
        g.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + d);

        n.connect(filter); filter.connect(g); g.connect(this.ctx.destination);
        n.start();
    },
    rain: function(d, v) {
        if(!this.ctx) return;
        this.noise(d, v * 0.4, 'lowpass', 600);
        let drops = setInterval(() => {
            this.play(800 + Math.random()*600, 'sine', 0.05, v*0.3, 2000, (Math.random()-0.5), 'highpass', 1000);
        }, 80);
        setTimeout(() => clearInterval(drops), d * 1000);
    },
    wind: function(d, v) {
        if(!this.ctx) return;
        const bs = this.ctx.sampleRate * d; const b = this.ctx.createBuffer(1, bs, this.ctx.sampleRate);
        const data = b.getChannelData(0); for(let i=0; i<bs; i++) data[i] = (Math.random() * 2 - 1) * 0.5;
        const n = this.ctx.createBufferSource(); n.buffer = b;
        const filter = this.ctx.createBiquadFilter(); filter.type = 'bandpass'; filter.Q.value = 1.5;
        const lfo = this.ctx.createOscillator(); lfo.type = 'sine'; lfo.frequency.value = 0.2;
        const lfoGain = this.ctx.createGain(); lfoGain.gain.value = 1200;
        filter.frequency.value = 400;
        lfo.connect(lfoGain); lfoGain.connect(filter.frequency);
        const g = this.ctx.createGain(); g.gain.setValueAtTime(v, this.ctx.currentTime);
        g.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + d);
        n.connect(filter); filter.connect(g); g.connect(this.ctx.destination);
        lfo.start(); n.start(); setTimeout(() => lfo.stop(), d*1000);
    },
    fire: function(d, v) {
        if(!this.ctx) return;
        this.noise(d, v * 0.3, 'lowpass', 200);
        let crackle = setInterval(() => {
            if(Math.random() > 0.4) this.noise(0.05, v * 0.6, 'highpass', 2000);
        }, 150);
        setTimeout(() => clearInterval(crackle), d * 1000);
    },
    heartbeat: function(d, v) {
        if(!this.ctx) return;
        let beats = setInterval(() => {
            this.play(60, 'sine', 0.2, v, 40);
            setTimeout(() => this.play(60, 'sine', 0.2, v*0.8, 40), 200);
        }, 1000);
        setTimeout(() => clearInterval(beats), d * 1000);
    }
};