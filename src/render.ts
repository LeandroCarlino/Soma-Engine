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

// --- Optimization: Tint Cache ---
let cachedTintCanvas: HTMLCanvasElement | null = null;
let lastTint: string = 'none';
let lastTintImage: HTMLImageElement | null = null;

const getTintedImage = (img: HTMLImageElement, tint: string): HTMLCanvasElement | HTMLImageElement => {
    if (tint === 'none' || !tint) return img;

    // Return cached version if valid
    if (cachedTintCanvas && lastTint === tint && lastTintImage === img) {
        return cachedTintCanvas;
    }

    // Create new cache
    if (!cachedTintCanvas) {
        cachedTintCanvas = document.createElement('canvas');
    }

    cachedTintCanvas.width = img.width;
    cachedTintCanvas.height = img.height;
    const ctx = cachedTintCanvas.getContext('2d');
    if (!ctx) return img; // Fallback

    ctx.drawImage(img, 0, 0);
    const imgData = ctx.getImageData(0, 0, cachedTintCanvas.width, cachedTintCanvas.height);
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
    lastTintImage = img;

    return cachedTintCanvas;
};

const lerp = (start: number, end: number, factor: number): number => start + (end - start) * factor;

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
    console.log('SOMA: Iniciando render loop...');
    
    const container = document.getElementById('stage-container');
    
    const resizeCanvases = () => {
        if (container) {
            const rect = container.getBoundingClientRect();
            const aspectRatio = 1200 / 800;
            let w = rect.width;
            let h = w / aspectRatio;
            
            if (h > rect.height) {
                h = rect.height;
                w = h * aspectRatio;
            }
            
            srcCanvas.width = 1200;
            srcCanvas.height = 800;
            webglCanvas.width = 1200;
            webglCanvas.height = 800;
            
            const scale = Math.min(w / 1200, h / 800);
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
    console.log('SOMA: WebGL soportado:', webglSupported);

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
        }

        srcCtx.clearRect(0, 0, srcCanvas.width, srcCanvas.height);

        if (!webglSupported) {
            document.body.style.backgroundColor = state.bgColor;
            srcCanvas.style.filter = state.filter || '';
        }

        drawEscenario(srcCtx, srcCanvas.width, srcCanvas.height, state.escenario || 'ninguno', frame);

        const currentImg = images[state.pose] && images[state.pose].complete && images[state.pose].naturalWidth !== 0
            ? images[state.pose]
            : images['subject'];
        const aspect = currentImg.width / currentImg.height;
        let h = 450;
        let w = h * aspect;

        if (state.envParticles !== 'none' && state.envParticles !== 'estrellas') {
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

            if (state.overlay !== 'none') {
                srcCtx.fillStyle = state.overlay;
                srcCtx.fillRect(drawX, drawY, w, h);
            }
            
            // Draw Subject with potential Tint
            if (state.tint && state.tint !== 'none') {
                const tintedSource = getTintedImage(currentImg, state.tint);
                srcCtx.drawImage(tintedSource, drawX, drawY, w, h);
            } else {
                srcCtx.drawImage(currentImg, drawX, drawY, w, h);
            }
            
            drawEmote(srcCtx, drawX, drawY, w, h, frame);
            
            srcCtx.shadowBlur = 0;

            if (state.particles === 'fuego') {
                for (let i = 0; i < 50; i++) {
                    const flicker = Math.random() * 100;
                    srcCtx.fillStyle = `rgba(255, ${flicker}, 0, 0.8)`;
                    srcCtx.beginPath();
                    srcCtx.arc(drawX + Math.random() * w, drawY + h - (frame * 7 + i * 18) % h, Math.random() * 14, 0, Math.PI * 2);
                    srcCtx.fill();
                }
            } else if (state.particles === 'rayos') {
                if (Math.random() > 0.7) {
                    srcCtx.strokeStyle = '#fff';
                    srcCtx.lineWidth = 3;
                    srcCtx.shadowColor = '#0ff';
                    srcCtx.shadowBlur = 20;
                    srcCtx.beginPath();
                    let lx = drawX + Math.random() * w;
                    let ly = drawY;
                    srcCtx.moveTo(lx, ly);
                    for (let j = 0; j < 5; j++) {
                        lx += (Math.random() - 0.5) * 40;
                        ly += h / 6;
                        srcCtx.lineTo(lx, ly);
                    }
                    srcCtx.stroke();
                    srcCtx.shadowBlur = 0;
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

        if (webglSupported && glContext) {
            const { gl, tex, locations } = glContext;
            gl.bindTexture(gl.TEXTURE_2D, tex);
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, srcCanvas);

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
    
    console.log('SOMA: Render loop iniciado');
};

export const loadImages = (): Promise<void> => {
    return new Promise((resolve) => {
        let loaded = 0;
        const total = poses.length;
        
        poses.forEach(pose => {
            const img = new Image();
            img.src = `Hikaru/${pose}.png`;
            img.onload = () => {
                images[pose] = img;
                loaded++;
                resourcesLoaded.images = loaded;
                if (loaded === total) {
                    allLoaded = true;
                    console.log('SOMA: Todos los recursos gráficos cargados');
                    resolve();
                }
            };
            img.onerror = () => {
                console.warn(`SOMA: Imagen no hallada: ${pose}.png`);
                const fallback = new Image();
                fallback.width = 200;
                fallback.height = 400;
                images[pose] = fallback;
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
