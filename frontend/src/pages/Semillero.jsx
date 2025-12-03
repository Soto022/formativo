import React, { useState, useEffect } from 'react';
import AnimatedSectionCard from '../components/AnimatedSectionCard';
import { useAuth } from '../context/AuthContext'; // Importar useAuth
import { Link } from 'react-router-dom'; // Importar Link
// Se elimina la importación de datos estáticos: import { semilleroData as initialSemilleroData } from '../data/semilleroContent';

export function Semillero({ openLightbox }) {
  const { isAuthenticated } = useAuth(); // Obtener estado de autenticación
  const [semilleroItems, setSemilleroItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchSemilleroData = async () => {
      try {
        setLoading(true);
        // La URL base de la API debería estar en una variable de entorno para producción
        const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
        const response = await fetch(`${apiUrl}/api/semillero`);
        if (!response.ok) {
          throw new Error(`Error del servidor: ${response.status}`);
        }
        const data = await response.json();
        setSemilleroItems(data);
      } catch (err) {
        setError(err.message);
        console.error("Error fetching semillero data:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchSemilleroData();
  }, []);

  // Filtrar solo los elementos que NO están archivados para mostrar en la página pública
  // La API ya filtra por `isArchived: false` por defecto, pero es buena práctica mantenerlo aquí
  const activeSemilleroItems = semilleroItems.filter(item => !item.isArchived);

  // Encontrar la imagen de fondo para el Hero (si existe y no está archivada)
  const heroBgImage = activeSemilleroItems.find(s => s.title.includes('Salidas de campo'))?.images[10];

  const renderContent = () => {
    if (loading) {
      return <div className="text-center py-20 text-white">Cargando contenido del semillero...</div>;
    }

    if (error) {
      return <div className="text-center py-20 text-red-500">Error al cargar el contenido: {error}</div>;
    }

    if (activeSemilleroItems.length === 0) {
      return <div className="text-center py-20 text-white">No hay contenido disponible para el semillero en este momento.</div>;
    }

    return (
      <div className="max-w-screen-lg mx-auto space-y-20">
        {activeSemilleroItems.map((section, index) => (
          <AnimatedSectionCard 
            key={section._id || index} // Usar _id de MongoDB como key
            section={section}
            openLightbox={openLightbox}
          />
        ))}
      </div>
    );
  };


  return (
    <>
      <div className="-m-4 bg-gray-900">
        {/* Hero Section - Kept from original for visual consistency */}
        <div className="relative h-[55vh] text-white flex flex-col justify-center items-center text-center p-8 overflow-hidden">
          <div className="absolute inset-0 bg-black opacity-40"></div>
          {heroBgImage && <img src={`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}${heroBgImage}`} alt="Fondo Semillero" className="absolute inset-0 w-full h-full object-cover opacity-30"/>}
          <div className="relative z-10">
            <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight" style={{ textShadow: '2px 2px 8px rgba(0,0,0,0.7)' }}>
              Semillero de Investigación
            </h1>
            <p className="mt-4 max-w-3xl text-lg md:text-xl text-gray-200">
              Explorando la biodiversidad a través de la tecnología, la ciencia y la pasión por la naturaleza.
            </p>
          </div>
        </div>

        {/* Admin Dashboard Button - visible only if not authenticated */}
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

        {/* Content Sections - Now using the reusable component */}
        <div className="py-16 sm:py-24 px-4 sm:px-6 lg:px-8">
          {renderContent()}
        </div>
      </div>
    </>
  );
}