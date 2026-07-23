import { getDb } from '@/lib/db';
import ArticleContent from '@/components/ArticleContent';
import { notFound } from 'next/navigation';

export default async function NoticiaPage({ params }: { params: { id: string } }) {
  const db = await getDb();
  
  // Como `params.id` é awaitable na versão recente do Next.js App Router para dinâmicos
  const resolvedParams = await params;
  
  const article = db.articles.find(a => a.id === resolvedParams.id);

  if (!article) {
    notFound();
  }

  return (
    <main>
      <ArticleContent article={article} />
    </main>
  );
}
