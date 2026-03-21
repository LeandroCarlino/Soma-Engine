export const vsSource = `
    attribute vec2 a_position;
    attribute vec2 a_texCoord;
    varying vec2 v_texCoord;
    void main() {
        gl_Position = vec4(a_position, 0, 1);
        v_texCoord = a_texCoord;
    }
`;

export const fsSource = `
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

export interface WebGLContext {
    gl: WebGLRenderingContext;
    program: WebGLProgram;
    tex: WebGLTexture;
    locations: {
        uTime: WebGLUniformLocation | null;
        uAberration: WebGLUniformLocation | null;
        uDistortion: WebGLUniformLocation | null;
        uBloom: WebGLUniformLocation | null;
        uVignette: WebGLUniformLocation | null;
        uScanlines: WebGLUniformLocation | null;
        uChromatic: WebGLUniformLocation | null;
    };
}

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

export function initWebGL(canvas: HTMLCanvasElement): WebGLContext | null {
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl') as WebGLRenderingContext | null;
    if (!gl) {
        console.warn('SOMA: WebGL no disponible');
        return null;
    }

    const vs = createShader(gl, gl.VERTEX_SHADER, vsSource);
    const fs = createShader(gl, gl.FRAGMENT_SHADER, fsSource);
    if (!vs || !fs) return null;

    const program = gl.createProgram();
    if (!program) {
        console.error('SOMA: No se pudo crear program');
        return null;
    }
    gl.attachShader(program, vs);
    gl.attachShader(program, fs);
    gl.linkProgram(program);
    
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        const info = gl.getProgramInfoLog(program);
        console.error('SOMA: Error linkeando program:', info);
        gl.deleteProgram(program);
        return null;
    }
    
    gl.useProgram(program);

    const positionLocation = gl.getAttribLocation(program, 'a_position');
    const texCoordLocation = gl.getAttribLocation(program, 'a_texCoord');
    
    if (positionLocation === -1 || texCoordLocation === -1) {
        console.error('SOMA: Atributos no encontrados');
        return null;
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

    const tex = gl.createTexture();
    if (!tex) {
        console.error('SOMA: No se pudo crear textura');
        return null;
    }
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);

    return {
        gl,
        program,
        tex,
        locations: {
            uTime: gl.getUniformLocation(program, 'u_time'),
            uAberration: gl.getUniformLocation(program, 'u_aberration'),
            uDistortion: gl.getUniformLocation(program, 'u_distortion'),
            uBloom: gl.getUniformLocation(program, 'u_bloom'),
            uVignette: gl.getUniformLocation(program, 'u_vignette'),
            uScanlines: gl.getUniformLocation(program, 'u_scanlines'),
            uChromatic: gl.getUniformLocation(program, 'u_chromatic')
        }
    };
}
