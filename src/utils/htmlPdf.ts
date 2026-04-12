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
        background: #1e252d; /* Fondo oscuro de la imagen */
        box-sizing: border-box;
        font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        display: flex;
        flex-direction: column;
        position: relative;
        overflow: hidden;
    }

    /* Franja superior verde */
    .header {
        background-color: #48bb78; /* Verde esmeralda */
        padding: 15px;
        display: flex;
        justify-content: space-between;
        align-items: center;
        height: 1.8cm;
        box-sizing: border-box;
    }

    .gym-name {
        color: #0c1117;
        font-size: 18px;
        font-weight: 900;
        text-transform: uppercase;
        letter-spacing: 1px;
    }

    .fitlog-badge {
        background-color: #0c1117;
        color: #48bb78;
        font-size: 9px;
        font-weight: bold;
        padding: 4px 10px;
        border-radius: 12px;
        text-transform: uppercase;
        letter-spacing: 1px;
    }

    /* Contenedor principal de info */
    .content {
        padding: 20px 15px;
        display: flex;
        flex-direction: row; /* Para poner info a la izquierda y QR a la derecha */
        justify-content: space-between;
        flex-grow: 1;
    }

    .info-section {
        flex: 1;
        display: flex;
        flex-direction: column;
        justify-content: center;
    }

    .data-group {
        margin-bottom: 12px;
    }

    .label {
        color: #48bb78; /* Etiquetas en verde */
        font-size: 9px;
        font-weight: 800;
        text-transform: uppercase;
        margin-bottom: 2px;
        display: block;
        letter-spacing: 0.5px;
    }

    .value {
        color: #ffffff;
        font-size: 13px;
        font-weight: 700;
        word-break: break-word;
    }

    .value-name {
        font-size: 16px;
        margin-bottom: 10px;
    }

    /* Sección del QR */
    .qr-container {
        display: flex;
        align-items: center;
        justify-content: center;
        margin-left: 10px;
    }

    .qr-box {
        background: #ffffff;
        padding: 6px;
        border-radius: 8px;
        display: flex;
        align-items: center;
        justify-content: center;
    }

    .qr-img {
        width: 2.4cm;
        height: 2.4cm;
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

                <div class="data-group" style="display: flex; gap: 15px;">
                    <div>
                        <span class="label">Teléfono</span>
                        <div class="value" style="font-size: 11px;">${datos.phone}</div>
                    </div>
                    <div>
                        <span class="label">Plan</span>
                        <div class="value" style="color: #48bb78; font-size: 11px;">${datos.planName}</div>
                    </div>
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