import { state, target, physics } from './state';
import type { Ripple, MouseData } from './types';

export const images: Record<string, HTMLImageElement> = {};
const poses = [
    'subject', 'cry', 'fight', 'happy', 'lying', 'running', 'secret', 'squat', 'worried',
    'collapsed', 'disjointed', 'falling', 'meditating', 'power', 'protection', 'slumped', 'pose'
];
export let allLoaded = false;
let loadedCount = 0;

const checkLoadComplete = (): void => {
    loadedCount++;
    if (loadedCount === poses.length) allLoaded = true;
};

poses.forEach(pose => {
    const img = new Image();
    img.src = `Hikaru/${pose}.png`;
    img.onload = checkLoadComplete;
    img.onerror = () => {
        console.warn(`SOMA: Recurso gráfico no hallado (${pose}.png). Fallback instanciado.`);
        checkLoadComplete();
    };
    images[pose] = img;
});

const lerp = (start: number, end: number, factor: number): number => start + (end - start) * factor;

const vsSource = `
    attribute vec2 a_position;
    attribute vec2 a_texCoord;
    varying vec2 v_texCoord;
    void main() {
        gl_Position = vec4(a_position, 0, 1);
        v_texCoord = a_texCoord;
    }
`;

const fsSource = `
    precision mediump float;
    uniform sampler2D u_image;
    uniform float u_time;
    uniform float u_aberration;
    uniform float u_distortion;
    uniform float u_bloom;
    varying vec2 v_texCoord;

    void main() {
        vec2 uv = v_texCoord;
        
        if (u_distortion > 0.0) {
            uv.x += sin(uv.y * 10.0 + u_time) * u_distortion * 0.01;
            uv.y += cos(uv.x * 10.0 + u_time) * u_distortion * 0.01;
        }

        float ab = u_aberration * 0.005;
        vec4 cr = texture2D(u_image, uv + vec2(ab, 0.0));
        vec4 cg = texture2D(u_image, uv);
        vec4 cb = texture2D(u_image, uv - vec2(ab, 0.0));
        vec4 color = vec4(cr.r, cg.g, cb.b, cg.a);

        if (u_bloom > 0.0) {
            vec4 b1 = texture2D(u_image, uv + vec2(0.004, 0.004));
            vec4 b2 = texture2D(u_image, uv - vec2(0.004, 0.004));
            vec4 b3 = texture2D(u_image, uv + vec2(-0.004, 0.004));
            vec4 b4 = texture2D(u_image, uv + vec2(0.004, -0.004));
            vec4 sum = (b1 + b2 + b3 + b4) * 0.25;
            float lum = dot(sum.rgb, vec3(0.299, 0.587, 0.114));
            if(lum > 0.5) color += sum * u_bloom;
        }

        gl_FragColor = color;
    }
`;

function createShader(gl: WebGLRenderingContext, type: number, source: string): WebGLShader | null {
    const shader = gl.createShader(type);
    if (!shader) return null;
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    return shader;
}

let gl: WebGLRenderingContext | null = null;
let program: WebGLProgram | null = null;
let positionLocation: number;
let texCoordLocation: number;
let tex: WebGLTexture | null = null;
let uTime: WebGLUniformLocation | null = null;
let uAberration: WebGLUniformLocation | null = null;
let uDistortion: WebGLUniformLocation | null = null;
let uBloom: WebGLUniformLocation | null = null;

function initWebGL(canvas: HTMLCanvasElement): boolean {
    gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl') as WebGLRenderingContext | null;
    if (!gl) return false;

    const vs = createShader(gl, gl.VERTEX_SHADER, vsSource);
    const fs = createShader(gl, gl.FRAGMENT_SHADER, fsSource);
    if (!vs || !fs) return false;

    program = gl.createProgram();
    if (!program) return false;
    gl.attachShader(program, vs);
    gl.attachShader(program, fs);
    gl.linkProgram(program);
    gl.useProgram(program);

    positionLocation = gl.getAttribLocation(program, 'a_position');
    texCoordLocation = gl.getAttribLocation(program, 'a_texCoord');

    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]), gl.STATIC_DRAW);
    gl.enableVertexAttribArray(positionLocation);
    gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);

    const texCoordBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, texCoordBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([0, 0, 1, 0, 0, 1, 0, 1, 1, 0, 1, 1]), gl.STATIC_DRAW);
    gl.enableVertexAttribArray(texCoordLocation);
    gl.vertexAttribPointer(texCoordLocation, 2, gl.FLOAT, false, 0, 0);

    tex = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);

    uTime = gl.getUniformLocation(program, 'u_time');
    uAberration = gl.getUniformLocation(program, 'u_aberration');
    uDistortion = gl.getUniformLocation(program, 'u_distortion');
    uBloom = gl.getUniformLocation(program, 'u_bloom');

    return true;
}

