import { state, target, physics } from './state';
import type { Ripple, MouseData } from './types';
import { initWebGL, WebGLContext } from './renderer/webgl';
import { drawEscenario } from './renderer/scenarios';
import { spawnParticles, updateParticles, drawParticles } from './renderer/particles';

export const images: Record<string, HTMLImageElement> = {};
// Use the strict PoseType for keys if possible, but for now string is safer for loading
const poses: string[] = [
    'subject', 'cry', 'fight', 'happy', 'lying', 'running', 'secret', 'squat', 'worried',
    'collapsed', 'disjointed', 'falling', 'meditating', 'overload', 'protection', 'sit', 'pose'
];
export let allLoaded = false;
export const resourcesLoaded = { images: 0, total: poses.length };

// --- Spritesheet System ---
// Configure frame counts manually here. Set to 0 for auto-detect.
const spriteConfig: Record<string, number> = {
    'subject': 24,    // 0 = auto-detect, or set e.g. 4, 8, 12
    'cry': 0,
    'fight': 0,
    'happy': 0,
    'lying': 0,
    'running': 0,
    'secret': 0,
    'squat': 0,
    'worried': 0,
    'collapsed': 0,
    'disjointed': 0,
    'falling': 0,
    'meditating': 0,
    'overload': 0,
    'protection': 0,
    'sit': 0,
    'pose': 0
};

// Animation speed in ms per frame (lower = faster, higher = slower)
const spriteSpeedConfig: Record<string, number> = {
    'subject': 48,
    'cry': 180,
    'fight': 120,
    'happy': 140,
    'lying': 250,
    'running': 80,
    'secret': 200,
    'squat': 200,
    'worried': 180,
    'collapsed': 300,
    'disjointed': 90,
    'falling': 100,
    'meditating': 250,
    'overload': 70,
    'protection': 150,
    'sit': 200,
    'pose': 150
};

// Ping-pong: goes 0→max→0 instead of 0→max→0 jump
const spritePingPongConfig: Record<string, boolean> = {
    'subject': true,
    'cry': true,
    'fight': true,
    'happy': true,
    'lying': true,
    'running': true,
    'secret': true,
    'squat': true,
    'worried': true,
    'collapsed': true,
    'disjointed': true,
    'falling': true,
    'meditating': true,
    'overload': true,
    'protection': true,
    'sit': true,
    'pose': true
};

// --- Micro-Movement Config ---
// Set to false to disable base breathing/idle or pose-specific movements
const microMovementConfig = {
    base: false,  // Breathing + weight shift + rotation
    poses: {
        'subject': false,
        'meditating': true,
        'fight': true,
        'happy': true,
        'cry': true,
        'worried': true,
        'sit': true,
        'squat': true,
        'lying': true,
        'running': true,
        'secret': true,
        'falling': true,
        'collapsed': true,
        'protection': true,
        'overload': true,
        'disjointed': true,
        'pose': true
    } as Record<string, boolean>
};

interface FrameRect {
    source: HTMLImageElement;
    sx: number;
    sy: number;
    sw: number;
    sh: number;
}

interface SpriteData {
    isSpriteSheet: boolean;
    source: HTMLImageElement | null;
    frameWidth: number;
    frameHeight: number;
    frameCount: number;
    currentFrame: number;
    frameTimer: number;
    frameSpeed: number;
    pingPong: boolean;
    direction: number; // 1 = forward, -1 = backward
}

const spriteCache: Record<string, SpriteData> = {};

const detectAndSliceSpriteSheet = (img: HTMLImageElement, poseName: string, forcedFrameCount?: number): SpriteData => {
    const ancho = img.naturalWidth || img.width || 1;
    const alto = img.naturalHeight || img.height || 1;

    const data: SpriteData = {
        isSpriteSheet: false,
        source: img,
        frameWidth: ancho,
        frameHeight: alto,
        frameCount: 1,
        currentFrame: 0,
        frameTimer: 0,
        frameSpeed: 150,
        pingPong: true,
        direction: 1
    };

    let frameCount = forcedFrameCount || 0;

    // Auto-detect if no forced count
    if (!frameCount) {
        const ratio = ancho / alto;
        if (ratio >= 1.8 && ratio <= 16) {
            frameCount = Math.round(ratio);
        }
    }

    if (frameCount >= 2 && frameCount <= 128) {
        data.isSpriteSheet = true;
        data.frameCount = frameCount;
        data.frameWidth = Math.floor(ancho / frameCount);
        data.frameHeight = alto;
        data.frameSpeed = spriteSpeedConfig[poseName] || 150;
        data.pingPong = spritePingPongConfig[poseName] || false;
    }

    return data;
};

const rectDeImagen = (img: HTMLImageElement): FrameRect => ({
    source: img,
    sx: 0,
    sy: 0,
    sw: img.naturalWidth || img.width || 1,
    sh: img.naturalHeight || img.height || 1
});

