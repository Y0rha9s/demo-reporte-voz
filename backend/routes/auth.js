import express from "express";
import bcrypt from "bcryptjs";
import pool from "../db.js";

const router = express.Router();

router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    // Buscar usuario en scania.usuarios
    const resultado = await pool.query(
      `SELECT u.*, s.nombre as sucursal_nombre 
       FROM scania.usuarios u
       LEFT JOIN scania.sucursales s ON s.id = u.sucursal_id
       WHERE u.email = $1 AND u.activo = true`,
      [email]
    );

    if (resultado.rows.length === 0) {
      return res.status(401).json({ error: "Credenciales incorrectas" });
    }

    const usuario = resultado.rows[0];

    // Verificar contraseña
    const passwordValida = await bcrypt.compare(password, usuario.password_hash);
    if (!passwordValida) {
      return res.status(401).json({ error: "Credenciales incorrectas" });
    }

    // Responder con datos del usuario
    res.json({
      usuario: {
        id: usuario.id,
        nombre: usuario.nombre,
        email: usuario.email,
        rol: usuario.rol,
        sucursal: usuario.sucursal_nombre
      }
    });

  } catch (error) {
    console.error("Error login:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

export default router;