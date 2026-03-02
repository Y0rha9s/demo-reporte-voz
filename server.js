import express from "express";
import multer from "multer";
import Groq from "groq-sdk";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const upload = multer({ dest: "uploads/" });
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

app.use(express.static(__dirname));

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

        // ── IA 1: Whisper → texto crudo ──────────────────────
        const transcripcion = await groq.audio.transcriptions.create({
            file: fs.createReadStream(audioNuevo),
            model: "whisper-large-v3",
            language: "es",
            response_format: "text",
            prompt: "Transcripción de reporte técnico en español."
        });
        const textoCrudo = transcripcion.text ?? transcripcion;

        // ── IA 2: LLM → texto técnico estructurado ───────────
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

app.listen(3000, () => console.log("✅ Servidor corriendo en http://localhost:3000"));