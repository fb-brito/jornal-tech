import { ExtractionResult, defaultExtractionResult } from './extractors/types';
import { extractWithNative } from './extractors/nativeExtractor';
import { extractWithZenRows } from './extractors/zenrowsExtractor';
import { extractWithApify } from './extractors/apifyExtractor';

export async function orchestrateExtraction(url: string, id: string): Promise<ExtractionResult> {
  // 1. TENTATIVA NATIVA
  let result = await extractWithNative(url, id);

  // 2. TENTATIVA ZENROWS (Apenas para bloqueios Web, pula se for 404)
  if (result.isBlocked && !result.is404) {
    console.log("Acesso nativo bloqueado. Iniciando fallback ZenRows...");
    result = await extractWithZenRows(url, id);
  }

  // 3. TENTATIVA APIFY (APP Scraper para contornar "App-Only" ou falha total)
  if (result.isBlocked || result.is404) {
    console.log("Acionando Fallback Final: Apify Actor...");
    result = await extractWithApify(url, id);
  }

  return result;
}
