// src/data/rutas.js
// Datos + utilidades para Georutas (Leaflet + compartir en Google Maps / Waze)
import BosquesChecCedral01WladimirG from '../assets/localidades/Bosques-Chec-Cedral-01-WladimirG.jpg';
import BosquesdelaPraderaWladimirGiraldo from '../assets/localidades/Bosques-de-la-Pradera-WladimirGiraldo.jpg';
import CantaresReservaNatural01 from '../assets/localidades/Cantares-Reserva-Natural-01.jpg';
import ElColordeMisReves02 from '../assets/localidades/El-Color-de-Mis-Reves-02.jpg';
import EmbalseLaEsmeralda from '../assets/localidades/Embalse-La-Esmeralda.jpg';
import FincaDemostrativaDonMiguel from '../assets/localidades/Finca-Demostrativa-Don-Miguel.jpg';
import FincaRomelia from '../assets/localidades/Finca-Romelia.jpg';
import HaciendaelBosque01 from '../assets/localidades/Hacienda-el-Bosque-01.jpg';
import HaciendaVenecia01 from '../assets/localidades/Hacienda-Venecia-01.jpg';
import KairiLodge010 from '../assets/localidades/Kairi-Lodge-010.jpg';
import LodgeParaisoVerde09WladimirG from '../assets/localidades/Lodge-Paraiso-Verde-09-WladimirG.jpg';
import NevadodelRuizBrisasWladimirG01 from '../assets/localidades/Nevado-del-Ruiz-Brisas-WladimirG-01.jpg';
import OwlWatch01 from '../assets/localidades/Owl-Watch-01.jpg';
import RecintodePensamietno from '../assets/localidades/Recinto-de-Pensamietno.jpg';
import ReservaNaturalLicoreraCaldas08 from '../assets/localidades/Reserva-Natural-Licorera-Caldas-08.jpg';
import RioBlancoReservaNatural01bWladimirG from '../assets/localidades/Rio-Blanco-Reserva-Natural-01b-WladimirG.jpg';
import RioclaroLaSoledadWladimirGiraldo from '../assets/localidades/Rioclaro-LaSoledad-WladimirGiraldo.jpg';
import TermalesElRuiz07WladimrG from '../assets/localidades/Termales-ElRuiz-07-WladimrG.jpg';
import TinamuBirdingNatureReserve from '../assets/localidades/Tinamu-Birding-Nature-Reserve.jpg';
import TominejoEcolodge021 from '../assets/localidades/Tominejo-Ecolodge-02-1.jpg';

// --- Helpers ---
function toRad(deg) {
  return (deg * Math.PI) / 180;
}

/** Calcula la distancia total (km) de una lista de coordenadas [lat, lng] usando Haversine */
function computeLengthKm(coords) {
  if (!Array.isArray(coords) || coords.length < 2) return 0;
  const R = 6371; // radio de la Tierra en km
  let total = 0;
  for (let i = 1; i < coords.length; i++) {
    const [lat1, lon1] = coords[i - 1];
    const [lat2, lon2] = coords[i];
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    total += R * c;
  }
  return Math.round(total * 100) / 100; // redondea a 2 decimales
}

/** Construye URL para Google Maps Directions.
 *  origin = primer punto, destination = último punto, waypoints = intermedios (si hay).
 *  travelmode: driving / walking / bicycling
 */
function coordsToGoogleMapsUrl(coords, travelmode = "walking") {
  if (!Array.isArray(coords) || coords.length === 0) return "https://www.google.com/maps";
  const origin = `${coords[0][0]},${coords[0][1]}`;
  const destination = `${coords[coords.length - 1][0]},${coords[coords.length - 1][1]}`;
  const waypoints =
    coords.length > 2 ? coords.slice(1, -1).map((c) => `${c[0]},${c[1]}`).join("|") : "";
  const params = new URLSearchParams({
    api: "1",
    origin,
    destination,
    travelmode,
  });
  let url = `https://www.google.com/maps/dir/?${params.toString()}`;
  if (waypoints) url += `&waypoints=${encodeURIComponent(waypoints)}`;
  return url;
}

/** Construye URL para Waze (navegar al último punto de la ruta) */
function coordsToWazeUrl(coords) {
  if (!Array.isArray(coords) || coords.length === 0) return "https://www.waze.com";
  const last = coords[coords.length - 1];
  const lat = last[0];
  const lon = last[1];
  return `https://www.waze.com/ul?ll=${lat},${lon}&navigate=yes`;
}

