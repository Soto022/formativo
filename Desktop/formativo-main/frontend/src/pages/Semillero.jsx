import React from 'react';
import AnimatedSectionCard from '../components/AnimatedSectionCard';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import { semilleroData } from '../data/semilleroContent'; // Import static data

export function Semillero({ openLightbox }) {
  const { isAuthenticated } = useAuth(); // Auth state is still useful for the admin button

  // Find the background image for the Hero from the static data
  const heroBgImage = semilleroData.find(s => s.title.includes('Salidas de campo'))?.images[10];

  const renderContent = () => {
    if (!semilleroData || semilleroData.length === 0) {
      return <div className="text-center py-20 text-white">No hay contenido disponible para el semillero en este momento.</div>;
    }

    return (
      <div className="max-w-screen-lg mx-auto space-y-8 sm:space-y-16 lg:space-y-20">
        {semilleroData.map((section, index) => (
          <AnimatedSectionCard 
            key={index} // Using index as key is fine for static lists
            section={section}
            openLightbox={openLightbox}
          />
        ))}
      </div>
    );
  };

  return (
    <>
      <div className="bg-gray-900">
        {/* Hero Section */}
        <div className="relative h-[40vh] sm:h-[55vh] text-white flex flex-col justify-center items-center text-center p-4 sm:p-8 overflow-hidden">
          <div className="absolute inset-0 bg-black opacity-40"></div>
          {/* Note: The image path from static import is used directly */}
          {heroBgImage && <img src={heroBgImage} alt="Fondo Semillero" className="absolute inset-0 w-full h-full object-cover opacity-30"/>}
          <div className="relative z-10">
            <h1 className="text-4xl sm:text-5xl md:text-7xl font-extrabold tracking-tight" style={{ textShadow: '2px 2px 8px rgba(0,0,0,0.7)' }}>
              Semillero de Investigación
            </h1>
            <p className="mt-4 max-w-3xl text-base sm:text-lg md:text-xl text-gray-200">
              Explorando la biodiversidad a través de la tecnología, la ciencia y la pasión por la naturaleza.
            </p>
          </div>
        </div>

        {/* Admin Dashboard Button - still useful to keep */}
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

        {/* Content Sections */}
        <div className="py-16 sm:py-24 px-4 sm:px-6 lg:px-8">
          {renderContent()}
        </div>
      </div>
    </>
  );
}