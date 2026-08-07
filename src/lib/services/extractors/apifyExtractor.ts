import { ExtractionResult, defaultExtractionResult } from './types';
import { downloadImage } from '../utils';

export async function extractWithApify(url: string, id: string): Promise<ExtractionResult> {
  const result: ExtractionResult = { ...defaultExtractionResult };
  
  const apifyToken = process.env.APIFY_API_TOKEN;
  if (!apifyToken) {
     console.warn("Chave do Apify ausente nas variáveis de ambiente!");
     result.isBlocked = true;
     return result;
  }
  
  try {
    const apifyUrl = `https://api.apify.com/v2/acts/svGBZz6n79YbeA3uS/run-sync-get-dataset-items?token=${apifyToken}`;
    const apifyRes = await fetch(apifyUrl, {
       method: 'POST',
       headers: { 'Content-Type': 'application/json' },
       body: JSON.stringify({ startUrls: [{ url }] }),
       signal: AbortSignal.timeout(25000)
    });

    if (apifyRes.ok) {
       const dataset = await apifyRes.json();
       const postData = dataset[0];
       
       if (postData && postData.title) {
           result.title = postData.title;
           result.desc = postData.desc || postData.content || "";
           
           if (postData.imageList && postData.imageList.length > 0) {
               for (const img of postData.imageList) {
                   const imgUrl = img.url || img.urlDefault || img;
                   if (typeof imgUrl === 'string') {
                       const localPath = await downloadImage(imgUrl, id);
                       if (localPath) result.images.push(localPath);
                   }
               }
               if (result.images.length > 0) result.coverImage = result.images[0];
           }
           result.success = true;
       } else if (dataset && dataset.length === 0) {
           console.warn("Apify retornou array vazio. Postagem protegida exigindo cookie.");
           // Apify retornou array vazio = Gated Content
           // Para não quebrar o padrão funcional e lançar o status 403 direto lá da rota, 
           // podemos jogar uma Exception customizada.
           throw new Error("GATED_CONTENT");
       } else {
           result.isBlocked = true;
       }
    } else {
       console.warn("Apify falhou com status:", apifyRes.status);
       result.isBlocked = true;
    }
  } catch (e: any) {
    if (e.message === "GATED_CONTENT") throw e;
    console.warn("Erro no Apify:", e.message);
    result.isBlocked = true;
  }

  return result;
}
