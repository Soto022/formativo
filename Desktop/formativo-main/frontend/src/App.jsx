import React from "react";
import { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, useLocation, Navigate, Outlet } from "react-router-dom";

// 🔐 Contexto de Autenticación
import { AuthProvider, useAuth } from "./context/AuthContext";

// 🎨 Layout general
import Sidebar from "./components/Sidebar";
import Header from "./components/Header";
import Footer from "./components/Footer";

// 📄 Páginas
import { Home } from "./pages/Home";
import EcoAlas from "./pages/EcoAlas";
import Georutas from "./pages/Georutas";
import { Semillero } from "./pages/Semillero";
import { PlanetaVivo } from "./pages/PlanetaVivo";
import Zonotrichia from "./pages/Zonotrichia";
import VerdeSaber from "./pages/VerdeSaber";
import Login from "./pages/Login";
import Register from "./pages/Register";
import AdminDashboard from "./pages/AdminDashboard";

// 🧩 Componentes extras
import Lightbox from "./components/Lightbox";
import ScrollToTop from "./components/ScrollToTop";
import * as LucideIcons from "lucide-react";
import SonidoGlobal from "./components/SonidoGlobal";
import FondoAnimado from "./components/FondoAnimado";
import ChatBox from "./components/ChatBox";

// 🆕 Pantalla de carga
const LoadingScreen = () => (
  <div
    style={{
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      height: "100vh",
      backgroundColor: "#0f172a",
      flexDirection: "column",
      gap: "20px",
    }}
  >
    <div
      style={{
        width: "60px",
        height: "60px",
        border: "4px solid #1e293b",
        borderTop: "4px solid #10b981",
        borderRadius: "50%",
        animation: "spin 1s linear infinite",
      }}
    ></div>
    <h2 style={{ color: "#10b981", margin: 0 }}>🌿 Cargando EcoAlas...</h2>
    <style>
      {`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}
    </style>
  </div>
);

// 🧱 Error Boundary
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Error en la aplicación:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            padding: "20px",
            textAlign: "center",
            backgroundColor: "#1f2937",
            color: "#ef4444",
            minHeight: "100vh",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <h1 className="text-2xl font-bold mb-4">⚠️ Algo salió mal</h1>
          <p className="text-gray-300 mb-6">
            La aplicación encontró un error. Por favor, recarga la página.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors cursor-pointer"
          >
            Recargar Página
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

// 🔐 Rutas protegidas admin
const ProtectedRoute = () => {
  const { isAuthenticated, isAdmin } = useAuth();
  return isAuthenticated && isAdmin ? <Outlet /> : <Navigate to="/login" />;
};

// 🔐 Rutas protegidas usuario logueado
const AuthenticatedRoute = ({ children }) => {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? children : <Navigate to="/login" />;
};

const AppContent = () => {
  const [isSidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [darkMode, setDarkMode] = useState(true);
  const [lightboxData, setLightboxData] = useState(null);
  const [loading, setLoading] = useState(true);

  const location = useLocation();
  const { isAuthenticated, currentUser, logout } = useAuth();

  const openLightbox = (data) => setLightboxData(data);
  const closeLightbox = () => setLightboxData(null);

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 1000);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", darkMode);
  }, [darkMode]);

  if (loading) return <LoadingScreen />;

  const isAuthPage =
    location.pathname.startsWith("/login") ||
    location.pathname.startsWith("/register") ||
    location.pathname.startsWith("/admin");

  const hideAppShell = isAuthPage && !isAuthenticated;

  if (hideAppShell) {
    return (
      <>
        <SonidoGlobal />
        <FondoAnimado />

        <div className="relative z-10">
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/admin/*" element={<Navigate to="/login" />} />
          </Routes>
        </div>
      </>
    );
  }

  return (
    <>
      <SonidoGlobal />
      <FondoAnimado />

      <div
        className={`flex flex-col min-h-screen overflow-x-hidden relative z-10 ${
          darkMode ? "bg-gray-900 text-gray-200" : "bg-gray-100 text-gray-800"
        }`}
      >
        {lightboxData && <Lightbox data={lightboxData} onClose={closeLightbox} />}

        <div className="flex flex-1">
          <Sidebar
            isCollapsed={isSidebarCollapsed}
            toggleSidebar={() => setSidebarCollapsed(!isSidebarCollapsed)}
            darkMode={darkMode}
            toggleDarkMode={() => setDarkMode(!darkMode)}
          />

          <div
            className={`flex flex-col flex-1 min-w-0 transition-all duration-300 ${
              isSidebarCollapsed ? "md:ml-20" : "md:ml-64"
            }`}
          >
            <Header
              isAuthenticated={isAuthenticated}
              currentUser={currentUser}
              logout={logout}
            />

            <main className="flex-1 p-4 min-w-0 overflow-x-hidden">
              <Routes>
                <Route path="/" element={<Home darkMode={darkMode} openLightbox={openLightbox} />} />
                <Route path="/ecoalas" element={<EcoAlas openLightbox={openLightbox} />} />
                <Route path="/georutas" element={<Georutas />} />

                <Route path="/semillero" element={<Semillero openLightbox={openLightbox} />} />

                <Route path="/planetavivo" element={<PlanetaVivo openLightbox={openLightbox} />} />
                <Route path="/zonotrichia" element={<Zonotrichia />} />
                <Route path="/verdesaber" element={<VerdeSaber />} />

                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />

                {/* Rutas Admin */}
                <Route element={<ProtectedRoute />}>
                  <Route path="/admin/semillero" element={<AdminDashboard />} />
                </Route>

                {/* 404 */}
                <Route
                  path="*"
                  element={
                    <div className="text-center p-8 bg-gray-800 rounded-lg shadow-lg mx-4">
                      <h1 className="text-6xl font-bold text-red-500 mb-4">404</h1>
                      <h2 className="text-2xl font-semibold text-white mb-4">
                        Página no encontrada
                      </h2>
                      <p className="text-gray-300 mb-6">
                        La página que buscas no existe.
                      </p>
                      <a
                        href="/"
                        className="inline-block px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors"
                      >
                        Volver al Inicio
                      </a>
                    </div>
                  }
                />
              </Routes>
            </main>
          </div>
        </div>

        <Footer />

        <ChatBox />
      </div>
    </>
  );
};

function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <Router>
          <ScrollToTop />
          <AppContent />
        </Router>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export { App };
