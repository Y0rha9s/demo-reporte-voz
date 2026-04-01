import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import axios from "axios";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [cargando, setCargando] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setCargando(true);
    setError("");

    try {
      const res = await axios.post(`${import.meta.env.VITE_API_URL}/api/auth/login`, {
        email,
        password,
      });
      login(res.data.usuario);
      navigate("/");
    } catch (err) {
      setError(err.response?.data?.error || "Error al iniciar sesión");
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl shadow-md w-full max-w-md p-8">
        
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="text-4xl mb-3">🔧</div>
          <h1 className="text-2xl font-bold text-gray-800">ReportES</h1>
          <p className="text-gray-400 text-sm mt-1">Sistema de Reportes Técnicos</p>
        </div>

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Correo electrónico
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="operador@empresa.com"
              required
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Contraseña
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {error && (
            <p className="text-red-500 text-sm text-center">{error}</p>
          )}

          <button
            type="submit"
            disabled={cargando}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2.5 rounded-lg text-sm transition-colors disabled:opacity-50"
          >
            {cargando ? "Iniciando sesión..." : "Iniciar sesión"}
          </button>
        </form>
      </div>
    </div>
  );
}