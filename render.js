import { state } from './state.js';

export const baseImg = new Image();
baseImg.src = 'imagen.png';
let frame = 0;

// Caché off-screen para partículas complejas (Incremento de FPS)
const spriteCache = {};
const buildCache = () => {
    // Corazón
    const cvsHeart = document.createElement('canvas');
    cvsHeart.width = 30; cvsHeart.height = 30;
    const ctxH = cvsHeart.getContext('2d');
    ctxH.fillStyle = '#f0f'; ctxH.font = '24px Arial'; ctxH.fillText('❤', 2, 24);
    spriteCache.heart = cvsHeart;

    // Zzz
    const cvsZ = document.createElement('canvas');
    cvsZ.width = 30; cvsZ.height = 30;
    const ctxZ = cvsZ.getContext('2d');
    ctxZ.fillStyle = '#fff'; ctxZ.font = '24px Arial'; ctxZ.fillText('Z', 5, 24);
    spriteCache.z = cvsZ;
};
buildCache();

// O(1) Dictionary Mapping: Environment
const envRenderers = {
    'lluvia': (ctx, w, h, f) => {
        ctx.fillStyle = 'rgba(150, 200, 255, 0.6)';
        for(let i=0; i<120; i++) ctx.fillRect(Math.random()*w, (f*30 + i*30)%h, 2, 25);
    },
    'nieve': (ctx, w, h, f) => {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        for(let i=0; i<100; i++) { ctx.beginPath(); ctx.arc((i*40 + Math.sin(f*0.02 + i)*40)%w, (f*4 + i*50)%h, Math.random()*4+1, 0, Math.PI*2); ctx.fill(); }
    },
    'datos': (ctx, w, h, f) => {
        ctx.fillStyle = '#0f0'; ctx.font = '16px monospace';
        for(let i=0; i<80; i++) ctx.fillText(Math.random()>0.5?'1':'0', (i*20)%w, (f*15 + i*40)%h);
    },
    'hojas': (ctx, w, h, f) => {
        ctx.fillStyle = '#8a3';
        for(let i=0; i<40; i++) { ctx.beginPath(); ctx.ellipse((f*3 + i*60)%w, (f*4 + i*50)%h, 10, 5, f*0.1 + i, 0, Math.PI*2); ctx.fill(); }
    },
    'estrellas': (ctx, w, h, f) => {
        ctx.fillStyle = '#fff';
        for(let i=0; i<200; i++) { if(Math.random()>0.9) ctx.fillRect((i*19)%w, (i*27)%h, Math.random()*3, Math.random()*3); }
    },
    'petalos': (ctx, w, h, f) => {
        ctx.fillStyle = 'rgba(255, 180, 200, 0.8)';
        for(let i=0; i<50; i++) { ctx.beginPath(); ctx.arc((f*2 + i*45)%w, (f*3 + i*60)%h, 6, 0, Math.PI*2); ctx.fill(); }
    },
    'notas': (ctx, w, h, f) => {
        ctx.fillStyle = '#fff'; ctx.font = '24px Arial';
        const symbols = ['♪', '♫', '♬'];
        for(let i=0; i<15; i++) ctx.fillText(symbols[i%3], (i*80 + Math.sin(f*0.05)*30)%w, h - (f*2 + i*70)%h);
    },
    'none': () => {}
};

