export interface Pose {
    pose: string;
    overlay: string;
    bgColor: string;
    particles: string;
    envParticles: string;
    anim: string;
    bgLayer: string;
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
    escenario?: string;
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
