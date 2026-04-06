// src/@types/whisper-node.d.ts
declare module 'whisper-node' {
    export interface WhisperOptions {
        modelName?: string;
        whisperOptions?: {
            language?: string;
            gen_file_txt?: boolean;
            gen_file_vtt?: boolean;
            gen_file_srt?: boolean;
            word_timestamps?: boolean;
        };
    }

    export interface WhisperTranscript {
        start: string;
        end: string;
        speech: string;
    }

    export function whisper(
        filePath: string,
        options?: WhisperOptions
    ): Promise<WhisperTranscript[]>;
}