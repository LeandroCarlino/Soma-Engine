import { state, target, physics } from './state';
import type { Ripple, MouseData } from './types';

export const images: Record<string, HTMLImageElement> = {};
const poses = [
    'subject', 'cry', 'fight', 'happy', 'lying', 'running', 'secret', 'squat', 'worried',
    'collapsed', 'disjointed', 'falling', 'meditating', 'overload', 'protection', 'sit', 'pose'
];
export let allLoaded = false;
export const resourcesLoaded = { images: 0, total: poses.length };

interface Particle {
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
const MAX_POOL_SIZE = 500;
const activeParticles: Particle[] = [];

const acquireParticle = (): Particle => {
    if (particlePool.length > 0) return particlePool.pop()!;
    return { x: 0, y: 0, vx: 0, vy: 0, size: 0, life: 0, maxLife: 0, color: '', type: '' };
};

const releaseParticle = (p: Particle): void => {
    if (particlePool.length < MAX_POOL_SIZE) particlePool.push(p);
};

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
    uniform float u_vignette;
    uniform float u_scanlines;
    uniform float u_chromatic;
    varying vec2 v_texCoord;

    float random(vec2 st) {
        return fract(sin(dot(st.xy, vec2(12.9898, 78.233))) * 43758.5453123);
    }

