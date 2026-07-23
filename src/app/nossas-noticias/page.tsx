import { getDb } from '@/lib/db';
import Link from 'next/link';

export default async function NossasNoticias({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  const db = await getDb();
  
  // Como searchParams é dinâmico no App Router, fazemos o await se necessário (Next.js 15 requer)
  const params = await searchParams;
  const pageParam = typeof params.page === 'string' ? parseInt(params.page, 10) : 1;
  const currentPage = isNaN(pageParam) || pageParam < 1 ? 1 : pageParam;
  const ITEMS_PER_PAGE = 12;

  // Ordenar da mais recente para a mais antiga
  const articles = [...db.articles].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  const totalArticles = articles.length;
  const totalPages = Math.ceil(totalArticles / ITEMS_PER_PAGE) || 1;

  // Garantir que a página atual não ultrapasse o total
  const safePage = Math.min(currentPage, totalPages);
  
  const startIndex = (safePage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const currentArticles = articles.slice(startIndex, endIndex);

  return (
    <main>
      <section className="manifesto-block flex-col items-center" style={{ minHeight: '80vh' }}>
        <h1 className="font-display text-display" style={{ textTransform: 'uppercase', marginBottom: 'var(--space-2xl)' }}>
          NOSSAS <br/>
          <span className="bg-accent" style={{ padding: '0 0.2em' }}>NOTÍCIAS.</span>
        </h1>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 'var(--space-xl)', width: '100%', maxWidth: '1200px', margin: '0 auto' }}>
          {currentArticles.length > 0 ? currentArticles.map((article) => (
            <article key={article.id} className="card" style={{ display: 'flex', flexDirection: 'column', background: 'var(--color-paper)', color: 'var(--color-ink)' }}>
              {article.coverImage && (
                <div style={{ width: '100%', height: '180px', overflow: 'hidden', borderRadius: '4px', marginBottom: 'var(--space-md)' }}>
                  <img src={article.coverImage} alt={article.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
              )}
              <div className="font-label text-xs color-ink-2" style={{ marginBottom: 'var(--space-xs)' }}>
                {new Date(article.createdAt).toLocaleDateString('pt-BR')}
              </div>
              <h3 className="font-display" style={{ fontSize: '1.25rem', lineHeight: 1.3, marginBottom: 'var(--space-md)', flexGrow: 1 }}>{article.title}</h3>
              <div style={{ borderTop: '1px solid var(--color-rule)', paddingTop: 'var(--space-xs)', marginTop: 'auto' }}>
                <Link href={`/noticia/${article.id}`} className="font-label text-xs color-accent" style={{ textDecoration: 'none' }}>
                  LER COMPLETO →
                </Link>
              </div>
            </article>
          )) : (
            <div style={{ color: 'var(--color-ink-2)', gridColumn: '1 / -1', textAlign: 'center' }}>Nenhuma notícia encontrada.</div>
          )}
        </div>

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div style={{ display: 'flex', gap: 'var(--space-md)', marginTop: 'var(--space-3xl)', alignItems: 'center' }}>
            {safePage > 1 ? (
              <Link href={`/nossas-noticias?page=${safePage - 1}`} className="btn-primary" style={{ padding: 'var(--space-xs) var(--space-md)' }}>
                ← ANTERIOR
              </Link>
            ) : (
              <span className="btn-primary" style={{ padding: 'var(--space-xs) var(--space-md)', opacity: 0.5, cursor: 'not-allowed' }}>
                ← ANTERIOR
              </span>
            )}

            <span className="font-label text-sm">
              PÁGINA {safePage} DE {totalPages}
            </span>

            {safePage < totalPages ? (
              <Link href={`/nossas-noticias?page=${safePage + 1}`} className="btn-primary" style={{ padding: 'var(--space-xs) var(--space-md)' }}>
                PRÓXIMA →
              </Link>
            ) : (
              <span className="btn-primary" style={{ padding: 'var(--space-xs) var(--space-md)', opacity: 0.5, cursor: 'not-allowed' }}>
                PRÓXIMA →
              </span>
            )}
          </div>
        )}
      </section>
    </main>
  );
}
