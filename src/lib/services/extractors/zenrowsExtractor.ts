import { ExtractionResult, defaultExtractionResult } from './types';
import { parseHtml, checkStatus } from './nativeExtractor';

export async function extractWithZenRows(url: string, id: string): Promise<ExtractionResult> {
  const result: ExtractionResult = { ...defaultExtractionResult };
  
  const zenrowsKey = process.env.ZENROWS_API_KEY;
  if (!zenrowsKey) {
     console.warn("Chave do ZenRows ausente nas variáveis de ambiente!");
     result.isBlocked = true; // Mantém como bloqueado
     return result;
  }
  
  try {
    const fetchUrl = `https://api.zenrows.com/v1/?apikey=${zenrowsKey}&url=${encodeURIComponent(url)}&premium_proxy=true`;
    const zrResponse = await fetch(fetchUrl);
    if (zrResponse.ok) {
      const html = await zrResponse.text();
      await parseHtml(html, id, result);
      checkStatus(html, result);
    } else {
      console.warn("ZenRows respondeu com status:", zrResponse.status);
      result.isBlocked = true;
    }
  } catch (e: any) {
    console.warn("ZenRows falhou:", e.message);
    result.isBlocked = true;
  }

  return result;
}
