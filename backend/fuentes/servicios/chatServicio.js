import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import config from '../configuracion/index.js'; // Importar la configuración

// Obtener __dirname en ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 📂 CONFIGURACIÓN DEL CHATBOT (ahora desde config/index.js)
const OLLAMA_MODEL = config.OLLAMA_MODEL;
const DOCS_SOURCE_DIR = config.DOCS_SOURCE_DIR;
const CHUNKS_DIR = config.CHUNKS_DIR;
const CHUNK_SIZE = 1000; // Define un tamaño de chunk predeterminado si no está en config
const CHUNK_OVERLAP = 200; // Define un solapamiento predeterminado si no está en config

// Variables globales para el estado del chatbot
let documentosChunks = new Map();
let estaProcesando = false;
let ultimaActualizacion = null;
const cache = new Map(); // Caché para respuestas de la IA
let invertedIndex = new Map(); // Índice invertido para búsqueda de texto

// Importación estática de pdf-parse
let pdfParse;
try {
  const pdfModule = await import('pdf-parse');
  pdfParse = pdfModule.default;
  console.log('✅ pdf-parse cargado correctamente para chatServicio');
} catch (error) {
  console.log('❌ pdf-parse no disponible en chatServicio. Usando fallback...');
  pdfParse = null;
}

