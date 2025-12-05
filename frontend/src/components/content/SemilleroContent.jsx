import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';

// Import Swiper React components
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination } from 'swiper/modules';

// Import Swiper styles
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';

export function SemilleroContent() {
  const [semilleroItems, setSemilleroItems] = useState([]);
  const [editingItem, setEditingItem] = useState(null);
  const [form, setForm] = useState({
    title: '',
    description: '',
    subsections: [],
    images: [],
    filesToUpload: [],
    isArchived: false,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { currentUser } = useAuth();

  const BASE_API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
  const API_URL = `${BASE_API_URL}/api/semillero`;

  // --- Data Fetching ---
  const fetchSemilleroItems = async () => {
    try {
      const response = await fetch(API_URL);
      if (!response.ok) {
        throw new Error('Error al obtener los elementos del semillero.');
      }
      const data = await response.json();
      setSemilleroItems(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSemilleroItems();
  }, []);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm({
      ...form,
      [name]: type === 'checkbox' ? checked : value,
    });
  };

  const handleSubsectionChange = (index, e) => {
    const { name, value } = e.target;
    const subsections = [...form.subsections];
    subsections[index][name] = value;
    setForm({ ...form, subsections });
  };

  const addSubsection = () => {
    setForm({
      ...form,
      subsections: [...form.subsections, { title: '', description: '' }],
    });
  };

  const removeSubsection = (index) => {
    const subsections = [...form.subsections];
    subsections.splice(index, 1);
    setForm({ ...form, subsections });
  };

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    setForm({
      ...form,
      filesToUpload: files,
      images: files.map(file => URL.createObjectURL(file)),
    });
  };

  const resetForm = () => {
    setEditingItem(null);
    setForm({
      title: '',
      description: '',
      subsections: [],
      images: [],
      filesToUpload: [],
      isArchived: false,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append('title', form.title);
    formData.append('description', form.description);
    formData.append('subsections', JSON.stringify(form.subsections));
    formData.append('isArchived', form.isArchived);
    form.filesToUpload.forEach(file => {
      formData.append('images', file);
    });

    const url = editingItem ? `${API_URL}/${editingItem._id}` : API_URL;
    const method = editingItem ? 'PUT' : 'POST';

    try {
      const response = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${currentUser.token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Error al guardar el elemento.');
      }

      await fetchSemilleroItems();
      resetForm();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleEdit = (item) => {
    resetForm();
    setEditingItem(item);
    setForm({
      ...item,
      filesToUpload: [],
      images: item.images.map(img => `${BASE_API_URL}${img}?${new Date().getTime()}`), // Añadir timestamp para evitar caché
    });
  };

  
  const handleDelete = async (id) => {
    if (!window.confirm("¿Estás seguro de que quieres eliminar este elemento? Esta acción no se puede deshacer.")) return;
    
    try {
        const response = await fetch(`${API_URL}/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${currentUser.token}` },
        });
        if (!response.ok) throw new Error('Error al eliminar el elemento.');
        fetchSemilleroItems();
    } catch (err) {
        setError(err.message);
    }
  };
  
  const handleArchiveToggle = async (id) => {
    try {
      const response = await fetch(`${API_URL}/${id}/archivar`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${currentUser.token}`,
        },
      });
      if (!response.ok) {
        throw new Error('Error al cambiar el estado de archivo.');
      }
      fetchSemilleroItems();
    } catch (err) {
      setError(err.message);
    }
  };

  if (loading) return <p>Cargando gestión de Semillero...</p>;
  if (error) return <p className="text-red-500">Error: {error}</p>;

  return (
    <div className="p-6 bg-gray-800 rounded-lg shadow-md">
      <h3 className="text-xl font-bold text-emerald-300 mb-6">Gestión de Contenido de Semillero</h3>

      {/* Formulario */}
      <div className="mb-8 p-6 bg-gray-700 rounded-lg">
        <h4 className="text-lg font-semibold text-white mb-4">{editingItem ? 'Editar Elemento' : 'Agregar Nuevo Elemento'}</h4>
        <form id="semillero-form" onSubmit={handleSubmit} className="space-y-4">
            {/* Campos de texto y textarea */}
            <div>
                <label htmlFor="title" className="block text-sm font-medium text-gray-300">Título</label>
                <input type="text" id="title" name="title" value={form.title} onChange={handleInputChange} className="mt-1 block w-full p-2 border border-gray-600 rounded-md shadow-sm bg-gray-900 text-gray-100 focus:ring-emerald-500 focus:border-emerald-500" required />
            </div>
            <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-300">Descripción</label>
                <textarea id="description" name="description" value={form.description} onChange={handleInputChange} rows="4" className="mt-1 block w-full p-2 border border-gray-600 rounded-md shadow-sm bg-gray-900 text-gray-100 focus:ring-emerald-500 focus:border-emerald-500" required></textarea>
            </div>
            {/* Subsecciones */}
            <div className="border border-gray-600 p-4 rounded-md">
                <h5 className="text-md font-semibold text-gray-200 mb-3">Subsecciones</h5>
                {form.subsections.map((sub, index) => (
                    <div key={index} className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2 mb-3">
                        <input type="text" name="title" placeholder="Título de subsección" value={sub.title} onChange={(e) => handleSubsectionChange(index, e)} className="flex-1 p-2 border border-gray-600 rounded-md shadow-sm bg-gray-900 text-gray-100" />
                        <textarea name="description" placeholder="Descripción de subsección" value={sub.description} onChange={(e) => handleSubsectionChange(index, e)} rows="2" className="flex-1 p-2 border border-gray-600 rounded-md shadow-sm bg-gray-900 text-gray-100"></textarea>
                        <button type="button" onClick={() => removeSubsection(index)} className="px-3 py-1 bg-red-600 text-white rounded-md hover:bg-red-700 self-center">Eliminar</button>
                    </div>
                ))}
                <button type="button" onClick={addSubsection} className="mt-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">Añadir Subsección</button>
            </div>
            {/* Imágenes */}
            <div>
                <label htmlFor="images" className="block text-sm font-medium text-gray-300">Imágenes (múltiples permitidas)</label>
                <input type="file" id="images" name="images" multiple onChange={handleImageChange} className="mt-1 block w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100" />
            </div>
            {/* Previsualización */}
            {form.images.length > 0 && <div className="mt-4"><h5 className="text-md font-semibold text-gray-200 mb-2">Previsualización</h5><Swiper modules={[Navigation, Pagination]} navigation pagination={{ clickable: true }} loop={false} className="w-full h-48">{form.images.map((img, i) => <SwiperSlide key={i}><img src={img} alt={`Preview ${i}`} className="object-cover w-full h-full" /></SwiperSlide>)}</Swiper></div>}
            {/* Checkbox para archivar */}
            <div className="flex items-center">
                <input type="checkbox" id="isArchived" name="isArchived" checked={form.isArchived} onChange={handleInputChange} className="h-4 w-4 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500" />
                <label htmlFor="isArchived" className="ml-2 block text-sm text-gray-200">Archivar este elemento</label>
            </div>
            {/* Botones de acción */}
            <div className="flex space-x-4">
                <button type="submit" className="px-4 py-2 bg-emerald-600 text-white rounded-md hover:bg-emerald-700"> {editingItem ? 'Guardar Cambios' : 'Agregar Elemento'} </button>
                {editingItem && <button type="button" onClick={resetForm} className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700">Cancelar</button>}
            </div>
        </form>
      </div>

      {/* Listado de Elementos */}
      <div className="mt-8">
        <h4 className="text-lg font-semibold text-white mb-4">Elementos Existentes</h4>
        <div className="overflow-x-auto">
          {semilleroItems.length === 0 ? (
            <p className="text-white text-center py-4">No hay elementos de semillero disponibles.</p>
          ) : (
            <table className="min-w-full divide-y divide-gray-700"><thead className="bg-gray-700"><tr><th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase">Título</th><th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase">Imágenes</th><th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase">Estado</th><th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-300 uppercase">Acciones</th></tr></thead><tbody className="bg-gray-800 divide-y divide-gray-700">{semilleroItems.map((item) => (<tr key={item._id} className={item.isArchived ? 'opacity-50 bg-gray-900' : ''}><td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-white">{item.title}</td><td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">{item.images.length} archivo(s)</td><td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">{item.isArchived ? 'Archivado' : 'Activo'}</td><td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium"><button onClick={() => handleEdit(item)} className="text-indigo-400 hover:text-indigo-600 mr-4">Editar</button><button onClick={() => handleArchiveToggle(item._id)} className={item.isArchived ? "text-green-400 hover:text-green-600 mr-4" : "text-yellow-400 hover:text-yellow-600 mr-4"}>{item.isArchived ? 'Desarchivar' : 'Archivar'}</button><button onClick={() => handleDelete(item._id)} className="text-red-400 hover:text-red-600">Eliminar</button></td></tr>))}</tbody></table>
          )}
        </div>
      </div>
    </div>
  );
}