// O(1) Dictionary Mapping: Particles
const particleRenderers = {
    'sangre': (ctx, x, y, w, h, f) => {
        ctx.fillStyle = '#700';
        for(let i=0; i<50; i++) ctx.fillRect(x + Math.abs(Math.sin(i*13))*w, y + (f*5 + i*25)%h, 4, 12);
    },
    'fuego': (ctx, x, y, w, h, f) => {
        for(let i=0; i<50; i++) {
            ctx.fillStyle = `rgba(255, ${Math.random()*150}, 0, 0.8)`;
            ctx.beginPath(); ctx.arc(x + Math.random()*w, y + h - (f*7 + i*18)%h, Math.random()*14, 0, Math.PI*2); ctx.fill();
        }
    },
    'estatica': (ctx, x, y, w, h, f) => {
        for(let i=0; i<200; i++) { ctx.fillStyle = Math.random()>0.5?'#fff':'#000'; ctx.fillRect(x+Math.random()*w, y+Math.random()*h, 3, 3); }
    },
    'neon': (ctx, x, y, w, h, f) => {
        ctx.strokeStyle = `hsl(${f*8%360}, 100%, 50%)`; ctx.lineWidth = 6; ctx.strokeRect(x+5, y+5, w-10, h-10);
    },
    'burbujas': (ctx, x, y, w, h, f) => {
        ctx.strokeStyle = 'rgba(255,255,255,0.5)';
        for(let i=0; i<20; i++) { ctx.beginPath(); ctx.arc(x + Math.abs(Math.cos(i*7))*w, y + h - (f*3 + i*30)%h, 6, 0, Math.PI*2); ctx.stroke(); }
    },
    'cristales': (ctx, x, y, w, h, f) => {
        ctx.fillStyle = 'rgba(0, 200, 255, 0.9)';
        for(let i=0; i<30; i++) { ctx.fillRect(x + Math.random()*w, y + (f*3 + i*40)%h, 5, 5); }
    },
    'humo': (ctx, x, y, w, h, f) => {
        ctx.fillStyle = 'rgba(100, 100, 100, 0.3)';
        for(let i=0; i<20; i++) { ctx.beginPath(); ctx.arc(x + Math.random()*w, y + h - (f*4 + i*20)%h, Math.random()*25+10, 0, Math.PI*2); ctx.fill(); }
    },
    'rayos': (ctx, x, y, w, h, f) => {
        ctx.strokeStyle = '#fff'; ctx.lineWidth = 3;
        if(Math.random()>0.6) {
            ctx.beginPath(); ctx.moveTo(x + Math.random()*w, y);
            ctx.lineTo(x + Math.random()*w, y + h/2); ctx.lineTo(x + Math.random()*w, y + h); ctx.stroke();
        }
    },
    'corazones': (ctx, x, y, w, h, f) => {
        for(let i=0; i<15; i++) ctx.drawImage(spriteCache.heart, x + Math.abs(Math.sin(i*11))*w, y + h - (f*3 + i*20)%h);
    },
    'zzz': (ctx, x, y, w, h, f) => {
        for(let i=0; i<8; i++) ctx.drawImage(spriteCache.z, x + Math.abs(Math.cos(i*5))*w, y + h/2 - (f*1.5 + i*40)%(h/2));
    },
    'aura_dorada': (ctx, x, y, w, h, f) => {
        ctx.fillStyle = 'rgba(255, 215, 0, 0.15)';
        for(let i=0; i<6; i++) { ctx.beginPath(); ctx.ellipse(x+w/2, y+h/2, w/1.5 + Math.sin(f*0.15+i)*15, h/1.5 + Math.cos(f*0.15+i)*15, 0, 0, Math.PI*2); ctx.fill(); }
    },
    'polvo': (ctx, x, y, w, h, f) => {
        ctx.fillStyle = 'rgba(150, 150, 150, 0.6)';
        for(let i=0; i<70; i++) ctx.fillRect(x + Math.random()*w, y + (f*1.5 + i*15)%h, 3, 3);
    },
    'none': () => {}
};

// Modificadores estructurales base
const applyAnimModifiers = (modState, f, canvas, mouseX, mouseY) => {
    switch (modState.anim) {
        case 'flotar': modState.offsetY += Math.sin(f * 0.05) * 40; modState.rotation += Math.sin(f * 0.02) * 0.05; break;
        case 'latido': const s = 1 + Math.sin(f * 0.2) * 0.1; modState.scaleX *= s; modState.scaleY *= s; break;
        case 'caos': modState.offsetX += (Math.random()-0.5)*20; modState.offsetY += (Math.random()-0.5)*20; modState.rotation += (Math.random()-0.5)*0.1; break;
        case 'terremoto': modState.offsetX += (Math.random()-0.5)*45; modState.offsetY += (Math.random()-0.5)*45; break;
        case 'glitch': if(Math.random()>0.8) { modState.offsetX += (Math.random()-0.5)*100; modState.scaleY *= 1.2; } break;
        case 'drift': modState.offsetX += Math.sin(f*0.5)*20; canvas.style.filter = 'drop-shadow(-30px 0px 10px rgba(255,255,255,0.3)) blur(2px)'; break;
        case 'reloj': modState.rotation += 0.05; break;
        case 'tornado': modState.rotation += 0.4; modState.scaleX = 1 + Math.sin(f*0.1)*0.8; break;
        case 'gelatina': modState.scaleX *= 1 + Math.sin(f*0.2)*0.2; modState.scaleY *= 1 + Math.cos(f*0.2)*0.2; break;
        case 'vibracion': modState.offsetX += (Math.random()-0.5)*8; modState.offsetY += (Math.random()-0.5)*8; break;
        case 'magnetico': modState.offsetX += (mouseX - canvas.width/2)*0.15; modState.offsetY += (mouseY - canvas.height/2)*0.15; break;
        case 'repeler': modState.offsetX -= (mouseX - canvas.width/2)*0.15; modState.offsetY -= (mouseY - canvas.height/2)*0.15; break;
        case 'rebote': modState.offsetY += Math.abs(Math.sin(f * 0.15)) * -80; break;
        case 'respirar': modState.scaleX *= 1 + Math.sin(f * 0.05) * 0.04; modState.scaleY *= 1 + Math.sin(f * 0.05) * 0.04; break;
        case 'sacudir': modState.rotation += (Math.random()-0.5)*0.3; modState.offsetX += (Math.random()-0.5)*15; modState.offsetY += (Math.random()-0.5)*15; break;
        case 'balanceo': modState.rotation += Math.sin(f * 0.05) * 0.3; break;
    }
};

