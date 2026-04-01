import express from "express";
import pool from "../db.js";

const router = express.Router();

// Generar código único de reporte
const generarCodigo = () => {
    const fecha = new Date();
    const año = fecha.getFullYear().toString().slice(-2);
    const mes = String(fecha.getMonth() + 1).padStart(2, "0");
    const random = Math.floor(Math.random() * 9000) + 1000;
    return `REP-${año}${mes}-${random}`;
};

// POST /api/reportes — crear reporte completo
router.post("/", async (req, res) => {
    const { usuario_id, fases } = req.body;

    const client = await pool.connect();
    try {
        await client.query("BEGIN");

        // 1. Obtener sucursal del usuario
        const usuarioRes = await client.query(
            `SELECT sucursal_id FROM scania.usuarios WHERE id = $1`,
            [usuario_id]
        );
        const sucursal_id = usuarioRes.rows[0]?.sucursal_id;

        // 2. Crear el reporte
        const codigo = generarCodigo();
        const reporteRes = await client.query(
            `INSERT INTO scania.reportes (codigo, usuario_id, sucursal_id, estado)
       VALUES ($1, $2, $3, 'completado') RETURNING id`,
            [codigo, usuario_id, sucursal_id]
        );
        const reporte_id = reporteRes.rows[0].id;

        // 3. Guardar cada fase
        const fasesOrden = ["pre-diagnostico", "analisis", "diagnostico", "resolucion", "cierre"];
        for (const key of fasesOrden) {
            const datos = fases[key];
            if (!datos) continue;

            const faseRes = await client.query(
                `INSERT INTO scania.fases_reporte (reporte_id, fase, texto_tecnico)
         VALUES ($1, $2, $3) RETURNING id`,
                [reporte_id, key, datos.texto]
            );
            const fase_id = faseRes.rows[0].id;

            // Guardar imágenes de la fase
            if (datos.imagenes?.length > 0) {
                for (const imgBase64 of datos.imagenes) {
                    await client.query(
                        `INSERT INTO scania.imagenes_reporte (reporte_id, fase_id, url)
                 VALUES ($1, $2, $3)`,
                        [reporte_id, fase_id, imgBase64]
                    );
                }
            }
        }

        await client.query("COMMIT");
        res.json({ ok: true, codigo });

    } catch (error) {
        await client.query("ROLLBACK");
        console.error("Error al guardar reporte:", error);
        res.status(500).json({ error: error.message });
    } finally {
        client.release();
    }
});

// GET /api/reportes — listar reportes
router.get("/", async (req, res) => {
    try {
        const resultado = await pool.query(
            `SELECT r.id, r.codigo, r.estado, r.created_at,
              u.nombre as tecnico, s.nombre as sucursal
       FROM scania.reportes r
       LEFT JOIN scania.usuarios u ON u.id = r.usuario_id
       LEFT JOIN scania.sucursales s ON s.id = r.sucursal_id
       ORDER BY r.created_at DESC`
        );
        res.json(resultado.rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// GET /api/reportes/:id — detalle de un reporte con sus fases
router.get("/:id", async (req, res) => {
    const { id } = req.params;
    try {
        const reporteRes = await pool.query(
            `SELECT r.*, u.nombre as tecnico, s.nombre as sucursal
       FROM scania.reportes r
       LEFT JOIN scania.usuarios u ON u.id = r.usuario_id
       LEFT JOIN scania.sucursales s ON s.id = r.sucursal_id
       WHERE r.id = $1`,
            [id]
        );

        const fasesRes = await pool.query(
            `SELECT f.*, 
            COALESCE(
              json_agg(i.url) FILTER (WHERE i.url IS NOT NULL), 
              '[]'
            ) as imagenes
                FROM scania.fases_reporte f
                LEFT JOIN scania.imagenes_reporte i ON i.fase_id = f.id
                WHERE f.reporte_id = $1
                GROUP BY f.id
                ORDER BY f.created_at ASC`,
            [id]
        );

        res.json({
            ...reporteRes.rows[0],
            fases: fasesRes.rows
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

export default router;