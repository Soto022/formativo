import React, { useState, useEffect } from 'react';
import AnimatedSectionCard from '../components/AnimatedSectionCard';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import { semilleroData as fallbackData } from '../data/semilleroContent.js'; // Importar los datos de respaldo

export function Semillero({ openLightbox }) {
  const { isAuthenticated } = useAuth();
  const [semilleroItems, setSemilleroItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null); // Mantenemos el estado de error para logging

  useEffect(() => {
    const fetchSemilleroData = async () => {
      try {
        setLoading(true);
        const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
        const response = await fetch(`${apiUrl}/api/semillero`);
        
        if (!response.ok) {
          throw new Error(`Error del servidor: ${response.status}`);
        }
        
        const data = await response.json();

        // Si la API devuelve datos, úsalos. De lo contrario, activa el fallback.
        if (data && data.length > 0) {
          // Procesar las rutas de las imágenes de la API para que sean absolutas
          const processedData = data.map(item => ({
            ...item,
            images: item.images.map(imagePath => `${apiUrl}${imagePath}`)
          }));
          setSemilleroItems(processedData);
        } else {
          // Si no hay datos, usa el fallback
          console.warn('La API no devolvió contenido para el semillero, usando datos de respaldo locales.');
          setSemilleroItems(fallbackData);
        }

      } catch (err) {
        // Si la API falla, usa el fallback
        setError(err.message);
        console.error("Error al obtener datos del semillero desde la API, usando datos de respaldo locales:", err);
        setSemilleroItems(fallbackData);
      } finally {
        setLoading(false);
      }
    };

    fetchSemilleroData();
  }, []);

  // El filtrado de 'isArchived' solo aplica a los datos de la API. Los datos de fallback se asumen activos.
  const activeSemilleroItems = semilleroItems.filter(item => item.isArchived !== true);

  // La lógica para la imagen de fondo ahora funciona con ambas fuentes de datos
  const heroBgImage = activeSemilleroItems.find(s => s.title.includes('Salidas de campo'))?.images[10];

  const renderContent = () => {
    if (loading) {
      return <div className="text-center py-20 text-white">Cargando contenido del semillero...</div>;
    }

    // Ya no mostramos un error, ya que tenemos el fallback.
    // El error se queda en la consola para depuración.
    if (activeSemilleroItems.length === 0) {
      return <div className="text-center py-20 text-white">No hay contenido disponible para el semillero en este momento.</div>;
    }

    return (
      <div className="max-w-screen-lg mx-auto space-y-20">
        {activeSemilleroItems.map((section, index) => (
          <AnimatedSectionCard 
            key={section._id || index}
            section={section}
            openLightbox={openLightbox}
            // Ya no se necesita el prop 'dataSource' porque las URLs de las imágenes son completas
          />
        ))}
      </div>
    );
  };

  return (
    <>
      <div className="-m-4 bg-gray-900">
        <div className="relative min-h-[40vh] sm:min-h-[50vh] md:h-[55vh] text-white flex flex-col justify-center items-center text-center p-8 overflow-hidden">
          <div className="absolute inset-0 bg-black opacity-40"></div>
          {/* La URL de la imagen ya es absoluta, ya sea de la API o del import estático */}
          {heroBgImage && <img src={heroBgImage} alt="Fondo Semillero" className="absolute inset-0 w-full h-full object-cover opacity-30"/>}
          <div className="relative z-10">
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-7xl font-extrabold tracking-tight" style={{ textShadow: '2px 2px 8px rgba(0,0,0,0.7)' }}>
              Semillero de Investigación
            </h1>
            <p className="mt-4 max-w-3xl text-base md:text-lg lg:text-xl text-gray-200">
              Explorando la biodiversidad a través de la tecnología, la ciencia y la pasión por la naturaleza.
            </p>
          </div>
        </div>

        {!isAuthenticated && (
          <div className="flex justify-center py-8 bg-gray-900">
            <Link 
              to="/login"
              className="px-6 py-3 font-bold text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 transition-colors shadow-lg"
            >
              Dashboard del admin
            </Link>
          </div>
        )}

        <div className="py-16 sm:py-24 px-4 sm:px-6 lg:px-8">
          {renderContent()}
        </div>
      </div>
    </>
  );
}