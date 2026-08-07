import { NextResponse } from 'next/server';
import dns from 'dns';
dns.setDefaultResultOrder('ipv4first');
import { neon } from '@neondatabase/serverless';
import { getSql, insertArticle, logError } from '@/lib/db';
import { orchestrateExtraction } from '@/lib/services/extractionOrchestrator';
import { processAiMarkdown } from '@/lib/services/aiService';

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

    // ----------------------------------------------------
    // ORQUESTRAÇÃO DE EXTRAÇÃO (NATIVE -> ZENROWS -> APIFY)
    // ----------------------------------------------------
    let extraction;
    try {
      extraction = await orchestrateExtraction(url, id);
    } catch (error: any) {
      if (error.message === "GATED_CONTENT") {
        return NextResponse.json({ 
          error: 'Postagem App-Only protegida pelo Xiaohongshu. Para extrair, você precisa fornecer o link longo gerado no navegador contendo o "?xsec_token=".' 
        }, { status: 403 });
      }
      throw error;
    }

    // Validação de Erros Finais
    if (extraction.is404) {
      return NextResponse.json({ error: 'Matéria não encontrada. O link é inválido ou a postagem foi permanentemente deletada no Xiaohongshu.' }, { status: 404 });
    }
    if (extraction.isBlocked) {
      return NextResponse.json({ error: 'Acesso bloqueado permanentemente (Anti-Bot). Todos os fallbacks falharam.' }, { status: 403 });
    }

    // ----------------------------------------------------
    // PROCESSAMENTO IA (MARKDOWN) E SALVAMENTO
    // ----------------------------------------------------
    const aiResult = await processAiMarkdown(url, extraction.title, extraction.desc);

    const newArticle = {
      id,
      url,
      title: aiResult.generatedTitle,
      description: aiResult.generatedDesc,
      coverImage: extraction.coverImage,
      images: extraction.images,
      markdown: aiResult.finalMarkdown,
      rawContent: aiResult.rawContent,
      status: 'active',
      source_metadata: extraction.source_metadata,
      published_at: extraction.published_at,
      modified_at: extraction.modified_at
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