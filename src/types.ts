export type PoseType = 
    | 'subject' | 'cry' | 'fight' | 'happy' | 'lying' | 'running' | 'secret' | 'squat' | 'worried'
    | 'collapsed' | 'disjointed' | 'falling' | 'meditating' | 'overload' | 'protection' | 'sit' | 'pose';

export type AnimType = 
    | 'none' | 'flotar' | 'latido' | 'caos' | 'terremoto' | 'glitch' | 'drift' | 'reloj' 
    | 'tornado' | 'gelatina' | 'vibracion' | 'magnetico' | 'repeler' | 'rebote' | 'respirar' 
    | 'sacudir' | 'balanceo';

export type ParticleType = 'none' | 'fuego' | 'rayos' | 'humo' | 'chispas' | 'burbujas' | 'magia';
export type EnvParticleType = 'none' | 'lluvia' | 'nieve' | 'hojas' | 'datos' | 'estrellas' | 'ceniza' | 'petalos';
export type BgLayerType = 'none' | 'grid' | 'void';
export type EscenarioType = 
    | 'ninguno' | 'ciudad' | 'bosque' | 'playa' | 'espacio' | 'dojo' | 'laboratorio' 
    | 'templo' | 'submarino' | 'volcan' | 'nieve';

export interface Stats {
    energy: number;   // 0-100 (Baja con el tiempo)
    hunger: number;   // 0-100 (Baja con el tiempo)
    happiness: number;// 0-100 (Baja si no interactúas)
}

export interface Pose {
    pose: PoseType;
    overlay: string;
    bgColor: string;
    particles: ParticleType;
    envParticles: EnvParticleType;
    anim: AnimType;
    bgLayer: BgLayerType;
    scaleX: number;
    scaleY: number;
    rotation: number;
    offsetX: number;
    offsetY: number;
    alpha: number;
    aberration: number;
    bloom: number;
    distortion: number;
    physicsEnabled: boolean;
    clones: number;
    shadowColor: string;
    interactive: boolean;
    filter?: string;
    tint?: string;
    escenario?: EscenarioType;
}

export interface Physics {
    vx: number;
    vy: number;
    isDragging: boolean;
}

export interface Ripple {
    x: number;
    y: number;
    r: number;
    a: number;
}

export type OscillatorType = 'sine' | 'square' | 'sawtooth' | 'triangle';
export type FilterType = 'lowpass' | 'highpass' | 'bandpass' | 'allpass';

export interface MouseData {
    x: number;
    y: number;
    clicked: boolean;
}

export interface Command {
    (): void;
}

export interface CommandMap {
    [key: string]: Command;
}
