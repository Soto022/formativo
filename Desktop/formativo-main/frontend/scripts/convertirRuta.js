import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

// Obtener __dirname en ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ================================
// CONFIGURACIÓN DE RUTAS
// ================================

// Carpeta donde el usuario coloca los .geojson CRUDOS
const inputDir = path.join(__dirname, "..", "public", "coordenadas");

// Carpeta donde se generarán las rutas convertidas
const outputDir = path.join(__dirname, "..", "public", "rutas");

// Crear carpeta de salida si no existe
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
  console.log("📁 Carpeta 'public/rutas' creada.");
}

// Validar que coordenadas exista
if (!fs.existsSync(inputDir)) {
  console.error("❌ ERROR: La carpeta public/coordenadas no existe.");
  console.error("Crea esta ruta y pon allí tus archivos .geojson:");
  console.error("public/coordenadas/");
  process.exit(1);
}

// Obtener lista de archivos .geojson
const archivos = fs.readdirSync(inputDir).filter(f => f.endsWith(".geojson"));

if (archivos.length === 0) {
  console.warn("⚠ No hay archivos .geojson en public/coordenadas.");
  process.exit(0);
}

console.log(`🔍 Encontrados ${archivos.length} archivos para convertir...\n`);

// ================================
// PROCESAR CADA ARCHIVO GEOJSON
// ================================

for (const archivo of archivos) {
  const inputPath = path.join(inputDir, archivo);
  const outputPath = path.join(outputDir, archivo);

  try {
    const data = JSON.parse(fs.readFileSync(inputPath, "utf-8"));
    const feature = data.features?.[0];

    if (!feature || !feature.geometry) {
      console.error(`❌ ERROR: ${archivo} no contiene geometría válida.`);
      continue;
    }

    // Plantilla final
    const plantilla = {
      type: "FeatureCollection",
      features: [
        {
          type: "Feature",
          properties: {
            name: path.basename(archivo, ".geojson"),
            descripcion: "Ruta disponible para observación de aves.",
            aves: ["Por definir"],
            horario_ideal: "6:00 AM - 10:00 AM",
            dificultad: "Media",
          },
          geometry: {
            type: "LineString",
            coordinates: feature.geometry.coordinates,
          },
        },
      ],
    };

    fs.writeFileSync(outputPath, JSON.stringify(plantilla, null, 2));
    console.log(`✔ Archivo convertido: ${archivo}`);

  } catch (err) {
    console.error(`❌ Error procesando ${archivo}:`, err.message);
  }
}

console.log("\n🏁 PROCESO COMPLETADO.");
console.log("Las rutas convertidas están en: public/rutas/");
