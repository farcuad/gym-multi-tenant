import axios from 'axios';
import * as cheerio from 'cheerio';
import https from 'https';

export const getBcvRate = async (): Promise<number | null> => {
  try {
    // Agente para ignorar problemas de certificado SSL del BCV si ocurren
    const agent = new https.Agent({  
      rejectUnauthorized: false 
    });

    const response = await axios.get('https://www.bcv.org.ve/', {
      httpsAgent: agent,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/122.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
        'Accept-Language': 'es-ES,es;q=0.8,en-US;q=0.5,en;q=0.3',
      },
      timeout: 10000 // 10 segundos de espera
    });

    const $ = cheerio.load(response.data);

    // El BCV pone el valor del dólar en el contenedor con ID "dolar"
    // Estructura: <div id="dolar"> ... <strong> 36,50 </strong> ... </div>
    const rawRate = $('#dolar strong').text().trim();

    if (!rawRate) throw new Error("No se pudo encontrar el valor en el HTML");

    // Limpiamos la string: cambiamos coma por punto y convertimos a número
    const cleanRate = parseFloat(rawRate.replace(',', '.'));

    return cleanRate;
  } catch (error) {
    console.error('Error haciendo scraping al BCV:', (error as Error).message);
    return null;
  }
};