export const startRenderLoop = (canvas, ctx, getMouseData) => {
    function render() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        document.body.style.backgroundColor = state.bgColor;
        canvas.style.filter = state.filter;
        canvas.style.transform = state.transform;

        if (!baseImg.complete) { requestAnimationFrame(render); return; }

        const mouseData = getMouseData();
        const aspect = baseImg.width / baseImg.height;
        
        // Copia de estado temporal para mutaciones por cuadro
        let modState = { 
            scaleX: state.scaleX, scaleY: state.scaleY, 
            offsetX: state.offsetX, offsetY: state.offsetY, 
            rotation: state.rotation, anim: state.anim 
        };
        
        applyAnimModifiers(modState, frame, canvas, mouseData.x, mouseData.y);

        let h = 450 * state.scale;
        let w = h * aspect;

        // Renderizado ambiental O(1)
        if (state.anim === 'flotar' || state.anim === 'gravedad0' || state.anim === 'abduccion') {
            ctx.fillStyle = `rgba(0,0,0,${Math.max(0.1, 0.6 - (modState.offsetY/150))})`;
            ctx.beginPath(); ctx.ellipse(canvas.width/2, canvas.height/2 + h/2 + 40, w/1.5, 15, 0, 0, Math.PI*2); ctx.fill();
        }

        (envRenderers[state.envParticles] || envRenderers['none'])(ctx, canvas.width, canvas.height, frame);

        if(state.interactive && state.ripples.length > 0) {
            for(let i=state.ripples.length-1; i>=0; i--) {
                let r = state.ripples[i];
                ctx.strokeStyle = `rgba(0, 255, 0, ${r.alpha})`; ctx.lineWidth = 3;
                ctx.beginPath(); ctx.arc(r.x, r.y, r.radius, 0, Math.PI*2); ctx.stroke();
                r.radius += 15; r.alpha -= 0.03;
                if(r.alpha <= 0) state.ripples.splice(i, 1);
            }
        }

        // Función de renderizado de sujeto
        const drawSubject = (drawX, drawY, drawW, drawH, overrideAlpha = null) => {
            ctx.save();
            ctx.translate(canvas.width/2 + modState.offsetX, canvas.height/2 + modState.offsetY);
            ctx.rotate(modState.rotation);
            ctx.scale(modState.scaleX, modState.scaleY);
            ctx.translate(-(canvas.width/2 + modState.offsetX), -(canvas.height/2 + modState.offsetY));

            if(state.shadowColor !== 'transparent') { ctx.shadowBlur = 50; ctx.shadowColor = state.shadowColor; }

            ctx.globalCompositeOperation = 'source-over';
            ctx.globalAlpha = overrideAlpha !== null ? overrideAlpha : state.alpha;
            
            if (state.anim === 'glitch_severo') {
                ctx.globalAlpha = 0.5; ctx.filter = 'hue-rotate(90deg)';
                ctx.drawImage(baseImg, drawX - 15, drawY, drawW, drawH);
                ctx.filter = 'hue-rotate(270deg)';
                ctx.drawImage(baseImg, drawX + 15, drawY, drawW, drawH);
                ctx.filter = 'none';
            }
            
            ctx.drawImage(baseImg, drawX, drawY, drawW, drawH);
            ctx.shadowBlur = 0; ctx.globalCompositeOperation = 'source-atop';
            if (state.overlay !== 'none') { ctx.fillStyle = state.overlay; ctx.fillRect(drawX, drawY, drawW, drawH); }

            // Renderizado de partículas de sujeto O(1)
            (particleRenderers[state.particles] || particleRenderers['none'])(ctx, drawX, drawY, drawW, drawH, frame);

            ctx.restore();
        };

        ctx.globalCompositeOperation = 'source-over';
        const mainX = (canvas.width - w) / 2;
        const mainY = (canvas.height - h) / 2;

        if (state.anim === 'eco') {
            drawSubject(mainX - 50, mainY, w, h, 0.2);
            drawSubject(mainX + 50, mainY, w, h, 0.2);
        }

        if(state.clones > 0) {
            for(let i=0; i<state.clones; i++) {
                const sep = 250 * (i+1);
                drawSubject(mainX - sep, mainY, w * 0.8, h * 0.8);
                drawSubject(mainX + sep, mainY, w * 0.8, h * 0.8);
            }
        }
        drawSubject(mainX, mainY, w, h);

        frame++;
        requestAnimationFrame(render);
    }
    requestAnimationFrame(render);
};