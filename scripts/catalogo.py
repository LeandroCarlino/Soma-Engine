import json
import re

from pathlib import Path

RAIZ = Path(__file__).resolve().parent.parent
ORIGEN = RAIZ / "src" / "diccionario.ts"
DESTINO = RAIZ / "src" / "lib" / "catalogo.ts"

s = open(ORIGEN, encoding="utf-8").read()

SECCIONES = [
    ("INTERACCIONES TAMAGOTCHI (Stats)", "cuidado", "Cuidado", "Comer, dormir, jugar y mantener a SOMA."),
    ("PALABRAS PARA SINERGIAS", "sinergias", "Sinergias", "Palabras que se combinan con otras."),
    ("COTIDIANOS Y COMUNES", "cotidiano", "Cotidiano", "Cosas y acciones del día a día."),
    ("ELEMENTOS Y FANTASIA", "elementos", "Elementos y fantasía", "Fuego, agua, magia y criaturas."),
    ("CONCEPTOS Y OBJETOS", "conceptos", "Conceptos y objetos", "Ideas, objetos y abstracciones."),
    ("MAS PALABRAS (EXPANSION)", "expansion", "Expansión", "Más vocabulario para explorar."),
    ("ARMAS Y COMBATE", "combate", "Armas y combate", "Ataques, defensas y enfrentamientos."),
    ("MUSICA Y RITMO", "musica", "Música y ritmo", "Sonido, baile e instrumentos."),
    ("CONCEPTOS AVANZADOS", "avanzado", "Conceptos avanzados", "Ideas complejas y estados mentales."),
    ("ESTADOS III", "estados", "Estados", "Estados de ánimo y del cuerpo."),
    ("ALFABETO A-Z ORIGINAL (RESTAURADO)", "alfabeto", "Vocabulario A–Z", "El diccionario base, ordenado de la A a la Z."),
    ("ESCENARIOS", "escenarios", "Escenarios", "Lugares a los que SOMA puede viajar."),
    ("ESTADOS Y ACCIONES EXTRA", "extra", "Estados y acciones", "Reacciones y acciones adicionales."),
    ("EXPANSION FASE 2", "fase2", "Expansión Fase 2", "Nuevos comandos, animaciones y variantes de Hikaru."),
]

MAPA_SECCION = {nombre: (cid, nombre_ui, desc) for nombre, cid, nombre_ui, desc in SECCIONES}

CATEGORIAS_EXTRA = [("__sistema__", "sistema", "Sistema", "Comandos de la interfaz y la terminal.")]
TODAS_LAS_CATEGORIAS = SECCIONES + CATEGORIAS_EXTRA


def categoria_de(pos):
    actual = "ALFABETO A-Z ORIGINAL (RESTAURADO)"
    for m in re.finditer(r"^\s*//\s*---\s*(.+?)\s*---\s*$", s, re.M):
        if m.start() <= pos:
            actual = m.group(1)
        else:
            break
    return MAPA_SECCION.get(actual, ("alfabeto", "Vocabulario A–Z", "El diccionario base."))


patron = re.compile(r'^\s*"([^"]+)":\s*\(\)\s*=>\s*\{', re.M)
claves = list(patron.finditer(s))

