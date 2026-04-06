// src/tests/test.whisper.ts
import whisper from "whisper-node";

declare module "whisper-node" {
  interface WhisperOptions {
    modelName?: string;
    autoDownloadModel?: boolean;
    verbose?: boolean;
    whisperOptions?: {
      language?: string;
      gen_file_txt?: boolean;
      gen_file_vtt?: boolean;
      gen_file_srt?: boolean;
      word_timestamps?: boolean;
    };
  }

  export default function (
    filePath: string,
    options?: WhisperOptions,
  ): Promise<any>;
}

async function runTest() {
  try {
    console.log("🧪 Iniciando test de Whisper...");
    const audioFile = "./temp_audio/test.wav";

    const transcript = await whisper(audioFile, {
      modelName: "base",
      whisperOptions: {
        language: "es",
      },
    });

    console.log("✅ Test completado con éxito:");
    console.log(transcript);
  } catch (error) {
    console.error("❌ Error en el test:", error);
  }
}
