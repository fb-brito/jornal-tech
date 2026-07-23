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
  createdAt: string;
}

export interface DB {
  articles: Article[];
}

function getSql() {
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL is not set');
  }
  return neon(process.env.DATABASE_URL);
}

export async function getDb(): Promise<DB> {
  try {
    const sql = getSql();
    const articles = await sql`SELECT * FROM articles ORDER BY "createdAt" DESC`;
    return { articles: articles as Article[] };
  } catch (error) {
    console.error("Erro ao ler do banco Neon:", error);
    return { articles: [] };
  }
}

export async function insertArticle(article: Article): Promise<void> {
  const sql = getSql();
  await sql`
    INSERT INTO articles (id, url, title, description, "coverImage", images, markdown, "rawContent", "createdAt")
    VALUES (${article.id}, ${article.url || ""}, ${article.title}, ${article.description}, ${article.coverImage}, ${JSON.stringify(article.images || [])}, ${article.markdown}, ${article.rawContent}, ${article.createdAt})
  `;
}