// --- Datos base de rutas (solo datos, sin lógica) ---
const rawRutas = [
  {
    id: 1,
    nombre: "Ruta Río Blanco",
    coords: [
      [5.062887793412195, -75.47347697745462],
      [5.065405825121418, -75.47117529888806],
      [5.0641220288314654, -75.46505582317155],
      [5.06967014164236, -75.45397770096494],
      [5.066433825407101, -75.44846642023799],
      [5.070157794351942, -75.44899769284298],
      [5.068413411597096, -75.440025085605],
      [5.076571448439857, -75.43703898188535]
    ],
    terreno: "Bosque húmedo, sendero ecológico",
    aves: "Gallito de roca, tangaras, colibríes",
    horario: "6:00 am - 10:00 am",
  },
  {
    id: 2,
    nombre: "Sendero Ecoparque Los Yarumos",
    coords: [
      [5.05, -75.5],
      [5.055, -75.495],
      [5.06, -75.49],
    ],
    terreno: "Sendero urbano con bosque secundario",
    aves: "Colibríes, atrapamoscas, tucanes pequeños",
    horario: "7:00 am - 11:00 am",
  },
  {
    id: 3,
    nombre: "Reserva Natural Río Otún",
    coords: [
      [4.81, -75.63],
      [4.82, -75.62],
      [4.825, -75.61],
    ],
    terreno: "Bosque húmedo montano",
    aves: "Pava caucana, búhos, carpinteros",
    horario: "5:30 am - 9:00 am",
  },
  { id: 4, nombre: "Bosques Chec Cedral", imagen: BosquesChecCedral01WladimirG, coords: [], terreno: "Por definir", aves: "Por definir", horario: "Por definir" },
  { id: 5, nombre: "Bosques de la Pradera", imagen: BosquesdelaPraderaWladimirGiraldo, coords: [], terreno: "Por definir", aves: "Por definir", horario: "Por definir" },
  { id: 6, nombre: "Cantares Reserva Natural", imagen: CantaresReservaNatural01, coords: [], terreno: "Por definir", aves: "Por definir", horario: "Por definir" },
  { id: 7, nombre: "El Color de Mis Reves", imagen: ElColordeMisReves02, coords: [], terreno: "Por definir", aves: "Por definir", horario: "Por definir" },
  { id: 8, nombre: "Embalse La Esmeralda", imagen: EmbalseLaEsmeralda, coords: [], terreno: "Por definir", aves: "Por definir", horario: "Por definir" },
  { id: 9, nombre: "Finca Demostrativa Don Miguel", imagen: FincaDemostrativaDonMiguel, coords: [], terreno: "Por definir", aves: "Por definir", horario: "Por definir" },
  { id: 10, nombre: "Finca Romelia", imagen: FincaRomelia, coords: [], terreno: "Por definir", aves: "Por definir", horario: "Por definir" },
  { id: 11, nombre: "Hacienda el Bosque", imagen: HaciendaelBosque01, coords: [], terreno: "Por definir", aves: "Por definir", horario: "Por definir" },
  { id: 12, nombre: "Hacienda Venecia", imagen: HaciendaVenecia01, coords: [], terreno: "Por definir", aves: "Por definir", horario: "Por definir" },
  { id: 13, nombre: "Kairi Lodge", imagen: KairiLodge010, coords: [], terreno: "Por definir", aves: "Por definir", horario: "Por definir" },
  { id: 14, nombre: "Lodge Paraiso Verde", imagen: LodgeParaisoVerde09WladimirG, coords: [], terreno: "Por definir", aves: "Por definir", horario: "Por definir" },
  { id: 15, nombre: "Nevado del Ruiz Brisas", imagen: NevadodelRuizBrisasWladimirG01, coords: [], terreno: "Por definir", aves: "Por definir", horario: "Por definir" },
  { id: 16, nombre: "Owl Watch", imagen: OwlWatch01, coords: [], terreno: "Por definir", aves: "Por definir", horario: "Por definir" },
  { id: 17, nombre: "Recinto de Pensamiento", imagen: RecintodePensamietno, coords: [], terreno: "Por definir", aves: "Por definir", horario: "Por definir" },
  { id: 18, nombre: "Reserva Natural Licorera Caldas", imagen: ReservaNaturalLicoreraCaldas08, coords: [], terreno: "Por definir", aves: "Por definir", horario: "Por definir" },
  { id: 19, nombre: "Rio Blanco Reserva Natural", imagen: RioBlancoReservaNatural01bWladimirG, coords: [], terreno: "Por definir", aves: "Por definir", horario: "Por definir" },
  { id: 20, nombre: "Rioclaro La Soledad", imagen: RioclaroLaSoledadWladimirGiraldo, coords: [], terreno: "Por definir", aves: "Por definir", horario: "Por definir" },
  { id: 21, nombre: "Termales El Ruiz", imagen: TermalesElRuiz07WladimrG, coords: [], terreno: "Por definir", aves: "Por definir", horario: "Por definir" },
  { id: 22, nombre: "Tinamu Birding Nature Reserve", imagen: TinamuBirdingNatureReserve, coords: [], terreno: "Por definir", aves: "Por definir", horario: "Por definir" },
  { id: 23, nombre: "Tominejo Ecolodge", imagen: TominejoEcolodge021, coords: [], terreno: "Por definir", aves: "Por definir", horario: "Por definir" }
];

// --- Añade campos calculados (km) y exporta ---
export const rutas = rawRutas.map((r) => {
  const km = computeLengthKm(r.coords);
  return {
    ...r,
    km, // número en km (2 decimales)
    kmText: `${km} km`, // string para mostrar directamente
    // No generamos URLs aquí porque es mejor generarlas con la función dedicada al momento de usarlas
  };
});

export default rutas;

// --- utilidades exportadas para usar desde Georutas.jsx ---
export { computeLengthKm, coordsToGoogleMapsUrl, coordsToWazeUrl };
