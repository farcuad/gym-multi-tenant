import QRCode from 'qrcode';
// @ts-ignore
import * as html_pdf from 'html-pdf-node';

export async function generarCarnetBuffer(datos: {gymName: string, userName: string, cedula: string, phone: string, planName: string, idMembresia: number}): Promise<Buffer> {
    
    // 1. URL de validación para el QR
    const urlVerificacion = `https://frontend-gym-topaz.vercel.app/verify/${datos.idMembresia}`;
    const qrBase64 = await QRCode.toDataURL(urlVerificacion);

    // 2. HTML del Carnet (Inline para rapidez, puedes usar un template aparte)
    const htmlContent = `
    <html>
    <head>
        <style>
            body { margin: 0; padding: 0; }
            .card {
                width: 85mm; height: 55mm;
                background: white; border: 1px solid #ddd;
                border-radius: 8px; display: flex;
                font-family: sans-serif; overflow: hidden;
            }
            .left { width: 65%; padding: 15px; display: flex; flex-direction: column; justify-content: space-between; }
            .right { width: 35%; background: #f8f9fa; display: flex; flex-direction: column; align-items: center; justify-content: center; border-left: 1px dashed #ccc; }
            .gym-title { color: #e63946; font-size: 18px; font-weight: bold; margin-bottom: 10px; }
            .info { font-size: 11px; line-height: 1.5; color: #333; }
            .label { font-weight: bold; color: #666; }
            .qr-img { width: 80px; height: 80px; }
            .footer-text { font-size: 8px; color: #aaa; margin-top: 10px; }
        </style>
    </head>
    <body>
        <div class="card">
            <div class="left">
                <div class="gym-title">${datos.gymName}</div>
                <div class="info">
                    <div><span class="label">Socio:</span> ${datos.userName}</div>
                    <div><span class="label">Cédula:</span> ${datos.cedula}</div>
                    <div><span class="label">Tel:</span> ${datos.phone}</div>
                    <div><span class="label">Plan:</span> ${datos.planName}</div>
                </div>
                <div style="font-size: 10px; font-weight: bold; color: #457b9d;">Socio FitLog</div>
            </div>
            <div class="right">
                <img src="${qrBase64}" class="qr-img">
                <div class="footer-text">ESCANEAME</div>
            </div>
        </div>
    </body>
    </html>
    `;

    // 3. Opciones de generación
    const file = { content: htmlContent };
    const options = { 
        width: '85mm', 
        height: '55mm', 
        printBackground: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox'] // Importante para que corra en tu VPS
    };

    // 4. Generar PDF
    return await html_pdf.generatePdf(file, options);
}