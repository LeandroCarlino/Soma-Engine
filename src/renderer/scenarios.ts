import { state } from '../state';
import type { EscenarioType, BgLayerType } from '../types';

export const drawProceduralBG = (ctx: CanvasRenderingContext2D, w: number, h: number, type: BgLayerType, f: number, mx: number, my: number): void => {
    ctx.fillStyle = state.bgColor;
    ctx.fillRect(0, 0, w, h);

    if (type === 'grid') {
        ctx.strokeStyle = '#0f0';
        ctx.lineWidth = 1;
        ctx.globalAlpha = 0.2;
        const offX = (mx * 0.1 + f * 0.5) % 40;
        const offY = (my * 0.1) % 40;
        for (let i = 0; i < w; i += 40) {
            ctx.beginPath();
            ctx.moveTo(i - offX, 0);
            ctx.lineTo(i - offX, h);
            ctx.stroke();
        }
        for (let j = 0; j < h; j += 40) {
            ctx.beginPath();
            ctx.moveTo(0, j - offY);
            ctx.lineTo(w, j - offY);
            ctx.stroke();
        }
        
        for (let i = 0; i < w; i += 80) {
            for (let j = 0; j < h; j += 80) {
                if (Math.random() > 0.98) {
                    ctx.globalAlpha = Math.random() * 0.3;
                    ctx.fillStyle = '#0f0';
                    ctx.fillRect(i, j, 2, 2);
                }
            }
        }
        ctx.globalAlpha = 1;
    } else if (type === 'void') {
        const rad = ctx.createRadialGradient(w / 2 - mx * 0.1, h / 2 - my * 0.1, 0, w / 2, h / 2, w * 0.7);
        rad.addColorStop(0, '#300');
        rad.addColorStop(0.5, '#100');
        rad.addColorStop(1, '#000');
        ctx.fillStyle = rad;
        ctx.fillRect(0, 0, w, h);
        
        ctx.globalAlpha = 0.1;
        for (let i = 0; i < 50; i++) {
            const x = Math.sin(f * 0.01 + i) * w * 0.3 + w / 2;
            const y = Math.cos(f * 0.008 + i * 1.5) * h * 0.3 + h / 2;
            ctx.beginPath();
            ctx.arc(x, y, 1, 0, Math.PI * 2);
            ctx.fillStyle = '#f00';
            ctx.fill();
        }
        ctx.globalAlpha = 1;
    }
};

const drawEscenarioCiudad = (ctx: CanvasRenderingContext2D, w: number, h: number, f: number): void => {
    const grad = ctx.createLinearGradient(0, 0, 0, h);
    grad.addColorStop(0, '#1a1a2e');
    grad.addColorStop(0.5, '#16213e');
    grad.addColorStop(1, '#0f0f23');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);
    
    ctx.fillStyle = '#2a2a4e';
    for (let i = 0; i < 15; i++) {
        const x = (i * 90 + 20) % w;
        const bh = 100 + Math.sin(i * 1.5) * 80;
        ctx.fillRect(x, h - bh, 60, bh);
        
        for (let y = h - bh + 20; y < h - 20; y += 30) {
            for (let lx = x + 10; lx < x + 55; lx += 20) {
                if (Math.random() > 0.3) {
                    ctx.fillStyle = `rgba(255, ${150 + Math.random() * 100}, 50, ${0.5 + Math.random() * 0.5})`;
                    ctx.fillRect(lx, y, 10, 15);
                }
            }
        }
        ctx.fillStyle = '#2a2a4e';
    }
    
    ctx.strokeStyle = '#ff6b6b';
    ctx.lineWidth = 2;
    ctx.globalAlpha = 0.5 + Math.sin(f * 0.1) * 0.3;
    for (let i = 0; i < 5; i++) {
        const x = 100 + i * 200;
        ctx.beginPath();
        ctx.moveTo(x, 10);
        ctx.lineTo(x, 30);
        ctx.stroke();
    }
    ctx.globalAlpha = 1;
};

