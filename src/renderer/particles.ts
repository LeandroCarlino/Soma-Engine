export interface Particle {
    x: number;
    y: number;
    vx: number;
    vy: number;
    size: number;
    life: number;
    maxLife: number;
    color: string;
    type: string;
}

const particlePool: Particle[] = [];
const MAX_POOL_SIZE = 800; // Increased pool size
export const activeParticles: Particle[] = [];

export const acquireParticle = (): Particle => {
    if (particlePool.length > 0) return particlePool.pop()!;
    return { x: 0, y: 0, vx: 0, vy: 0, size: 0, life: 0, maxLife: 0, color: '', type: '' };
};

export const releaseParticle = (p: Particle): void => {
    if (particlePool.length < MAX_POOL_SIZE) particlePool.push(p);
};

export const spawnParticles = (type: string, count: number, canvasWidth: number) => {
    for (let i = 0; i < count && activeParticles.length < MAX_POOL_SIZE; i++) {
        const p = acquireParticle();
        p.type = type;
        
        // Default spawn at top
        p.x = Math.random() * canvasWidth;
        p.y = -10;
        p.vx = (Math.random() - 0.5) * 2;
        p.vy = Math.random() * 5 + 3;
        p.size = Math.random() * 3 + 1;
        p.life = 0;
        p.maxLife = Math.random() * 200 + 100;
        p.color = '#fff';

        // Specific configurations
        switch (type) {
            case 'lluvia':
                p.color = 'rgba(150, 200, 255, 0.6)';
                p.vy = 15 + Math.random() * 5;
                break;
            case 'nieve':
                p.color = 'rgba(255, 255, 255, 0.8)';
                p.vy = 2 + Math.random() * 2;
                break;
            case 'hojas':
                p.color = Math.random() > 0.5 ? '#8a3' : '#d65';
                p.vy = 3 + Math.random();
                p.size = 6;
                break;
            case 'petalos':
                p.color = Math.random() > 0.5 ? '#ffb7c5' : '#ffc0cb'; // Pink cherry blossoms
                p.vy = 2 + Math.random();
                p.size = 5;
                break;
            case 'datos':
                p.color = '#0f0';
                break;
            case 'ceniza':
                p.color = '#555';
                p.vy = 1 + Math.random();
                p.vx = (Math.random() - 0.5) * 4;
                break;
            case 'burbujas':
                p.y = 800 + 10; // Spawn bottom
                p.vy = -(2 + Math.random() * 3); // Go up
                p.color = 'rgba(255, 255, 255, 0.3)';
                p.size = Math.random() * 10 + 2;
                break;
            case 'magia':
                p.x = Math.random() * canvasWidth;
                p.y = Math.random() * 800;
                p.vx = (Math.random() - 0.5) * 4;
                p.vy = (Math.random() - 0.5) * 4;
                p.color = `hsla(${Math.random() * 360}, 100%, 70%, 0.8)`;
                p.maxLife = 60;
                break;
            case 'chispas':
                p.x = Math.random() * canvasWidth;
                p.y = Math.random() * 800; // Random spawn for ambient sparks
                p.vy = Math.random() * 5; // Gravity
                p.color = Math.random() > 0.5 ? '#ff0' : '#fff';
                p.maxLife = 40;
                break;
        }
        
        activeParticles.push(p);
    }
};

export const updateParticles = (canvasHeight: number, deltaTime: number, frame: number) => {
    for (let i = activeParticles.length - 1; i >= 0; i--) {
        const p = activeParticles[i];
        p.life++;
        p.x += p.vx * deltaTime;
        p.y += p.vy * deltaTime;
        
        // Environmental physics
        if (p.type === 'nieve') {
            p.vx += (Math.random() - 0.5) * 0.1;
        } else if (p.type === 'hojas' || p.type === 'petalos') {
            p.vx += Math.sin(frame * 0.05 + i) * 0.05;
            p.x += Math.sin(frame * 0.02 + p.y * 0.01) * 0.5; // Flutter
        } else if (p.type === 'burbujas') {
            p.vx += Math.sin(frame * 0.1 + i) * 0.1; // Wobble
        }
        
        // Bounds check
        const isOutOfBounds = (p.vy > 0 && p.y > canvasHeight + 20) || // Falling
                              (p.vy < 0 && p.y < -20) || // Rising
                              p.life > p.maxLife;

        if (isOutOfBounds) {
            releaseParticle(activeParticles.splice(i, 1)[0]);
        }
    }
};

export const drawParticles = (ctx: CanvasRenderingContext2D, frame: number) => {
    for (const p of activeParticles) {
        ctx.fillStyle = p.color;
        
        if (p.type === 'datos') {
            ctx.font = '16px monospace';
            ctx.fillText(Math.random() > 0.5 ? '1' : '0', p.x, p.y);
        } else if (p.type === 'hojas' || p.type === 'petalos') {
            ctx.beginPath();
            // Rotate leaf/petal based on time
            const angle = frame * 0.05 + p.x * 0.01;
            const rx = Math.cos(angle) * p.size;
            const ry = Math.sin(angle) * (p.size / 2);
            ctx.ellipse(p.x, p.y, Math.abs(rx), Math.abs(ry), angle, 0, Math.PI * 2);
            ctx.fill();
        } else if (p.type === 'nieve' || p.type === 'ceniza' || p.type === 'magia') {
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size * (1 - p.life/p.maxLife), 0, Math.PI * 2); // Fade size
            ctx.fill();
        } else if (p.type === 'burbujas') {
            ctx.strokeStyle = p.color;
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            ctx.stroke();
            // Highlight
            ctx.fillStyle = 'rgba(255,255,255,0.5)';
            ctx.beginPath();
            ctx.arc(p.x - p.size*0.3, p.y - p.size*0.3, p.size/4, 0, Math.PI*2);
            ctx.fill();
        } else {
            ctx.fillRect(p.x, p.y, 2, p.type === 'chispas' ? 5 : 25);
        }
    }
};