const getCurrentFrame = (poseName: string, deltaTime: number): FrameRect => {
    const img = images[poseName];
    if (!img || !img.complete || img.naturalWidth === 0) {
        return rectDeImagen(images['subject'] || img);
    }
    
    const sprite = spriteCache[poseName];
    if (!sprite || !sprite.isSpriteSheet) {
        return rectDeImagen(img);
    }
    
    // Advance animation
    sprite.frameTimer += 16.67 * deltaTime;
    if (sprite.frameTimer >= sprite.frameSpeed) {
        sprite.frameTimer = 0;
        
        if (sprite.pingPong) {
            sprite.currentFrame += sprite.direction;
            if (sprite.currentFrame >= sprite.frameCount - 1) {
                sprite.direction = -1;
            } else if (sprite.currentFrame <= 0) {
                sprite.direction = 1;
            }
        } else {
            sprite.currentFrame = (sprite.currentFrame + 1) % sprite.frameCount;
        }
    }
    
    // Se devuelve la región del sheet en vez de un canvas recortado: así no
    // hay 24 canvas de 540x960 (~50 MB) viviendo en memoria.
    return {
        source: img,
        sx: sprite.currentFrame * sprite.frameWidth,
        sy: 0,
        sw: sprite.frameWidth,
        sh: sprite.frameHeight
    };
};

// --- Optimization: Tint Cache ---
let cachedTintCanvas: HTMLCanvasElement | null = null;
let lastTint: string = 'none';
let lastTintFrame: FrameRect | null = null;

const mismoFrame = (a: FrameRect | null, b: FrameRect): boolean =>
    !!a && a.source === b.source && a.sx === b.sx && a.sy === b.sy && a.sw === b.sw && a.sh === b.sh;

const getTintedImage = (frame: FrameRect, tint: string): HTMLCanvasElement => {
    if (cachedTintCanvas && lastTint === tint && mismoFrame(lastTintFrame, frame)) {
        return cachedTintCanvas;
    }

    if (!cachedTintCanvas) {
        cachedTintCanvas = document.createElement('canvas');
    }

    cachedTintCanvas.width = frame.sw;
    cachedTintCanvas.height = frame.sh;
    const ctx = cachedTintCanvas.getContext('2d');
    if (!ctx) return cachedTintCanvas;

    ctx.clearRect(0, 0, frame.sw, frame.sh);
    ctx.drawImage(frame.source, frame.sx, frame.sy, frame.sw, frame.sh, 0, 0, frame.sw, frame.sh);
    const imgData = ctx.getImageData(0, 0, frame.sw, frame.sh);
    const data = imgData.data;
    const r = parseInt(tint.slice(1, 3), 16) || 255;
    const g = parseInt(tint.slice(3, 5), 16) || 0;
    const b = parseInt(tint.slice(5, 7), 16) || 0;

    for (let i = 0; i < data.length; i += 4) {
        if (data[i + 3] > 0) { // If not transparent
            data[i] = r;
            data[i + 1] = g;
            data[i + 2] = b;
        }
    }
    ctx.putImageData(imgData, 0, 0);

    // Update cache state
    lastTint = tint;
    lastTintFrame = { ...frame };

    return cachedTintCanvas;
};

const lerp = (start: number, end: number, factor: number): number => start + (end - start) * factor;

// --- Sprites de partículas ---
// Un gradiente radial cacheado se ve mucho más orgánico que decenas de
// círculos planos, y dibujarlo con "lighter" da el brillo del fuego.
const crearSpriteRadial = (paradas: Array<[number, string]>, tamano = 64): HTMLCanvasElement => {
    const canvas = document.createElement('canvas');
    canvas.width = tamano;
    canvas.height = tamano;
    const ctx = canvas.getContext('2d');
    if (!ctx) return canvas;

    const gradiente = ctx.createRadialGradient(
        tamano / 2, tamano / 2, 0,
        tamano / 2, tamano / 2, tamano / 2,
    );
    for (const [posicion, color] of paradas) gradiente.addColorStop(posicion, color);
    ctx.fillStyle = gradiente;
    ctx.fillRect(0, 0, tamano, tamano);
    return canvas;
};

let fuegoSprite: HTMLCanvasElement | null = null;
let humoSprite: HTMLCanvasElement | null = null;
let overlayCanvas: HTMLCanvasElement | null = null;

const getFuegoSprite = (): HTMLCanvasElement => {
    fuegoSprite ??= crearSpriteRadial([
        [0, 'rgba(255,255,220,1)'],
        [0.22, 'rgba(255,215,90,0.95)'],
        [0.52, 'rgba(255,110,20,0.6)'],
        [1, 'rgba(120,20,0,0)'],
    ]);
    return fuegoSprite;
};

const getHumoSprite = (): HTMLCanvasElement => {
    humoSprite ??= crearSpriteRadial([
        [0, 'rgba(190,190,190,0.55)'],
        [0.55, 'rgba(100,100,100,0.2)'],
        [1, 'rgba(30,30,30,0)'],
    ]);
    return humoSprite;
};

let glContext: WebGLContext | null = null;
let frame = 0;
let ripples: Ripple[] = [];
let lastFrameTime = 0;
let isPageVisible = true;