const drawEscenarioBosque = (ctx: CanvasRenderingContext2D, w: number, h: number, f: number): void => {
    const grad = ctx.createLinearGradient(0, 0, 0, h);
    grad.addColorStop(0, '#0d1b2a');
    grad.addColorStop(0.4, '#1b263b');
    grad.addColorStop(1, '#2d4a22');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);
    
    const windEffect = Math.sin(f * 0.02) * 3;
    
    const drawTree = (x: number, size: number, depth: number) => {
        if (depth <= 0 || size < 10) return;
        const tilt = windEffect * (5 - depth) * 0.1;
        ctx.fillStyle = '#3d2914';
        ctx.fillRect(x - size * 0.1, h - size * 0.5, size * 0.2, size * 0.5);
        
        ctx.fillStyle = `rgb(${20 + depth * 10}, ${80 + depth * 20}, ${20 + depth * 10})`;
        ctx.beginPath();
        ctx.moveTo(x - size * 0.4 + tilt, h - size * 0.4);
        ctx.lineTo(x + tilt * 2, h - size);
        ctx.lineTo(x + size * 0.4 + tilt, h - size * 0.4);
        ctx.fill();
    };
    
    for (let i = 0; i < 12; i++) {
        const x = (i * 110 + Math.sin(i) * 50) % w;
        const size = 60 + Math.sin(i * 2) * 30;
        drawTree(x, size, 4 - (i % 3));
    }
    
    const glow = ctx.createRadialGradient(w / 2, h * 0.3, 0, w / 2, h * 0.3, 200);
    glow.addColorStop(0, 'rgba(100, 150, 50, 0.2)');
    glow.addColorStop(1, 'transparent');
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, w, h);
};

const drawEscenarioPlaya = (ctx: CanvasRenderingContext2D, w: number, h: number, f: number): void => {
    const grad = ctx.createLinearGradient(0, 0, 0, h);
    grad.addColorStop(0, '#ff7e5f');
    grad.addColorStop(0.3, '#feb47b');
    grad.addColorStop(0.35, '#87ceeb');
    grad.addColorStop(1, '#1e3c72');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);
    
    ctx.fillStyle = '#f4d03f';
    ctx.fillRect(0, h * 0.65, w, h * 0.35);
    
    ctx.fillStyle = '#87ceeb';
    for (let i = 0; i < 8; i++) {
        const waveY = h * 0.35 + Math.sin(f * 0.02 + i * 0.5) * 10;
        ctx.beginPath();
        ctx.arc(i * (w / 6) + 50, waveY, 30, 0, Math.PI * 2);
        ctx.fill();
    }
    
    ctx.fillStyle = '#f4a460';
    ctx.beginPath();
    ctx.moveTo(w * 0.3, h * 0.7);
    ctx.lineTo(w * 0.35, h * 0.35);
    ctx.lineTo(w * 0.4, h * 0.7);
    ctx.fill();
    
    const sunGrad = ctx.createRadialGradient(w * 0.85, h * 0.15, 0, w * 0.85, h * 0.15, 60);
    sunGrad.addColorStop(0, '#fff');
    sunGrad.addColorStop(0.3, '#ffd700');
    sunGrad.addColorStop(1, 'transparent');
    ctx.fillStyle = sunGrad;
    ctx.fillRect(w * 0.6, 0, w * 0.4, h * 0.4);
};

