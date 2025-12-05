// src/pages/Georutas.jsx
import { useState, useEffect } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Polyline,
  useMap,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

// Fix for default Leaflet icon path issues with bundlers
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png",
});

// Custom pulsating icon for the main marker
const mainIcon = L.divIcon({
  className: "pulsating-icon",
  html: `<div class="ring"></div><div class="dot"></div>`,
  iconSize: [20, 20],
  iconAnchor: [10, 10],
});

// Auto-fit component to nicely frame the selected route or default bounds
function MapAutoFit({ coords }) {
  const map = useMap();
  useEffect(() => {
    if (coords && coords.length > 0) {
      map.flyToBounds(coords, { padding: [70, 70], duration: 1.5 });
    }
  }, [coords, map]);
  return null;
}

// Helper to extract coordinates
function extraerCoords(geometry) {
  if (!geometry || !geometry.type || !geometry.coordinates) {
    return [];
  }

  let coordsArray;

  switch (geometry.type) {
    case "LineString":
      coordsArray = geometry.coordinates;
      break;
    case "Polygon":
      coordsArray = geometry.coordinates[0];
      break;
    case "MultiLineString":
      coordsArray = geometry.coordinates.flat();
      break;
    default:
      return [];
  }

  if (!Array.isArray(coordsArray)) {
    return [];
  }

  // Defensive mapping to prevent crashes from malformed data
  return coordsArray
    .filter(point => Array.isArray(point) && point.length >= 2 && typeof point[0] === 'number' && typeof point[1] === 'number')
    .map(([lng, lat]) => [lat, lng]);
}

// Function to calculate total distance of a route in km
function calcularDistancia(coords) {
  if (!coords || coords.length < 2) return 0;

  const R = 6371; // Earth's radius in km
  let distancia = 0;

  for (let i = 0; i < coords.length - 1; i++) {
    const [lat1, lon1] = coords[i];
    const [lat2, lon2] = coords[i + 1];

    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    distancia += R * c;
  }

  return distancia; // in km
}

// Route Information Component
function RouteInfoBox({ route, onBack, onCenter }) {
  return (
    <div className="animate-fade-in h-full flex flex-col">
      <div className="bg-gray-800/50 border border-emerald-500/20 rounded-lg p-6 mb-6">
        <div className="flex justify-between items-start mb-4">
          <h3 className="text-2xl font-bold text-emerald-400">🗺️ {route.nombre}</h3>
          <button
            onClick={onBack}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <div className="space-y-3">
          <div>
            <h4 className="font-semibold text-white mb-1">Descripción</h4>
            <p className="text-gray-300 text-sm">{route.descripcion}</p>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <h4 className="font-semibold text-white mb-1">Distancia</h4>
              <p className="text-emerald-400 text-sm">{route.distancia}</p>
            </div>
            
            <div>
              <h4 className="font-semibold text-white mb-1">Dificultad</h4>
              <p className="text-emerald-400 text-sm">{route.dificultad}</p>
            </div>
          </div>
          
          <div>
            <h4 className="font-semibold text-white mb-1">Terreno</h4>
            <p className="text-gray-300 text-sm">{route.terreno}</p>
          </div>
        </div>
        
        <button
          onClick={onCenter}
          className="mt-6 w-full bg-emerald-600 hover:bg-emerald-700 text-white py-2 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center"
        >
          <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          Centrar en el mapa
        </button>
      </div>
    </div>
  );
}

