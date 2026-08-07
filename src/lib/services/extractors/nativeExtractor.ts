import * as cheerio from 'cheerio';
import { ExtractionResult, defaultExtractionResult } from './types';
import { downloadImage } from '../utils';

export async function extractWithNative(url: string, id: string): Promise<ExtractionResult> {
  const result: ExtractionResult = { ...defaultExtractionResult };
  let html = "";

  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
        'Accept-Language': 'pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7',
      }
    });
    if (response.ok) {
      html = await response.text();
    }
  } catch (e) {
    console.warn("Fetch nativo falhou:", e);
  }

  if (html) {
    await parseHtml(html, id, result);
    checkStatus(html, result);
  } else {
    result.isBlocked = true;
  }

  return result;
}

export async function parseHtml(html: string, id: string, result: ExtractionResult) {
  const stateMatch = html.match(/window\.__INITIAL_STATE__=({.*?})<\/script>/);
  if (stateMatch) {
    const stateStr = stateMatch[1].replace(/undefined/g, 'null');
    try {
      const state = JSON.parse(stateStr);
      const noteId = state?.note?.firstNoteId;
      if (noteId) {
        const noteDetail = state.note.noteDetailMap[noteId]?.note;
        if (noteDetail) {
          result.title = noteDetail.title || "";
          result.desc = noteDetail.desc || "";
          if (noteDetail.time) result.published_at = new Date(noteDetail.time).toISOString();
          if (noteDetail.lastUpdateTime) result.modified_at = new Date(noteDetail.lastUpdateTime).toISOString();
          result.source_metadata = JSON.stringify(noteDetail);

          if (noteDetail.imageList && noteDetail.imageList.length > 0) {
            const type = noteDetail.type;
            if (type === 'video') {
              const rawUrl = noteDetail.imageList[0]?.urlDefault || "";
              if (rawUrl) {
                const localPath = await downloadImage(rawUrl, id);
                if (localPath) result.images.push(localPath);
              }
            } else {
              for (const img of noteDetail.imageList) {
                const rawUrl = img.urlOriginal || img.urlDefault || "";
                if (rawUrl) {
                  const localPath = await downloadImage(rawUrl, id);
                  if (localPath) result.images.push(localPath);
                }
              }
            }
          }
          if (result.images.length > 0) result.coverImage = result.images[0];
          result.success = true;
        }
      }
    } catch (e: any) {
      console.error("Erro parse state:", e);
    }
  }
  
  if (!result.title && !result.desc) {
    const $ = cheerio.load(html);
    result.title = $('title').text() || $('h1').first().text();
    result.desc = $('meta[name="description"]').attr('content') || $('p').first().text();
    if (result.title || result.desc) result.success = true;
  }
}

export function checkStatus(html: string | null, result: ExtractionResult) {
  const t = result.title || "";
  const d = result.desc || "";

  if (t && (t.includes('你访问的页面不见了') || t.includes('页面不见了'))) {
    result.is404 = true;
    result.success = false;
  } else if (!html || (t && (t.includes('小红书') || t.includes('Xiaohongshu') || t.includes('安全限制')) && !d && !result.is404)) {
    result.isBlocked = true;
    result.success = false;
  }
}