const drawEscenarioEspacio = (ctx: CanvasRenderingContext2D, w: number, h: number, f: number): void => {
    const grad = ctx.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w);
    grad.addColorStop(0, '#0a0a1a');
    grad.addColorStop(1, '#000');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);
    
    ctx.fillStyle = '#fff';
    for (let i = 0; i < 200; i++) {
        const sx = (i * 37 + Math.sin(i * 0.3) * 100) % w;
        const sy = (i * 23 + Math.cos(i * 0.5) * 50) % h;
        const size = 0.5 + Math.random() * 1.5;
        const twinkle = Math.sin(f * 0.05 + i) * 0.5 + 0.5;
        ctx.globalAlpha = twinkle * 0.8;
        ctx.beginPath();
        ctx.arc(sx, sy, size, 0, Math.PI * 2);
        ctx.fill();
    }
    ctx.globalAlpha = 1;
    
    const nebulaColors = ['#ff00ff', '#00ffff', '#ff6b6b', '#4ecdc4'];
    for (let i = 0; i < 3; i++) {
        const nx = (f * 0.1 + i * 300) % w;
        const ny = 100 + i * 200;
        const nGrad = ctx.createRadialGradient(nx, ny, 0, nx, ny, 150);
        nGrad.addColorStop(0, nebulaColors[i % nebulaColors.length] + '40');
        nGrad.addColorStop(1, 'transparent');
        ctx.fillStyle = nGrad;
        ctx.fillRect(0, 0, w, h);
    }
};

const drawEscenarioDojo = (ctx: CanvasRenderingContext2D, w: number, h: number, f: number): void => {
    const grad = ctx.createLinearGradient(0, 0, 0, h);
    grad.addColorStop(0, '#2c1810');
    grad.addColorStop(1, '#1a0f0a');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);
    
    ctx.strokeStyle = '#8b4513';
    ctx.lineWidth = 8;
    for (let i = 0; i < 5; i++) {
        const y = i * (h / 5);
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(w, y);
        ctx.stroke();
    }
    
    ctx.fillStyle = '#3d2914';
    ctx.fillRect(50, h * 0.4, 30, h * 0.6);
    ctx.fillRect(w - 80, h * 0.4, 30, h * 0.6);
    
    ctx.strokeStyle = '#ffd700';
    ctx.lineWidth = 2;
    ctx.globalAlpha = 0.5 + Math.sin(f * 0.03) * 0.3;
    ctx.strokeRect(w / 2 - 80, h * 0.35, 160, 100);
    ctx.globalAlpha = 1;
    
    ctx.fillStyle = '#4a3728';
    ctx.fillRect(w * 0.4, h * 0.75, w * 0.2, h * 0.25);
};

const drawEscenarioLaboratorio = (ctx: CanvasRenderingContext2D, w: number, h: number, f: number): void => {
    const grad = ctx.createLinearGradient(0, 0, 0, h);
    grad.addColorStop(0, '#1a1a2e');
    grad.addColorStop(1, '#0f0f1a');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);
    
    ctx.strokeStyle = '#00ff88';
    ctx.lineWidth = 1;
    ctx.globalAlpha = 0.3;
    for (let i = 0; i < 20; i++) {
        const y = (f * 0.5 + i * 50) % h;
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(w, y);
        ctx.stroke();
    }
    ctx.globalAlpha = 1;
    
    const tubeColors = ['#ff006640', '#00ff8840', '#ff660040', '#00ccff40'];
    for (let i = 0; i < 4; i++) {
        const x = 100 + i * 250;
        const bubbleY = (f * 2 + i * 100) % (h * 0.5);
        ctx.fillStyle = tubeColors[i];
        ctx.fillRect(x, h * 0.5, 40, h * 0.5);
        
        ctx.fillStyle = tubeColors[i].replace('40', '80');
        ctx.beginPath();
        ctx.arc(x + 20, h * 0.5 + bubbleY, 8, 0, Math.PI * 2);
        ctx.fill();
    }
    
    ctx.strokeStyle = '#0f0';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(50, h * 0.3);
    ctx.lineTo(w - 50, h * 0.3);
    ctx.lineTo(w - 50, h * 0.8);
    ctx.lineTo(50, h * 0.8);
    ctx.closePath();
    ctx.stroke();
};

