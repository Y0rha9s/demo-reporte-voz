import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import jsPDF from "jspdf";

export default function Reportes() {
  const [reportes, setReportes] = useState([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    axios.get("http://localhost:3000/api/reportes")
      .then(res => setReportes(res.data))
      .catch(err => console.error(err))
      .finally(() => setCargando(false));
  }, []);

  const descargarPDF = async (reporte) => {
    const res = await axios.get(`http://localhost:3000/api/reportes/${reporte.id}`);
    const datos = res.data;

    const doc = new jsPDF();
    const fecha = new Date(reporte.created_at).toLocaleDateString("es-CL");

    // Encabezado
    doc.setFont("helvetica", "bold");
    doc.setFontSize(18);
    doc.text("Reporte Técnico", 20, 20);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(120);
    doc.text(`Código: ${reporte.codigo}`, 20, 30);
    doc.text(`Técnico: ${reporte.tecnico}`, 20, 36);
    doc.text(`Sucursal: ${reporte.sucursal}`, 20, 42);
    doc.text(`Fecha: ${fecha}`, 20, 48);

    doc.setDrawColor(200);
    doc.line(20, 52, 190, 52);

    let y = 60;

    // Fases
    const fasesNombre = {
      "pre-diagnostico": "Pre-Diagnóstico",
      "analisis": "Análisis",
      "diagnostico": "Diagnóstico",
      "resolucion": "Resolución",
      "cierre": "Cierre"
    };

    for (const fase of datos.fases) {
      if (y > 250) { doc.addPage(); y = 20; }

      doc.setFont("helvetica", "bold");
      doc.setFontSize(12);
      doc.setTextColor(79, 70, 229);
      doc.text(fasesNombre[fase.fase] || fase.fase, 20, y);
      y += 7;

      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.setTextColor(30);
      const lineas = doc.splitTextToSize(fase.texto_tecnico || "", 170);
      doc.text(lineas, 20, y);
      y += lineas.length * 6 + 8;

      // Imágenes de la fase
      if (fase.imagenes?.length > 0) {
        for (const imgBase64 of fase.imagenes) {
          if (y + 65 > 280) { doc.addPage(); y = 20; }
          doc.addImage(imgBase64, "JPEG", 20, y, 80, 60);
          y += 70;
        }
      }
      y += 5;
    }

    doc.save(`${reporte.codigo}.pdf`);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Reportes</h1>
          <p className="text-gray-400 text-sm mt-1">Historial de reportes técnicos</p>
        </div>
        <Link
          to="/reportes/nuevo"
          className="bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold px-5 py-2.5 rounded-lg transition-colors"
        >
          + Nuevo reporte
        </Link>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              <th className="text-left px-5 py-3 text-gray-500 font-medium">Código</th>
              <th className="text-left px-5 py-3 text-gray-500 font-medium">Técnico</th>
              <th className="text-left px-5 py-3 text-gray-500 font-medium">Sucursal</th>
              <th className="text-left px-5 py-3 text-gray-500 font-medium">Fecha</th>
              <th className="text-left px-5 py-3 text-gray-500 font-medium">Estado</th>
              <th className="text-left px-5 py-3 text-gray-500 font-medium"></th>
            </tr>
          </thead>
          <tbody>
            {cargando ? (
              <tr>
                <td colSpan={6} className="text-center py-12 text-gray-400">Cargando...</td>
              </tr>
            ) : reportes.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center py-12 text-gray-400">No hay reportes aún</td>
              </tr>
            ) : (
              reportes.map(r => (
                <tr key={r.id} className="border-t border-gray-50 hover:bg-gray-50 transition-colors">
                  <td className="px-5 py-3 font-mono text-indigo-600 font-medium">{r.codigo}</td>
                  <td className="px-5 py-3 text-gray-700">{r.tecnico}</td>
                  <td className="px-5 py-3 text-gray-500">{r.sucursal}</td>
                  <td className="px-5 py-3 text-gray-500">
                    {new Date(r.created_at).toLocaleDateString("es-CL")}
                  </td>
                  <td className="px-5 py-3">
                    <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                      {r.estado}
                    </span>
                  </td>
                  <td className="px-5 py-3">
                    <button
                      onClick={() => descargarPDF(r)}
                      className="text-xs bg-indigo-50 hover:bg-indigo-100 text-indigo-600 font-medium px-3 py-1.5 rounded-lg transition-colors"
                    >
                      📄 PDF
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}