SINONIMOS = {
    # Cuidado
    "comer": ["alimentar", "comida", "hambre", "nutrir"],
    "alimentar": ["comer", "comida", "hambre"],
    "dormir": ["descansar", "sueno", "dormido", "cama"],
    "descansar": ["dormir", "pausa", "cansado"],
    "jugar": ["juego", "diversion", "juguete"],
    "caricia": ["acariciar", "mimos", "carino"],
    "cafe": ["cafeina", "estimulante", "despertar"],
    # Emociones
    "feliz": ["felicidad", "alegria", "contento", "sonreir"],
    "triste": ["tristeza", "llorar", "melancolia"],
    "enojado": ["enojo", "furia", "ira", "enojada"],
    "amor": ["enamorado", "carino", "romance"],
    "miedo": ["asustado", "terror", "panico"],
    "calma": ["relax", "tranquilo", "paz"],
    "ansioso": ["ansiedad", "nervios", "nervioso"],
    "aburrido": ["aburrimiento", "harto"],
    "celoso": ["celos"],
    "orgulloso": ["orgullo"],
    "avergonzado": ["verguenza", "pena"],
    "sorpresa": ["sorprendido", "asombro"],
    "confundido": ["confusion", "duda"],
    # Elementos
    "fuego": ["llama", "incendio", "quemar", "calor"],
    "agua": ["mojar", "liquido", "lluvia"],
    "tierra": ["suelo", "barro", "planeta"],
    "aire": ["viento", "brisa", "respirar"],
    "hielo": ["frio", "congelar", "escarcha"],
    "rayo": ["relampago", "electrico", "tormenta"],
    "tornado": ["torbellino", "viento", "ciclone"],
    "volcan": ["erupcion", "lava", "magma"],
    "bosque": ["arboles", "naturaleza", "selva"],
    "mar": ["oceano", "playa", "agua"],
    "sol": ["estrella", "dia", "luz"],
    "luna": ["noche", "satelite"],
    # Acciones
    "correr": ["carrera", "velocidad", "escapar"],
    "saltar": ["salto", "brincar"],
    "bailar": ["baile", "danza", "ritmo"],
    "cantar": ["canto", "musica", "voz"],
    "volar": ["vuelo", "flotar", "alas"],
    "nadar": ["natacion", "agua"],
    "pelear": ["lucha", "combate", "golpear"],
    "gritar": ["grito", "alarido"],
    "llorar": ["llanto", "triste"],
    "reir": ["risa", "carcajada", "feliz"],
    "comprar": ["dinero", "tienda"],
    "trabajar": ["trabajo", "oficina", "empleo"],
    "estudiar": ["escuela", "aprender", "libro"],
    "programar": ["codigo", "computadora", "developer"],
    # Escenarios
    "ciudad": ["urbano", "calle", "edificios"],
    "playa": ["mar", "arena", "costa"],
    "espacio": ["galaxia", "estrellas", "cosmos"],
    "dojo": ["karate", "entrenar", "artes marciales"],
    "laboratorio": ["ciencia", "experimento"],
    "templo": ["meditar", "espiritual", "santuario"],
    "submarino": ["oceano", "profundo", "bajo el agua"],
    "nieve": ["frio", "invierno", "copos"],
    # Sistema / meta
    "desnudo": ["desvestir", "sin ropa"],
    "interactivo": ["puntero", "mouse", "control manual"],
    "normal": ["restaurar", "base", "reiniciar"],
    "reset": ["reiniciar", "limpiar", "resetear"],
    "sexo": ["nsfw", "adulto", "censurado"],
    # Fase 2
    "ternura": ["carino", "afecto", "suave"],
    "ansiedad": ["nervios", "angustia", "panic"],
    "calma": ["relax", "paz", "tranquilidad"],
    "duelo": ["luto", "pena", "perdida"],
    "cuervo": ["pajaro", "negro", "augurio"],
    "ballena": ["oceano", "gigante", "marina"],
    "kraken": ["pulpo", "monstruo", "abismo"],
    "unicornio": ["magia", "fantasia", "mitico"],
    "chocolate": ["dulce", "cacao"],
    "vino": ["copa", "alcohol", "uva"],
    "aurora": ["cielo", "luces", "boreal"],
    "eclipse": ["sol", "luna", "oscuridad"],
    "codigo": ["programa", "software", "dev"],
    "android": ["robot", "maquina", "ia"],
    "memoria": ["recuerdo", "recordar", "mente"],
    "orden": ["equilibrio", "control", "disciplina"],
    "realidad": ["verdad", "mundo", "existir"],
    "ficcion": ["fantasia", "invento", "relato"],
    "alma": ["espiritu", "esencia", "interior"],
    "espiritu": ["alma", "fantasma", "etereo"],
    "abrazo": ["abrazar", "mimos", "afecto"],
    "susurro": ["secreto", "silencio", "voz baja"],
    "dimension": ["portal", "universo", "plano"],
    "origen": ["comienzo", "inicio", "nacimiento"],
    "destino": ["futuro", "sino", "camino"],
    "suerte": ["azar", "fortuna", "loteria"],
    "llanto": ["llorar", "lagrimas", "pena"],
    "yo": ["identidad", "ego", "self", "reflejo"],
    "humano": ["persona", "humanidad"],
    "estela": ["huella", "rastro", "cometa"],
    "zoom": ["acercar", "primer plano", "lente"],
    "termica": ["calor", "camara", "infrarrojo"],
    "primer plano": ["zoom", "closeup", "cara"],
    "multiplicidad": ["clones", "copias", "varios"],
    "marea": ["ola", "mar", "subida"],
    "glaciar": ["hielo", "frio", "montana"],
    "meteorito": ["asteroide", "espacio", "impacto"],
    "constelacion": ["estrellas", "cielo", "galaxia"],
    "laberinto": ["confusion", "camino", "paredes"],
    "umbral": ["puerta", "limite", "entrada"],
    "caminar": ["andar", "paso", "caminata"],
    "girar": ["rotar", "giro", "rotacion"],
    "orbitar": ["orbita", "girar", "alrededor"],
    "espiral": ["helice", "remolino", "vortice"],
    "derretir": ["derretido", "fundir", "liquido"],
    "espejo": ["reflejo", "duplicado", "yo"],
    "holograma": ["holografico", "proyeccion", "luz"],
    "silueta": ["sombra", "contorno", "negro"],
}