const drawEscenarioTemplo = (ctx: CanvasRenderingContext2D, w: number, h: number, f: number): void => {
    const grad = ctx.createLinearGradient(0, 0, 0, h);
    grad.addColorStop(0, '#2d1b4e');
    grad.addColorStop(0.5, '#1a1030');
    grad.addColorStop(1, '#0d0820');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);
    
    ctx.fillStyle = '#4a3a6e';
    ctx.beginPath();
    ctx.moveTo(w / 2, h * 0.1);
    ctx.lineTo(w * 0.8, h * 0.5);
    ctx.lineTo(w * 0.2, h * 0.5);
    ctx.closePath();
    ctx.fill();
    
    ctx.fillStyle = '#3d2d5e';
    ctx.fillRect(w * 0.3, h * 0.5, w * 0.4, h * 0.5);
    
    const beamGrad = ctx.createRadialGradient(w / 2, h * 0.3, 0, w / 2, h * 0.3, 100);
    beamGrad.addColorStop(0, 'rgba(255, 215, 0, 0.4)');
    beamGrad.addColorStop(1, 'transparent');
    ctx.fillStyle = beamGrad;
    ctx.globalAlpha = 0.5 + Math.sin(f * 0.05) * 0.3;
    ctx.fillRect(0, 0, w, h);
    ctx.globalAlpha = 1;
    
    ctx.fillStyle = '#ffd700';
    ctx.beginPath();
    ctx.arc(w / 2, h * 0.35, 20, 0, Math.PI * 2);
    ctx.fill();
};

const drawEscenarioSubmarino = (ctx: CanvasRenderingContext2D, w: number, h: number, f: number): void => {
    const grad = ctx.createLinearGradient(0, 0, 0, h);
    grad.addColorStop(0, '#006994');
    grad.addColorStop(0.5, '#004466');
    grad.addColorStop(1, '#002233');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);
    
    ctx.globalAlpha = 0.1;
    for (let i = 0; i < 30; i++) {
        const bx = (i * 50 + f * 0.5) % w;
        const by = (i * 30 + Math.sin(f * 0.02 + i) * 20) % h;
        ctx.fillStyle = '#87ceeb';
        ctx.beginPath();
        ctx.ellipse(bx, by, 3, 8, 0, 0, Math.PI * 2);
        ctx.fill();
    }
    ctx.globalAlpha = 1;
    
    ctx.fillStyle = '#8b7355';
    ctx.beginPath();
    ctx.moveTo(-50, h * 0.8);
    ctx.lineTo(w * 0.3, h * 0.6);
    ctx.lineTo(w * 0.4, h * 0.85);
    ctx.lineTo(w * 0.6, h * 0.65);
    ctx.lineTo(w + 50, h * 0.75);
    ctx.lineTo(w + 50, h + 50);
    ctx.lineTo(-50, h + 50);
    ctx.fill();
    
    for (let i = 0; i < 8; i++) {
        const fx = (f * 0.3 + i * 150) % (w + 100) - 50;
        const fy = 50 + i * 50;
        ctx.fillStyle = '#90ee90';
        ctx.beginPath();
        ctx.ellipse(fx, fy, 20, 40, Math.sin(f * 0.02 + i) * 0.3, 0, Math.PI * 2);
        ctx.fill();
    }
};

const drawEscenarioVolcan = (ctx: CanvasRenderingContext2D, w: number, h: number, f: number): void => {
    const grad = ctx.createLinearGradient(0, 0, 0, h);
    grad.addColorStop(0, '#1a0a0a');
    grad.addColorStop(0.5, '#3d1515');
    grad.addColorStop(1, '#5c2020');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);
    
    ctx.fillStyle = '#2a1515';
    ctx.beginPath();
    ctx.moveTo(w * 0.2, h);
    ctx.lineTo(w * 0.35, h * 0.3);
    ctx.lineTo(w * 0.5, h * 0.4);
    ctx.lineTo(w * 0.65, h * 0.3);
    ctx.lineTo(w * 0.8, h);
    ctx.fill();
    
    const lavaGrad = ctx.createRadialGradient(w * 0.5, h * 0.2, 0, w * 0.5, h * 0.3, 80);
    lavaGrad.addColorStop(0, '#ffff00');
    lavaGrad.addColorStop(0.3, '#ff6600');
    lavaGrad.addColorStop(1, '#ff000080');
    ctx.fillStyle = lavaGrad;
    ctx.globalAlpha = 0.7 + Math.sin(f * 0.1) * 0.3;
    ctx.beginPath();
    ctx.ellipse(w * 0.5, h * 0.35, 60, 30, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
    
    for (let i = 0; i < 15; i++) {
        const px = w * 0.5 + (Math.random() - 0.5) * 100;
        const py = h * 0.3 - f * 2 - i * 30;
        if (py > 0) {
            ctx.fillStyle = Math.random() > 0.5 ? '#ff6600' : '#ffcc00';
            ctx.globalAlpha = Math.max(0, 1 - (h * 0.3 - py) / 200);
            ctx.beginPath();
            ctx.arc(px, py, 3 + Math.random() * 5, 0, Math.PI * 2);
            ctx.fill();
        }
    }
    ctx.globalAlpha = 1;
};

