import axios from 'axios';
import * as cheerio from 'cheerio';
import https from 'https';

export interface BcvRates {
  usd: number;
  eur: number;
  updatedAt: string;
}

export const getBcvRate = async (): Promise<BcvRates | null> => {
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
    const rawUsd = $('#dolar strong').text().trim();
    const rawEuro = $('#euro strong').text().trim();

    if (!rawUsd || !rawEuro) throw new Error("No se pudo encontrar el valor en el HTML");

    // Limpiamos la string: cambiamos coma por punto y convertimos a número
    const usd = parseFloat(rawUsd.replace(/\./g, '').replace(',', '.'));
    const eur = parseFloat(rawEuro.replace(/\./g, '').replace(',', '.'));

    return {
      usd,
      eur,
      updatedAt: new Date().toISOString()
    };
  } catch (error) {
    console.error('Error haciendo scraping al BCV:', (error as Error).message);
    return null;
  }
};

export const getCopTrm = async (): Promise<number | null> => {
  try {
    const response = await axios.get('https://www.datos.gov.co/resource/32sa-8pi3.json', {
      params: {
        '$order': 'vigenciahasta DESC',
        '$limit': 1
      },
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'Mozilla/5.0'
      },
      timeout: 8000
    });

    if (response.data && response.data.length > 0) {
      // "valor" viene como String ej: "4050.50"
      return parseFloat(response.data[0].valor);
    }

    return null;
  } catch (error) {
    console.error('Error obteniendo la TRM de Colombia:', (error as Error).message);
    return null;
  }
};