import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Dashboard() {
  const { usuario } = useAuth();

  return (
    <div>
      {/* Bienvenida */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-800">
          Bienvenido, {usuario?.nombre} 👋
        </h1>
        <p className="text-gray-400 text-sm mt-1">
          {usuario?.sucursal} · {usuario?.rol}
        </p>
      </div>

      {/* Cards resumen */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <p className="text-sm text-gray-400">Reportes totales</p>
          <p className="text-3xl font-bold text-gray-800 mt-1">0</p>
        </div>
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <p className="text-sm text-gray-400">En progreso</p>
          <p className="text-3xl font-bold text-indigo-600 mt-1">0</p>
        </div>
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <p className="text-sm text-gray-400">Completados</p>
          <p className="text-3xl font-bold text-green-500 mt-1">0</p>
        </div>
      </div>

      {/* Acción principal */}
      <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-6 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-indigo-800">Nuevo reporte</h2>
          <p className="text-sm text-indigo-400 mt-1">
            Crea un reporte técnico con grabación de voz
          </p>
        </div>
        <Link
          to="/reportes/nuevo"
          className="bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold px-5 py-2.5 rounded-lg transition-colors"
        >
          + Crear reporte
        </Link>
      </div>
    </div>
  );
}