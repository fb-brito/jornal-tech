import crypto from 'crypto';
import { put } from '@vercel/blob';
import { logError } from '@/lib/db';

export async function downloadImage(url: string, prefix: string): Promise<string> {
  if (!url) return "";
  if (url.startsWith('//')) url = 'http:' + url;

  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Referer': 'https://www.xiaohongshu.com/'
      }
    });
    if (!res.ok) {
      await logError(url, "Download Image Status", `HTTP ${res.status}`);
      return "";
    }

    const buffer = await res.arrayBuffer();
    const ext = url.includes('webp') ? '.webp' : '.jpg';
    const filename = `jornal-tech/${prefix}_${crypto.randomBytes(4).toString('hex')}${ext}`;

    const blob = await put(filename, Buffer.from(buffer), {
      access: 'public',
    });

    return blob.url;
  } catch (e: any) {
    console.error("Error uploading image to Vercel Blob:", e);
    await logError(url, "Download Image Exception", e.message);
    return "";
  }
}
