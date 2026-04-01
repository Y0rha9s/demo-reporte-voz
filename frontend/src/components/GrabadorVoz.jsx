import { useState, useEffect } from "react";
import axios from "axios";

export default function GrabadorVoz({ fase, onTextoGenerado, onImagenes, datosGuardados }) {
  const [grabando, setGrabando] = useState(false);
  const [cargando, setCargando] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState(null);
  const [textoCrudo, setTextoCrudo] = useState("");
  const [textoTecnico, setTextoTecnico] = useState("");
  const [audioUrl, setAudioUrl] = useState(null);
  const [imagenes, setImagenes] = useState([]);
  const [streamCam, setStreamCam] = useState(null);
  const [camaraActiva, setCamaraActiva] = useState(false);
  const [videoRef, setVideoRef] = useState(null);

  // Restaurar datos guardados al retroceder
  useEffect(() => {
    if (datosGuardados) {
      setTextoTecnico(datosGuardados.texto || "");
      setImagenes(datosGuardados.imagenes || []);
    } else {
      setTextoTecnico("");
      setTextoCrudo("");
      setAudioUrl(null);
      setImagenes([]);
    }
  }, [fase]);

  const iniciarGrabacion = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream, { mimeType: "audio/webm;codecs=opus" });
      const chunks = [];

      recorder.ondataavailable = (e) => chunks.push(e.data);
      recorder.onstop = async () => {
        const blob = new Blob(chunks, { type: "audio/webm;codecs=opus" });
        setAudioUrl(URL.createObjectURL(blob));
        await enviarAudio(blob);
        stream.getTracks().forEach(t => t.stop());
      };

      recorder.start();
      setMediaRecorder(recorder);
      setGrabando(true);
      setTextoCrudo("");
      setTextoTecnico("");
      setAudioUrl(null);
    } catch {
      alert("No se pudo acceder al micrófono.");
    }
  };

  const detenerGrabacion = () => {
    mediaRecorder.stop();
    setGrabando(false);
    setCargando(true);
  };

  const enviarAudio = async (blob) => {
    const formData = new FormData();
    formData.append("audio", blob, "audio.webm");
    formData.append("fase", fase);
    formData.append("mimeType", blob.type);

    try {
      const res = await axios.post("http://localhost:3000/api/procesar-audio", formData);
      setTextoCrudo(res.data.textoCrudo);
      setTextoTecnico(res.data.textoTecnico);
      onTextoGenerado(res.data.textoTecnico);
    } catch {
      alert("Error al procesar el audio.");
    } finally {
      setCargando(false);
    }
  };

  // ── Cámara ───────────────────────────────────────────
  const abrirCamara = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
      setStreamCam(stream);
      setCamaraActiva(true);
    } catch {
      alert("No se pudo acceder a la cámara.");
    }
  };

  const capturarFoto = () => {
    const canvas = document.createElement("canvas");
    canvas.width = videoRef.videoWidth;
    canvas.height = videoRef.videoHeight;
    canvas.getContext("2d").drawImage(videoRef, 0, 0);
    const dataUrl = canvas.toDataURL("image/jpeg", 0.85);
    agregarImagen(dataUrl);
    cerrarCamara();
  };

  const cerrarCamara = () => {
    if (streamCam) streamCam.getTracks().forEach(t => t.stop());
    setCamaraActiva(false);
    setStreamCam(null);
  };

  // ── Subir imagen ─────────────────────────────────────
  const handleSubirImagen = (e) => {
    Array.from(e.target.files).forEach(file => {
      const reader = new FileReader();
      reader.onload = (ev) => agregarImagen(ev.target.result);
      reader.readAsDataURL(file);
    });
    e.target.value = "";
  };

  const agregarImagen = async (dataUrl) => {
    const comprimida = await comprimirImagen(dataUrl);
    const nuevas = [...imagenes, comprimida];
    setImagenes(nuevas);
    onImagenes(nuevas);
  };

  const eliminarImagen = (idx) => {
    const nuevas = imagenes.filter((_, i) => i !== idx);
    setImagenes(nuevas);
    onImagenes(nuevas);
  };

  const comprimirImagen = (dataUrl) => {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const maxW = 800;
        const scale = Math.min(1, maxW / img.width);
        canvas.width = img.width * scale;
        canvas.height = img.height * scale;
        canvas.getContext("2d").drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL("image/jpeg", 0.6));
      };
      img.src = dataUrl;
    });
  };

  return (
    <div className="space-y-5">

      {/* Botón grabar */}
      <div>
        <label className="block text-xs font-semibold text-gray-400 uppercase mb-2">
          🎙️ Grabación de voz
        </label>
        <button
          onClick={grabando ? detenerGrabacion : iniciarGrabacion}
          disabled={cargando}
          className={`w-full py-3 rounded-xl font-semibold text-white transition-colors
            ${grabando ? "bg-red-500 hover:bg-red-600" : "bg-indigo-600 hover:bg-indigo-700"}
            ${cargando ? "opacity-50 cursor-not-allowed" : ""}
          `}
        >
          {grabando ? "⏹️ Detener grabación" : cargando ? "⏳ Procesando con IA..." : "🎙️ Iniciar grabación"}
        </button>
      </div>

      {/* Animación grabando */}
      {grabando && (
        <div className="flex items-center justify-center gap-1 h-8">
          {[12, 24, 32, 24, 12].map((h, i) => (
            <span
              key={i}
              className="w-1 bg-red-500 rounded-full animate-bounce"
              style={{ height: h, animationDelay: `${i * 0.1}s` }}
            />
          ))}
        </div>
      )}

      {/* Preview audio */}
      {audioUrl && <audio controls src={audioUrl} className="w-full" />}

      {/* Texto crudo */}
      {textoCrudo && (
        <div>
          <label className="block text-xs font-semibold text-gray-400 uppercase mb-1">
            Texto crudo
          </label>
          <textarea
            readOnly
            value={textoCrudo}
            className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-600 resize-none min-h-[70px]"
          />
        </div>
      )}

      {/* Texto técnico */}
      {textoTecnico && (
        <div>
          <label className="block text-xs font-semibold text-indigo-400 uppercase mb-1">
            ✅ Texto técnico generado por IA
          </label>
          <textarea
            readOnly
            value={textoTecnico}
            className="w-full p-3 bg-indigo-50 border border-indigo-200 rounded-lg text-sm text-indigo-800 resize-none min-h-[70px]"
          />
        </div>
      )}

      {/* Imágenes */}
      <div>
        <label className="block text-xs font-semibold text-gray-400 uppercase mb-2">
          📷 Imágenes de evidencia
        </label>
        <div className="flex gap-3 mb-3">
          <button
            onClick={abrirCamara}
            className="flex-1 py-2.5 border-2 border-dashed border-gray-200 rounded-xl text-sm font-medium text-gray-500 hover:border-indigo-400 hover:text-indigo-500 transition-colors"
          >
            📷 Tomar foto
          </button>
          <label className="flex-1 py-2.5 border-2 border-dashed border-gray-200 rounded-xl text-sm font-medium text-gray-500 hover:border-indigo-400 hover:text-indigo-500 transition-colors text-center cursor-pointer">
            🖼️ Subir imagen
            <input type="file" accept="image/*" multiple className="hidden" onChange={handleSubirImagen} />
          </label>
        </div>

        {/* Preview imágenes */}
        {imagenes.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {imagenes.map((img, i) => (
              <div key={i} className="relative w-20 h-20">
                <img src={img} className="w-full h-full object-cover rounded-lg border border-gray-200" />
                <button
                  onClick={() => eliminarImagen(i)}
                  className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 text-white rounded-full text-xs flex items-center justify-center"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal cámara */}
      {camaraActiva && (
        <div className="fixed inset-0 bg-black/80 z-50 flex flex-col items-center justify-center gap-4">
          <video
            ref={ref => { setVideoRef(ref); if (ref) ref.srcObject = streamCam; }}
            autoPlay
            playsInline
            className="w-full max-w-md rounded-xl"
          />
          <div className="flex gap-3">
            <button onClick={capturarFoto} className="px-6 py-3 bg-indigo-600 text-white rounded-xl font-semibold">
              📸 Capturar
            </button>
            <button onClick={cerrarCamara} className="px-6 py-3 bg-gray-600 text-white rounded-xl">
              Cancelar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}