    void main() {
        vec2 uv = v_texCoord;
        
        float distFromCenter = length(uv - 0.5);
        
        if (u_distortion > 0.0) {
            float wave = sin(uv.y * 10.0 + u_time) * u_distortion * 0.008;
            uv.x += wave;
            uv.y += cos(uv.x * 10.0 + u_time * 1.3) * u_distortion * 0.006;
            float wave2 = sin((uv.x + uv.y) * 8.0 + u_time * 0.7);
            uv += vec2(wave2, wave2) * u_distortion * 0.003;
        }

        float ab = u_aberration * 0.004;
        vec4 cr = texture2D(u_image, uv + vec2(ab * u_chromatic, 0.0));
        vec4 cg = texture2D(u_image, uv);
        vec4 cb = texture2D(u_image, uv - vec2(ab * u_chromatic, 0.0));
        vec4 color = vec4(cr.r, cg.g, cb.b, cg.a);

        if (u_bloom > 0.0) {
            float bloomSize = 0.003 + u_bloom * 0.001;
            vec4 b1 = texture2D(u_image, uv + vec2(bloomSize, bloomSize));
            vec4 b2 = texture2D(u_image, uv - vec2(bloomSize, bloomSize));
            vec4 b3 = texture2D(u_image, uv + vec2(-bloomSize, bloomSize));
            vec4 b4 = texture2D(u_image, uv + vec2(bloomSize, -bloomSize));
            vec4 b5 = texture2D(u_image, uv + vec2(bloomSize * 1.5, 0.0));
            vec4 b6 = texture2D(u_image, uv - vec2(bloomSize * 1.5, 0.0));
            vec4 sum = (b1 + b2 + b3 + b4 + b5 + b6) * (1.0 / 6.0);
            float lum = dot(sum.rgb, vec3(0.299, 0.587, 0.114));
            float bloomFactor = smoothstep(0.3, 0.8, lum) * u_bloom * 0.5;
            color.rgb += sum.rgb * bloomFactor;
        }

        if (u_vignette > 0.0) {
            float vig = 1.0 - distFromCenter * u_vignette;
            vig = clamp(vig, 0.0, 1.0);
            vig = pow(vig, 1.5);
            color.rgb *= mix(1.0, vig, 0.8);
        }

        if (u_scanlines > 0.0) {
            float scan = sin(uv.y * 400.0 + u_time * 2.0) * 0.5 + 0.5;
            scan = pow(scan, 1.0 / u_scanlines);
            color.rgb *= mix(1.0, scan, 0.3);
        }

        float noise = random(uv + u_time * 0.01) * 0.02 * u_aberration;
        color.rgb += vec3(noise * 0.5, noise * 0.3, noise * 0.2);

        color.rgb = clamp(color.rgb, 0.0, 1.0);
        gl_FragColor = color;
    }
`;

function createShader(gl: WebGLRenderingContext, type: number, source: string): WebGLShader | null {
    const shader = gl.createShader(type);
    if (!shader) {
        console.error('SOMA: No se pudo crear shader');
        return null;
    }
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        const info = gl.getShaderInfoLog(shader);
        console.error('SOMA: Error compilando shader:', type === gl.VERTEX_SHADER ? 'VERTEX' : 'FRAGMENT', info);
        gl.deleteShader(shader);
        return null;
    }
    return shader;
}

let gl: WebGLRenderingContext | null = null;
let program: WebGLProgram | null = null;
let positionLocation = -1;
let texCoordLocation = -1;
let tex: WebGLTexture | null = null;
let uTime: WebGLUniformLocation | null = null;
let uAberration: WebGLUniformLocation | null = null;
let uDistortion: WebGLUniformLocation | null = null;
let uBloom: WebGLUniformLocation | null = null;
let uVignette: WebGLUniformLocation | null = null;
let uScanlines: WebGLUniformLocation | null = null;
let uChromatic: WebGLUniformLocation | null = null;

function initWebGL(canvas: HTMLCanvasElement): boolean {
    gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl') as WebGLRenderingContext | null;
    if (!gl) {
        console.warn('SOMA: WebGL no disponible');
        return false;
    }

    const vs = createShader(gl, gl.VERTEX_SHADER, vsSource);
    const fs = createShader(gl, gl.FRAGMENT_SHADER, fsSource);
    if (!vs || !fs) return false;

    program = gl.createProgram();
    if (!program) {
        console.error('SOMA: No se pudo crear program');
        return false;
    }
    gl.attachShader(program, vs);
    gl.attachShader(program, fs);
    gl.linkProgram(program);
    
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        const info = gl.getProgramInfoLog(program);
        console.error('SOMA: Error linkeando program:', info);
        gl.deleteProgram(program);
        program = null;
        return false;
    }
    
    gl.useProgram(program);

    positionLocation = gl.getAttribLocation(program, 'a_position');
    texCoordLocation = gl.getAttribLocation(program, 'a_texCoord');
    
    if (positionLocation === -1 || texCoordLocation === -1) {
        console.error('SOMA: Atributos no encontrados');
        return false;
    }

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
    if (!tex) {
        console.error('SOMA: No se pudo crear textura');
        return false;
    }
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);

    uTime = gl.getUniformLocation(program, 'u_time');
    uAberration = gl.getUniformLocation(program, 'u_aberration');
    uDistortion = gl.getUniformLocation(program, 'u_distortion');
    uBloom = gl.getUniformLocation(program, 'u_bloom');
    uVignette = gl.getUniformLocation(program, 'u_vignette');
    uScanlines = gl.getUniformLocation(program, 'u_scanlines');
    uChromatic = gl.getUniformLocation(program, 'u_chromatic');
    
    if (!uTime || !uAberration || !uDistortion || !uBloom) {
        console.error('SOMA: Uniforms requeridos no encontrados');
        return false;
    }

    console.log('SOMA: WebGL inicializado correctamente');
    return true;
}

let frame = 0;
let ripples: Ripple[] = [];
let lastFrameTime = 0;
let isPageVisible = true;

const drawEscenario = (ctx: CanvasRenderingContext2D, w: number, h: number, escenario: string, f: number): void => {
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

const drawProceduralBG = (ctx: CanvasRenderingContext2D, w: number, h: number, type: string, f: number, mx: number, my: number): void => {
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
    
    const webglSupported = initWebGL(webglCanvas);
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

        const spawnParticles = (type: string, count: number) => {
            for (let i = 0; i < count && activeParticles.length < MAX_POOL_SIZE; i++) {
                const p = acquireParticle();
                p.type = type;
                p.x = Math.random() * srcCanvas.width;
                p.y = -10;
                p.vx = (Math.random() - 0.5) * 2;
                p.vy = Math.random() * 5 + 3;
                p.size = Math.random() * 3 + 1;
                p.life = 0;
                p.maxLife = Math.random() * 200 + 100;
                p.color = type === 'lluvia' ? 'rgba(150, 200, 255, 0.6)' :
                         type === 'nieve' ? 'rgba(255, 255, 255, 0.8)' :
                         type === 'datos' ? '#0f0' :
                         type === 'hojas' ? '#8a3' : '#fff';
                activeParticles.push(p);
            }
        };

        const updateParticles = () => {
            for (let i = activeParticles.length - 1; i >= 0; i--) {
                const p = activeParticles[i];
                p.life++;
                p.x += p.vx * deltaTime;
                p.y += p.vy * deltaTime;
                
                if (p.type === 'nieve') {
                    p.vx += (Math.random() - 0.5) * 0.1;
                } else if (p.type === 'hojas') {
                    p.vx += Math.sin(frame * 0.05 + i) * 0.05;
                }
                
                if (p.y > srcCanvas.height + 20 || p.life > p.maxLife) {
                    releaseParticle(activeParticles.splice(i, 1)[0]);
                }
            }
        };

        const drawParticles = () => {
            for (const p of activeParticles) {
                srcCtx.fillStyle = p.color;
                if (p.type === 'datos') {
                    srcCtx.font = '16px monospace';
                    srcCtx.fillText(Math.random() > 0.5 ? '1' : '0', p.x, p.y);
                } else if (p.type === 'hojas') {
                    srcCtx.beginPath();
                    srcCtx.ellipse(p.x, p.y, 10, 5, frame * 0.1, 0, Math.PI * 2);
                    srcCtx.fill();
                } else if (p.type === 'nieve') {
                    srcCtx.beginPath();
                    srcCtx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
                    srcCtx.fill();
                } else {
                    srcCtx.fillRect(p.x, p.y, 2, 25);
                }
            }
        };

        if (state.envParticles !== 'none' && state.envParticles !== 'estrellas') {
            const spawnCount = state.envParticles === 'lluvia' ? 5 :
                              state.envParticles === 'nieve' ? 3 :
                              state.envParticles === 'hojas' ? 2 : 3;
            spawnParticles(state.envParticles, spawnCount);
            updateParticles();
            drawParticles();
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
            
            srcCtx.drawImage(currentImg, drawX, drawY, w, h);
            
            if (state.tint && state.tint !== 'none') {
                const offscreen = document.createElement('canvas');
                offscreen.width = currentImg.width;
                offscreen.height = currentImg.height;
                const offCtx = offscreen.getContext('2d')!;
                offCtx.drawImage(currentImg, 0, 0);
                const imgData = offCtx.getImageData(0, 0, offscreen.width, offscreen.height);
                const data = imgData.data;
                const r = parseInt(state.tint.slice(1, 3), 16) || 255;
                const g = parseInt(state.tint.slice(3, 5), 16) || 0;
                const b = parseInt(state.tint.slice(5, 7), 16) || 0;
                for (let i = 0; i < data.length; i += 4) {
                    if (data[i + 3] > 0) {
                        data[i] = r;
                        data[i + 1] = g;
                        data[i + 2] = b;
                    }
                }
                offCtx.putImageData(imgData, 0, 0);
                srcCtx.drawImage(offscreen, drawX, drawY, w, h);
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

        if (webglSupported && gl && tex && program) {
            gl.bindTexture(gl.TEXTURE_2D, tex);
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, srcCanvas);

            const setUniform = (loc: WebGLUniformLocation | null, val: number) => {
                if (loc !== null) gl!.uniform1f(loc, val);
            };

            setUniform(uTime, frame * 0.05);
            setUniform(uAberration, state.aberration);
            setUniform(uDistortion, state.distortion);
            setUniform(uBloom, state.bloom);
            setUniform(uVignette, state.aberration > 3 ? 1.5 : 0);
            setUniform(uScanlines, state.anim === 'glitch' || state.anim === 'caos' ? 2 : 0);
            setUniform(uChromatic, 1);

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
