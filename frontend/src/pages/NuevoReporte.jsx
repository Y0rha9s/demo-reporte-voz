import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import GrabadorVoz from "../components/GrabadorVoz";
import axios from "axios";

const FASES = [
  { key: "pre-diagnostico", label: "Pre-Diagnóstico", tipo: "audio" },
  { key: "analisis", label: "Análisis", tipo: "texto" },
  { key: "diagnostico", label: "Diagnóstico", tipo: "audio" },
  { key: "resolucion", label: "Resolución", tipo: "texto" },
  { key: "cierre", label: "Cierre", tipo: "texto" },
];

export default function NuevoReporte() {
  const [faseActual, setFaseActual] = useState(0);
  const [datosPorFase, setDatosPorFase] = useState({});
  const [guardando, setGuardando] = useState(false);
  const { usuario } = useAuth();
  const navigate = useNavigate();

  const faseCompleta = (key) => {
    const fase = FASES.find(f => f.key === key);
    const datos = datosPorFase[key];
    if (!datos) return false;
    if (fase.tipo === "audio") return datos.texto && datos.imagenes?.length > 0;
    if (fase.tipo === "texto") return datos.texto?.trim().length > 0;
    return false;
  };

  const handleTextoGenerado = (texto) => {
    const key = FASES[faseActual].key;
    setDatosPorFase(prev => ({
      ...prev,
      [key]: { ...prev[key], texto }
    }));
  };

  const handleImagenes = (imagenes) => {
    const key = FASES[faseActual].key;
    setDatosPorFase(prev => ({
      ...prev,
      [key]: { ...prev[key], imagenes }
    }));
  };

  const handleTextoLibre = (e) => {
    const key = FASES[faseActual].key;
    setDatosPorFase(prev => ({
      ...prev,
      [key]: { ...prev[key], texto: e.target.value }
    }));
  };

  const handleFinalizar = async () => {
    setGuardando(true);
    try {
      await axios.post(`${import.meta.env.VITE_API_URL}/api/reportes`, {
        usuario_id: usuario.id,
        sucursal_id: usuario.sucursal_id,
        fases: datosPorFase
      });
      navigate("/reportes");
    } catch (err) {
      alert("Error al guardar el reporte.");
    } finally {
      setGuardando(false);
    }
  };

  const puedeAvanzar = faseCompleta(FASES[faseActual].key);
  const puedRetroceder = faseActual > 0;
  const fase = FASES[faseActual];

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Nuevo Reporte</h1>
        <p className="text-gray-400 text-sm mt-1">Completa cada fase del reporte técnico</p>
      </div>

      {/* Stepper */}
      <div className="flex items-center gap-2 mb-8 overflow-x-auto pb-2">
        {FASES.map((f, i) => (
          <div key={f.key} className="flex items-center gap-2">
            <div className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap
              ${i === faseActual
                ? "bg-indigo-600 text-white"
                : faseCompleta(f.key)
                ? "bg-green-100 text-green-700"
                : "bg-gray-100 text-gray-400"
              }`}
            >
              {faseCompleta(f.key) ? "✓" : i + 1} {f.label}
            </div>
            {i < FASES.length - 1 && (
              <div className={`w-6 h-0.5 ${faseCompleta(f.key) ? "bg-green-300" : "bg-gray-200"}`} />
            )}
          </div>
        ))}
      </div>

      {/* Card fase actual */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center gap-2 mb-6">
          <h2 className="text-lg font-semibold text-gray-800">{fase.label}</h2>
          <span className={`text-xs px-2 py-0.5 rounded-full font-medium
            ${fase.tipo === "audio" ? "bg-indigo-100 text-indigo-600" : "bg-gray-100 text-gray-500"}`}
          >
            {fase.tipo === "audio" ? "🎙️ Audio + Imagen" : "✏️ Texto libre"}
          </span>
        </div>

        {/* Contenido según tipo de fase */}
        {fase.tipo === "audio" ? (
          <GrabadorVoz
            fase={fase.key}
            onTextoGenerado={handleTextoGenerado}
            onImagenes={handleImagenes}
            datosGuardados={datosPorFase[fase.key]}
          />
        ) : (
          <textarea
            value={datosPorFase[fase.key]?.texto || ""}
            onChange={handleTextoLibre}
            placeholder={`Describe el ${fase.label.toLowerCase()}...`}
            className="w-full p-3 border border-gray-200 rounded-lg text-sm text-gray-700 resize-none min-h-[160px] focus:outline-none focus:ring-2 focus:ring-indigo-400"
          />
        )}

        {/* Aviso si incompleta */}
        {!puedeAvanzar && (
          <p className="text-xs text-amber-500 text-center mt-4">
            {fase.tipo === "audio"
              ? "⚠️ Debes grabar el audio y subir al menos una imagen para continuar"
              : "⚠️ Debes escribir algo para continuar"}
          </p>
        )}

        {/* Navegación */}
        <div className="flex justify-between mt-6">
          <button
            onClick={() => setFaseActual(i => i - 1)}
            disabled={!puedRetroceder}
            className="px-5 py-2 text-sm text-gray-500 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            ← Anterior
          </button>
          {faseActual < FASES.length - 1 ? (
            <button
              onClick={() => setFaseActual(i => i + 1)}
              disabled={!puedeAvanzar}
              className="px-5 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              Siguiente →
            </button>
          ) : (
            <button
              onClick={handleFinalizar}
              disabled={!puedeAvanzar || guardando}
              className="px-5 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              {guardando ? "Guardando..." : "Finalizar reporte ✓"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}