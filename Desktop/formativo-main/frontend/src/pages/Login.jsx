import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { Bird, User, Lock } from 'lucide-react';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const user = await login(username, password);
      if (user) {
        navigate(user.role === 'admin' ? '/admin/semillero' : '/');
      }
    } catch (err) {
      setError(err.message || 'Credenciales incorrectas. Intenta de nuevo.');
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-900 text-white">
      <div className="w-full max-w-md m-4">
        <div className="bg-gray-800 border border-gray-700 rounded-2xl shadow-2xl p-8">
          <div className="text-center mb-8">
            <Bird className="mx-auto h-12 w-12 text-emerald-400" />
            <h1 className="text-3xl font-bold mt-4">Iniciar Sesion</h1>
            <p className="text-gray-400 mt-2">Bienvenido de nuevo.</p>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="relative">
                <label htmlFor="username" className="sr-only">Usuario</label>
                <User className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-500" />
                <input
                    type="text"
                    id="username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full bg-gray-900 text-white pl-12 pr-4 py-3 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
                    placeholder="Nombre de usuario"
                    required
                />
            </div>
            
            <div className="relative">
                <label htmlFor="password" className="sr-only">Contrasena</label>
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-500" />
                <input
                    type="password"
                    id="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-gray-900 text-white pl-12 pr-4 py-3 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
                    placeholder="Contrasena"
                    required
                />
            </div>

            {error && <p className="text-red-500 text-sm text-center">{error}</p>}
            
            <div>
              <button
                type="submit"
                className="w-full bg-emerald-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-emerald-500 transition-transform duration-300 ease-in-out hover:scale-[1.02] shadow-lg"
              >
                Ingresar
              </button>
            </div>
          </form>

          <div className="text-center mt-6">
            <p className="text-sm text-gray-400">
              ¿No tienes una cuenta?{' '}
              <Link to="/register" className="font-medium text-emerald-400 hover:text-emerald-500">
                Registrate aqui
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