export default function Georutas() {
  const [rutas, setRutas] = useState([]);
  const [rutaSeleccionada, setRutaSeleccionada] = useState(null);
  const [limiteCaldas, setLimiteCaldas] = useState(null);
  const [currentMapBounds, setCurrentMapBounds] = useState(null);
  const [hoveredRouteId, setHoveredRouteId] = useState(null);

  // Load routes and department boundary
  useEffect(() => {
    const cargarRutas = async () => {
      try {
        const indexRes = await fetch("/rutas/index.json");
        const indexData = await indexRes.json();

        const rutasCargadas = await Promise.all(
          indexData.map(async (ruta, idx) => {
            if (ruta.archivo === "limitecaldas.geojson") return null;
            
            const res = await fetch(`/rutas/${ruta.archivo}`);
            const data = await res.json();
            const feature = data.features[0];
            const coords = extraerCoords(feature.geometry);

            // Calculate distance if not defined in properties
            const distanciaCalculada = calcularDistancia(coords).toFixed(2);

            return {
              id: idx + 1,
              nombre: feature.properties.name || `Ruta ${idx + 1}`,
              coords,
              descripcion: feature.properties.descripcion || "Sin descripción disponible",
              distancia: feature.properties.distancia || `${distanciaCalculada} km`,
              terreno: feature.properties.terreno || "No especificado",
              dificultad: feature.properties.dificultad || "No indicada",
            };
          })
        );

        const rutasFiltradas = rutasCargadas.filter(ruta => ruta !== null);
        setRutas(rutasFiltradas);
      } catch (error) {
        console.error("Error cargando rutas:", error);
      }
    };

    const cargarLimite = async () => {
      try {
        const res = await fetch("/rutas/limitecaldas.geojson");
        const data = await res.json();
        const feature = data.features[0];
        const coords = extraerCoords(feature.geometry);
        setLimiteCaldas({ coords });
        
        // Initialize currentMapBounds with Caldas boundaries
        setCurrentMapBounds(coords);
      } catch (error) {
        console.error("Error cargando límite de Caldas:", error);
      }
    };

    cargarRutas();
    cargarLimite();
  }, []);

  // Effect to update map bounds when selected route changes
  useEffect(() => {
    if (rutaSeleccionada) {
      setCurrentMapBounds(rutaSeleccionada.coords);
    } else if (limiteCaldas) {
      setCurrentMapBounds(limiteCaldas.coords);
    }
  }, [rutaSeleccionada, limiteCaldas]);

  const hoveredRoute = hoveredRouteId !== null ? rutas.find(r => r.id === hoveredRouteId) : null;

  return (
    <div className="bg-gray-900 min-h-screen -m-4 py-4 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-white">
            Nuestras <span className="text-emerald-400">GeoRutas</span>
          </h1>
          <p className="mt-4 max-w-3xl mx-auto text-lg text-gray-400">
            Sumérgete en un viaje interactivo por las rutas de aviturismo de Caldas.
          </p>
        </div>

        <div className="bg-gray-800/50 backdrop-blur-sm border border-emerald-500/20 rounded-2xl shadow-2xl shadow-emerald-900/50 p-6 md:p-8">
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
            
            {/* Map Column */}
            <div className="lg:col-span-3 h-[500px] lg:h-[600px] rounded-lg overflow-hidden border border-gray-700">
              <MapContainer
                center={[5.07, -75.52]}
                zoom={9}
                scrollWheelZoom={true}
                className="h-full w-full bg-gray-800"
              >
                <TileLayer
                  url="https://tiles.stadiamaps.com/tiles/alidade_smooth_dark/{z}/{x}/{y}{r}.png"
                  attribution='&copy; <a href="https://stadiamaps.com/">Stadia Maps</a>, &copy; <a href="https://openmaptiles.org/">OpenMapTiles</a> &copy; <a href="http://openstreetmap.org">OSM</a>'
                />
                <Marker position={[5.07, -75.52]} icon={mainIcon}>
                  <Popup>Manizales, Caldas</Popup>
                </Marker>
                
                {/* Department boundary */}
                {limiteCaldas && (
                  <Polyline 
                    positions={limiteCaldas.coords} 
                    pathOptions={{ color: "#f59e0b", weight: 2, opacity: 0.7, dashArray: "5, 10" }} 
                  />
                )}
                
                {/* Selected route */}
                {rutaSeleccionada && (
                  <Polyline 
                    positions={rutaSeleccionada.coords} 
                    pathOptions={{ color: "#34d399", weight: 5, opacity: 1 }} 
                  />
                )}
                
                {/* Hovered route preview */}
                {hoveredRoute && !rutaSeleccionada && (
                  <Polyline 
                    positions={hoveredRoute.coords} 
                    pathOptions={{ color: "#fde047", weight: 5, opacity: 0.8 }} 
                  />
                )}

                {currentMapBounds && <MapAutoFit coords={currentMapBounds} />}
              </MapContainer>
            </div>

            {/* Content Column */}
            <div className="lg:col-span-2">
              {rutaSeleccionada ? (
                <RouteInfoBox 
                  route={rutaSeleccionada} 
                  onBack={() => setRutaSeleccionada(null)} 
                  onCenter={() => setCurrentMapBounds([...rutaSeleccionada.coords])}
                />
              ) : (
                <div className="animate-fade-in h-full flex flex-col">
                  {/* Welcome Panel */}
                  <div className="text-center border border-gray-700 rounded-lg p-6 mb-6 bg-gray-800/50">
                    <svg className="mx-auto h-12 w-12 text-emerald-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <h3 className="mt-2 text-xl font-bold text-white">Explora las Rutas</h3>
                    <p className="mt-1 text-sm text-gray-400">
                      Pasa el cursor sobre una ruta para previsualizarla en el mapa o haz clic para ver sus detalles.
                    </p>
                    
                    {/* Legend */}
                    <div className="mt-4 text-xs text-gray-400 space-y-1">
                      <div className="flex items-center justify-center">
                        <span className="inline-block w-4 h-0.5 bg-orange-500 mr-2 border-t-2 border-orange-500 border-dashed"></span>
                        <span>Límite de Caldas</span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Routes List */}
                  <div className="flex-grow overflow-hidden">
                    <div className="h-full overflow-y-auto space-y-3 pr-2 custom-scrollbar">
                      {rutas.map((ruta) => (
                        <button
                          key={ruta.id}
                          onMouseEnter={() => setHoveredRouteId(ruta.id)}
                          onMouseLeave={() => setHoveredRouteId(null)}
                          className={`w-full p-4 rounded-lg text-left transition-all duration-300 ease-in-out group transform focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-emerald-400 bg-gray-700/50 border border-gray-600 hover:bg-gray-700 hover:border-gray-500`}
                          onClick={() => setRutaSeleccionada(ruta)}
                        >
                          <div className="flex justify-between items-center">
                            <div className="text-left">
                              <h4 className="font-bold text-lg text-emerald-100 group-hover:text-white">
                                {ruta.nombre}
                              </h4>
                              <p className="text-sm text-gray-400 mt-1">
                                {ruta.distancia} • {ruta.dificultad}
                              </p>
                            </div>
                            <svg className={`w-6 h-6 text-emerald-400 transition-transform duration-300 -translate-x-1 group-hover:translate-x-0`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                            </svg>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}     