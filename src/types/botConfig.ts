export interface IGymBotConfig {
    id?: string;               // UUID de la tabla
    gym_id: number;           // ID del gimnasio
    whaibot_id: string;       // El ID del bot en WhaiBot
    whaibot_key: string;      // El Client Key/API Key
    created_at?: Date;
    updated_at?: Date;
}

// Interfaz para cuando usas las credenciales en tus servicios
export interface IBotCredentials {
    botId: string;
    apiKey: string;
    fromMe: string;
}