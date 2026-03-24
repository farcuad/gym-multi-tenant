import pkg from 'whatsapp-web.js';
const { Client, LocalAuth } = pkg;
import qrcode from 'qrcode-terminal';

export const whatsappClient = new Client({
    authStrategy: new LocalAuth(),
    puppeteer: {
        handleSIGINT: false,
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage', 
            '--disable-accelerated-2d-canvas',
            '--no-first-run',
            '--no-zygote',
            '--single-process',
            '--disable-gpu'
        ],
    },
    webVersionCache: {
        type: 'remote',
        remotePath: 'https://raw.githubusercontent.com/wppconnect-team/wa-version/main/html/2.3000.1018917812-alpha.html',
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