import { Outlet, Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Layout() {
  const { usuario, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Navbar */}
      <nav className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <span className="text-indigo-600 font-bold text-lg">🔧 ReportES</span>
            <div className="flex gap-6">
              <Link
                to="/"
                className="text-sm text-gray-600 hover:text-indigo-600 font-medium transition-colors"
              >
                Dashboard
              </Link>
              <Link
                to="/reportes"
                className="text-sm text-gray-600 hover:text-indigo-600 font-medium transition-colors"
              >
                Reportes
              </Link>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-sm font-semibold text-gray-800">{usuario?.nombre}</p>
              <p className="text-xs text-gray-400">{usuario?.rol}</p>
            </div>
            <div className="w-9 h-9 rounded-full bg-indigo-600 flex items-center justify-center text-white font-bold text-sm">
              {usuario?.nombre?.charAt(0).toUpperCase()}
            </div>
            <button
              onClick={handleLogout}
              className="text-sm text-gray-400 hover:text-red-500 transition-colors"
            >
              Salir
            </button>
          </div>
        </div>
      </nav>

      {/* Contenido */}
      <main className="max-w-6xl mx-auto px-4 py-8">
        <Outlet />
      </main>
    </div>
  );
}