let frame = 0;
let ripples: Ripple[] = [];

const drawProceduralBG = (ctx: CanvasRenderingContext2D, w: number, h: number, type: string, _f: number, mx: number, my: number): void => {
    ctx.fillStyle = state.bgColor;
    ctx.fillRect(0, 0, w, h);

    if (type === 'grid') {
        ctx.strokeStyle = '#0f0';
        ctx.lineWidth = 1;
        ctx.globalAlpha = 0.2;
        const offX = (mx * 0.1) % 40;
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
        ctx.globalAlpha = 1;
    } else if (type === 'void') {
        const rad = ctx.createRadialGradient(w / 2 - mx * 0.1, h / 2 - my * 0.1, 0, w / 2, h / 2, w);
        rad.addColorStop(0, '#200');
        rad.addColorStop(1, '#000');
        ctx.fillStyle = rad;
        ctx.fillRect(0, 0, w, h);
    }
};

export const startRenderLoop = (
    srcCanvas: HTMLCanvasElement,
    srcCtx: CanvasRenderingContext2D,
    webglCanvas: HTMLCanvasElement,
    getMouseData: () => MouseData
): void => {
    const webglSupported = initWebGL(webglCanvas);

    if (!webglSupported) {
        webglCanvas.style.display = 'none';
        srcCanvas.style.display = 'block';
        console.warn("SOMA: Contexto WebGL inaccesible. Modo de renderizado 2D de respaldo activado.");
    }

    function render(): void {
        if (!allLoaded) {
            requestAnimationFrame(render);
            return;
        }

        state.scaleX = lerp(state.scaleX, target.scaleX, 0.1);
        state.scaleY = lerp(state.scaleY, target.scaleY, 0.1);
        state.rotation = lerp(state.rotation, target.rotation, 0.1);
        state.alpha = lerp(state.alpha, target.alpha, 0.1);
        state.aberration = lerp(state.aberration, target.aberration, 0.1);
        state.distortion = lerp(state.distortion, target.distortion, 0.1);
        state.bloom = lerp(state.bloom, target.bloom, 0.1);

        const mouseData = getMouseData();

        if (state.physicsEnabled && !physics.isDragging) {
            physics.vy += 0.8;
            target.offsetY += physics.vy;
            target.offsetX += physics.vx;
            const ground = (srcCanvas.height / 2) - (200 * state.scaleY);
            if (target.offsetY > ground) {
                target.offsetY = ground;
                physics.vy *= -0.6;
                physics.vx *= 0.9;
            }
        }

        state.offsetX = lerp(state.offsetX, target.offsetX, state.physicsEnabled ? 1 : 0.1);
        state.offsetY = lerp(state.offsetY, target.offsetY, state.physicsEnabled ? 1 : 0.1);

        let mRot = state.rotation,
            mOx = state.offsetX,
            mOy = state.offsetY,
            mSx = state.scaleX,
            mSy = state.scaleY;

        switch (state.anim) {
            case 'flotar':
                mOy += Math.sin(frame * 0.05) * 40;
                mRot += Math.sin(frame * 0.02) * 0.05;
                break;
            case 'latido':
                const s = 1 + Math.sin(frame * 0.2) * 0.1;
                mSx *= s;
                mSy *= s;
                break;
            case 'caos':
                mOx += (Math.random() - 0.5) * 20;
                mOy += (Math.random() - 0.5) * 20;
                mRot += (Math.random() - 0.5) * 0.1;
                break;
            case 'terremoto':
                mOx += (Math.random() - 0.5) * 45;
                mOy += (Math.random() - 0.5) * 45;
                break;
            case 'glitch':
                if (Math.random() > 0.8) {
                    mOx += (Math.random() - 0.5) * 100;
                    mSy *= 1.2;
                }
                break;
            case 'drift':
                mOx += Math.sin(frame * 0.5) * 20;
                break;
            case 'reloj':
                mRot += frame * 0.05;
                break;
            case 'tornado':
                mRot += frame * 0.4;
                mSx = 1 + Math.sin(frame * 0.1) * 0.8;
                break;
            case 'gelatina':
                mSx *= 1 + Math.sin(frame * 0.2) * 0.2;
                mSy *= 1 + Math.cos(frame * 0.2) * 0.2;
                break;
            case 'vibracion':
                mOx += (Math.random() - 0.5) * 8;
                mOy += (Math.random() - 0.5) * 8;
                break;
            case 'magnetico':
                mOx += (mouseData.x - srcCanvas.width / 2) * 0.15;
                mOy += (mouseData.y - srcCanvas.height / 2) * 0.15;
                break;
            case 'repeler':
                mOx -= (mouseData.x - srcCanvas.width / 2) * 0.15;
                mOy -= (mouseData.y - srcCanvas.height / 2) * 0.15;
                break;
            case 'rebote':
                mOy += Math.abs(Math.sin(frame * 0.15)) * -80;
                break;
            case 'respirar':
                mSx *= 1 + Math.sin(frame * 0.05) * 0.04;
                mSy *= 1 + Math.sin(frame * 0.05) * 0.04;
                break;
            case 'sacudir':
                mRot += (Math.random() - 0.5) * 0.3;
                mOx += (Math.random() - 0.5) * 15;
                mOy += (Math.random() - 0.5) * 15;
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

        drawProceduralBG(srcCtx, srcCanvas.width, srcCanvas.height, state.bgLayer, frame, mouseData.x, mouseData.y);

        const currentImg = images[state.pose] && images[state.pose].complete && images[state.pose].naturalWidth !== 0
            ? images[state.pose]
            : images['subject'];
        const aspect = currentImg.width / currentImg.height;
        let h = 450;
        let w = h * aspect;

        if (state.envParticles === 'lluvia') {
            srcCtx.fillStyle = 'rgba(150, 200, 255, 0.6)';
            for (let i = 0; i < 120; i++)
                srcCtx.fillRect(Math.random() * srcCanvas.width, (frame * 30 + i * 30) % srcCanvas.height, 2, 25);
        } else if (state.envParticles === 'nieve') {
            srcCtx.fillStyle = 'rgba(255, 255, 255, 0.8)';
            for (let i = 0; i < 100; i++) {
                srcCtx.beginPath();
                srcCtx.arc((i * 40 + Math.sin(frame * 0.02 + i) * 40) % srcCanvas.width, (frame * 4 + i * 50) % srcCanvas.height, Math.random() * 4 + 1, 0, Math.PI * 2);
                srcCtx.fill();
            }
        } else if (state.envParticles === 'datos') {
            srcCtx.fillStyle = '#0f0';
            srcCtx.font = '16px monospace';
            for (let i = 0; i < 80; i++)
                srcCtx.fillText(Math.random() > 0.5 ? '1' : '0', (i * 20) % srcCanvas.width, (frame * 15 + i * 40) % srcCanvas.height);
        } else if (state.envParticles === 'hojas') {
            srcCtx.fillStyle = '#8a3';
            for (let i = 0; i < 40; i++) {
                srcCtx.beginPath();
                srcCtx.ellipse((frame * 3 + i * 60) % srcCanvas.width, (frame * 4 + i * 50) % srcCanvas.height, 10, 5, frame * 0.1 + i, 0, Math.PI * 2);
                srcCtx.fill();
            }
        } else if (state.envParticles === 'estrellas') {
            srcCtx.fillStyle = '#fff';
            for (let i = 0; i < 200; i++) {
                if (Math.random() > 0.9)
                    srcCtx.fillRect((i * 19) % srcCanvas.width, (i * 27) % srcCanvas.height, Math.random() * 3, Math.random() * 3);
            }
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
            r.r += 15;
            r.a -= 0.03;
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
            srcCtx.drawImage(currentImg, drawX, drawY, w, h);
            srcCtx.shadowBlur = 0;

            if (state.particles === 'fuego') {
                for (let i = 0; i < 50; i++) {
                    srcCtx.fillStyle = `rgba(255, ${Math.random() * 150}, 0, 0.8)`;
                    srcCtx.beginPath();
                    srcCtx.arc(drawX + Math.random() * w, drawY + h - (frame * 7 + i * 18) % h, Math.random() * 14, 0, Math.PI * 2);
                    srcCtx.fill();
                }
            } else if (state.particles === 'rayos') {
                srcCtx.strokeStyle = '#fff';
                srcCtx.lineWidth = 3;
                if (Math.random() > 0.6) {
                    srcCtx.beginPath();
                    srcCtx.moveTo(drawX + Math.random() * w, drawY);
                    srcCtx.lineTo(drawX + Math.random() * w, drawY + h / 2);
                    srcCtx.lineTo(drawX + Math.random() * w, drawY + h);
                    srcCtx.stroke();
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

        if (webglSupported && gl && tex) {
            gl.bindTexture(gl.TEXTURE_2D, tex);
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, srcCanvas);

            if (uTime) gl.uniform1f(uTime, frame * 0.05);
            if (uAberration) gl.uniform1f(uAberration, state.aberration);
            if (uDistortion) gl.uniform1f(uDistortion, state.distortion);
            if (uBloom) gl.uniform1f(uBloom, state.bloom);

            gl.drawArrays(gl.TRIANGLES, 0, 6);
        }

        frame++;
        requestAnimationFrame(render);
    }
    requestAnimationFrame(render);
};
