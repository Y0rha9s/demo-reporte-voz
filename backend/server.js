import dotenv from "dotenv";
import { fileURLToPath } from "url";
import path from "path";
import cors from "cors";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '.env') });

import express from "express";
import multer from "multer";
import Groq from "groq-sdk";
import fs from "fs";
import pool from "./db.js";
import authRoutes from "./routes/auth.js";
import reportesRoutes from "./routes/reportes.js";

const app = express();
app.use(cors({ origin: "http://localhost:5173" }));
const upload = multer({ dest: "uploads/" });
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });


app.use(express.json({ limit: "100mb" }));
app.use(express.urlencoded({ limit: "100mb", extended: true }));
app.use("/api/auth", authRoutes);
app.use("/api/reportes", reportesRoutes);

app.post("/api/procesar-audio", upload.single("audio"), async (req, res) => {
    const fase = req.body.fase || "diagnóstico";
    const audioPath = req.file.path;
    const mimeType = req.body.mimeType || "audio/webm";

    let ext = ".webm";
    if (mimeType.includes("ogg")) ext = ".ogg";
    if (mimeType.includes("mp4")) ext = ".mp4";

    const audioNuevo = audioPath + ext;

    try {
        fs.renameSync(audioPath, audioNuevo);

        const transcripcion = await groq.audio.transcriptions.create({
            file: fs.createReadStream(audioNuevo),
            model: "whisper-large-v3",
            language: "es",
            response_format: "text",
            prompt: "Transcripción de reporte técnico en español."
        });
        const textoCrudo = transcripcion.text ?? transcripcion;

        const prompt = `Eres un asistente técnico especializado en redacción de informes de fallas.
Tu única tarea es tomar el siguiente texto hablado por un técnico y reescribirlo en lenguaje técnico formal y profesional.
NO inventes información, NO agregues datos que no estén en el texto original.
Solo mejora la redacción y el vocabulario técnico.
Fase del informe: ${fase}.
Texto original: "${textoCrudo}"
Responde SOLO con el texto reformulado, sin explicaciones adicionales.`;

        const respuesta = await groq.chat.completions.create({
            model: "llama-3.3-70b-versatile",
            messages: [{ role: "user", content: prompt }],
            temperature: 0.3,
        });
        const textoTecnico = respuesta.choices[0].message.content;

        fs.unlinkSync(audioNuevo);

        res.json({ textoCrudo, textoTecnico });

    } catch (error) {
        if (fs.existsSync(audioNuevo)) fs.unlinkSync(audioNuevo);
        console.error("Error:", error);
        res.status(500).json({ error: error.message });
    }
});

app.use(express.static(__dirname));

pool.query("SELECT NOW()").then(res => {
    console.log("✅ BD conectada:", res.rows[0].now);
}).catch(err => {
    console.error("❌ Error BD:", err.message);
});

app.listen(3000, () => console.log("✅ Servidor corriendo en http://localhost:3000"));