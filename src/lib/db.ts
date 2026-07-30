import { neon } from '@neondatabase/serverless';

export interface Article {
  id: string;
  url?: string;
  title: string;
  description: string;
  coverImage: string;
  images?: string[];
  markdown: string;
  rawContent: string;
  
  status?: string;
  source_metadata?: string | null;
  published_at?: string | null;
  modified_at?: string | null;
  extracted_at?: string | null;
  deleted_at?: string | null;
  recycled_at?: string | null;
  recycle_count?: number;
}

export interface DB {
  articles: Article[];
}

export function getSql() {
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL is not set');
  }
  return neon(process.env.DATABASE_URL);
}

export async function getDb(): Promise<DB> {
  try {
    const sql = getSql();
    // Busca apenas artigos ativos ordenados por data de reciclagem ou extração
    const articles = await sql`
      SELECT * FROM articles 
      WHERE status = 'active'
      ORDER BY COALESCE(recycled_at, extracted_at) DESC
    `;
    return { articles: articles as Article[] };
  } catch (error) {
    console.error("Erro ao ler do banco Neon:", error);
    return { articles: [] };
  }
}

export async function getArticleById(id: string): Promise<Article | null> {
  try {
    const sql = getSql();
    const result = await sql`SELECT * FROM articles WHERE id = ${id}`;
    if (result.length > 0) return result[0] as Article;
    return null;
  } catch(error) {
    console.error("Erro ao buscar artigo por id:", error);
    return null;
  }
}

export async function insertArticle(article: Article): Promise<void> {
  const sql = getSql();
  const metaObj = article.source_metadata ? JSON.parse(article.source_metadata) : null;
  
  await sql`
    INSERT INTO articles (
      id, url, title, description, "coverImage", images, markdown, "rawContent", 
      status, source_metadata, published_at, modified_at, extracted_at
    )
    VALUES (
      ${article.id}, ${article.url || ""}, ${article.title}, ${article.description}, 
      ${article.coverImage}, ${JSON.stringify(article.images || [])}, ${article.markdown}, ${article.rawContent}, 
      'active', ${metaObj ? JSON.stringify(metaObj) : null}, ${article.published_at || null}, ${article.modified_at || null}, NOW()
    )
  `;
}

export async function deleteArticle(id: string): Promise<boolean> {
  try {
    const sql = getSql();
    await sql`
      UPDATE articles 
      SET status = 'deleted', deleted_at = NOW() 
      WHERE id = ${id}
    `;
    return true;
  } catch (error) {
    console.error("Erro ao deletar artigo:", error);
    return false;
  }
}

export async function logError(url: string, context: string, errorMessage: string, rawResponse: string = ""): Promise<void> {
  try {
    const sql = getSql();
    await sql`
      INSERT INTO error_logs ("url", "context", "errorMessage", "rawResponse")
      VALUES (${url}, ${context}, ${errorMessage}, ${rawResponse})
    `;
  } catch (err) {
    console.error("Falha ao gravar log de erro no banco:", err);
  }
}
