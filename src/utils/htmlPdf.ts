import QRCode from 'qrcode';
// @ts-ignore
import * as html_pdf from 'html-pdf-node';

export async function generarCarnetBuffer(datos: {gymName: string, userName: string, cedula: string, phone: string, planName: string, idMembresia: number}): Promise<Buffer> {
    
    // 1. URL de validación para el QR
    const frontendUrl = `https://frontend-gym-topaz.vercel.app`
    const urlVerificacion = `${frontendUrl}/verify/${datos.idMembresia}`.trim();
    const qrBase64 = await QRCode.toDataURL(urlVerificacion, {
        errorCorrectionLevel: 'H', // 'M' o 'H' ayuda a que el lector identifique mejor el contenido
        margin: 4,
        scale: 6, // Un poco más de escala mejora la definición de los puntos
        color: {
            dark: '#000000',
            light: '#ffffff'
        }
    });

    // 2. HTML del Carnet (Inline para rapidez, puedes usar un template aparte)
    const htmlContent = `
    <style>
    /* Configuración de página para PDF */
    @page { margin: 0; size: 6.7cm 9.8cm; }
    body { margin: 0; padding: 0; background-color: #f0f0f0; -webkit-print-color-adjust: exact; }

    .carnet {
        width: 6.7cm;
        height: 9.8cm;
        background: #1e252d; 
        box-sizing: border-box;
        font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        display: flex;
        flex-direction: column;
        position: relative;
        overflow: hidden; /* Evita que cualquier elemento sobresalga */
    }

    /* Franja superior verde */
    .header {
        background-color: #009689; 
        padding: 0 15px; /* Reducido padding vertical */
        display: flex;
        justify-content: space-between;
        align-items: center;
        height: 1.6cm; /* Reducido de 1.8cm para ganar espacio */
        box-sizing: border-box;
        width: 100%;
    }

    .gym-name {
        color: #0c1117;
        font-size: 16px; /* Ajustado ligeramente */
        font-weight: 900;
        text-transform: uppercase;
        letter-spacing: 0.5px;
    }

    .fitlog-badge {
        background-color: #0c1117;
        color: #009689;
        font-size: 8px;
        font-weight: bold;
        padding: 3px 8px;
        border-radius: 10px;
        text-transform: uppercase;
    }

    /* Contenedor principal de info */
    .content {
        padding: 10px 15px; /* Reducido el primer valor (top) de 20px a 10px */
        display: flex;
        flex-direction: row; 
        justify-content: space-between;
        align-items: center; /* Centra verticalmente el contenido */
        flex-grow: 1;
        width: 100%;
        box-sizing: border-box; /* Crucial para que el padding no sume al ancho */
    }

    .info-section {
        flex: 1;
        display: flex;
        flex-direction: column;
        justify-content: center;
        max-width: 60%; /* Evita que el texto empuje al QR */
    }

    .data-group {
        margin-bottom: 8px; /* Reducido de 12px para compactar */
    }

    .label {
        color: #009689; 
        font-size: 8px;
        font-weight: 800;
        text-transform: uppercase;
        margin-bottom: 1px;
        display: block;
    }

    .value {
        color: #ffffff;
        font-size: 12px;
        font-weight: 700;
        word-break: break-all; /* Por si la cédula o nombre es muy largo */
    }

    .value-name {
        font-size: 15px;
        margin-bottom: 5px;
        line-height: 1.1;
    }

    /* Sección del QR */
    .qr-container {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 40%;
    }

    .qr-box {
        background: #ffffff;
        padding: 5px;
        border-radius: 6px;
    }

    .qr-img {
        width: 2.2cm; /* Ajustado ligeramente para que no apriete los bordes */
        height: 2.2cm;
        display: block;
    }

</style>

<div class="carnet">
    <div class="header">
        <div class="gym-name">${datos.gymName}</div>
        <div class="fitlog-badge">FitLog</div>
    </div>
    
    <div class="content">
        <div class="info-section">
            <div class="data-group">
                <span class="label">Nombre del Cliente</span>
                <div class="value value-name">${datos.userName}</div>
            </div>

            <div class="data-group">
                <span class="label">Cédula / ID</span>
                <div class="value">${datos.cedula}</div>
            </div>

            <div class="data-group">
                <span class="label">Teléfono</span>
                <div class="value">${datos.phone}</div>
            </div>

            <div class="data-group">
                <span class="label">Plan</span>
                <div class="value" style="color: #009689;">${datos.planName}</div>
            </div>
        </div>

        <div class="qr-container">
            <div class="qr-box">
                <img src="${qrBase64}" class="qr-img">
            </div>
        </div>
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