export const Sfx = {
    ctx: null,
    init: function() {
        if(!this.ctx) this.ctx = new (window.AudioContext || window.webkitAudioContext)();
        if(this.ctx.state === 'suspended') this.ctx.resume();
    },
    play: function(f, t, d, v, f2=null) {
        if(!this.ctx) return;
        const o = this.ctx.createOscillator(); const g = this.ctx.createGain();
        o.type = t; o.frequency.setValueAtTime(f, this.ctx.currentTime);
        if(f2) o.frequency.exponentialRampToValueAtTime(f2, this.ctx.currentTime + d);
        o.connect(g); g.connect(this.ctx.destination);
        g.gain.setValueAtTime(v, this.ctx.currentTime);
        g.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + d);
        o.start(); o.stop(this.ctx.currentTime + d);
    },
    noise: function(d, v) {
        if(!this.ctx) return;
        const bs = this.ctx.sampleRate * d; const b = this.ctx.createBuffer(1, bs, this.ctx.sampleRate);
        const data = b.getChannelData(0); for(let i=0; i<bs; i++) data[i] = Math.random() * 2 - 1;
        const n = this.ctx.createBufferSource(); n.buffer = b; const g = this.ctx.createGain();
        n.connect(g); g.connect(this.ctx.destination);
        g.gain.setValueAtTime(v, this.ctx.currentTime);
        g.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + d);
        n.start();
    }
};