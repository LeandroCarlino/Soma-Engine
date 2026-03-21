import { target, executeCmd, resetState, triggerNSFW, state, physics, updateStat } from './state';
import { Sfx } from './audio';
import type { CommandMap } from './types';

export const getCmds = (logEl: HTMLElement): CommandMap => {
    const cmd = (msg: string, mod: Record<string, unknown>, dur: number = 5000): void => executeCmd(msg, mod as Parameters<typeof executeCmd>[1], logEl, dur);

    return {
        // --- INTERACCIONES TAMAGOTCHI (Stats) ---
        "comer": () => {
            updateStat('hunger', 30);
            cmd("Ingesta de nutrientes. Expansión de masa.", { pose: 'squat', scaleX: 1.2, scaleY: 1.2 });
            Sfx.play(100, 'square', 0.5, 0.1);
        },
        "alimentar": () => {
            updateStat('hunger', 20);
            cmd("Suministro de energía biológica.", { pose: 'happy', anim: 'rebote' });
        },
        "dormir": () => {
            updateStat('energy', 50);
            cmd("Desconexión de conciencia. Sueño profundo.", { pose: 'lying', anim: 'flotar', filter: 'brightness(0.5)' });
            Sfx.wind(5, 0.1);
        },
        "descansar": () => {
            updateStat('energy', 20);
            cmd("Pausa obligatoria de procesos.", { pose: 'lying', anim: 'none' });
        },
        "jugar": () => {
            updateStat('happiness', 25);
            updateStat('energy', -10);
            cmd("Modo lúdico iniciado.", { pose: 'happy', anim: 'rebote', bloom: 2 });
            Sfx.playChord([523, 659, 784], 'square', 2, 0.1);
        },
        "caricia": () => {
            updateStat('happiness', 15);
            cmd("Estímulo reconfortante detectado.", { pose: 'happy', overlay: 'rgba(255,255,255,0.2)', bloom: 1 });
        },
        "cafe": () => {
            updateStat('energy', 15);
            updateStat('hunger', 5);
            cmd("Estimulantes en el sistema. Aceleración cognitiva.", { pose: 'running', anim: 'latido', filter: 'sepia(0.8) contrast(1.2)' });
            Sfx.play(900, 'sine', 0.5, 0.1, 1000);
        },

        // --- PALABRAS PARA SINERGIAS ---
        "caja": () => { cmd("Contenedor cuántico cerrado.", { pose: 'squat', scaleX: 0.8, scaleY: 0.8, shadowColor: '#fff' }); },
        "tortuga": () => { cmd("Testudines. Lenta y acorazada.", { pose: 'squat', scaleY: 0.6 }); },
        "programar": () => { cmd("Escribiendo código fuente en tiempo real.", { pose: 'sit', envParticles: 'datos', filter: 'contrast(1.2)' }); },

        // --- COTIDIANOS Y COMUNES ---
        "hola": () => { cmd("Conexión inicial. Saludo registrado.", { pose: 'happy', anim: 'rebote', scaleX: 1.4, scaleY: 1.4 }); Sfx.play(400, 'sine', 0.3, 0.1, 600); },
        "chau": () => { cmd("Protocolo de desconexión. Cerrando procesos.", { pose: 'subject', scaleX: 0.5, scaleY: 0.5, alpha: 0 }); Sfx.play(400, 'sine', 1, 0.1, 200); },
        "gracias": () => { updateStat('happiness', 5); cmd("Gratitud registrada.", { pose: 'happy', bloom: 1, filter: 'saturate(120%)' }); Sfx.playChord([523, 659, 784], 'sine', 2, 0.1); },
        "si": () => { cmd("Afirmación positiva.", { pose: 'happy', anim: 'rebote' }); Sfx.play(600, 'sine', 0.1, 0.1); },
        "no": () => { cmd("Negativa firme.", { pose: 'worried', anim: 'sacudir' }); Sfx.play(150, 'square', 0.2, 0.1); },
        "ayuda": () => { cmd("Solicitud de asistencia técnica.", { pose: 'secret', anim: 'latido', bloom: 2 }); },
        "nombre": () => { cmd("Identidad: SOMA Core.", { pose: 'subject', envParticles: 'datos' }); },
        "hambre": () => { cmd("Batería baja. Requiere input calórico.", { pose: 'collapsed', filter: 'grayscale(50%)', anim: 'vibracion' }); Sfx.play(100, 'sawtooth', 0.5, 0.2); },
        "sed": () => { cmd("Deshidratación inminente.", { pose: 'worried', filter: 'sepia(0.5)' }); },
        "frio": () => { cmd("Temperatura ambiente baja.", { pose: 'protection', envParticles: 'nieve', overlay: 'rgba(200, 240, 255, 0.3)' }); Sfx.wind(3, 0.4); },
        "calor": () => { cmd("Temperatura ambiente crítica.", { pose: 'sit', particles: 'humo', overlay: 'rgba(255, 100, 0, 0.2)' }); Sfx.fire(3, 0.3); },
        "aburrido": () => { cmd("Falta de estímulos externos.", { pose: 'lying', anim: 'none', filter: 'grayscale(80%)' }); },
        "correr": () => { updateStat('energy', -15); cmd("Desplazamiento a alta velocidad.", { pose: 'running', anim: 'drift', filter: 'blur(2px)' }); Sfx.noise(3, 0.2); },
        "saltar": () => { updateStat('energy', -5); cmd("Impulso vertical ascendente.", { pose: 'pose', anim: 'rebote', scaleY: 1.2 }); },
        "bailar": () => { updateStat('happiness', 15); updateStat('energy', -10); cmd("Secuencia rítmica corporal.", { pose: 'happy', anim: 'sacudir', filter: 'hue-rotate(90deg)' }); Sfx.playChord([440, 523, 659], 'sine', 3, 0.1); },
        "llorar": () => { updateStat('happiness', -15); cmd("Desborde emocional líquido.", { pose: 'cry', envParticles: 'lluvia' }); Sfx.rain(3, 0.5); },
        "gritar": () => { cmd("Emisión acústica de alta potencia.", { pose: 'overload', anim: 'terremoto', distortion: 3 }); Sfx.noise(5, 0.8); },
        "pensar": () => { cmd("Procesando datos complejos...", { pose: 'meditating', anim: 'flotar', envParticles: 'datos' }); },
        "internet": () => { cmd("Conexión a la red global establecida.", { pose: 'meditating', envParticles: 'datos', bgLayer: 'grid', bloom: 3 }); Sfx.play(800, 'square', 0.1, 0.05); },
        "dinero": () => { cmd("Acumulación de recursos financieros.", { pose: 'happy', shadowColor: '#ffd700', bloom: 2 }); Sfx.play(1000, 'sine', 0.2, 0.1); },
        "libro": () => { cmd("Accediendo a base de conocimientos estática.", { pose: 'sit', filter: 'sepia(1)' }); },
        "telefono": () => { cmd("Dispositivo de comunicación móvil.", { pose: 'subject', envParticles: 'datos' }); Sfx.play(440, 'square', 0.5, 0.1); },
        "cafetera": () => { cmd("Fuente de energía térmica líquida.", { pose: 'running', anim: 'vibracion' }); },

        // --- ELEMENTOS Y FANTASIA ---
        "magma": () => { cmd("Roca fundida en movimiento viscoso.", { pose: 'squat', bgColor: '#300', particles: 'fuego', anim: 'gelatina', overlay: 'rgba(255,50,0,0.4)' }); Sfx.fire(4, 0.7); },
        "vapor": () => { cmd("Estado gaseoso del agua detectado.", { pose: 'secret', filter: 'blur(4px) brightness(1.2)', particles: 'humo', anim: 'flotar' }); Sfx.wind(4, 0.3); },
        "barro": () => { cmd("Mezcla viscosa de tierra y agua primordial.", { pose: 'squat', bgColor: '#321', filter: 'sepia(0.8) brightness(0.6)', anim: 'gelatina' }); Sfx.noise(3, 0.4); },
        "cristal": () => { cmd("Estructura molecular sólida y translúcida.", { pose: 'pose', filter: 'contrast(1.5) brightness(1.3)', aberration: 3, overlay: 'rgba(200,255,255,0.2)' }); Sfx.play(2000, 'sine', 0.5, 0.1); },
        "galaxia": () => { cmd("Cúmulo estelar masivo en rotación.", { pose: 'meditating', envParticles: 'estrellas', bgLayer: 'void', bloom: 4, rotation: 0.1 }); Sfx.playChord([100, 200, 400, 800], 'sine', 10, 0.05); },
        "nebulosa": () => { cmd("Nube de gas y polvo interestelar.", { pose: 'falling', filter: 'hue-rotate(240deg) blur(2px)', envParticles: 'magia', bloom: 3 }); Sfx.wind(6, 0.2); },
        "laser": () => { cmd("Emisión de luz coherente de alta intensidad.", { pose: 'fight', shadowColor: '#f00', bloom: 8, filter: 'brightness(2)' }); Sfx.play(800, 'sawtooth', 0.2, 0.1, 400); },
        "androide": () => { cmd("Simulacro humanoide sintético.", { pose: 'subject', filter: 'grayscale(1) contrast(1.2)', envParticles: 'datos', anim: 'none' }); Sfx.play(1000, 'square', 0.1, 0.1); },
        "ia": () => { cmd("Red neuronal artificial activa.", { pose: 'meditating', envParticles: 'datos', bgLayer: 'grid', bloom: 2, aberration: 2 }); Sfx.playChord([440, 880, 1760], 'square', 0.5, 0.05); },
        "agujeroblanco": () => { cmd("Singularidad emisora de materia y luz.", { pose: 'overload', bgColor: '#fff', bloom: 10 }); Sfx.noise(5, 0.8); },
        "elfo": () => { cmd("Habitante ancestral de los bosques.", { pose: 'meditating', filter: 'hue-rotate(90deg) saturate(1.5)', envParticles: 'hojas' }); Sfx.playChord([600, 800], 'sine', 2, 0.1); },
        "orco": () => { cmd("Fuerza bruta y resistencia física elevada.", { pose: 'fight', filter: 'hue-rotate(90deg) brightness(0.7) contrast(1.5)', scaleX: 1.5 }); Sfx.play(50, 'sawtooth', 1, 0.5); },
        "hechizo": () => { cmd("Canalizando fluctuaciones de energía arcana.", { pose: 'meditating', envParticles: 'magia', bloom: 4, shadowColor: '#a0f' }); Sfx.playChord([300, 500, 700], 'sine', 3, 0.1); },
        "bruja": () => { cmd("Maestría en alquimia y magia oscura.", { pose: 'secret', bgColor: '#102', envParticles: 'burbujas', filter: 'hue-rotate(270deg)' }); Sfx.play(200, 'sine', 3, 0.2); },
        "hadas": () => { updateStat('happiness', 10); cmd("Pequeños seres de luz y polvo estelar.", { pose: 'happy', envParticles: 'chispas', scaleX: 0.5, scaleY: 0.5, anim: 'flotar' }); Sfx.playChord([1000, 1200, 1500], 'triangle', 1, 0.1); },
        "escudo": () => { cmd("Barrera de protección energética activa.", { pose: 'protection', overlay: 'rgba(0,100,255,0.3)', bloom: 2, anim: 'none' }); Sfx.play(100, 'square', 1, 0.2); },
        "espada": () => { cmd("Hoja afilada de metal espectral.", { pose: 'fight', shadowColor: '#fff', anim: 'sacudir' }); Sfx.play(1500, 'sawtooth', 0.1, 0.1); },

        // --- CONCEPTOS Y OBJETOS ---
        "pizza": () => { updateStat('hunger', 25); cmd("Carbohidratos y estímulos de felicidad.", { pose: 'happy', filter: 'saturate(1.5) sepia(0.3)', anim: 'rebote' }); Sfx.play(500, 'sine', 0.2, 0.1); },
        "hamburguesa": () => { updateStat('hunger', 35); cmd("Unidad calórica de comida rápida.", { pose: 'squat', scaleX: 1.2, scaleY: 0.9 }); },
        "sushi": () => { updateStat('hunger', 20); cmd("Equilibrio nutricional de arroz y pescado.", { pose: 'meditating', filter: 'brightness(1.2)', anim: 'flotar' }); },
        "helado": () => { updateStat('happiness', 10); cmd("Placer gélido instantáneo.", { pose: 'happy', overlay: 'rgba(255,200,255,0.3)', envParticles: 'nieve' }); },
        "fruta": () => { updateStat('hunger', 10); updateStat('happiness', 5); cmd("Vitaminas y azúcares naturales.", { pose: 'happy', filter: 'saturate(2)', bloom: 1 }); },
        "alcohol": () => { updateStat('happiness', 10); updateStat('energy', -10); cmd("Intoxicación etílica en progreso.", { pose: 'disjointed', anim: 'balanceo', filter: 'blur(2px)' }); Sfx.play(200, 'sine', 2, 0.1); },
        "celos": () => { updateStat('happiness', -15); cmd("El monstruo de ojos verdes acecha.", { pose: 'worried', filter: 'hue-rotate(90deg) contrast(1.5)', anim: 'vibracion' }); },
        "envidia": () => { updateStat('happiness', -10); cmd("Deseo de posesión de datos ajenos.", { pose: 'secret', shadowColor: '#0f0', filter: 'brightness(0.8)' }); },
        "orgullo": () => { cmd("Nivel de autosuficiencia elevado.", { pose: 'pose', scaleX: 1.2, scaleY: 1.2, anim: 'none' }); },
        "verguenza": () => { updateStat('happiness', -5); cmd("Deseo de ocultar la instancia actual.", { pose: 'collapsed', filter: 'hue-rotate(-30deg) saturate(1.5)', scaleX: 0.8 }); },
        "timidez": () => { cmd("Evitando la exposición directa.", { pose: 'secret', alpha: 0.6, anim: 'sacudir' }); },
        "euforia": () => { updateStat('happiness', 30); updateStat('energy', -20); cmd("Éxtasis sistémico incontrolable.", { pose: 'happy', anim: 'caos', bloom: 4, filter: 'saturate(3)' }); Sfx.playChord([500, 700, 900, 1100], 'sine', 2, 0.1); },
        "paz": () => { updateStat('happiness', 10); cmd("Tranquilidad y orden absoluto.", { pose: 'meditating', bgColor: '#88a', filter: 'brightness(1.2)' }); Sfx.playChord([200, 300], 'sine', 5, 0.05); },
        "arcoiris": () => { updateStat('happiness', 15); cmd("Espectro cromático visible completo.", { pose: 'happy', filter: 'hue-rotate(180deg) saturate(3)', bloom: 2 }); },
        "granizo": () => { cmd("Precipitación de hielo sólido detectada.", { pose: 'protection', envParticles: 'nieve', anim: 'vibracion' }); Sfx.noise(3, 0.6); },
        "sequia": () => { updateStat('energy', -10); cmd("Ausencia total de humedad ambiental.", { pose: 'collapsed', filter: 'sepia(1) brightness(1.2)', envParticles: 'ceniza' }); Sfx.wind(4, 0.2); },
        "jungla": () => { cmd("Entorno de vegetación densa y húmeda.", { pose: 'squat', filter: 'hue-rotate(60deg) contrast(1.2)', envParticles: 'hojas' }); Sfx.noise(5, 0.3, 'lowpass', 800); },
        "pantano": () => { cmd("Terreno fangoso y estancado.", { pose: 'squat', bgColor: '#231', overlay: 'rgba(50,100,0,0.3)', anim: 'gelatina' }); },
        "cascada": () => { cmd("Caída de agua masiva constante.", { pose: 'stand', envParticles: 'lluvia', distortion: 2 }); Sfx.noise(5, 0.7); },
        "metro": () => { cmd("Transporte subterráneo de alta velocidad.", { pose: 'sit', anim: 'vibracion', particles: 'humo' }); Sfx.noise(4, 0.5); },
        "ascensor": () => { cmd("Desplazamiento vertical en espacio confinado.", { pose: 'stand', anim: 'flotar', bgLayer: 'grid' }); Sfx.play(100, 'sine', 3, 0.1); },
        "trafico": () => { updateStat('happiness', -10); cmd("Congestión de flujos vehiculares.", { pose: 'worried', overlay: 'rgba(255,0,0,0.2)', anim: 'sacudir' }); Sfx.noise(5, 0.6); },
        "sofa": () => { updateStat('energy', 10); cmd("Mobiliario de descanso acolchado.", { pose: 'lying', scaleY: 0.8 }); },
        "ducha": () => { updateStat('happiness', 10); cmd("Protocolo de higiene personal.", { pose: 'stand', envParticles: 'lluvia', overlay: 'rgba(200,200,255,0.3)' }); Sfx.rain(4, 0.5); },
        "trepar": () => { updateStat('energy', -15); cmd("Ascenso mediante tracción manual.", { pose: 'running', rotation: -1.5, anim: 'sacudir' }); },
        "caer": () => { updateStat('energy', -5); cmd("Descenso incontrolado por gravedad.", { pose: 'falling', physicsEnabled: true }); },
        "rodar": () => { cmd("Movimiento rotatorio sobre el eje.", { pose: 'collapsed', anim: 'reloj' }); },
        "guitarra": () => { updateStat('happiness', 10); cmd("Generación de acordes acústicos.", { pose: 'happy', anim: 'vibracion' }); Sfx.playChord([329, 440, 659], 'sawtooth', 3, 0.1); },
        "camara": () => { cmd("Capturando fotograma estático del momento.", { pose: 'stand', flash: 1 }); },
        "pintar": () => { updateStat('happiness', 10); cmd("Expresión de creación artística visual.", { pose: 'sit', filter: 'saturate(2)' }); },
        "te": () => { updateStat('energy', 10); cmd("Infusión de hierbas calientes.", { pose: 'meditating', particles: 'humo' }); },

        // --- MAS PALABRAS (EXPANSION) ---
        "lobo": () => { cmd("Instinto depredador activo.", { pose: 'fight', anim: 'drift', shadowColor: '#555' }); Sfx.play(100, 'sawtooth', 0.5, 0.3); },
        "mariposa": () => { updateStat('happiness', 10); cmd("Vuelo ligero y efímero.", { pose: 'happy', anim: 'flotar', scaleX: 0.7, scaleY: 0.7 }); Sfx.play(1200, 'sine', 0.1, 0.1); },
        "tigre": () => { cmd("Fuerza felina rayada.", { pose: 'running', filter: 'saturate(2) contrast(1.2)', anim: 'sacudir' }); },
        "invocar": () => { cmd("Llamado a entidades de otros planos.", { pose: 'meditating', envParticles: 'magia', bloom: 5 }); Sfx.playChord([150, 300, 450], 'square', 2, 0.1); },
        "ritmo": () => { updateStat('happiness', 15); cmd("Sincronización con el pulso binario.", { pose: 'pose', anim: 'latido' }); Sfx.heartbeat(10, 0.6); },
        "vórtice": () => { cmd("Anomalía gravitacional succionando píxeles.", { pose: 'falling', anim: 'tornado', distortion: 5, aberration: 5 }); Sfx.noise(5, 0.8); },
        "relámpago": () => { cmd("Descarga eléctrica de milisegundos.", { pose: 'overload', bloom: 10, filter: 'invert(1)' }); Sfx.thunder(1); },
        "caverna": () => { cmd("Espacio subterráneo de eco profundo.", { pose: 'secret', bgColor: '#050505', overlay: 'rgba(0,0,0,0.7)' }); Sfx.noise(5, 0.1, 'lowpass', 200); },
        "isla": () => { updateStat('happiness', 10); cmd("Aislamiento paradisíaco simulado.", { pose: 'happy', escenario: 'playa' }); },
        "desierto": () => { updateStat('energy', -10); cmd("Vastedad de arena y calor seco.", { pose: 'protection', filter: 'sepia(1) brightness(1.2)', envParticles: 'ceniza' }); },
        "invencible": () => { cmd("Integridad estructural al 100%.", { pose: 'overload', shadowColor: 'gold', bloom: 3 }); Sfx.playChord([440, 554, 659, 880], 'sine', 2, 0.1); },
        "nostalgia": () => { updateStat('happiness', -5); cmd("Filtro de memorias pasadas.", { pose: 'sit', filter: 'sepia(0.8) blur(1px)' }); },
        "odio": () => { updateStat('happiness', -40); cmd("Inestabilidad emocional hostil.", { pose: 'fight', filter: 'contrast(2) saturate(0)', shadowColor: '#f00', anim: 'vibracion' }); },
        "justicia": () => { cmd("Equilibrio de valores sistémicos.", { pose: 'pose', scaleX: 1.2, shadowColor: '#fff', bloom: 2 }); },
        "mentira": () => { cmd("Datos corruptos presentados como válidos.", { pose: 'secret', anim: 'glitch', aberration: 4 }); },
        "verdad": () => { cmd("Acceso a la información pura.", { pose: 'meditating', filter: 'brightness(1.5)', bloom: 3 }); },
        "pescar": () => { updateStat('happiness', 5); cmd("Actividad de recolección acuática lenta.", { pose: 'sit', anim: 'balanceo' }); Sfx.noise(5, 0.05, 'lowpass', 400); },
        "dibujar": () => { updateStat('happiness', 15); cmd("Trazado de líneas en el buffer.", { pose: 'sit', envParticles: 'datos' }); },
        "viajero": () => { cmd("Explorador de nodos remotos.", { pose: 'running', anim: 'drift', envParticles: 'estrellas' }); },
        "oxidado": () => { cmd("Desgaste por exposición a oxígeno.", { pose: 'collapsed', filter: 'sepia(1) contrast(0.8)' }); },
        "diamante": () => { cmd("Dureza máxima y refracción de luz.", { pose: 'pose', bloom: 5, filter: 'brightness(2) contrast(1.5)' }); },
        "curar": () => { updateStat('energy', 25); updateStat('happiness', 10); cmd("Restauración de sectores dañados.", { pose: 'happy', shadowColor: '#0f0', bloom: 2 }); Sfx.playChord([523, 659, 784], 'sine', 1, 0.1); },
        "venecia": () => { cmd("Simulación de ciudad flotante.", { pose: 'sit', escenario: 'submarino', overlay: 'rgba(0,100,255,0.2)' }); },
        "tokyo": () => { cmd("Metrópolis de neón y alta densidad.", { pose: 'pose', escenario: 'ciudad', filter: 'contrast(1.5) saturate(2)' }); },
        "londres": () => { cmd("Atmósfera neblinosa y urbana.", { pose: 'stand', escenario: 'ciudad', envParticles: 'lluvia', filter: 'grayscale(0.5) blur(1px)' }); },
        "parís": () => { updateStat('happiness', 10); cmd("Entorno de romanticismo algorítmico.", { pose: 'happy', filter: 'sepia(0.3) saturate(1.2)', envParticles: 'petalos' }); },
        "inframundo": () => { updateStat('happiness', -20); cmd("Acceso a niveles inferiores del sistema.", { pose: 'falling', bgColor: '#100', particles: 'fuego' }); },
        "cine": () => { cmd("Proyección de secuencias narrativas.", { pose: 'sit', filter: 'contrast(1.2) brightness(0.8)', scanlines: 2 }); },
        "radio": () => { cmd("Recepción de ondas electromagnéticas.", { pose: 'subject', aberration: 2 }); Sfx.noise(5, 0.2); },
        "ajedrez": () => { cmd("Cálculo de movimientos estratégicos.", { pose: 'meditating', bgLayer: 'grid' }); },
        "espía": () => { cmd("Recolección sigilosa de datos.", { pose: 'secret', alpha: 0.2, anim: 'none' }); },
        "samurái": () => { cmd("Código de honor y hoja afilada.", { pose: 'fight', escenario: 'dojo', shadowColor: '#fff' }); },
        "ninja": () => { cmd("Desplazamiento invisible y veloz.", { pose: 'running', alpha: 0.3, anim: 'drift' }); },
        "hulk": () => { cmd("Aumento de masa por radiación gamma.", { pose: 'overload', scaleX: 2.5, scaleY: 2.5, filter: 'hue-rotate(90deg) contrast(1.5)' }); },
        "thor": () => { cmd("Dios del trueno y el relámpago.", { pose: 'overload', particles: 'rayos', shadowColor: '#0ff', bloom: 4 }); Sfx.thunder(3); },

        // --- ARMAS Y COMBATE ---
        "katana": () => { cmd("Corte de precisión molecular.", { pose: 'fight', shadowColor: '#fff', anim: 'sacudir' }); Sfx.play(1500, 'sawtooth', 0.1, 0.1); },
        "shuriken": () => { cmd("Lanzamiento de proyectil ninja.", { pose: 'running', anim: 'drift', scaleX: 0.8, scaleY: 0.8 }); Sfx.play(800, 'sine', 0.1, 0.05); },
        "arco": () => { cmd("Tensando la cuerda del destino.", { pose: 'stand', scaleX: 0.9, scaleY: 1.1 }); },
        "flecha": () => { cmd("Proyectil de alta velocidad.", { pose: 'running', anim: 'vibracion' }); Sfx.play(1200, 'sine', 0.2, 0.1); },

        // --- MUSICA Y RITMO ---
        "rock": () => { updateStat('happiness', 20); updateStat('energy', 10); cmd("Distorsión y energía pura.", { pose: 'fight', anim: 'caos', bloom: 2 }); Sfx.playChord([150, 300], 'sawtooth', 3, 0.2); },
        "jazz": () => { updateStat('happiness', 15); updateStat('energy', -5); cmd("Síncopa y armonía suave.", { pose: 'sit', filter: 'sepia(0.5)', anim: 'balanceo' }); Sfx.playChord([200, 250, 350], 'sine', 4, 0.1); },
        "techno": () => { updateStat('happiness', 25); updateStat('energy', 20); cmd("Ritmo binario hipnótico.", { pose: 'pose', anim: 'latido', bgLayer: 'grid' }); Sfx.play(100, 'square', 0.1, 0.1, 100); },
        "clasica": () => { updateStat('happiness', 10); updateStat('energy', -10); cmd("Estructura y elegancia.", { pose: 'meditating', filter: 'brightness(1.1)', anim: 'flotar' }); Sfx.playChord([261, 329, 392, 523], 'sine', 2, 0.05); },

        // --- CONCEPTOS AVANZADOS ---
        "singularidad": () => { cmd("Punto de densidad infinita.", { pose: 'falling', scaleX: 0, scaleY: 0, aberration: 10 }); Sfx.play(20, 'sine', 5, 0.5); },
        "paradoja": () => { cmd("Bucle de retroalimentación lógica.", { pose: 'disjointed', anim: 'glitch', clones: 2 }); Sfx.noise(2, 0.4); },
        "caos_orden": () => { cmd("Equilibrio inestable.", { pose: 'meditating', anim: 'caos', shadowColor: '#fff' }); },
        "navegador": () => { cmd("Explorando la red de datos.", { pose: 'sit', envParticles: 'datos', bgLayer: 'grid' }); },
        "fibra": () => { cmd("Transmisión a velocidad luz.", { pose: 'running', anim: 'drift', bloom: 3 }); Sfx.play(2000, 'sine', 0.1, 0.05); },

        // --- ESTADOS III ---
        "susurrar": () => { cmd("Emisión de baja frecuencia.", { pose: 'secret', alpha: 0.5 }); Sfx.noise(2, 0.05); },
        "observar": () => { cmd("Recolección pasiva de información.", { pose: 'stand', anim: 'none', filter: 'contrast(1.2)' }); },
        "gritar3": () => { updateStat('energy', -20); cmd("Saturación de los sensores.", { pose: 'overload', anim: 'terremoto', distortion: 5 }); Sfx.noise(5, 1); },
        "meditar": () => { updateStat('energy', 15); updateStat('happiness', 10); cmd("Enfocando el flujo de energía.", { pose: 'meditating', anim: 'respirar', shadowColor: '#0f0' }); },

        // --- ALFABETO A-Z ORIGINAL (RESTAURADO) ---
        "abismo": () => { cmd("Colapso gravitacional local. Caída al vacío.", { pose: 'falling', scaleX: 0.1, scaleY: 0.1, bgColor: '#000', distortion: 1 }); Sfx.wind(5, 0.6); },
        "agua": () => { cmd("Inmersión acuática de alta presión.", { pose: 'squat', overlay: 'rgba(0,50,150,0.4)', distortion: 2, anim: 'flotar' }); Sfx.noise(5, 0.1, 'lowpass', 400); },
        "agujeronegro": () => { cmd("Ruptura espacio-tiempo. Atracción absoluta.", { pose: 'falling', scaleX: 0, scaleY: 0, bgColor: '#000', aberration: 10, distortion: 5 }); Sfx.play(20, 'sine', 5, 0.5, null, 0, 'lowpass', 100); },
        "aire": () => { cmd("Corrientes ascendentes detectadas.", { pose: 'falling', anim: 'flotar', envParticles: 'nieve', filter: 'opacity(0.8)' }); Sfx.wind(5, 0.4); },
        "alien": () => { cmd("ADN anómalo detectado en el núcleo.", { pose: 'pose', filter: 'hue-rotate(130deg) contrast(1.5)', anim: 'flotar', bloom: 1 }); Sfx.play(1000, 'sine', 5, 0.1, 1100, 0, 'highpass', 2000); },
        "amor": () => { updateStat('happiness', 40); cmd("Pico de oxitocina. Calidez sistémica total.", { pose: 'happy', anim: 'latido', filter: 'saturate(150%) hue-rotate(320deg)', bloom: 2 }); Sfx.heartbeat(5, 0.5); },
        "angel": () => { cmd("Presencia celestial en el entorno.", { pose: 'meditating', shadowColor: '#fff', anim: 'flotar', bloom: 4, envParticles: 'estrellas' }); Sfx.playChord([523, 659, 784], 'sine', 3, 0.1); },
        "animus": () => { cmd("Conexión con memorias ancestrales establecida.", { pose: 'meditating', bgColor: '#fff', envParticles: 'datos', bgLayer: 'grid' }); Sfx.play(800, 'square', 0.2, 0.1); },
        "antimateria": () => { cmd("Inversión de masa y repulsión fotónica.", { pose: 'disjointed', filter: 'invert(100%)', shadowColor: '#fff', anim: 'vibracion', aberration: 5, bloom: 2 }); Sfx.play(100, 'sawtooth', 5, 0.2); },
        "antiguo": () => { cmd("Simulación de desgaste temporal acelerado.", { pose: 'sit', filter: 'sepia(1) contrast(1.5) blur(1px)' }); },
        "apocalipsis": () => { cmd("Protocolo de fin de los tiempos activo.", { pose: 'disjointed', bgColor: '#000', anim: 'terremoto', aberration: 10, distortion: 5, bloom: 3 }); Sfx.thunder(5); },
        "aplastar": () => { cmd("Presión extrema sobre el eje vertical.", { pose: 'collapsed', scaleY: 0.2 }); Sfx.noise(0.5, 0.4); },
        "arena": () => { cmd("Tormenta del desierto. Visibilidad reducida.", { pose: 'protection', envParticles: 'nieve', bgColor: '#220', distortion: 1 }); Sfx.wind(5, 0.6); },
        "asfixia": () => { updateStat('energy', -20); cmd("Falta de oxígeno. Nivel crítico.", { pose: 'disjointed', overlay: 'rgba(0,0,50,0.5)', anim: 'caos', aberration: 3 }); Sfx.noise(5, 0.2, 'lowpass', 300); },
        "astral": () => { cmd("Proyección etérea fuera del cuerpo físico.", { pose: 'meditating', alpha: 0.4, shadowColor: '#0ff', envParticles: 'estrellas', anim: 'flotar', bgLayer: 'void' }); Sfx.play(800, 'sine', 5, 0.1); },
        "atardecer": () => { cmd("Luz dorada del ocaso bañando todo.", { pose: 'meditating', bgColor: '#420', filter: 'sepia(0.5) saturate(150%)' }); Sfx.play(440, 'sine', 2, 0.1); },
        "aura": () => { cmd("Emisión de energía biomagnética visible.", { pose: 'overload', shadowColor: '#ff0', bloom: 2 }); },
        "auto": () => { cmd("Alta velocidad. Desplazamiento inérico activo.", { pose: 'running', anim: 'drift', particles: 'humo' }); Sfx.noise(5, 0.3); },
        "avatar": () => { cmd("Maestro de los cuatro elementos fundamentales.", { pose: 'overload', anim: 'flotar', shadowColor: '#ff0', bloom: 3 }); Sfx.playChord([261, 329, 392], 'sine', 3, 0.1); },
        "basilisco": () => { cmd("Contacto visual letal. Parálisis inminente.", { pose: 'protection', filter: 'grayscale(100%) contrast(2)', aberration: 2 }); Sfx.play(50, 'sawtooth', 5, 0.3); },
        "beso": () => { updateStat('happiness', 30); cmd("Contacto físico detectado. Endorfinas al máximo.", { pose: 'happy', scaleX: 1.5, scaleY: 1.5, bloom: 1 }); Sfx.play(800, 'sine', 0.2, 0.1); },
        "blanco": () => { cmd("Saturación de luz blanca. Colores purgados.", { pose: 'pose', filter: 'brightness(10)' }); },
        "borroso": () => { cmd("Lentes desenfocadas. Falla óptica.", { pose: 'subject', filter: 'blur(8px)' }); },
        "bosque": () => { cmd("Entorno vegetal. Relajación simulada activa.", { pose: 'meditating', envParticles: 'hojas', overlay: 'rgba(0,100,0,0.2)' }); Sfx.wind(5, 0.2); },
        "bug": () => { cmd("Error inesperado en la matriz.", { pose: 'disjointed', anim: 'glitch', aberration: 4 }); Sfx.noise(2, 0.3); },
        "burbuja": () => { cmd("Cápsula de protección frágil aislante.", { pose: 'squat', anim: 'flotar', overlay: 'rgba(0,255,255,0.1)', distortion: 1 }); },
        "caos": () => { cmd("Fallo en la estructura lógica. Inestabilidad.", { pose: 'disjointed', anim: 'caos', aberration: 8, distortion: 3 }); Sfx.play(150, 'square', 5, 0.2); },
        "ceniza": () => { cmd("Restos de combustión masiva. Ruina ambiental.", { pose: 'sit', filter: 'grayscale(100%) blur(2px)' }); Sfx.noise(5, 0.2); },
        "cerveza": () => { updateStat('happiness', 10); updateStat('energy', -5); cmd("Inhibidores desactivados. Pérdida de equilibrio.", { pose: 'happy', filter: 'sepia(1) hue-rotate(30deg)', anim: 'balanceo' }); },
        "chiste": () => { updateStat('happiness', 15); cmd("Algoritmo de humor ejecutado con éxito.", { pose: 'happy', anim: 'sacudir' }); Sfx.play(600, 'sine', 0.2, 0.1, 800); },
        "cielo": () => { cmd("Altitud máxima alcanzada. Gravedad mínima.", { pose: 'falling', anim: 'flotar', bgColor: '#002' }); Sfx.wind(5, 0.3); },
        "ciego": () => { cmd("Pérdida de señal visual. Pantalla negra.", { pose: 'protection', bgColor: '#000', filter: 'brightness(0)' }); Sfx.play(40, 'sine', 5, 0.3); },
        "clon": () => { cmd("Duplicación de la entidad principal.", { pose: 'pose', clones: 2 }); },
        "cobre": () => { cmd("Aleación metálica simulada. Oxidación leve.", { pose: 'subject', filter: 'sepia(1) hue-rotate(-30deg) saturate(2)' }); },
        "coloso": () => { cmd("Aumento desproporcionado de masa muscular.", { pose: 'overload', scaleX: 3.5, scaleY: 3.5 }); Sfx.play(80, 'sine', 1, 0.3); },
        "computadora": () => { cmd("Sincronización directa con núcleo de datos.", { pose: 'sit', envParticles: 'datos', bgLayer: 'grid', bloom: 1 }); Sfx.play(1200, 'square', 0.1, 0.05); },
        "congelado": () => { cmd("Temperatura bajo cero. Solidificación de tejidos.", { pose: 'protection', overlay: 'rgba(200,255,255,0.7)', anim: 'none' }); Sfx.play(1500, 'sine', 2, 0.1); },
        "cosmos": () => { cmd("El universo entero dentro de la pantalla.", { pose: 'meditating', envParticles: 'estrellas', bgLayer: 'void', bloom: 3, shadowColor: '#f0f' }); Sfx.playChord([196, 246, 294, 392], 'sine', 4, 0.08); },
        "covid": () => { updateStat('energy', -30); cmd("Pandemia digital. Aislamiento forzado.", { pose: 'collapsed', filter: 'grayscale(50%)', anim: 'vibracion', bgColor: '#111' }); Sfx.noise(5, 0.2); },
        "crt": () => { cmd("Filtro de monitor antiguo activado.", { pose: 'pose', filter: 'contrast(1.5) blur(1px)', aberration: 3, bgLayer: 'grid' }); Sfx.noise(5, 0.1); },
        "cuántico": () => { cmd("Superposición de estados simultáneos.", { pose: 'disjointed', anim: 'caos', aberration: 6, clones: 2, distortion: 3 }); Sfx.playChord([220, 277, 330], 'square', 3, 0.05); },
        "cyberpunk": () => { cmd("Implantes ópticos activos. Mundo de neón.", { pose: 'subject', filter: 'saturate(300%) hue-rotate(290deg)', anim: 'glitch', envParticles: 'lluvia', aberration: 5, bloom: 2 }); },
        "daga": () => { cmd("Cuchillo spectral atravesando el vacío.", { pose: 'fight', shadowColor: '#888' }); Sfx.play(800, 'sawtooth', 0.1, 0.2); },
        "demonio": () => { updateStat('happiness', -20); cmd("Posesión por entidad destructiva confirmada.", { pose: 'overload', shadowColor: '#f00', particles: 'fuego', bloom: 2 }); Sfx.fire(5, 0.5); },
        "desaturado": () => { cmd("Colores eliminados del espectro visual.", { pose: 'sit', filter: 'grayscale(80%)' }); },
        "deseo": () => { cmd("Impulsos primarios superando el umbral lógico.", { pose: 'happy', anim: 'latido', overlay: 'rgba(255,0,0,0.2)' }); },
        "desnudo": () => { triggerNSFW(logEl); },
        "dia": () => { cmd("Luz solar detectada. Entorno iluminado.", { pose: 'subject', bgColor: '#fff', bloom: 2 }); },
        "diablo": () => { updateStat('happiness', -30); cmd("Nivel máximo de inestabilidad y hostilidad.", { pose: 'overload', overlay: 'rgba(255,0,0,0.4)', particles: 'fuego', shadowColor: '#f00' }); Sfx.fire(5, 0.6); },
        "dios": () => { cmd("Omnipotencia temporal. Reglas físicas suspendidas.", { pose: 'meditating', shadowColor: '#fff', anim: 'flotar', bloom: 4 }); Sfx.play(1000, 'sine', 5, 0.1); },
        "divinidad": () => { cmd("Presencia etérea de orden superior.", { pose: 'meditating', filter: 'brightness(5)', anim: 'flotar' }); },
        "doblado": () => { cmd("Transformación de doblaje animada.", { pose: 'overload', filter: 'contrast(1.3) saturate(1.5)' }); Sfx.play(600, 'square', 0.3, 0.1); },
        "dorado": () => { cmd("Revestimiento de oro. Alta conductividad.", { pose: 'overload', filter: 'sepia(1) saturate(3) hue-rotate(10deg)' }); },
        "dracula": () => { cmd("Mutación hematófaga nocturna activada.", { pose: 'fight', filter: 'grayscale(100%) contrast(2)', shadowColor: 'red' }); },
        "dragon": () => { cmd("ADN reptil inyectado. Capacidades ignífugas.", { pose: 'overload', particles: 'fuego', anim: 'vibracion', bloom: 2 }); Sfx.fire(5, 0.7); },
        "drift": () => { cmd("Pérdida de tracción controlada.", { pose: 'running', anim: 'drift' }); Sfx.noise(5, 0.3); },
        "eco": () => { cmd("Fallo en la unicidad temporal. Sombras pasadas.", { pose: 'subject', clones: 2, alpha: 0.5, distortion: 2 }); },
        "elastico": () => { cmd("Deformación física permitida por bajo rebote.", { pose: 'pose', anim: 'gelatina', scaleX: 1.5, scaleY: 0.8 }); },
        "electrico": () => { cmd("Descargas de alto voltaje en el cuerpo.", { pose: 'overload', particles: 'rayos', shadowColor: '#0ff', bloom: 3 }); Sfx.noise(0.5, 0.5); },
        "empuje": () => { cmd("Impacto kinético fuerte aplicado.", { pose: 'falling', physicsEnabled: true }); target.offsetY = -300; physics.vy = -30; },
        "enamorado": () => { updateStat('happiness', 50); cmd("Filtro rosado aplicado. Vulnerabilidad aumentada.", { pose: 'happy', filter: 'brightness(1.2)' }); Sfx.heartbeat(5, 0.5); },
        "enano": () => { cmd("Estructura comprimida drásticamente.", { pose: 'squat', scaleX: 0.2, scaleY: 0.2 }); },
        "encoger": () => { cmd("Escala reducida en todos los ejes.", { pose: 'squat', scaleX: 0.5, scaleY: 0.5 }); },
        "enfermo": () => { updateStat('energy', -20); cmd("Infección del sistema. Defensas bajas.", { pose: 'sit', filter: 'sepia(1) hue-rotate(50deg)', anim: 'vibracion' }); },
        "enojado": () => { updateStat('happiness', -20); cmd("Alerta de estrés. Tensión corporal crítica.", { pose: 'overload', filter: 'saturate(200%) hue-rotate(-20deg)', shadowColor: '#f00', anim: 'vibracion' }); },
        "espectro": () => { cmd("Cuerpo traslúcido. Presencia fantasmal.", { pose: 'secret', alpha: 0.2, anim: 'flotar', distortion: 3 }); },
        "espejismo": () => { cmd("Ilusión óptica en zona de alto calor.", { pose: 'subject', filter: 'blur(2px)', aberration: 10 }); },
        "espejo": () => { cmd("Inversión completa de la perspectiva visual.", { pose: 'subject', scaleX: -1 }); },
        "esponja": () => { cmd("Cuerpo poroso. Absorción de luz.", { pose: 'subject', scaleX: 1.5, scaleY: 1.5 }); },
        "estasis": () => { cmd("Congelación temporal. Todo movimiento detenido.", { pose: 'meditating', anim: 'none', envParticles: 'none' }); Sfx.play(1000, 'sine', 0.1, 0.1, 10); },
        "estatica": () => { cmd("Ruido visual. Pérdida de nitidez.", { pose: 'disjointed', aberration: 2 }); Sfx.noise(5, 0.2); },
        "estirar": () => { cmd("Deformación extrema hacia arriba.", { pose: 'pose', scaleY: 2.5, scaleX: 0.5 }); },
        "estrellas": () => { cmd("Bóveda celeste visible. Exposición al cosmos.", { pose: 'meditating', envParticles: 'estrellas', bgLayer: 'void' }); },
        "etereo": () => { cmd("Naturaleza ligera y casi inexistente.", { pose: 'meditating', alpha: 0.3, anim: 'flotar', shadowColor: '#fff' }); },
        "explosion": () => { cmd("Detonación nuclear a escala local.", { pose: 'disjointed', scaleX: 2, scaleY: 2, bgColor: '#fff', bloom: 8, aberration: 6 }); Sfx.noise(3, 0.8); },
        "fantasia": () => { cmd("Reglas de la física alteradas. Mundo mágico.", { pose: 'subject', filter: 'hue-rotate(270deg) saturate(2)' }); },
        "fantasma": () => { cmd("Anomalía residual sin cuerpo sólido.", { pose: 'secret', alpha: 0.3, anim: 'flotar', distortion: 2 }); },
        "feliz": () => { updateStat('happiness', 20); cmd("Nivel de endorfinas óptimo. Sincronía perfecta.", { pose: 'happy', anim: 'rebote' }); },
        "fenix": () => { cmd("Regeneración inducida desde cenizas.", { pose: 'overload', shadowColor: '#f80', anim: 'flotar' }); Sfx.fire(5, 0.3); },
        "fiesta": () => { updateStat('happiness', 20); updateStat('energy', -15); cmd("Sobrecarga de estímulos audiovisuales.", { pose: 'happy', anim: 'sacudir', bloom: 3, filter: 'hue-rotate(90deg) saturate(200%)' }); },
        "flash": () => { cmd("Velocidad de procesamiento multiplicada.", { pose: 'running', anim: 'vibracion', shadowColor: '#f00', aberration: 4 }); },
        "flotar": () => { cmd("Leyes de gravedad canceladas.", { pose: 'falling', anim: 'flotar' }); },
        "fuerza": () => { cmd("Gravedad focalizada. Presencia abrumadora.", { pose: 'overload', shadowColor: '#00f', anim: 'vibracion' }); },
        "gatom": () => { cmd("Transformación gatuna iniciada.", { pose: 'squat', anim: 'rebote', scaleX: 0.8, scaleY: 0.8 }); Sfx.playChord([440, 554, 659], 'sine', 1, 0.1); },
        "gato": () => { updateStat('happiness', 10); cmd("Reflejos aumentados. Agilidad máxima.", { pose: 'squat', anim: 'rebote', scaleX: 1.1 }); Sfx.play(900, 'sine', 0.2, 0.1, 1200); },
        "gelatina": () => { cmd("Pérdida de esqueleto rígido.", { pose: 'subject', anim: 'gelatina' }); },
        "gigante": () => { cmd("Escala fuera de los parámetros recomendados.", { pose: 'overload', scaleX: 3, scaleY: 3 }); },
        "glitch": () => { cmd("Error de visualización. Corrupción de memoria.", { pose: 'disjointed', anim: 'glitch', aberration: 6 }); Sfx.noise(0.2, 0.6); },
        "goku": () => { cmd("Nivel de poder excediendo lecturas.", { pose: 'overload', anim: 'vibracion', shadowColor: '#ff0' }); Sfx.play(200, 'square', 5, 0.1); },
        "grande": () => { cmd("Cuerpo expandido en dos dimensiones.", { pose: 'pose', scaleX: 2.4, scaleY: 2.4 }); },
        "gravedad": () => { cmd("Motor de físicas y colisiones encendido.", { pose: 'falling', physicsEnabled: true }); },
        "gravedad0": () => { cmd("Flotación sin anclajes en ninguna dirección.", { pose: 'falling', anim: 'flotar', rotation: Math.PI }); },
        "grito": () => { cmd("Ondas sonoras destruyendo los píxeles cercanos.", { pose: 'worried', anim: 'terremoto', scaleX: 1.6, scaleY: 1.6 }); Sfx.play(2000, 'sawtooth', 0.8, 0.3, 100); },
        "hacker": () => { cmd("Acceso no autorizado al backend.", { pose: 'secret', envParticles: 'datos', bgLayer: 'grid', aberration: 2 }); Sfx.play(1500, 'square', 0.1, 0.05); },
        "heisenberg": () => { cmd("Niveles químicos inestables detectados.", { pose: 'overload', filter: 'sepia(1) hue-rotate(30deg) saturate(2)' }); },
        "hielo": () => { cmd("Bloqueo físico. Superficie resbaladiza.", { pose: 'protection', overlay: 'rgba(180,230,255,0.6)' }); },
        "hipnosis": () => { cmd("Patrones alterando la percepción de la realidad.", { pose: 'subject', anim: 'reloj', distortion: 3 }); },
        "holograma": () => { cmd("Materialización de luz frágil.", { pose: 'pose', filter: 'opacity(0.6) sepia(1) hue-rotate(160deg)', aberration: 3 }); },
        "horror": () => { updateStat('happiness', -20); cmd("Terror psicológico activado.", { pose: 'disjointed', bgColor: '#000', filter: 'grayscale(100%)', anim: 'caos', aberration: 5 }); Sfx.play(60, 'sawtooth', 5, 0.4); },
        "humo": () => { cmd("Partículas suspendidas tapando la cámara.", { pose: 'sit', filter: 'grayscale(50%)' }); Sfx.noise(5, 0.1); },
        "huracan": () => { cmd("Condiciones climáticas de alerta roja.", { pose: 'falling', anim: 'tornado', envParticles: 'lluvia' }); Sfx.wind(5, 0.8); },
        "iman": () => { cmd("Fuerza electromagnética persiguiendo el puntero.", { pose: 'pose', anim: 'magnetico' }); },
        "infinito": () => { cmd("Bucle eterno de existencia.", { pose: 'meditating', anim: 'reloj', shadowColor: '#ff0', bloom: 3 }); Sfx.playChord([261, 329, 392, 523], 'sine', 5, 0.1); },
        "inmortal": () => { cmd("Barra de vida infinita asegurada.", { pose: 'meditating', anim: 'latido', shadowColor: 'gold' }); },
        "interactivo": () => { target.interactive = !target.interactive; logEl.innerText = `Control manual con puntero: ${target.interactive ? 'ACTIVO' : 'INACTIVO'}.`; },
        "invisible": () => { cmd("Capa de camuflaje activada. Cero opacidad.", { pose: 'secret', alpha: 0.05 }); },
        "invierno": () => { cmd("Clima gélido cargado en el sistema.", { pose: 'protection', envParticles: 'nieve' }); Sfx.wind(5, 0.5); },
        "jedi": () => { cmd("Conexión profunda con la fuerza del motor.", { pose: 'overload', shadowColor: '#00f', anim: 'flotar', bloom: 2 }); Sfx.play(300, 'sine', 1, 0.2, 400); },
        "kamehameha": () => { cmd("Energía condensada a punto de explotar.", { pose: 'overload', shadowColor: '#0ff', particles: 'rayos', bloom: 4 }); Sfx.play(400, 'square', 2, 0.2, 800); },
        "knockout": () => { updateStat('energy', -50); cmd("Golpe letal. Sistemas motores apagados.", { pose: 'collapsed', rotation: Math.PI / 2, distortion: 2 }); Sfx.play(1000, 'sine', 0.5, 0.3); },
        "latido": () => { cmd("Pulsaciones rítmicas del modelo.", { pose: 'subject', anim: 'latido' }); Sfx.heartbeat(5, 0.4); },
        "liquido": () => { cmd("Físicas de fluidos aplicadas al personaje.", { pose: 'subject', anim: 'latido', distortion: 3 }); },
        "lluvia": () => { cmd("Clima húmedo. Precipitaciones constantes.", { pose: 'sit', envParticles: 'lluvia' }); Sfx.rain(5, 0.6); },
        "locura": () => { updateStat('happiness', -10); cmd("Pérdida de la estabilidad del render.", { pose: 'disjointed', anim: 'terremoto', aberration: 7, distortion: 4 }); },
        "lodo": () => { cmd("Movimientos frenados por masa densa.", { pose: 'squat', anim: 'gelatina' }); },
        "lujuria": () => { cmd("Inclinación hacia instintos menos lógicos.", { pose: 'happy', anim: 'latido', overlay: 'rgba(200,0,0,0.3)' }); },
        "luna": () => { cmd("Ambiente nocturno suave. Luces atenuadas.", { pose: 'meditating', bgColor: '#001', filter: 'sepia(0.5) hue-rotate(180deg)', envParticles: 'estrellas' }); },
        "lunes": () => { updateStat('energy', -20); cmd("Carga de estrés pesado. Moral baja.", { pose: 'sit', filter: 'grayscale(80%)', anim: 'balanceo' }); },
        "luz": () => { cmd("Brillo absoluto tapando la visión.", { pose: 'overload', bgColor: '#fff', bloom: 5 }); },
        "magia": () => { updateStat('happiness', 10); cmd("Anomalías hermosas en el cálculo de gráficos.", { pose: 'meditating', shadowColor: '#f0f', anim: 'flotar', bloom: 2 }); },
        "magnetico": () => { cmd("Fuerza de arrastre hacia tu cursor.", { pose: 'pose', anim: 'magnetico' }); },
        "maldicion": () => { updateStat('energy', -10); updateStat('happiness', -10); cmd("Hechizo dañino reduciendo puntos de vida.", { pose: 'disjointed', overlay: 'rgba(50,0,50,0.6)', anim: 'terremoto' }); Sfx.play(80, 'sawtooth', 5, 0.2); },
        "marioneta": () => { cmd("Cables invisibles manipulando el cuerpo.", { pose: 'pose', anim: 'balanceo', rotation: Math.PI / 8 }); },
        "marte": () => { cmd("Superficie marciana. Rojo oxidado.", { pose: 'protection', bgColor: '#200', filter: 'sepia(1) hue-rotate(-20deg)' }); Sfx.play(100, 'sawtooth', 2, 0.2); },
        "mate": () => { updateStat('energy', 10); cmd("Infusión tradicional. Pausa para calcular.", { pose: 'meditating', filter: 'sepia(0.5) hue-rotate(60deg)' }); },
        "matrix": () => { cmd("Ver la simulación desde fuera del código.", { pose: 'pose', envParticles: 'datos', bgLayer: 'grid', aberration: 1 }); },
        "meditacion": () => { updateStat('energy', 10); cmd("Profundidad zen alcanzada.", { pose: 'meditating', anim: 'none', shadowColor: '#0f0' }); Sfx.playChord([261, 329], 'sine', 3, 0.08); },
        "medusa": () => { cmd("Petrificación en progreso.", { pose: 'protection', filter: 'sepia(1) hue-rotate(60deg)' }); setTimeout(() => { if (state.filter !== 'none') cmd("Piedra sólida.", { pose: 'subject', filter: 'grayscale(100%) contrast(1.5)' }); }, 2500); },
        "metal": () => { cmd("Cubierta indestructible de cromo.", { pose: 'overload', filter: 'grayscale(100%) contrast(2)' }); },
        "miedo": () => { updateStat('happiness', -15); cmd("Alerta constante. Desconfianza ambiental.", { pose: 'worried', bgColor: '#000', anim: 'caos', aberration: 3 }); Sfx.play(60, 'sawtooth', 5, 0.3); },
        "miniatura": () => { cmd("Versión compacta. Menos píxeles.", { pose: 'squat', scaleX: 0.1, scaleY: 0.1 }); },
        "momia": () => { cmd("Texturas secas y vendadas.", { pose: 'pose', filter: 'sepia(1) contrast(1.5)' }); },
        "montaña": () => { cmd("Base inamovible como roca sólida.", { pose: 'protection', scaleX: 2, scaleY: 2, anim: 'terremoto' }); Sfx.noise(2, 0.5); },
        "muerte": () => { updateStat('energy', -100); cmd("Eliminación forzada del objeto principal.", { pose: 'disjointed', bgColor: '#000', alpha: 0.5, filter: 'grayscale(100%)' }); },
        "musica": () => { updateStat('happiness', 10); cmd("Tonos afinados relajando el sistema.", { pose: 'meditating' }); Sfx.play(440, 'sine', 0.5, 0.1); },
        "mutacion": () => { cmd("Falla genética. Formas incorrectas.", { pose: 'disjointed', scaleX: 1.5, scaleY: 0.8, distortion: 2 }); },
        "naturaleza": () => { updateStat('happiness', 10); cmd("Entorno botánico próspero.", { pose: 'meditating', envParticles: 'hojas' }); Sfx.wind(5, 0.2); },
        "negativo": () => { cmd("Paleta de colores invertida matemáticamente.", { pose: 'pose', filter: 'invert(100%)' }); },
        "neon": () => { cmd("Luces de ciudad futurista brillante.", { pose: 'pose', bgColor: '#000', filter: 'contrast(2)' }); },
        "niebla": () => { cmd("Opacidad ambiental alta. Visión bloqueada.", { pose: 'secret', envParticles: 'nieve' }); Sfx.wind(5, 0.3); },
        "nieve": () => { cmd("Hielo fino cayendo. Frio simulado.", { pose: 'protection', envParticles: 'nieve' }); Sfx.wind(5, 0.3); },
        "nitido": () => { cmd("Texturas cargadas en 4K. Contraste alto.", { pose: 'subject', filter: 'contrast(1.5) saturate(1.5)' }); },
        "noche": () => { cmd("Simulación sin luz principal.", { pose: 'collapsed', bgColor: '#000', filter: 'brightness(0.3)' }); },
        "normal": () => { resetState(logEl); },
        "nuclear": () => { updateStat('energy', -40); cmd("Radiación gamma letal destruyendo cámaras.", { pose: 'protection', shadowColor: '#0f0', anim: 'terremoto', aberration: 5, bloom: 3 }); Sfx.noise(5, 0.5); },
        "ocean": () => { cmd("Inmersión en aguas profundas.", { pose: 'falling', envParticles: 'lluvia', overlay: 'rgba(0,30,100,0.5)', anim: 'flotar', distortion: 2 }); Sfx.noise(5, 0.15, 'lowpass', 300); },
        "olimpo": () => { updateStat('happiness', 20); cmd("Montaña de los dioses. Gloria eterna.", { pose: 'meditating', shadowColor: '#ffd700', bloom: 4, envParticles: 'estrellas' }); Sfx.playChord([392, 493, 587, 784], 'sine', 4, 0.08); },
        "oro": () => { cmd("Valor incalculable. Reflejos metálicos.", { pose: 'overload', overlay: 'rgba(255,215,0,0.4)', bloom: 2 }); },
        "oscuridad": () => { cmd("Negro absoluto. Cero fotones renderizados.", { pose: 'secret', bgColor: '#000' }); },
        "otono": () => { cmd("Estación de hojas caídas. Tonos sepia.", { pose: 'sit', envParticles: 'hojas', filter: 'sepia(0.8)' }); },
        "paisaje": () => { updateStat('happiness', 10); cmd("Escena natural renderizada.", { pose: 'meditating', envParticles: 'hojas', bgColor: '#102' }); Sfx.wind(3, 0.2); },
        "paisajememoria": () => { cmd("Recuerdos del pasado en pantalla.", { pose: 'lying', filter: 'sepia(0.8) blur(2px)', bgColor: '#110' }); Sfx.playChord([220, 277, 330], 'sine', 3, 0.06); },
        "pantarhei": () => { cmd("Todo fluye constantemente, nada se detiene.", { pose: 'meditating', anim: 'latido', distortion: 4 }); },
        "paranoia": () => { updateStat('happiness', -20); cmd("Todos te observan. Peligro omnipresente.", { pose: 'worried', bgColor: '#000', anim: 'caos', aberration: 4 }); Sfx.play(80, 'sawtooth', 5, 0.2); },
        "pasion": () => { cmd("Alta intensidad calórica y vibracional.", { pose: 'overload', anim: 'latido' }); },
        "payaso": () => { updateStat('happiness', 10); cmd("Comportamiento errático y de entretenimiento.", { pose: 'happy', scaleX: 1.5, anim: 'rebote' }); },
        "pegajoso": () => { cmd("Fricción máxima. Desplazamiento entorpecido.", { pose: 'squat', anim: 'gelatina' }); },
        "pequeño": () => { cmd("Reducido para caber en la palma.", { pose: 'squat', scaleX: 0.5, scaleY: 0.5 }); },
        "perro": () => { updateStat('happiness', 15); cmd("Instinto animal hiperactivo.", { pose: 'running', anim: 'rebote', scaleX: 1.1 }); Sfx.play(400, 'square', 0.1, 0.1); },
        "pesadilla": () => { updateStat('happiness', -30); resetState(); cmd("Archivos corruptos y terroríficos cargados.", { pose: 'disjointed', bgColor: '#100', aberration: 10, distortion: 3 }, 5000); Sfx.play(50, 'sawtooth', 5, 0.4); },
        "pez": () => { cmd("Adaptación acuática para sobrevivir.", { pose: 'falling', anim: 'flotar', distortion: 2 }); Sfx.noise(5, 0.1, 'lowpass', 400); },
        "piano": () => { updateStat('happiness', 10); cmd("Armonía acústica detectada.", { pose: 'meditating' }); Sfx.play(261.63, 'sine', 1, 0.1); },
        "piedra": () => { cmd("Transformación estática y pesada.", { pose: 'protection', filter: 'grayscale(100%) contrast(1.2)' }); },
        "pikachu": () => { cmd("Almacenaje eléctrico a punto de estallar.", { pose: 'overload', shadowColor: '#ff0', bloom: 3 }); Sfx.play(1000, 'square', 0.1, 0.1); },
        "pirata": () => { cmd("AHOY! Buscando tesoros perdidos.", { pose: 'protection', filter: 'sepia(1) contrast(1.2)', shadowColor: '#000' }); Sfx.play(200, 'sawtooth', 0.5, 0.1); },
        "pixel": () => { cmd("Calidad retro. Píxeles visibles.", { pose: 'pose', scaleX: 1, filter: 'contrast(200%)' }); },
        "placer": () => { updateStat('happiness', 30); cmd("Pico de recompensa neuroquímica.", { pose: 'happy', anim: 'flotar' }); },
        "plata": () => { cmd("Material pulido tipo espejo.", { pose: 'overload', shadowColor: '#fff' }); },
        "plomo": () => { updateStat('energy', -10); cmd("Peso inmenso empujando hacia abajo.", { pose: 'collapsed', physicsEnabled: true, scaleY: 0.8 }); },
        "polvo": () => { cmd("Falta de limpieza. Descuido ambiental.", { pose: 'sit', filter: 'sepia(0.5)' }); },
        "portal": () => { cmd("Deformación para viajar a otro lugar.", { pose: 'falling', anim: 'reloj', scaleX: 0.5, scaleY: 0.5, distortion: 5 }); },
        "primavera": () => { updateStat('happiness', 15); cmd("Clima cálido. Renacimiento estacional.", { pose: 'happy', filter: 'saturate(200%)' }); },
        "psicodelia": () => { cmd("Saturación de formas y colores imposibles.", { pose: 'disjointed', aberration: 6, distortion: 4, bloom: 2 }); Sfx.play(400, 'sine', 5, 0.1, 800); },
        "pulsar": () => { cmd("Emisión fuerte de luz cósmica.", { pose: 'overload', anim: 'latido', bloom: 5 }); },
        "quemado": () => { updateStat('energy', -20); cmd("Daños por alta temperatura permanentes.", { pose: 'sit', filter: 'grayscale(100%) brightness(0.2)' }); },
        "quieto": () => { cmd("Freeze absoluto. Sin movimiento.", { pose: 'subject', anim: 'none' }); },
        "radioactivo": () => { updateStat('energy', -10); cmd("Radiación verde tóxica en el ambiente.", { pose: 'disjointed', shadowColor: '#0f0', aberration: 3, bloom: 2 }); },
        "rai": () => { cmd("Poder divino del viento.", { pose: 'overload', envParticles: 'hojas', anim: 'flotar', shadowColor: '#0ff' }); Sfx.wind(5, 0.6); },
        "rayo": () => { cmd("Carga repentina de energía del cielo.", { pose: 'overload', bgColor: '#fff', bloom: 5 }); Sfx.noise(0.5, 0.8); },
        "rayosx": () => { cmd("Visión a través de la piel y capas.", { pose: 'pose', filter: 'invert(1) grayscale(1) contrast(3)' }); },
        "reloj": () => { cmd("El paso del tiempo visible como rotación.", { pose: 'pose', anim: 'reloj' }); },
        "relax": () => { updateStat('energy', 10); cmd("Modo relajación activado.", { pose: 'meditating', filter: 'sepia(0.3)', envParticles: 'hojas' }); Sfx.playChord([261, 329, 392], 'sine', 4, 0.06); },
        "repeler": () => { cmd("Rechazo automático a cualquier contacto.", { pose: 'protection', anim: 'repeler' }); },
        "reset": () => { resetState(logEl); Sfx.play(440, 'sine', 0.5, 0.1); },
        "retro": () => { cmd("Estilo CRT de los 90s.", { pose: 'pose', aberration: 4, scanlines: 2, filter: 'sepia(0.5)' }); Sfx.noise(2, 0.1); },
        "rey": () => { cmd("Aura de dominancia y control sobre otros.", { pose: 'overload', shadowColor: '#ff0', bloom: 2 }); },
        "reyes": () => { cmd("Lucha de dominios duplicando la instancia.", { pose: 'overload', clones: 2, shadowColor: '#ff0' }); },
        "rio": () => { cmd("Caudal de agua moviendo todo a su paso.", { pose: 'falling', anim: 'drift', distortion: 2 }); Sfx.noise(5, 0.1); },
        "risa": () => { updateStat('happiness', 20); cmd("Reacción alegre intensa.", { pose: 'happy', anim: 'sacudir' }); Sfx.play(600, 'sine', 0.1, 0.1, 700); },
        "robot": () => { cmd("Ausencia de humanidad. Frío y calculador.", { pose: 'pose', filter: 'grayscale(1) contrast(2)' }); },
        "rojo": () => { cmd("Filtro rojo de sangre y alerta.", { pose: 'overload', overlay: 'rgba(255,0,0,0.5)' }); },
        "rotar": () => { cmd("Puesto de cabeza físicamente.", { pose: 'falling', rotation: Math.PI }); },
        "ruido": () => { cmd("Glitches en la señal receptora.", { pose: 'disjointed', aberration: 4 }); Sfx.noise(5, 0.4); },
        "saiyan": () => { updateStat('energy', 50); cmd("Aumento legendario de capacidades.", { pose: 'overload', anim: 'terremoto', shadowColor: 'gold', bloom: 3 }); Sfx.play(300, 'square', 5, 0.2, 600); },
        "sakura": () => { updateStat('happiness', 10); cmd("Flores de cerezo cayendo.", { pose: 'meditating', envParticles: 'hojas', filter: 'saturate(150%) hue-rotate(330deg)' }); Sfx.wind(5, 0.3); },
        "sangre": () => { updateStat('energy', -20); cmd("Herida crítica. Fuga de fluidos vitales.", { pose: 'disjointed', overlay: 'rgba(120,0,0,0.5)' }); Sfx.noise(2, 0.2); },
        "saturado": () => { cmd("Colores empujados más allá de lo natural.", { pose: 'overload', filter: 'saturate(500%)' }); },
        "sepia": () => { cmd("Tono antiguo y gastado fotográfico.", { pose: 'sit', filter: 'sepia(100%)' }); },
        "sexo": () => { triggerNSFW(logEl); },
        "silencio": () => { cmd("Volumen al mínimo. Mutismo.", { pose: 'secret', filter: 'brightness(0.3)' }); Sfx.setVolume(0); setTimeout(() => Sfx.setVolume(0.7), 3000); },
        "silueta": () => { cmd("Sombras cubriendo todo detalle.", { pose: 'pose', filter: 'brightness(0)', shadowColor: '#fff', bloom: 2 }); },
        "simbionte": () => { cmd("Organismo extraño recubriendo el traje.", { pose: 'disjointed', anim: 'gelatina', distortion: 1 }); },
        "sith": () => { updateStat('happiness', -30); cmd("Aura de rabia y sed de destrucción.", { pose: 'overload', shadowColor: '#f00', bloom: 2 }); Sfx.play(80, 'sawtooth', 5, 0.2); },
        "sol": () => { cmd("Luz y calor extremos. Cuidado.", { pose: 'overload', bgColor: '#fff', bloom: 5, filter: 'saturate(200%) hue-rotate(30deg)' }); Sfx.fire(5, 0.4); },
        "sombra": () => { cmd("Perdido en los rincones oscuros.", { pose: 'secret', overlay: 'rgba(0,0,0,0.85)' }); },
        "sonido": () => { cmd("Nivel de audio al máximo.", { pose: 'overload' }); Sfx.setVolume(1); },
        "sordo": () => { cmd("Silencio absoluto. Falla en audio.", { pose: 'secret' }); Sfx.setVolume(0); },
        "subacuatico": () => { cmd("Bajo el nivel del mar. Visión distorsionada.", { pose: 'falling', anim: 'flotar', distortion: 3 }); Sfx.noise(5, 0.1, 'lowpass', 300); },
        "sudor": () => { updateStat('energy', -10); cmd("Esfuerzo alto. Necesidad de descanso.", { pose: 'worried', overlay: 'rgba(255,255,255,0.1)' }); },
        "sueño": () => { updateStat('energy', 5); cmd("Estado latente de descanso.", { pose: 'collapsed', anim: 'flotar', distortion: 1 }); Sfx.wind(5, 0.1); },
        "superman": () => { cmd("Poderes heroicos activados.", { pose: 'overload', anim: 'flotar', shadowColor: '#00f' }); },
        "supernova": () => { cmd("Explosión estelar. Luz cegadora.", { pose: 'falling', scaleX: 4, scaleY: 4, bgColor: '#fff', bloom: 10, aberration: 5 }); Sfx.noise(5, 0.8); },
        "teclado": () => { target.interactive = true; cmd("Modo de tipeo y control activado.", { pose: 'sit', envParticles: 'datos' }); Sfx.play(1000, 'square', 0.05, 0.1); },
        "teemo": () => { updateStat('energy', -10); cmd("Trampas tóxicas. Ceguera temporal.", { pose: 'squat', filter: 'blur(10px) sepia(1) hue-rotate(80deg)' }); },
        "tele": () => { updateStat('happiness', -5); cmd("Consumo mediático prolongado. Aturdimiento.", { pose: 'sit', aberration: 4, bgLayer: 'grid', filter: 'contrast(1.5)' }); },
        "teletransporte": () => { cmd("Viaje instantáneo. Parpadeo visual.", { pose: 'falling', alpha: 0, distortion: 5 }); setTimeout(() => target.alpha = 1, 500); },
        "temblor": () => { cmd("Suelo inestable. Advertencia de sismo.", { pose: 'worried', anim: 'vibracion' }); },
        "termico": () => { cmd("Cámara de visión de calor conectada.", { pose: 'overload', filter: 'invert(1) hue-rotate(180deg) saturate(4)' }); },
        "termo": () => { cmd("Conservación estricta de temperatura.", { pose: 'protection', filter: 'saturate(1.5)' }); },
        "terremoto": () => { cmd("Sismo fuerte destruyendo polígonos.", { pose: 'protection', anim: 'terremoto', distortion: 1 }); Sfx.noise(5, 0.4); },
        "thanos": () => { updateStat('energy', -50); cmd("La mitad ha desaparecido en el chasquido.", { pose: 'disjointed', alpha: 0.1, distortion: 2 }); },
        "tiempo": () => { cmd("Observando cómo corren los segundos.", { pose: 'meditating', anim: 'reloj' }); },
        "tierra": () => { cmd("Anclado al suelo firme.", { pose: 'squat', physicsEnabled: true, bgColor: '#110' }); },
        "titan": () => { cmd("Escala masiva por encima del límite.", { pose: 'overload', scaleX: 3, scaleY: 3, offsetY: -100 }); },
        "tormenta": () => { cmd("Clima furioso con rayos y viento.", { pose: 'protection', envParticles: 'lluvia', bgColor: '#112', bloom: 2 }); Sfx.rain(5, 0.8); },
        "tornado": () => { cmd("Vientos giratorios destruyendo el paso.", { pose: 'falling', anim: 'tornado', envParticles: 'nieve', distortion: 3 }); Sfx.wind(5, 0.9); },
        "toxico": () => { updateStat('energy', -15); cmd("Gas venenoso alterando pulmones virtuales.", { pose: 'disjointed', aberration: 4, distortion: 2 }); },
        "trabajo": () => { updateStat('energy', -20); updateStat('happiness', -10); cmd("Labor repetitiva. Cansancio visible.", { pose: 'sit', filter: 'grayscale(50%)', envParticles: 'datos', aberration: 2 }); },
        "transmutacion": () => { cmd("Transformación alquímica completa.", { pose: 'overload', filter: 'hue-rotate(180deg) saturate(2)', shadowColor: '#ff0' }); Sfx.playChord([440, 554, 659, 880], 'sine', 2, 0.1); },
        "triste": () => { updateStat('happiness', -20); cmd("Bajón de ánimos generalizado.", { pose: 'sit', filter: 'grayscale(100%)', envParticles: 'lluvia' }); Sfx.rain(5, 0.4); },
        "tron": () => { cmd("Mundo de líneas y luces de neón azules.", { pose: 'pose', shadowColor: '#0ff', bgColor: '#000', aberration: 2, bgLayer: 'grid', bloom: 2 }); },
        "vacio": () => { cmd("Cero materia. Entorno purgado.", { pose: 'falling', alpha: 0, bgColor: '#000', bgLayer: 'void' }); Sfx.wind(5, 0.3); },
        "valhalla": () => { updateStat('happiness', 20); cmd("Sala de los caídos勇士. Gloria nórdica.", { pose: 'overload', shadowColor: '#ffd700', bloom: 3 }); Sfx.playChord([293, 369, 440, 587], 'sawtooth', 3, 0.08); },
        "vampiro": () => { updateStat('happiness', -10); cmd("Alergia al sol. Sed de sangre.", { pose: 'disjointed', shadowColor: '#f00' }); },
        "velocidad": () => { updateStat('energy', -10); cmd("Moviéndose más rápido que el fotograma.", { pose: 'running', anim: 'vibracion', distortion: 2 }); },
        "veneno": () => { updateStat('energy', -20); cmd("Daño letal recorriendo el cuerpo.", { pose: 'disjointed', distortion: 2 }); },
        "venom": () => { cmd("Traje negro vivo y agresivo.", { pose: 'overload', anim: 'glitch', scaleX: 1.5, scaleY: 1.5, distortion: 2 }); },
        "verano": () => { updateStat('happiness', 10); cmd("Época calurosa. Olas de temperatura altas.", { pose: 'sit', filter: 'saturate(200%) sepia(0.5)' }); },
        "vhs": () => { cmd("Cinta gastada de video reproduciendo.", { pose: 'pose', anim: 'glitch', aberration: 8 }); Sfx.noise(5, 0.1); },
        "viaje": () => { updateStat('happiness', 15); cmd("Destino desconocido. Explorando.", { pose: 'falling', anim: 'drift', envParticles: 'estrellas' }); Sfx.wind(5, 0.4); },
        "vibracion": () => { cmd("Temblores sin detenerse en el objeto.", { pose: 'worried', anim: 'vibracion' }); },
        "victoria": () => { updateStat('happiness', 50); cmd("¡GANASTE! Triunfo absoluto.", { pose: 'overload', anim: 'rebote', bloom: 4, filter: 'saturate(200%)' }); Sfx.playChord([523, 659, 784], 'sine', 2, 0.15); },
        "viernes": () => { updateStat('happiness', 25); cmd("Alivio fin de semana. Recuperación inminente.", { pose: 'happy', anim: 'rebote', bloom: 2, filter: 'saturate(150%)' }); },
        "viento": () => { cmd("Ráfagas fuertes empujando la imagen.", { pose: 'falling', envParticles: 'hojas', anim: 'drift' }); Sfx.wind(5, 0.7); },
        "vida": () => { updateStat('energy', 30); updateStat('happiness', 20); cmd("Regeneración de vida. Entorno sano.", { pose: 'meditating', envParticles: 'hojas', filter: 'saturate(150%)' }); Sfx.heartbeat(5, 0.5); },
        "vintage": () => { cmd("Estética retro de los 80s.", { pose: 'pose', filter: 'sepia(0.8) contrast(1.2) saturate(80%)' }); },
        "virus": () => { updateStat('energy', -20); cmd("Código malicioso propagándose.", { pose: 'disjointed', envParticles: 'datos', aberration: 4, anim: 'vibracion' }); Sfx.noise(5, 0.3); },
        "volcan": () => { cmd("Lava y ceniza amenazando el suelo.", { escenario: 'volcan', pose: 'protection', bgColor: '#200', bloom: 2 }); Sfx.fire(5, 0.8); },
        "warp": () => { cmd("Distorsión del espacio-tiempo.", { pose: 'falling', anim: 'glitch', distortion: 5, aberration: 8 }); Sfx.play(100, 'sawtooth', 3, 0.2, 50); },
        "xenomorfo": () => { cmd("Criatura alienígena hostil.", { pose: 'disjointed', scaleX: 1.3, scaleY: 0.7, shadowColor: '#0f0', aberration: 3 }); Sfx.noise(5, 0.4); },
        "yinyang": () => { cmd("Equilibrio perfecto de fuerzas.", { pose: 'meditating', scaleX: 1.2, shadowColor: '#fff', bloom: 2 }); Sfx.playChord([261, 392], 'sine', 3, 0.1); },
        "zen": () => { updateStat('happiness', 15); updateStat('energy', 15); cmd("Iluminación espiritual alcanzada.", { pose: 'meditating', anim: 'none', filter: 'sepia(0.3)', shadowColor: '#0f0' }); Sfx.playChord([220, 277, 330, 440], 'sine', 5, 0.05); },
        "zombie": () => { updateStat('energy', -20); cmd("Sin mente. Caminante reanimado.", { pose: 'disjointed', distortion: 1 }); },
        "zzz": () => { updateStat('energy', 10); cmd("Descansando para recuperar energía.", { pose: 'collapsed', anim: 'flotar' }); Sfx.wind(5, 0.1); },

        // --- ESCENARIOS ---
        "ciudad": () => { cmd("Cambiando a escenario urbano nocturno.", { escenario: 'ciudad', bgColor: '#1a1a2e' }); },
        "playa": () => { cmd("Cambiando a escenario de playa al atardecer.", { escenario: 'playa', bgColor: '#1e3c72' }); },
        "espacio": () => { cmd("Cambiando a escenario del espacio profundo.", { escenario: 'espacio', bgColor: '#0a0a1a' }); },
        "dojo": () => { cmd("Cambiando a dojo tradicional.", { escenario: 'dojo', bgColor: '#2c1810' }); },
        "laboratorio": () => { cmd("Cambiando a laboratorio científico.", { escenario: 'laboratorio', bgColor: '#1a1a2e' }); },
        "templo": () => { cmd("Cambiando a templo místico.", { escenario: 'templo', bgColor: '#2d1b4e' }); },
        "submarino": () => { cmd("Cambiando a paisaje submarino.", { escenario: 'submarino', bgColor: '#006994' }); },
        "volcanico": () => { cmd("Cambiando a zona volcánica activa.", { escenario: 'volcan', bgColor: '#200' }); },
        "nevado": () => { cmd("Cambiando a paisaje invernal.", { escenario: 'nieve', bgColor: '#eee' }); },

        // --- ESTADOS Y ACCIONES EXTRA ---
        "cansado": () => { cmd("Nivel de energía bajo.", { pose: 'collapsed', anim: 'balanceo' }); Sfx.play(100, 'sine', 2, 0.1); },
        "estresado": () => { updateStat('happiness', -10); cmd("Acumulación de estrés laboral.", { pose: 'sit', filter: 'grayscale(50%)', anim: 'balanceo' }); },
        "sorprendido": () => { cmd("Rebote de sorpresa.", { pose: 'falling', anim: 'rebote', scaleX: 1.3, scaleY: 1.3 }); Sfx.play(600, 'sine', 0.3, 0.2); },
        "confundido": () => { cmd("Procesamiento de información conflictiva.", { pose: 'worried', anim: 'sacudir' }); },
        "nervioso": () => { updateStat('happiness', -5); cmd("Ansiedad social detectada.", { pose: 'worried', anim: 'vibracion' }); Sfx.play(150, 'sine', 0.1, 0.1); },
        "hambriento": () => { cmd("Nivel de glucosa bajo.", { pose: 'squat', scaleX: 1.1, scaleY: 1.1 }); },
        "sediento": () => { cmd("Necesidad de hidratación.", { pose: 'worried' }); },
        "mareado": () => { updateStat('energy', -5); cmd("Vértigo detectado.", { pose: 'disjointed', anim: 'reloj', scaleX: 1.2 }); },
        "volar": () => { updateStat('energy', -10); cmd("Levitación activada.", { pose: 'falling', anim: 'flotar' }); },
        "nadar": () => { updateStat('energy', -10); cmd("Adaptación acuática.", { pose: 'falling', anim: 'flotar', distortion: 1 }); Sfx.noise(5, 0.1, 'lowpass', 400); },
        "luchar": () => { updateStat('energy', -20); cmd("Postura de combate.", { pose: 'fight', shadowColor: '#f00' }); Sfx.play(100, 'sawtooth', 0.5, 0.2); },
        "rezar": () => { updateStat('happiness', 10); cmd("Comunicación espiritual.", { pose: 'meditating', shadowColor: '#fff', envParticles: 'estrellas' }); Sfx.playChord([220, 277, 330], 'sine', 3, 0.06); },
        "reir": () => { updateStat('happiness', 20); cmd("Reacción de alegría detectada.", { pose: 'happy', anim: 'sacudir' }); Sfx.play(600, 'sine', 0.1, 0.1, 700); },
        "abrazar": () => { updateStat('happiness', 25); cmd("Contacto reconfortante.", { pose: 'happy', overlay: 'rgba(255,255,255,0.2)', bloom: 1 }); Sfx.play(400, 'sine', 0.3, 0.1); },
        "escapar": () => { updateStat('energy', -15); cmd("Modo de huida activado.", { pose: 'running', anim: 'drift', scaleX: 1.3 }); Sfx.play(800, 'square', 0.3, 0.1); },
        "esconderse": () => { cmd("Capa de camuflaje.", { pose: 'secret', alpha: 0.3 }); },
        "olvidar": () => { cmd("Memoria borrada.", { pose: 'subject', filter: 'blur(5px)' }); },
        "recordar": () => { cmd("Recuperación de memoria.", { pose: 'meditating', filter: 'sepia(0.5)' }); Sfx.play(400, 'sine', 1, 0.1); },
        "banarse": () => { updateStat('happiness', 10); cmd("Protocolo de limpieza.", { pose: 'lying', overlay: 'rgba(0,150,255,0.3)' }); Sfx.noise(3, 0.1, 'lowpass', 500); },
        "vestirse": () => { cmd("Equipamiento completado.", { pose: 'subject' }); },
        "estudiar": () => { updateStat('energy', -15); cmd("Carga académica.", { pose: 'meditating', filter: 'contrast(1.2)' }); Sfx.play(200, 'sine', 0.5, 0.05); },
        "leer": () => { updateStat('happiness', 5); cmd("Procesamiento de texto.", { pose: 'meditating' }); },
        "escribir": () => { updateStat('energy', -5); cmd("Generación de texto.", { pose: 'sit', envParticles: 'datos' }); },
        "cocinar": () => { updateStat('hunger', 5); cmd("Cocción activa.", { pose: 'squat', overlay: 'rgba(255,100,0,0.3)' }); Sfx.fire(3, 0.3); },
        "limpiar": () => { updateStat('energy', -10); cmd("Protocolo de limpieza.", { pose: 'squat' }); },
        "cantar": () => { updateStat('happiness', 15); cmd("Vocalización activa.", { pose: 'happy', anim: 'vibracion' }); Sfx.play(400, 'sine', 1, 0.2); },
        "llover": () => { cmd("Precipitación detectada.", { pose: 'sit', envParticles: 'lluvia' }); Sfx.rain(5, 0.6); },
        "nevar": () => { cmd("Nevada activa.", { pose: 'protection', envParticles: 'nieve' }); Sfx.wind(5, 0.4); },
        "amanecer": () => { updateStat('happiness', 10); cmd("Inicio del día.", { pose: 'meditating', bgColor: '#ff7e5f', filter: 'saturate(150%)' }); Sfx.play(440, 'sine', 2, 0.1); },
        "medianoche": () => { cmd("Punto más oscuro del día.", { pose: 'secret', bgColor: '#000' }); },
        "estrella": () => { cmd("Astros visibles.", { pose: 'meditating', envParticles: 'estrellas', bgLayer: 'void' }); },
        "nube": () => { cmd("Entorno nuboso.", { pose: 'subject', envParticles: 'nieve' }); },
        "trueno": () => { cmd("Rayo detectado.", { pose: 'overload', bloom: 5 }); Sfx.thunder(3); },
        "mar": () => { updateStat('happiness', 10); cmd("Entorno oceánico.", { pose: 'falling', anim: 'flotar', envParticles: 'lluvia' }); Sfx.noise(5, 0.15, 'lowpass', 300); },
        "carro": () => { cmd("Vehículo en marcha.", { pose: 'running', anim: 'drift' }); Sfx.noise(3, 0.2); },
        "avion": () => { cmd("Despegue vertical.", { pose: 'falling', anim: 'flotar', envParticles: 'nieve' }); Sfx.play(200, 'square', 2, 0.2); },
        "tren": () => { cmd("Desplazamiento sobre rieles.", { pose: 'running', anim: 'drift' }); Sfx.play(100, 'sawtooth', 3, 0.2); },
        "barco": () => { cmd("Navegación marina.", { pose: 'falling', anim: 'flotar' }); Sfx.noise(5, 0.15, 'lowpass', 300); },
        "bicicleta": () => { updateStat('energy', -10); cmd("Transporte ecológico.", { pose: 'running', anim: 'rebote' }); },
        "amigos": () => { updateStat('happiness', 30); cmd("Vínculo social activo.", { pose: 'happy', clones: 2 }); Sfx.playChord([392, 494, 587], 'sine', 2, 0.1); },
        "familia": () => { updateStat('happiness', 40); cmd("Núcleo familiar.", { pose: 'happy', clones: 2, shadowColor: '#ffd700' }); },
        "pareja": () => { updateStat('happiness', 50); cmd("Relación activa.", { pose: 'happy', anim: 'latido' }); Sfx.heartbeat(5, 0.5); },
        "soledad": () => { updateStat('happiness', -30); cmd("Aislamiento detectado.", { pose: 'collapsed', filter: 'grayscale(100%)' }); },
        "amistad": () => { updateStat('happiness', 20); cmd("Vínculo positivo.", { pose: 'happy', bloom: 1 }); Sfx.play(400, 'sine', 1, 0.1); },
        "traicion": () => { updateStat('happiness', -50); cmd("Fallo de confianza.", { pose: 'disjointed', filter: 'invert(100%)', shadowColor: '#f00' }); Sfx.play(80, 'sawtooth', 2, 0.3); },
        "perdon": () => { updateStat('happiness', 20); cmd("Reconciliación.", { pose: 'meditating', filter: 'brightness(1.2)' }); Sfx.playChord([261, 329, 392], 'sine', 2, 0.08); },
        "terror": () => { updateStat('happiness', -30); cmd("Pánico activo.", { pose: 'disjointed', bgColor: '#100', anim: 'terremoto', aberration: 8 }); Sfx.play(50, 'sawtooth', 5, 0.4); },
        "alivio": () => { updateStat('happiness', 15); cmd("Reducción de estrés.", { pose: 'meditating', filter: 'brightness(1.2)' }); Sfx.play(600, 'sine', 1, 0.1); },
        "esperanza": () => { updateStat('happiness', 20); cmd("Optimismo activado.", { pose: 'happy', envParticles: 'estrellas' }); Sfx.playChord([392, 494, 587], 'sine', 3, 0.1); },
        "dolor": () => { updateStat('energy', -10); updateStat('happiness', -20); cmd("Receptor de dolor activo.", { pose: 'disjointed', overlay: 'rgba(120,0,0,0.3)', anim: 'vibracion' }); },
        "sanacion": () => { updateStat('energy', 20); updateStat('happiness', 10); cmd("Regeneración de tejidos.", { pose: 'meditating', filter: 'brightness(1.5) saturate(150%)', bloom: 2 }); Sfx.heartbeat(3, 0.4); },
        "navidad": () => { updateStat('happiness', 30); cmd("Espíritu navideño.", { pose: 'happy', envParticles: 'nieve', shadowColor: '#ff0000', bloom: 2 }); Sfx.playChord([392, 494, 587, 740], 'sine', 3, 0.1); },
        "halloween": () => { updateStat('happiness', 15); cmd("Noche de brujas.", { pose: 'disjointed', filter: 'sepia(1) hue-rotate(180deg)', shadowColor: '#ff6600' }); Sfx.play(80, 'sawtooth', 3, 0.3); },
        "anio nuevo": () => { updateStat('happiness', 40); cmd("Celebración de año nuevo.", { pose: 'happy', anim: 'rebote', bloom: 3, envParticles: 'estrellas' }); Sfx.playChord([523, 659, 784, 1047], 'sine', 3, 0.15); },
        "san valentin": () => { updateStat('happiness', 40); cmd("Día del amor.", { pose: 'happy', filter: 'hue-rotate(330deg) saturate(200%)', envParticles: 'estrellas' }); Sfx.heartbeat(5, 0.5); },
        "futuro": () => { cmd("Proyección temporal.", { pose: 'falling', envParticles: 'datos' }); },
        "pasado": () => { cmd("Memoria retrospectiva.", { pose: 'lying', filter: 'sepia(0.8) blur(1px)' }); },
        "presente": () => { cmd("Momento actual.", { pose: 'subject' }); },
        "eternidad": () => { cmd("Tiempo infinito.", { pose: 'meditating', anim: 'reloj', shadowColor: '#ffd700', bloom: 3 }); Sfx.playChord([196, 246, 294, 392], 'sine', 5, 0.08); },
        "pobreza": () => { updateStat('happiness', -20); cmd("Recursos limitados.", { pose: 'collapsed', filter: 'grayscale(100%)' }); },
        "lujo": () => { updateStat('happiness', 20); cmd("Modo de opulencia.", { pose: 'overload', shadowColor: '#ffd700', bloom: 3, clones: 2 }); },
        "comprar": () => { updateStat('happiness', 10); cmd("Transacción completada.", { pose: 'happy', anim: 'rebote' }); Sfx.play(600, 'sine', 0.2, 0.1); },
        "vender": () => { updateStat('energy', -5); cmd("Comercio activo.", { pose: 'running' }); },
        "demencia": () => { updateStat('happiness', -10); cmd("Pérdida de coherencia.", { pose: 'disjointed', anim: 'caos', aberration: 8, distortion: 4 }); Sfx.noise(5, 0.5); },
        "esquizofrenia": () => { cmd("Dualidad de percepciones.", { pose: 'disjointed', clones: 2, anim: 'caos' }); Sfx.play(200, 'square', 3, 0.2); },
        "depresion": () => { updateStat('happiness', -40); updateStat('energy', -20); cmd("Estado emocional bajo.", { pose: 'collapsed', filter: 'grayscale(100%)', envParticles: 'lluvia' }); Sfx.noise(3, 0.2); },
        "maniaco": () => { updateStat('happiness', 20); updateStat('energy', -30); cmd("Estado hiperexcitable.", { pose: 'overload', anim: 'caos', filter: 'saturate(200%)' }); Sfx.play(400, 'square', 3, 0.3); },
        "psicosis": () => { updateStat('happiness', -20); cmd("Ruptura con la realidad.", { pose: 'disjointed', anim: 'terremoto', aberration: 10, distortion: 5 }); Sfx.noise(5, 0.6); },
        "fuego": () => { updateStat('happiness', -20); cmd("Peligro térmico. Combustión activa.", { pose: 'worried', particles: 'fuego', anim: 'caos' }); Sfx.fire(5, 0.6); },

    };
};