// FUNCIÓN DE LIMPIEZA DE TEXTO
function limpiarTexto(texto) {
  if (!texto) return '';
  
  return texto
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .replace(/[ \t]+/g, ' ')
    .replace(/[^\w\sáéíóúÁÉÍÓÚñÑ.,!?;:()\-–—°"\/+\s#$%&*=\[\]{}<>|\\\n]/g, '')
    .replace(/ *\n */g, '\n')
    .trim();
}

// CHUNKING INTELIGENTE
function dividirEnChunksInteligentes(texto, chunkSize = CHUNK_SIZE, overlap = CHUNK_OVERLAP) {
  if (!texto || texto.trim().length === 0) return [];
  
  const textoLimpio = limpiarTexto(texto);
  if (textoLimpio.length <= chunkSize) return [textoLimpio];
  
  const chunks = [];
  const parrafos = textoLimpio.split(/\n\s*\n/).filter(p => p.trim().length > 0);
  
  let chunkActual = '';
  
  for (const parrafo of parrafos) {
    const parrafoLimpio = parrafo.trim();
    
    if (parrafoLimpio.length > chunkSize) {
      const oraciones = parrafoLimpio.split(/(?<=[.!?])\s+/).filter(o => o.length > 0);
      
      for (const oracion of oraciones) {
        if ((chunkActual + ' ' + oracion).length <= chunkSize) {
          chunkActual += (chunkActual ? ' ' : '') + oracion;
        } else {
          if (chunkActual.length >= chunkSize * 0.3) {
            chunks.push(chunkActual);
            if (overlap > 0) {
              const palabras = chunkActual.split(' ');
              const overlapText = palabras.slice(-Math.floor(overlap / 10)).join(' ');
              chunkActual = overlapText + ' ' + oracion;
            } else {
              chunkActual = oracion;
            }
          } else {
            chunkActual = oracion;
          }
        }
      }
    } else {
      if ((chunkActual + '\n\n' + parrafoLimpio).length <= chunkSize) {
        chunkActual += (chunkActual ? '\n\n' : '') + parrafoLimpio;
      } else {
        if (chunkActual.length >= chunkSize * 0.3) {
          chunks.push(chunkActual);
          chunkActual = parrafoLimpio;
        } else {
          chunkActual = parrafoLimpio;
        }
      }
    }
  }
  
  if (chunkActual.length >= chunkSize * 0.3) {
    chunks.push(chunkActual);
  }
  
  console.log(`   📝 Generados ${chunks.length} chunks inteligentes`);
  return chunks.filter(chunk => chunk.length > 50);
}

// Extracción de PDF robusta
async function extraerTextoDePDF(rutaPDF) {
  try {
    console.log(`   📄 Procesando PDF: ${path.basename(rutaPDF)}`);
    
    if (pdfParse) {
      try {
        const dataBuffer = fs.readFileSync(rutaPDF);
        const data = await pdfParse(dataBuffer);
        
        if (data.text && data.text.trim().length > 100) {
          const textoLimpio = limpiarTexto(data.text);
          console.log(`   ✅ PDF procesado con pdf-parse: ${textoLimpio.length} caracteres`);
          return textoLimpio;
        }
      } catch (pdfError) {
        console.log(`   ⚠️ pdf-parse falló: ${pdfError.message}`);
      }
    }
    
    console.log(`   🔄 Usando fallback para PDF...`);
    try {
      const dataBuffer = fs.readFileSync(rutaPDF);
      const textoBinario = dataBuffer.toString('utf8');
      
      const lineasValidas = textoBinario.split('\n')
        .map(linea => linea.trim())
        .filter(linea => {
          return (
            linea.length > 10 &&
            !linea.startsWith('%') &&
            !linea.includes('stream') &&
            !linea.includes('endstream') &&
            !linea.includes('obj') &&
            !linea.includes('endobj') &&
            !linea.includes('xref') &&
            !linea.includes('trailer') &&
            /[a-zA-ZáéíóúÁÉÍÓÚñÑ]/.test(linea) &&
            linea.split(' ').length > 2
          );
        })
        .map(linea => linea.replace(/[^\w\sáéíóúÁÉÍÓÚñÑ.,!?;:()\-–—°"\/+\s#$%&*=\[\]{}<>|\\]/g, ''))
        .filter(linea => linea.length > 0);
      
      if (lineasValidas.length > 5) {
        const textoFallback = lineasValidas.join('\n');
        const textoLimpio = limpiarTexto(textoFallback);
        console.log(`   ✅ Fallback exitoso: ${textoLimpio.length} caracteres, ${lineasValidas.length} líneas`);
        return textoLimpio;
      }
    } catch (fallbackError) {
      console.log(`   ❌ Fallback falló: ${fallbackError.message}`);
    }
    
    try {
      const dataBuffer = fs.readFileSync(rutaPDF);
      let texto = dataBuffer.toString('utf8');
      
      const textoEntreParentesis = texto.match(/\(([^)]+)\)/g) || [];
      const textoEntreCorchetes = texto.match(/<([^>]+)>/g) || [];
      
      const fragmentos = [
        ...textoEntreParentesis.map(t => t.slice(1, -1)),
        ...textoEntreCorchetes.map(t => t.slice(1, -1))
      ].filter(f => f.length > 10 && /[a-zA-Z]/.test(f));
      
      if (fragmentos.length > 0) {
        const textoSegundoFallback = fragmentos.join(' ');
        const textoLimpio = limpiarTexto(textoSegundoFallback);
        console.log(`   ✅ Segundo fallback: ${textoLimpio.length} caracteres`);
        return textoLimpio;
      }
    } catch (error) {
      console.log(`   ❌ Todos los métodos fallaron para: ${path.basename(rutaPDF)}`);
    }
    
    return '';
    
  } catch (error) {
    console.error(`   ❌ Error general procesando PDF:`, error.message);
    return '';
  }
}

// PROCESAMIENTO DE DOCUMENTOS
async function procesarDocumento(archivo) {
  try {
    const rutaCompleta = path.join(DOCS_SOURCE_DIR, archivo);
    
    if (!fs.existsSync(rutaCompleta)) {
      console.log(`   ❌ Archivo no encontrado: ${archivo}`);
      return 0;
    }

    console.log(`   🔄 Procesando: ${archivo}`);
    let contenido = '';

    const extension = path.extname(archivo).toLowerCase();
    
    if (extension === '.txt') {
      contenido = fs.readFileSync(rutaCompleta, 'utf-8');
      console.log(`   ✅ TXT leído: ${contenido.length} caracteres`);
    } else if (extension === '.json') {
      const data = JSON.parse(fs.readFileSync(rutaCompleta, 'utf-8'));
      contenido = typeof data === 'object' ? JSON.stringify(data, null, 2) : String(data);
      console.log(`   ✅ JSON procesado: ${contenido.length} caracteres`);
    } else if (extension === '.pdf') {
      contenido = await extraerTextoDePDF(rutaCompleta);
      if (!contenido || contenido.length < 100) {
        console.log(`   ❌ No se pudo extraer texto útil del PDF: ${archivo}`);
        return 0;
      }
    } else {
      console.log(`   ⚠️ Formato no soportado: ${archivo}`);
      return 0;
    }

    const textoLimpio = limpiarTexto(contenido);
    if (textoLimpio.length < 100) {
      console.log(`   ⚠️ Texto muy corto: ${archivo} (${textoLimpio.length} chars)`);
      return 0;
    }

    console.log(`   📄 Preview: "${textoLimpio.substring(0, 100)}"...`);

    const chunks = dividirEnChunksInteligentes(textoLimpio);
    if (chunks.length === 0) {
      console.log(`   ⚠️ No se generaron chunks válidos: ${archivo}`);
      return 0;
    }

    const nombreBase = path.basename(archivo, path.extname(archivo));
    const nombreSalida = `${nombreBase}_chunks.json`;
    const rutaSalida = path.join(CHUNKS_DIR, nombreSalida);
    
    const datosChunks = {
      metadata: {
        nombreOriginal: archivo,
        fechaProcesamiento: new Date().toISOString(),
        totalChunks: chunks.length,
        totalCaracteres: textoLimpio.length,
        metodo: extension === '.pdf' ? 'pdf-parse + fallback' : 'directo'
      },
      chunks: chunks
    };
    
    fs.writeFileSync(rutaSalida, JSON.stringify(datosChunks, null, 2));
    console.log(`   ✅ ${archivo} → ${chunks.length} chunks guardados`);
    return chunks.length;
    
  } catch (error) {
    console.error(`   ❌ Error procesando ${archivo}:`, error.message);
    return 0;
  }
}

// ÍNDICE INVERTIDO
function crearIndiceInvertido() {
  console.log('   🔍 Creando índice invertido...');
  invertedIndex.clear();
  for (const [nombreDoc, chunks] of documentosChunks.entries()) {
    chunks.forEach((chunk, chunkIndex) => {
      const palabras = [...new Set(chunk.toLowerCase().match(/\b\w{3,}\b/g) || [])];
      palabras.forEach(palabra => {
        if (!invertedIndex.has(palabra)) {
          invertedIndex.set(palabra, []);
        }
        invertedIndex.get(palabra).push({ doc: nombreDoc, chunk: chunkIndex });
      });
    });
  }
  console.log(`   ✅ Índice con ${invertedIndex.size} palabras clave.`);
}

// CARGA EN MEMORIA
function cargarDocumentosEnMemoria() {
  documentosChunks.clear();
  
  if (!fs.existsSync(CHUNKS_DIR)) {
    console.log('📁 No existe carpeta de chunks, se creará automáticamente');
    fs.mkdirSync(CHUNKS_DIR, { recursive: true });
    return 0;
  }

  const archivos = fs.readdirSync(CHUNKS_DIR).filter(f => f.endsWith("_chunks.json"));
  let totalChunks = 0;

  console.log(`📂 Cargando ${archivos.length} archivos de chunks...`);

  for (const archivo of archivos) {
    try {
      const rutaCompleta = path.join(CHUNKS_DIR, archivo);
      const data = JSON.parse(fs.readFileSync(rutaCompleta, "utf-8"));
      const nombreDoc = data.metadata.nombreOriginal;
      
      if (data.chunks && Array.isArray(data.chunks)) {
        const chunksValidos = data.chunks.filter(chunk => 
          chunk && typeof chunk === 'string' && chunk.length > 50
        );
        
        if (chunksValidos.length > 0) {
          documentosChunks.set(nombreDoc, chunksValidos);
          totalChunks += chunksValidos.length;
          console.log(`   📖 ${nombreDoc}: ${chunksValidos.length} chunks`);
        }
      }
    } catch (err) {
      console.error(`❌ Error cargando ${archivo}:`, err.message);
    }
  }

  if (totalChunks > 0) {
    crearIndiceInvertido();
  }

  console.log(`✅ Cargados ${documentosChunks.size} documentos con ${totalChunks} chunks`);
  return totalChunks;
}

// BÚSQUEDA SEMÁNTICA MEJORADA
function buscarEnDocumentos(query, limite = 8) {
  const queryLower = limpiarTexto(query).toLowerCase();
  const palabrasClave = [...new Set(queryLower.match(/\b\w{3,}\b/g) || [])];

  if (palabrasClave.length === 0 || invertedIndex.size === 0) {
    return [];
  }

  console.log(`   🔍 Búsqueda: "${query}"`);
  console.log(`   🔑 Palabras clave: [${palabrasClave.join(', ')}]`);

  const chunkScores = new Map();

  palabrasClave.forEach(palabra => {
    const postings = invertedIndex.get(palabra);
    if (postings) {
      postings.forEach(({ doc, chunk }) => {
        const key = `${doc}|${chunk}`;
        if (!chunkScores.has(key)) {
          chunkScores.set(key, { score: 0, matched: [] });
        }
        chunkScores.get(key).score += 1;
        chunkScores.get(key).matched.push(palabra);
      });
    }
  });

  if (chunkScores.size === 0) return [];

  const resultados = [];
  for (const [key, { score, matched }] of chunkScores.entries()) {
    const [doc, chunkIndexStr] = key.split('|');
    const chunkIndex = parseInt(chunkIndexStr, 10);
    const chunkText = documentosChunks.get(doc)?.[chunkIndex];
    if (chunkText) {
      resultados.push({
        archivo: doc,
        chunkIndex: chunkIndex,
        texto: chunkText.substring(0, 1200),
        puntuacion: score * 10 + matched.length,
        palabrasCoincidentes: [...new Set(matched)]
      });
    }
  }

  return resultados
    .sort((a, b) => b.puntuacion - a.puntuacion)
    .slice(0, limite);
}

// OBTENER RESPUESTA IA
async function obtenerRespuestaIA(pregunta, contexto = "", modoEstricto = true) {
  const cacheKey = `${pregunta.toLowerCase().trim()}|${modoEstricto}`;
  if (cache.has(cacheKey)) {
    console.log("   ✅ Devolviendo respuesta desde caché");
    return cache.get(cacheKey);
  }
  console.log("🤖 Generando respuesta IA...");

  const tieneContexto = contexto && contexto.length > 200;
  
  if (modoEstricto && !tieneContexto) {
    return "🔍 No encontré información específica sobre tu pregunta en los documentos cargados. Puedes:\n\n• Intentar con el modo investigativo\n• Verificar que los documentos contengan información relacionada\n• Reformular tu pregunta";
  }

  try {
    const prompt = modoEstricto ? 
      `Eres un asistente especializado en aves de Colombia. Responde ÚNICAMENTE con la información proporcionada.

CONTEXTO:
${contexto}

PREGUNTA: ${pregunta}

Responde solo con la información del contexto. Si no hay información suficiente, indica claramente qué falta.` :

      `Eres un ornitólogo experto en aves de Colombia. Combina la información del contexto con tu conocimiento.

CONTEXTO:
${contexto}

PREGUNTA: ${pregunta}

Usa principalmente la información del contexto y complementa con conocimiento general cuando sea útil.`;

    const res = await fetch(config.OLLAMA_HOST + "/api/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: OLLAMA_MODEL,
        prompt: prompt,
        stream: false,
        options: {
          temperature: modoEstricto ? 0.3 : 0.6,
          num_predict: 1200,
          top_k: 40,
          top_p: 0.85
        }
      })
    });

    if (!res.ok) throw new Error(`Ollama error: ${res.status}`);
    
    const data = await res.json();
    const respuesta = data?.response?.trim() || "No pude generar una respuesta en este momento.";
    if (respuesta.length > 50) {
      cache.set(cacheKey, respuesta);
      console.log(`   💾 Respuesta guardada en caché (Key: ${cacheKey})`);
    }
    return respuesta;

  } catch (err) {
    console.error("❌ Error con IA:", err.message);
    
    if (contexto && contexto.length > 300) {
      return `📄 **Información encontrada:**

${contexto.substring(0, 800)}...

💡 *Respuesta limitada - verifica conexión con Ollama.*`;
    }
    
    return "❌ Error de conexión con Ollama. Verifica que esté ejecutándose en http://localhost:11434";
  }
}

// PROCESAMIENTO AUTOMÁTICO
async function procesarDocumentosAutomatico() {
  if (estaProcesando) {
    console.log('⏳ Procesamiento ya en curso...');
    return false;
  }

  estaProcesando = true;
  console.log('\n🔄 INICIANDO PROCESAMIENTO AUTOMÁTICO...');

  try {
    // Crear directorios necesarios
    if (!fs.existsSync(DOCS_SOURCE_DIR)) {
      fs.mkdirSync(DOCS_SOURCE_DIR, { recursive: true });
      console.log('📁 Carpeta documentos creada');
    }
    if (!fs.existsSync(CHUNKS_DIR)) {
      fs.mkdirSync(CHUNKS_DIR, { recursive: true });
    }

    const archivos = fs.existsSync(DOCS_SOURCE_DIR) ? 
      fs.readdirSync(DOCS_SOURCE_DIR).filter(f => 
        f.toLowerCase().endsWith('.pdf') || 
        f.toLowerCase().endsWith('.txt') || 
        f.toLowerCase().endsWith('.json')
      ) : [];

    console.log(`📚 Archivos encontrados: ${archivos.length}`);
    console.log(`   📄 ${archivos.join(', ')}`);

    if (archivos.length === 0) {
      console.log('💡 Coloca documentos en:', DOCS_SOURCE_DIR);
      return false;
    }

    let totalChunks = 0;
    let exitosos = 0;

    for (const archivo of archivos) {
      const chunks = await procesarDocumento(archivo);
      if (chunks > 0) {
        totalChunks += chunks;
        exitosos++;
      }
      // Pequeña pausa entre archivos
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    ultimaActualizacion = new Date().toLocaleString('es-CO');
    cargarDocumentosEnMemoria();
    crearIndiceInvertido();
    cache.clear();
    console.log('   🗑️ Caché de respuestas IA limpiado');

    console.log(`
🎉 PROCESAMIENTO COMPLETADO:
`);
    console.log(`   ✅ ${exitosos}/${archivos.length} documentos procesados`);
    console.log(`   🧩 ${totalChunks} chunks generados`);
    console.log(`   🕒 ${ultimaActualizacion}`);

    return exitosos > 0;

  } catch (error) {
    console.error('❌ Error en procesamiento automático:', error);
    return false;
  } finally {
    estaProcesando = false;
  }
}

// INICIALIZACIÓN DEL SERVICIO DE CHATBOT
async function inicializarSistema() {
  console.log('\n🌿 INICIALIZANDO SERVICIO DE CHATBOT...');
  
  // Crear directorios
  if (!fs.existsSync(DOCS_SOURCE_DIR)) {
    fs.mkdirSync(DOCS_SOURCE_DIR, { recursive: true });
    console.log('📁 Carpeta documentos creada');
  }
  if (!fs.existsSync(CHUNKS_DIR)) {
    fs.mkdirSync(CHUNKS_DIR, { recursive: true });
    console.log('📁 Carpeta chunks creada');
  }

  const chunksCargados = cargarDocumentosEnMemoria();
  
  const archivosFuente = fs.existsSync(DOCS_SOURCE_DIR) ? 
    fs.readdirSync(DOCS_SOURCE_DIR).filter(f => 
      f.toLowerCase().endsWith('.pdf') || 
      f.toLowerCase().endsWith('.txt') || 
      f.toLowerCase().endsWith('.json')
    ) : [];

  if (archivosFuente.length > 0 && chunksCargados === 0) {
    console.log(`📚 Procesando ${archivosFuente.length} documentos automáticamente...`);
    await procesarDocumentosAutomatico();
  } else if (chunksCargados > 0) {
    console.log(`📚 Usando ${chunksCargados} chunks ya procesados`);
  }
}


// Exportar funciones y variables necesarias para los controladores y rutas
export const chatServicio = {
  // Estado
  getTotalChunks: () => Array.from(documentosChunks.values()).reduce((sum, chunks) => sum + chunks.length, 0),
  getDocumentosChunksSize: () => documentosChunks.size,
  getEstaProcesando: () => estaProcesando,
  getUltimaActualizacion: () => ultimaActualizacion,
  
  // Funcionalidad
  procesarDocumentosAutomatico,
  buscarEnDocumentos,
  obtenerRespuestaIA,
  inicializarChatbotServicio: inicializarSistema, // Renombrar para claridad al exportar
};
