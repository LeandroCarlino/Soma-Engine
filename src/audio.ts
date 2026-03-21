import type { OscillatorType, FilterType } from './types';

export const Sfx = {
    ctx: null as AudioContext | null,
    masterGain: null as GainNode | null,
    reverbNode: null as ConvolverNode | null,
    isInitialized: false,

    init(): Promise<void> {
        return new Promise((resolve, reject) => {
            if (this.isInitialized) {
                resolve();
                return;
            }

            try {
                this.ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
                
                this.masterGain = this.ctx.createGain();
                this.masterGain.gain.value = 0.7;
                this.masterGain.connect(this.ctx.destination);

                this.reverbNode = this.ctx.createConvolver();
                const reverbLength = this.ctx.sampleRate * 1.5;
                const impulse = this.ctx.createBuffer(2, reverbLength, this.ctx.sampleRate);
                for (let channel = 0; channel < 2; channel++) {
                    const channelData = impulse.getChannelData(channel);
                    for (let i = 0; i < reverbLength; i++) {
                        channelData[i] = (Math.random() * 2 - 1) * Math.exp(-i / (reverbLength * 0.3));
                    }
                }
                this.reverbNode.buffer = impulse;

                const reverbGain = this.ctx.createGain();
                reverbGain.gain.value = 0.2;
                this.reverbNode.connect(reverbGain);
                reverbGain.connect(this.masterGain);

                if (this.ctx.state === 'suspended') {
                    this.ctx.resume().then(() => {
                        this.isInitialized = true;
                        console.log('SOMA: Audio subsystem inicializado');
                        resolve();
                    }).catch(reject);
                } else {
                    this.isInitialized = true;
                    console.log('SOMA: Audio subsystem inicializado');
                    resolve();
                }
            } catch (e) {
                console.error('SOMA: Error inicializando audio:', e);
                reject(e);
            }
        });
    },

    play(
        f: number,
        t: OscillatorType,
        d: number,
        v: number,
        f2: number | null = null,
        pan: number = 0,
        filterType: FilterType | null = null,
        filterFreq: number = 1000
    ): void {
        if (!this.ctx || !this.masterGain) return;
        try {
            const o = this.ctx.createOscillator();
            const g = this.ctx.createGain();
            const panner = this.ctx.createStereoPanner ? this.ctx.createStereoPanner() : null;
            const filter = this.ctx.createBiquadFilter();

            o.type = t;
            o.frequency.setValueAtTime(f, this.ctx.currentTime);
            if (f2) {
                o.frequency.exponentialRampToValueAtTime(f2, this.ctx.currentTime + d);
            }

            g.gain.setValueAtTime(v, this.ctx.currentTime);
            g.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + d);

            filter.type = filterType || 'allpass';
            filter.frequency.setValueAtTime(filterFreq, this.ctx.currentTime);
            filter.Q.value = 1;

            if (panner) panner.pan.value = Math.max(-1, Math.min(1, pan));

            o.connect(filter);
            filter.connect(g);
            if (panner) {
                g.connect(panner);
                panner.connect(this.masterGain);
            } else {
                g.connect(this.masterGain);
            }

            o.start();
            o.stop(this.ctx.currentTime + d);
        } catch (e) {
            console.warn('SOMA: Error en play():', e);
        }
    },

    playChord(notes: number[], type: OscillatorType, d: number, v: number): void {
        notes.forEach((note, i) => {
            setTimeout(() => this.play(note, type, d, v * 0.6), i * 50);
        });
    },

    noise(d: number, v: number, filterType: FilterType | null = null, filterFreq: number = 1000): void {
        if (!this.ctx || !this.masterGain) return;
        try {
            const bs = Math.floor(this.ctx.sampleRate * d);
            const b = this.ctx.createBuffer(1, bs, this.ctx.sampleRate);
            const data = b.getChannelData(0);
            for (let i = 0; i < bs; i++) data[i] = Math.random() * 2 - 1;
            const n = this.ctx.createBufferSource();
            n.buffer = b;
            const g = this.ctx.createGain();
            const filter = this.ctx.createBiquadFilter();

            filter.type = filterType || 'allpass';
            filter.frequency.setValueAtTime(filterFreq, this.ctx.currentTime);

            g.gain.setValueAtTime(v, this.ctx.currentTime);
            g.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + d);

            n.connect(filter);
            filter.connect(g);
            g.connect(this.masterGain);
            n.start();
        } catch (e) {
            console.warn('SOMA: Error en noise():', e);
        }
    },

    rain(d: number, v: number): void {
        if (!this.ctx) return;
        this.noise(d, v * 0.4, 'lowpass', 600);
        const drops = setInterval(() => {
            this.play(800 + Math.random() * 600, 'sine', 0.05, v * 0.3, 2000, (Math.random() - 0.5), 'highpass', 1000);
        }, 80);
        setTimeout(() => clearInterval(drops), d * 1000);
    },

    wind(d: number, v: number): void {
        if (!this.ctx) return;
        try {
            const bs = Math.floor(this.ctx.sampleRate * d);
            const b = this.ctx.createBuffer(1, bs, this.ctx.sampleRate);
            const data = b.getChannelData(0);
            for (let i = 0; i < bs; i++) data[i] = (Math.random() * 2 - 1) * 0.5;
            const n = this.ctx.createBufferSource();
            n.buffer = b;
            const filter = this.ctx.createBiquadFilter();
            filter.type = 'bandpass';
            filter.Q.value = 1.5;
            const lfo = this.ctx.createOscillator();
            lfo.type = 'sine';
            lfo.frequency.value = 0.2;
            const lfoGain = this.ctx.createGain();
            lfoGain.gain.value = 1200;
            filter.frequency.value = 400;
            lfo.connect(lfoGain);
            lfoGain.connect(filter.frequency);
            const g = this.ctx.createGain();
            g.gain.setValueAtTime(v, this.ctx.currentTime);
            g.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + d);
            n.connect(filter);
            filter.connect(g);
            g.connect(this.masterGain!);
            lfo.start();
            n.start();
            setTimeout(() => lfo.stop(), d * 1000);
        } catch (e) {
            console.warn('SOMA: Error en wind():', e);
        }
    },

    fire(d: number, v: number): void {
        if (!this.ctx) return;
        this.noise(d, v * 0.3, 'lowpass', 200);
        const crackle = setInterval(() => {
            if (Math.random() > 0.4) this.noise(0.05, v * 0.6, 'highpass', 2000);
        }, 150);
        setTimeout(() => clearInterval(crackle), d * 1000);
    },

    heartbeat(d: number, v: number): void {
        if (!this.ctx) return;
        const beats = setInterval(() => {
            this.play(60, 'sine', 0.2, v, 40);
            setTimeout(() => this.play(60, 'sine', 0.2, v * 0.8, 40), 200);
        }, 1000);
        setTimeout(() => clearInterval(beats), d * 1000);
    },

    thunder(d: number): void {
        this.noise(d, 0.5, 'lowpass', 80);
        setTimeout(() => this.play(40, 'sine', 2, 0.3), 500);
    },

    setVolume(v: number): void {
        if (this.masterGain) {
            this.masterGain.gain.value = Math.max(0, Math.min(1, v));
        }
    }
};
