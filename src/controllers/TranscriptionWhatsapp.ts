import { whisper } from "whisper-node";
import fs from "fs";
import path from "path";
import ffmpeg from "fluent-ffmpeg";

interface MulterRequest extends Request {
  file?: Express.Multer.File;
}

export const transcribeAudioController = async (req: Request, res: any) => {
  const reqWithFile = req as MulterRequest;
  const file = reqWithFile.file;

  if (!file) {
    return res.status(400).json({ success: false, error: "No se recibió audio" });
  }

  const originalPath = path.resolve(file.path);
  const wavPath = originalPath + ".wav";

  try {
    console.log(`🎙️ Procesando audio: ${file.originalname}`);
    
    // 1. Convertir a WAV (16kHz, mono, pcm_s16le) que es lo que requiere whisper.cpp
    console.log("⏳ Convirtiendo a WAV (16kHz, mono)...");
    await new Promise((resolve, reject) => {
      ffmpeg(originalPath)
        .toFormat("wav")
        .audioChannels(1)
        .audioFrequency(16000)
        .on("end", () => {
          console.log("✅ Conversión completada");
          resolve(true);
        })
        .on("error", (err) => {
          console.error("❌ Error en ffmpeg:", err);
          reject(err);
        })
        .save(wavPath);
    });

    // 2. Transcribir el archivo WAV
    console.log("⏳ Iniciando transcripción...");
    const result = await whisper(wavPath, {
      modelPath: "models/ggml-base.bin",
      whisperOptions: {
        language: 'es'
      }
    } as any);

    let fullText = "";
    if (result) {
      if (typeof result === "string") {
        fullText = result;
      } else if (Array.isArray(result)) {
        fullText = result.map((s: any) => s.speech || "").join(" ");
      } else if (typeof result === "object") {
        fullText = (result as any).speech || "";
      }
    }

    console.log("📝 Texto obtenido:", fullText.substring(0, 50) + "...");

    // 3. Limpieza de archivos temporales
    if (fs.existsSync(originalPath)) fs.unlinkSync(originalPath);
    if (fs.existsSync(wavPath)) fs.unlinkSync(wavPath);

    return res.json({
      success: true,
      text: fullText.trim()
    });

  } catch (error: any) {
    console.error("❌ Error en el proceso:", error);
    
    // Limpieza en caso de error
    if (fs.existsSync(originalPath)) fs.unlinkSync(originalPath);
    if (fs.existsSync(wavPath)) fs.unlinkSync(wavPath);
    
    return res.status(500).json({ 
      success: false, 
      error: error.message || "Error interno en la transcripción" 
    });
  }
};