const drawEscenarioNieve = (ctx: CanvasRenderingContext2D, w: number, h: number, f: number): void => {
    const grad = ctx.createLinearGradient(0, 0, 0, h);
    grad.addColorStop(0, '#1a1a2e');
    grad.addColorStop(0.5, '#2d3a4a');
    grad.addColorStop(1, '#4a5568');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);
    
    ctx.fillStyle = '#e8e8e8';
    for (let i = 0; i < 20; i++) {
        const mx = (i * 80 + 30) % w;
        const mh = 30 + Math.sin(i * 1.5) * 20;
        ctx.beginPath();
        ctx.moveTo(mx - 50, h);
        ctx.quadraticCurveTo(mx, h - mh, mx + 50, h);
        ctx.fill();
    }
    
    for (let i = 0; i < 100; i++) {
        const sx = (i * 47 + Math.sin(i * 0.3) * 30) % w;
        const sy = (f * 0.5 + i * 37) % h;
        ctx.fillStyle = '#fff';
        ctx.globalAlpha = 0.5 + Math.random() * 0.5;
        ctx.beginPath();
        ctx.arc(sx, sy, 1 + Math.random() * 2, 0, Math.PI * 2);
        ctx.fill();
    }
    ctx.globalAlpha = 1;
    
    const moonGrad = ctx.createRadialGradient(w * 0.85, h * 0.15, 0, w * 0.85, h * 0.15, 50);
    moonGrad.addColorStop(0, '#fffacd');
    moonGrad.addColorStop(0.5, '#fffacd80');
    moonGrad.addColorStop(1, 'transparent');
    ctx.fillStyle = moonGrad;
    ctx.fillRect(w * 0.7, 0, w * 0.3, h * 0.4);
};

export const drawEscenario = (ctx: CanvasRenderingContext2D, w: number, h: number, escenario: EscenarioType, f: number): void => {
    ctx.fillStyle = state.bgColor;
    ctx.fillRect(0, 0, w, h);
    
    switch (escenario) {
        case 'ciudad':
            drawEscenarioCiudad(ctx, w, h, f);
            break;
        case 'bosque':
            drawEscenarioBosque(ctx, w, h, f);
            break;
        case 'playa':
            drawEscenarioPlaya(ctx, w, h, f);
            break;
        case 'espacio':
            drawEscenarioEspacio(ctx, w, h, f);
            break;
        case 'dojo':
            drawEscenarioDojo(ctx, w, h, f);
            break;
        case 'laboratorio':
            drawEscenarioLaboratorio(ctx, w, h, f);
            break;
        case 'templo':
            drawEscenarioTemplo(ctx, w, h, f);
            break;
        case 'submarino':
            drawEscenarioSubmarino(ctx, w, h, f);
            break;
        case 'volcan':
            drawEscenarioVolcan(ctx, w, h, f);
            break;
        case 'nieve':
            drawEscenarioNieve(ctx, w, h, f);
            break;
        default:
            drawProceduralBG(ctx, w, h, state.bgLayer, f, w / 2, h / 2);
    }
};
