// src/@types/whisper.d.ts

declare module 'node-whisper' {
    interface WhisperOptions {
        modelName?: string;
        autoDownloadModel?: boolean;
        verbose?: boolean;
        whisperOptions?: {
            language?: string;
            word_timestamps?: boolean;
            [key: string]: any;
        };
    }

    // Exportamos la función directamente como el valor por defecto
    // Esto evita el conflicto de "Duplicate identifier"
    export default function(
        filePath: string,
        options?: WhisperOptions
    ): Promise<any>;
}