SIN_CUERPO = {
    "desnudo": "Quita la ropa del sujeto.",
    "interactivo": "Activa o desactiva el control manual con el puntero.",
    "normal": "Restaura el estado base de SOMA.",
    "reset": "Reinicia el entorno y los efectos.",
    "sexo": "Activa la interacción NSFW censurada.",
}

TAGS_INTERES = ("pose", "anim", "particles", "envParticles", "escenario", "bgLayer", "filter", "tint", "fx")


def limpiar_texto(texto):
    texto = texto.replace('\\"', '"').replace("\\n", " ").replace("\\t", " ")
    texto = re.sub(r"\s+", " ", texto).strip()
    if len(texto) > 150:
        texto = texto[:147].rstrip() + "…"
    return texto


entradas = []
for i, m in enumerate(claves):
    clave = m.group(1)
    inicio = m.end()
    fin = claves[i + 1].start() if i + 1 < len(claves) else len(s)
    cuerpo = s[inicio:fin]

    cid, nombre_ui, _desc_cat = categoria_de(m.start())

    mensajes = re.findall(r'cmd\("((?:\\.|[^"\\])*)"', cuerpo)
    if mensajes:
        descripcion = limpiar_texto(mensajes[0])
    else:
        descripcion = SIN_CUERPO.get(clave, f"Comando de {nombre_ui.lower()}.")

    tags = [cid]
    for campo in TAGS_INTERES:
        encontrado = re.search(rf"{campo}:\s*'([^']+)'", cuerpo)
        if encontrado and encontrado.group(1) not in ("none", ""):
            tags.append(f"{campo}:{encontrado.group(1)}")
    if "updateStat(" in cuerpo:
        tags.append("stats")
    if "Sfx." in cuerpo:
        tags.append("audio")
    if "resetState" in cuerpo:
        tags.append("reset")

    entradas.append({
        "id": clave,
        "categoria": cid,
        "descripcion": descripcion,
        "sinonimos": SINONIMOS.get(clave, []),
        "tags": tags,
    })

# Comprobaciones
ids = [e["id"] for e in entradas]
assert len(ids) == len(set(ids)), "hay ids duplicados"
faltan = [k for k in SINONIMOS if k not in set(ids)]
print("entradas:", len(entradas))
print("sinónimos huérfanos:", faltan)

