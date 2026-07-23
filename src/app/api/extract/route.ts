import { NextResponse } from 'next/server';
import dns from 'dns';
dns.setDefaultResultOrder('ipv4first');
import * as cheerio from 'cheerio';
import { neon } from '@neondatabase/serverless';
import { getDb, insertArticle } from '@/lib/db';
import crypto from 'crypto';
import { put } from '@vercel/blob';

async function downloadImage(url: string, prefix: string): Promise<string> {
  if (!url) return "";
  if (url.startsWith('//')) url = 'http:' + url;
  
  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Referer': 'https://www.xiaohongshu.com/'
      }
    });
    if (!res.ok) return "";
    
    const buffer = await res.arrayBuffer();
    
    const ext = url.includes('webp') ? '.webp' : '.jpg';
    const filename = `jornal-tech/${prefix}_${crypto.randomBytes(4).toString('hex')}${ext}`;
    
    const blob = await put(filename, Buffer.from(buffer), {
      access: 'public',
    });
    
    return blob.url;
  } catch (e) {
    console.error("Error uploading image to Vercel Blob:", e);
    return "";
  }
}

export async function POST(req: Request) {
  try {
    const { url } = await req.json();

    if (!url) {
      return NextResponse.json({ error: 'URL é obrigatória' }, { status: 400 });
    }

    if (process.env.ROOM_DATABASE_URL) {
      try {
        const roomSql = neon(process.env.ROOM_DATABASE_URL);
        const statusRes = await roomSql`SELECT is_running FROM system_status LIMIT 1`;
        if (statusRes.length > 0 && statusRes[0].is_running) {
          return NextResponse.json({ 
            error: 'O processamento em lote do Room está em execução. O banco está bloqueado temporariamente para segurança.' 
          }, { status: 423 });
        }
      } catch (err) {
        console.warn("Tabela system_status no room_db não encontrada ou falha na conexão. Ignorando a trava.", err);
      }
    }

    const db = await getDb();
    const existingArticle = db.articles.find(a => a.url === url);
    if (existingArticle) {
      return NextResponse.json({ 
        error: 'Oops! Esta matéria já foi extraída e cadastrada no sistema.',
        existingId: existingArticle.id 
      }, { status: 409 });
    }

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    });

    if (!response.ok) {
      return NextResponse.json({ error: 'Falha ao acessar a URL' }, { status: response.status });
    }

    const html = await response.text();
    const stateMatch = html.match(/window\.__INITIAL_STATE__=({.*?})<\/script>/);
    let title = "";
    let desc = "";
    let coverImage = "";
    let images: string[] = [];
    const id = Date.now().toString();

    if (stateMatch) {
      let stateStr = stateMatch[1];
      stateStr = stateStr.replace(/undefined/g, 'null');
      try {
        const state = JSON.parse(stateStr);
        const noteId = state?.note?.firstNoteId;
        if (noteId) {
          const noteDetail = state.note.noteDetailMap[noteId]?.note;
          title = noteDetail?.title || "";
          desc = noteDetail?.desc || "";
          const type = noteDetail?.type;

          if (noteDetail?.imageList && noteDetail.imageList.length > 0) {
            if (type === 'video') {
              // Video: Download só a primeira imagem em alta resolução
              let rawUrl = noteDetail.imageList[0]?.urlDefault || "";
              if (rawUrl) {
                const localPath = await downloadImage(rawUrl, id);
                if (localPath) images.push(localPath);
              }
            } else {
              // Normal (Imagens): Baixar TODAS as imagens
              for (const img of noteDetail.imageList) {
                let rawUrl = img.urlOriginal || img.urlDefault || "";
                if (rawUrl) {
                  const localPath = await downloadImage(rawUrl, id);
                  if (localPath) images.push(localPath);
                }
              }
            }
          }
          if (images.length > 0) {
            coverImage = images[0];
          }
        }
      } catch (e) {
        console.error("Erro ao fazer parse do estado inicial:", e);
      }
    }

    if (!title && !desc) {
      const $ = cheerio.load(html);
      title = $('title').text() || $('h1').first().text();
      desc = $('meta[name="description"]').attr('content') || $('p').first().text();
    }

    const rawContent = `Title: ${title}\n\nDescription: ${desc}`;
    const apiKey = process.env.OPENROUTER_API_KEY;

    if (!apiKey) {
      return NextResponse.json({ 
        title, 
        coverImage, 
        markdown: `# ${title}\n\n${desc}\n\n*(Nota: Chave do OpenRouter não configurada. Conteúdo bruto exibido.)*`,
        rawContent
      });
    }

    let finalMarkdown = "";
    const OPENROUTER_MODELS = [
      "google/gemma-4-26b-a4b-it:free",
      "poolside/laguna-xs-2.1:free",
      "openai/gpt-oss-20b:free",
      "openrouter/free"
    ];

    for (const model of OPENROUTER_MODELS) {
      try {
        const aiResponse = await fetch("https://openrouter.ai/api/v1/chat/completions", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${apiKey}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            model: model,
            messages: [
              {
                role: "system",
                content: "Você é um Jornalista Tech experiente. Seu objetivo é pegar transcrições, títulos e descrições crus e transformá-los em um artigo jornalístico dinâmico usando Markdown puro. REGRAS OBRIGATÓRIAS:\n1. Escreva a matéria INTEIRAMENTE em Português do Brasil (PT-BR).\n2. NUNCA traduza nomes de projetos, tecnologias, ou marcas (ex: 'OpenCut', 'hallmark', 'GitHub'). Mantenha o nome original e adicione explicações de contexto se necessário.\n3. NÃO use espaços de indentação no início das linhas.\n4. Inclua pelo menos 2 diagramas `mermaid` (ex: flowchart, mindmap, sequenceDiagram) no meio do texto para ilustrar os conceitos abordados."
              },
              {
                role: "user",
                content: `Baseado no seguinte conteúdo, crie a matéria jornalística formatada em Markdown.\n\nTítulo Original: ${title}\nDescrição: ${desc}\n\nConteúdo Bruto:\n${rawContent}`
              }
            ]
          }),
        });

        if (aiResponse.ok) {
          const aiData = await aiResponse.json();
          if (aiData.choices && aiData.choices.length > 0) {
            finalMarkdown = aiData.choices[0].message.content;
            console.log(`Sucesso com o modelo: ${model}`);
            break;
          }
        } else {
          console.error(`Erro com o modelo ${model}: ${aiResponse.status}`);
        }
      } catch (error) {
        console.error(`Falha ao tentar o modelo ${model}:`, error);
      }
    }

    if (!finalMarkdown) {
       finalMarkdown = `# ${title}\n\n${desc}\n\n*(Nota: Todos os modelos de IA falharam. Conteúdo bruto exibido.)*`;
    }

    let generatedTitle = title;
    let generatedDesc = desc;

    const lines = finalMarkdown.split('\n').map(l => l.trim()).filter(l => l.length > 0);
    const titleLine = lines.find(l => l.startsWith('# '));
    if (titleLine) {
      generatedTitle = titleLine.replace(/^#\s*/, '').replace(/\*\*/g, '');
    }

    const descLine = lines.find(l => l.length > 30 && !l.startsWith('#') && !l.startsWith('!') && !l.startsWith('-') && !l.startsWith('>'));
    if (descLine) {
      generatedDesc = descLine.slice(0, 160) + (descLine.length > 160 ? '...' : '');
    }

    const newArticle = {
      id,
      url, 
      title: generatedTitle,
      description: generatedDesc,
      coverImage,
      images,
      markdown: finalMarkdown,
      rawContent,
      createdAt: new Date().toISOString()
    };

    await insertArticle(newArticle);

    return NextResponse.json({ success: true, id });
  } catch (error: any) {
    console.error('Erro geral na rota de extração:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}