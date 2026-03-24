import pkg from 'whatsapp-web.js';
const { Client, LocalAuth } = pkg;
import qrcode from 'qrcode-terminal';

export const whatsappClient = new Client({
    authStrategy: new LocalAuth(),
    puppeteer: {
        handleSIGINT: false,
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox'
        ],
    }
});

export const initWhatsApp = () => {
    whatsappClient.on('qr', (qr: string) => {
        console.log('Escanea este código QR para vincular el bot de tu Gym:');
        qrcode.generate(qr, { small: true });
    });

    whatsappClient.on('ready', () => {
        console.log('✅ WhatsApp está conectado y listo para enviar mensajes.');
    });

    whatsappClient.on('auth_failure', (msg: string) => {
        console.error('❌ Error de autenticación:', msg);
    });

    whatsappClient.initialize().catch(console.error);
};