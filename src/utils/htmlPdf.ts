import QRCode from 'qrcode';
// @ts-ignore
import * as html_pdf from 'html-pdf-node';

export async function generarCarnetBuffer(datos: {gymName: string, userName: string, cedula: string, phone: string, planName: string, idMembresia: number}): Promise<Buffer> {
    
    // 1. URL de validación para el QR
    const frontendUrl = `https://frontend-gym-topaz.vercel.app`
    const urlVerificacion = `${frontendUrl}/verify/${datos.idMembresia}`;
    const qrBase64 = await QRCode.toDataURL(urlVerificacion);

    // 2. HTML del Carnet (Inline para rapidez, puedes usar un template aparte)
    const htmlContent = `
    <style>
    /* Eliminamos márgenes del navegador para que no cree páginas extra */
    @page { margin: 0; }
    body { margin: 0; padding: 0; background-color: #f0f0f0; }

    .carnet {
        width: 6.7cm;
        height: 9.8cm;
        background: #ffffff;
        border: 1px solid #e0e0e0;
        box-sizing: border-box;
        font-family: 'Segoe UI', Roboto, sans-serif;
        display: flex;
        flex-direction: column;
        padding: 15px;
        position: relative;
        overflow: hidden;
    }

    .header {
        border-bottom: 2px solid #d32f2f;
        padding-bottom: 8px;
        margin-bottom: 12px;
    }

    .gym-name {
        color: #d32f2f;
        font-size: 16px;
        font-weight: bold;
        text-transform: uppercase;
    }

    .info-container {
        flex-grow: 1;
    }

    .data-row {
        font-size: 12px;
        margin-bottom: 6px;
        color: #333;
    }

    .label {
        font-weight: bold;
        color: #777;
        font-size: 10px;
        display: block;
        text-transform: uppercase;
    }

    .qr-section {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        margin-top: auto;
        padding-top: 10px;
        border-top: 1px dashed #ccc;
    }

    .qr-img {
        width: 3.5cm; /* Ajustamos el tamaño del QR */
        height: 3.5cm;
    }

    .footer {
        font-size: 9px;
        color: #004d40;
        font-weight: bold;
        margin-top: 5px;
    }
    </style>

    <div class="carnet">
        <div class="header">
            <div class="gym-name">${datos.gymName}</div>
        </div>
        
        <div class="info-container">
            <div class="data-row"><span class="label">Socio:</span> ${datos.userName}</div>
            <div class="data-row"><span class="label">Cédula:</span> ${datos.cedula}</div>
            <div class="data-row"><span class="label">Teléfono:</span> ${datos.phone}</div>
            <div class="data-row"><span class="label">Plan:</span> ${datos.planName}</div>
        </div>

        <div class="qr-section">
            <img src="${qrBase64}" class="qr-img">
            <div class="footer">Socio FitLog</div>
        </div>
    </div>
    `;

    // 3. Opciones de generación
    const file = { content: htmlContent };
    const options = { 
        width: '6.7cm', 
        height: '9.8cm', 
        printBackground: true,
        margin: { top: 0, right: 0, bottom: 0, left: 0 },
        args: ['--no-sandbox', '--disable-setuid-sandbox'] // Importante para que corra en tu VPS
    };

    // 4. Generar PDF
    return await html_pdf.generatePdf(file, options);
}