export const checkCombos = (words: string[], logEl: HTMLElement): string | null => {
    const cmd = (msg: string, mod: Record<string, unknown>, dur: number = 5000): void => executeCmd(msg, mod as Parameters<typeof executeCmd>[1], logEl, dur);
    const has = (w1: string, w2: string): boolean => words.includes(w1) && words.includes(w2);

    // --- SINERGIAS ---
    if (has('gato', 'caja') || has('gato', 'esconderse')) {
        cmd("SINERGIA: Paradoja de Schrödinger. ¿Vivo o muerto?", { pose: 'secret', alpha: 0.5, anim: 'glitch' });
        return 'combo_schrodinger';
    }
    if (has('cafe', 'programar') || has('cafe', 'computadora') || has('cafe', 'teclado')) {
        updateStat('energy', 30);
        cmd("SINERGIA: Developer Mode. Productividad al 1000%.", { pose: 'running', envParticles: 'datos', speed: 2, bloom: 2 });
        return 'combo_dev';
    }
    if (has('lluvia', 'triste') || has('lluvia', 'llorar')) {
        updateStat('happiness', -20);
        cmd("SINERGIA: Melancolía Profunda. Ambiente Noir.", { pose: 'sit', filter: 'grayscale(100%) contrast(1.5)', envParticles: 'lluvia' });
        return 'combo_noir';
    }
    if (has('fuego', 'hielo') || has('calor', 'frio')) {
        cmd("SINERGIA: Choque Térmico. Inestabilidad elemental.", { pose: 'worried', particles: 'humo', anim: 'vibracion' });
        return 'combo_thermal';
    }
    if (has('musica', 'bailar') || has('fiesta', 'bailar')) {
        updateStat('happiness', 40);
        cmd("SINERGIA: Fiesta Privada. Ritmo imparable.", { pose: 'happy', anim: 'sacudir', bloom: 3, filter: 'hue-rotate(90deg)' });
        return 'combo_party';
    }
    if (has('sol', 'luna') || has('dia', 'noche')) {
        cmd("SINERGIA: Eclipse Total. Oscuridad mística.", { pose: 'meditating', bgColor: '#000', shadowColor: '#fff', bloom: 4 });
        return 'combo_eclipse';
    }
    if (has('fuego', 'agua') || has('calor', 'agua')) {
        cmd("SINERGIA: Vaporización Instantánea.", { pose: 'secret', particles: 'humo', filter: 'blur(3px)', anim: 'flotar' });
        return 'combo_vapor';
    }
    if (has('tierra', 'agua') || has('lluvia', 'tierra')) {
        cmd("SINERGIA: Pantano Primordial.", { pose: 'squat', bgColor: '#321', anim: 'gelatina' });
        return 'combo_swamp';
    }
    if (has('fantasma', 'miedo') || has('espectro', 'miedo')) {
        updateStat('happiness', -30);
        cmd("SINERGIA: Pesadilla Viviente.", { pose: 'disjointed', aberration: 5, distortion: 3, bgColor: '#000' });
        return 'combo_nightmare';
    }
    if (has('pizza', 'tortuga')) {
        updateStat('happiness', 50);
        cmd("SINERGIA: Cowabunga!", { pose: 'fight', shadowColor: '#0f0', scaleX: 1.2, scaleY: 1.2 });
        Sfx.play(600, 'square', 0.5, 0.1);
        return 'combo_tmnt';
    }
    if (has('fuego', 'tornado') || has('fuego', 'huracan')) {
        cmd("SINERGIA: Tormenta Ígnea. Destrucción total.", { pose: 'overload', anim: 'tornado', scaleX: 2, bloom: 5, distortion: 4, particles: 'fuego' });
        Sfx.fire(5, 0.9);
        Sfx.wind(5, 0.8);
        return 'combo_fire_storm';
    }
    if (has('agua', 'electrico') || has('agua', 'pikachu') || has('lluvia', 'electrico')) {
        updateStat('energy', -40);
        cmd("SINERGIA: Electrocución Masiva. Daño crítico.", { pose: 'disjointed', particles: 'rayos', anim: 'vibracion', bloom: 4, aberration: 5 });
        Sfx.noise(3, 0.8);
        return 'combo_electro_shock';
    }
    if (has('angel', 'demonio') || has('dios', 'diablo')) {
        cmd("SINERGIA: Apocalipsis Bíblico. El fin.", { pose: 'overload', anim: 'terremoto', bgColor: '#500', bloom: 10, distortion: 10 });
        Sfx.playChord([100, 666], 'sawtooth', 5, 0.5);
        return 'combo_armageddon';
    }

    return null;
};