lineas = []
lineas.append("/**")
lineas.append(" * Catálogo de comandos generado a partir de src/diccionario.ts.")
lineas.append(" * No reemplaza los efectos: agrega categoría, descripción, sinónimos y tags")
lineas.append(" * para ayuda, búsqueda y sugerencias. Regenerar con scripts/catalogo.py.")
lineas.append(" */")
lineas.append("")
lineas.append("export type Categoria =")
lineas.append("  | " + "\n  | ".join(json.dumps(c[1]) for c in TODAS_LAS_CATEGORIAS) + ";")
lineas.append("")
lineas.append("export interface EntradaCatalogo {")
lineas.append("  id: string;")
lineas.append("  categoria: Categoria;")
lineas.append("  descripcion: string;")
lineas.append("  sinonimos: string[];")
lineas.append("  tags: string[];")
lineas.append("}")
lineas.append("")
lineas.append("export interface DatosCategoria {")
lineas.append("  nombre: string;")
lineas.append("  descripcion: string;")
lineas.append("}")
lineas.append("")
lineas.append("export const CATEGORIAS: Record<Categoria, DatosCategoria> = {")
for _nombre, cid, nombre_ui, desc in TODAS_LAS_CATEGORIAS:
    lineas.append(f"  {json.dumps(cid)}: {{ nombre: {json.dumps(nombre_ui, ensure_ascii=False)}, descripcion: {json.dumps(desc, ensure_ascii=False)} }},")
lineas.append("};")
lineas.append("")
lineas.append("export const CATALOGO: Record<string, EntradaCatalogo> = {")
for e in entradas:
    lineas.append("  " + json.dumps(e["id"], ensure_ascii=False) + ": {")
    lineas.append("    id: " + json.dumps(e["id"], ensure_ascii=False) + ",")
    lineas.append("    categoria: " + json.dumps(e["categoria"]) + ",")
    lineas.append("    descripcion: " + json.dumps(e["descripcion"], ensure_ascii=False) + ",")
    lineas.append("    sinonimos: " + json.dumps(e["sinonimos"], ensure_ascii=False) + ",")
    lineas.append("    tags: " + json.dumps(e["tags"], ensure_ascii=False) + ",")
    lineas.append("  },")
lineas.append("};")
lineas.append("")
lineas.append("/** Comandos que no viven en el diccionario y se manejan en main.ts. */")
lineas.append("export const META_COMANDOS: EntradaCatalogo[] = [")
meta = [
    ("comandos", "sistema", "Lista las categorías del diccionario y los comandos del sistema.", ["ayuda", "help", "lista", "?"], ["sistema", "ayuda"]),
    ("buscar", "sistema", "Busca comandos por nombre, sinónimo, descripción o categoría. Uso: buscar fuego.", ["find", "filtrar"], ["sistema", "busqueda"]),
    ("capturar", "sistema", "Descarga una imagen PNG de la escena actual con marco y datos.", ["foto", "screenshot", "captura", "imagen"], ["sistema", "captura"]),
    ("panel", "sistema", "Abre el panel de control con temas, métricas y diccionario.", ["menu", "ajustes", "configuracion"], ["sistema", "panel"]),
]
for cid, cat, desc, sins, tags in meta:
    lineas.append("  {")
    lineas.append(f"    id: {json.dumps(cid)},")
    lineas.append(f"    categoria: {json.dumps(cat)},")
    lineas.append(f"    descripcion: {json.dumps(desc, ensure_ascii=False)},")
    lineas.append(f"    sinonimos: {json.dumps(sins, ensure_ascii=False)},")
    lineas.append(f"    tags: {json.dumps(tags, ensure_ascii=False)},")
    lineas.append("  },")
lineas.append("];")
lineas.append("")

open(DESTINO, "w", encoding="utf-8", newline="\n").write("\n".join(lineas))
print("escrito:", DESTINO)