const drawEmote = (ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, f: number): void => {
    const emoteY = y - 30;
    const pulse = Math.sin(f * 0.1) * 5;
    
    switch (state.pose) {
        case 'happy':
            ctx.fillStyle = '#ffd700';
            ctx.font = 'bold 28px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('^_^', x + w / 2, emoteY + pulse);
            break;
        case 'worried':
            ctx.fillStyle = '#ff6b6b';
            ctx.font = 'bold 28px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('o_o', x + w / 2, emoteY + pulse);
            break;
        case 'cry':
            ctx.fillStyle = '#00bfff';
            ctx.font = 'bold 24px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('T_T', x + w / 2, emoteY + pulse);
            break;
        case 'fight':
            ctx.fillStyle = '#ff4500';
            ctx.font = 'bold 28px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('>:(', x + w / 2, emoteY + pulse);
            break;
        case 'meditating':
            ctx.fillStyle = '#00ff88';
            ctx.font = 'bold 24px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('-_-', x + w / 2, emoteY + pulse);
            break;
        case 'overload':
            const glowSize = 30 + Math.sin(f * 0.2) * 10;
            const glow = ctx.createRadialGradient(x + w / 2, y + h / 2, 0, x + w / 2, y + h / 2, glowSize);
            glow.addColorStop(0, 'rgba(255, 255, 0, 0.8)');
            glow.addColorStop(1, 'transparent');
            ctx.fillStyle = glow;
            ctx.beginPath();
            ctx.arc(x + w / 2, y + h / 2, glowSize, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#ffff00';
            ctx.font = 'bold 28px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('!!!', x + w / 2, emoteY + pulse);
            break;
        case 'secret':
            ctx.fillStyle = '#888888';
            ctx.font = 'italic bold 24px Arial';
            ctx.textAlign = 'center';
            ctx.globalAlpha = 0.3 + Math.sin(f * 0.05) * 0.3;
            ctx.fillText('???', x + w / 2, emoteY + pulse);
            ctx.globalAlpha = 1;
            break;
    }
    
    ctx.textAlign = 'left';
};

export const startRenderLoop = (
    srcCanvas: HTMLCanvasElement,
    srcCtx: CanvasRenderingContext2D,
    webglCanvas: HTMLCanvasElement,
    getMouseData: () => MouseData
): void => {
    
    const container = document.getElementById('stage-container');
    
    const resizeCanvases = () => {
        if (container) {
            const rect = container.getBoundingClientRect();
            const retrato = rect.width / rect.height < 1;

            // En horizontal entra el lienzo completo; en vertical se llena el
            // alto y se recortan los lados, para que el personaje no quede
            // diminuto en un teléfono.
            const scale = retrato
                ? rect.height / 800
                : Math.min(rect.width / 1200, rect.height / 800);

            srcCanvas.width = 1200;
            srcCanvas.height = 800;
            webglCanvas.width = 1200;
            webglCanvas.height = 800;
            
            srcCanvas.style.width = `${1200 * scale}px`;
            srcCanvas.style.height = `${800 * scale}px`;
            webglCanvas.style.width = `${1200 * scale}px`;
            webglCanvas.style.height = `${800 * scale}px`;
        }
    };
    
    window.addEventListener('resize', resizeCanvases);
    resizeCanvases();
    
    glContext = initWebGL(webglCanvas);
    const webglSupported = !!glContext;

    if (!webglSupported) {
        webglCanvas.style.display = 'none';
        srcCanvas.style.display = 'block';
        console.warn("SOMA: Contexto WebGL inaccesible. Modo de renderizado 2D de respaldo activado.");
    } else {
        webglCanvas.style.display = 'block';
        webglCanvas.style.position = 'absolute';
        webglCanvas.style.top = '50%';
        webglCanvas.style.left = '50%';
        webglCanvas.style.transform = 'translate(-50%, -50%)';
        
        srcCanvas.style.display = 'block';
        srcCanvas.style.position = 'absolute';
        srcCanvas.style.top = '50%';
        srcCanvas.style.left = '50%';
        srcCanvas.style.transform = 'translate(-50%, -50%)';
        srcCanvas.style.opacity = '0';
    }

    document.addEventListener('visibilitychange', () => {
        isPageVisible = !document.hidden;
    });

    function render(): void {
        if (!isPageVisible) {
            requestAnimationFrame(render);
            return;
        }

        const currentTime = performance.now();
        const deltaTime = Math.min((currentTime - lastFrameTime) / 16.67, 3);
        lastFrameTime = currentTime;

        if (!allLoaded) {
            srcCtx.fillStyle = '#050505';
            srcCtx.fillRect(0, 0, srcCanvas.width, srcCanvas.height);
            srcCtx.fillStyle = '#0f0';
            srcCtx.font = '24px monospace';
            srcCtx.textAlign = 'center';
            srcCtx.fillText('Cargando recursos...', srcCanvas.width / 2, srcCanvas.height / 2);
            srcCtx.textAlign = 'left';
            requestAnimationFrame(render);
            return;
        }

        state.scaleX = lerp(state.scaleX, target.scaleX, 0.1 * deltaTime);
        state.scaleY = lerp(state.scaleY, target.scaleY, 0.1 * deltaTime);
        state.rotation = lerp(state.rotation, target.rotation, 0.1 * deltaTime);
        state.alpha = lerp(state.alpha, target.alpha, 0.1 * deltaTime);
        state.aberration = lerp(state.aberration, target.aberration, 0.1 * deltaTime);
        state.distortion = lerp(state.distortion, target.distortion, 0.1 * deltaTime);
        state.bloom = lerp(state.bloom, target.bloom, 0.1 * deltaTime);
        // Los campos que no son numéricos se copian tal cual: sin esto, el
        // modo interactivo nunca llegaba al render y el click no hacía nada.
        state.interactive = target.interactive;

        const mouseData = getMouseData();

        if (state.physicsEnabled && !physics.isDragging) {
            physics.vy += 0.8 * deltaTime;
            target.offsetY += physics.vy * deltaTime;
            target.offsetX += physics.vx * deltaTime;
            const ground = (srcCanvas.height / 2) - (200 * state.scaleY);
            if (target.offsetY > ground) {
                target.offsetY = ground;
                physics.vy *= -0.6;
                physics.vx *= 0.9;
            }
        }

        state.offsetX = lerp(state.offsetX, target.offsetX, state.physicsEnabled ? 1 : 0.1 * deltaTime);
        state.offsetY = lerp(state.offsetY, target.offsetY, state.physicsEnabled ? 1 : 0.1 * deltaTime);

        let mRot = state.rotation,
            mOx = state.offsetX,
            mOy = state.offsetY,
            mSx = state.scaleX,
            mSy = state.scaleY;

        // --- BASE LIFE MICRO-MOVEMENTS ---
        if (microMovementConfig.base) {
            // Breathing: subtle vertical scale oscillation
            const breatheY = Math.sin(frame * 0.04) * 0.018;
            mSy *= 1 + breatheY;
            mSx *= 1 - breatheY * 0.4;
            
            // Idle weight shift: subtle position drift
            mOy += Math.sin(frame * 0.025) * 1.8;
            mOx += Math.sin(frame * 0.018 + 2.1) * 1.2;
            
            // Very subtle rotation "aliveness"
            mRot += Math.sin(frame * 0.015 + 1.5) * 0.008;
        }

        // --- POSE-SPECIFIC MICRO-MOVEMENTS ---
        const poseMicroMovements: Record<string, () => void> = {
            'subject': () => {
                mOy += Math.sin(frame * 0.035) * 2.5;
                mSx *= 1 + Math.sin(frame * 0.07) * 0.008;
            },
            'meditating': () => {
                mOy += Math.sin(frame * 0.02) * 4;
                mRot += Math.sin(frame * 0.012) * 0.015;
                mSx *= 1 + Math.sin(frame * 0.025) * 0.012;
                mSy *= 1 + Math.cos(frame * 0.025) * 0.012;
            },
            'fight': () => {
                mOx += Math.sin(frame * 0.08) * 1.5;
                mSx *= 1 + Math.sin(frame * 0.1) * 0.01;
                mSy *= 1 + Math.cos(frame * 0.1) * 0.01;
            },
            'happy': () => {
                mOy += Math.abs(Math.sin(frame * 0.06)) * -3;
                mSx *= 1 + Math.sin(frame * 0.12) * 0.012;
                mSy *= 1 + Math.sin(frame * 0.12) * 0.012;
            },
            'cry': () => {
                mOx += Math.sin(frame * 0.1) * 0.8;
                mOy += Math.sin(frame * 0.12) * 0.6;
            },
            'worried': () => {
                mOx += Math.sin(frame * 0.09) * 1.2;
                mRot += Math.sin(frame * 0.07) * 0.01;
            },
            'sit': () => {
                mOy += Math.sin(frame * 0.025) * 1.5;
                mRot += Math.sin(frame * 0.02) * 0.012;
            },
            'squat': () => {
                mOy += Math.sin(frame * 0.04) * 1.2;
                mSx *= 1 + Math.sin(frame * 0.08) * 0.006;
            },
            'lying': () => {
                mOy += Math.sin(frame * 0.015) * 1;
                mSx *= 1 + Math.sin(frame * 0.02) * 0.015;
            },
            'running': () => {
                mOy += Math.abs(Math.sin(frame * 0.15)) * -5;
                mRot += Math.sin(frame * 0.15) * 0.03;
            },
            'secret': () => {
                mOx += Math.sin(frame * 0.03) * 2;
                mRot += Math.sin(frame * 0.025) * 0.02;
            },
            'falling': () => {
                mRot += Math.sin(frame * 0.05) * 0.04;
                mOx += Math.sin(frame * 0.07) * 2;
            },
            'collapsed': () => {
                mSy *= 1 + Math.sin(frame * 0.01) * 0.005;
            },
            'protection': () => {
                mSx *= 1 + Math.sin(frame * 0.06) * 0.008;
                mSy *= 1 + Math.sin(frame * 0.06) * 0.008;
            },
            'overload': () => {
                mOx += Math.sin(frame * 0.2) * 1;
                mOy += Math.cos(frame * 0.2) * 1;
            },
            'disjointed': () => {
                mOx += Math.sin(frame * 0.08) * 1.5;
                mRot += Math.sin(frame * 0.06) * 0.02;
                mSx *= 1 + Math.sin(frame * 0.1) * 0.015;
            },
            'pose': () => {
                mOy += Math.sin(frame * 0.03) * 2;
                mRot += Math.sin(frame * 0.025) * 0.01;
            }
        };

        if (microMovementConfig.poses[state.pose] && poseMicroMovements[state.pose]) {
            poseMicroMovements[state.pose]();
        }

        switch (state.anim) {
            case 'flotar':
                mOy += Math.sin(frame * 0.05) * 40 * deltaTime;
                mRot += Math.sin(frame * 0.02) * 0.05;
                break;
            case 'latido':
                const s = 1 + Math.sin(frame * 0.2) * 0.1;
                mSx *= s;
                mSy *= s;
                break;
            case 'caos':
                mOx += (Math.random() - 0.5) * 20 * deltaTime;
                mOy += (Math.random() - 0.5) * 20 * deltaTime;
                mRot += (Math.random() - 0.5) * 0.1;
                break;
            case 'terremoto':
                mOx += (Math.random() - 0.5) * 45 * deltaTime;
                mOy += (Math.random() - 0.5) * 45 * deltaTime;
                break;
            case 'glitch':
                if (Math.random() > 0.8) {
                    mOx += (Math.random() - 0.5) * 100;
                    mSy *= 1.2;
                }
                break;
            case 'drift':
                mOx += Math.sin(frame * 0.5) * 20 * deltaTime;
                break;
            case 'reloj':
                mRot += frame * 0.05 * deltaTime;
                break;
            case 'tornado':
                mRot += frame * 0.4 * deltaTime;
                mSx = 1 + Math.sin(frame * 0.1) * 0.8;
                break;
            case 'gelatina':
                mSx *= 1 + Math.sin(frame * 0.2) * 0.2;
                mSy *= 1 + Math.cos(frame * 0.2) * 0.2;
                break;
            case 'vibracion':
                mOx += (Math.random() - 0.5) * 8 * deltaTime;
                mOy += (Math.random() - 0.5) * 8 * deltaTime;
                break;
            case 'magnetico':
                mOx += (mouseData.x - srcCanvas.width / 2) * 0.15 * deltaTime;
                mOy += (mouseData.y - srcCanvas.height / 2) * 0.15 * deltaTime;
                break;
            case 'repeler':
                mOx -= (mouseData.x - srcCanvas.width / 2) * 0.15 * deltaTime;
                mOy -= (mouseData.y - srcCanvas.height / 2) * 0.15 * deltaTime;
                break;
            case 'rebote':
                mOy += Math.abs(Math.sin(frame * 0.15)) * -80 * deltaTime;
                break;
            case 'respirar':
                mSx *= 1 + Math.sin(frame * 0.05) * 0.04;
                mSy *= 1 + Math.sin(frame * 0.05) * 0.04;
                break;
            case 'sacudir':
                mRot += (Math.random() - 0.5) * 0.3;
                mOx += (Math.random() - 0.5) * 15 * deltaTime;
                mOy += (Math.random() - 0.5) * 15 * deltaTime;
                break;
            case 'balanceo':
                mRot += Math.sin(frame * 0.05) * 0.3;
                break;
            case 'caminar':
                mOy += Math.abs(Math.sin(frame * 0.12)) * -14 * deltaTime;
                mOx += Math.sin(frame * 0.12) * 8 * deltaTime;
                mRot += Math.sin(frame * 0.12) * 0.02;
                break;
            case 'saltar': {
                const salto = Math.abs(Math.sin(frame * 0.07));
                mOy -= salto * 110 * deltaTime;
                mSy *= 1 + salto * 0.08;
                mSx *= 1 - salto * 0.04;
                break;
            }
            case 'girar':
                mRot += frame * 0.2 * deltaTime;
                mSx *= Math.cos(frame * 0.08);
                break;
            case 'orbitar':
                mOx += Math.cos(frame * 0.04) * 90 * deltaTime;
                mOy += Math.sin(frame * 0.04) * 45 * deltaTime;
                break;
            case 'espiral':
                mOx += Math.cos(frame * 0.07) * 70 * deltaTime;
                mOy += Math.sin(frame * 0.07) * 35 * deltaTime;
                mRot += 0.03 * deltaTime;
                break;
            case 'derretir':
                mSy *= 0.82 + Math.sin(frame * 0.03) * 0.08;
                mSx *= 1.18;
                mOy += 45 * deltaTime;
                break;
        }

        srcCtx.clearRect(0, 0, srcCanvas.width, srcCanvas.height);

        if (!webglSupported) {
            document.body.style.backgroundColor = state.bgColor;
            srcCanvas.style.filter = state.filter || '';
        }

        drawEscenario(srcCtx, srcCanvas.width, srcCanvas.height, state.escenario || 'ninguno', frame);

        const currentFrame = getCurrentFrame(state.pose, deltaTime);
        const aspect = currentFrame.sw / currentFrame.sh;
        let h = 450;
        let w = h * aspect;

        if (state.envParticles !== 'none' && state.envParticles !== 'estrellas' && state.envParticles !== 'aurora') {
            const spawnCount = state.envParticles === 'lluvia' ? 5 :
                              state.envParticles === 'nieve' ? 3 :
                              state.envParticles === 'hojas' ? 2 : 3;
            spawnParticles(state.envParticles, spawnCount, srcCanvas.width);
            updateParticles(srcCanvas.height, deltaTime, frame);
            drawParticles(srcCtx, frame);
        } else if (state.envParticles === 'estrellas') {
            srcCtx.fillStyle = '#fff';
            for (let i = 0; i < 200; i++) {
                const twinkle = Math.sin(frame * 0.1 + i) * 0.5 + 0.5;
                srcCtx.globalAlpha = twinkle * 0.8;
                const sx = (i * 37 + Math.sin(i * 0.3) * 20) % srcCanvas.width;
                const sy = (i * 23) % srcCanvas.height;
                srcCtx.fillRect(sx, sy, Math.random() * 2 + 1, Math.random() * 2 + 1);
            }
            srcCtx.globalAlpha = 1;
        } else if (state.envParticles === 'aurora') {
            srcCtx.save();
            srcCtx.globalCompositeOperation = 'lighter';
            const colores = ['107,255,176', '89,225,255', '200,140,255'];
            for (let banda = 0; banda < 3; banda++) {
                srcCtx.strokeStyle = `rgba(${colores[banda]},0.10)`;
                srcCtx.lineWidth = 42 + banda * 18;
                srcCtx.beginPath();
                for (let x = -40; x <= srcCanvas.width + 40; x += 30) {
                    const y = srcCanvas.height * 0.3 + banda * 34
                        + Math.sin(x * 0.004 + frame * 0.012 + banda) * 55
                        + Math.sin(x * 0.011 + frame * 0.02) * 18;
                    if (x === -40) srcCtx.moveTo(x, y);
                    else srcCtx.lineTo(x, y);
                }
                srcCtx.stroke();
            }
            srcCtx.restore();
        }

        if (state.interactive && mouseData.clicked) {
            ripples.push({ x: mouseData.x, y: mouseData.y, r: 0, a: 1 });
            mouseData.clicked = false;
        }
        for (let i = ripples.length - 1; i >= 0; i--) {
            const r = ripples[i];
            srcCtx.strokeStyle = `rgba(0,255,0,${r.a})`;
            srcCtx.lineWidth = 3;
            srcCtx.beginPath();
            srcCtx.arc(r.x, r.y, r.r, 0, Math.PI * 2);
            srcCtx.stroke();
            r.r += 15 * deltaTime;
            r.a -= 0.03 * deltaTime;
            if (r.a <= 0) ripples.splice(i, 1);
        }

        const drawSubject = (drawX: number, drawY: number): void => {
            srcCtx.save();
            srcCtx.translate(srcCanvas.width / 2 + mOx, srcCanvas.height / 2 + mOy);
            srcCtx.rotate(mRot);
            srcCtx.scale(mSx, mSy);
            srcCtx.translate(-(srcCanvas.width / 2 + mOx), -(srcCanvas.height / 2 + mOy));

            if (state.shadowColor !== 'transparent') {
                srcCtx.shadowBlur = 50;
                srcCtx.shadowColor = state.shadowColor;
            }
            srcCtx.globalAlpha = state.alpha;

            // Dibuja el frame actual, con tinte y overlay solo sobre el
            // cuerpo (antes el overlay era un rectángulo visible).
            const dibujarBase = (): void => {
                const conOverlay = state.overlay && state.overlay !== 'none';

                if (conOverlay) {
                    overlayCanvas ??= document.createElement('canvas');
                    overlayCanvas.width = currentFrame.sw;
                    overlayCanvas.height = currentFrame.sh;
                    const octx = overlayCanvas.getContext('2d');

                    if (octx) {
                        octx.clearRect(0, 0, overlayCanvas.width, overlayCanvas.height);
                        if (state.tint && state.tint !== 'none') {
                            octx.drawImage(getTintedImage(currentFrame, state.tint), 0, 0);
                        } else {
                            octx.drawImage(
                                currentFrame.source,
                                currentFrame.sx, currentFrame.sy, currentFrame.sw, currentFrame.sh,
                                0, 0, currentFrame.sw, currentFrame.sh
                            );
                        }
                        octx.globalCompositeOperation = 'source-atop';
                        octx.fillStyle = state.overlay;
                        octx.fillRect(0, 0, overlayCanvas.width, overlayCanvas.height);
                        octx.globalCompositeOperation = 'source-over';
                        srcCtx.drawImage(overlayCanvas, drawX, drawY, w, h);
                        return;
                    }
                }

                if (state.tint && state.tint !== 'none') {
                    const tintedSource = getTintedImage(currentFrame, state.tint);
                    srcCtx.drawImage(tintedSource, drawX, drawY, w, h);
                } else {
                    srcCtx.drawImage(
                        currentFrame.source,
                        currentFrame.sx, currentFrame.sy, currentFrame.sw, currentFrame.sh,
                        drawX, drawY, w, h
                    );
                }
            };

            // Estela: copias fantasma detrás del cuerpo.
            if (state.fx === 'estela') {
                srcCtx.save();
                for (let i = 4; i >= 1; i--) {
                    srcCtx.globalAlpha = state.alpha * 0.09 * i;
                    srcCtx.translate(-16, -5);
                    dibujarBase();
                }
                srcCtx.restore();
                srcCtx.globalAlpha = state.alpha;
            }

            if (state.fx === 'espejo') {
                srcCtx.translate(drawX + w / 2, 0);
                srcCtx.scale(-1, 1);
                srcCtx.translate(-(drawX + w / 2), 0);
            }

            if (state.fx === 'silueta') {
                srcCtx.filter = 'brightness(0)';
                srcCtx.shadowColor = state.shadowColor !== 'transparent' ? state.shadowColor : '#6bffb0';
                srcCtx.shadowBlur = 28;
                dibujarBase();
                srcCtx.filter = 'none';
                srcCtx.shadowBlur = 0;
            } else if (state.fx === 'holograma') {
                srcCtx.filter = 'sepia(1) saturate(2.5) hue-rotate(140deg) brightness(1.4)';
                srcCtx.globalAlpha = state.alpha * 0.75;
                dibujarBase();
                srcCtx.filter = 'none';
                srcCtx.globalAlpha = 0.18;
                srcCtx.fillStyle = '#001a1a';
                for (let sy = drawY; sy < drawY + h; sy += 5) {
                    srcCtx.fillRect(drawX, sy, w, 1);
                }
                srcCtx.globalAlpha = state.alpha;
            } else if (state.fx === 'termica') {
                srcCtx.filter = 'sepia(1) saturate(4) hue-rotate(-20deg) contrast(1.4) brightness(1.15)';
                dibujarBase();
                srcCtx.filter = 'none';
            } else {
                dibujarBase();
            }

            drawEmote(srcCtx, drawX, drawY, w, h, frame);

            srcCtx.shadowBlur = 0;
            srcCtx.filter = 'none';
            srcCtx.globalAlpha = state.alpha;

            if (state.particles === 'fuego') {
                const sprite = getFuegoSprite();
                srcCtx.save();
                srcCtx.globalCompositeOperation = 'lighter';

                const centroX = drawX + w / 2;
                const baseY = drawY + h;
                const brillo = srcCtx.createRadialGradient(
                    centroX, drawY + h * 0.7, 10,
                    centroX, drawY + h * 0.7, w * 0.8,
                );
                brillo.addColorStop(0, 'rgba(255,120,20,0.45)');
                brillo.addColorStop(0.55, 'rgba(255,60,0,0.18)');
                brillo.addColorStop(1, 'rgba(255,0,0,0)');
                srcCtx.fillStyle = brillo;
                srcCtx.fillRect(drawX - w * 0.3, drawY + h * 0.1, w * 1.6, h * 1.0);

                // Base ancha de llamas, para que no sean solo chispas.
                for (let i = 0; i < 10; i++) {
                    const x = centroX + Math.sin(frame * 0.03 + i) * w * 0.28;
                    const y = baseY - h * 0.12 - (i % 3) * 18;
                    const tamano = (72 + Math.random() * 48) * (w / 250);
                    srcCtx.globalAlpha = 0.22 + Math.random() * 0.16;
                    srcCtx.drawImage(sprite, x - tamano / 2, y - tamano / 2, tamano, tamano);
                }

                for (let i = 0; i < 64; i++) {
                    const vida = (frame * 0.012 + i * 0.137) % 1;
                    const x = centroX + Math.sin(frame * 0.05 + i * 2.1) * w * 0.42 * (0.3 + vida * 0.7) + (Math.random() - 0.5) * 10;
                    const y = baseY - vida * h * 0.7 - Math.random() * 18;
                    const tamano = (24 + vida * 46) * (0.8 + Math.random() * 0.5) * (w / 250);
                    srcCtx.globalAlpha = (1 - vida) * 0.8 * (0.7 + Math.random() * 0.3);
                    srcCtx.drawImage(sprite, x - tamano / 2, y - tamano / 2, tamano, tamano);
                }

                for (let i = 0; i < 24; i++) {
                    const vida = (frame * 0.02 + i * 0.11) % 1;
                    const x = centroX + Math.sin(frame * 0.08 + i * 3.3) * w * 0.5;
                    const y = baseY - vida * h * 0.8;
                    srcCtx.globalAlpha = (1 - vida) * 0.9;
                    srcCtx.fillStyle = `rgba(255,${Math.floor(160 + Math.random() * 80)},40,1)`;
                    srcCtx.beginPath();
                    srcCtx.arc(x, y, 1.5 + Math.random() * 2, 0, Math.PI * 2);
                    srcCtx.fill();
                }
                srcCtx.restore();
                srcCtx.globalAlpha = state.alpha;
            } else if (state.particles === 'humo') {
                const sprite = getHumoSprite();
                srcCtx.save();
                for (let i = 0; i < 26; i++) {
                    const vida = (frame * 0.006 + i * 0.17) % 1;
                    const x = drawX + w * 0.5 + Math.sin(frame * 0.02 + i) * w * 0.3 + (Math.random() - 0.5) * 18;
                    const y = drawY + h * 0.82 - vida * h * 0.8;
                    const tamano = (28 + vida * 64) * (w / 250);
                    srcCtx.globalAlpha = (1 - vida) * 0.22;
                    srcCtx.drawImage(sprite, x - tamano / 2, y - tamano / 2, tamano, tamano);
                }
                srcCtx.restore();
                srcCtx.globalAlpha = state.alpha;
            } else if (state.particles === 'chispas') {
                srcCtx.save();
                srcCtx.globalCompositeOperation = 'lighter';
                for (let i = 0; i < 40; i++) {
                    const vida = (frame * 0.02 + i * 0.13) % 1;
                    const x = drawX + w * 0.5 + Math.sin(frame * 0.06 + i * 1.7) * w * 0.45;
                    const y = drawY + h * 0.85 - vida * h * 0.9;
                    srcCtx.globalAlpha = (1 - vida) * 0.8;
                    srcCtx.strokeStyle = `rgba(255,${Math.floor(200 + Math.random() * 55)},80,1)`;
                    srcCtx.lineWidth = 1.5;
                    srcCtx.beginPath();
                    srcCtx.moveTo(x, y);
                    srcCtx.lineTo(x - 2, y + 9);
                    srcCtx.stroke();
                }
                srcCtx.restore();
                srcCtx.globalAlpha = state.alpha;
            } else if (state.particles === 'magia') {
                srcCtx.save();
                srcCtx.globalCompositeOperation = 'lighter';
                for (let i = 0; i < 36; i++) {
                    const vida = (frame * 0.01 + i * 0.17) % 1;
                    const x = drawX + w * 0.5 + Math.sin(frame * 0.03 + i * 2.4) * w * 0.45;
                    const y = drawY + h * 0.25 + Math.cos(frame * 0.04 + i * 1.3) * h * 0.3 + vida * 50;
                    srcCtx.globalAlpha = (1 - vida) * 0.85;
                    srcCtx.fillStyle = `hsl(${(i * 37 + frame) % 360}, 100%, 70%)`;
                    srcCtx.beginPath();
                    srcCtx.arc(x, y, 1.5 + Math.random() * 2, 0, Math.PI * 2);
                    srcCtx.fill();
                }
                srcCtx.restore();
                srcCtx.globalAlpha = state.alpha;
            } else if (state.particles === 'burbujas') {
                srcCtx.save();
                for (let i = 0; i < 24; i++) {
                    const vida = (frame * 0.01 + i * 0.19) % 1;
                    const x = drawX + w * 0.5 + Math.sin(frame * 0.02 + i) * w * 0.4;
                    const y = drawY + h * 0.9 - vida * h * 0.9;
                    const radio = 3 + (1 - vida) * 8;
                    srcCtx.globalAlpha = (1 - vida) * 0.6;
                    srcCtx.strokeStyle = 'rgba(180,230,255,1)';
                    srcCtx.lineWidth = 1;
                    srcCtx.beginPath();
                    srcCtx.arc(x, y, radio, 0, Math.PI * 2);
                    srcCtx.stroke();
                    srcCtx.fillStyle = 'rgba(255,255,255,0.35)';
                    srcCtx.beginPath();
                    srcCtx.arc(x - radio * 0.3, y - radio * 0.3, radio * 0.22, 0, Math.PI * 2);
                    srcCtx.fill();
                }
                srcCtx.restore();
                srcCtx.globalAlpha = state.alpha;
            } else if (state.particles === 'rayos') {
                if (Math.random() > 0.75) {
                    srcCtx.save();
                    srcCtx.globalCompositeOperation = 'lighter';
                    srcCtx.shadowColor = '#6bd8ff';
                    srcCtx.shadowBlur = 25;

                    const puntos: Array<[number, number]> = [];
                    let lx = drawX + w * 0.5 + (Math.random() - 0.5) * w * 0.4;
                    let ly = drawY - 20;
                    puntos.push([lx, ly]);
                    for (let j = 0; j < 7; j++) {
                        lx += (Math.random() - 0.5) * 50;
                        ly += (h + 40) / 7;
                        puntos.push([lx, ly]);
                    }

                    srcCtx.strokeStyle = 'rgba(200,240,255,0.95)';
                    srcCtx.lineWidth = 2.5;
                    srcCtx.beginPath();
                    srcCtx.moveTo(puntos[0][0], puntos[0][1]);
                    for (const [px, py] of puntos.slice(1)) srcCtx.lineTo(px, py);
                    srcCtx.stroke();

                    srcCtx.lineWidth = 1.2;
                    for (let rama = 0; rama < 3; rama++) {
                        const [bx, by] = puntos[2 + Math.floor(Math.random() * 4)];
                        srcCtx.beginPath();
                        srcCtx.moveTo(bx, by);
                        srcCtx.lineTo(bx + (Math.random() - 0.5) * 90, by + Math.random() * 60);
                        srcCtx.stroke();
                    }
                    srcCtx.restore();
                }
            }

            srcCtx.restore();
        };

        const mainX = (srcCanvas.width - w) / 2;
        const mainY = (srcCanvas.height - h) / 2;

        if (state.clones > 0) {
            drawSubject(mainX - 250, mainY);
            drawSubject(mainX + 250, mainY);
        }
        drawSubject(mainX, mainY);

        // --- UI OVERLAY (STATS) - Drawn on srcCtx before WebGL copy ---
        if (webglSupported && glContext) {
            const { gl, tex, locations } = glContext;
            gl.bindTexture(gl.TEXTURE_2D, tex);
            gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, gl.RGBA, gl.UNSIGNED_BYTE, srcCanvas);

            const setUniform = (loc: WebGLUniformLocation | null, val: number) => {
                if (loc !== null) gl.uniform1f(loc, val);
            };

            setUniform(locations.uTime, frame * 0.05);
            setUniform(locations.uAberration, state.aberration);
            setUniform(locations.uDistortion, state.distortion);
            setUniform(locations.uBloom, state.bloom);
            setUniform(locations.uVignette, state.aberration > 3 ? 1.5 : 0);
            setUniform(locations.uScanlines, state.anim === 'glitch' || state.anim === 'caos' ? 2 : 0);
            setUniform(locations.uChromatic, 1);

            gl.drawArrays(gl.TRIANGLES, 0, 6);
        }

        frame++;
        requestAnimationFrame(render);
    }
    
    lastFrameTime = performance.now();
    requestAnimationFrame(render);
    
};

export const loadImages = (): Promise<void> => {
    return new Promise((resolve) => {
        let loaded = 0;
        const total = poses.length;

        poses.forEach(pose => {
            const img = new Image();
            img.src = `Hikaru/${pose}.webp`;
            img.onload = () => {
                images[pose] = img;
                const forcedFrames = spriteConfig[pose] || undefined;
                spriteCache[pose] = detectAndSliceSpriteSheet(img, pose, forcedFrames);
                loaded++;
                resourcesLoaded.images = loaded;
                if (loaded === total) {
                    allLoaded = true;
                    resolve();
                }
            };
            img.onerror = () => {
                console.warn(`SOMA: Imagen no hallada: ${pose}.webp`);
                const fallback = new Image();
                fallback.width = 200;
                fallback.height = 400;
                images[pose] = fallback;
                spriteCache[pose] = { isSpriteSheet: false, source: fallback, frameWidth: 200, frameHeight: 400, frameCount: 1, currentFrame: 0, frameTimer: 0, frameSpeed: 150, pingPong: false, direction: 1 };
                loaded++;
                resourcesLoaded.images = loaded;
                if (loaded === total) {
                    allLoaded = true;
                    resolve();
                }
            };
        });
    });
};
