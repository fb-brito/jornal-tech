import { NextResponse } from 'next/server';
import dns from 'dns';
dns.setDefaultResultOrder('ipv4first');
import * as cheerio from 'cheerio';
import { neon } from '@neondatabase/serverless';
import { getSql, insertArticle, logError } from '@/lib/db';
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

export async function POST(req: Request) {
  let requestUrl = "";
  try {
    const { url } = await req.json();
    requestUrl = url;

    if (!url) {
      return NextResponse.json({ error: 'URL é obrigatória' }, { status: 400 });
    }

    // EXTRAÇÃO DA CHAVE NATURAL (ID) DA URL
    let id = Date.now().toString();
    const match = url.match(/\/o\/([a-zA-Z0-9_-]+)/);
    if (match && match[1]) {
      id = match[1];
    } else {
      try {
        const parts = new URL(url).pathname.split('/').filter(Boolean);
        const lastPart = parts[parts.length - 1];
        if (lastPart && lastPart.length > 5) {
          id = lastPart;
        }
      } catch (e) { }
    }

    // TRAVA DO ROOM
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

    // VERIFICAÇÃO DE DUPLICATA E RECICLAGEM
    const sql = getSql();
    try {
      const existing = await sql`SELECT status FROM articles WHERE id = ${id}`;
      if (existing.length > 0) {
        if (existing[0].status === 'deleted') {
          await sql`
             UPDATE articles 
             SET status = 'active', recycled_at = NOW(), recycle_count = recycle_count + 1 
             WHERE id = ${id}
           `;
          return NextResponse.json({ success: true, id, recycled: true, message: 'Matéria recuperada da lixeira com sucesso!' });
        } else {
          return NextResponse.json({
            error: 'Oops! Esta matéria já foi extraída e cadastrada no sistema.',
            existingId: id
          }, { status: 409 });
        }
      }
    } catch (dbErr) {
      console.error("Falha ao consultar banco. Continuando fluxo de inserção otimista...", dbErr);
    }

    let html = "";
    let title = "";
    let desc = "";
    let coverImage = "";
    let images: string[] = [];
    let published_at: string | null = null;
    let modified_at: string | null = null;
    let source_metadata: string | null = null;

    // TENTATIVA 1: FETCH NATIVO
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

    // Função auxiliar para tentar extrair dados do HTML
    const tryExtract = async (sourceHtml: string) => {
      let t = "", d = "";
      const stateMatch = sourceHtml.match(/window\.__INITIAL_STATE__=({.*?})<\/script>/);
      if (stateMatch) {
        let stateStr = stateMatch[1].replace(/undefined/g, 'null');
        try {
          const state = JSON.parse(stateStr);
          const noteId = state?.note?.firstNoteId;
          if (noteId) {
            const noteDetail = state.note.noteDetailMap[noteId]?.note;
            if (noteDetail) {
              t = noteDetail.title || "";
              d = noteDetail.desc || "";
              if (noteDetail.time) published_at = new Date(noteDetail.time).toISOString();
              if (noteDetail.lastUpdateTime) modified_at = new Date(noteDetail.lastUpdateTime).toISOString();
              source_metadata = JSON.stringify(noteDetail);

              if (noteDetail.imageList && noteDetail.imageList.length > 0) {
                const type = noteDetail.type;
                if (type === 'video') {
                  let rawUrl = noteDetail.imageList[0]?.urlDefault || "";
                  if (rawUrl) {
                    const localPath = await downloadImage(rawUrl, id);
                    if (localPath) images.push(localPath);
                  }
                } else {
                  for (const img of noteDetail.imageList) {
                    let rawUrl = img.urlOriginal || img.urlDefault || "";
                    if (rawUrl) {
                      const localPath = await downloadImage(rawUrl, id);
                      if (localPath) images.push(localPath);
                    }
                  }
                }
              }
              if (images.length > 0) coverImage = images[0];
            }
          }
        } catch (e: any) {
          console.error("Erro parse state:", e);
        }
      }
      if (!t && !d) {
        const $ = cheerio.load(sourceHtml);
        t = $('title').text() || $('h1').first().text();
        d = $('meta[name="description"]').attr('content') || $('p').first().text();
      }
      return { t, d };
    };

    if (html) {
      const res = await tryExtract(html);
      title = res.t;
      desc = res.d;
    }

    // CHECAGEM DE BLOQUEIO (Anti-Bot)
    let isBlocked = false;
    if (!html || (title && (title.includes('小红书') || title.includes('Xiaohongshu') || title.includes('安全限制')) && !desc)) {
      isBlocked = true;
    }

    // TENTATIVA 2: FALLBACK ZENROWS
    if (isBlocked) {
      console.log("Acesso nativo bloqueado. Iniciando fallback ZenRows...");
      title = ""; desc = ""; images = []; coverImage = ""; published_at = null; modified_at = null; source_metadata = null;

      try {
        const zenrowsKey = process.env.ZENROWS_API_KEY || "7b8af0df96c106711cdf136cf39b1598a42436a8";
        const fetchUrl = `https://api.zenrows.com/v1/?apikey=${zenrowsKey}&url=${encodeURIComponent(url)}&premium_proxy=true`;
        const zrResponse = await fetch(fetchUrl);
        if (zrResponse.ok) {
          html = await zrResponse.text();
          const res = await tryExtract(html);
          title = res.t;
          desc = res.d;
        } else {
          await logError(url, "ZenRows Status", `HTTP ${zrResponse.status}`);
          return NextResponse.json({ error: 'Acesso bloqueado pela rede social (Anti-Bot) e Fallback falhou.' }, { status: 403 });
        }
      } catch (e: any) {
        await logError(url, "ZenRows Exception", e.message);
        return NextResponse.json({ error: 'Erro no fallback de extração.' }, { status: 500 });
      }

      // Checa bloqueio novamente após fallback
      if (title && (title.includes('小红书') || title.includes('Xiaohongshu') || title.includes('安全限制')) && !desc) {
        return NextResponse.json({ error: 'Acesso bloqueado permanentemente (Anti-Bot), mesmo com Fallback.' }, { status: 403 });
      }
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
                content: "Você é um Tradutor e Formatador Estrito. Seu objetivo é pegar o título e a descrição originais e transformá-los em um artigo formatado em Markdown. REGRAS OBRIGATÓRIAS:\n1. Escreva INTEIRAMENTE em Português do Brasil (PT-BR).\n2. O título que você gerar (linha que começa com #) DEVE ser a tradução fiel do título original, adaptado para o português fluído, sem inventar contexto extra.\n3. NUNCA converse com o usuário. NÃO inclua meta-comentários como 'Aqui está a matéria', 'Como você forneceu um texto curto', etc. Retorne EXCLUSIVAMENTE o conteúdo em Markdown.\n4. Se o texto original for extremamente curto, crie uma matéria curta e direta. NUNCA invente informações não presentes no texto original (ex: não comece a explicar o que é a rede social ou o histórico da empresa se isso não foi fornecido).\n5. NUNCA traduza nomes de projetos, tecnologias, ou marcas (ex: 'OpenCut', 'hallmark', 'GitHub').\n6. Inclua 1 diagrama `mermaid` APENAS se o contexto permitir ilustrar um processo. Se o texto for apenas uma frase de humor ou observação curta, NÃO insira diagrama."
              },
              {
                role: "user",
                content: `Traduza e formate o seguinte conteúdo estritamente para Markdown.\n\nTítulo Original: ${title}\nDescrição Original: ${desc}`
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
          const errTxt = await aiResponse.text();
          await logError(url, `AI Fetch Status (${model})`, `HTTP ${aiResponse.status}`, errTxt);
        }
      } catch (error: any) {
        console.error(`Falha ao tentar o modelo ${model}:`, error);
        await logError(url, `AI Fetch Exception (${model})`, error.message);
      }
    }

    if (!finalMarkdown) {
      finalMarkdown = `# ${title}\n\n${desc}\n\n*(Nota: Todos os modelos de IA falharam. Conteúdo bruto exibido.)*`;
      await logError(url, "AI Processing", "Todos os modelos do OpenRouter falharam em retornar markdown.");
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
      status: 'active',
      source_metadata,
      published_at,
      modified_at
    };

    try {
      await insertArticle(newArticle as any);
    } catch (dbError: any) {
      // Inserção otimista: se bater na trava do banco (Chave Primária duplicada em transações paralelas rápidas)
      if (dbError.message?.includes('duplicate key') || dbError.code === '23505') {
        return NextResponse.json({
          error: 'Oops! Esta matéria já foi extraída e cadastrada no sistema.',
          existingId: id
        }, { status: 409 });
      }
      throw dbError; // Repassa erro inesperado
    }

    return NextResponse.json({ success: true, id });
  } catch (error: any) {
    console.error('Erro geral na rota de extração:', error);
    await logError(requestUrl || "URL Desconhecida", "Exception Crítica Rota", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}